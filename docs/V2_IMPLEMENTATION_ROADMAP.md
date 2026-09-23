# V2 implementation roadmap

Status: **active implementation roadmap**.

This document turns the accepted v2 architecture into an implementation sequence. It intentionally prioritizes proving end-to-end behavior over expanding the ontology.

Read `V2_ARCHITECTURE_INDEX.md` first for the architecture/document map.

## Guiding rule

> Stop expanding architecture temporarily; build through it.

New abstractions should normally be introduced only when a milestone or acceptance case demonstrates the need.

## Deployment feedback loop

Meaningful completed vertical increments should be exercised on the real Studio staging deployment when safe and when the established staging workflow permits it. Do not deploy incomplete or knowingly broken intermediate states merely to satisfy deployment frequency. Studio staging remains strictly independent from the protected festival deployment.

## Foundation correction — close review findings before M2

The September 23 Astra and Claude Opus 5.5 reviews found concrete defects and, more importantly, exposed a semantic collision in the first M1 proof. Close this bounded correction before expanding implementation.

### Required closure

- **Legacy application versus damaged project data:** treat them as separate gates. The Light Delay dataset suffered significant zero-fill data loss and committed reconstruction attempts; current HEAD is not a uniformly valid import source. See `V2_LIGHT_DELAY_RECONSTRUCTION.md`.
- **Legacy application regression:** remove/fix disposable legacy `/v2` prototype behavior that prevents the protected application from building/prerendering. Add an application build gate that can distinguish code regressions from known project-data validation failures.
- **Staging privilege boundary:** replace root-side executable loading of release-controlled `package.json` in `stage-activate.sh` with non-executing data parsing and verify the installed helper. Keep migration and activation responsibilities narrowly privileged.
- **M1 correctness:** repair restore so supported historical state is reproduced faithfully; add runtime validation/reference-integrity tests for accepted operations and serializable values; do not accept arbitrary client attribution as trusted server identity.
- **Studio save semantics:** do not display "Saved" for the current unbound `contenteditable` screenplay.
- **Semantic boundary:** implement ADR-0004 in the next contracts. ProjectRevision, story-time state, durable provisional work, and derived/operational state are distinct.

### Verification baseline

Run Studio/shared-package checks normally. For legacy checks, record separately:

1. application/type/build regressions caused by code/path/config changes;
2. known or newly discovered Light Delay project-data integrity failures.

Do not repair the entire legacy dataset merely to make this checkpoint green.

---

## Milestone 0.5 — Architecture contracts

M0.5 media/storage/export and Agent Runtime contracts remain recorded in `V2_MEDIA_AND_AGENT_RUNTIME.md`.

No object-storage vendor, external AI CLI, durable worker infrastructure, or broad media migration is required during the next milestones.

---

## Milestone 1 — ChangeSet/revision proof: correct and bound it

The existing `packages/v2-core/src/history.ts` is an in-memory proof, not yet a persistence contract.

Keep:

- semantic operations rather than arbitrary JSON Patch;
- principal attribution;
- ordered immutable accepted history;
- preconditions/conflict results;
- restore/reversion as a new accepted mutation.

Before declaring the proof complete:

- faithful restore must be tested for every state shape the proof claims to support, including absence/removal;
- malformed/unknown operations and non-serializable values must fail cleanly;
- operation references must be validated for the supported fixture domain;
- reconstruction semantics must not depend on an accidental in-memory object graph;
- the implementation must leave room for snapshots/checkpoints and replay verification without prematurely committing Studio to pure event sourcing.

The current gravity/Harlan toggles are exploratory proof controls. They must not establish that fictional story-time state is a project-global revisioned map.

---

## Repository checkpoint — integrate and execute R1/R2

After the foundation correction and M1 proof are mechanically sound, reconcile the architecture work with the active repository and execute the early application-boundary cleanup described in `V2_REPOSITORY_STRUCTURE.md`:

- R1: move the legacy application under `apps/light-delay`;
- R2: move app-local i18n/browser/build configuration;
- consolidate the runtime-contract direction into the shared core as needed;
- make `packages/v2-core` independently importable/testable rather than relying on legacy Vite configuration.

Do **not** make R3/R4 a prerequisite for M2. Light Delay data/tool relocation is bounded later because current paths/history are forensic evidence and the dataset is not ready for wholesale migration.

Do not move `static/assets` as part of this checkpoint.

---

## Milestone 2 — Application boundary + durable provisional work + authoring proof

Define the application/store interfaces before choosing durable persistence.

At minimum:

```text
ProjectStore
HistoryStore
Draft/Proposal store
ProjectStoreResolver / forProject(projectId)
transaction/application-unit boundary
```

Implement an in-memory adapter first, but design the contract so the same behavior can be persisted immediately afterward.

### Authority tiers

Implement ADR-0004:

- accepted authoritative project state;
- durable provisional Draft/Proposal/Scenario state;
- story-time semantic state;
- derived/operational state.

A Draft is durable work based on a known project revision; promoting/accepting it creates an authoritative ChangeSet. Do not design a generic branching system yet.

### Primary product proof

Prove:

```text
screenplay/document edit
 -> durable Draft
 -> semantic proposal
 -> accept/reject
 -> ChangeSet
 -> ProjectRevision
 -> projection
 -> restore
```

Use a deterministic fake proposal source if necessary. A real AI provider is not required.

Include two cuts/versions sharing stable entities but containing a deliberate version-scoped difference. Define enough version semantics to prove no sibling leakage and to distinguish inherited/absent/deliberately removed values.

### Concurrency contract

Keep project revision ordering, but allow commands to carry semantic/read-set preconditions so unrelated future mutations do not force a global-conflict model. Do not build a sophisticated collaborative merge engine yet.

### Exit criteria

- authored text actually survives through the Draft abstraction;
- "Saved" has a durable meaning;
- accepting a proposal is explicit and attributable;
- rejected proposals never alter authoritative state;
- restore faithfully restores the supported scope without deleting history;
- two cuts/versions remain isolated where intentionally different;
- Studio accesses state through application commands/queries, not persistence internals;
- tests can run cheaply against isolated in-memory stores.

---

## Milestone 2.5 — Minimal PostgreSQL durability

Persist the proven M2 contract before building durable agents or relying on Context behavior in staging.

Initial persistence:

- project identity;
- ChangeSets / project revisions;
- current projections/checkpoints needed by the slice;
- authored documents and durable Drafts/Proposals;
- command/idempotency identity where required;
- minimal project authorization;
- transactional outbox.

Use migrations from the beginning.

Keep authorization proportionate: enough to prevent project leakage and establish trusted server-side principal attribution. The full future control-plane/shard projection architecture remains deferred.

### Exit criteria

- equivalent application contract tests pass against in-memory and PostgreSQL adapters where appropriate;
- draft survives process restart;
- accepted ChangeSet + projection/head + outbox are atomic;
- retry/idempotency behavior cannot double-commit;
- project data is scoped by `project_id`;
- staging has an appropriate access boundary before it stores real writing or can spend provider money;
- backup/restore procedure is documented and exercised at least once before real project authority depends on the database.

---

## Milestone 3 — Story-time state foundation

Before Context persistence, model the distinction between authoring history and fictional state.

Introduce the smallest useful `StateChange` / temporal-anchor / `stateAt(...)` behavior needed to answer:

> What is true at this point in the story?

Start with ordinary linear state. Gravity, hatch state, occupancy/movement, or another bounded example may be used, but the state transition must be anchored to story semantics rather than to ProjectRevision number.

Do not implement a universal time-travel solver.

A bounded Light Delay fixture may be used. Do not bulk-import current Light Delay HEAD.

### Exit criteria

- two story points in the same project revision may correctly produce different world state;
- editing the project creates a ProjectRevision without being confused with fictional time passing;
- unknown/undetermined state remains representable;
- state projection carries provenance/source anchors.

---

## Milestone 4 — Dependency invalidation and Context Engine loop

Connect accepted project mutations and story-time scope to derived context.

A ContextPackage for authoring/navigation must be scoped at least by the relevant combination of:

- project revision;
- narrative/cut version;
- story/narrative anchor;
- perspective/subject when relevant.

Prefer structural retrieval for exact facts. Recompute on demand before building sophisticated invalidation caches.

### Exit criteria

- accepted semantic changes invalidate/re-resolve affected context;
- story-point changes resolve the correct story-time state without creating project revisions;
- a stale package cannot silently describe a newer project revision or wrong cut/story point;
- provenance is real/inspectable rather than illustrative;
- the authoring slice can show a contextual proposal using a bounded ContextPackage.

### Architectural checkpoint A

At this point Studio should prove ordinary authoring plus semantic assistance underneath it. Review command ergonomics, Draft/ChangeSet boundaries, version isolation, story-state scope, Context provenance, and UI intrusion before expanding.

---

## Milestone 5 — First durable Agent Runtime integration

Only after Drafts/Proposals and durable task records have a home, add one real provider adapter plus a deterministic fake.

The first agent:

- receives a typed task/context package;
- runs under the isolated Agent Runtime boundary;
- produces a proposal/artifact/diagnostics/usage/provenance;
- cannot mutate project authority directly;
- cannot double-commit after retry;
- has explicit cancellation/budget/approval behavior appropriate to the provider.

Prefer an execution/auth mode that can actually ship commercially; do not make personal interactive CLI authentication a product invariant.

No three-provider registry rollout is required yet.

---

## Milestone 6 — Media Plane persistence and resolved-edit foundation

After semantic/document persistence is proven, implement the first durable media path:

- `MediaAsset` creative identity;
- `AssetBlob` byte identity;
- N:M asset/representation/blob binding where needed;
- `StorageLocation` availability;
- provenance/rights/derivative relationships;
- S3-compatible managed storage as a location, not identity;
- selected/approved materialization policy.

Before broad export work, establish one resolved-edit abstraction shared by playback and interchange export so Studio does not preserve legacy divergence between what plays and what OTIO/Resolve receives.

Large portable exports remain asynchronous.

---

## Milestone 7 — Zao temporal/epistemic vertical slice (bounded)

Use Zao's recording as the second architecture stress test.

Exercise:
- StoryEvent chronology;
- NarrativePresentation order;
- Artifact/Representation lifecycle;
- capture/transmission/receipt/playback;
- Information;
- EpistemicEvent/state;
- audience revelation;
- provenance/context retrieval.

The system must represent a later playback of earlier captured material without classifying the scene itself as a flashback.

### Queries to prove

```text
When was the represented event?
When was the recording created/sent/received/played?
What does each relevant character know at this point?
What has the audience been shown?
Why does this character know this information?
What source material should an AI rewrite/review receive here?
```

### Exit criteria

- chronology and narrative order remain independently queryable;
- Zao can appear in later diegetic media without being physically present;
- epistemic state has explainable acquisition paths;
- Context Engine supplies character-appropriate knowledge rather than global truth indiscriminately;
- no Light-Delay-specific special case is required in the core.

---

## Architectural checkpoint B — Core validation

After both vertical slices, stop and review the architecture before broad product expansion.

The two slices deliberately stress different dimensions:

```text
Bridge slice
  world state
  spatial graph
  traversal
  occupancy
  commands/history
  persistence/RLS
  Context invalidation

Zao slice
  chronology
  narrative order
  artifacts/media
  information
  epistemic state
  semantic Context retrieval
```

Questions:
- Did the strict core remain small?
- Are roles/capabilities doing useful work rather than adding ceremony?
- Is ChangeSet granularity practical?
- Are project revisions and derived projections understandable?
- Can Context retrieval remain structural-first?
- Are persistence and tenancy concerns properly outside story semantics?
- Does Studio remain content-first and minimally intrusive?
- Which packages/bounded contexts have now earned extraction?

Do not proceed by inertia if these answers expose structural problems.

---

## Milestone 8 — Broaden Studio product surfaces

Only after checkpoint B, expand the application lenses:

```text
Write
Story
World
Navigate
Direct
Produce
Review
```

Prioritize actual filmmaking workflows rather than exposing domain objects.

Likely sequence:
- Write refinement;
- Story chronology/narrative-order surface;
- World/character/location inspector;
- Navigate visual spatial editor;
- Review/integrity findings;
- Direct/storyboard/shot planning;
- Produce scheduling/generation/media workflows.

Continue following `STUDIO_DESIGN_SYSTEM.md`.

---

## Milestone 9 — Semantic retrieval / RAG proof

Add semantic retrieval only for a task that benefits from it, such as:
- representative Sorell dialogue;
- thematically similar scenes;
- related treatment/research passages;
- character-voice rewrite context.

Start with PostgreSQL + pgvector.

Keep:
- structural retrieval authoritative for exact facts;
- embeddings rebuildable;
- SemanticRetriever provider/index-independent;
- project/revision/source filters mandatory;
- context provenance visible.

Do not add a dedicated vector database until measurements justify it.

---

## Milestone 10 — Production/generation migration

After story/world/document foundations are proven:
- ProductionScene/Setup/Shot/Take compatibility;
- GenerationSpec;
- reference requirements/budgets;
- production gates;
- asset provenance/staleness;
- provider adapters;
- animatic/playback compatibility.

Preserve current Light Delay generation and media work through adapters rather than wholesale rewrites.

---

## Scalability progression

Do not prematurely deploy this entire topology. Preserve the path:

```text
one Node + one Postgres
 -> horizontal stateless web + workers
 -> replicas/partitioning
 -> control plane + project DB shards
 -> specialized search/vector services only if measured need
```

Project remains the primary authoritative sharding/data-locality unit.

## Near-term working queue

The active queue is:

1. close the September 23 foundation-correction findings;
2. correct/bound the M1 revision proof;
3. reconcile active branches and execute R1/R2 application-boundary cleanup;
4. M2 application boundary + Draft/Proposal + screenplay authoring proof + two-version isolation;
5. M2.5 minimal PostgreSQL durability;
6. M3 explicit story-time state;
7. M4 revision/cut/story-point-aware Context loop;
8. first durable Agent Runtime adapter;
9. Media Plane persistence + resolved-edit/export foundation;
10. bounded Zao temporal/epistemic slice when it provides the next useful stress test;
11. forensic Light Delay reconstruction only when a concrete Studio milestone needs it;
12. broaden Studio from proven workflows.

### Deliberate deferrals

Do not spend the next milestones on:

- exhaustive Light Delay zero-fill reconstruction or making every legacy validator green;
- bulk import of current Light Delay HEAD;
- R3-R7 repository moves;
- `static/assets` relocation;
- universal time-travel/history semantics;
- CRDT/presence/full multi-user collaboration;
- full control-plane/sharding infrastructure;
- pgvector until a retrieval task demonstrates need;
- three-provider Agent CLI lifecycle implementation;
- broad object-storage/transcoding/export infrastructure before the first persisted media slice;
- all seven Studio lenses.

If a new architectural question arises, document only what is necessary to unblock or protect this sequence.
