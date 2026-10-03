import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AuthoringApplication } from './authoring.js';
import { authoringFixtureIds, harborLightInitialRevision } from './authoring-fixture.js';
import {
	compareSummaries,
	summarizeAuthoringDatabase,
	summaryProblems
} from './authoring-database-check.js';
import { PostgresProjectStoreResolver } from './postgres-authoring-store.js';
import { authoringSchemaStatus, migrateAuthoringDatabase } from './postgres-migrations.js';

/*
	Backup, restore and verification (docs/STUDIO_BACKUP_AND_RESTORE.md), against real databases:
	the tool must restore a populated database so that Studio's own reads find exactly the same
	history, projections, Drafts and Proposals, and must notice when a restore differs.
*/

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL is required for PostgreSQL integration tests');
const run = promisify(execFile);
const tool = fileURLToPath(new URL('../../../tools/db/studio_db.py', import.meta.url));
const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
const sourceName = `backup_source_${suffix}`;
const targetName = `backup_target_${suffix}`;
const databaseUrl = (name: string) => {
	const parsed = new URL(url);
	parsed.pathname = `/${name}`;
	return parsed.toString();
};
const admin = new Pool({ connectionString: url });
let source: Pool;
let target: Pool;
let directory: string;
const context = {
	principal: { kind: 'human' as const, id: 'user:writer' },
	requestId: 'request:backup-test'
};
const scope = {
	documentId: authoringFixtureIds.primaryDocument,
	versionId: authoringFixtureIds.featureVersion
};

async function seed(pool: Pool) {
	await migrateAuthoringDatabase(pool);
	const resolver = new PostgresProjectStoreResolver(pool);
	await resolver.seedProject(harborLightInitialRevision);
	const app = new AuthoringApplication(resolver);
	const edit = async (text: string) => {
		const view = (await app.getScreenplayView(authoringFixtureIds.project, scope))!;
		const saved = await app.handle(
			{
				type: 'SaveDraft',
				projectId: authoringFixtureIds.project,
				scope,
				baseProjectRevision: view.projectRevision,
				baseDocumentVersion: view.documentVersion,
				elements: view.elements.map((element) =>
					element.id === authoringFixtureIds.dialogue ? { ...element, text } : element
				)
			},
			context
		);
		if (!saved.ok || saved.kind !== 'draft-saved') throw new Error('draft not saved');
		return saved.draft;
	};
	const propose = async (draftId: string) => {
		const created = await app.handle(
			{ type: 'CreateProposal', projectId: authoringFixtureIds.project, draftId },
			context
		);
		if (!created.ok || created.kind !== 'proposal-created') throw new Error('no proposal');
		return created.proposal;
	};
	/* An accepted change with a note, a pending proposal, and a Draft still being written. */
	const first = await propose((await edit('Committed before the backup.')).id);
	await app.handle(
		{
			type: 'AcceptProposal',
			projectId: authoringFixtureIds.project,
			proposalId: first.id,
			note: 'Before the backup'
		},
		context
	);
	await propose((await edit('Pending at backup time.')).id);
	await edit('Still being written.');
}

beforeAll(async () => {
	await admin.query(`CREATE DATABASE ${sourceName}`);
	await admin.query(`CREATE DATABASE ${targetName}`);
	source = new Pool({ connectionString: databaseUrl(sourceName) });
	target = new Pool({ connectionString: databaseUrl(targetName) });
	directory = await mkdtemp(join(tmpdir(), 'studio-backup-'));
});

afterAll(async () => {
	await source?.end();
	await target?.end();
	await admin.query(`DROP DATABASE IF EXISTS ${sourceName}`);
	await admin.query(`DROP DATABASE IF EXISTS ${targetName}`);
	await admin.end();
	if (directory) await rm(directory, { recursive: true, force: true });
});

describe('authoring schema status', () => {
	it('reports uninitialized, current, behind, changed and ahead', async () => {
		const schema = `status_${suffix}`;
		const pool = new Pool({ connectionString: url, options: `-c search_path=${schema}` });
		try {
			await admin.query(`CREATE SCHEMA ${schema}`);
			expect((await authoringSchemaStatus(pool)).status).toBe('uninitialized');
			await migrateAuthoringDatabase(pool);
			expect(await authoringSchemaStatus(pool)).toMatchObject({ status: 'current', missing: [] });
			await pool.query(
				"DELETE FROM authoring_schema_migrations WHERE version = '002_screenplay_element_kinds.sql'"
			);
			expect(await authoringSchemaStatus(pool)).toMatchObject({
				status: 'behind',
				missing: ['002_screenplay_element_kinds.sql']
			});
			await pool.query(
				"INSERT INTO authoring_schema_migrations (version, sha256) VALUES ('002_screenplay_element_kinds.sql', 'x'), ('999_future.sql', 'y')"
			);
			/* A changed migration outranks an unknown one. */
			expect(await authoringSchemaStatus(pool)).toMatchObject({
				status: 'changed',
				changed: ['002_screenplay_element_kinds.sql'],
				unknown: ['999_future.sql']
			});
		} finally {
			await pool.end();
			await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
		}
	});

	it('treats migrations from a newer release as compatible ("ahead")', async () => {
		const schema = `ahead_${suffix}`;
		const pool = new Pool({ connectionString: url, options: `-c search_path=${schema}` });
		try {
			await admin.query(`CREATE SCHEMA ${schema}`);
			await migrateAuthoringDatabase(pool);
			await pool.query(
				"INSERT INTO authoring_schema_migrations (version, sha256) VALUES ('999_future.sql', 'y')"
			);
			expect(await authoringSchemaStatus(pool)).toMatchObject({
				status: 'ahead',
				unknown: ['999_future.sql']
			});
		} finally {
			await pool.end();
			await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
		}
	});
});

describe('backup and restore', () => {
	it('restores a populated database that Studio reads exactly as the source', async () => {
		await seed(source);
		const summary = await summarizeAuthoringDatabase(source);
		expect(summaryProblems(summary)).toEqual([]);
		expect(summary.projects[0]).toMatchObject({
			headRevision: 1,
			reconstructionMatches: true,
			proposals: { byStatus: { accepted: 1, pending: 1 } }
		});
		expect(summary.projects[0].drafts.count).toBeGreaterThanOrEqual(2);

		const env = { ...process.env, DATABASE_URL: databaseUrl(sourceName) };
		const { stdout } = await run('python3', [tool, 'backup', '--out', directory], { env });
		const manifest = stdout.trim();
		expect(await readdir(directory)).toHaveLength(3);

		/* Never into the active database, never into a database that has tables. */
		await expect(
			run(
				'python3',
				[tool, 'restore', '--manifest', manifest, '--target-url', databaseUrl(sourceName)],
				{
					env
				}
			)
		).rejects.toMatchObject({ stderr: expect.stringContaining('refusing to restore') });

		await run(
			'python3',
			[tool, 'restore', '--manifest', manifest, '--target-url', databaseUrl(targetName)],
			{ env }
		);
		const restored = await summarizeAuthoringDatabase(target);
		expect(compareSummaries(summary, restored)).toEqual([]);

		await expect(
			run(
				'python3',
				[tool, 'restore', '--manifest', manifest, '--target-url', databaseUrl(targetName)],
				{
					env
				}
			)
		).rejects.toMatchObject({ stderr: expect.stringContaining('is not empty') });

		/* A restore that lost something is caught, and named. */
		await target.query(
			'DELETE FROM authoring_drafts WHERE draft_id = (SELECT draft_id FROM authoring_drafts ORDER BY draft_id LIMIT 1)'
		);
		expect(compareSummaries(summary, await summarizeAuthoringDatabase(target))).toContainEqual(
			expect.stringMatching(/^summary\.projects\[0\]\.drafts\.count: expected \d+, found \d+$/)
		);
		await expect(
			run(
				'python3',
				[tool, 'verify', '--manifest', manifest, '--target-url', databaseUrl(targetName)],
				{
					env
				}
			)
		).rejects.toMatchObject({ stderr: expect.stringContaining('does not match the backup') });
	});
});
