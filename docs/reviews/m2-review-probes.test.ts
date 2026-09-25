// Disposable review probes — not part of the repository. Deleted after the review.
import { writeFileSync } from 'node:fs';
import { afterAll, describe, expect, it } from 'vitest';
import { AuthoringApplication } from './authoring.js';
import type {
	AuthoringPrincipal,
	DocumentVersionScope,
	ScreenplayElement,
	TrustedExecutionContext
} from './authoring-contracts.js';
import { authoringFixtureIds as F, harborLightInitialRevision } from './authoring-fixture.js';
import {
	InMemoryAuthoringProjectStore,
	InMemoryProjectStoreResolver,
	resolveElementState
} from './authoring-store.js';

const log: Record<string, unknown> = {};
afterAll(() => {
	writeFileSync('/tmp/claude-0/probes.json', JSON.stringify(log, null, 1));
});

const alice: AuthoringPrincipal = { kind: 'human', id: 'user:alice' };
const bob: AuthoringPrincipal = { kind: 'human', id: 'user:bob' };
const ctx = (principal: AuthoringPrincipal, requestId = 'request:x'): TrustedExecutionContext => ({
	principal,
	requestId
});
const feature: DocumentVersionScope = { documentId: F.primaryDocument, versionId: F.featureVersion };
const trailer: DocumentVersionScope = { documentId: F.primaryDocument, versionId: F.trailerVersion };
const coda: DocumentVersionScope = { documentId: F.secondaryDocument, versionId: F.featureVersion };

function harness(opts: { idFactory?: (k: string) => string; now?: () => string } = {}) {
	const resolver = new InMemoryProjectStoreResolver([harborLightInitialRevision]);
	let id = 0;
	let tick = 0;
	const app = new AuthoringApplication(resolver, {
		now: opts.now ?? (() => `2026-09-24T12:${String(Math.floor(++tick / 60)).padStart(2, '0')}:${String(tick % 60).padStart(2, '0')}.000Z`),
		idFactory: (opts.idFactory as never) ?? ((kind) => `${kind}:t-${++id}`)
	});
	return { app, resolver };
}
const store = async (h: ReturnType<typeof harness>) =>
	(await h.resolver.forProject(F.project))!;

async function view(app: AuthoringApplication, scope: DocumentVersionScope) {
	return (await app.getScreenplayView(F.project, scope))!;
}
async function save(
	app: AuthoringApplication,
	scope: DocumentVersionScope,
	elements: ScreenplayElement[],
	who = alice,
	extra: Record<string, unknown> = {}
) {
	const v = await view(app, scope);
	return app.handle(
		{
			type: 'SaveDraft',
			projectId: F.project,
			scope,
			baseProjectRevision: v.projectRevision,
			baseDocumentVersion: v.documentVersion,
			elements,
			...extra
		},
		ctx(who)
	);
}
async function propose(app: AuthoringApplication, draftId: string, who = alice) {
	return app.handle({ type: 'CreateProposal', projectId: F.project, draftId }, ctx(who));
}
async function accept(app: AuthoringApplication, proposalId: string, who = alice, req = 'request:x') {
	return app.handle({ type: 'AcceptProposal', projectId: F.project, proposalId }, ctx(who, req));
}
async function reject(app: AuthoringApplication, proposalId: string, who = alice) {
	return app.handle({ type: 'RejectProposal', projectId: F.project, proposalId }, ctx(who));
}
async function edit(
	app: AuthoringApplication,
	scope: DocumentVersionScope,
	f: (els: ScreenplayElement[]) => ScreenplayElement[],
	who = alice
) {
	const v = await view(app, scope);
	const d: any = await save(app, scope, f(v.elements.map((e) => ({ ...e }))), who);
	if (!d.ok) return { stage: 'save', d };
	const p: any = await propose(app, d.draft.id, who);
	if (!p.ok) return { stage: 'propose', p };
	return { draft: d.draft, proposal: p.proposal };
}
async function editAccept(
	app: AuthoringApplication,
	scope: DocumentVersionScope,
	f: (els: ScreenplayElement[]) => ScreenplayElement[],
	who = alice
) {
	const r: any = await edit(app, scope, f, who);
	if (!r.proposal) return r;
	return accept(app, r.proposal.id, who);
}
const setText = (id: string, text: string) => (els: ScreenplayElement[]) =>
	els.map((e) => (e.id === id ? { ...e, text } : e));

describe('review probes', () => {
	it.skip('placeholder', () => {});
	it('P1 UTF-16 vs code-point element ordering', async () => {
		const h = harness();
		const bmpHigh = 'element:！'; // U+FF01
		const astral = 'element:\u{1F600}'; // U+1F600
		const r: any = await editAccept(h.app, coda, (els) => [
			...els,
			{ id: bmpHigh, kind: 'action', text: 'A' },
			{ id: astral, kind: 'action', text: 'B' }
		]);
		const head = await (await store(h)).getHead();
		const sc = head.projection.screenplays.find(
			(s) => s.documentId === coda.documentId && s.versionId === coda.versionId
		)!;
		const stored = sc.elements.map((e) => e.id);
		const cp = (a: string, b: string) => {
			const A = [...a].map((c) => c.codePointAt(0)!);
			const B = [...b].map((c) => c.codePointAt(0)!);
			for (let i = 0; i < Math.min(A.length, B.length); i++) if (A[i] !== B[i]) return A[i] - B[i];
			return A.length - B.length;
		};
		const codePointOrder = [...stored].sort(cp);
		// Try constructing a store from a revision whose elements are in TRUE code-point order
		const alt = JSON.parse(JSON.stringify(head));
		alt.number = 0;
		alt.changeSetId = null;
		const altSc = alt.projection.screenplays.find(
			(s: any) => s.documentId === coda.documentId && s.versionId === coda.versionId
		);
		altSc.elements.sort((a: any, b: any) => cp(a.id, b.id));
		let constructed = 'ok';
		try {
			new InMemoryAuthoringProjectStore(alt);
		} catch (e) {
			constructed = String(e);
		}
		log.P1 = {
			accepted: r.ok,
			storedOrder: stored.slice(-3),
			trueCodePointOrder: codePointOrder.slice(-3),
			sameAsCodePoint: JSON.stringify(stored) === JSON.stringify(codePointOrder),
			storeFromCodePointOrdered: constructed
		};
		expect(true).toBe(true);
	});

	it('P2 NUL / lone surrogate / NFC-NFD in text and IDs', async () => {
		const out: Record<string, unknown> = {};
		for (const [label, text, id] of [
			['nulText', 'Mara\u0000steadies', 'element:nul-text'],
			['loneSurrogateText', 'Mara \uD800', 'element:lone-text'],
			['nulId', 'x', 'element:a\u0000b'],
			['emojiId', 'x', 'element:\u{1F3AC}'],
			['nfcId', 'x', 'element:café'],
			['nfdId', 'x', 'element:café'],
			['hugeId', 'x', 'element:' + 'a'.repeat(100000)]
		] as const) {
			const h = harness();
			const r: any = await editAccept(h.app, coda, (els) => [...els, { id, kind: 'action', text }]);
			out[label] = r.ok ?? r;
		}
		// NFC and NFD of the same visible ID coexisting in one scope
		const h = harness();
		const r: any = await editAccept(h.app, coda, (els) => [
			...els,
			{ id: 'element:café', kind: 'action', text: 'composed' },
			{ id: 'element:café', kind: 'dialogue', text: 'decomposed' }
		]);
		out.nfcAndNfdCoexist = r.ok;
		log.P2 = out;
		expect(true).toBe(true);
	});

	it('P3 restore makes a later-added element unknown (not removed); ID then re-used with another kind', async () => {
		const h = harness();
		const newId = 'element:signal';
		await editAccept(h.app, feature, (els) => [...els, { id: newId, kind: 'dialogue', text: 'Signal.' }]);
		const v = await view(h.app, feature);
		const restored: any = await h.app.handle(
			{
				type: 'RestoreScreenplay',
				projectId: F.project,
				scope: feature,
				targetRevision: 0,
				expectedDocumentVersion: v.documentVersion
			},
			ctx(alice)
		);
		const head = await (await store(h)).getHead();
		const stateAfterRestore = resolveElementState(head.projection, feature, newId);
		const reuse: any = await editAccept(h.app, feature, (els) => [
			...els,
			{ id: newId, kind: 'scene-heading', text: 'INT. SOMEWHERE ELSE' }
		]);
		const hist = await h.app.listHistory(F.project);
		const kinds = hist.flatMap((c) =>
			c.operations.flatMap((o) =>
				o.type === 'InsertScreenplayElement' && o.element.id === newId ? [o.element.kind] : []
			)
		);
		// compare: plain removal then re-add with another kind is refused by the diff
		const h2 = harness();
		await editAccept(h2.app, feature, (els) => [...els, { id: newId, kind: 'dialogue', text: 'Signal.' }]);
		await editAccept(h2.app, feature, (els) => els.filter((e) => e.id !== newId));
		const reuse2: any = await editAccept(h2.app, feature, (els) => [
			...els,
			{ id: newId, kind: 'scene-heading', text: 'X' }
		]);
		log.P3 = {
			restoreOk: restored.ok,
			stateAfterRestore,
			reuseWithOtherKindAfterRestore: reuse.ok ?? reuse,
			kindsRecordedForSameIdInHistory: kinds,
			reuseWithOtherKindAfterRemove: reuse2.ok ?? reuse2?.p?.error?.code ?? reuse2
		};
		expect(true).toBe(true);
	});

	it('P4 same element ID with different kinds across scopes/documents', async () => {
		const h = harness();
		const a: any = await editAccept(h.app, coda, (els) => [
			...els,
			{ id: F.heading, kind: 'dialogue', text: 'Heading ID reused as dialogue in another document.' }
		]);
		const b: any = await editAccept(h.app, feature, (els) => [
			...els,
			{ id: 'element:independent', kind: 'action', text: 'Feature action.' }
		]);
		const c: any = await editAccept(h.app, trailer, (els) => [
			...els,
			{ id: 'element:independent', kind: 'character', text: 'TRAILER CHARACTER' }
		]);
		log.P4 = { crossDocumentSameIdOtherKind: a.ok, featureAdd: b.ok, trailerSameIdOtherKind: c.ok };
		expect(true).toBe(true);
	});

	it('P5 concurrent acceptance in unrelated scopes', async () => {
		const h = harness();
		const A: any = await edit(h.app, feature, setText(F.action, 'Feature concurrent.'));
		const B: any = await edit(h.app, coda, setText(F.codaAction, 'Coda concurrent.'));
		const [ra, rb]: any[] = await Promise.all([
			accept(h.app, A.proposal.id),
			accept(h.app, B.proposal.id)
		]);
		const pa = await h.app.getProposal(F.project, A.proposal.id);
		const pb = await h.app.getProposal(F.project, B.proposal.id);
		log.P5 = {
			a: ra.ok ? 'ok' : ra.error,
			b: rb.ok ? 'ok' : rb.error,
			proposalStatuses: [pa?.status, pb?.status],
			history: (await h.app.listHistory(F.project)).length
		};
		// sequential retry of the loser
		const loser = ra.ok ? B : A;
		const retry: any = await accept(h.app, loser.proposal.id);
		(log.P5 as any).retryLoser = retry.ok ? 'ok' : retry.error;
		expect(true).toBe(true);
	});

	it('P6 concurrent accept + reject of the same proposal', async () => {
		const out: Record<string, unknown> = {};
		for (const order of ['acceptFirst', 'rejectFirst'] as const) {
			const h = harness();
			const P: any = await edit(h.app, feature, setText(F.action, 'Race.'));
			const calls =
				order === 'acceptFirst'
					? [accept(h.app, P.proposal.id), reject(h.app, P.proposal.id, bob)]
					: [reject(h.app, P.proposal.id, bob), accept(h.app, P.proposal.id)];
			const results: any[] = await Promise.all(calls);
			const final = await h.app.getProposal(F.project, P.proposal.id);
			const hist = await h.app.listHistory(F.project);
			out[order] = {
				results: results.map((r) => (r.ok ? r.kind : r.error.code)),
				finalProposalStatus: final?.status,
				historyLength: hist.length,
				historyReferencesProposal: hist.some(
					(c) => c.provenance.kind === 'proposal-acceptance' && c.provenance.proposalId === P.proposal.id
				),
				featureActionText: (await view(h.app, feature)).elements[1].text
			};
		}
		log.P6 = out;
		expect(true).toBe(true);
	});

	it('P7 concurrent double accept of one proposal', async () => {
		const h = harness();
		const P: any = await edit(h.app, feature, setText(F.action, 'Double.'));
		const rs: any[] = await Promise.all([accept(h.app, P.proposal.id), accept(h.app, P.proposal.id)]);
		log.P7 = {
			results: rs.map((r) => (r.ok ? r.kind : r.error.code)),
			history: (await h.app.listHistory(F.project)).length
		};
		expect(true).toBe(true);
	});

	it('P8 re-saving an existing Draft silently rebases it and reverts intervening accepted work', async () => {
		const h = harness();
		// Alice drafts an action change against Feature v0
		const v0 = await view(h.app, feature);
		const d: any = await save(h.app, feature, setText(F.action, 'Alice action.')(v0.elements.map((e) => ({ ...e }))));
		// Bob accepts a dialogue change in the same scope (Feature v1)
		const bobResult: any = await editAccept(h.app, feature, setText(F.dialogue, 'Bob dialogue.'), bob);
		// Alice reopens her Draft later and saves again (Studio passes the CURRENT view as the base)
		const draft = (await h.app.getDraft(F.project, d.draft.id))!;
		const resaved: any = await save(h.app, feature, draft.elements.map((e) => ({ ...e })), alice, {
			draftId: draft.id
		});
		const p: any = await propose(h.app, d.draft.id);
		const a: any = p.ok ? await accept(h.app, p.proposal.id) : p;
		const after = await view(h.app, feature);
		log.P8 = {
			bobAccepted: bobResult.ok,
			resaveOk: resaved.ok,
			draftBaseAfterResave: resaved.ok ? [resaved.draft.baseProjectRevision, resaved.draft.baseDocumentVersion] : null,
			proposalOps: p.ok ? p.proposal.operations.map((o: any) => `${o.type}:${o.elementId ?? o.element?.id}:${o.text ?? ''}`) : p.error,
			acceptOk: a.ok ?? a,
			dialogueAfter: after.elements.find((e) => e.id === F.dialogue)?.text,
			actionAfter: after.elements.find((e) => e.id === F.action)?.text
		};
		// Control: without re-saving, the stale Draft is detected
		const h2 = harness();
		const v02 = await view(h2.app, feature);
		const d2: any = await save(h2.app, feature, setText(F.action, 'Alice action.')(v02.elements.map((e) => ({ ...e }))));
		await editAccept(h2.app, feature, setText(F.dialogue, 'Bob dialogue.'), bob);
		const p2: any = await propose(h2.app, d2.draft.id);
		const a2: any = await accept(h2.app, p2.proposal.id);
		(log.P8 as any).controlWithoutResave = a2.ok ? 'ok' : a2.error.code;
		expect(true).toBe(true);
	});

	it('P9 user scenarios: A v3 / B v7 ordering; stale Proposal after same-scope edit', async () => {
		const h = harness();
		for (let i = 0; i < 3; i++) await editAccept(h.app, feature, setText(F.action, `f${i}`));
		for (let i = 0; i < 7; i++) await editAccept(h.app, coda, setText(F.codaAction, `c${i}`));
		const fa = await view(h.app, feature);
		const cb = await view(h.app, coda);
		const A: any = await edit(h.app, feature, setText(F.action, 'A final'));
		const B: any = await edit(h.app, coda, setText(F.codaAction, 'B final'));
		const rb: any = await accept(h.app, B.proposal.id);
		const ra: any = await accept(h.app, A.proposal.id);
		const A2: any = await edit(h.app, feature, setText(F.action, 'A2'));
		await editAccept(h.app, feature, setText(F.dialogue, 'someone else'), bob);
		const ra2: any = await accept(h.app, A2.proposal.id);
		log.P9 = {
			featureDocVersion: fa.documentVersion,
			codaDocVersion: cb.documentVersion,
			acceptB: rb.ok,
			acceptAAfterB: ra.ok,
			staleAfterSameScopeEdit: ra2.ok ? 'ok' : ra2.error.code,
			staleMessage: ra2.ok ? '' : ra2.error.message
		};
		expect(true).toBe(true);
	});

	it('P10 no-op restores still append history and bump the document version', async () => {
		const h = harness();
		await editAccept(h.app, trailer, setText(F.action, 'Trailer-only.'));
		const v = await view(h.app, feature);
		const draft: any = await edit(h.app, feature, setText(F.action, 'Pending feature draft.'));
		const r: any = await h.app.handle(
			{
				type: 'RestoreScreenplay',
				projectId: F.project,
				scope: feature,
				targetRevision: 1, // revision where only Trailer changed; Feature identical to now
				expectedDocumentVersion: v.documentVersion
			},
			ctx(alice)
		);
		const v2 = await view(h.app, feature);
		const acceptPending: any = await accept(h.app, draft.proposal.id);
		log.P10 = {
			restoreOk: r.ok,
			opsInRestore: r.ok ? r.changeSet.operations.length : null,
			docVersionBefore: v.documentVersion,
			docVersionAfter: v2.documentVersion,
			elementsIdentical: JSON.stringify(v.elements) === JSON.stringify(v2.elements),
			pendingProposalAfterNoopRestore: acceptPending.ok ? 'ok' : acceptPending.error.code
		};
		expect(true).toBe(true);
	});

	it('P11 rehydration of tampered/odd accepted history', async () => {
		const h = harness();
		await editAccept(h.app, feature, setText(F.action, 'one'));
		const v = await view(h.app, feature);
		await h.app.handle(
			{ type: 'RestoreScreenplay', projectId: F.project, scope: feature, targetRevision: 0, expectedDocumentVersion: v.documentVersion },
			ctx(alice)
		);
		const bundle = await (await store(h)).exportAcceptedHistory();
		const tryLoad = async (b: unknown) => {
			try {
				await InMemoryAuthoringProjectStore.fromAcceptedHistory(b);
				return 'loaded';
			} catch (e) {
				return String((e as Error).message);
			}
		};
		const clone = () => JSON.parse(JSON.stringify(bundle));
		const out: Record<string, unknown> = { baseline: await tryLoad(clone()) };

		// (a) restore op claims targetRevision 0 but content is something else (consistent projection)
		{
			const b = clone();
			const rs = b.accepted[1];
			const op = rs.changeSet.operations[0];
			const sc = rs.revision.projection.screenplays.find((s: any) => s.documentId === feature.documentId && s.versionId === feature.versionId);
			const el = op.content.elements.find((e: any) => e.id === F.dialogue);
			el.text = 'FORGED restored text';
			sc.elements.find((e: any) => e.id === F.dialogue).text = 'FORGED restored text';
			out.restoreContentNotMatchingTarget = await tryLoad(b);
		}
		// (b) acceptance provenance references a nonexistent proposal and fabricated draft
		{
			const b = clone();
			b.accepted[0].changeSet.provenance.proposalId = 'proposal:never-existed';
			b.accepted[0].changeSet.provenance.draftId = 'draft:never-existed';
			out.danglingProposalProvenance = await tryLoad(b);
		}
		// (c) timestamps going backwards
		{
			const b = clone();
			b.accepted[1].changeSet.timestamp = '2001-01-01T00:00:00.000Z';
			b.accepted[1].revision.timestamp = '2001-01-01T00:00:00.000Z';
			out.nonMonotonicTimestamps = await tryLoad(b);
		}
		// (d) impossible calendar date
		{
			const b = clone();
			b.accepted[1].changeSet.timestamp = '2026-13-45T99:99:99Z';
			b.accepted[1].revision.timestamp = '2026-13-45T99:99:99Z';
			out.impossibleDate = await tryLoad(b);
		}
		// (e) an unknown extension field (forward-compat)
		{
			const b = clone();
			b.accepted[0].changeSet['x-note'] = 'future field';
			out.unknownExtensionField = await tryLoad(b);
		}
		// (f) schemaVersion 2 record
		{
			const b = clone();
			b.accepted[0].changeSet.schemaVersion = 2;
			out.schemaVersion2 = await tryLoad(b);
		}
		// (g) duplicate requestId across changesets (both use request:x)
		out.requestIdsInHistory = bundle.accepted.map((m: any) => m.changeSet.requestId);
		// (h) size of the export
		out.exportBytes = JSON.stringify(bundle).length;
		out.revisionsInExport = bundle.accepted.length + 1;
		log.P11 = out;
		expect(true).toBe(true);
	});

	it('P12 ID collisions from the trusted id factory', async () => {
		const h = harness({
			idFactory: (k) => (k === 'proposal' ? 'proposal:fixed' : `${k}:${Math.random().toString(36).slice(2)}`)
		});
		const P1: any = await edit(h.app, feature, setText(F.action, 'first'));
		const a1: any = await accept(h.app, P1.proposal.id);
		const before = await h.app.getProposal(F.project, 'proposal:fixed');
		const P2: any = await edit(h.app, coda, setText(F.codaAction, 'second'));
		const after = await h.app.getProposal(F.project, 'proposal:fixed');
		log.P12 = {
			firstAccepted: a1.ok,
			recordBefore: [before?.status, before?.scope.documentId],
			secondCreated: !!P2.proposal,
			recordAfter: [after?.status, after?.scope.documentId],
			acceptedProposalOverwritten: before?.status === 'accepted' && after?.status === 'pending'
		};
		expect(true).toBe(true);
	});

	it('P13 authority: agent principal accepts; acceptor differs from author; author absent from ChangeSet', async () => {
		const h = harness();
		const P: any = await edit(h.app, feature, setText(F.action, 'Alice wrote this.'), alice);
		const agentAccept: any = await accept(h.app, P.proposal.id, { kind: 'agent', id: 'agent:rewriter' });
		const h2 = harness();
		const P2: any = await edit(h2.app, feature, setText(F.action, 'Alice wrote this.'), alice);
		const bobAccept: any = await accept(h2.app, P2.proposal.id, bob);
		const cs = bobAccept.changeSet;
		log.P13 = {
			agentMayAccept: agentAccept.ok,
			systemPrincipalMayAccept: await (async () => {
				const h3 = harness();
				const P3: any = await edit(h3.app, feature, setText(F.action, 'x'));
				const r: any = await accept(h3.app, P3.proposal.id, { kind: 'system', id: 'system:deterministic-draft-diff' });
				return r.ok;
			})(),
			bobAcceptsAlicesDraft: bobAccept.ok,
			changeSetMentionsAlice: JSON.stringify(cs).includes('user:alice'),
			changeSetPrincipal: cs.principal,
			changeSetProvenance: cs.provenance
		};
		expect(true).toBe(true);
	});

	it('P14 materialization of hostile inputs', async () => {
		const h = harness();
		const v = await view(h.app, feature);
		const base = {
			type: 'SaveDraft',
			projectId: F.project,
			scope: feature,
			baseProjectRevision: v.projectRevision,
			baseDocumentVersion: v.documentVersion
		};
		const out: Record<string, unknown> = {};
		const run = async (label: string, command: unknown, context: unknown = ctx(alice)) => {
			try {
				const r: any = await h.app.handle(command, context);
				out[label] = r.ok ? r.kind : r.error.code;
			} catch (e) {
				out[label] = 'THREW ' + String(e);
			}
		};
		// nested getter
		let nestedInvoked = 0;
		const withGetter = { ...v.elements[0] } as any;
		delete withGetter.text;
		Object.defineProperty(withGetter, 'text', { enumerable: true, get: () => (nestedInvoked++, 'x') });
		await run('nestedGetter', { ...base, elements: [withGetter] });
		out.nestedGetterInvoked = nestedInvoked;
		// proxy traps count
		const traps: string[] = [];
		const proxied = new Proxy({ ...base, elements: v.elements }, {
			ownKeys(t) { traps.push('ownKeys'); return Reflect.ownKeys(t); },
			getOwnPropertyDescriptor(t, p) { traps.push('gopd:' + String(p)); return Reflect.getOwnPropertyDescriptor(t, p); },
			getPrototypeOf(t) { traps.push('getPrototypeOf'); return Reflect.getPrototypeOf(t); },
			get(t, p, r) { traps.push('get:' + String(p)); return Reflect.get(t, p, r); }
		});
		await run('proxyCommand', proxied);
		out.proxyTrapCounts = traps.reduce((m: any, t) => ((m[t] = (m[t] ?? 0) + 1), m), {});
		// inherited properties (prototype pollution style)
		await run('inheritedType', Object.assign(Object.create({ type: 'SaveDraft' }), { ...base, type: undefined }));
		const protoObj = Object.create({ elements: [] });
		Object.assign(protoObj, { ...base });
		await run('inheritedElements', protoObj);
		// __proto__ own key via JSON
		await run('ownProtoKey', JSON.parse(JSON.stringify({ ...base, elements: [] }).replace('{', '{"__proto__":{"x":1},')));
		// class instance / Date / Map
		class Cmd { constructor() { Object.assign(this, { ...base, elements: [] }); } }
		await run('classInstance', new Cmd());
		await run('dateInText', { ...base, elements: [{ ...v.elements[0], text: new Date() }] });
		// sparse array / named array prop
		const sparse: any[] = [v.elements[0]];
		sparse[2] = v.elements[1];
		await run('sparseArray', { ...base, elements: sparse });
		const named: any = [...v.elements];
		named.extra = 1;
		await run('arrayNamedProp', { ...base, elements: named });
		// malformed discriminated union: SaveDraft carrying restore fields
		await run('mixedUnion', { ...base, elements: [], targetRevision: 0, expectedDocumentVersion: 0 });
		await run('restoreMissingField', { type: 'RestoreScreenplay', projectId: F.project, scope: feature, targetRevision: 0 });
		// context forgery / malformed contexts
		await run('contextExtraField', { ...base, elements: [] }, { ...ctx(alice), onBehalfOf: bob });
		await run('contextBadKind', { ...base, elements: [] }, { principal: { kind: 'root', id: 'user:x' }, requestId: 'request:x' });
		// mutation after acceptance
		const els = v.elements.map((e) => ({ ...e }));
		const saved: any = await h.app.handle({ ...base, elements: els }, ctx(alice));
		els[0].text = 'MUTATED AFTER SAVE';
		const reread = await h.app.getDraft(F.project, saved.draft.id);
		out.callerMutationAfterSave = reread?.elements[0].text;
		const returned = saved.draft;
		let returnedFrozen = false;
		try { returned.elements[0].text = 'mutate returned'; } catch { returnedFrozen = true; }
		out.returnedDraftFrozen = returnedFrozen;
		out.storeAfterReturnedMutation = (await h.app.getDraft(F.project, saved.draft.id))?.elements[0].text;
		const P: any = await edit(h.app, feature, setText(F.action, 'mut'));
		const acc: any = await accept(h.app, P.proposal.id);
		acc.changeSet.principal.id = 'user:mallory';
		acc.revision.projection.name = 'Hijacked';
		const hist = await h.app.listHistory(F.project);
		const head = await h.app.getProjectHead(F.project);
		out.acceptedRecordAfterCallerMutation = [hist[0].principal.id, head?.projection.name];
		let headFrozen = false;
		try { (head as any).projection.name = 'x'; } catch { headFrozen = true; }
		out.headFrozen = headFrozen;
		log.P14 = out;
		expect(true).toBe(true);
	});

	it('P15 tombstone order and equality', async () => {
		const h = harness();
		// remove action, then re-add it elsewhere; compare visible vs stored equality
		await editAccept(h.app, feature, (els) => els.filter((e) => e.id !== F.action));
		const head1 = await (await store(h)).getHead();
		const sc1 = head1.projection.screenplays.find((s) => s.documentId === feature.documentId && s.versionId === feature.versionId)!;
		log.P15 = { orderWithTombstone: sc1.order.map((x) => x.replace('element:harbor-light-', '')), elementStates: sc1.elements.map((e) => `${e.id.replace('element:harbor-light-', '')}:${e.status}`) };
		expect(true).toBe(true);
	});

	it('P16 invalid trusted clock accepted into ChangeSet', async () => {
		const out: Record<string, unknown> = {};
		for (const [label, now] of [
			['impossibleDate', () => '2026-13-45T99:99:99Z'],
			['notADate', () => 'not-a-date']
		] as const) {
			const h = harness({ now });
			try {
				const r: any = await editAccept(h.app, feature, setText(F.action, 'clock'));
				out[label] = r.ok ? 'accepted: ' + JSON.stringify(r.changeSet.timestamp) : r.error?.code ?? r.stage ?? r;
			} catch (e) { out[label] = 'handle() REJECTED/THREW: ' + String((e as Error).message); }
		}
		log.P16 = out;
		expect(true).toBe(true);
	});
});
