# V2 architecture index and implementation status

Status: **restart document**. Read this first when resuming v2 work.

## Product direction

The repository is evolving from the Light Delay project-specific animatic/story tool into **Studio**, a general film-development application supporting AI-generated, live-action, animation/VFX and hybrid workflows.

Light Delay remains an important migration/acceptance source, but its legacy dataset is known to have suffered zero-fill data loss and subsequent reconstruction attempts. It is evidence, not a uniformly trustworthy import source; see `V2_LIGHT_DELAY_RECONSTRUCTION.md`.

Core UX principle:

> Develop the film normally. The model emerges underneath it.

## Decision map

- `ADR-0003-STORY-NARRATIVE-PRODUCTION-ARCHITECTURE.md` — architectural decisions and invariants.
- `ADR-0004-AUTHORING-STORY-STATE-AND-PROVISIONAL-WORK.md` — separates project revision history, story-time state, durable provisional work, and derived/operational state.
- `V2_DOMAIN_MODEL.md` — concrete semantic/domain model.
- `V2_RUNTIME_CONTRACTS.md` — TypeBox/schema contract direction.
- `V2_TEMPORAL_AND_EPISTEMIC.md` — time, history, entity continuity, information and knowledge semantics.
- `V2_CONTEXT_ENGINE.md` — provider-independent retrieval/context architecture.
- `V2_UI_AND_VERTICAL_SLICE.md` — UI behavior and first Light Delay end-to-end slice.
- `STUDIO_DESIGN_SYSTEM.md` — professional/minimal visual system and intrusion budget.
- `V2_ACCEPTANCE_SCENARIOS.md` — hard cases schemas/services must survive.
- `V2_MIGRATION_PLAN.md` — staged migration.
- `V2_IMPLEMENTATION_ROADMAP.md` — active build sequence, milestone exit criteria and architecture checkpoints.
- `V2_REPOSITORY_STRUCTURE.md` — target monorepo/root structure and staged cleanup after the Milestone 0 baseline.
- `V2_DOCUMENTATION_STRUCTURE.md` — target separation of Studio V2, repository-wide, Light Delay project and legacy/archive documentation.
- `V2_DEPLOYMENT_AND_ENVIRONMENTS.md` — local/staging/festival environment separation and opt-in Linode staging deployments.
- `V2_SCALABILITY_AND_STORAGE.md` — scaling, sharding, Postgres/pgvector, control/data planes and shard-local RLS.
- `V2_MEDIA_AND_AGENT_RUNTIME.md` — M0.5 media identity/storage/export and Agent Runtime/CLI contracts.
- `V2_LIGHT_DELAY_RECONSTRUCTION.md` — legacy data-loss/reconstruction policy and future forensic-import boundary.
- `reviews/2026-09-23-studio-architecture-review.md` and `reviews/2026-09-23-studio-second-review-claude.md` — independent reviews that motivated the September 23 foundation correction; useful evidence, not architecture authority.

Earlier ADR-0001/0002 remain relevant to Light Delay products/authority during migration.

## Application boundary

Studio is a **separate SvelteKit app in the same repository**, not a permanent `/v2` route inside the legacy product.

```text
apps/studio          new product UI
legacy root app      current Light Delay compatibility/reference UI
packages/v2-core     current shared application/domain proof
src/lib/v2           earlier contract/context proof code during migration
```

The existing `/v2` route is a disposable design prototype.

Svelte/UI dependencies must not leak into shared domain/application logic.

Share domain behavior aggressively; share generic UI deliberately; do not share legacy product UI merely because it exists.

Do not prematurely create a package for every bounded context. Extract when boundaries are proven.

## Current implementation

Implemented on branch `architecture/v2-domain-model`:

- architecture documentation and acceptance catalogue;
- TypeBox contract proof;
- temporal/history contracts;
- entity continuity and EpistemicEvent contracts;
- provider-neutral Context Engine interfaces;
- separate `apps/studio` SvelteKit scaffold;
- Studio professional/minimal design baseline;
- `packages/v2-core` deterministic world/navigation vertical slice;
- Light Delay Bridge fixture using current location/nav semantics;
- route/pathfinding queries;
- Context Package assembly for navigation;
- Studio view model consuming shared core;
- Studio Context inspector showing Sorell → Engineering reachability;
- test cases for 1g safe route, microgravity direct crossing, and Harlan blocker;
- semantic ChangeSet/revision proof with immutable projections, preconditions, conflicts and restore-as-new-history;
- Studio prototype controls routed through the in-memory revision engine.

## Important transitional debt

`packages/v2-core/src/light-delay-fixture.ts` is a **fixture, not new authority**.

Do not replace it by bulk-importing current Light Delay HEAD. The legacy dataset suffered significant zero-fill data loss, and many affected files have committed reconstruction attempts. Future Light Delay migration begins with a provenance-aware forensic inventory when a product milestone justifies it.

The intended eventual flow is:

```text
legacy evidence + Git history
  -> forensic/evidence manifest
  -> extraction / interpretation
  -> ImportProposal
  -> reviewed/accepted ChangeSet(s)
  -> semantic project state
```

Until then, bounded fixtures may remain test fixtures. The Central Access → Engineering edge is explicitly derived from the existing location `connects[]` relationship and does not establish authority for the rest of legacy HEAD.

The M1 history proof also exposed a semantic boundary that must be corrected before persistence: project revision history, fictional story-time state, and durable provisional work are distinct. See ADR-0004.

## Verification status

The workspace and Studio Node deployment path have been build-verified in a checked-out working tree. Studio staging has now been exercised on the Linode host through the protected staging workflow; the festival Pages deployment remains independent.

Before considering the scaffold mechanically verified:

```text
npm install
npm run check:studio
npm run build:studio
npm run test:v2-core
npm run check:legacy
```

Regenerate/commit `package-lock.json` after workspace installation if it changes.

## Immediate next milestone

Follow `V2_IMPLEMENTATION_ROADMAP.md`. Before M2 begins, close the September 23 foundation correction:

1. separate legacy application/build compatibility from known Light Delay project-data integrity failures;
2. remove/fix disposable legacy `/v2` prototype behavior that breaks the protected app build;
3. fix the staging activation privilege-boundary issue identified by both independent reviews;
4. repair M1 restore/runtime-validation correctness for its supported proof domain;
5. stop presenting unsaved Studio screenplay text as saved;
6. implement ADR-0004's boundary in the M2 contracts rather than persisting the current exploratory state model;
7. then execute the early R1/R2 application-boundary reorganization before broad M2 implementation.

The first product proof after the application boundary is ordinary authoring: durable screenplay/document work -> semantic proposal -> explicit acceptance -> ChangeSet -> ProjectRevision -> restore, with two versions/cuts proving isolation. Story-time state is then made explicit before Context Engine persistence.

## Next major slice

Zao's recording:
- StoryEvent chronology;
- Artifact/Representation lifecycle;
- media playback versus flashback;
- epistemic/revelation state;
- narrative order versus chronology;
- Context Engine retrieval.

## Database status

Database/storage technology is intentionally not yet fixed by ADR-0003. Required conceptual stores are:
- authoritative semantic/history store;
- snapshots/materialized projections;
- document/full-text retrieval;
- rebuildable vector/embedding index;
- blob/media storage.

Current direction: PostgreSQL + pgvector + object storage initially. Design for a future control-plane DB plus project-data shards. Shard RLS uses locally projected grants; it does not synchronously join/query the control database. Vector retrieval is a derived index, never project authority.
