# V2 migration plan

Status: **proposed**. No v2 runtime migration is authorized by this document alone.

## Goals

- Evolve the repository without discarding working Light Delay narrative, production, generation or media infrastructure.
- Use Light Delay selectively as a provenance-aware migration/acceptance source for a general multi-project product; do not assume current HEAD is a valid bulk-import fixture.
- Preserve stable IDs and provenance where possible.
- Avoid invalidating media merely because the schema moves.
- Keep existing application behavior operational where practical through compatibility projections until replacement surfaces are proven.
- Separate legacy application compatibility from known legacy project-data damage; see `V2_LIGHT_DELAY_RECONSTRUCTION.md`.

## Phase 0 — Architecture freeze and fixtures

1. Ratify ADR-0003 and the v2 domain model.
2. Treat the September 16 location v2 model as the baseline spatial fixture.
3. Freeze representative acceptance fixtures:
   - Zao recording/playback;
   - Ardor bridge 1g vs microgravity routes;
   - Harlan blocker;
   - multi-level elevator;
   - mobile Ardor host;
   - existing master facts/knowledge/action requirements;
   - generation reference-budget examples.
4. Treat the existing `/v2` route as a disposable design prototype. Scaffold the production Studio client as a separate app in the same repository, sharing application/domain packages rather than legacy product UI.
5. Start the Studio shell and first vertical-slice fixtures in parallel; do not bind it to raw v2 persistence shapes.

Exit: acceptance scenarios are unambiguous enough to reject bad schemas.

## Phase 1 — Runtime-contract proof + new UI shell

Implement the small TypeBox-based contract proof described in `V2_RUNTIME_CONTRACTS.md` and the new application shell described in `V2_UI_AND_VERTICAL_SLICE.md`.

Prove serialize/deserialize/introspect/validate behavior before expanding the contract library. Build UI against application query/view-model fixtures rather than raw persistence. The production target is `apps/studio`; legacy Light Delay remains independently runnable during migration. Follow `STUDIO_DESIGN_SYSTEM.md`.

Exit: the contract proof passes its hard cases and the new v2 shell can render the first spatial fixture without depending on the legacy component hierarchy.

## Phase 2 — Introduce semantic core alongside existing files

Using the proven contract layer, add machine contracts for stable references, Entity, Role, Capability, Relationship, WorldContext, StoryEvent, TemporalPlacement, NarrativePresentation, ChangeSet and Finding.

Do not move shots/takes or delete current catalogs.

Build adapters that expose current characters/locations/vehicles/objects as candidate v2 entities with roles/capabilities while retaining source IDs.

Exit: current data can be projected into the new core without changing existing routes.

## Phase 3 — Bounded evidence adapter / reconstruction proof

Do **not** bulk-import current Light Delay HEAD.

The legacy project suffered significant zero-fill data loss followed by committed reconstruction attempts. When Studio actually needs Light Delay beyond bounded fixtures, first create a forensic/evidence inventory as described in `V2_LIGHT_DELAY_RECONSTRUCTION.md`.

A later bounded adapter may start from high-authority/recoverable sources such as:
- master narrative / master outline authority records;
- characters and locations referenced by that authority;
- selected screenplay scenes;
- selected storyboard/animatic structures;
- Git-history versions needed to adjudicate a specific source.

The flow is:

```text
legacy evidence + Git history
 -> evidence/recovery manifest
 -> extraction / interpretation
 -> ImportProposal
 -> review
 -> accepted ChangeSet(s)
```

Ambiguity, contradiction, and missing information may remain explicitly unknown. Reconstructed HEAD files do not automatically outrank surviving pre-loss evidence.

**This phase is deferred until a Studio milestone needs it.** It is not a prerequisite for M2, persistence, or the first authoring slice.

Exit when a deliberately bounded Light Delay subset can be reconstructed with traceable provenance without assuming global referential integrity.

## Phase 4 — Chronology and narrative presentation

Introduce Story Timeline and Narrative Order projections.

Convert/associate master and authorized derivative scenes with StoryEvents and NarrativePresentations. Use the Zao recording as the first mediated-representation fixture.

Exit: the system can answer chronology versus presentation queries without relying on scene order.

## Phase 5 — Spatial runtime and navigation

Generalize current location v2 into role/capability-based spatial hosting.

Implement:
- effective location through mobile carriers;
- actor-aware pathfinding;
- world-state predicates;
- occupancy/blockers;
- inventory/capability requirements;
- segmented multi-level traversal;
- abstract-distance range portals.

Keep compatibility with current location IDs and still-reference rules.

Exit: Light Delay navigation fixtures pass, including 1g/microgravity and Harlan blocking.

## Phase 6 — Documents and narrative products

Represent authored documents as first-class artifacts and migrate current outline/script products without forcing live inheritance.

Map ADR-0001 cuts to NarrativeVersions/documents/productions while retaining lineage/sourceRefs.

ADR-0002 remains the Light Delay authority rule until an explicit ChangeSet migrates authority.

Exit: master, Festival-master, trailer-master and archived products have explicit v2 status/provenance.

## Phase 7 — Production boundary

Introduce ProductionScene/Setup/Shot/Take links while providing a compatibility projection to current ScriptFile consumers.

Move conceptually, not necessarily physically in one release:
- shots/takes;
- visual stretches;
- production gates;
- selected takes;
- media registration.

Exit: current animatic/movie/generation behavior works through compatibility selectors with no asset-ID churn.

## Phase 8 — GenerationSpec compilation

Wrap current prompt/reference planning behind provider-neutral GenerationSpec.

Preserve:
- still vs video reference policies;
- identity/location/object references;
- reference budgets;
- consolidation diagnostics;
- production gates;
- provider snapshots;
- registered outputs.

Raw provider prompts become derived artifacts.

Exit: at least one current generation plan round-trips through GenerationSpec without semantic loss.

## Phase 9 — Integrity engine

Wrap existing validators in common Finding output before replacing them.

Add incremental validators for:
- chronology;
- knowledge;
- spatial reachability;
- world/profile rules;
- provenance/staleness.

Do not convert stylistic preferences into hard errors.

Exit: existing validation coverage is retained and new acceptance scenarios produce deterministic findings.

## Phase 10 — Mutation history and collaboration (superseded in implementation order)

The active implementation roadmap moved mutation history much earlier than this original migration sequence. This section remains descriptive of migration responsibilities, not current milestone order.

Route authoritative writes through semantic commands/ChangeSets.

Add revision numbers, snapshots, principal attribution, agent execution provenance, conflict detection and restore-as-new-revision.

Initially, Git remains repository history; project ChangeSets become product/domain history.

Exit: two concurrent edits can be classified as commuting or conflicting, and any project revision can be reconstructed.

## Phase 11 — Multi-user/multi-project persistence

Introduce Workspace/Project tenancy and authorization without embedding tenant concerns in story IDs.

Separate:
- authoritative semantic/history store;
- snapshots;
- blob/media storage;
- derived indexes/caches.

Exit: a user can belong to multiple projects/workspaces without data leakage; project history remains attributable.

## Phase 12 — Import/reconstruction UX and agent runtimes

Expose staged import/reconstruction:
source/evidence -> discovery -> parser/AI interpretation -> ImportProposal -> review -> ChangeSet.

For damaged historical projects, source provenance and uncertainty are first-class; import must not assume HEAD is authoritative.

Expose a common agent application API with adapters for:
- hosted model APIs;
- MCP-assisted clients;
- local spawned CLI agents.

Agents do not mutate persistence directly.

Exit: Light Delay can be imported through the same public mechanism intended for arbitrary projects.

## Phase 13 — Progressive authoring UX

Build familiar artifact-first surfaces:
- idea/logline/treatment/screenplay;
- timeline/narrative order;
- world/location navigator;
- validation/issues;
- production/shot planning;
- media/generation;
- history/diff.

Hide advanced graph detail until requested or consequential.

Exit: a simple linear short can be created without configuring profiles, graphs or navigation manually, while advanced projects can expose those controls.

## Migration invariants

1. Never infer deletion from absence.
2. Never silently replace a newer authority with legacy material.
3. Preserve source provenance.
4. Stable IDs survive schema movement where identity is unchanged.
5. Schema migration alone never grants permission to regenerate media.
6. Derived artifacts become stale rather than silently rewritten.
7. Import ambiguity is visible.
8. Human and agent mutations use the same application boundary.
9. History is append-only; restoration is a new mutation.
10. Existing Light Delay behavior remains available where recoverable until its replacement passes acceptance.
11. Known legacy corruption/reconstruction status is provenance, not noise to normalize away.
12. Unknown is a valid reconstruction result; never fabricate missing legacy facts to make an import complete.
