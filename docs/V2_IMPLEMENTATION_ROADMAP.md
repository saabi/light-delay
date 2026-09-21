# V2 implementation roadmap

Status: **active implementation roadmap**.

This document turns the accepted v2 architecture into an implementation sequence. It intentionally prioritizes proving end-to-end behavior over expanding the ontology.

Read `V2_ARCHITECTURE_INDEX.md` first for the architecture/document map.

## Guiding rule

> Stop expanding architecture temporarily; build through it.

New abstractions should normally be introduced only when a milestone or acceptance case demonstrates the need.

## Milestone 0 — Verify the current branch

The Studio/workspace scaffold and first shared-core slice were created through the GitHub connector and have not yet been executed in a checked-out working tree.

After pulling `architecture/v2-domain-model`:

```sh
npm install
npm run check:studio
npm run build:studio
npm run test:v2-core
npm run check:legacy
```

Also run the existing repository test suite where practical.

If `npm install` changes `package-lock.json`, inspect and commit the regenerated workspace lockfile.

### Exit criteria

- Studio dependencies install from a clean checkout.
- Studio type/check succeeds.
- Studio production build succeeds.
- v2-core tests succeed.
- Legacy check/build behavior is not unintentionally broken.
- The festival-facing legacy application remains independently runnable/buildable and its deployment path remains intact.
- Any failures are recorded/fixed before treating later milestones as mechanically proven.

---

## Festival compatibility gate

Until film-festival judging is explicitly complete, the legacy Light Delay application is a protected deployable artifact. Every milestone or cleanup change that can affect shared data, paths, assets, tooling or dependencies must preserve and verify the legacy app independently. Studio deployment must not become a prerequisite for the festival site.

## Root cleanup checkpoint

After Milestone 0 establishes a known-good baseline, execute the staged repository cleanup in `V2_REPOSITORY_STRUCTURE.md`, beginning with the legacy application move. Keep semantic/model migration separate from filesystem relocation and re-run the Milestone 0 gates after each material stage.

## Milestone 1 — ChangeSet and revision engine

Implement the smallest authoritative mutation/history path.

Initial commands:

```text
SetWorldState
SetOccupancy
```

Required concepts:
- ProjectRevision;
- ChangeSet;
- semantic operation;
- principal attribution;
- base revision;
- preconditions;
- validation;
- immutable accepted history;
- current-state projection;
- conflict result;
- restore/undo represented as a new ChangeSet.

Do not implement generic arbitrary JSON patching as the domain mutation API.

### First end-to-end behavior

Replace the Studio prototype's transient gravity and Harlan-blocker toggles with application commands.

```text
Studio action
 -> command
 -> proposed ChangeSet
 -> validate
 -> accept
 -> revision N+1
 -> current projection
```

### Exit criteria

- A world-state change creates a new revision.
- Occupancy/blocking change creates a new revision.
- Previous revisions remain reconstructible.
- A stale `baseRevision` is detected.
- Restore/undo appends history rather than deleting it.
- Studio no longer directly mutates its authoritative fixture object.

---

## Milestone 2 — ProjectStore and application boundary

Define persistence interfaces before selecting persistence behavior.

At minimum:

```text
ProjectStore
HistoryStore
ProjectStoreResolver / forProject(projectId)
transaction/application-unit boundary
```

Implement an **in-memory adapter first**.

Shared application/domain code must not depend directly on:
- Svelte/SvelteKit;
- PostgreSQL;
- filesystem layout;
- a globally imported DB client.

Preserve the future invariant:

> A project is resolved to one authoritative project store/shard at a time.

### Exit criteria

- The complete Milestone 1 flow works against an in-memory ProjectStore.
- Studio accesses state through application queries/commands, not persistence internals.
- Tests can create isolated projects/stores cheaply.
- Storage implementation can be replaced without changing domain commands.

---

## Milestone 3 — Dependency invalidation and Context Engine loop

Connect accepted mutations to derived state.

A successful ChangeSet must identify dependencies affected by its operations and invalidate/recompute only relevant projections where practical.

First complete loop:

```text
Studio
  -> command
  -> ChangeSet
  -> revision N+1
  -> world projection invalidated/updated
  -> navigation result invalidated
  -> ContextPackage re-resolved
  -> Studio view model updates
```

The Context Engine remains provider-independent; no LLM is needed for the navigation answer.

### Exit criteria

- Changing gravity changes route context without manual refresh/reconstruction.
- Adding/removing Harlan's blocker changes reachability.
- ContextPackage records the project revision it describes.
- A stale cached package cannot silently describe a newer revision.
- Context provenance remains inspectable.

### Architectural checkpoint A

At this point Studio should be a small genuine implementation, not merely a UI over fixtures.

Review:
- command ergonomics;
- ChangeSet granularity;
- query/view-model boundary;
- invalidation complexity;
- UI intrusion;
- whether any abstraction is premature.

Fix architectural friction before adding PostgreSQL.

---

## Milestone 4 — PostgreSQL persistence foundation

Implement a PostgreSQL adapter behind the proven store/application interfaces.

Initial persistence should cover:
- project identity;
- revisions;
- ChangeSets/operations;
- current projections needed by the vertical slice;
- local authorization grants needed for RLS;
- transactional outbox.

Use migrations from the beginning.

Initial deployment may use one PostgreSQL database even though schemas/interfaces remain shardable.

### PostgreSQL direction

Use PostgreSQL for:
- authoritative semantic/history data;
- projections;
- documents/metadata;
- full-text retrieval;
- later pgvector embeddings.

Use object storage for large image/video/audio/media bytes.

### Exit criteria

- The same application tests can exercise PostgreSQL and in-memory adapters where appropriate.
- ChangeSet + projection + outbox write atomically.
- Project data is scoped by `project_id`.
- Normal domain code does not know which physical DB/shard is in use.
- Reconstruction/current projection semantics match the in-memory proof.

---

## Milestone 5 — RLS and shardable authorization

Implement the security boundary described in `V2_SCALABILITY_AND_STORAGE.md`.

Even if control and project data initially share one physical PostgreSQL deployment, model the logical separation:

```text
control-plane membership = source of truth
project-shard grant       = local authorization projection
```

Project queries run inside transaction-local request context, conceptually:

```text
SET LOCAL app.principal_id
SET LOCAL app.project_id
```

RLS uses only locally available grant facts. Do not make normal RLS depend on synchronous cross-database membership lookup.

### Required tests

- user can read authorized project;
- user cannot read another project;
- missing application `WHERE project_id` still cannot leak rows;
- unauthorized write fails;
- pooled connection cannot inherit prior request identity;
- revoked local grant fails;
- service/worker principal behavior is explicit;
- runtime DB role cannot bypass RLS.

### Exit criteria

- RLS is verified as defense in depth.
- Application authorization and DB authorization agree on representative cases.
- Future control-DB/project-shard separation does not require rewriting policies around remote joins.

---

## Milestone 6 — Replace the Light Delay fixture with import/projection

The hand-authored `light-delay-fixture.ts` is transitional.

Build the first deterministic adapter/importer from existing Light Delay authoritative/compatible sources.

Initial target:
- Celestial Ardor;
- Bridge;
- meal table;
- crew-stations navigation waypoint;
- Central Access;
- Service Cylinder;
- Engineering;
- gravity state;
- service hatch;
- navigation edges/predicates;
- Sorell/Harlan occupancy needed by the proof.

Flow:

```text
existing Light Delay data
 -> parse/map
 -> ImportProposal
 -> reviewed/accepted ChangeSet(s)
 -> semantic project state
 -> same application queries
 -> same Studio behavior
```

Do not silently reconcile ambiguity.

### Exit criteria

- The manually duplicated fixture can be removed or retained only as a test fixture.
- Source provenance identifies the legacy source records.
- The existing 1g/microgravity/Harlan acceptance cases still pass.
- Studio behavior does not depend on legacy JSON shape.

---

## Milestone 7 — Zao temporal/epistemic vertical slice

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

The active queue is therefore:

1. local build/test verification;
2. ChangeSet/revision engine;
3. in-memory ProjectStore/application boundary;
4. dependency invalidation + Context re-resolution;
5. PostgreSQL adapter + migrations + outbox;
6. RLS/shardable authorization;
7. Light Delay importer replacing fixture authority;
8. Zao temporal/epistemic slice;
9. architectural checkpoint;
10. broaden Studio.

If a new architectural question arises before these are complete, document only what is necessary to unblock or protect this sequence.
