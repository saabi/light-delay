# V2 temporal and epistemic semantics

Status: **core architecture companion**.

This document isolates temporal/knowledge rules that must not be simplified during implementation.

## Four independent orders

The model distinguishes:

1. **world/calendar time** — when an event occurs in a fictional history;
2. **causal order** — what causes/enables what;
3. **entity continuity** — the sequence an entity experiences or carries through;
4. **narrative order** — when/how the audience encounters material.

A linear story may let all four coincide. A flashback normally changes narrative order only. Time travel can separate all four.

## HistoryContext is optional

Ordinary stories need no alternate-history machinery.

Projects that need it may use HistoryContext with a temporal policy such as:
- linear;
- fixed-loop;
- mutable-history;
- branching;
- multiple-timelines;
- custom.

HistoryContext describes fictional history identity. It is not:
- WorldContext (dream/simulation/imagined/actual ontological context);
- NarrativeVersion (cut/adaptation/product);
- project ChangeSet/history branch.

## Entity continuity

Entity continuity is a graph relation:

```text
entity + event A -> event B
```

It is generic rather than character-specific. Characters, vehicles, artifacts or other persistent entities may cross temporal/history boundaries.

A time traveler may therefore experience:

```text
H0 / 1985 departure
  -> H1 / 1955 arrival
  -> H1 / 1985 return
```

even though world/calendar ordering differs.

Temporal/project profiles determine preservation behavior when histories change. The core must not hard-code Back-to-the-Future-style rules.

## World truth, information and epistemic state

Keep separate:

- **world truth/assertions** — propositions the project treats as true/false/unresolved in a context/history/interval;
- **information** — proposition/content that can be represented, transmitted, stored or remembered;
- **epistemic state** — what a subject knows, believes, suspects, remembers, doubts, rejects or misunderstands.

Epistemic state is not a static Character field.

It is derived from EpistemicEvents projected along entity continuity.

```ts
interface EpistemicEvent {
  id: EpistemicEventId;
  subjectEntityId: EntityId;
  informationRef: InformationRef;
  operation:
    | "learn" | "observe" | "infer" | "believe" | "suspect"
    | "remember" | "doubt" | "reject" | "forget" | "revise";
  experiencedAtEventId: StoryEventId;
  sourceEventId?: StoryEventId;
  sourceHistoryContextId?: HistoryContextId;
  confidence?: number;
}
```

The authoritative records are epistemic events/information/provenance. An EpistemicState is normally a derived projection/cache.

## Altered-history example

A traveler leaves H0/1985 knowing family history A, changes events in 1955, then arrives in H1/1985.

At the same destination world time:
- H1 residents may remember only H1 history;
- the traveler may remember H0 plus personally experienced changes;
- an artifact carried across histories may retain H0-origin information if the temporal policy permits it.

These incompatible memories are not automatically continuity errors.

A validator should instead ask whether there is a valid acquisition/continuity path for the subject's information.

## Information acquisition and explanation

Epistemic changes may originate from:
- direct observation;
- communication by another entity;
- receiving/reading/hearing an artifact or representation;
- inference from other information;
- prior memory carried through continuity;
- revision/rejection/forgetting.

Queries should include:

```text
getEpistemicState(subject, at)
explainEpistemicState(subject, information, at)
```

The second is important for validation and AI context: it should explain *how* the subject acquired or retained the information.

## Audience knowledge

Audience knowledge is related but should not be implemented by pretending the audience is an ordinary Entity.

NarrativePresentation/revelation determines what information has been made available to the audience at a narrative position. A dedicated audience-information projection may derive from presentations.

## Causal cycles

Do not assume the causal graph is universally a DAG. Fixed-loop/bootstrap-paradox stories may deliberately contain causal/information cycles. Temporal/profile policy determines whether a cycle is valid, suspicious or forbidden.

## Diegetic media

A recording of an earlier event is not itself a flashback.

Separate:
- event being captured;
- Artifact/Representation carrying information;
- transmission/storage lifecycle;
- later playback/presentation event;
- narrative placement of that playback.

This permits a deceased character to appear in a later recording without implying physical presence or a temporal flashback.

## Context Engine implication

When generating/reviewing dialogue or action for a character, structural context should include the relevant epistemic projection. The model should not receive facts merely because they are globally true if the character cannot know them.

## Acceptance requirements

- linear stories work without explicit HistoryContext;
- true flashback changes narrative order without changing story chronology;
- time traveler continuity may run backward through world time;
- altered-history traveler can retain H0 information in H1;
- H1 native does not gain H0 information without an acquisition path;
- false belief and unreliable memory remain representable;
- carried artifacts may preserve prior-history provenance;
- fixed-loop information cycles may be permitted by profile;
- ordinary mystery knowledge/revelation works without time travel;
- audience revelation remains distinct from character epistemic state.
