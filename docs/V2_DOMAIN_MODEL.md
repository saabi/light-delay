# V2 domain model

Status: **architecture reference; no runtime schema migration yet**.

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
      Assets
      Representations
      Edits
    Profiles
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

## 4. Story events and time

```ts
interface StoryEvent {
  id: StoryEventId;
  worldContextId: WorldContextId;
  participantIds: EntityId[];
  locationRef?: SpatialRef;
  temporal: TemporalPlacement;
  causes?: StoryEventId[];
  consequences?: StoryEventId[];
  stateTransitionIds?: StateTransitionId[];
  createsArtifactIds?: ArtifactId[];
}

type TemporalPlacement =
  | { kind: "absolute"; value: string }
  | { kind: "ordinal"; order: number }
  | { kind: "interval"; start?: string; end?: string }
  | { kind: "relative"; relation: "before"|"after"|"during"|"simultaneous-with"; eventId: StoryEventId; offset?: number }
  | { kind: "unknown" };
```

Chronology is a graph/order derived from these relations, not scene order.

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

## 9. Facts and knowledge

Facts describe propositions within a context/continuity. Knowledge events describe when an agent learns, believes, doubts or loses access to information.

The existing Light Delay master `facts`, `knowledgeEvents` and `actionRequirements` are migration inputs, not discarded data.

Queries should support:
- what has actually happened by story time T?
- what has the audience learned by narrative position N?
- what does Rao know that Voss does not?
- which action requires a fact/knowledge state?

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

## 15. History and collaboration

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

Snapshots accelerate reconstruction but are not history. Binary media lives in blob storage. Derived caches/reports are rebuildable.

Concurrent ChangeSets may be automatically rebased only when their semantic operations commute and preconditions still hold; otherwise the system produces a reviewable conflict.

## 16. Import and agents

Known-format adapters and AI interpreters both produce `ImportProposal`, never direct authoritative writes.

Agents interact through the same command/query application API as the UI. Runtime adapters may call hosted APIs, MCP clients or local CLI processes such as coding/agent CLIs. Execution mechanism does not change domain authority.

## 17. UX principle

The domain model is not the default user interface.

Default authoring surfaces should be familiar artifacts and focused questions. Advanced semantic structure is inferred/proposed progressively and surfaced when it matters: ambiguity, validation failure, dependency impact, navigation, version comparison or explicit graph editing.

A user can write a screenplay without first authoring a world graph. The system can progressively extract candidate entities/events/locations and ask only consequential questions.
