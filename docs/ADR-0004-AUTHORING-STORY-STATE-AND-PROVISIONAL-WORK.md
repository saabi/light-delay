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

M2 clarifies two lifecycle invariants within this decision. Saving an existing Draft preserves its original semantic base; changing that base requires a future explicit rebase/merge action. A Proposal may transition exactly once from pending to accepted or rejected. Persistence adapters must expose conditional transitions, not unconditional state overwrite.

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

Semantic operations preserve intent. Versioned snapshots/checkpoints may be used for efficient durable reconstruction. Replay may be used as a verification mechanism. M2 stores revision metadata plus affected document × version checkpoints rather than a full project copy per revision, while retaining a one-time initial projection and deterministic reconstruction. The implementation must not claim a restore succeeded unless the resulting authoritative projection is semantically equivalent to the selected historical state.

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
- Accepted provenance distinguishes content authors/source/proposer from the trusted principal who accepts the ChangeSet.
- Accepted-history representations and semantic-operation reducers are explicitly versioned so historical evidence is not reinterpreted by later command rules.
- More complex branching, CRDTs, and collaborative draft semantics remain deferred.

## Addendum — saving and committing in Write (Oct 1, 2026)

Status: **accepted** by the owner after the [Write UX review](reviews/2026-10-01-studio-write-ux-review-claude.md). This addendum changes how the two promises above are presented in Write. It does not change the authority tiers, the Proposal lifecycle, ChangeSet provenance or restore.

**Saving.** The author's own typing autosaves the Draft: after a short pause in typing, when the editor loses focus, and before any navigation that would replace the editor's content. There is no Save button in the normal flow. The save state shows *Saved*, *Saving…* or a failure; it never shows a protection that does not exist. "Offline — kept on this device" requires local persistence of unsaved text (the IndexedDB mirror deferred from M2.5). Until that exists, a failed save shows *Not saved — Retry*. *(Oct 2, 2026: the mirror exists. Unconfirmed edits are kept in IndexedDB until the server confirms them and are restored, or shown for the author to choose, on the next visit. The copy is a browser-local safety net: it never becomes authority, and saving still goes through the Draft.)*

**Committing.** One deliberate commit action promotes the author's own Draft into project history. The author sees the changes inline in the document and confirms. Underneath, this is still a Proposal created from the Draft (with a stable caller-supplied Proposal ID) and accepted by the same trusted principal, through the same ChangeSet boundary and preconditions. Content author, deterministic proposer and accepting principal remain distinct in provenance. Whether create and accept become a single atomic application command (`CommitDraft`) or remain two commands with the existing reconciliation is decided in the implementation plan. If they remain two, a conflict after creation must leave the pending Proposal visible and reviewable, never silently orphaned. *(Oct 2, 2026: accept and restore take an optional note, stored on the ChangeSet as `note: { text }` and shown in History. It needs no migration: ChangeSets are stored as validated records and the field is optional.)*

**Implementation decision (Phase 3, Oct 1, 2026).** Commit remains two application commands; no `CommitDraft` command was added. *Commit changes* saves any pending edits, creates the Proposal from the saved Draft with a caller-supplied ID that is stable for that Draft state, and shows the Proposal's operations inline in the page; *Commit* then accepts exactly that Proposal. What the author reviews is therefore the deterministic proposer's output, not a client recomputation, and each step keeps its existing reconciliation (idempotent creation by ID; accept reconciled against authoritative state). If accept fails, for example because another commit advanced the cut, the Proposal stays pending and opens for review with accept and reject. Proposals made from an earlier state of the same Draft are superseded and not shown. Core, contracts and persistence are unchanged.

**Proposals from elsewhere.** AI suggestions, importer interpretations and collaborators' proposals keep the explicit review surface with accept and reject. They are never committed by the author's commit action unless the author has reviewed them.

**Unchanged.** *Saved* and *accepted into project history* remain different promises. A Proposal still transitions exactly once. Scoped conflict checks, restore as a new attributable revision, and sibling-cut isolation are unchanged. A Draft whose base has advanced still fails its scoped check on commit; Studio shows the conflict and offers review. An explicit rebase/merge remains future work.
