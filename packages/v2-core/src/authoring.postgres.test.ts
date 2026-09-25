import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AuthoringApplication } from './authoring.js';
import { authoringFixtureIds, harborLightInitialRevision } from './authoring-fixture.js';
import { InMemoryAuthoringProjectStore, resolveElementState } from './authoring-store.js';
import { PostgresProjectStoreResolver } from './postgres-authoring-store.js';
import { migrateAuthoringDatabase } from './postgres-migrations.js';
import type {
	AuthoringProjectState,
	DocumentVersionScope,
	ScreenplayElement
} from './authoring-contracts.js';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL is required for PostgreSQL integration tests');
const schema = `m25_${randomUUID().replaceAll('-', '')}`;
const admin = new Pool({ connectionString: url });
const pool = new Pool({ connectionString: url, options: `-c search_path=${schema}`, max: 10 });
const projectId = authoringFixtureIds.project;
const feature: DocumentVersionScope = {
	documentId: authoringFixtureIds.primaryDocument,
	versionId: authoringFixtureIds.featureVersion
};
const trailer: DocumentVersionScope = {
	documentId: authoringFixtureIds.primaryDocument,
	versionId: authoringFixtureIds.trailerVersion
};
const coda: DocumentVersionScope = {
	documentId: authoringFixtureIds.secondaryDocument,
	versionId: authoringFixtureIds.featureVersion
};
const author = {
	principal: { kind: 'human' as const, id: 'user:writer' },
	requestId: 'request:authoring-test'
};
const accepter = {
	principal: { kind: 'human' as const, id: 'user:editor' },
	requestId: 'request:acceptance-test'
};

function application() {
	return new AuthoringApplication(new PostgresProjectStoreResolver(pool));
}

async function view(app: AuthoringApplication, scope = feature) {
	const result = await app.getScreenplayView(projectId, scope);
	expect(result).toBeDefined();
	return result!;
}

async function draft(
	app: AuthoringApplication,
	scope = feature,
	text = 'The lantern burns brighter. ',
	context = author
) {
	const current = await view(app, scope);
	const elements = current.elements.map((element, index) =>
		index === 1 ? { ...element, text: text + randomUUID() } : element
	);
	const result = await app.handle(
		{
			type: 'SaveDraft',
			projectId,
			scope,
			baseProjectRevision: current.projectRevision,
			baseDocumentVersion: current.documentVersion,
			elements
		},
		context
	);
	expect(result).toMatchObject({ ok: true, kind: 'draft-saved' });
	if (!result.ok || result.kind !== 'draft-saved') throw new Error('Draft save failed');
	return result.draft;
}

async function proposal(app: AuthoringApplication, draftId: string) {
	const result = await app.handle({ type: 'CreateProposal', projectId, draftId }, author);
	expect(result).toMatchObject({ ok: true, kind: 'proposal-created' });
	if (!result.ok || result.kind !== 'proposal-created') throw new Error('Proposal failed');
	return result.proposal;
}

async function accept(app: AuthoringApplication, proposalId: string) {
	return app.handle({ type: 'AcceptProposal', projectId, proposalId }, accepter);
}

async function propose(app: AuthoringApplication, scope = feature, text?: string) {
	return proposal(app, (await draft(app, scope, text)).id);
}

describe('PostgreSQL authoring persistence', () => {
	beforeAll(async () => {
		await admin.query(`CREATE SCHEMA "${schema}"`);
		await migrateAuthoringDatabase(pool);
	});
	beforeEach(async () => {
		await pool.query('TRUNCATE authoring_projects CASCADE');
		await new PostgresProjectStoreResolver(pool).seedProject(harborLightInitialRevision);
	});
	afterEach(async () => {
		await pool.query('TRUNCATE authoring_projects CASCADE');
	});
	afterAll(async () => {
		await pool.end();
		await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
		await admin.end();
	});

	it('migrates an empty schema and records its version; rerun is safe', async () => {
		expect(await migrateAuthoringDatabase(pool)).toEqual(['001_authoring.sql']);
		const rows = await pool.query('SELECT version FROM authoring_schema_migrations');
		expect(rows.rows).toEqual([{ version: '001_authoring.sql' }]);
	});

	it('saves a Draft without an authoritative revision', async () => {
		const app = application();
		await draft(app);
		expect((await app.getProjectHead(projectId))?.number).toBe(0);
		expect(await app.listHistory(projectId)).toHaveLength(0);
	});

	it('reloads a Draft after constructing a fresh application', async () => {
		const saved = await draft(application());
		expect(await application().getDraft(projectId, saved.id)).toEqual(saved);
	});

	it('preserves Draft owner, scope, identity and immutable semantic base on resave', async () => {
		const app = application();
		const saved = await draft(app);
		await accept(app, (await propose(app, coda)).id);
		const updated = await app.handle(
			{
				type: 'SaveDraft',
				projectId,
				draftId: saved.id,
				scope: saved.scope,
				baseProjectRevision: saved.baseProjectRevision,
				baseDocumentVersion: saved.baseDocumentVersion,
				elements: saved.elements.map((element, index) =>
					index === 1 ? { ...element, text: 'Más luz.' } : element
				)
			},
			author
		);
		expect(updated).toMatchObject({ ok: true, kind: 'draft-saved' });
		const reloaded = await application().getDraft(projectId, saved.id);
		expect(reloaded).toMatchObject({
			owner: author.principal,
			scope: saved.scope,
			baseProjectRevision: saved.baseProjectRevision,
			baseDocumentVersion: saved.baseDocumentVersion
		});
		expect(reloaded?.elements[1].text).toBe('Más luz.');
		expect((await app.getProjectHead(projectId))?.number).toBe(1);
	});

	it('does not allow a late Draft save to move its base', async () => {
		const app = application();
		const saved = await draft(app);
		const result = await app.handle(
			{
				type: 'SaveDraft',
				projectId,
				draftId: saved.id,
				scope: saved.scope,
				baseProjectRevision: saved.baseProjectRevision + 1,
				baseDocumentVersion: saved.baseDocumentVersion,
				elements: saved.elements
			},
			author
		);
		expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_DRAFT' } });
		expect((await application().getDraft(projectId, saved.id))?.baseProjectRevision).toBe(0);
	});

	it('reloads a pending Proposal with source, operations and preconditions', async () => {
		const saved = await propose(application());
		expect(await application().getProposal(projectId, saved.id)).toEqual(saved);
	});

	it('accepts a reloaded Proposal and persists one complete accepted record', async () => {
		const saved = await propose(application());
		expect(await accept(application(), saved.id)).toMatchObject({
			ok: true,
			kind: 'proposal-accepted'
		});
		expect(await application().listHistory(projectId)).toHaveLength(1);
		expect((await application().getProjectHead(projectId))?.number).toBe(1);
	});

	it('rejects a reloaded Proposal without authoritative history', async () => {
		const saved = await propose(application());
		const result = await application().handle(
			{ type: 'RejectProposal', projectId, proposalId: saved.id },
			accepter
		);
		expect(result).toMatchObject({ ok: true, kind: 'proposal-rejected' });
		expect((await application().getProposal(projectId, saved.id))?.status).toBe('rejected');
		expect(await application().listHistory(projectId)).toHaveLength(0);
	});

	it('allows exactly one winner in a concurrent accept versus reject race', async () => {
		const saved = await propose(application());
		const [a, b] = await Promise.all([
			accept(application(), saved.id),
			application().handle({ type: 'RejectProposal', projectId, proposalId: saved.id }, accepter)
		]);
		expect([a, b].filter((result) => result.ok)).toHaveLength(1);
		expect(await application().listHistory(projectId)).toHaveLength(a.ok ? 1 : 0);
	});

	it('allows one acceptance in a concurrent accept versus accept race', async () => {
		const saved = await propose(application());
		const results = await Promise.all([
			accept(application(), saved.id),
			accept(application(), saved.id)
		]);
		expect(results.filter((result) => result.ok)).toHaveLength(1);
		expect(await application().listHistory(projectId)).toHaveLength(1);
	});

	it('allows one rejection in a concurrent reject versus reject race', async () => {
		const saved = await propose(application());
		const command = { type: 'RejectProposal', projectId, proposalId: saved.id };
		const results = await Promise.all([
			application().handle(command, accepter),
			application().handle(command, accepter)
		]);
		expect(results.filter((result) => result.ok)).toHaveLength(1);
		expect(await application().listHistory(projectId)).toHaveLength(0);
	});

	it('does not duplicate history after a retried terminal acceptance', async () => {
		const saved = await propose(application());
		expect((await accept(application(), saved.id)).ok).toBe(true);
		expect(await accept(application(), saved.id)).toMatchObject({
			ok: false,
			error: { code: 'PROPOSAL_ALREADY_RESOLVED' }
		});
		expect(await application().listHistory(projectId)).toHaveLength(1);
	});

	it('conflicts when a Proposal is stale in the same document and cut', async () => {
		const app = application();
		const first = await propose(app);
		const second = await propose(app);
		expect((await accept(app, first.id)).ok).toBe(true);
		expect(await accept(application(), second.id)).toMatchObject({
			ok: false,
			error: { code: 'CONFLICT' }
		});
		expect(await app.listHistory(projectId)).toHaveLength(1);
	});

	it('accepts unrelated cuts concurrently without a false document conflict', async () => {
		const app = application();
		const a = await propose(app, feature);
		const b = await propose(app, coda);
		const results = await Promise.all([accept(application(), a.id), accept(application(), b.id)]);
		expect(results.every((result) => result.ok)).toBe(true);
		expect((await app.getProjectHead(projectId))?.number).toBe(2);
	});

	it('round-trips ChangeSet, revision, scoped checkpoint and accepted history v1', async () => {
		const saved = await propose(application());
		await accept(application(), saved.id);
		const store = (await new PostgresProjectStoreResolver(pool).forProject(projectId))!;
		const bundle = await store.exportAcceptedHistory();
		expect(bundle.historyContractVersion).toBe(1);
		expect(bundle.accepted).toHaveLength(1);
		expect(bundle.accepted[0].revision.touchedScopes).toEqual([feature]);
		expect(bundle.accepted[0].checkpoints).toHaveLength(1);
		expect(
			(await (await InMemoryAuthoringProjectStore.fromAcceptedHistory(bundle)).getHead()).number
		).toBe(1);
	});

	it('retains content author and generator separately from trusted accepting principal', async () => {
		const saved = await propose(application());
		await accept(application(), saved.id);
		const record = (await application().listHistory(projectId))[0];
		expect(record.principal).toEqual(accepter.principal);
		expect(record.provenance).toMatchObject({
			contentAuthors: [author.principal],
			source: { generator: { principal: { kind: 'system' } } }
		});
		expect((await application().getProposal(projectId, saved.id))?.status).toBe('accepted');
	});

	it('fails clearly on an unsupported accepted-history contract version', async () => {
		await pool.query(
			'UPDATE authoring_projects SET history_contract_version = 99 WHERE project_id = $1',
			[projectId]
		);
		await expect(application().getProjectHead(projectId)).rejects.toThrow(
			'Unsupported accepted history contract version: 99'
		);
	});

	it('fails clearly on an unsupported stored ChangeSet schema version', async () => {
		const saved = await propose(application());
		await accept(application(), saved.id);
		await pool.query(
			`UPDATE authoring_change_sets SET record = jsonb_set(record, '{schemaVersion}', '99'::jsonb)
			WHERE project_id = $1`,
			[projectId]
		);
		const store = (await new PostgresProjectStoreResolver(pool).forProject(projectId))!;
		await expect(store.exportAcceptedHistory()).rejects.toThrow(
			'Unsupported ChangeSet schema version: 99'
		);
	});

	it('round-trips authored international Unicode without changing order', async () => {
		const phrase = '灯りが揺れる。 María mira el faro 🌊';
		const saved = await propose(application(), feature, phrase);
		await accept(application(), saved.id);
		expect((await view(application())).elements[1].text).toContain(phrase);
	});

	it('keeps element identity and semantic kind stable after restart', async () => {
		const app = application();
		const current = await view(app);
		const element = current.elements[1];
		const result = await app.handle(
			{
				type: 'SaveDraft',
				projectId,
				scope: feature,
				baseProjectRevision: current.projectRevision,
				baseDocumentVersion: current.documentVersion,
				elements: current.elements.map((candidate) =>
					candidate.id === element.id ? { ...candidate, kind: 'dialogue' } : candidate
				)
			},
			author
		);
		expect(result.ok).toBe(true);
		if (!result.ok || result.kind !== 'draft-saved') return;
		const proposed = await application().handle(
			{ type: 'CreateProposal', projectId, draftId: result.draft.id },
			author
		);
		expect(proposed).toMatchObject({ ok: false, error: { code: 'INVALID_DRAFT' } });
	});

	it('keeps a sibling cut isolated through persistence and reload', async () => {
		const before = await view(application(), trailer);
		await accept(application(), (await propose(application(), feature)).id);
		expect(await view(application(), trailer)).toEqual({ ...before, projectRevision: 1 });
	});

	it('restores one scope after restart by appending history', async () => {
		const app = application();
		const before = await view(app);
		const sibling = await view(application(), trailer);
		const addedId = `element:restore-${randomUUID()}`;
		const edited = [
			before.elements[1],
			{ id: addedId, kind: 'action' as const, text: 'A new lantern appears.' },
			before.elements[0],
			before.elements[2]
		];
		const saved = await app.handle(
			{
				type: 'SaveDraft',
				projectId,
				scope: feature,
				baseProjectRevision: before.projectRevision,
				baseDocumentVersion: before.documentVersion,
				elements: edited
			},
			author
		);
		expect(saved).toMatchObject({ ok: true, kind: 'draft-saved' });
		if (!saved.ok || saved.kind !== 'draft-saved') return;
		await accept(application(), (await proposal(application(), saved.draft.id)).id);
		const changed = await view(application());
		expect(changed.elements.map((element) => element.id)).toEqual(
			edited.map((element) => element.id)
		);
		expect(
			resolveElementState(
				(await app.getProjectHead(projectId))!.projection,
				feature,
				authoringFixtureIds.dialogue
			)
		).toBe('removed');
		const result = await application().handle(
			{
				type: 'RestoreScreenplay',
				projectId,
				scope: feature,
				targetRevision: 0,
				expectedDocumentVersion: changed.documentVersion
			},
			accepter
		);
		expect(result).toMatchObject({ ok: true, kind: 'screenplay-restored' });
		expect((await view(application())).elements).toEqual(before.elements);
		expect(
			resolveElementState(
				(await application().getProjectHead(projectId))!.projection,
				feature,
				addedId
			)
		).toBe('unknown');
		expect((await view(application(), trailer)).elements).toEqual(sibling.elements);
		const history = await application().listHistory(projectId);
		expect(history).toHaveLength(2);
		expect(history[1].principal).toEqual(accepter.principal);
		expect(history[1].provenance).toMatchObject({
			kind: 'scoped-restore',
			scope: feature,
			targetRevision: 0
		});
	});

	it('reconstructs historical revisions deterministically from scoped checkpoints', async () => {
		const initial = await application().getRevision(projectId, 0);
		await accept(application(), (await propose(application())).id);
		const first = await application().getRevision(projectId, 1);
		await accept(application(), (await propose(application(), coda)).id);
		const reopened = application();
		expect(await reopened.getRevision(projectId, 0)).toEqual(initial);
		expect(await reopened.getRevision(projectId, 1)).toEqual(first);
	});

	it('reloads the same current authoritative projection after restart', async () => {
		const app = application();
		await accept(app, (await propose(app)).id);
		const before = await app.getProjectHead(projectId);
		expect(await application().getProjectHead(projectId)).toEqual(before);
	});

	it('rolls back all accepted writes if an authoritative update fails', async () => {
		const saved = await propose(application());
		await pool.query(`CREATE FUNCTION reject_scope_update() RETURNS trigger LANGUAGE plpgsql AS $$
			BEGIN RAISE EXCEPTION 'injected scope failure'; END $$`);
		await pool.query(`CREATE TRIGGER reject_scope_update BEFORE UPDATE ON authoring_scopes
			FOR EACH ROW EXECUTE FUNCTION reject_scope_update()`);
		await expect(accept(application(), saved.id)).rejects.toThrow('injected scope failure');
		await pool.query('DROP TRIGGER reject_scope_update ON authoring_scopes');
		await pool.query('DROP FUNCTION reject_scope_update()');
		expect((await application().getProposal(projectId, saved.id))?.status).toBe('pending');
		expect(await application().listHistory(projectId)).toHaveLength(0);
		expect((await application().getProjectHead(projectId))?.number).toBe(0);
	});

	it('stores revision metadata and only touched-scope checkpoints at screenplay scale', async () => {
		const scale: AuthoringProjectState = JSON.parse(JSON.stringify(harborLightInitialRevision));
		scale.projectId = 'project:scale';
		scale.projection.projectId = scale.projectId;
		for (let index = 0; index < 250; index += 1) {
			const id = `element:scale-${String(index).padStart(3, '0')}`;
			scale.projection.screenplayElements.push({
				id,
				documentId: feature.documentId,
				kind: 'action',
				createdInRevision: 0
			});
			for (const scope of scale.projection.screenplays.filter(
				(item) => item.documentId === feature.documentId
			)) {
				scope.order.push(id);
				scope.elements.push({
					id,
					kind: 'action',
					status: 'present',
					text: 'A long screenplay passage for a plausible authored scene.'
				});
			}
		}
		scale.projection.screenplayElements.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
		for (const scope of scale.projection.screenplays)
			scope.elements.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
		await new PostgresProjectStoreResolver(pool).seedProject(scale);
		const app = application();
		const current = await app.getScreenplayView(scale.projectId, feature);
		expect(current?.elements.length).toBeGreaterThan(250);
		const result = await app.handle(
			{
				type: 'SaveDraft',
				projectId: scale.projectId,
				scope: feature,
				baseProjectRevision: 0,
				baseDocumentVersion: 0,
				elements: current!.elements.map((element, index) =>
					index === 1 ? { ...element, text: 'Changed.' } : element
				)
			},
			author
		);
		expect(result.ok).toBe(true);
		if (!result.ok || result.kind !== 'draft-saved') return;
		const created = await app.handle(
			{ type: 'CreateProposal', projectId: scale.projectId, draftId: result.draft.id },
			author
		);
		expect(created.ok).toBe(true);
		if (!created.ok || created.kind !== 'proposal-created') return;
		const accepted = await app.handle(
			{ type: 'AcceptProposal', projectId: scale.projectId, proposalId: created.proposal.id },
			accepter
		);
		expect(accepted.ok).toBe(true);
		const sizes = await pool.query<{ initial: number; revision: number }>(
			`SELECT pg_column_size(p.initial_revision) AS initial,
			 pg_column_size(r.record) AS revision FROM authoring_projects p
			 JOIN authoring_revisions r ON (r.project_id = p.project_id AND r.number = 1)
			 WHERE p.project_id = $1`,
			[scale.projectId]
		);
		expect(sizes.rows[0].revision * 10).toBeLessThan(sizes.rows[0].initial);
		const checkpoints = await pool.query(
			'SELECT 1 FROM authoring_checkpoints WHERE project_id = $1',
			[scale.projectId]
		);
		expect(checkpoints.rowCount).toBe(1);
	});
});
