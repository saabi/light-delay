import { randomUUID } from 'node:crypto';
import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import net from 'node:net';
import { Pool } from 'pg';
import { expect, test } from '@playwright/test';
import { authoringFixtureIds as ids } from '@light-delay/v2-core';
import { migrateAuthoringDatabase } from '../../../../packages/v2-core/dist/postgres-migrations.js';
import { postgresFaultProxy } from '../../../../packages/v2-core/test-support/postgres-fault-proxy';
import { el } from './studio-e2e';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL is required for PostgreSQL browser tests');
const schema = `n1_browser_${randomUUID().replaceAll('-', '')}`;
const admin = new Pool({ connectionString: url });
const db = new Pool({ connectionString: url, options: `-c search_path=${schema}` });
let proxy: Awaited<ReturnType<typeof postgresFaultProxy>>;
let server: ChildProcess;
let origin: string;
let serverLog = '';

test.beforeAll(async () => {
	await admin.query(`CREATE SCHEMA "${schema}"`);
	await migrateAuthoringDatabase(db);
	proxy = await postgresFaultProxy(url);
	const connection = new URL(proxy.url);
	connection.searchParams.set('options', `-c search_path=${schema} -c application_name=${schema}`);
	// pg accepts connection-string query_timeout; production defaults stay unchanged.
	connection.searchParams.set('query_timeout', '1500');
	const listener = net.createServer();
	await new Promise<void>((resolve) => listener.listen(0, '127.0.0.1', resolve));
	const port = (listener.address() as net.AddressInfo).port;
	await new Promise<void>((resolve) => listener.close(() => resolve()));
	origin = `http://127.0.0.1:${port}`;
	server = spawn(process.execPath, ['build/index.js'], {
		cwd: process.cwd(),
		env: {
			...process.env,
			STUDIO_AUTHORING_STORE: 'postgres',
			DATABASE_URL: connection.toString(),
			HOST: '127.0.0.1',
			PORT: String(port),
			ORIGIN: origin
		},
		stdio: ['ignore', 'pipe', 'pipe']
	});
	server.stdout?.on('data', (data) => {
		serverLog += data;
	});
	server.stderr?.on('data', (data) => {
		serverLog += data;
	});
	await expect
		.poll(
			async () => {
				try {
					return (await fetch(`${origin}/health`)).status;
				} catch {
					return 0;
				}
			},
			{ message: 'Built Studio must start', timeout: 10000 }
		)
		.toBe(200);
});
test.afterAll(async () => {
	if (server && server.exitCode === null) {
		server.kill();
		await once(server, 'exit');
	}
	await proxy?.close();
	await db.end();
	await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
	await admin.end();
});
test.beforeEach(async () => {
	await db.query('TRUNCATE authoring_projects CASCADE');
});

test('PostgreSQL N1: Accept and Restore show authoritative success after a late COMMIT', async ({
	page
}) => {
	await page.goto(origin);
	const dialogue = el(page, 'dialogue');
	await expect(dialogue).toHaveText('Leave the channel open.');
	await dialogue.fill('N1 browser accepted text.');
	await expect(page.getByRole('status')).toHaveText('Saved');
	/* Commit, step 1 (save and prepare) runs before the proxy is armed, so the held COMMIT is the accept. */
	await page.getByRole('button', { name: 'Commit changes' }).click();
	const commitCard = page.getByRole('dialog', { name: 'Commit changes' });
	await expect(commitCard).toBeVisible();

	async function delayedCommit(commandType: string, click: () => Promise<void>) {
		const mutations: Array<{ status: number; result: unknown }> = [];
		const listener = async (response: import('@playwright/test').Response) => {
			if (!response.url().endsWith('/api/authoring')) return;
			const body = response.request().postDataJSON();
			if (body.method === 'handle' && body.args[0].type === commandType)
				mutations.push({ status: response.status(), result: await response.json() });
		};
		page.on('response', listener);
		proxy.arm();
		try {
			await click();
			await proxy.holdReached;
			await expect.poll(() => mutations[0]?.status, { timeout: 5000 }).toBe(503);
			await expect
				.poll(
					async () =>
						(
							await admin.query(
								'SELECT 1 FROM pg_stat_activity WHERE application_name = $1 AND cardinality(pg_blocking_pids(pid)) > 0',
								[schema]
							)
						).rowCount,
					{ timeout: 5000, intervals: [10] }
				)
				.toBe(1);
			proxy.release();
			await expect.poll(() => mutations.length).toBe(2);
			expect(mutations[0].result).toMatchObject({ code: 'STORE_UNAVAILABLE' });
			expect(mutations[1]).toMatchObject({
				status: 200,
				result: {
					ok: false,
					error: {
						code: commandType === 'RestoreScreenplay' ? 'CONFLICT' : 'PROPOSAL_ALREADY_RESOLVED'
					}
				}
			});
		} finally {
			page.off('response', listener);
		}
	}
	await delayedCommit('AcceptProposal', () =>
		commitCard.getByRole('button', { name: 'Commit' }).click()
	);
	await expect(page.getByRole('status')).toHaveText('Committed');
	await expect(dialogue).toHaveText('N1 browser accepted text.');
	await expect(commitCard).toHaveCount(0);
	await expect(page.getByText(/Couldn’t commit/)).toHaveCount(0);
	await page.getByRole('button', { name: 'History' }).click();
	await page
		.getByLabel('History')
		.getByRole('listitem')
		.filter({ hasText: 'Initial screenplay' })
		.getByRole('button', { name: 'Preview' })
		.click();
	await delayedCommit('RestoreScreenplay', () =>
		page.getByRole('button', { name: 'Restore this version' }).click()
	);
	await expect(page.getByRole('status')).toHaveText('Restored');
	await expect(dialogue).toHaveText('Leave the channel open.');
	await expect(page.getByText(/Couldn’t restore/)).toHaveCount(0);
	const history = await db.query(
		'SELECT record FROM authoring_change_sets ORDER BY revision_number'
	);
	expect(history.rows).toHaveLength(2);
	expect(
		history.rows.filter(({ record }) => record.provenance.kind === 'scoped-restore')
	).toHaveLength(1);
	expect(
		(await db.query("SELECT 1 FROM authoring_proposals WHERE status = 'accepted'")).rowCount
	).toBe(1);
	expect((await db.query('SELECT head_number::int FROM authoring_projects')).rows).toEqual([
		{ head_number: 2 }
	]);
	expect(
		(await db.query('SELECT number::int FROM authoring_revisions ORDER BY number')).rows
	).toEqual([{ number: 0 }, { number: 1 }, { number: 2 }]);
	expect(
		(
			await db.query(
				'SELECT document_version::int FROM authoring_checkpoints ORDER BY revision_number'
			)
		).rows
	).toEqual([{ document_version: 1 }, { document_version: 2 }]);
	const projection = await db.query(
		'SELECT document_version::int, content FROM authoring_scopes WHERE document_id = $1 AND version_id = $2',
		[ids.primaryDocument, ids.featureVersion]
	);
	expect(projection.rows[0].document_version).toBe(2);
	expect(
		projection.rows[0].content.elements.find((e: { id: string }) => e.id === ids.dialogue).text
	).toBe('Leave the channel open.');
	expect(serverLog).not.toContain('Unhandled');
});

test('health reports the schema this release needs, and fails closed when it does not match', async () => {
	const healthy = await fetch(`${origin}/health`);
	expect(healthy.status).toBe(200);
	expect(await healthy.json()).toMatchObject({ ok: true, store: 'postgres', schema: 'current' });

	const version = '002_screenplay_element_kinds.sql';
	const row = (
		await db.query('SELECT sha256 FROM authoring_schema_migrations WHERE version = $1', [version])
	).rows[0];
	await db.query('DELETE FROM authoring_schema_migrations WHERE version = $1', [version]);
	try {
		const behind = await fetch(`${origin}/health`);
		expect(behind.status).toBe(503);
		const body = await behind.json();
		expect(body).toMatchObject({ ok: false, schema: 'behind', migrations: { missing: [version] } });
		expect(JSON.stringify(body)).not.toMatch(/postgres(ql)?:\/\//);
	} finally {
		await db.query('INSERT INTO authoring_schema_migrations (version, sha256) VALUES ($1, $2)', [
			version,
			row.sha256
		]);
	}
	expect((await fetch(`${origin}/health`)).status).toBe(200);
});
