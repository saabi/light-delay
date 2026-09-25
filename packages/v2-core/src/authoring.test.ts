import { describe, expect, it, vi } from 'vitest';
import { AuthoringApplication, type ScreenplayView } from './authoring.js';
import type {
	AuthoringPrincipal,
	DocumentVersionScope,
	ScreenplayElement,
	TrustedExecutionContext
} from './authoring-contracts.js';
import { authoringFixtureIds, harborLightInitialRevision } from './authoring-fixture.js';
import {
	InMemoryAuthoringProjectStore,
	InMemoryProjectStoreResolver,
	resolveElementState
} from './authoring-store.js';

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

function createHarness() {
	const store = new InMemoryAuthoringProjectStore(harborLightInitialRevision);
	const resolver = new InMemoryProjectStoreResolver([]);
	vi.spyOn(resolver, 'forProject').mockImplementation(async (projectId) =>
		projectId === authoringFixtureIds.project ? store : undefined
	);
	let id = 0;
	let tick = 0;
	const application = new AuthoringApplication(resolver, {
		now: () => `2026-09-24T12:00:${String(++tick).padStart(2, '0')}.000Z`,
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
			kind: 'deterministic-draft-diff',
			id: 'proposer:deterministic-draft-diff-v1',
			principal: { kind: 'system', id: 'system:deterministic-draft-diff' },
			draftId: draft.id
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
					source: { principal: deterministicSourcePrincipalForTest() }
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
					kind: 'scoped-restore' as const,
					targetRevision: 0,
					scope: featureScope
				}
			},
			revision: {
				schemaVersion: 1 as const,
				projectId: authoringFixtureIds.project,
				number: 1,
				changeSetId: 'changeset:checkpoint',
				timestamp: '2026-09-24T13:00:00.000Z',
				projection: harborLightInitialRevision.projection
			}
		};
		const rehydrated = await InMemoryAuthoringProjectStore.fromAcceptedHistory({
			initialRevision: harborLightInitialRevision,
			accepted: [checkpoint]
		});
		expect((await rehydrated.getHead()).number).toBe(1);
		expect((await rehydrated.listChangeSets())[0]).toEqual(checkpoint.changeSet);
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
