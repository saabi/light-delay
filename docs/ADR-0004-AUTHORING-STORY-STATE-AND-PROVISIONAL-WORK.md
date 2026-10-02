# ADR-0004 — Authoring revisions, story-time state, and provisional work

Status: **accepted**  
Date: 2026-09-23

## Context

The first Milestone 1 proof routed Studio's exploratory gravity and occupancy controls through the same `ChangeSet -> ProjectRevision` mechanism intended for authoritative authoring history. The independent Astra and Claude Opus 5.5 reviews exposed a conceptual collision: three different kinds of change were being represented by one revision mechanism.

Studio must distinguish:

1. **authoring/project history** — what an author, importer, agent, or system accepted as a change to the project;
2. **story-time state** — what is true at a particular point in the fictional world or narrative context;
3. **provisional durable work** — drafts, proposals, import interpretations, AI suggestions, and what-if scenarios that must survive reloads but are not yet authoritative.

These concepts can interact, but they are not interchangeable.

## Decision

### 1. ProjectRevision records authoring history

An accepted authoritative mutation follows:

```text
Command
  -> validation / preconditions
  -> ChangeSet
  -> immutable ProjectRevision
  -> projections
```

A project revision answers questions such as:

- What did the author change?
- Who or what principal accepted the change?
- What was the base revision?
- What project state resulted?
- Can an earlier project state be reconstructed or restored?

It does **not** by itself mean that the fictional world changed at that revision number.

### 2. Story-time state is projected from story semantics

A fictional transition such as gravity changing, a hatch opening, an entity moving, or a character learning information must be anchored to story/world semantics: events, intervals, temporal placement, presentation context, or another explicit story anchor.

Conceptually:

```text
StoryEvent / StateChange / temporal placement
              |
              v
         stateAt(anchor)
```

The exact runtime type names remain implementation decisions. The invariant is that `ProjectRevision 42` cannot be used as a substitute for "scene 12 is in microgravity."

The temporal model in `V2_TEMPORAL_AND_EPISTEMIC.md` remains authoritative for world/calendar, causal, entity-continuity, and narrative order.

### 3. Durable provisional work is a separate authority tier

Studio needs durable work that is neither accepted canon/project state nor a disposable cache.

Examples:

- screenplay text being actively edited before an authoritative checkpoint;
- an AI rewrite or semantic inference awaiting approval;
- an `ImportProposal`;
- a what-if navigation or world-state scenario;
- generated output not yet selected/accepted;
- an alternative the author wants to retain without promoting.

The initial application boundary may call these records `Draft`, `Proposal`, or another small set of concrete types. Do not build a generic branching/workspace framework before a vertical slice proves the need.

Required properties for provisional durable work:

- stable identity;
- project and principal scope;
- a base project revision or equivalent source context;
- durable save semantics;
- provenance where relevant;
- explicit promotion/acceptance into an authoritative ChangeSet;
- rejection/abandonment without rewriting project history.

### 4. Derived/operational state remains separate

Caches, ContextPackages, indexes, findings projections, worker progress, storage availability, and similar operational/derived records are not automatically project-authoritative mutations.

A useful authority model is therefore:

```text
AUTHORITATIVE
  accepted semantic/project state
  ProjectRevision / ChangeSet

PROVISIONAL DURABLE
  drafts / proposals / scenarios / pending interpretations

STORY-TIME SEMANTICS
  events / state changes / temporal anchors
  projected through stateAt(...)

DERIVED / OPERATIONAL
  caches / context packages / indexes / job state / availability
```

These categories may reference each other but must not collapse into one log.

## Restore and reconstruction

The invariant remains:

> Every accepted authoritative mutation is attributable, ordered, immutable, and reconstructible.

This ADR does **not** require pure event sourcing.

Semantic operations preserve intent. Versioned snapshots/checkpoints may be used for efficient durable reconstruction. Replay may be used as a verification mechanism. The implementation must not claim a restore succeeded unless the resulting authoritative projection is semantically equivalent to the selected historical state.

The current Milestone 1 proof has a known restore gap for state keys that need to become absent. M1 is not complete until the operation/projection model can faithfully represent the supported restore domain and tests prove it.

## Concurrency

Project-wide `baseRevision` remains a useful initial ordering mechanism, but application interfaces must not assume that every future edit conflicts merely because an unrelated project mutation advanced the head.

M2 should preserve room for semantic/read-set preconditions and narrower conflict detection without implementing a complex aggregate-locking system prematurely.

## UX consequence

"Saved" and "accepted into project history" are different promises.

For authoring surfaces:

- **Saved** should mean the user's durable work will survive reload/session loss.
- **Accepted/committed** means a semantic change has entered authoritative project history.
- AI/importer proposals do not silently become authoritative.
- exploratory state must not create canonical history unless the user deliberately promotes it.

## Consequences

- The current gravity/Harlan controls remain a proof fixture; they must not define persistence semantics.
- M2 needs a minimal durable/provisional-store contract alongside ProjectStore/HistoryStore.
- The first useful Studio product proof moves toward screenplay/document authoring with durable save and explicit semantic promotion.
- Story-time state must be made explicit before the Context Engine relies on persisted world state.
- Agents and importers naturally produce proposals before accepted ChangeSets.
- More complex branching, CRDTs, and collaborative draft semantics remain deferred.
