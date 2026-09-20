# Studio UI and first vertical slice

Status: **implementation brief**.

## Product direction

V2 gets a new interface. The existing Light Delay UI remains operational as a compatibility/reference client while migration proceeds, but it does not define the new information architecture.

The new UI is artifact-first and progressively reveals semantic machinery.

Core principles:

> Develop the film normally. The model emerges underneath it.

> Content first; model second.

> Quiet by default, explicit on demand.

The application should minimize persistent chrome around the author's primary task. Semantic intelligence is ambient infrastructure, not a dashboard that competes with the work.

## Intrusion budget

Every persistent UI element consumes an **intrusion budget**. A control earns permanent screen space only when the current task needs it continuously.

For Write, the default intrusion budget is extremely low:

- document/page;
- caret and selection;
- minimal document identity/status;
- optionally a compact lens/project affordance.

The following should normally be transient or summonable:

- AI actions;
- semantic-model changes;
- continuity findings;
- character/location metadata;
- revision/history detail;
- generated alternatives;
- advanced formatting controls;
- full assistant conversation.

Other lenses may legitimately use denser UI. Navigate can show a graph; Produce can show tables; Review can show findings. Switching lenses is an intentional change of working mode.

## Write lens

Write should feel as close as practical to a high-quality text/screenplay editor.

### Resting state

When the author is simply typing:

- center the text, not the application;
- avoid a permanently open inspector;
- avoid persistent AI chat;
- avoid cards around every semantic unit;
- avoid visible graph terminology;
- use typography/whitespace rather than boxes to communicate screenplay structure;
- keep model/validation activity visually quiet.

### Selection interaction

Selecting text may reveal a compact contextual floater near the selection with actions such as:

```text
Continue
Rewrite
Shorter
Longer
Dialogue
Describe
Ask…
```

The exact actions depend on context. The floater disappears when no longer relevant.

### Inline completion

AI continuation should behave like editor completion rather than chat:

- faint/ghost continuation after the caret;
- accept all or by word/phrase;
- dismiss immediately with normal typing/Escape;
- no mutation of authoritative text until accepted;
- provenance can be retained below the UI surface.

### Rewriting

For a selected passage, AI may propose an inline replacement/diff. The original remains recoverable. Prefer a small accept/reject/alternate control over opening a conversation.

### Ambient semantic feedback

When writing implies a model change, use subtle margin/gutter indicators rather than interrupting prose.

Examples:

- new inferred character;
- possible new location;
- movement inferred;
- chronology clue;
- knowledge/revelation change;
- contradiction;
- consequential ambiguity.

A marker can open a small card:

```text
Inferred
Sorell moves: Bridge → Central Access

[Confirm] [Adjust] [Ignore]
```

Low-consequence inference may accumulate quietly for later review. Consequential ambiguity can ask for confirmation.

### Contextual inspector

An inspector may slide/fade in when the user explicitly asks for details or selects a semantic object. Closing it returns the document to the same visual position; the editor should not permanently shrink merely because an inspector was once opened.

### Assistant

The full assistant is summonable through a shortcut/button/command and may appear as a temporary drawer, overlay or focused mode. It is not permanent Write chrome.

The assistant should understand selection, cursor location, nearby document context and relevant project semantics without requiring the author to copy/paste them into chat.

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


## Application boundary

Production UI lives in `apps/studio`. Shared schema/domain/context logic lives below the app boundary and must not depend on Svelte. Begin with a small shared surface rather than prematurely creating many packages. Generic UI primitives may later move to a shared UI package when reuse is demonstrated.

Visual implementation follows `docs/STUDIO_DESIGN_SYSTEM.md`: low visual noise, typography/spacing before borders, cards only for genuinely discrete objects, and density appropriate to each lens.
