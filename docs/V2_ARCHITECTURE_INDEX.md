# V2 architecture index and implementation status

Status: **restart document**. Read this first when resuming v2 work.

## Product direction

The repository is evolving from the Light Delay project-specific animatic/story tool into **Studio**, a general film-development application supporting AI-generated, live-action, animation/VFX and hybrid workflows.

Light Delay remains the primary migration/acceptance fixture.

Core UX principle:

> Develop the film normally. The model emerges underneath it.

## Decision map

- `ADR-0003-STORY-NARRATIVE-PRODUCTION-ARCHITECTURE.md` — architectural decisions and invariants.
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

Target flow:

```text
existing authoritative/compatible Light Delay sources
  -> importer/adapter
  -> ImportProposal
  -> accepted ChangeSet(s)
  -> semantic project state
  -> application queries
  -> Studio
```

Do not let hand-authored fixture duplication become permanent persistence.

The Central Access → Engineering edge in the fixture is explicitly derived from the existing location `connects[]` relationship.

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

Follow `V2_IMPLEMENTATION_ROADMAP.md`. M0.5 contracts are recorded in `V2_MEDIA_AND_AGENT_RUNTIME.md`; the current implementation begins the authoritative mutation/history vertical slice:

```text
ChangeSet / project revision
  -> semantic commands
     SetWorldState
     SetOccupancy
  -> apply/validate
  -> new immutable revision
  -> dependency invalidation
  -> Context re-resolution
  -> Studio update
  -> restore/undo as another ChangeSet
```

The current Studio state toggles are intentionally transient and must not become direct persistence writes.

After this, replace the fixture boundary with the first Light Delay importer/adapter projection.

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
