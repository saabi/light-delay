# M2 Authoring implementation review (`implementation/m2-authoring`)

**Repository:** `saabi/light-delay`
**Review date:** 25 September 2026
**Reviewed range:** `431e54d..edde978` (4 commits) on `implementation/m2-authoring`
**Scope:** read-only. Nothing was pushed, committed or deployed. All execution ran in a disposable clone, which was left clean. Probes ran from a temporary test file that was then deleted. A copy is attached as `m2-review-probes.test.ts` so the cases can become regression tests.

Evidence labels: **[verified]** executed and observed · **[read]** established from code or docs at the cited location · **[inferred]** reasoned, not observed.

Classification (one per finding): **A** M2 blocker · **B** fix before M2.5 · **C** address during M2.5 · **D** later architectural work · **E** no issue, or a previous concern satisfied or superseded.

---

## 0. Verified refs

| Ref | Value | Check |
|---|---|---|
| Pre-M2 baseline | `431e54dd584f157a658f032bafb7c680bbb708f9` | The brief's SHA (`…032baf7c…`) is 39 hex characters and drops a `b`. The intended commit is `431e54d` ("docs: record verified pre-M2 baseline"). It is also the current head of `implementation/foundation-r1-r2`. [verified] |
| M2 HEAD | `edde978978b314483cbcc8e4fccdd37267f57a10` | Equals `origin/implementation/m2-authoring`. [verified] |
| Relationship | `431e54d` is an ancestor; exactly 4 commits above it | `7672da0`, `832215c`, `028a492`, `edde978`, with the reported subjects. [verified] |
| Files touched | `packages/v2-core/src/authoring*`, `apps/studio/**`, docs, `studio-ci.yml`, lockfile | No `data/`, `scripts/`, `static/`, `blender/` or `apps/light-delay/` paths changed (`git diff --name-status`). [verified] |

The commits are coherent. `028a492` turned Studio CI red because the lockfile dropped a Linux optional dependency (`@emnapi/runtime`). `edde978` restores it and changes nothing else. [verified]

---

## 1. Executive verdict

**Is M2 valid?** The architecture is valid and mostly well executed. The authority tiers are real in code. Materialize-then-validate holds against hostile objects. Trusted attribution is per command. Accepted records are complete before append. Rehydration is a distinct path. Cut isolation and scoped restore work. Document-version preconditions give the right conflict granularity for sequential work. **This does not need to be reconsidered.**

**Are there A blockers?** **Yes, three. Each is small, but each violates an invariant M2 claims to prove:**

- **A1.** Proposal resolution isn't atomic. A proposal can be reported as *rejected* to one caller and still be accepted into history [verified].
- **A2.** Re-saving an existing Draft silently replaces its base. The resulting Proposal reverts another author's accepted work with no conflict [verified]. Studio's own `saveDraft` uses exactly this call shape.
- **A3.** In the Write UI, **Accept changes** renders white-on-white (invisible) [verified], and the review panel doesn't show what will change.

**Are there B corrections before PostgreSQL?** **Yes, five.** Each concerns a representation that becomes expensive to correct once persisted:

- **B1.** Every ProjectRevision stores a full project snapshot. That's 1.79 MB per revision at feature scale, against about 1 KB per ChangeSet [verified].
- **B2.** The ID and text grammar isn't persistable as defined. The claimed code-point ordering is actually UTF-16 order. NUL characters and lone surrogates are accepted [verified].
- **B3.** Element identity is unanchored. The same ID can carry different kinds across cuts, across documents, and even within one scope after a restore [verified].
- **B4.** The accepted ChangeSet loses who authored the proposed content, which can never be backfilled.
- **B5.** Rehydration re-executes the *current* operation reducer. Any later tightening of operation rules makes already-persisted history unloadable, so B3 must land first and the reducer must be versioned.

**Can M2.5 proceed after those corrections?** **Yes.** The application contract is otherwise concrete enough for PostgreSQL to implement without redesigning authoring semantics. The transaction invariants PostgreSQL must preserve are stated in §8.

---

## 2. What M2 actually implemented (reconstructed from code)

```text
Studio +page.svelte (browser)
  └─ authoring-client.ts: module singleton AuthoringApplication + constant trusted context
        │  handle(commandInput: unknown, contextInput: unknown): Promise<Result>
        ▼
AuthoringApplication (authoring.ts)
  materializeAndValidate(command) ─┐   TypeBox, additionalProperties:false everywhere
  materializeAndValidate(context) ─┘   context = { principal{kind,id}, requestId }
  store = resolver.forProject(command.projectId)
  SaveDraft | CreateProposal | RejectProposal | AcceptProposal | RestoreScreenplay
        ▼
AuthoringUnitOfWork port (authoring-store.ts L26–52)
  ProjectStore:      getHead, getRevision
  HistoryStore:      listChangeSets, exportAcceptedHistory
  DraftProposalStore:getDraft, saveDraft, getProposal, saveProposal   (upserts)
  commitAccepted(mutation, proposalUpdate?)                             (the only atomic write)
        ▼
InMemoryAuthoringProjectStore
  revisions[] (each with full ProjectProjection), changeSets[], drafts Map, proposals Map
  commitAccepted: head CAS on baseRevision + duplicate-ID check + re-projection + deep equality
  fromAcceptedHistory(bundle): validate → replay ops+preconditions → require equality with stored snapshot
```

| Concern | Actual implementation | Where |
|---|---|---|
| Runtime schemas | TypeBox is the only source. TS types are `Static<>`. `schemaVersion: Literal(1)` on persisted records. | `authoring-contracts.ts` |
| Trusted context | `{principal:{kind: human\|importer\|agent\|system, id}, requestId}`, validated separately from the command. Constructed **in the browser** by Studio, with a constant `requestId: 'request:studio-write'`. | `authoring.ts` L241–246; `authoring-client.ts` L12–15 |
| Materialization | Own-descriptor walk. Plain or null prototype only, data descriptors only, dense arrays with no named keys, acyclic, finite numbers, no symbols. Each trap or descriptor is read exactly once. | `authoring-store.ts` L69–144 |
| Screenplay state | Per `(documentId, versionId)` scope: `documentVersion`, `order: id[]` (includes tombstones), `elements: (present{id,kind,text} \| removed{id,kind})[]` sorted by "code-point" ID. | contracts L46–74 |
| Operations | Insert (anchored `afterElementId`), UpdateText, Remove (tombstone), Move (anchored), RestoreScreenplayDocument (full scope content + `targetRevision`). | contracts L85–125; store L290–332 |
| Draft | `{id, projectId, scope, owner, baseProjectRevision, baseDocumentVersion, elements (present only, ordered), createdAt, updatedAt, status:'saved'}`. Full-content snapshot, one scope. | contracts L178–191 |
| Proposal | Single scope, operations (≥1), `DocumentVersionEquals` preconditions (≥1), `requestedBy`, source `{kind:'deterministic-draft-diff', id, principal: system, draftId}`. Status union pending/rejected/accepted. | contracts L193–223 |
| Proposal generation | `deriveDraftOperations`: removes → inserts/updates → moves, computed against the Draft's **base** revision. Refuses a kind change for IDs known (present or removed) in that scope. | `authoring.ts` L99–158 |
| Acceptance | Re-projects the Proposal's ops and preconditions against the **current head**. Builds the complete ChangeSet (principal/requestId from context; ID/time from factories; provenance from the proposal) plus a full-projection ProjectRevision. One `commitAccepted` with the proposal update. | L355–407 |
| Restore | Copies the target revision's scope content into one Restore op, with a `DocumentVersionEquals(expected from command)` precondition. Appends a new revision. | L409–466 |
| Conflict | Per-scope `documentVersion` (+1 per ChangeSet touching the scope). Project revision is the total order. The store additionally CASes on project head. | store L334–374, L508–513 |
| Rehydration | `fromAcceptedHistory` validates the bundle, checks sequence and linkage, **replays** each ChangeSet through the operation reducer (including preconditions), and requires deep equality with the stored revision snapshot. It doesn't use command handling, re-attribute, re-time or re-ID. | store L407–447 |
| Studio | One document (Scene), Feature/Trailer switch, per-element textarea, move, remove, "+ Action", Save Draft, Review changes → Accept/Reject, History → Restore. "Ask" is gone. | `+page.svelte` |

M1's `InMemoryRevisionHistory` and `history.ts` are untouched in the range [verified].

---

## 3. Findings by classification

### A — M2 blockers

**A1. Proposal resolution is not linearizable: "rejected" can coexist with "accepted into history."** *(code + test)*

- *Evidence [verified, P6]:* `Promise.all([reject(P), accept(P)])` on the same pending proposal returns **success for both** (`proposal-rejected`, `proposal-accepted`) in either order. The final proposal is `accepted`, history contains its ChangeSet, and the screenplay changed. The rejecting user was told "Proposal rejected — authoritative screenplay unchanged."
- *Cause [read]:* `RejectProposal` does read-pending → `saveProposal(rejected)` as an unconditional upsert (`authoring.ts` L338–352; store L486–491). `commitAccepted` writes `proposalUpdate` without checking the stored proposal is still pending (store L543). The pending check happens in the handler, outside any atomic unit.
- *Why it matters:* this is ADR-0004's "rejection/abandonment without rewriting project history" and the M2 exit criterion "rejected proposals never alter authoritative state." It is unreachable in today's single-tab UI only because every in-memory `await` resolves in the same microtask burst. A PostgreSQL adapter implementing the port *as written* makes it reachable. Double accept (P7) is currently caught only incidentally by the global head CAS.
- *Recommendation:* make proposal transitions conditional in the port. Replace `saveProposal` with `createProposal` (insert-only; fails on existing ID) and `resolveProposal(id, expected:'pending', next)` (CAS). `commitAccepted` must verify, atomically with the append, that the proposal is still `pending` and that `proposalUpdate.changeSetId === changeSet.id`. Do the same insert-vs-update split for Drafts (this also fixes P12). Add race tests for accept‖reject and accept‖accept.
- *Requires:* code (port + adapter + handler), tests.

**A2. Re-saving a Draft silently rebases it; the Proposal then reverts intervening accepted work.** *(code + UI)*

- *Evidence [verified, P8]:* Alice saves Draft D against Feature v0 (edits the action line). Bob accepts a dialogue change (Feature v1). Alice re-saves D with `draftId` and the *current* base (v1), as Studio's `saveDraft` does. The derived Proposal contains `UpdateScreenplayElementText(dialogue → "Leave the channel open.")`, which reverts Bob's accepted line. It is accepted with **no conflict**. Control: without the re-save, the same Draft correctly fails with `CONFLICT`.
- *Cause [read]:* SaveDraft treats `baseProjectRevision/baseDocumentVersion` as client-asserted on every save, including updates (`authoring.ts` L265–285). Studio passes `view.projectRevision/documentVersion` (the head it last loaded), not the Draft's base (`+page.svelte` L111–112). `openVersion` loads *head* view plus *draft* elements side by side (L48–53), so any reopen-then-save rebases.
- *Why it matters:* the document-version precondition is M2's central lost-update protection. This bypasses it through an ordinary sequential command. Today, the UI clears Drafts on accept or restore of the same scope, so it's hidden. M2.5 makes Drafts durable across sessions and users, where "reopen a Draft after someone else accepted" is the normal case.
- *Recommendation:* a Draft's base is immutable after creation. SaveDraft with `draftId` must either omit base fields or require them to equal the stored base (else `INVALID_DRAFT`). Rebasing becomes an explicit future command (with a merge or review step), not a side effect. Studio must send the Draft's base, and when reopening a Draft whose scope has advanced it should say so ("The screenplay changed since this Draft was started").
- *Requires:* code (handler + Studio), test.

**A3. The Write UI's acceptance step is not usable as a review.** *(UI)*

- *Evidence [verified, screenshot + computed style]:* **Accept changes** computes to `color: rgb(255,255,255)`, `background: transparent` on a white panel, so it's invisible. `.proposal-actions button { background: transparent }` (L606–611) comes after `button.primary` (L412–418) at equal specificity. The Playwright test passes anyway because it finds the button by role.
- The review panel lists only generic phrases ("Revise authored text", "Reorder screenplay element"). It doesn't say *which* element or show before/after text (`authoring-presenter.ts`). A filmmaker can't see what they are accepting.
- *Why it matters:* "explicit, attributable acceptance" is the product proof. Right now the primary action is hidden and the review is uninformed.
- *Recommendation:* fix the CSS. Show element kind, a short excerpt and old→new text for each operation (the Proposal already has everything needed via its base revision). Add an e2e assertion on the visible accept button (for example, a contrast check or a screenshot comparison).
- *Requires:* code (UI), test.

### B — Fix before M2.5

**B1. Full-project snapshot per ProjectRevision should not become the persisted schema.** *(schema)*

- *Evidence [verified, scale probe]:* one screenplay × 3 cuts × 4,000 elements (60-character lines). 20 accepted edits produce a **37.6 MB** export. Each ProjectRevision record is **1.79 MB**; each ChangeSet is **1.0 KB**. One save → propose → accept cycle takes **~1.6 s** (quadratic scans such as `order.some(... includes ...)` at store L229 and per-element `find` in `deriveDraftOperations`; projection re-validated three times per accept) [verified timing; cause read].
- *Why it matters:* `AuthoringProjectRevisionSchema.projection` is the whole project (L169–176). Every accepted edit to one cut re-stores every document and cut. That includes, in the layered future, every Story/Outline projection too. It also creates two sources of truth (operations and snapshots, required to agree) without saying which one is authoritative. Persist that shape and you migrate terabytes later, or never.
- *Recommendation:* before M2.5, split the record:
  - `ProjectRevision = {projectId, number, changeSetId, timestamp, touchedScopes[]}`;
  - ChangeSets are the authoritative record;
  - the **current** projection is stored per scope (`document × version`, keyed by `documentVersion`);
  - **per-scope checkpoints** (for example, every accepted change to that scope, or every N) serve historical views and restore.

  `getRevision(n)` becomes "for each scope, the latest checkpoint with revision ≤ n, plus replay". This keeps ADR-0004's hybrid invariant. Record `targetDocumentVersion` alongside `targetRevision` in the restore operation and provenance, so restore stays cheap without project snapshots.
- *Requires:* schema, code (store and rehydration), docs.

**B2. The ID and text grammar is not persistable as defined, and the ordering claim is false.** *(schema)*

- *Evidence [verified, P1/P2]:*
  - `codePointCompare` uses JS `<`, which compares **UTF-16 code units**. IDs `element:！` (U+FF01) and `element:😀` (U+1F600) are stored as `😀, ！`; true code-point order (and PostgreSQL `COLLATE "C"`/UTF-8 byte order) is `！, 😀`. A projection sorted in true code-point order is **rejected** by the store ("must use code-point ID order").
  - The ID pattern `^[a-z][a-z0-9-]*:[^\s]+$` accepts NUL, lone surrogates, NFC/NFD twins (both coexist as different elements in one scope) and 100,000-character IDs.
  - `text` accepts NUL and lone surrogates. PostgreSQL `text`/`jsonb` reject `\u0000`, and `jsonb` rejects unpaired surrogates, so accepted in-memory history would fail to persist.
  - `scopeKey` joins IDs with `\u0000`, which is ambiguous when IDs may contain NUL.
  - `timestamp` accepts `2026-13-45T99:99:99Z` (P16).
- *Why it matters:* IDs become primary keys and sort keys. Grammar changes after persistence need data migration and, with B5, history rewriting.
- *Recommendation:* ASCII-only opaque IDs, for example `^[a-z][a-z0-9-]*:[A-Za-z0-9._~-]{1,128}$` (UUID/ULID suffixes fit). Then UTF-16 order, code-point order and `C` collation coincide, and the comparator's name becomes true. Text must be well-formed Unicode (`isWellFormed()`) with no NUL, have a stated normalization policy (store as given or NFC; decide now), and a length bound. Validate timestamps as real instants. Decide now whether persisted IDs are prefixed text (these contracts) or UUIDs (`V2_SCALABILITY_AND_STORAGE.md`'s RLS example casts `project_id::uuid`). Text IDs are fine, but the storage doc should agree.
- *Requires:* schema, tests, docs.

**B3. Element identity has no anchor: kind can change for the "same" identity.** *(schema + code)*

- *Evidence [verified, P3/P4]:*
  1. **Within one scope:** add `element:signal` as dialogue → restore to r0 (the element becomes **`unknown`**, not `removed`, because restore replaces state wholesale) → re-add `element:signal` as a **scene-heading** → accepted. History now records both kinds for one ID. The plain remove path correctly refuses the same change (`INVALID_DRAFT`).
  2. **Across cuts:** Feature adds `element:independent` as action; Trailer independently adds the same ID as character → accepted.
  3. **Across documents:** the Scene's heading ID is inserted into the Coda as dialogue → accepted.
- *Cause [read]:* the only kind-stability check lives in the Draft differ and only sees the current scope (`authoring.ts` L110–118). `applyOperation` Insert overwrites `kind` (store L306). No registry exists above the scope.
- *Why it matters:* "shared stable identity" is currently a string convention, not an invariant. Future derivation (Feature → Festival), upstream sync proposals and continuity all depend on "same ID = same element." Non-diff proposers (agents, importers, upstream sync) will call operations directly and bypass the differ.
- *Recommendation:* make identity **project-unique and owned by one document**, with an immutable kind: `element(id) → {documentId, kind, createdInRevision}`. Enforce it in the operation reducer (Insert of a known ID with another kind or another document fails; Insert of an unknown ID registers it). Versions of that document share the identity. Other documents *link* to it rather than reuse it. With the registry, restore can keep its exact-state semantics (unknown in scope) without losing identity. This is the PostgreSQL table shape anyway: `screenplay_element(project_id, element_id PK, document_id, kind)` plus per-scope state.
- *Requires:* schema, code (reducer), tests.

**B4. The accepted ChangeSet does not record who authored the accepted content.** *(schema)*

- *Evidence [verified, P13]:* Bob accepts Alice's Proposal. The ChangeSet has `principal: user:bob` and `provenance.source.principal: system:deterministic-draft-diff`; the string `user:alice` appears nowhere in it. Alice is recorded only in the provisional Draft (`owner`) and Proposal (`requestedBy`).
- *Why it matters:* accepted history is the durable, append-only record. Drafts and Proposals are provisional and will be pruned. Authorship that isn't copied at acceptance is unrecoverable. The same gap applies to future agent or importer proposals: "system diff" describes the *mechanism*, not the *origin*. Separately, `ChangeSetProvenance` is closed to two variants, so the rehydration test has to label an import checkpoint `scoped-restore`, which is dishonest provenance (`authoring.test.ts` L511–515).
- *Recommendation:* acceptance provenance should carry:
  - `proposedBy` (the trusted principal that created the Proposal);
  - `contentAuthors` (for Draft-derived proposals, the Draft owner);
  - `generator {id, version}` (today's `proposer:deterministic-draft-diff-v1`);
  - `sourceRef` (draft/agent-execution/import reference);
  - the proposal's `baseProjectRevision`.

  Add a `checkpoint`/`import` provenance variant. All of this is additive in the union, but the *first* persisted ChangeSets must already carry it.
- *Requires:* schema, code, test.

**B5. Rehydration verifies history with the current reducer, which freezes operation semantics forever.** *(code + docs)*

- *Evidence [read]:* `rehydrateAcceptedHistory` replays every ChangeSet through today's `projectAuthoringOperations` (preconditions included) and throws on any mismatch with the stored snapshot (store L437–443). [verified, P11] A Restore op whose content does *not* match its claimed `targetRevision` still loads, and dangling proposal IDs and non-monotonic timestamps load too. Unknown fields or `schemaVersion: 2` are rejected outright.
- *Why it matters:* after M2.5, fixing B3's kind rule, tightening B2's grammar or changing Insert semantics would make stored history fail to rehydrate. Meanwhile, some integrity checks that *should* hold (restore content = target content) don't exist.
- *Recommendation:*
  1. Land B2/B3 before the first persisted ChangeSet.
  2. Key the reducer by `ChangeSet.schemaVersion` (a map with one entry now), so v1 history always replays with v1 semantics. Later rules apply only to new acceptances.
  3. During rehydration, verify `Restore.content` equals the target scope's content at `targetRevision`.
  4. Reconcile with `V2_RUNTIME_CONTRACTS.md` ("retain unknown namespaced extension data"): either allow an `ext` bag or amend the doc.
- *Requires:* code, docs, tests.

### C — Address during M2.5

| # | Finding | Evidence | Direction |
|---|---|---|---|
| C1 | **False conflicts under concurrency.** Unrelated-scope accepts in parallel: one returns `STORE_REJECTED` ("Project head changed from 0 to 1"); a manual retry succeeds. | [verified P5]; store L508–513; handler doesn't retry | Keep project revision as the total order, but allocate it inside the transaction (lock the head row), check scope `documentVersion` there, and don't surface head movement as an error. Or retry `STALE_PROJECT_HEAD` in the handler after re-checking preconditions. |
| C2 | **Idempotency and requestId.** Studio sends the constant `request:studio-write` for every command, and no uniqueness exists. If M2.5 makes `(principal, requestId)` an idempotency key, every Studio command after the first would be a "duplicate." | `authoring-client.ts` L12–15; [verified P11g] | Studio (and later the server) generates a requestId per user action. The store returns the original result for a repeated key. |
| C3 | **Authorization and acceptance policy.** `agent` and `system` principals may accept, including the diff "system" itself. The trusted context is built in the browser. No project grant is checked. | [verified P13]; `authoring-client.ts` | M2.5 moves the application server-side and derives the principal from auth. Add a policy hook: which principal kinds may accept, per project. Agents propose; humans (initially) accept. |
| C4 | **Error contract.** Store exceptions escape `handle()` as rejected promises instead of results (an invalid clock value throws "Draft is malformed…"). A future DB error will do the same. | [verified P16]; `saveDraft` throws at L478 | Map adapter failures to a typed `STORE_UNAVAILABLE` / `STORE_REJECTED` result. Keep "invalid trusted runtime data" as a programmer error. |
| C5 | **Where validation lives in the adapter.** `commitAccepted` re-runs the domain reducer and full-projection equality inside the store. A PostgreSQL adapter would need the domain reducer inside the transaction or would have to trust the caller. Validation is quadratic (B1 timing). | store L520–539 | Decide one of two approaches. (a) The application computes the delta and the store enforces only CAS and uniqueness constraints. (b) The store applies per-scope deltas using the versioned reducer (B5). Replace `includes`/`find` scans with maps. |
| C6 | **Create vs. update in the provisional store.** A colliding ID from the trusted factory overwrote an *accepted* proposal with a new pending one. | [verified P12] | Solved by A1's insert-only `create*`; PostgreSQL primary keys enforce it. |
| C7 | **Draft lifecycle.** Drafts have only `status: 'saved'`. There's no discard command, no link to the proposals created from them, no optimistic concurrency between two sessions editing one Draft (last write wins), and Studio "forgets" its Draft pointer after acceptance while the record lives on. | contracts L178–191; `+page.svelte` L183–185 | Add `draftRevision` (etag) for saves, `DiscardDraft`, and `proposed/accepted/abandoned` state or a query by `sourceRef`. |
| C8 | **SSR singleton.** Studio uses `adapter-node`. `authoring-client.ts` instantiates a store on the server at module load, shared by all requests, while M2 actually runs the application in each browser tab. | `svelte.config.js` [read]; the SSR HTML contains only "Opening screenplay…", so authoring runs client-side [verified] | When M2.5 moves the application server-side, route through server endpoints with a per-request context. Never import the store module into shared server state. |

### D — Later architectural work

- **D1. Story / Outline / derivation.** No lineage on versions, no document kinds, no Story/Canon scopes. That's expected; §4 explains why the seams are adequate.
- **D2. Proposal targets.** A Proposal has a single top-level `scope`, and `ProposalSource` requires `draftId`. Upstream proposals (Story → Screenplay) and multi-document proposals need `targets[]` and non-draft sources. Both are additive union changes, and the acceptance path is already generic.
- **D3. Restore UX and no-op restores.** History lists *every* project revision for *every* cut with a Restore button. Restoring Feature to a Trailer-only revision appends a no-op revision, bumps Feature's `documentVersion`, and invalidates a pending Feature proposal with `CONFLICT` [verified P10 and UI]. Filter history to ChangeSets that touched the current scope, and return `NO_CHANGES` for restores whose content equals current content. That second change is a one-line core change and could land with A1–A3.
- **D4. UI truthfulness and vocabulary** (§9): unsaved edits are silently discarded on cut switch; "resets when this Studio process stops" actually means "on page reload" (accepted history resets too); raw proposal UUIDs appear in History; "Authoritative projection", "In-memory M2 store" and "PENDING" leak technical terms. The first two are cheap and belong with A3.
- **D5. Performance at feature scale** beyond C5 (ordering structures, incremental validation).
- **D6. Screenplay model breadth:** parentheticals, transitions, dual dialogue, extensions (V.O./O.S.), scene numbering. The four-kind union is additive, and nothing in M2 blocks these.

### E — No issue, or a previous concern satisfied

- **Materialize-then-validate** [verified P14]. Getters (including nested ones) are rejected without being invoked. Inherited properties, own `__proto__` keys, class instances, `Date` values, sparse arrays, array named keys, mixed discriminated unions and extra context fields are all rejected. For a `Proxy`, each trap (`getPrototypeOf`, `ownKeys`, `getOwnPropertyDescriptor` per key) is invoked **exactly once**, so the validated value is the executed value. Caller mutation after save or accept has no effect, and returned records are frozen. *(One wording fix: proxies are caller code, so the test name "without invoking caller code" is true for accessors only.)*
- **Per-command trusted context.** Principal, requestId, time and IDs never come from command payloads (extra fields → `INVALID_COMMAND`) [verified].
- **Complete record before append.** Restore provenance, proposal linkage and the resulting revision are all built before `commitAccepted` [read].
- **Rehydration is distinct from acceptance.** It preserves IDs, principals, requestIds and timestamps, and admits empty-operation checkpoints [verified by test + P11]. It doesn't re-run command rules (ownership, diff kind rule, NO_CHANGES) [read]. B5 is about the *operation* reducer, not command acceptance.
- **Sequential conflict granularity** [verified P9]. Draft A on Scene v3 and Draft B on Coda v7: accept B, then A → both succeed. Proposal on Scene v4 after someone moved Scene to v5 → `CONFLICT` ("Document version changed from 4 to 5"), and history is unchanged.
- **Cut isolation.** Accepted change and restore affect only the target scope. Sibling cut and unrelated document are unchanged (tests + probes).
- **Removed vs. unknown** on the normal authoring path (fixture Trailer dialogue is `removed`; a never-created ID is `unknown`).
- **Equality and ordering.** Unlike M1, equality here is *stricter* than observable behavior: tombstone positions are compared and faithfully restored [verified P15]. No state that equality calls "equivalent" behaves differently.
- **Deterministic proposals.** The same Draft yields identical operations twice (tested).
- **Async ports, TypeBox-derived types, M1 untouched, "Ask" removed** [verified].
- **Legacy compatibility** (§10).

---

## 4. Story → Version → Outline → Screenplay

**Short answer: yes, M2 leaves a clean path, with two conditions: B3 (anchored element identity) and B1 (no monolithic project snapshots).** M2's best accidental decision is that `versions` are **project-global** while content is materialized per `document × version`. That's the StoryVersion axis the layered model needs.

| # | Question | Answer |
|---|---|---|
| 1 | Are screenplay-cut documents root-level independent objects that make lineage awkward? | Partly. Documents are root-level `{id,title}` with **no kind and no relations**, and `screenplays[]` is a kind-specific array. But a *cut* is not a separate document: it's the project-level `versionId` applied to a document. Adding `kind` and document-to-document relations (`outlineOf`, `derivedFrom`) is additive. The awkward case would have been "Festival screenplay" as its own document ID. M2 avoided that. |
| 2 | Does the identity/scope model permit StoryVersion → Outline → Screenplay without replacing M2? | Yes. A StoryVersion *is* a `versionId`: `(outline-doc, festival)` and `(screenplay-doc, festival)` are sibling scopes under one version. Story/Canon needs a **version-independent** scope kind (`{storyId}` or `{worldId}`). Operations, preconditions and `applyOperation` dispatch on scope today only implicitly (`findScreenplayScope`). Make scope a discriminated union when the second kind arrives. No redesign is needed. |
| 3 | Can derivation provenance be added without live inheritance? | Yes, and M2's materialization makes lineage the natural choice. "Derive Festival from Feature" = create the version plus copy each scope's content, with `derivedFrom {versionId, scope documentVersion (or revision)}` recorded in a ChangeSet. Pin on **per-scope `documentVersion`**, not project revision. M2 already maintains exactly that counter, which avoids the "every unrelated commit looks like upstream drift" problem from my foundation review (C8). |
| 4 | Can Feature/Festival share semantic identity with independent wording? | Yes. That's exactly what per-scope present-state text does. **But only once identity is anchored (B3).** Today, "shared" means "same string," with no guarantee that it's the same kind of thing or the same lineage. |
| 5 | Is explicit removal compatible with derived versions? | Yes. `removed` survives copy-derivation and is what lets sync tell "deliberately cut in Festival" (don't propose) from "never seen in Festival" (propose). One caution: restore to a point before an element existed makes it `unknown` again (P3), so sync would re-offer it. That's semantically defensible ("restore = exactly as it was"), but decide it deliberately when sync is designed. The B3 registry keeps identity safe either way. |
| 6 | Can upstream changes become Proposals against downstream artifacts? | Yes. Acceptance is already generic: ops + `DocumentVersionEquals` preconditions, re-projected against head. An upstream-sync proposer creates a Proposal targeting the downstream scope at its current `documentVersion`. It needs a non-draft `ProposalSource` variant (D2). |
| 7 | Can screenplay discoveries become Proposals against Story/Canon? | Yes, within the authority model: the screenplay author (or an agent) creates a Proposal whose operations target Story scopes, and a human accepts it. It needs Story operation families, a Story scope kind and multi-target proposals (D2). Nothing in the trust boundary resists this: the source principal comes from the trusted context, not the payload. |
| 8 | Does Draft/Proposal assume proposals flow Draft → screenplay? | **The creation side does; the acceptance side doesn't.** `CreateProposal` takes only `draftId`, the source kind is a single literal, and acceptance provenance requires `draftId`. That's fine for M2 and additive to widen. What is *not* additive is B4: the first persisted ChangeSets must already record the content author and generator. |
| 9 | Small changes before PostgreSQL? | **B1, B3, B4** (and B2 because IDs become keys). Optional but cheap: add `kind: 'screenplay'` to `documents[]` now, so the documents table has a kind column from day one. |

---

## 5. Draft / Proposal / authority

**Provisional vs. authoritative is genuinely separate in code.** SaveDraft and CreateProposal never touch revisions or projections. Only `commitAccepted` writes history, and only from Accept or Restore. Rejection writes only the proposal record. I found **no path** by which Draft content becomes authoritative without an Accept [read + verified]. The weaknesses are in the *state machine*, not the tiering:

- **A1:** proposal transitions aren't conditional.
- **A2:** a Draft's base is mutable, which defeats staleness detection.
- **B4:** authorship doesn't survive acceptance.
- **C7:** Draft lifecycle and concurrency are missing.

**The human-accepts-agent-proposal workflow is representable** once B4's provenance and a new `ProposalSource` variant exist. The agent calls `CreateProposal` under its own trusted context, so `source.principal = agent` is set by the runtime, not the payload. A human then calls `AcceptProposal`, making `ChangeSet.principal = human`. Nothing in the proposal can claim authority [verified: payload principal or timestamp → `INVALID_COMMAND`]. What M2 lacks is the *policy* that only certain principal kinds may accept (C3).

**The Draft representation transitions to PostgreSQL** cleanly as one row per Draft with a `jsonb` element list, once A2's base immutability and C7's etag exist. Whole-scope snapshot Drafts are right for M2. Operation-log Drafts would be premature.

---

## 6. Version / cut

- **IDs are, in practice, scope-local strings with a sharing convention.** They aren't project-global, document-global or version-global in any enforced sense (B3, P3/P4). That is the one identity decision that will be expensive later.
- **Isolation is sound.** Operations carry their scope, `applyOperation` touches only that scope, and `documentVersion` increments only for touched scopes (store L355–363). Tests and probes confirm no sibling or unrelated-document leakage for accept and restore.
- **Removal semantics are sound** for authoring and compatible with derivation (§4.5).
- **Tombstones stay in `order` forever.** That's fine at M2 scale. With per-scope persistence (B1), the order array is one column per scope. Anchor-based ops (`afterElementId`) are the right choice for later merging.

---

## 7. Restore / concurrency

- **Restore semantics are coherent** at any number of documents and cuts. The target is "scope content at project revision N." It appends a new revision and preserves siblings. Added elements disappear, removed elements return, and exact order (including tombstones) is restored [verified: tests + P3/P15].
  - The *core* model stays coherent at scale.
  - The *UI* (every project revision offered for every cut) doesn't (D3).
  - No-op restores create revisions and false conflicts (P10).
  - After B1, restore should target `(scope, documentVersion)` with `targetRevision` kept as context.
- **Revision relationships:**
  - project revision = total order of accepted ChangeSets;
  - `documentVersion` = per-scope count of ChangeSets touching that scope = the concurrency and pin unit;
  - restore target = project revision (should also record `targetDocumentVersion`).

  This is the right layering.
- **Stale proposals:** the user scenarios behave correctly when sequential (P9). Under concurrency, unrelated-scope acceptance produces a false `STORE_REJECTED` (C1). Same-scope staleness can be bypassed by rebasing a Draft (A2).

---

## 8. Persistence readiness

**Is the application contract well-defined enough for PostgreSQL to implement without redesigning authoring semantics?** **Yes, after A1, A2 and B1–B5.** The ports are Promise-based and per project, commands and results are TypeBox-typed, and the single atomic write (`commitAccepted`) is the right shape. The port lacks conditional proposal and draft writes (A1/C6/C7), and the persisted *records* need the B changes.

### Transaction invariants PostgreSQL must preserve

**T-Accept** (one transaction, SERIALIZABLE or explicit row locks):

1. Lock the project head row. Let `n = head`.
2. Read proposal `P` **FOR UPDATE**; require `status = 'pending'`.
3. For each precondition, read the scope row **FOR UPDATE**; require `document_version = expected`.
4. Apply `P.operations` to current scope state using the reducer for the ChangeSet's `schemaVersion`. Enforce identity-registry rules (B3).
5. Insert the ChangeSet (`id` unique; `(project_id, resulting_revision)` unique; `(project_id, principal, request_id)` unique for idempotency). Insert the ProjectRevision `n+1`.
6. Update touched scopes' current state and `document_version += 1`; write per-scope checkpoints as B1 requires.
7. Update `P → accepted` with `changeset_id` (1:1; unique `changeset.provenance_proposal_id`).
8. Set `head = n+1`. Insert an outbox event.
9. **All or nothing.** Any failed check aborts with no writes. A repeat of the same `(principal, requestId)` returns the original result.

**T-Reject:** `UPDATE proposal SET status='rejected' … WHERE id=? AND status='pending'`. Zero rows → `PROPOSAL_ALREADY_RESOLVED`. It touches nothing else.

**T-Restore:** same as T-Accept, without steps 2 and 7. The precondition is the caller's `expectedDocumentVersion`. The content comes from the target checkpoint, read in the same transaction.

**T-SaveDraft:** insert (new ID) or `UPDATE … WHERE id=? AND owner=? AND draft_revision=?`. Base fields are immutable.

**Standing invariants:**

- revision numbers are contiguous per project;
- each revision > 0 has exactly one ChangeSet with `base = number − 1`;
- a scope's `document_version` equals its initial value plus the number of ChangeSets touching it;
- a proposal is `accepted` ⇔ exactly one ChangeSet references it;
- current scope state = latest checkpoint ⊕ later ChangeSets (verifiable offline);
- no ChangeSet is appended unless all of its preconditions held at the same serialization point.

### Pre-persistence corrections

Items to fix before PostgreSQL, in order: **B2** (IDs and text) → **B3** (identity registry) → **B4** (provenance) → **B1** (record split) → **B5** (versioned reducer and restore verification). A1/A2 are M2 blockers regardless.

---

## 9. UI assessment

What works [verified by driving the built app]:

- The screenplay reads as a screenplay (Courier, centered character and dialogue).
- Cut switching is obvious.
- Status copy distinguishes "Unsaved Draft changes", "Draft saved", "Proposal ready for review — not yet accepted", "Proposal rejected — authoritative screenplay unchanged" and "Accepted into project history as revision N."
- Restore says it affects only this screenplay and cut.
- "Ask" is gone. There's no dead affordance.

What a filmmaker would stumble on:

1. **Accept changes is invisible (A3).** The review doesn't show *what* changes (A3).
2. **Switching cuts silently discards unsaved edits** [verified: the edited action reverted with no prompt] (D4; fix with A3).
3. **Durability wording is inaccurate.** The application runs in the browser tab. A page reload returns to "Project revision 0" and discards *accepted history* as well as Drafts [verified]. "Resets when this Studio process stops" should read "resets when you reload this page (nothing is stored yet)."
4. **History isn't scoped.** It shows `Accept screenplay proposal proposal:028b5dad-…` for every revision in every cut. It needs cut-scoped entries with human descriptions ("Feature: revised Mara's line").
5. **Technical terms** in the main surface: "Authoritative projection", "In-memory M2 store", the raw status "PENDING", and "deterministic local Draft comparison." The ADR's language ("Saved" vs. "Accepted") is better and already used in the status bar.

Only the Scene document is reachable. Only Action can be added, and a removed element can only come back through Restore. That's acceptable scope for M2.

---

## 10. Test and CI assessment

**Counts [verified locally unless noted]:**

| Suite | Result | Notes |
|---|---|---|
| v2-core | **64 passed / 5 files** | 19 in `authoring.test.ts` |
| Studio unit | **2 passed** | |
| Studio e2e | **1 passed** | Run with the preinstalled Chromium; the repo's config wants a newer headless shell here |
| Legacy compat | **310 passed + 1 skipped / 52 files** | Skip = the exact Festival assertion |
| Known-data audit | Reproduces **"94 but got 85"** exactly | |
| `validate:schemas` | Reports exactly **result 077 missing `inputDigest`** | |
| `test:deploy` | **10 OK** | |

- Legacy browser (15 + 1) and the Okoye audit were not re-run locally. CI ran them green.
- **Legacy evidence is unchanged:** no data, scripts, static, media or legacy-app path is in the M2 diff. The three audited exceptions are exactly the known three; **no new exception**.

**CI at `edde978` [verified via public Actions pages]:**

- Studio and shared foundation (run 36087718419): success.
- Project-data integrity (36087718397): success. It passes by design with the audited exceptions.
- Pages validation (36087718543): success.

**Pages deployment did not occur:**

- the deploy job requires `refs/heads/master` and `promotion_authorized == 'true'` (`pages.yml` L46–59, L97, L104);
- the run shows no artifact and no deploy duration.

I couldn't read the step log line "Pages promotion authorized: false" without signing in [read + inferred]. `028a492`'s Studio run failed (lockfile) and was fixed by `edde978`.

**Quality.** The tests prove the happy-path invariants well and are mostly behavioral, not implementation-coupled: full-view equality, history length, provenance shape, sibling equality with only `projectRevision` masked. Gaps with architectural significance:

- **Concurrency:** accept‖reject, accept‖accept, unrelated-scope parallel accepts (A1, C1).
- **Draft staleness:** re-save or reopen of a Draft after a same-scope accept (A2).
- **Identity:** kind stability across restore, cuts and documents (B3); cross-document ID reuse.
- **Grammar:** non-ASCII/NUL/surrogate IDs and text; ordering vs. `C` collation (B2).
- **Rehydration integrity:** restore content ≠ target; dangling provenance; old or unknown schema versions (B5).
- **No-op restore** (D3); **ID collisions** from the factory (C6); **acceptance policy** by principal kind (C3).
- **UI:** the e2e passes with an invisible Accept button. Add a visibility or contrast assertion. The two Studio unit tests only check string constants.
- **Scale:** no test at realistic size. A single 4,000-element × 3-cut smoke test would have caught B1's cost.

---

## 11. Reconciliation with my foundation review

| Foundation concern | M2 outcome | Assessment |
|---|---|---|
| **C1 Trusted principal per history instance** | `handle(command, trustedContext)`; principal and requestId per call; IDs and time from factories | **Fixed.** Human-accepts-agent is representable (§5). New residuals: authorship loss at acceptance (**B4**), no acceptance policy (**C3**), constant requestId (**C2**). |
| **C2 Acceptance vs. rehydration** | `fromAcceptedHistory` preserves records, admits empty-op checkpoints, and never re-runs command rules | **Fixed.** A new version of the problem: rehydration *does* re-run the current **operation** reducer, which freezes semantics (**B5**). |
| **C3 Validate a private copy** | Descriptor-based materialization, then validate, then execute the copy | **Fixed** [verified with proxies and accessors]. |
| **C4 Observable ordering / equality; code-point comparison** | Equality is stricter than behavior; deterministic serialization | Order: **fixed**. Code-point comparison: **not fixed**. It's UTF-16 order under a code-point name (**B2**). |
| **C5 Complete record before append** | Yes, including restore provenance | **Fixed.** |
| **C6 Async / generic ports; don't extend M1** | Promise ports; separate authoring store; M1 untouched | **Fixed.** Residual: ports lack conditional writes (**A1**, C6/C7). "Generic" is appropriately *not* over-generalized. |
| **C7 TypeBox single source** | All authoring types are `Static<>` | **Fixed.** |
| **C8 Version semantics** | Materialized per document × version; present/removed/unknown; per-scope `documentVersion` as precondition | **Mostly fixed.** Global identity with scoped values was the recommendation; M2 has scoped values but **no anchored identity** (**B3**). The per-scope `documentVersion` is exactly the pin granularity I asked for. |
| **C9 Dead "Ask"** | Removed | **Fixed.** |
| Idempotency (D in foundation) | Still absent | Appropriately deferred to M2.5 (**C2**). |
| Trusted-clock sanity (D) | Impossible dates accepted | Still deferred; fold into **B2** since timestamps get persisted. |

---

## 12. Recommended next step

**Perform one bounded correction pass (A1–A3, then B1–B5), then proceed to M2.5 PostgreSQL.** Don't reconsider the authoring architecture.

The A items are each hours of work: conditional proposal transitions plus race tests; immutable Draft base plus a Studio fix; accept-button CSS plus an informative review. They fix claims M2 already makes. The B items are the only chance to get persisted shapes right cheaply: the record split, the ID grammar, the identity registry, authorship provenance and the versioned reducer. Each is small now and becomes a data migration plus history-rewriting problem once the first real ChangeSet is in PostgreSQL. The C items belong naturally to M2.5's transaction, idempotency and authorization work. D3's `NO_CHANGES` restore and D4's two UI truthfulness fixes are cheap enough to fold into the A pass.

---

### Appendix: probes (temporary test file, deleted; copy attached)

| Probe | Observation |
|---|---|
| P1 | IDs `element:！`, `element:😀` accepted. Stored order is UTF-16 (`😀, ！`), not code point (`！, 😀`). A store built from true code-point order is rejected. |
| P2 | NUL in text, lone surrogate in text, NUL in ID, emoji ID, 100k-character ID, NFC and NFD twins in one scope: all accepted. |
| P3 | Add `element:signal` (dialogue) → restore r0 → state `unknown` → re-add as scene-heading → accepted; history holds both kinds. Remove-then-re-add with a new kind → `INVALID_DRAFT`. |
| P4 | Same ID with a different kind across Feature/Trailer and across documents → accepted. |
| P5 | Parallel accepts in Scene and Coda → one `STORE_REJECTED` ("head changed from 0 to 1"); retry → ok. |
| P6 | accept‖reject, both orders → both report success; final `accepted`; history contains the proposal. |
| P7 | accept‖accept → one ok, one `STORE_REJECTED`; history length 1. |
| P8 | Draft re-saved with the current base after another author's same-scope accept → Proposal reverts that line; accepted. Control without re-save → `CONFLICT`. |
| P9 | Scene v3 / Coda v7: accept B then A → both ok. Proposal on v4 after a same-scope edit → `CONFLICT` (4→5). |
| P10 | Restore Feature to a Trailer-only revision → new revision, Feature `documentVersion` 0→1, identical content; pending Feature proposal → `CONFLICT`. |
| P11 | Rehydration loads: restore content ≠ target, dangling proposal/draft IDs, backwards timestamps, impossible date. Rejects: unknown field, `schemaVersion: 2`. Both ChangeSets carry `requestId: request:x`. |
| P12 | Colliding proposal ID from the factory overwrote an accepted proposal with a new pending one. |
| P13 | `agent` and `system` principals can accept. Bob accepting Alice's Draft → ChangeSet never mentions Alice. |
| P14 | Hostile inputs rejected (see §3 E); proxy traps invoked exactly once each; post-acceptance mutation has no effect; records frozen. |
| P15 | Remove action → `order` keeps its tombstone position; the element state is `removed`. |
| P16 | Clock `2026-13-45T99:99:99Z` → accepted into the ChangeSet. Clock `not-a-date` → `handle()` throws instead of returning a result. |
| Scale | 1 document × 3 cuts × 4,000 elements, 20 accepts: 1.79 MB per ProjectRevision, 1.0 KB per ChangeSet, 37.6 MB export, ~1.6 s per save/propose/accept cycle. |
| UI | Accept button `rgb(255,255,255)` on transparent over white. Unsaved edit lost on cut switch. Reload → revision 0. History shows raw proposal UUIDs. No-op restore appends revision 3. |
