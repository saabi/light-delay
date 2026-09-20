# V2 runtime contract architecture

Status: **proposed implementation direction**.

## Decision

Use the architectural pattern proven in `saabi/world-lab/packages/schema` as the starting point for v2 runtime contracts:

- TypeBox supplies JSON-Schema-shaped runtime schemas and TypeScript static inference.
- A thin project-owned factory/annotation layer adds story/film semantics as serializable `x-*` metadata.
- The same contract can support static types, runtime validation, introspection, generic UI, serialization, documentation and agent/tool contracts.
- Specialized filmmaking UI remains hand-designed over application view models; schema-driven forms are a fallback/inspector mechanism, not the primary product UI.

Do **not** introduce Zod as a parallel source of truth.

This document adopts the pattern, not necessarily the World-Lab package itself. Common infrastructure may later be extracted if the two projects genuinely share stable abstractions.

## Requirements

A v2 contract must be:

1. TypeScript-inferrable.
2. Runtime-validatable.
3. JSON-serializable/introspectable.
4. Versionable and migratable.
5. Extensible through namespaced annotations/components.
6. Capable of useful path-aware diagnostics.
7. Suitable for generated generic editors and documentation.
8. Suitable for exposing selected contracts through API/MCP/agent tools.
9. Safe to round-trip when the current client does not understand a project extension.
10. Independent of Svelte and persistence technology.

## Base layer

Initial package target:

```text
packages/v2-schema/
  src/
    core.ts
    annotations.ts
    refs.ts
    entity.ts
    world-context.ts
    time.ts
    story-event.ts
    narrative-presentation.ts
    spatial.ts
    changes.ts
    findings.ts
    introspection.ts
    validation.ts
```

The name is provisional; package boundaries should follow the repository's eventual v2 workspace structure.

## Annotation policy

Use JSON-Schema-compatible `x-*` metadata for semantics needed by multiple consumers.

Candidate annotations:

```text
x-domain             semantic domain/category
x-ref-kind           target reference family
x-role               role semantics
x-capability         capability semantics
x-editor             generic editor hint
x-section            inspector grouping
x-authority          authorship/authority hint
x-inference-status   explicit / confirmed / inferred / unknown
x-profile            profile/module association
x-unit               physical/logical unit where applicable
x-ordered            ordering semantics
x-provenance         provenance-display hint
```

Do not put runtime project state into schema annotations. Annotations describe contracts/semantics; values describe project state.

Names introduced by profiles/extensions should be namespaced, e.g. `core:carrier`, `light-delay:velari`, `fantasy:spell`.

## Reference factory

References should be structurally strings/IDs while remaining introspectable:

```ts
const EntityRef = ref("core:entity");
const SpatialRef = ref("core:spatial");
```

Conceptually:

```ts
function ref(kind: NamespacedId, options = {}) {
  return Type.String({
    ...options,
    "x-ref-kind": kind,
    "x-editor": options.editor ?? "reference-picker"
  });
}
```

This lets generic tooling render a picker and lets application validation distinguish a syntactically valid ID from a resolvable reference.

Cross-reference existence is semantic validation, not JSON-Schema structural validation.

## Initial proof schemas

The first implementation should intentionally remain small.

### Entity

```ts
const Entity = Type.Object({
  id: id("core:entity"),
  label: Type.String(),
  roleIds: Type.Array(ref("core:role")),
  capabilityIds: Type.Array(ref("core:capability")),
  components: Type.Record(Type.String(), Type.Unknown())
});
```

### WorldContext

```ts
const WorldContext = Type.Object({
  id: id("core:world-context"),
  parentContextId: Type.Optional(ref("core:world-context")),
  kind: Type.String(),
  subjectEntityId: Type.Optional(ref("core:entity")),
  profileRefs: Type.Array(ref("core:profile"))
});
```

### TemporalPlacement

A discriminated union supporting absolute, ordinal, interval, relative and unknown placement. Relative placement references another StoryEvent.

### StoryEvent

```ts
const StoryEvent = Type.Object({
  id: id("core:story-event"),
  worldContextId: ref("core:world-context"),
  participantIds: Type.Array(ref("core:entity")),
  locationRef: Type.Optional(ref("core:spatial")),
  temporal: TemporalPlacement,
  stateTransitionIds: Type.Array(ref("core:state-transition")),
  createsArtifactIds: Type.Array(ref("core:artifact"))
});
```

Causality may initially be expressed through relationship/fact contracts rather than duplicated arrays if the proof shows that is cleaner.

### NarrativePresentation

Contains stable identity, ordered position, presentation targets, optional perspective, presentation/media mode, world-context override/profile refs and cinematic-treatment refs.

### Spatial proof

Implement only enough to test:
- host/containment reference;
- nav node;
- traversal edge;
- state/capability requirements;
- abstract proximity;
- dynamic occupancy input.

Do not redesign the complete September 16 location schema before this proof passes.

## Validation layers

Separate:

```text
STRUCTURAL
TypeBox / JSON Schema
  "is this value shaped correctly?"

SEMANTIC
application validators
  "does this reference exist?"
  "is chronology consistent?"
  "can this actor traverse this edge?"
  "does this operation violate a world rule?"

PROJECT/PROFILE
declarative + optional trusted custom validators
  "does this satisfy this world's declared rules?"
```

Do not encode graph reachability or causality into JSON Schema.

## Serialized-schema caveat

World-Lab documents an important TypeBox behavior: TypeBox's live checker uses in-memory schema metadata that is not preserved by ordinary JSON serialization.

V2 must choose and test an explicit server strategy before accepting user-defined/profile schemas:

1. rebuild/rehydrate trusted schemas through registered factories; or
2. validate serialized schemas as standard JSON Schema using a compatible validator such as Ajv; or
3. use a deliberately supported combination of the two.

The proof must include a serialize -> deserialize -> introspect -> validate test. Do not assume a live TypeBox schema object survives transport unchanged.

## Schema evolution

Every persisted contract family has a schema/version identifier. Historical ChangeSet operations also carry operation schema versions.

Migration rules:
- never mutate historical payload meaning silently;
- use explicit migrations/upcasters;
- retain unknown namespaced extension data;
- make migrations deterministic;
- test replay from old snapshots/history into the current projection.

## Generic UI contract

Introspection should expose a normalized field description similar to World-Lab's `fields()` / `annotationsOf()`.

Generic UI may provide:
- reference pickers;
- enum/select controls;
- numeric/time controls;
- sections;
- arrays/objects;
- extension-component fallback editors.

It must not determine the primary filmmaking workflow.

## Proof gate

Do not expand the schema library until it can represent and validate the structural parts of these fixtures without special-case type hacks:

1. Zao recording + later playback.
2. Dragon = character + agent + vehicle/carrier.
3. Ardor bridge microgravity/1g traversal.
4. Segmented elevator.
5. Nested imagined fantasy context.
6. Unknown namespaced extension round-trip.
7. Serialize/deserialize schema and retain introspection.
8. TypeScript `Static<typeof Schema>` remains useful at application boundaries.

Passing this gate authorizes broader domain schema implementation.
