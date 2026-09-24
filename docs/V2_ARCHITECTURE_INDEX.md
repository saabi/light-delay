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
- test cases for the 1g route, the microgravity fixture scenario, and Harlan blocker (the current equal-cost graph selects the same route in both gravity settings);
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

## Verification status — pre-M2 integration checkpoint (2026-09-24)

Foundation/M1/R1/R2 and the pre-M2 corrections are on implementation/foundation-r1-r2. Current master at c2105fc is integrated by merge commit 22aa764; implementation remains unmerged into master. The review commit is included. refactor/move-legacy-app remains an ancestor with no unique work.

The relevance report inventories Light Delay project material. Studio/V2 architecture, Studio design-system, ADR-0003/0004, and review records are excluded because they cannot be judged against the Light Delay master outline. The generated report is regenerated from that scope.

The application compatibility gate runs the complete unit suite and browser suite by default. It skips only the exact 94-versus-90 Festival shot-count assertion and exact Okoye voice-copy browser assertion under an explicit compatibility environment flag. The project-data audit runs both assertions individually, requires the same known failure symptoms, and fails if either changes. validate:schemas also reports and quarantines only the exact missing-inputDigest error in the newly added 077 singleton result. All other schema errors fail normally.

The 077 entry is a singleton Seedance output whose own notes say it is not a visual-stretch job. The shared production/runs binding nevertheless applies the visual-stretch result schema, which requires inputDigest. The ready-run source and digest are unavailable in the repository; a digest will not be invented. This is a known production-record/schema mismatch from current master and is surfaced by the data audit.

Microgravity navigation remains a bounded fixture test only. Both edges have equal cost, so the current resolver returns the same route for 1g and microgravity. The test does not establish a distinct microgravity crossing.

Verification on the integrated line: 45 v2-core tests; Studio check/build; legacy check; complete legacy application unit suite with 310 passing and one explicit data exception on LFS; 15 browser compatibility tests; normal and Pages builds; schema/data/lifecycle, generated, causal, docs and translation checks; deployment filesystem tests and package smoke. The project-data workflow logs its three exact known records while failing on any new or changed issue. No Pages or Linode deployment occurred. Protocol-2 helper installation remains pending.
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
