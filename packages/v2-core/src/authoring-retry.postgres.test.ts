import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createRetriedRequest } from '../../../apps/studio/src/lib/authoring-retry';
import { postgresFaultProxy } from '../test-support/postgres-fault-proxy';
import { AuthoringApplication } from './authoring.js';
import { authoringFixtureIds as ids, harborLightInitialRevision } from './authoring-fixture.js';
import { isPostgresUnavailable, PostgresProjectStoreResolver } from './postgres-authoring-store.js';
import { migrateAuthoringDatabase } from './postgres-migrations.js';
import type { AuthoringCommand, AuthoringCommandResult } from './authoring-contracts.js';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL is required');
const schema = `n1_${randomUUID().replaceAll('-', '')}`;
const admin = new Pool({ connectionString: url });
const pool = new Pool({ connectionString: url, options: `-c search_path=${schema}` });
const scope = { documentId: ids.primaryDocument, versionId: ids.featureVersion };
const context = { principal: { kind: 'human' as const, id: 'user:n1' }, requestId: 'request:n1' };
const app = new AuthoringApplication(new PostgresProjectStoreResolver(pool));
let proxy: Awaited<ReturnType<typeof postgresFaultProxy>>;
let faultPool: Pool;
let faultApp: AuthoringApplication;

async function waitFor(predicate: () => Promise<boolean>) {
	const deadline = Date.now() + 4000;
	while (Date.now() < deadline) {
		if (await predicate()) return;
		await new Promise((resolve) => setTimeout(resolve, 5));
	}
	throw new Error('Fault synchronization deadline exceeded');
}
async function propose(text: string) {
	const view = (await app.getScreenplayView(ids.project, scope))!;
	const saved = await app.handle(
		{
			type: 'SaveDraft',
			projectId: ids.project,
			scope,
			baseProjectRevision: view.projectRevision,
			baseDocumentVersion: view.documentVersion,
			elements: view.elements.map((element, index) =>
				index === 1 ? { ...element, text } : element
			)
		},
		context
	);
	if (!saved.ok || saved.kind !== 'draft-saved') throw new Error('Cannot save fixture');
	const result = await app.handle(
		{ type: 'CreateProposal', projectId: ids.project, draftId: saved.draft.id },
		context
	);
	if (!result.ok || result.kind !== 'proposal-created') throw new Error('Cannot propose fixture');
	return result.proposal;
}
async function setup(type: string) {
	const proposal = await propose('Intended N1 text');
	if (type === 'RestoreScreenplay') {
		const accepted = await app.handle(
			{ type: 'AcceptProposal', projectId: ids.project, proposalId: proposal.id },
			context
		);
		if (!accepted.ok) throw new Error('Cannot seed restore');
	}
	const command: AuthoringCommand =
		type === 'RestoreScreenplay'
			? {
					type,
					projectId: ids.project,
					scope,
					targetRevision: 0,
					expectedDocumentVersion: 1
				}
			: {
					type: type as 'AcceptProposal' | 'RejectProposal',
					projectId: ids.project,
					proposalId: proposal.id
				};
	return { command, proposal };
}

/** Actual application/store/pg path; transport only maps the same safe error as
 * Studio's HTTP boundary. No mutation or semantic result is mocked. */
function transport(onResend: () => Promise<void>, beforeResend = false) {
	const events: Array<{ method: string; result?: unknown; code?: string }> = [];
	let mutations = 0;
	const fetcher = (async (_url: unknown, init: RequestInit) => {
		const { method, args } = JSON.parse(init.body as string);
		const event: (typeof events)[number] = { method };
		events.push(event);
		try {
			let result: unknown;
			if (method === 'handle') {
				const resend = ++mutations === 2;
				if (resend && beforeResend) await onResend();
				const pending = faultApp.handle(args[0], context);
				if (resend && !beforeResend) await onResend();
				result = await pending;
			} else {
				const read = faultApp[method as 'getProposal'] as (...args: unknown[]) => Promise<unknown>;
				result = await read.apply(faultApp, args);
			}
			event.result = result;
			return Response.json(result ?? null);
		} catch (error) {
			if (!isPostgresUnavailable(error)) throw error;
			event.code = 'STORE_UNAVAILABLE';
			return Response.json({ code: event.code }, { status: 503 });
		}
	}) as typeof fetch;
	return { events, request: createRetriedRequest({ fetcher, sleep: async () => {} }) };
}

async function integrity(head: number, proposalId: string, status: string, text: string) {
	const projects = await pool.query('SELECT head_number::int FROM authoring_projects');
	expect(projects.rows).toEqual([{ head_number: head }]);
	const revisions = await pool.query(
		'SELECT number::int, change_set_id FROM authoring_revisions WHERE number > 0 ORDER BY number'
	);
	expect(revisions.rows.map((row) => row.number)).toEqual(
		Array.from({ length: head }, (_, i) => i + 1)
	);
	const sets = await pool.query(
		'SELECT revision_number::int, change_set_id FROM authoring_change_sets ORDER BY revision_number'
	);
	expect(
		sets.rows.map((row) => ({ number: row.revision_number, change_set_id: row.change_set_id }))
	).toEqual(revisions.rows);
	const proposals = await pool.query(
		'SELECT status, change_set_id, record FROM authoring_proposals WHERE proposal_id = $1',
		[proposalId]
	);
	expect(proposals.rows).toHaveLength(1);
	expect(proposals.rows[0].status).toBe(status);
	expect(proposals.rows[0].record.status).toBe(status);
	expect(proposals.rows[0].record.resolvedAt).toBeDefined();
	expect(
		(await pool.query('SELECT status FROM n1_transitions WHERE proposal_id = $1', [proposalId]))
			.rows
	).toEqual([{ status }]);
	if (status === 'accepted')
		expect(
			sets.rows.filter((row) => row.change_set_id === proposals.rows[0].change_set_id)
		).toHaveLength(1);
	else expect(proposals.rows[0].change_set_id).toBeNull();
	const checkpoints = await pool.query(
		'SELECT revision_number::int, document_version::int, content FROM authoring_checkpoints ORDER BY revision_number'
	);
	expect(checkpoints.rows.map((row) => [row.revision_number, row.document_version])).toEqual(
		Array.from({ length: head }, (_, i) => [i + 1, i + 1])
	);
	const current = await pool.query(
		'SELECT document_version::int, content FROM authoring_scopes WHERE document_id = $1 AND version_id = $2',
		[scope.documentId, scope.versionId]
	);
	expect(current.rows[0].document_version).toBe(head);
	if (head) expect(current.rows[0].content).toEqual(checkpoints.rows.at(-1).content);
	const view = (await app.getScreenplayView(ids.project, scope))!;
	expect(view.projectRevision).toBe(head);
	expect(view.documentVersion).toBe(head);
	expect(view.elements[1].text).toBe(text);
	const bundle = await (await new PostgresProjectStoreResolver(pool).forProject(
		ids.project
	))!.exportAcceptedHistory();
	expect(bundle.accepted).toHaveLength(head);
}

describe('N1: real PostgreSQL delayed COMMIT reconciliation', () => {
	beforeAll(async () => {
		await admin.query(`CREATE SCHEMA "${schema}"`);
		await migrateAuthoringDatabase(pool);
		await pool.query(`CREATE TABLE n1_transitions (proposal_id text, status text);
		CREATE FUNCTION n1_transition() RETURNS trigger LANGUAGE plpgsql AS $$
		BEGIN IF OLD.status = 'pending' AND NEW.status <> 'pending' THEN
		INSERT INTO n1_transitions VALUES (NEW.proposal_id, NEW.status); END IF;
		RETURN NEW; END $$;
		CREATE TRIGGER n1_transition AFTER UPDATE ON authoring_proposals
		FOR EACH ROW EXECUTE FUNCTION n1_transition()`);
		proxy = await postgresFaultProxy(url);
		faultPool = new Pool({
			connectionString: proxy.url,
			options: `-c search_path=${schema} -c application_name=${schema}`,
			query_timeout: 500,
			max: 5
		});
		faultApp = new AuthoringApplication(new PostgresProjectStoreResolver(faultPool));
	});
	beforeEach(async () => {
		await pool.query('TRUNCATE authoring_projects, n1_transitions CASCADE');
		await new PostgresProjectStoreResolver(pool).seedProject(harborLightInitialRevision);
	});
	afterAll(async () => {
		await faultPool?.end();
		await proxy?.close();
		await pool.end();
		await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
		await admin.end();
	});
	it.each(['AcceptProposal', 'RejectProposal', 'RestoreScreenplay'])(
		'%s: timeout, pending pre-read, blocked resend, late commit, semantic response, authoritative success',
		async (type) => {
			const { command, proposal } = await setup(type);
			proxy.arm();
			const { request, events } = transport(async () => {
				await proxy.holdReached;
				await waitFor(
					async () =>
						(
							await admin.query(
								'SELECT 1 FROM pg_stat_activity WHERE application_name = $1 AND cardinality(pg_blocking_pids(pid)) > 0',
								[schema]
							)
						).rowCount! > 0
				);
				proxy.release();
			});
			const result = await request<AuthoringCommandResult>('handle', [command]);
			expect(result).toMatchObject({
				ok: true,
				kind:
					type === 'AcceptProposal'
						? 'proposal-accepted'
						: type === 'RejectProposal'
							? 'proposal-rejected'
							: 'screenplay-restored'
			});
			const mutations = events.filter((event) => event.method === 'handle');
			expect(mutations).toHaveLength(2);
			expect(mutations[0].code).toBe('STORE_UNAVAILABLE');
			expect(mutations[1].result).toMatchObject({
				ok: false,
				error: { code: type === 'RestoreScreenplay' ? 'CONFLICT' : 'PROPOSAL_ALREADY_RESOLVED' }
			});
			if (type === 'RestoreScreenplay') {
				expect(events[1].result).toEqual(
					await app
						.listHistory(ids.project)
						.then((history) => history.filter((item) => item.provenance.kind !== 'scoped-restore'))
				);
			} else expect(events[1].result).toMatchObject({ status: 'pending' });
			await integrity(
				type === 'RejectProposal' ? 0 : type === 'AcceptProposal' ? 1 : 2,
				proposal.id,
				type === 'RejectProposal' ? 'rejected' : 'accepted',
				type === 'AcceptProposal'
					? 'Intended N1 text'
					: harborLightInitialRevision.projection.screenplays
							.find((s) => s.documentId === scope.documentId && s.versionId === scope.versionId)!
							.elements.find((e) => e.id === ids.action)!.text
			);
			const history = await app.listHistory(ids.project);
			expect(history.filter((item) => item.provenance.kind === 'scoped-restore')).toHaveLength(
				type === 'RestoreScreenplay' ? 1 : 0
			);
		},
		10000
	);
	it.each(['AcceptProposal', 'RejectProposal', 'RestoreScreenplay'])(
		'%s: original COMMIT discarded, incompatible writer wins after pre-read; preserve semantic failure',
		async (type) => {
			const { command, proposal } = await setup(type);
			const rival = type === 'RestoreScreenplay' ? await propose('Rival text') : undefined;
			proxy.arm();
			const { request, events } = transport(async () => {
				await proxy.holdReached;
				proxy.abort();
				// The pre-resend read saw the original pending state. Drop its COMMIT
				// and apply an incompatible outcome before dispatching the resend.
				const competing = await app.handle(
					type === 'RestoreScreenplay'
						? {
								type: 'AcceptProposal',
								projectId: ids.project,
								proposalId: rival!.id
							}
						: {
								type: type === 'AcceptProposal' ? 'RejectProposal' : 'AcceptProposal',
								projectId: ids.project,
								proposalId: proposal.id
							},
					context
				);
				expect(competing).toMatchObject({ ok: true });
			}, true);
			const result = await request<AuthoringCommandResult>('handle', [command]);
			expect(result).toMatchObject({
				ok: false,
				error: { code: type === 'RestoreScreenplay' ? 'CONFLICT' : 'PROPOSAL_ALREADY_RESOLVED' }
			});
			const mutations = events.filter((event) => event.method === 'handle');
			expect(mutations).toHaveLength(2);
			expect(mutations[0].code).toBe('STORE_UNAVAILABLE');
			expect(result).toEqual(mutations[1].result);
			const history = await app.listHistory(ids.project);
			expect(history.filter((item) => item.provenance.kind === 'scoped-restore')).toHaveLength(0);
			await integrity(
				type === 'AcceptProposal' ? 0 : type === 'RejectProposal' ? 1 : 2,
				proposal.id,
				type === 'AcceptProposal' ? 'rejected' : 'accepted',
				type === 'AcceptProposal'
					? (await app.getScreenplayView(ids.project, scope, 0))!.elements[1].text
					: type === 'RejectProposal'
						? 'Intended N1 text'
						: 'Rival text'
			);
		},
		10000
	);
});
