# ADR-0003: Story, narrative, cinematic language, production, and project history architecture

- **Status:** Proposed
- **Date:** 2026-09-20
- **Decision owners:** project maintainers
- **Extends:** `ADR-0001-MULTI-SCRIPT-CONTINUITIES.md`
- **Preserves:** `ADR-0002-MASTER-NARRATIVE-AUTHORITY.md` for the current Light Delay project during migration
- **Related:** `docs/V2_DOMAIN_MODEL.md`, `docs/V2_MIGRATION_PLAN.md`, `docs/V2_ACCEPTANCE_SCENARIOS.md`, `docs/production/LOCATION_HIERARCHY_DRAFT.en.md`

## Context

The repository has evolved from a static animatic into two increasingly capable systems:

1. a story system: master outline, causal facts, knowledge events, action requirements, derived cuts, source references, continuities and editorial lifecycle;
2. a production system: scenes, shots, takes, visual stretches, reference assets, generation plans, provider constraints, production gates and media.

The current `ScriptFile -> acts -> scenes -> beats -> cues -> shots -> takes` hierarchy made this evolution possible, but now conflates story structure, screenplay expression, cinematic realization and production. It also makes concepts such as chronology versus presentation order, diegetic recordings, nonlinear narrative, mobile spatial hosts, non-exclusive entity roles and multi-user mutation history difficult to represent without special cases.

The September 16 location model already demonstrates the architectural direction to preserve: containment, circulation, portals, proximity, navigation, world state and occupancy are separate concerns. Containment does not imply reachability.

The intended product is no longer only Light Delay. It should support multiple projects and users, arbitrary imports, live action, animation, VFX, AI-generated and hybrid production, while allowing simple projects to remain simple.

## Decision

### 1. Use a strict semantic core with extensible roles, capabilities and profiles

The universal core is deliberately small:

```text
Entity
Event
State
Relationship
Artifact
Location
Agent
Information
NarrativePresentation
Document
ProductionElement
Asset
```

Concrete concepts such as character, vehicle, dragon, transporter, recording, spell, spacecraft or clue are expressed through roles, capabilities, project vocabulary and profile modules rather than mutually exclusive top-level types.

An entity may therefore simultaneously be a character, vehicle, carrier and spatial host. A person may carry inventory without becoming a location. A dragon may be an agent, character, mobile carrier, rideable vehicle and spatial host where appropriate.

Core schemas remain strict. Extensions are namespaced, versioned and may carry declarative validation rules and UI hints. Unknown extensions must remain round-trippable.

### 2. Separate world, story, narrative presentation, documents, cinematic language, production and media

The target conceptual layers are:

```text
WORLD
  entities, relationships, capabilities, spatial graph, world contexts, states, rules

STORY / FABULA
  events, chronology, causality, facts, knowledge, state transitions

NARRATIVE
  versions, presentation order, revelation, perspective, represented material

DOCUMENTS
  logline, synopsis, beat sheet, step outline, treatment, scriptment, screenplay,
  production script and other authored artifacts

CINEMATIC LANGUAGE
  camera/edit/sound/color grammar, motifs, transitions, scoped treatments

PRODUCTION
  scenes, setups, shots, takes, generation specifications, production plans

MEDIA
  references, stills, video, audio, VFX, edits and deliverables
```

No one layer silently owns facts that belong to another.

### 3. Separate chronology from presentation order

`StoryEvent` records what happens in a world context and its temporal relations. `NarrativePresentation` records when and how the audience encounters an event, representation or information.

Temporal placement must support absolute, relative, ordinal, interval, simultaneous, before, after, during and unknown relations. It must not require a global 3D or clock coordinate system.

This permits flashbacks, flash-forwards, parallel narratives, repeated events, memories, simulations, delayed communications and withheld information without rewriting story chronology.

### 4. Represent persistent diegetic artifacts and mediated representations explicitly

A recording is not a flashback merely because it depicts an earlier event.

A `StoryEvent` may create an `Artifact`; an artifact may carry `Information` or a representation; later events may transmit, receive, store, alter or present it. Presentation mode is orthogonal to the time represented.

This is required for Light Delay's Zao recording and generalizes to letters, surveillance footage, news broadcasts, live calls, prophecies, documents and fictional media.

### 5. Model reality/world contexts separately from truth and reliability

Events belong to a `WorldContext` (actual world, imagined scenario, simulation, dream, alternate timeline, story-within-story, etc.). Contexts may nest.

Whether a statement or representation is true, false, uncertain, biased or unreliable is a separate concern. A remembered event may be accurate; an event in the actual context may be falsely reported.

### 6. Preserve authored documents as first-class artifacts

The semantic graph is not a replacement for authored prose. Loglines, treatments, screenplays and similar documents retain expression, formatting, revision identity and provenance.

Documents may project from or contribute proposed changes to semantic state, but transformations are explicit and track dependencies. Generated or synchronized derivatives can become stale; they do not silently overwrite authored authority.

### 7. Generalize the existing spatial model rather than replace it

Preserve the proven separation between:

- containment/hosting;
- circulation;
- portals;
- proximity;
- navigation;
- world-state predicates;
- dynamic occupancy.

Containment never implies reachability.

Traversal is evaluated against actor capabilities, carried inventory, world state, occupancy/blockers, traversal rules and costs. Navigation may use non-shootable waypoints.

Mobile hosts/carriers propagate contained occupants and inventory according to explicit containment/carriage relationships. Proximity may use abstract authored distances; XYZ coordinates are optional, never required.

Multi-level circulation must support segment-level traversal so an intermediate deck or shaft segment can block passage without forcing every level to become a cinematic location.

Portals remain general enough for doors, views, corridors, transporters and wormholes. Dynamic portals such as transporters may compute reachable destinations from range plus proximity rather than fixed destinations.

### 8. Separate cinematic language from narrative semantics

A structural relation such as `FLASHBACK`, `DIEGETIC_MEDIA`, `MEMORY` or `SUBJECTIVE` must not encode a visual style.

Cinematic language supplies optional scoped treatments: camera conventions, edit grammar, sound behavior, color, motifs and transitions. Scope resolves from project/world/version/sequence/scene/presentation/shot with explicit local overrides.

### 9. Move shots and takes conceptually out of screenplay structure

A screenplay scene may be realized by zero, one or many setups and shots. A shot may cover multiple narrative beats; a master shot may cover most of a scene. Therefore shots are production elements linked to narrative/screenplay units, not children whose identity depends on a screenplay beat.

Compatibility projections may expose the current `ScriptFile` shape during migration.

### 10. Compile provider prompts from structured generation specifications

AI production uses a provider-neutral `GenerationSpec` containing subject, entities, location, story/world state, wardrobe, lighting, camera, composition, action, cinematic grammar, continuity requirements, identity/location/object references and negative constraints.

Provider adapters compile disposable prompts/packages for Higgsfield, Seedance, Veo, Sora or future providers. Existing reference-budget, still/video reference separation and production gates remain valuable and migrate behind this contract.

### 11. Treat validation as a project integrity engine

Validators emit a common `Finding` contract and may cover:

- structural/schema integrity;
- canon and world rules;
- chronology and causality;
- knowledge/revelation;
- spatial reachability and continuity;
- narrative structure;
- cinematic grammar;
- screenplay/document consistency;
- production feasibility;
- generative/reference requirements;
- assets/rendering;
- versioning/provenance/staleness.

Severity/status distinguish at least `ERROR`, `WARNING`, `STALE`, `MISSING`, `STYLE` and `INFO`. Preferences and cinematic conventions are not hard errors unless a project explicitly promotes them.

### 12. Use Project Profiles as composable configuration

A Project Profile may contribute vocabulary/ontology, world assumptions, validation rules, cinematic-language presets, document/workflow defaults, production-method defaults and generation/reference policies.

Profiles compose and may be scoped. A project may combine Narrative Film + Hard Science Fiction + Mystery + Nonlinear Narrative + AI-heavy Production; a single sequence or presentation may add Fantasy without changing the entire story world.

Profile resolution is deterministic and inspectable: inherited modules + additions - disabled modules + explicit overrides.

### 13. Preserve independent narrative products while separating them from history branches

ADR-0001 remains correct that trailers, cuts and adaptations are authored products rather than runtime filters. V2 generalizes these as `NarrativeVersion` plus their authored documents/productions.

A project-history branch is different: it is an experimental line of mutations that may later merge without becoming a narrative product.

### 14. Make all authoritative mutations semantic, attributable, immutable and reconstructible

Every accepted authoritative mutation is a `ChangeSet` against a base project revision. A ChangeSet contains semantic operations, author/principal, intent, provenance and optional assumptions/rationale/agent execution.

Examples include `CreateEntity`, `UpdateEntity`, `MoveEntity`, `TransferInventory`, `CreateEvent`, `SetState`, `ConnectLocations`, `SetPortalState`, `UpdateDocument`, `CreatePresentation`, `CreateShot`, `RegisterAsset` and `SupersedeArtifact`.

Current state is a projection of immutable history, accelerated by snapshots. Large media binaries live in blob storage; history records identity, hashes, metadata and relationships rather than embedding bytes.

Restoring an old state creates a new ChangeSet. History is not rewritten.

### 15. Use the same application boundary for humans and agents

Human UI actions, API clients, MCP clients, hosted LLMs and spawned local agents/CLIs must ultimately propose or execute the same semantic commands/ChangeSets subject to authorization and validation.

Agent runtime is pluggable: hosted API, MCP-assisted client, local process/CLI adapter or future providers. The semantic application API is authoritative; no agent should require direct database mutation.

### 16. Design tenancy and authorization into identity from the start

The commercial model is multi-user and multi-project. Workspace/project membership, principals, roles and authorization belong at the application boundary. Stable project-domain IDs are distinct from tenant/database keys where useful.

ChangeSets identify the acting principal and, for agents, the execution that produced the proposal.

### 17. Import arbitrary projects through staged proposals

Import is not a trusted direct write. Deterministic adapters may parse known formats; AI-assisted interpretation may map unknown formats. Both produce an `ImportProposal` containing source provenance, extracted objects, mappings, confidence/ambiguities, unresolved references and proposed ChangeSets.

Users review uncertain mappings before authoritative mutation. Original sources are retained for provenance.

Light Delay is the primary migration/import fixture rather than being recreated manually.

## Consequences

- The current Light Delay data remains usable during migration.
- Existing spatial v2, causal, generation and asset work becomes input to broader domains rather than being discarded.
- `ScriptFile` ceases to be the eventual universal domain root, but remains a compatibility/product format during migration.
- The system gains explicit support for nonlinear time, mediated information, nested realities, actor-dependent navigation, hybrid production and commercial collaboration.
- The model is more sophisticated internally; the UI must progressively disclose complexity rather than expose the graph directly by default.

## Compatibility with earlier ADRs

ADR-0001 remains authoritative for the principle that distinct cuts/products are independently authored, have stable identities and preserve provenance. V2 replaces the assumption that every product's complete semantics must live inside one `ScriptFile`.

ADR-0002 remains authoritative for the current Light Delay repository until its master narrative is migrated. V2 does not demote the current master outline by documentation alone.

## Deferred implementation choices

This ADR deliberately does not select the database, event-store product, queue, object store, CRDT library, agent provider, deployment platform or exact schema language. Those choices follow domain acceptance and machine-contract design.
