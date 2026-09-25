import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthoringApplication, type ScreenplayView } from './authoring.js';
import type {
	AuthoringPrincipal,
	DocumentVersionScope,
	ScreenplayElement,
	TrustedExecutionContext
} from './authoring-contracts.js';
import { authoringFixtureIds, harborLightInitialRevision } from './authoring-fixture.js';
import {
	compareCanonicalIds,
	InMemoryAuthoringProjectStore,
	materializeAndValidate,
	resolveElementState,
	type ProjectStoreResolver
} from './authoring-store.js';
import { ScreenplayDraftSchema } from './authoring-contracts.js';
import {
	PostgresAuthoringProjectStore,
	PostgresProjectStoreResolver
} from './postgres-authoring-store.js';
import { migrateAuthoringDatabase } from './postgres-migrations.js';

const backend = process.env.AUTHORING_CONTRACT_BACKEND ?? 'memory';
if (backend !== 'memory' && backend !== 'postgres')
	throw new Error(`Unknown authoring contract backend: ${backend}`);
const postgresUrl = process.env.TEST_DATABASE_URL;
if (backend === 'postgres' && !postgresUrl)
	throw new Error('TEST_DATABASE_URL is required for PostgreSQL contract tests');
const schema = `m25_contract_${randomUUID().replaceAll('-', '')}`;
const admin = backend === 'postgres' ? new Pool({ connectionString: postgresUrl }) : undefined;
const pool =
	backend === 'postgres'
		? new Pool({ connectionString: postgresUrl, options: `-c search_path=${schema}`, max: 10 })
		: undefined;

beforeAll(async () => {
	if (!admin || !pool) return;
	await admin.query(`CREATE SCHEMA "${schema}"`);
	await migrateAuthoringDatabase(pool);
});
beforeEach(async () => {
	if (!pool) return;
	await pool.query('TRUNCATE authoring_projects CASCADE');
	await new PostgresProjectStoreResolver(pool).seedProject(harborLightInitialRevision);
});
afterEach(async () => {
	if (pool) await pool.query('TRUNCATE authoring_projects CASCADE');
});
afterAll(async () => {
	if (!admin || !pool) return;
	await pool.end();
	await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
	await admin.end();
});

const human: AuthoringPrincipal = { kind: 'human', id: 'user:director' };
const context: TrustedExecutionContext = { principal: human, requestId: 'request:test' };
const featureScope: DocumentVersionScope = {
	documentId: authoringFixtureIds.primaryDocument,
	versionId: authoringFixtureIds.featureVersion
};
const trailerScope: DocumentVersionScope = {
	documentId: authoringFixtureIds.primaryDocument,
	versionId: authoringFixtureIds.trailerVersion
};
const codaScope: DocumentVersionScope = {
	documentId: authoringFixtureIds.secondaryDocument,
	versionId: authoringFixtureIds.featureVersion
};

function createHarness(options: { now?: () => string } = {}) {
	const store = pool
		? new PostgresAuthoringProjectStore(pool, authoringFixtureIds.project)
		: new InMemoryAuthoringProjectStore(harborLightInitialRevision);
	const resolver: ProjectStoreResolver = {
		forProject: async (projectId) => (projectId === authoringFixtureIds.project ? store : undefined)
	};
	let id = 0;
	let tick = 0;
	const application = new AuthoringApplication(resolver, {
		now: options.now ?? (() => `2026-09-24T12:00:${String(++tick).padStart(2, '0')}.000Z`),
		idFactory: (kind) => `${kind}:test-${++id}`
	});
	return { application, store };
}

async function getView(
	application: AuthoringApplication,
	scope: DocumentVersionScope
): Promise<ScreenplayView> {
	const view = await application.getScreenplayView(authoringFixtureIds.project, scope);
	expect(view).toBeDefined();
	return view!;
}

async function saveDraft(
	application: AuthoringApplication,
	scope: DocumentVersionScope,
	elements: readonly ScreenplayElement[],
	draftId?: string
) {
	const view = await getView(application, scope);
	const result = await application.handle(
		{
			type: 'SaveDraft',
			projectId: authoringFixtureIds.project,
			...(draftId ? { draftId } : {}),
			scope,
			baseProjectRevision: view.projectRevision,
			baseDocumentVersion: view.documentVersion,
			elements
		},
		context
	);
	expect(result).toMatchObject({ ok: true, kind: 'draft-saved' });
	if (!result.ok || result.kind !== 'draft-saved') throw new Error('draft save failed');
	return result.draft;
}

async function createProposal(application: AuthoringApplication, draftId: string) {
	const result = await application.handle(
		{
			type: 'CreateProposal',
			projectId: authoringFixtureIds.project,
			draftId
		},
		context
	);
	expect(result).toMatchObject({ ok: true, kind: 'proposal-created' });
	if (!result.ok || result.kind !== 'proposal-created') throw new Error('proposal creation failed');
	return result.proposal;
}

async function acceptProposal(
	application: AuthoringApplication,
	proposalId: string,
	trustedContext = context
) {
	return application.handle(
		{
			type: 'AcceptProposal',
			projectId: authoringFixtureIds.project,
			proposalId
		},
		trustedContext
	);
}

async function proposeAndAccept(
	application: AuthoringApplication,
	scope: DocumentVersionScope,
	elements: readonly ScreenplayElement[],
	trustedContext = context
) {
	const draft = await saveDraft(application, scope, elements);
	const proposal = await createProposal(application, draft.id);
	const result = await acceptProposal(application, proposal.id, trustedContext);
	expect(result).toMatchObject({ ok: true, kind: 'proposal-accepted' });
	return result;
}

describe('durable provisional screenplay work', () => {
	it('saves and reopens a Draft without creating a ProjectRevision or changing authority', async () => {
		const { application } = createHarness();
		const before = await getView(application, featureScope);
		const edited = before.elements.map((element) =>
			element.id === authoringFixtureIds.dialogue
				? { ...element, text: 'Hold the channel open.' }
				: element
		);
		const draft = await saveDraft(application, featureScope, edited);
		const reopened = await application.getDraft(authoringFixtureIds.project, draft.id);
		const after = await getView(application, featureScope);

		expect(reopened).toEqual(draft);
		expect(
			reopened?.elements.find((element) => element.id === authoringFixtureIds.dialogue)?.text
		).toBe('Hold the channel open.');
		expect(after).toEqual(before);
		expect(await application.listHistory(authoringFixtureIds.project)).toHaveLength(0);
	});

	it('materializes once, validates the private value, and executes only that value', async () => {
		const { application } = createHarness();
		const view = await getView(application, featureScope);
		let descriptorReads = 0;
		const volatileElement = new Proxy(
			{ ...view.elements[1] },
			{
				getOwnPropertyDescriptor(target, property) {
					const descriptor = Reflect.getOwnPropertyDescriptor(target, property);
					if (property !== 'text' || !descriptor) return descriptor;
					descriptorReads += 1;
					return {
						...descriptor,
						value: descriptorReads === 1 ? 'Private materialized value.' : 'Changed later.'
					};
				}
			}
		);
		const result = await application.handle(
			{
				type: 'SaveDraft',
				projectId: authoringFixtureIds.project,
				scope: featureScope,
				baseProjectRevision: view.projectRevision,
				baseDocumentVersion: view.documentVersion,
				elements: [view.elements[0], volatileElement, ...view.elements.slice(2)]
			},
			context
		);
		expect(result).toMatchObject({ ok: true, kind: 'draft-saved' });
		if (!result.ok || result.kind !== 'draft-saved') return;
		expect(result.draft.elements[1].text).toBe('Private materialized value.');
		expect(descriptorReads).toBe(1);
	});
});

describe('proposal lifecycle and trusted attribution', () => {
	it('creates the same semantic proposal from the same saved Draft and retains source provenance', async () => {
		const { application } = createHarness();
		const view = await getView(application, featureScope);
		const edited = view.elements.map((element) =>
			element.id === authoringFixtureIds.action
				? { ...element, text: 'Mara shutters the lamp.' }
				: element
		);
		const draft = await saveDraft(application, featureScope, edited);
		const first = await createProposal(application, draft.id);
		const second = await createProposal(application, draft.id);

		expect(JSON.parse(JSON.stringify(draft))).toEqual(draft);
		expect(JSON.parse(JSON.stringify(first))).toEqual(first);
		expect(second.operations).toEqual(first.operations);
		expect(second.preconditions).toEqual(first.preconditions);
		expect(first.source).toEqual({
			kind: 'draft',
			ref: { kind: 'draft', id: draft.id },
			contentAuthors: [human],
			generator: {
				id: 'proposer:deterministic-draft-diff',
				version: 1,
				principal: { kind: 'system', id: 'system:deterministic-draft-diff' }
			}
		});
	});

	it('rejects a Proposal without changing accepted history or the authoritative screenplay', async () => {
		const { application } = createHarness();
		const before = await getView(application, featureScope);
		const draft = await saveDraft(application, featureScope, [
			...before.elements.slice(0, 1),
			{ ...before.elements[1], text: 'Mara closes the channel.' },
			...before.elements.slice(2)
		]);
		const proposal = await createProposal(application, draft.id);
		const rejected = await application.handle(
			{
				type: 'RejectProposal',
				projectId: authoringFixtureIds.project,
				proposalId: proposal.id,
				reason: 'Keep the quieter beat.'
			},
			context
		);

		expect(rejected).toMatchObject({ ok: true, kind: 'proposal-rejected' });
		expect(await getView(application, featureScope)).toEqual(before);
		expect(await application.listHistory(authoringFixtureIds.project)).toHaveLength(0);
	});

	it('accepts explicitly, attributes the human separately from proposal provenance, and rejects forged authority', async () => {
		const { application } = createHarness();
		const view = await getView(application, featureScope);
		const forged = await application.handle(
			{
				type: 'SaveDraft',
				projectId: authoringFixtureIds.project,
				scope: featureScope,
				baseProjectRevision: view.projectRevision,
				baseDocumentVersion: view.documentVersion,
				elements: view.elements,
				principal: { kind: 'system', id: 'system:forged' },
				timestamp: '1970-01-01T00:00:00.000Z'
			},
			context
		);
		expect(forged).toMatchObject({ ok: false, error: { code: 'INVALID_COMMAND' } });

		const edited = view.elements.map((element) =>
			element.id === authoringFixtureIds.dialogue
				? { ...element, text: 'Keep the channel alive.' }
				: element
		);
		const acceptedBy = {
			principal: { kind: 'human' as const, id: 'user:editor' },
			requestId: 'request:accept-1'
		};
		const result = await proposeAndAccept(application, featureScope, edited, acceptedBy);
		expect(result).toMatchObject({
			ok: true,
			kind: 'proposal-accepted',
			changeSet: {
				principal: acceptedBy.principal,
				requestId: acceptedBy.requestId,
				provenance: {
					kind: 'proposal-acceptance',
					proposedBy: human,
					contentAuthors: [human],
					source: { generator: { principal: deterministicSourcePrincipalForTest() } }
				}
			}
		});
		expect((await getView(application, featureScope)).elements.at(-1)?.text).toBe(
			'Keep the channel alive.'
		);
		expect(await application.listHistory(authoringFixtureIds.project)).toHaveLength(1);
	});
});

function deterministicSourcePrincipalForTest() {
	return { kind: 'system', id: 'system:deterministic-draft-diff' };
}

describe('version-scoped identity and conflict semantics', () => {
	it('shares stable element identity while resolving deliberate removal deterministically', async () => {
		const { application } = createHarness();
		const feature = await getView(application, featureScope);
		const trailer = await getView(application, trailerScope);
		const head = await application.getProjectHead(authoringFixtureIds.project);

		expect(feature.elements[0].id).toBe(trailer.elements[0].id);
		expect(feature.elements.some((element) => element.id === authoringFixtureIds.dialogue)).toBe(
			true
		);
		expect(trailer.elements.some((element) => element.id === authoringFixtureIds.dialogue)).toBe(
			false
		);
		expect(resolveElementState(head!.projection, trailerScope, authoringFixtureIds.dialogue)).toBe(
			'removed'
		);
		expect(resolveElementState(head!.projection, trailerScope, 'element:not-created')).toBe(
			'unknown'
		);
		expect((await getView(application, trailerScope)).elements).toEqual(trailer.elements);
	});

	it('accepts one cut without leaking into its sibling', async () => {
		const { application } = createHarness();
		const feature = await getView(application, featureScope);
		const trailerBefore = await getView(application, trailerScope);
		await proposeAndAccept(
			application,
			featureScope,
			feature.elements.map((element) =>
				element.id === authoringFixtureIds.action
					? { ...element, text: 'The feature keeps this beat.' }
					: element
			)
		);
		const trailerAfter = await getView(application, trailerScope);
		expect({ ...trailerAfter, projectRevision: trailerBefore.projectRevision }).toEqual(
			trailerBefore
		);
	});

	it('fails a stale proposal safely when its document version changed', async () => {
		const { application } = createHarness();
		const original = await getView(application, featureScope);
		const staleDraft = await saveDraft(
			application,
			featureScope,
			original.elements.map((element) =>
				element.id === authoringFixtureIds.action ? { ...element, text: 'Stale version.' } : element
			)
		);
		const staleProposal = await createProposal(application, staleDraft.id);
		await proposeAndAccept(
			application,
			featureScope,
			original.elements.map((element) =>
				element.id === authoringFixtureIds.action
					? { ...element, text: 'Accepted first.' }
					: element
			)
		);
		const historyBefore = await application.listHistory(authoringFixtureIds.project);
		const conflict = await acceptProposal(application, staleProposal.id);
		expect(conflict).toMatchObject({ ok: false, error: { code: 'CONFLICT' } });
		expect(await application.listHistory(authoringFixtureIds.project)).toHaveLength(
			historyBefore.length
		);
		expect((await getView(application, featureScope)).elements[1].text).toBe('Accepted first.');
	});

	it('does not reject a proposal merely because unrelated accepted work advanced project history', async () => {
		const { application } = createHarness();
		const feature = await getView(application, featureScope);
		const featureDraft = await saveDraft(
			application,
			featureScope,
			feature.elements.map((element) =>
				element.id === authoringFixtureIds.action
					? { ...element, text: 'Feature edit after coda.' }
					: element
			)
		);
		const featureProposal = await createProposal(application, featureDraft.id);
		const coda = await getView(application, codaScope);
		await proposeAndAccept(
			application,
			codaScope,
			coda.elements.map((element) =>
				element.id === authoringFixtureIds.codaAction
					? { ...element, text: 'Unrelated coda edit.' }
					: element
			)
		);
		const accepted = await acceptProposal(application, featureProposal.id);
		expect(accepted).toMatchObject({ ok: true, kind: 'proposal-accepted' });
		expect((await getView(application, featureScope)).elements[1].text).toBe(
			'Feature edit after coda.'
		);
	});
});

describe('scoped restore and accepted-history reconstruction', () => {
	it('restores one document/cut as new history while preserving sibling and unrelated scopes', async () => {
		const { application, store } = createHarness();
		const initialFeature = await getView(application, featureScope);
		const changedFeature: ScreenplayElement[] = [
			{ ...initialFeature.elements[3], text: 'Reordered dialogue.' },
			initialFeature.elements[0],
			{
				id: 'element:harbor-light-signal',
				kind: 'action',
				text: 'A green signal answers offshore.'
			},
			initialFeature.elements[2]
		];
		await proposeAndAccept(application, featureScope, changedFeature);

		const trailer = await getView(application, trailerScope);
		await proposeAndAccept(
			application,
			trailerScope,
			trailer.elements.map((element) =>
				element.id === authoringFixtureIds.action
					? { ...element, text: 'Trailer-only action.' }
					: element
			)
		);
		const coda = await getView(application, codaScope);
		await proposeAndAccept(
			application,
			codaScope,
			coda.elements.map((element) =>
				element.id === authoringFixtureIds.codaAction
					? { ...element, text: 'Coda remains changed.' }
					: element
			)
		);
		const trailerBeforeRestore = await getView(application, trailerScope);
		const codaBeforeRestore = await getView(application, codaScope);
		const currentFeature = await getView(application, featureScope);
		const appendSpy = vi.spyOn(store, 'commitAccepted');
		const restored = await application.handle(
			{
				type: 'RestoreScreenplay',
				projectId: authoringFixtureIds.project,
				scope: featureScope,
				targetRevision: 0,
				expectedDocumentVersion: currentFeature.documentVersion,
				intent: 'Restore the feature scene baseline'
			},
			{ principal: human, requestId: 'request:restore' }
		);

		expect(restored).toMatchObject({
			ok: true,
			kind: 'screenplay-restored',
			changeSet: {
				principal: human,
				requestId: 'request:restore',
				provenance: { kind: 'scoped-restore', targetRevision: 0, scope: featureScope }
			}
		});
		expect(appendSpy).toHaveBeenCalledOnce();
		expect(appendSpy.mock.calls[0][0].changeSet.provenance).toEqual({
			kind: 'scoped-restore',
			targetRevision: 0,
			targetDocumentVersion: 0,
			scope: featureScope
		});
		const featureAfter = await getView(application, featureScope);
		expect(featureAfter.elements).toEqual(initialFeature.elements);
		expect(
			featureAfter.elements.some((element) => element.id === 'element:harbor-light-signal')
		).toBe(false);
		expect(featureAfter.elements.some((element) => element.id === authoringFixtureIds.action)).toBe(
			true
		);
		const trailerAfterRestore = await getView(application, trailerScope);
		const codaAfterRestore = await getView(application, codaScope);
		expect({
			...trailerAfterRestore,
			projectRevision: trailerBeforeRestore.projectRevision
		}).toEqual(trailerBeforeRestore);
		expect({ ...codaAfterRestore, projectRevision: codaBeforeRestore.projectRevision }).toEqual(
			codaBeforeRestore
		);
		expect(
			(await application.listHistory(authoringFixtureIds.project)).map(
				(item) => item.resultingRevision
			)
		).toEqual([1, 2, 3, 4]);
	});

	it('round-trips accepted records through JSON and rehydrates without command acceptance', async () => {
		const { application, store } = createHarness();
		const feature = await getView(application, featureScope);
		const acceptedBy = {
			principal: { kind: 'human' as const, id: 'user:accepting-editor' },
			requestId: 'request:historical-accept'
		};
		await proposeAndAccept(
			application,
			featureScope,
			feature.elements.map((element) =>
				element.id === authoringFixtureIds.dialogue
					? { ...element, text: 'Historical line.' }
					: element
			),
			acceptedBy
		);
		const serialized = JSON.stringify(await store.exportAcceptedHistory());
		const rehydrated = await InMemoryAuthoringProjectStore.fromAcceptedHistory(
			JSON.parse(serialized)
		);

		expect(await rehydrated.getHead()).toEqual(await store.getHead());
		expect((await rehydrated.listChangeSets())[0].principal).toEqual(acceptedBy.principal);
		expect((await rehydrated.listChangeSets())[0].requestId).toBe(acceptedBy.requestId);
	});

	it('rehydrates a legitimate empty-operation checkpoint without treating it as a new command', async () => {
		const checkpoint = {
			changeSet: {
				schemaVersion: 1 as const,
				id: 'changeset:checkpoint',
				projectId: authoringFixtureIds.project,
				baseRevision: 0,
				resultingRevision: 1,
				principal: { kind: 'system' as const, id: 'system:history-import' },
				requestId: 'request:history-import',
				timestamp: '2026-09-24T13:00:00.000Z',
				intent: 'Record equivalent projection checkpoint',
				operations: [],
				preconditions: [],
				provenance: {
					kind: 'checkpoint' as const,
					reason: 'Imported equivalent projection checkpoint'
				}
			},
			revision: {
				schemaVersion: 1 as const,
				projectId: authoringFixtureIds.project,
				number: 1,
				changeSetId: 'changeset:checkpoint',
				timestamp: '2026-09-24T13:00:00.000Z',
				touchedScopes: []
			},
			checkpoints: []
		};
		const { projection: initialProjection, ...initialRevision } = harborLightInitialRevision;
		const rehydrated = await InMemoryAuthoringProjectStore.fromAcceptedHistory({
			historyContractVersion: 1,
			initialRevision,
			initialProjection,
			accepted: [checkpoint]
		});
		expect((await rehydrated.getHead()).number).toBe(1);
		expect((await rehydrated.listChangeSets())[0]).toEqual(checkpoint.changeSet);
	});
});

describe('Proposal terminal transitions', () => {
	async function pendingProposal(application: AuthoringApplication) {
		const view = await getView(application, featureScope);
		const draft = await saveDraft(
			application,
			featureScope,
			view.elements.map((element) =>
				element.id === authoringFixtureIds.action
					? { ...element, text: 'A terminal proposal change.' }
					: element
			)
		);
		return createProposal(application, draft.id);
	}

	async function rejectProposal(application: AuthoringApplication, proposalId: string) {
		return application.handle(
			{ type: 'RejectProposal', projectId: authoringFixtureIds.project, proposalId },
			context
		);
	}

	it('does not allow reject after accept', async () => {
		const { application } = createHarness();
		const proposal = await pendingProposal(application);
		expect(await acceptProposal(application, proposal.id)).toMatchObject({
			ok: true,
			kind: 'proposal-accepted'
		});
		expect(await rejectProposal(application, proposal.id)).toMatchObject({
			ok: false,
			error: { code: 'PROPOSAL_ALREADY_RESOLVED' }
		});
		expect(await application.listHistory(authoringFixtureIds.project)).toHaveLength(1);
	});

	it('does not allow accept after reject', async () => {
		const { application } = createHarness();
		const proposal = await pendingProposal(application);
		expect(await rejectProposal(application, proposal.id)).toMatchObject({
			ok: true,
			kind: 'proposal-rejected'
		});
		expect(await acceptProposal(application, proposal.id)).toMatchObject({
			ok: false,
			error: { code: 'PROPOSAL_ALREADY_RESOLVED' }
		});
		expect(await application.listHistory(authoringFixtureIds.project)).toHaveLength(0);
	});

	it('makes competing accept and reject choose exactly one terminal winner', async () => {
		for (const acceptFirst of [true, false]) {
			const { application } = createHarness();
			const proposal = await pendingProposal(application);
			const calls = acceptFirst
				? [acceptProposal(application, proposal.id), rejectProposal(application, proposal.id)]
				: [rejectProposal(application, proposal.id), acceptProposal(application, proposal.id)];
			const results = await Promise.all(calls);
			expect(results.filter((result) => result.ok)).toHaveLength(1);
			expect(results.filter((result) => !result.ok)).toMatchObject([
				{ error: { code: 'PROPOSAL_ALREADY_RESOLVED' } }
			]);
			const terminal = await application.getProposal(authoringFixtureIds.project, proposal.id);
			expect(['accepted', 'rejected']).toContain(terminal?.status);
			expect(await application.listHistory(authoringFixtureIds.project)).toHaveLength(
				terminal?.status === 'accepted' ? 1 : 0
			);
		}
	});

	it('rejects duplicate acceptance', async () => {
		const { application } = createHarness();
		const proposal = await pendingProposal(application);
		expect(await acceptProposal(application, proposal.id)).toMatchObject({ ok: true });
		expect(await acceptProposal(application, proposal.id)).toMatchObject({
			ok: false,
			error: { code: 'PROPOSAL_ALREADY_RESOLVED' }
		});
	});

	it('rejects duplicate rejection', async () => {
		const { application } = createHarness();
		const proposal = await pendingProposal(application);
		expect(await rejectProposal(application, proposal.id)).toMatchObject({ ok: true });
		expect(await rejectProposal(application, proposal.id)).toMatchObject({
			ok: false,
			error: { code: 'PROPOSAL_ALREADY_RESOLVED' }
		});
	});
});

describe('Draft base semantics and durable provenance', () => {
	it('keeps an existing Draft base stable and detects staleness after re-save', async () => {
		const { application } = createHarness();
		const alice: AuthoringPrincipal = { kind: 'human', id: 'user:alice' };
		const bob: AuthoringPrincipal = { kind: 'human', id: 'user:bob' };
		const aliceContext = { principal: alice, requestId: 'request:alice-draft' };
		const initial = await getView(application, featureScope);
		const firstSave = await application.handle(
			{
				type: 'SaveDraft',
				projectId: authoringFixtureIds.project,
				scope: featureScope,
				baseProjectRevision: initial.projectRevision,
				baseDocumentVersion: initial.documentVersion,
				elements: initial.elements.map((element) =>
					element.id === authoringFixtureIds.action
						? { ...element, text: 'Alice changes the action.' }
						: element
				)
			},
			aliceContext
		);
		expect(firstSave).toMatchObject({ ok: true, kind: 'draft-saved' });
		if (!firstSave.ok || firstSave.kind !== 'draft-saved') return;

		await proposeAndAccept(
			application,
			featureScope,
			initial.elements.map((element) =>
				element.id === authoringFixtureIds.dialogue
					? { ...element, text: 'Bob changes the dialogue.' }
					: element
			),
			{ principal: bob, requestId: 'request:bob-accept' }
		);
		const current = await getView(application, featureScope);
		const silentRebase = await application.handle(
			{
				type: 'SaveDraft',
				projectId: authoringFixtureIds.project,
				draftId: firstSave.draft.id,
				scope: featureScope,
				baseProjectRevision: current.projectRevision,
				baseDocumentVersion: current.documentVersion,
				elements: firstSave.draft.elements
			},
			aliceContext
		);
		expect(silentRebase).toMatchObject({ ok: false, error: { code: 'INVALID_DRAFT' } });

		const persistedSave = await application.handle(
			{
				type: 'SaveDraft',
				projectId: authoringFixtureIds.project,
				draftId: firstSave.draft.id,
				scope: featureScope,
				baseProjectRevision: firstSave.draft.baseProjectRevision,
				baseDocumentVersion: firstSave.draft.baseDocumentVersion,
				elements: firstSave.draft.elements
			},
			aliceContext
		);
		expect(persistedSave).toMatchObject({
			ok: true,
			draft: { baseProjectRevision: 0, baseDocumentVersion: 0 }
		});
		const proposal = await application.handle(
			{
				type: 'CreateProposal',
				projectId: authoringFixtureIds.project,
				draftId: firstSave.draft.id
			},
			aliceContext
		);
		expect(proposal).toMatchObject({ ok: true, kind: 'proposal-created' });
		if (!proposal.ok || proposal.kind !== 'proposal-created') return;
		expect(await acceptProposal(application, proposal.proposal.id, aliceContext)).toMatchObject({
			ok: false,
			error: { code: 'CONFLICT' }
		});
		expect((await getView(application, featureScope)).elements.at(-1)?.text).toBe(
			'Bob changes the dialogue.'
		);
	});

	it('preserves content authorship, proposer, generator, and accepting authority', async () => {
		const { application, store } = createHarness();
		const alice: AuthoringPrincipal = { kind: 'human', id: 'user:alice' };
		const bob: AuthoringPrincipal = { kind: 'human', id: 'user:bob' };
		const view = await getView(application, featureScope);
		const saved = await application.handle(
			{
				type: 'SaveDraft',
				projectId: authoringFixtureIds.project,
				scope: featureScope,
				baseProjectRevision: view.projectRevision,
				baseDocumentVersion: view.documentVersion,
				elements: view.elements.map((element) =>
					element.id === authoringFixtureIds.action
						? { ...element, text: 'Alice authors this change.' }
						: element
				)
			},
			{ principal: alice, requestId: 'request:alice-save' }
		);
		expect(saved).toMatchObject({ ok: true, kind: 'draft-saved' });
		if (!saved.ok || saved.kind !== 'draft-saved') return;
		const proposed = await application.handle(
			{
				type: 'CreateProposal',
				projectId: authoringFixtureIds.project,
				draftId: saved.draft.id
			},
			{ principal: alice, requestId: 'request:alice-propose' }
		);
		expect(proposed).toMatchObject({ ok: true, kind: 'proposal-created' });
		if (!proposed.ok || proposed.kind !== 'proposal-created') return;
		const accepted = await acceptProposal(application, proposed.proposal.id, {
			principal: bob,
			requestId: 'request:bob-accept'
		});
		expect(accepted).toMatchObject({
			ok: true,
			changeSet: {
				principal: bob,
				provenance: {
					kind: 'proposal-acceptance',
					proposedBy: alice,
					contentAuthors: [alice],
					source: {
						contentAuthors: [alice],
						generator: { principal: deterministicSourcePrincipalForTest() }
					}
				}
			}
		});
		const history = JSON.parse(JSON.stringify(await store.exportAcceptedHistory()));
		const rehydrated = await InMemoryAuthoringProjectStore.fromAcceptedHistory(history);
		expect((await rehydrated.listChangeSets())[0]).toEqual(
			(await application.listHistory(authoringFixtureIds.project))[0]
		);
	});

	it('records an author accepting their own work without collapsing provenance roles', async () => {
		const { application } = createHarness();
		const view = await getView(application, featureScope);
		const accepted = await proposeAndAccept(
			application,
			featureScope,
			view.elements.map((element) =>
				element.id === authoringFixtureIds.action
					? { ...element, text: 'The director authors and accepts this beat.' }
					: element
			)
		);
		expect(accepted).toMatchObject({
			ok: true,
			changeSet: {
				principal: human,
				provenance: {
					proposedBy: human,
					contentAuthors: [human],
					source: { generator: { principal: deterministicSourcePrincipalForTest() } }
				}
			}
		});
	});
});

describe('persistence-safe accepted representation', () => {
	it('rejects an invalid trusted clock value before it can enter accepted history', async () => {
		const timestamps = [
			'2026-09-24T12:00:01.000Z',
			'2026-09-24T12:00:02.000Z',
			'2026-02-30T12:00:03.000Z'
		];
		const { application } = createHarness({ now: () => timestamps.shift()! });
		const view = await getView(application, featureScope);
		const draft = await saveDraft(application, featureScope, [
			...view.elements.slice(0, -1),
			{ ...view.elements.at(-1)!, text: 'A valid draft with an invalid acceptance clock.' }
		]);
		const proposal = await createProposal(application, draft.id);

		await expect(acceptProposal(application, proposal.id)).resolves.toMatchObject({
			ok: false,
			error: { code: 'STORE_REJECTED' }
		});
		expect(await application.listHistory(authoringFixtureIds.project)).toHaveLength(0);
	});

	it('stores scoped checkpoints instead of duplicating the whole project projection', async () => {
		const { application, store } = createHarness();
		const feature = await getView(application, featureScope);
		await proposeAndAccept(
			application,
			featureScope,
			feature.elements.map((element) =>
				element.id === authoringFixtureIds.action
					? { ...element, text: 'Only the Feature scope changes.' }
					: element
			)
		);
		const history = await store.exportAcceptedHistory();
		const accepted = history.accepted[0];
		expect(accepted.revision).not.toHaveProperty('projection');
		expect(accepted.revision.touchedScopes).toEqual([featureScope]);
		expect(accepted.checkpoints).toHaveLength(1);
		expect(accepted.checkpoints[0].scope).toEqual(featureScope);
		expect(JSON.stringify(accepted)).not.toContain('The lamp clicks off. Morning fills the glass.');
		expect((await store.getRevision(0))?.projection).toEqual(harborLightInitialRevision.projection);
	});

	it('uses ASCII persistence IDs while preserving international screenplay text', async () => {
		const { application } = createHarness();
		const view = await getView(application, featureScope);
		const international = await application.handle(
			{
				type: 'SaveDraft',
				projectId: authoringFixtureIds.project,
				scope: featureScope,
				baseProjectRevision: view.projectRevision,
				baseDocumentVersion: view.documentVersion,
				elements: view.elements.map((element) =>
					element.id === authoringFixtureIds.dialogue
						? { ...element, text: 'Señal abierta — 東京 😀' }
						: element
				)
			},
			context
		);
		expect(international).toMatchObject({ ok: true, kind: 'draft-saved' });

		for (const unsafeId of ['element:！', 'element:😀', `element:nul\u0000id`]) {
			const unsafe = await application.handle(
				{
					type: 'SaveDraft',
					projectId: authoringFixtureIds.project,
					scope: featureScope,
					baseProjectRevision: view.projectRevision,
					baseDocumentVersion: view.documentVersion,
					elements: [{ id: unsafeId, kind: 'action', text: 'Unsafe identity.' }]
				},
				context
			);
			expect(unsafe).toMatchObject({ ok: false, error: { code: 'INVALID_COMMAND' } });
		}
		expect(['element:A', 'element:Z', 'element:a', 'element:z'].sort(compareCanonicalIds)).toEqual([
			'element:A',
			'element:Z',
			'element:a',
			'element:z'
		]);
	});

	it('rejects NUL, malformed Unicode, and impossible persisted timestamps', async () => {
		const { application } = createHarness();
		const view = await getView(application, featureScope);
		for (const unsafeText of ['line\u0000break', '\uD800']) {
			const result = await application.handle(
				{
					type: 'SaveDraft',
					projectId: authoringFixtureIds.project,
					scope: featureScope,
					baseProjectRevision: view.projectRevision,
					baseDocumentVersion: view.documentVersion,
					elements: [{ ...view.elements[0], text: unsafeText }]
				},
				context
			);
			expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_COMMAND' } });
		}
		const malformedDraft = {
			schemaVersion: 1,
			id: 'draft:date',
			projectId: authoringFixtureIds.project,
			scope: featureScope,
			owner: human,
			baseProjectRevision: 0,
			baseDocumentVersion: 0,
			elements: view.elements,
			createdAt: '2026-13-45T99:99:99.000Z',
			updatedAt: '2026-09-25T00:00:00.000Z',
			status: 'saved'
		};
		expect(materializeAndValidate(ScreenplayDraftSchema, malformedDraft)).toBeUndefined();
	});

	it('versions accepted history explicitly and rejects unsupported contracts clearly', async () => {
		const { application, store } = createHarness();
		const view = await getView(application, featureScope);
		const accepted = await proposeAndAccept(
			application,
			featureScope,
			view.elements.map((element) =>
				element.id === authoringFixtureIds.action
					? { ...element, text: 'Versioned history.' }
					: element
			)
		);
		if (!accepted.ok) return;
		const bundle = JSON.parse(JSON.stringify(await store.exportAcceptedHistory()));
		expect(bundle.historyContractVersion).toBe(1);
		const supported = await InMemoryAuthoringProjectStore.fromAcceptedHistory(bundle);
		expect(await supported.exportAcceptedHistory()).toEqual(bundle);
		expect((await supported.listChangeSets())[0]).toMatchObject({
			id: accepted.changeSet.id,
			timestamp: accepted.changeSet.timestamp,
			principal: accepted.changeSet.principal
		});
		await expect(
			InMemoryAuthoringProjectStore.fromAcceptedHistory({
				...bundle,
				historyContractVersion: 2
			})
		).rejects.toThrow('Unsupported accepted history contract version: 2');
		const unsupportedChangeSet = JSON.parse(JSON.stringify(bundle));
		unsupportedChangeSet.accepted[0].changeSet.schemaVersion = 2;
		await expect(
			InMemoryAuthoringProjectStore.fromAcceptedHistory(unsupportedChangeSet)
		).rejects.toThrow('Unsupported ChangeSet schema version: 2');
		const invalidTimestamp = JSON.parse(JSON.stringify(bundle));
		invalidTimestamp.accepted[0].changeSet.timestamp = '2026-13-45T99:99:99.000Z';
		invalidTimestamp.accepted[0].revision.timestamp = '2026-13-45T99:99:99.000Z';
		await expect(
			InMemoryAuthoringProjectStore.fromAcceptedHistory(invalidTimestamp)
		).rejects.toThrow('Accepted history contract v1 is malformed');
	});
});

describe('project-scoped screenplay element identity', () => {
	async function attemptProposal(
		application: AuthoringApplication,
		scope: DocumentVersionScope,
		elements: ScreenplayElement[]
	) {
		const draft = await saveDraft(application, scope, elements);
		return application.handle(
			{ type: 'CreateProposal', projectId: authoringFixtureIds.project, draftId: draft.id },
			context
		);
	}

	it('keeps element kind stable across restore and within one cut', async () => {
		const { application } = createHarness();
		const initial = await getView(application, featureScope);
		const identity = 'element:stable-signal';
		await proposeAndAccept(application, featureScope, [
			...initial.elements,
			{ id: identity, kind: 'dialogue', text: 'Signal.' }
		]);
		const changed = await getView(application, featureScope);
		expect(
			await application.handle(
				{
					type: 'RestoreScreenplay',
					projectId: authoringFixtureIds.project,
					scope: featureScope,
					targetRevision: 0,
					expectedDocumentVersion: changed.documentVersion
				},
				context
			)
		).toMatchObject({ ok: true, kind: 'screenplay-restored' });
		const restored = await getView(application, featureScope);
		const proposal = await attemptProposal(application, featureScope, [
			...restored.elements,
			{ id: identity, kind: 'scene-heading', text: 'INT. WRONG KIND' }
		]);
		expect(proposal).toMatchObject({ ok: false, error: { code: 'INVALID_DRAFT' } });
	});

	it('keeps element kind and document ownership stable across sibling cuts and documents', async () => {
		const { application } = createHarness();
		const identity = 'element:shared-signal';
		const feature = await getView(application, featureScope);
		await proposeAndAccept(application, featureScope, [
			...feature.elements,
			{ id: identity, kind: 'action', text: 'Feature signal.' }
		]);
		const trailer = await getView(application, trailerScope);
		expect(
			await attemptProposal(application, trailerScope, [
				...trailer.elements,
				{ id: identity, kind: 'character', text: 'SIGNAL' }
			])
		).toMatchObject({ ok: false, error: { code: 'INVALID_DRAFT' } });
		const coda = await getView(application, codaScope);
		expect(
			await attemptProposal(application, codaScope, [
				...coda.elements,
				{ id: identity, kind: 'action', text: 'Wrong document.' }
			])
		).toMatchObject({ ok: false, error: { code: 'INVALID_DRAFT' } });
	});

	it('rejects historical restore content that does not match its target checkpoint', async () => {
		const { application, store } = createHarness();
		const feature = await getView(application, featureScope);
		await proposeAndAccept(
			application,
			featureScope,
			feature.elements.map((element) =>
				element.id === authoringFixtureIds.action
					? { ...element, text: 'History before restore.' }
					: element
			)
		);
		const current = await getView(application, featureScope);
		await application.handle(
			{
				type: 'RestoreScreenplay',
				projectId: authoringFixtureIds.project,
				scope: featureScope,
				targetRevision: 0,
				expectedDocumentVersion: current.documentVersion
			},
			context
		);
		const bundle = JSON.parse(JSON.stringify(await store.exportAcceptedHistory()));
		const restore = bundle.accepted[1];
		const state = restore.changeSet.operations[0].content.elements.find(
			(element: { id: string }) => element.id === authoringFixtureIds.action
		);
		state.kind = 'dialogue';
		restore.checkpoints[0].content.elements.find(
			(element: { id: string }) => element.id === authoringFixtureIds.action
		).kind = 'dialogue';
		await expect(InMemoryAuthoringProjectStore.fromAcceptedHistory(bundle)).rejects.toThrow(
			'Restore content does not match its target revision'
		);
	});

	it('enforces element kind identity while rehydrating accepted operations', async () => {
		const { application, store } = createHarness();
		const identity = 'element:rehydrated-signal';
		const initial = await getView(application, featureScope);
		await proposeAndAccept(application, featureScope, [
			...initial.elements,
			{ id: identity, kind: 'action', text: 'Signal appears.' }
		]);
		const withSignal = await getView(application, featureScope);
		await proposeAndAccept(
			application,
			featureScope,
			withSignal.elements.filter((element) => element.id !== identity)
		);
		const withoutSignal = await getView(application, featureScope);
		await proposeAndAccept(application, featureScope, [
			...withoutSignal.elements,
			{ id: identity, kind: 'action', text: 'Signal returns.' }
		]);
		const bundle = JSON.parse(JSON.stringify(await store.exportAcceptedHistory()));
		const reinsert = bundle.accepted[2];
		const operation = reinsert.changeSet.operations.find(
			(candidate: { type: string }) => candidate.type === 'InsertScreenplayElement'
		);
		operation.element.kind = 'dialogue';
		reinsert.checkpoints[0].content.elements.find(
			(element: { id: string }) => element.id === identity
		).kind = 'dialogue';
		await expect(InMemoryAuthoringProjectStore.fromAcceptedHistory(bundle)).rejects.toThrow(
			'Element kind cannot change for stable identity'
		);
	});
});

describe('closed application boundary', () => {
	it.each([
		null,
		{},
		{ type: 'UnknownCommand', projectId: authoringFixtureIds.project },
		{ type: 'AcceptProposal', projectId: authoringFixtureIds.project },
		{
			type: 'AcceptProposal',
			projectId: authoringFixtureIds.project,
			proposalId: 'proposal:missing',
			acceptedBy: human
		}
	])('rejects malformed or unknown commands %#', async (command) => {
		const { application } = createHarness();
		const result = await application.handle(command, context);
		expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_COMMAND' } });
	});

	it('rejects accessor-bearing input without invoking caller code', async () => {
		const { application } = createHarness();
		let invoked = false;
		const command = {
			get type() {
				invoked = true;
				return 'SaveDraft';
			}
		};
		const result = await application.handle(command, context);
		expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_COMMAND' } });
		expect(invoked).toBe(false);
	});

	it('exposes Promise-returning application and store boundaries', async () => {
		const { application, store } = createHarness();
		const query = application.getProjectHead(authoringFixtureIds.project);
		const storeQuery = store.getHead();
		expect(query).toBeInstanceOf(Promise);
		expect(storeQuery).toBeInstanceOf(Promise);
		await expect(query).resolves.toMatchObject({ number: 0 });
		await expect(storeQuery).resolves.toMatchObject({ number: 0 });
	});
});
