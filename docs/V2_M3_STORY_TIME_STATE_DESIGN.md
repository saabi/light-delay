# M3 — Story-time state foundation: design note

Status: **proposal for owner review** (Oct 2, 2026). Nothing here is implemented.

Sources: [ADR-0004](ADR-0004-AUTHORING-STORY-STATE-AND-PROVISIONAL-WORK.md) §2, [domain model](V2_DOMAIN_MODEL.md) §4 and §14.5, [temporal and epistemic semantics](V2_TEMPORAL_AND_EPISTEMIC.md), [roadmap](V2_IMPLEMENTATION_ROADMAP.md#milestone-3--story-time-state-foundation) M3 and M4.

## 1. What M3 must prove

The roadmap asks for the smallest `StateChange` / temporal-anchor / `stateAt(...)` that answers *what is true at this point in the story?* Its exit criteria:

1. two story points in the same project revision can produce different world state;
2. editing the project creates a ProjectRevision, and is never confused with fictional time passing;
3. unknown or undetermined state remains representable;
4. projected state carries provenance and source anchors.

M4 then builds ContextPackages scoped by project revision, cut, story anchor and perspective. M3 therefore has to give M4 a stable anchor type and a pure, provenance-carrying `stateAt`, and nothing more.

## 2. Scope

In M3:

- one linear story timeline per project: world time, causal order and entity continuity coincide, and the timeline is that order;
- story events, authored state changes on them, and `stateAt(anchor)`;
- all of it authored through the existing Command → ChangeSet → ProjectRevision path, persisted in PostgreSQL, with restore;
- a neutral fixture extending Harbor Light.

Not in M3, each deferred to where it is first needed:

| Deferred | Why it can wait | First needed by |
| --- | --- | --- |
| Narrative order, presentations, linking screenplay scenes to events | `stateAt` needs a story anchor, not a narrative position | M4 (anchor a Write scene) |
| WorldContext, HistoryContext, causal and continuity graphs | linear stories need none of them (temporal doc: "linear stories work without explicit HistoryContext") | Zao slice (M7) |
| Facts, information, epistemic state | separate projection along entity continuity | M4/M7 |
| Spatial graph, navigation over story state | the M1 gravity/Harlan toggles stay exploratory | after M4 |
| Inferring state changes from screenplay prose | that is a Proposal from an agent | M5 |
| Studio UI beyond a read-only check | exit criteria are core behaviour | see decision D5 |

## 3. Model

```text
StoryTimeline (one per project in M3)
  order: StoryEventId[]                 linear story order, earliest first
  events: StoryEvent[]

StoryEvent
  id: StoryEventId                      "event:ferry-departs"
  label: string                         author-facing, e.g. "The last ferry leaves"
  changes: StateChange[]                at most one per state variable

StateChange
  variable: { subject: EntityId, property: PropertyKey }   e.g. lamp / lit
  becomes: { value: string | number | boolean } | { unknown: true }

StoryAnchor
  { event: StoryEventId, at: 'before' | 'after' }

stateAt(timeline, anchor, variables?) -> Map<variable, Projection>

Projection
  | { status: 'determined', value, source }
  | { status: 'unknown', source }      the story says it cannot be known from here
  | { status: 'unset' }                nothing authored before this point

source = { event: StoryEventId, acceptedIn: { changeSetId, projectRevision } }
```

### Rules

- `stateAt` folds the changes of every event strictly before the anchor in timeline order, plus the anchor event itself when `at: 'after'`. The last change to a variable wins.
- `unknown` and `unset` are different answers. `unset` means the author has not said; `unknown` means the story has made it unknowable, for example after the relay fails.
- `stateAt` is a pure function of one timeline projection. The same project revision with two anchors can give two answers (criterion 1). Moving the anchor never writes anything (criterion 2).
- Each answer names the event that set it and the ChangeSet that authored that event's change (criterion 4). That is provenance in authoring history, separate from position in story time, which is what ADR-0004 requires.
- `EntityId` follows the existing identity pattern and resolves through a minimal entity registry ({id, label}, see D2). `PropertyKey` is a namespaced lowercase key (`lamp:lit`, `hatch:state`). Value types are not schema-checked in M3.
- An event removed from the timeline takes its changes with it. History keeps them, and restore brings them back.

## 4. Authority, operations and persistence

Story content is authoritative project state, so it uses the M2 path unchanged: Draft or direct command → Proposal → accepted ChangeSet → ProjectRevision.

New semantic operations (one TypeBox union extension, `schemaVersion` stays 1 because existing records remain valid):

```text
AddStoryEvent        { event: {id, label}, afterEventId | null }
MoveStoryEvent       { eventId, afterEventId | null }
RenameStoryEvent     { eventId, label }
RemoveStoryEvent     { eventId }
SetStateChange       { eventId, variable, becomes }
ClearStateChange     { eventId, variable }
AddEntity            { entity: {id, label} }            (D2)
RestoreStoryTimeline { targetRevision }
```

- **Precondition:** `StoryTimelineVersionEquals`, the counterpart of `DocumentVersionEquals`. A story edit conflicts only with other story edits, never with screenplay edits.
- **Projection:** the timeline is one more checkpointed scope, materialized the same way screenplay scopes are, as an order plus states. Reconstruction, export and restore reuse the M2 machinery.
- **PostgreSQL:** additive migration `003_story_timeline.sql` with two tables, `authoring_story_timelines(project_id, timeline_version, content)` and `authoring_story_checkpoints(project_id, revision_number, timeline_version, content)`, plus an entity registry table if D2 is accepted. Screenplay tables are untouched (D4).
- **Provisional work:** story edits go through Proposals like screenplay edits. A story Draft is **not** in M3. Editing UI is deferred, so a dedicated Draft type would be speculative.

## 5. Fixture

The fixture is neutral and extends Harbor Light rather than Light Delay canon, so M3 makes no narrative claims (ADR-0002):

| Order | Event | Changes |
| --- | --- | --- |
| 1 | Dusk: Mara lights the lamp | lamp:lit → true; ferry:position → "docked" |
| 2 | The last ferry leaves | ferry:position → "at sea" |
| 3 | The storm takes the relay | relay:working → false; ferry:position → unknown |
| 4 | Dawn: the ferry is sighted | ferry:position → "in sight" |

Anchors and expected answers:

- before 2: ferry docked;
- after 3: ferry position unknown, with its source;
- after 4: in sight;
- relay before 1: unset.

All four come from one project revision. Editing event 3 is a new revision, and the earlier revision still answers as before.

## 6. Tests mapped to exit criteria

| Criterion | Test |
| --- | --- |
| 1 | same revision, anchors before 2 and after 4 → different `ferry:position` |
| 2 | moving the anchor writes nothing (head unchanged); editing an event creates exactly one revision; `stateAt` at the old revision is unchanged |
| 3 | `unknown` after 3 vs `unset` for the relay before 1; both round-trip through PostgreSQL |
| 4 | every determined or unknown answer names its event and accepting ChangeSet |
| — | conflicts: two story edits on one timeline version conflict; a story edit and a screenplay edit do not |
| — | restore of the timeline, export and reconstruction, in-memory and PostgreSQL parity, migration 003 rerun safety |

## 7. Decisions for the owner

- **D1 — Anchor type.** Recommend story-event anchors only in M3. Linking screenplay scene headings to events is M4's first step, because it is per cut and needs narrative order. Alternative: add `SceneDepicts { elementId, eventId }` now, so Write can show "state at this scene" earlier.
- **D2 — Subjects.** Recommend a minimal entity registry ({id, label}). Answers need human labels in M4, and the domain model is entity-centric. Alternative: free-form subject strings now, and a registry later (a data migration).
- **D3 — Unknown vs unset.** Recommend both, as above. Alternative: a single "undetermined" (simpler, but loses the author's statement that something became unknowable).
- **D4 — Storage.** Recommend separate story tables (additive, no risk to screenplay data). Alternative: generalize `authoring_scopes` with a scope kind (one mechanism, riskier migration).
- **D5 — UI in M3.** Recommend none beyond the existing app staying green, plus an API read endpoint used by a browser test. Alternative: a read-only "Story state" panel (pick an event, see the state before and after it with sources), about a day's work and useful for the human acceptance pass.
- **D6 — Sequencing.** Recommend starting M3 only after the integration to `master` (and staging, if the access boundary is ready), branching from the merged `master` SHA. This note can be reviewed and merged as documentation meanwhile.
