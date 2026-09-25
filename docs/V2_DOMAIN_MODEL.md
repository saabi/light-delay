# V2 domain model

Status: **architecture reference; M2 authored-document/history subset implemented**.

This document makes ADR-0003 concrete enough to test before implementation.

## 1. Aggregate map

```text
Workspace
  members / principals
  Projects
    World
      Entities
      Roles + Capabilities
      Relationships
      WorldContexts
      SpatialGraph
      WorldState
    Story
      StoryEvents
      Facts
      Knowledge
      StateTransitions
      CausalRelations
    NarrativeVersions
      NarrativePresentations
    Documents
    CinematicLanguage
    Production
      ProductionScenes
      Setups
      Shots
      Takes
      GenerationSpecs
      Plans
    Media
      MediaAssets
      AssetBlobs
      StorageLocations
      Generation/Provenance
      Representations/Derivatives
      Exports
    Profiles
    ContextEngine
      ContextPolicies
      ContextPackages
      RetrievalIndexes
      AgentExecutions
    History
      ChangeSets
      Revisions
      Snapshots
```

## 2. Identity and composition

All durable objects have stable IDs independent of array position. Domain identity is not an exclusive type declaration.

```ts
interface Entity {
  id: EntityId;
  label: LocalizedString;
  roleIds: RoleId[];
  capabilityIds: CapabilityId[];
  componentData: Record<NamespacedComponentId, unknown>;
}

interface CapabilityDefinition {
  id: NamespacedCapabilityId;
  version: string;
  schema?: unknown;
  extends?: NamespacedCapabilityId[];
  relationsAllowed?: string[];
  validationRuleIds?: RuleId[];
  uiHints?: unknown;
}
```

Example compositions:

```text
human actor
  roles: character, agent
  capabilities: mobile, inventory-holder

dragon
  roles: character, agent, vehicle
  capabilities: mobile, carrier, rideable, inventory-holder

Celestial Ardor
  roles: vehicle, spatial-host
  capabilities: mobile, carrier, pressurized-environment
```

Roles communicate author-facing meaning. Capabilities drive behavior. Neither requires mutually exclusive inheritance.

## 3. World contexts

```ts
interface WorldContext {
  id: WorldContextId;
  parentContextId?: WorldContextId;
  kind: string; // profile vocabulary: actual, imagined, simulated, dream, etc.
  subjectEntityId?: EntityId;
  profileRefs?: ProfileRef[];
}
```

Context is orthogonal to reliability/truth claims. Contexts may nest.

## 4. Story events and temporal systems

Temporal semantics distinguish four independent orders:

1. **world/calendar time** — where an event lies in a world's clock/calendar;
2. **causal order** — what causes or enables what;
3. **experienced continuity** — the order experienced by a particular entity;
4. **narrative order** — the order presented to the audience.

Ordinary linear stories can let these coincide without authoring extra structures. Flashbacks usually change only narrative order. Time travel may make experienced/causal order run backward through world time.

```ts
interface StoryEvent {
  id: StoryEventId;
  worldContextId: WorldContextId;
  participantIds: EntityId[];
  locationRef?: SpatialRef;
  temporal: {
    worldTime?: TimeCoordinate;
    historyContextId?: HistoryContextId;
    relations?: TemporalRelation[];
  };
  stateTransitionIds?: StateTransitionId[];
  createsArtifactIds?: ArtifactId[];
}
```

Causality and experienced continuity are graph relations rather than being inferred from timestamps:

```text
CausalRelation:      event A -> event B
EntityContinuity:  entity + event A -> event B
NarrativeOrder:      NarrativePresentation ordering
```

Thus a traveler can experience 1985 departure -> 1955 arrival while the two events retain their world/calendar placements.

### Optional history contexts

Multiple histories/timelines are not mandatory. Projects that need temporal-history semantics may introduce `HistoryContext` and a temporal model:

```text
linear
fixed-loop
mutable-history
branching
multiple-timelines
custom
```

A HistoryContext may identify a parent history and divergence event. Validators interpret paradox/consistency rules according to the active temporal model rather than assuming one theory of time travel.

`WorldContext` and `HistoryContext` remain distinct: WorldContext describes reality/ontological context (actual, imagined, simulation, dream, etc.); HistoryContext describes temporal-history identity. Either may be absent when unnecessary.

## 5. Artifacts, information and representation

Persistent things can outlive the event that created them.

```text
StoryEvent
  creates → Artifact
Artifact
  carries → Information / Representation
StoryEvent
  sends / receives / stores / modifies / presents → Artifact
NarrativePresentation
  presents → current event, other event, information or representation
```

A representation may have capture interval/time, subject/event references, editing/manipulation provenance and reliability claims.

Zao example:

```text
event:zao-records-warning @ early story time
  creates → artifact:zao-warning-recording

event:crew-plays-warning @ late story time
  presents/consumes → artifact:zao-warning-recording

narrative presentation
  current event = crew playback
  embedded representation = Zao captured earlier
  presentation mode = diegetic-media
```

Zao may be dead at playback time without a presence violation.

## 6. Narrative versions and presentations

```ts
interface NarrativeVersion {
  id: NarrativeVersionId;
  projectId: ProjectId;
  label: string;
  lineage?: NarrativeLineage;
  presentationIds: NarrativePresentationId[];
  profileRefs?: ProfileRef[];
}

interface NarrativePresentation {
  id: NarrativePresentationId;
  presents: PresentationTargetRef[];
  narrativeOrder: number | OrderKey;
  perspective?: EntityId | string;
  presentationMode?: string;
  worldContextId?: WorldContextId;
  profileRefs?: ProfileRef[];
  cinematicTreatmentRefs?: TreatmentId[];
}
```

Presentation mode, chronology, ontology/context and cinematic treatment are independent dimensions.

## 7. Authored documents

Documents are first-class revisioned artifacts with semantic links, not disposable exports.

Supported families may include premise, logline, tagline, synopsis, character breakdown, story/world bible, beat sheet, sequence outline, step outline, treatment, scriptment, screenplay, production script, breakdown, schedule, call sheet and post-production documents.

A document can:
- cite semantic objects;
- be generated from a semantic revision;
- produce an extraction/import proposal;
- become stale when dependencies change;
- remain intentionally divergent when authored as an independent product.

### M2 screenplay subset

The first runtime subset is intentionally smaller than the complete document model. A screenplay has stable ordered elements of kind `scene-heading`, `action`, `character`, or `dialogue`. Authored wording lives on present element state. Semantic operations insert an element, update authored text, remove an element from a cut, move an element, or restore a document/version scope.

The M2 version representation is materialized rather than inherited: each document × version scope has its own deterministic order and element states. The same element ID may be present in two cuts with different text, deliberately `removed` in one cut, or unknown because no state exists there. This does not decide future continuity, lineage or derivation-pin semantics.

## 8. Spatial graph

V2 preserves the current location v2 separation.

### 8.1 Hosting / containment

Answers: where does an entity or space belong?

Relationships include containment, aboard/hosted-by and sublocation semantics. Hosts may be mobile entities.

### 8.2 Circulation

Answers: which interfaces/levels does a multi-access circulation structure serve?

Axial shafts and elevators may expose level interfaces. For exact reachability, circulation can be lowered into traversal segments.

### 8.3 Portals

A portal is a traversal or visibility mechanism, not containment.

```ts
interface Portal {
  id: PortalId;
  hostRef: SpatialRef;
  kind: string;
  destinationRef?: SpatialRef;
  bidirectional?: boolean;
  maxRange?: number;
  requirementRuleIds?: RuleId[];
}
```

Profiles may define door, view, corridor, transporter, wormhole, magical gate, etc.

### 8.4 Proximity

```ts
interface ProximityEdge {
  a: SpatialRef;
  b: SpatialRef;
  distance: number;
  distanceScaleId?: string;
}
```

Coordinates are optional. Range-dependent traversal can operate entirely on abstract distances.

### 8.5 Navigation

```ts
interface NavEdge {
  id: NavEdgeId;
  from: NavRef;
  to: NavRef;
  via?: PortalId | string;
  requirementRuleIds?: RuleId[];
  cost?: number;
  tags?: string[];
  bidirectional?: boolean;
}
```

Navigation evaluates:
- actor capabilities;
- actor state;
- inventory/carried requirements;
- world state;
- portal state;
- dynamic occupancy/blockers;
- traversal segment state;
- optional cost constraints.

Nav-only nodes remain legal and need not be shootable locations.

### 8.6 Mobile hosts and carriers

Containment/carriage is explicit. Moving a carrier may change the effective location of contained/carried entities without rewriting their local placement.

Example:

```text
Sorell aboard Celestial Ardor
Celestial Ardor berthed at Proxima

effective world placement:
Sorell → Ardor → Proxima
```

When the Ardor moves, Sorell remains aboard unless a story/state transition changes that relation.

### 8.7 Segmented traversal

Multi-level traversal must distinguish interfaces from segments:

```text
Deck 1 -- segment 1/2 -- Deck 2 -- segment 2/3 -- Deck 3
       -- segment 3/4 -- Deck 4 -- segment 4/5 -- Deck 5
```

A blocked Deck-3 doorway need not block an elevator passing Deck 3; a blocked shaft segment does. This is represented in traversal topology/state, not inferred from hierarchy.

## 9. Facts, information and epistemic state

World truth and character epistemic state are separate.

- **Facts/assertions** describe propositions and the contexts/history intervals in which the project treats them as true, false or unresolved.
- **Information** is proposition/content that may be represented, communicated or remembered.
- **Epistemic events** record changes in a subject's knowledge/belief state: learn, observe, infer, believe, suspect, remember, doubt, reject, forget or revise.

Epistemic state is projected along **entity continuity**, not merely world/calendar time. This matters in ordinary stories and becomes essential when an entity crosses history contexts.

A traveler arriving in an altered 1985 may therefore retain memories sourced from the original history while residents of altered 1985 have epistemic states accumulated entirely within the altered history. These are not contradictions in world truth.

```ts
interface EpistemicEvent {
  id: EpistemicEventId;
  subjectEntityId: EntityId;
  informationRef: InformationRef;
  operation: EpistemicOperation;
  experiencedAtEventId: StoryEventId;
  sourceEventId?: StoryEventId;
  sourceHistoryContextId?: HistoryContextId;
  confidence?: number;
}
```

Queries should support:
- what is asserted true in this world/history context?
- what has actually happened by a world-time point?
- what has the audience learned by narrative position N?
- what does Rao know/believe that Voss does not?
- what does a time traveler remember from a predecessor history?
- by what observation/message/inference did a character acquire information?
- which action requires a fact or epistemic state?

The existing Light Delay master `facts`, `knowledgeEvents` and `actionRequirements` are migration inputs, not discarded data.

## 10. Cinematic language

Cinematic language is optional metadata/rules describing audiovisual expression. Treatments can be scoped and inherited.

```text
Project → StoryWorld → NarrativeVersion → Sequence → Scene
        → Presentation → Shot
```

Explicit local values win. Profile resolution and treatment resolution must be inspectable.

## 11. Production

```text
ProductionScene
  Setups
    Shots
      Takes / Generated realizations
```

Links connect production units back to screenplay/document/narrative/story targets. Production method may include live-action, ai-video, animation, vfx, stock or hybrid.

A shot is not structurally owned by a story beat.

## 12. Generation

```ts
interface GenerationSpec {
  subject?: unknown;
  entityRefs: EntityId[];
  locationRef?: SpatialRef;
  storyStateRefs?: StateRef[];
  wardrobeStateRefs?: StateRef[];
  lighting?: unknown;
  camera?: unknown;
  composition?: unknown;
  action?: unknown;
  cinematicTreatmentRefs?: TreatmentId[];
  continuityRequirementRefs?: RuleId[];
  identityReferenceAssetIds?: AssetId[];
  locationReferenceAssetIds?: AssetId[];
  objectReferenceAssetIds?: AssetId[];
  negativeConstraints?: unknown[];
  providerOverrides?: Record<string, unknown>;
}
```

Provider prompt/package output is derived and reproducible from a GenerationSpec revision plus provider adapter/version.

## 13. Validation

Common result:

```ts
interface Finding {
  id: FindingId;
  validatorId: string;
  severity: "ERROR"|"WARNING"|"STALE"|"MISSING"|"STYLE"|"INFO";
  subjectRefs: DomainRef[];
  message: string;
  evidenceRefs?: DomainRef[];
  ruleId?: RuleId;
  revision: ProjectRevision;
  suggestedOperations?: SemanticOperation[];
}
```

Validators declare dependencies where possible so a ChangeSet can trigger incremental revalidation.

## 14. Profiles

A Project Profile may contain ontology/vocabulary modules, assumptions, hard rules, cinematic presets, document/workflow defaults, production defaults and generation policies.

Profiles are composable and scoped. Hard-SF defaults should normally be assumptions/warnings unless the project explicitly promotes them to hard constraints.

## 14.5 Authority tiers and fictional state

Studio distinguishes four related but non-interchangeable concerns:

1. **authoritative project state** — accepted project meaning recorded through ChangeSets/ProjectRevisions;
2. **durable provisional work** — Drafts, Proposals, scenarios, import interpretations, and pending AI output;
3. **story-time state** — fictional facts that vary by StoryEvent/temporal/narrative anchor and are projected through `stateAt(...)`-style queries;
4. **derived/operational state** — ContextPackages, indexes, caches, worker progress, storage availability, and other rebuildable or operational records.

A ProjectRevision answers when the *project was edited*. It is not a fictional timestamp.

A story transition such as gravity changing, a hatch opening, movement, or information acquisition must be anchored to story/world semantics. Two story points may therefore project different world state from the same ProjectRevision.

Durable provisional work may be saved without entering authoritative history. Promotion/acceptance creates an explicit authoritative mutation. This is the boundary used by human drafts, import proposals, and agent proposals.

See `ADR-0004-AUTHORING-STORY-STATE-AND-PROVISIONAL-WORK.md`.

## 15. History and collaboration

The authoritative mutation invariant is:

> Every authoritative mutation is attributable, ordered, immutable and reconstructible.

The conceptual flow is:

```text
Command
  -> semantic validation and preconditions
  -> ChangeSet
  -> immutable ProjectRevision
  -> deterministic projection/current state
```

`ChangeSet.operations` contains domain operations such as `SetWorldState` and `SetOccupancy`; it is not an arbitrary JSON Patch document. Every accepted ChangeSet records its project, base revision, resulting revision, principal, intent, timestamp, operation schema/version and relevant provenance. A stale base revision or failed precondition is a reviewable conflict and does not append history.

```ts
interface ChangeSet {
  id: ChangeSetId;
  workspaceId: WorkspaceId;
  projectId: ProjectId;
  baseRevision: ProjectRevision;
  resultingRevision: ProjectRevision;
  principal: PrincipalRef;
  timestamp: string;
  intent: string;
  operations: SemanticOperation[];
  provenance?: Provenance;
  assumptions?: string[];
  rationale?: string;
  agentExecutionId?: AgentExecutionId;
}
```

Restoration/reversion appends a new ChangeSet whose resulting authoritative projection is semantically equivalent to the selected supported historical state. It never rewrites or deletes prior history. Semantic operations preserve intent; snapshots/checkpoints may accelerate or support durable reconstruction and replay may serve as a verification oracle. This architecture does not require pure event sourcing. Binary media lives in blob storage. Derived caches/reports are rebuildable.

Concurrent ChangeSets may be automatically rebased only when their semantic operations commute and relevant semantic/read-set preconditions still hold; otherwise the system produces a reviewable conflict. A project-wide revision remains an ordering fact but should not force unrelated future aggregates/documents to conflict by definition.

The M2 authoring slice applies that rule with a document-version precondition scoped by document and narrative version. Project revision remains the total order and becomes the accepted ChangeSet's actual base at acceptance time. A proposal created from an older project revision can still be accepted when unrelated scopes changed and its document version did not; a same-scope change conflicts.

New command acceptance and historical rehydration are distinct. Acceptance materializes untrusted input once, validates and executes only that private value, applies current preconditions, and assigns trusted identity, principal and time. Rehydration preserves complete accepted records and verifies their stored projection without reassigning authority or passing them through command acceptance.

## 16. Import and agents

Known-format adapters and AI interpreters both produce `ImportProposal`, never direct authoritative writes.

Agents interact through the same command/query application API as the UI. Runtime adapters may call hosted APIs, MCP clients or local CLI processes such as coding/agent CLIs. Execution mechanism does not change domain authority. See `docs/V2_MEDIA_AND_AGENT_RUNTIME.md` for the isolated runtime and CLI registry contract.

## 17. Context and agent memory

Project state is durable memory; model context is an assembled view.

The Context Engine resolves task anchors (cursor/selection, document range, entity, event, presentation, location, shot, asset, Finding or revision) into bounded `ContextPackage` values. It prefers exact structural queries for world/story facts and uses lexical/semantic retrieval for prose and fuzzy similarity.

Context packages identify their project revision, sources, retrieval reasons, authority/inference status and dependencies. Vector indexes, summaries and embeddings are rebuildable projections.

An `AgentExecution` may keep temporary plans, notes, query results and retrieved packages, but durable conclusions must be committed as explicit artifacts, Findings, relationships/decisions or ChangeSets. Provider session memory is never required to reconstruct project meaning.

See `docs/V2_CONTEXT_ENGINE.md`.

## 18. UX principle

The domain model is not the default user interface.

Default authoring surfaces should be familiar artifacts and focused questions. Advanced semantic structure is inferred/proposed progressively and surfaced when it matters: ambiguity, validation failure, dependency impact, navigation, version comparison or explicit graph editing.

A user can write a screenplay without first authoring a world graph. The system can progressively extract candidate entities/events/locations and ask only consequential questions.
