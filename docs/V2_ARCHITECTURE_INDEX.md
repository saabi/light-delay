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
apps/light-delay     protected Light Delay compatibility/reference UI
packages/v2-core     current shared application/domain proof
packages/v2-core/src/contracts  shared TypeBox and Context contract proofs
```

The disposable legacy `/v2` prototype has been removed; it previously broke prerendering.

Svelte/UI dependencies must not leak into shared domain/application logic.

Share domain behavior aggressively; share generic UI deliberately; do not share legacy product UI merely because it exists.

Do not prematurely create a package for every bounded context. Extract when boundaries are proven.

## Current implementation

Implemented on `architecture/v2-domain-model`, with the foundation corrections on `implementation/foundation-r1-r2`:

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
- exploratory Studio controls are transient and do not append authoring history; the editor explicitly says it is not saved;
- faithful absence/removal restore, runtime TypeBox command validation, fixture reference integrity and runtime-owned principal attribution;
- independent built/importable core package and relocated legacy application/i18n/browser configuration (R1/R2);
- separate Studio, legacy compatibility and project-data CI jobs;
- protocol-2 staging finalization and activation helpers, with host installation still pending.

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

The corrected M1 proof preserves the semantic boundary required before persistence: project revision history, fictional story-time state, and durable provisional work are distinct. See ADR-0004.

## Verification status — foundation checkpoint (2026-09-24)

Repository corrections, bounded M1, and R1/R2 are implemented on `implementation/foundation-r1-r2`, based on `architecture/v2-domain-model` at `5a5c22f`. The stale relocation branch was already an ancestor and had no unique relocation work. Master remains separate (two production commits since the common ancestor); no production branch was merged or rewritten.

Verified locally:

- clean lockfile install;
- core type-check/build and direct Node package import;
- 45 shared/core tests, including the relocated runtime-contract tests;
- Studio check and production build;
- legacy check, normal production build, and Pages build with `BASE_PATH=/light-delay`;
- 47 legacy compatibility tests;
- 15 application browser tests covering landing/localization, routing, responsive navigation, Movie controls and return-to-editor position (wait for static-page hydration);
- 10 Linux deployment filesystem tests, shell syntax checks, and isolated packaged-release install/start/health smoke.

The full legacy suite has ten failures both before and after relocation in sparse checkouts: nine depend on omitted media; one asserts 94 Festival-master shots against 90 in the committed dataset. The September 16 changelog records the 94 → 90 joins. These are reported separately, not silently suppressed or repaired. Current `validate:data`, `validate:schemas` (75 schema files), and generated schema-type checks pass. The local documentation-link check reports four references into the deliberately omitted `higgsfield-uploads/` tree; the older review's missing-inputDigest failure does not reproduce. Passing validators do not erase the reconstruction provenance policy.

Linux CI on Node 24.21.0/npm 11.19 verifies core/Studio/deployment independently. With LFS hydrated, the full legacy unit suite passes 310/311: only the pre-existing 94-versus-90 shot-count assertion fails. Documentation and translation validation pass in that full checkout. `generated:check` stops at stale `docs/MASTER_RELEVANCE_REPORT.md`, reproduced on unchanged architecture HEAD as well. The full browser suite also retains an old Okoye voice-copy assertion (including wording absent from unchanged `data/voice-profiles.json`); that test runs explicitly in the project-data audit. None of these assertions is deleted or used to rewrite narrative evidence.

Local media is deliberately sparse, so this is application compatibility verification, not full media completeness certification. CI Pages retains LFS checkout. No deployment or Linode helper installation was performed. Protocol-2 host setup remains an explicit deployment prerequisite in `V2_DEPLOYMENT_AND_ENVIRONMENTS.md`.

Commands:

```text
npm ci
npm run check:v2-core
npm run test:v2-core
npm run check:studio
npm run build:studio
npm run check:legacy
npm run test:legacy:compat
npm run build:legacy
npm run validate:project:light-delay
npm run test:legacy             # includes live project/media assertions
npm run test:deploy             # Linux / Python 3
```

## Immediate next milestone

Start M2 in `V2_IMPLEMENTATION_ROADMAP.md`: application/store contracts and an in-memory document/Draft/Proposal slice, explicit acceptance, faithful scoped restore, and two-version isolation. M1 remains a bounded fixture proof, not a persistence schema or story-time engine. Its command schema is `packages/v2-core/src/history-contracts.ts`; principal, timestamp and ChangeSet identity come from trusted runtime configuration, never command content. A same-projection restore still appends an attributable checkpoint. Snapshots are immutable; JSON-roundtripped operations are tested as a reconstruction oracle. Durable storage, idempotent retry, finer concurrency, and version semantics belong to M2/M2.5.

Do not begin R3/R4, bulk Light Delay import, story-time projection, agents or media infrastructure merely because the application boundary is now clean.

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
