# M3 — Story structure and story-time state, from real material: design note

Status: **direction accepted by the owner (Oct 2, 2026); slice designs below are proposals until each slice's PR.** Nothing here is implemented.

Sources:
- [ADR-0002](ADR-0002-MASTER-NARRATIVE-AUTHORITY.md) (narrative authority);
- [ADR-0004](ADR-0004-AUTHORING-STORY-STATE-AND-PROVISIONAL-WORK.md) (authority tiers, import proposals);
- [domain model](V2_DOMAIN_MODEL.md) §4, §6, §9, §14.5;
- [temporal and epistemic semantics](V2_TEMPORAL_AND_EPISTEMIC.md);
- the [roadmap](V2_IMPLEMENTATION_ROADMAP.md#milestone-3--story-structure-and-story-time-state-from-real-material).

## 1. Why M3 changed

The original M3 asked for the smallest `StateChange` / anchor / `stateAt(...)`, proven on an invented example. Meanwhile the roadmap named, but never scheduled, *Story → Version → Outline → Screenplay*. Reviewing the real Luz Tardía material showed that the two are one problem. `data/outlines/light-delay-master-narrative.json` (authoritative under ADR-0002) holds:

| Material | Count | What it is |
| --- | --- | --- |
| framing sections | 11 | prose: premise, tone, etc. |
| story sections | 8 | Prologue, Sequence A, Sequence B… |
| story steps | 58 | one level (`level: story`), ordered, localized es/en title and body, importance |
| causal links | per step | `enables`… with an explanation, step to step |
| facts | 40 | introduced at a step, audience visibility, dependencies, legacy IDs |
| knowledge events | 150 | character × fact × step: who learns what, where |
| action requirements | 6 | an action at a step requires the actor to know certain facts |

Two derived outlines are active:
- `light-delay-festival-master` (24 steps): an adaptation with fidelity `complete_causal_chain`, review `stale`;
- `light-delay-trailer-master` (6 steps): derived from the festival outline, fidelity `deliberate_omission`.

The Markdown outlines in `docs/wip/` are exports generated from the JSON.

So the outline's meaning is mostly causal and epistemic (who knows what, and when), not a tree of headings. M3 therefore models story structure and story-time state together, from this material, and keeps the original exit criteria.

## 2. Owner decisions (Oct 2, 2026)

1. M3 is redefined as this milestone and built in slices 3a–3e. The original M3 exit criteria are met in slice 3b.
2. **Authority stays with the repository.** The Studio project is a reviewable copy with recorded provenance. Under ADR-0002 the JSON remains the authority until a new ADR moves it, and Studio never writes to `data/`.
3. **Bounded exception to "do not bulk-import Light Delay HEAD".** Only the master outline and its two active derived outlines may be imported, as reviewable copies.
4. **The first importer reads the JSON, not Markdown.** The JSON has stable IDs and loses nothing; the Markdown is its export. A Markdown importer comes later, for projects that only have Markdown.
5. **Integration of `implementation/m2-authoring` into `master` comes first.** Slices branch from `master`.

## 3. Model

```text
STORY (fabula)
  StoryEvent        id, label, story order on one linear timeline (M3)
  Fact              id, description, depends on facts, status, audience visibility
  KnowledgeEvent    characters learn a fact at a story event
  CausalLink        event → event, relation, explanation
  StateChange       at an event, a variable becomes a value or unknown
  ActionRequirement an action at an event requires the actor to know facts

NARRATIVE (a version: master, festival, trailer)
  NarrativeVersion  id, label, derivation {source version, relationship, fidelity, review status}
  NarrativeUnit     id, kind (open vocabulary: section, step, …), parent, order,
                    title + body (localized), importance, presents → StoryEvent(s)

SCREENPLAY (existing)
  screenplay elements; later realizes → NarrativeUnit (slice 3e)
```

- **Fabula and presentation stay apart.** Each master step becomes one `StoryEvent` and one `NarrativeUnit` in the master version that presents it. A derived outline adds units that present the same events, so omission, compression and reordering are visible instead of copied.
- **Levels are a vocabulary, not a schema.** `kind` is the source's own (`section`, `step`). Acts or scenes appear only when material uses them.
- **Story order.** M3 has one linear timeline per project. For the imported project it is the master outline's order, recorded explicitly so it can diverge later (narrative order belongs to versions).
- **Localization.** `{ en, es }` strings with the source language recorded. English is the source of truth (AGENTS.md); translations marked `needs_revision` keep that status.
- **IDs.** Source IDs are kept for the objects they name (`master:story-a3b` is a valid Studio ID). Objects the source lacks get derived IDs (`event:master.story-a3b`), and every object records the source ID it came from.

## 4. Queries (story-time state)

```text
StoryAnchor = { event: StoryEventId, at: 'before' | 'after' }

stateAt(anchor, variables?)  → determined {value, source} | unknown {source} | unset
knowsAt(character, anchor)   → facts the character knows, each with the knowledge event that taught it
availableAt(anchor)          → facts revealed in the story so far
findings()                   → requirement and reference errors (below)
```

- **Pure projections.** All four are pure functions of one accepted project state. Two anchors in one revision can differ, and moving an anchor never writes anything.
- **Provenance.** Every answer names its source event and the ChangeSet that authored it.
- **`unknown` and `unset` differ.** `unknown` means the story made it unknowable; `unset` means nothing is authored.
- **Parity target.** `findings()` must reproduce the legacy rules exactly, as `scripts/report-causal-validity.mjs` applies them, on the imported master:
  - a fact required before it is revealed;
  - unknown fact or step references;
  - an actor acting without knowing a required fact (first-learned order compared with the action's order).

## 5. Import

```text
source file (path, git commit, SHA-256, schema version)
  → deterministic interpretation (importer id + version)
  → ImportProposal: semantic operations + findings + counts; original retained
  → review in Studio (counts, tree, findings), accept or reject
  → accepted ChangeSet(s) → project state
```

- **New proposal source kind `import`.** Proposals today are made only from screenplay Drafts. Acceptance, conflicts and history reuse the existing path.
- **Creating structure.** Creating a project, version, document, entity or event becomes a semantic operation instead of a bootstrap fixture. An empty project is created by an admin command (`studio:import-outline`), never from the web UI in M3.
- **Re-import.** A newer JSON revision produces a new ImportProposal holding only the differences from the last imported revision. While the repository is authoritative, the Luz Tardía project in Studio is not edited by hand (slice 3c), so re-import never conflicts with Studio edits.
- **Characters.** Characters are referenced by their existing IDs (`character:voss`) through a minimal entity registry ({id, label}), imported from `data/characters.json` only for the IDs the outline uses.

## 6. Slices

Each slice is one or a few PRs, branched from `master`, with its own exit criteria.

| Slice | Delivers | Exit criteria |
| --- | --- | --- |
| **3a** Structure and import | operations to create structure; `import` proposal source with provenance; master-outline importer (sections and steps; framing prose as decided in §8); entity registry; migration 003; import review screen; read-only **Outline** lens | the master imports as one reviewed proposal; its counts match the source; re-import of an unchanged file proposes nothing; PostgreSQL parity; Write unchanged |
| **3b** Story-time state (original M3) | facts, knowledge events, causal links, action requirements, state changes; `stateAt`, `knowsAt`, `availableAt`, `findings` | original M3 criteria; `findings()` equals the legacy report on the master; knowledge differs between two anchors in one revision; a Harbor Light state-change example for world state (the outline has no explicit world-state data) |
| **3c** Editing | outline editing through Drafts and Proposals (reorder, edit, add, remove units), generalizing Drafts beyond screenplay | edits round-trip like screenplay edits. **Gated:** applies to Studio-native projects; editing the Luz Tardía copy needs the authority ADR first |
| **3d** Derived versions | festival-master and trailer-master as narrative versions with derivation metadata and units presenting master events | omissions and reorderings are queryable; the trailer's deliberate omissions are preserved (AGENTS.md cut rules) |
| **3e** Screenplay link | screenplay import (festival-master script) as a proposal, scenes realize units; Markdown importers | scenes link to units and survive rewriting; differences between outline and screenplay are reported, never auto-propagated |

## 7. Not in M3

- WorldContext and HistoryContext;
- entity continuity across histories;
- diegetic media lifecycle (the Zao slice, M7);
- the Context Engine (M4) and agents (M5);
- inference from prose;
- editing the authoritative Luz Tardía material in Studio;
- writing back to `data/`;
- Markdown import before 3e.

## 8. Open questions, decided per slice

- **3a:** does framing prose import as units of kind `framing` in the master version, or as project notes? (Proposed: units, kept out of story order.)
- **3b:** are story steps one event each, or can a step present several events? (Proposed: one each at import; splitting is a later authoring action.)
- **3d:** the trailer derives from the festival outline, not the master. Do derivation chains resolve to master events through the festival units? (Proposed: yes, recorded per unit.)
