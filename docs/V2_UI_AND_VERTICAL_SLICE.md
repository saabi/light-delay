# V2 UI and first vertical slice

Status: **implementation brief**.

## Product direction

V2 gets a new interface. The existing Light Delay UI remains operational as a compatibility/reference client while migration proceeds, but it does not define the new information architecture.

The new UI is artifact-first and progressively reveals semantic machinery.

Core principle:

> Develop the film normally. The model emerges underneath it.

## Primary lenses

The initial application navigation is conceptual rather than a commitment to exact visual placement:

| Lens | Primary job |
|---|---|
| **Write** | premise, treatment, outline, screenplay and authored documents |
| **Story** | chronology, narrative order, causality, knowledge, arcs |
| **World** | characters/entities, locations, objects, rules, world contexts |
| **Navigate** | spatial topology, routes, movement, blockers, state |
| **Direct** | cinematic language, storyboard, blocking, shot design |
| **Produce** | breakdown, assets, generation, schedules, takes |
| **Review** | continuity, contradictions, unresolved questions, staleness, history |

These are views over one project, not separate stores.

## Global shell

The first shell should provide:

- workspace/project switcher;
- lens navigation;
- current narrative/product selector where relevant;
- global search/command entry;
- contextual validation status;
- contextual inspector;
- assistant/agent entry point;
- project-history access.

Exact pane layout is a UX implementation decision.

## Progressive disclosure

### Normal authoring

A user can begin with prose or import a screenplay. They are not required to understand StoryEvent, WorldContext, capabilities, portals or ChangeSets.

### Inferred structure

Extraction can propose:
- characters/entities;
- locations;
- props/artifacts;
- events;
- movements;
- knowledge changes;
- world-state changes;
- chronology clues.

Inference carries status:

```text
explicit
confirmed
inferred
unknown
```

Only consequential uncertainty should interrupt the author.

### "Just describe it"

Every advanced surface should have a natural-language correction path.

Examples:
- "This isn't a flashback. They're watching an old recording of Zao."
- "The elevator can pass Deck 3, but nobody can get out there."
- "The dragon is also their transport."
- "Harlan blocks this route after the alarm."

The assistant translates the description into a proposed semantic ChangeSet and shows consequences before commit when material.

## Specialized versus generated UI

Use purpose-built UI for:
- screenplay/document editing;
- chronology/narrative-order comparison;
- spatial/navigation graph;
- storyboard/shot planning;
- animatic/edit playback;
- history/diff;
- validation review.

Use schema-generated controls for:
- generic inspectors;
- extension/profile data unknown to the core UI;
- secondary metadata;
- advanced/debug/engineering views.

The schema is a UI metadata source, not a substitute for product design.

## First vertical slice

The first v2 implementation should use a real Light Delay subset rather than a toy project.

### Scope

Import/model:
- Celestial Ardor as mobile spatial host/vehicle;
- Bridge;
- Meal Table;
- crew-stations nav waypoint;
- Central Access;
- Service Cylinder;
- Engineering;
- Sorell;
- Harlan;
- bridge gravity state;
- service-hatch state;
- the existing safe-around-rail and microgravity-only direct crossing;
- one Harlan occupancy/blocker scenario;
- a small set of StoryEvents/NarrativePresentations sufficient to place the movement in story/narrative context.

The source remains current repository data with provenance.

### Required application queries

The slice must answer:

```text
getEntity(id)
getWorldState(at)
getEffectiveLocation(entity, at)
findRoute(actor, from, to, at)
explainRouteFailure(...)
getStoryEvents(range/context)
getNarrativePresentations(version/range)
getFindings(subject/range)
getDependencies(subject)
```

Exact API syntax is not pinned; behavior is.

### Required commands

At minimum:

```text
SetWorldState
MoveEntity
SetOccupancy
CreateEvent
CreatePresentation
UpdateEntityCapabilities
ApplyChangeSet
```

All accepted mutations produce project revisions.

### UI demonstration

The slice is successful when the new UI can:

1. Open the Light Delay v2 project.
2. Show Sorell/Harlan and the relevant Ardor locations in **World**.
3. Show the Bridge/Central Access topology in **Navigate**.
4. Select a story/narrative point and display applicable gravity/door/occupancy state.
5. Ask whether Sorell can reach Engineering.
6. Show the chosen route when reachable.
7. Explain the exact failed edge/requirement/blocker when not reachable.
8. Change gravity or Harlan occupancy through a proposed ChangeSet.
9. Immediately recompute route/findings.
10. Inspect the history entry and restore/undo through a new ChangeSet.

This tests schema, import, queries, commands, deterministic navigation, validation, history and the new UX in one coherent feature.

## Parallel UI development

UI work starts before complete domain migration, using stable application-level query/view-model contracts and fixture adapters.

Avoid:
- binding components directly to raw persisted JSON;
- duplicating domain rules in Svelte components;
- making the UI wait for every v2 schema;
- carrying the old route/component hierarchy forward solely for compatibility.

Prefer:
- view models assembled by application queries;
- semantic commands from UI actions;
- mock/fixture implementations where a domain service is not ready;
- contract tests so fixture and real services agree.

## Second slice

After spatial slice passes, add Zao's recording to exercise:
- StoryEvent chronology;
- Artifact/Representation lifecycle;
- narrative presentation;
- knowledge/revelation;
- mediated media;
- chronology vs narrative-order UI.

This deliberately adds temporal/narrative complexity only after the first end-to-end infrastructure is proven.

## UX acceptance

A filmmaker who knows none of the internal vocabulary should be able to understand the first slice as:

> "At this point in the story, can Sorell get from here to Engineering?"

The answer may expose:
- route;
- blocked route;
- reason;
- alternatives;
- story consequence.

It should not require the user to inspect a `NavEdge` or `WorldStatePredicate` unless they choose an engineering/advanced view.
