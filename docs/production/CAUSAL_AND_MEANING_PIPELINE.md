# Causal structure + meaning-check pipeline

English source. Spanish may stay `needs_revision`.

## Single fact SoT

Causal **facts**, **knowledgeEvents**, and **actionRequirements** live on the master outline:

`data/outlines/light-delay-master-narrative.json`

Ids are `master:fact-*` only. Cut continuity ledgers are **not** a live fact graph. Festival-master’s ledger is `obsolete` (migration provenance); see [`MASTER_FACT_MIGRATION_MAP.md`](MASTER_FACT_MIGRATION_MAP.md) (author-signed and **applied** 2026-09-13 — live grain is the reminted master outline, not the 1:1 port).

Keep story `causalLinks` for dramatic relations. Facts / knowledge / actions are the checkable machine layer.

## Operating loop

1. Author edits master story prose / `causalLinks` (EN first).
2. Agent **rebuilds** facts + knowledgeEvents + actionRequirements (below).
3. `npm run report:causal-structure` (+ outline derivation / validate as needed) until green.
4. `npm run report:meaning-audit` for the cut (default Festival-master).
5. Agent meaning review — do **not** re-prove the graph.
6. Structured report; update `CHANGELOG.md` / `docs/PROJECT_STATUS.md` if material.

```text
Master outline (facts + knowledge + actions)
  → Derived outline coverage / omissions
    → Script cues implementsFactIds
      → report:causal-structure (deterministic)
        → report:meaning-audit (packet)
          → Agent meaning review
```

## Deterministic vs meaning

| Layer | Deterministic | Meaning |
| --- | --- | --- |
| Master outline | Fact DAG / step order, knowledgeEvents, actionRequirements, causalLinks | Prose vs fact descriptions when facts change |
| Derived outlines | Covered master facts implemented or explicitly omitted; `sourceRevision` drift | Compression still carries required facts; trailer-style omissions |
| Scripts | Cue `implementsFactIds` order + type gates; actions don’t fire before actor knowledge | Dialogue/action/silence wording vs facts + knowers |
| Storyboards | Follow-on: shot-level `implementsFactIds` (deferred) | Packet already includes take prompts / shot descriptions |

## Commands

| Command | Role |
| --- | --- |
| `npm run report:causal-structure` | **Live** causal check for master + Festival-master bindings + “ledger must be obsolete” |
| `npm run report:causal-validity` | Deprecated/obsolete **cut ledgers only**; skips `incomplete` / `obsolete` / `deprecated` as `not_applicable` |
| `npm run report:meaning-audit` | JSON packet for agent meaning review |
| `npm run report:fact-rebuild-proposal` | Orphans / missing reveals / bad knowledge-action refs (proposal only) |

CI runs `report:causal-validity` and `report:causal-structure` as separate steps (same pattern: not folded into `report:all`).

Do **not** document both reports as equal “the” causal check for Festival-master. For master-derived work, use **`report:causal-structure`**.

## Build / rebuild of causal objects

Author edits prose; agents rebuild machine objects with stable IDs.

### Facts

- Mint `master:fact-<kebab>` for a new load-bearing proposition.
- Set `description` (EN first), `status: active`, `introducedInStepId`, optional `dependsOnFactIds`, `audienceVisibility` (`overt` | `withheld` | `implied`).
- Wire the story step’s `revealsFactIds` / `requiresFactIds` to match.
- To change meaning of an id: prefer retire (`status: retired`) and mint a new id; **never** reuse a retired id for a different proposition.
- Keep growth sparse; do not annotate every story step by default.
- After outline diffs, run `npm run report:fact-rebuild-proposal` and reconcile.

### knowledgeEvents

- One row per (stepId, factId, characterIds[]): who learns the fact at that master story step.
- Express delayed or wrong belief with a **distinct fact** plus a later learn event / action gate — not a static `knowersAtIntroduction` field.
- Example: audience learns the burst destination at send; Harlan still believes “Earth / double delay” until a later step.

### actionRequirements

- When an act needs prior knowledge: `{ stepId, actorId, action, requiresKnownFactIds }`.
- `report:causal-structure` fails if the actor has not learned those facts by that step (via knowledgeEvents).

### Cut bindings

- Tag load-bearing cues with `implementsFactIds: ["master:fact-…"]`.
- **Bind by cue content, not adjacency** — story-window / nearest-cue heuristics mis-anchor facts onto neighboring beats (same failure mode as late step-anchoring). Verify spoken/action text depicts the proposition.
- Never mint cut-local fact SoT ids (`festival-master:fact-*` is legacy only).
- Overlapping outline `cueIds` across stories: assign so dependency order is preserved in cue index order (earliest binding of a fact must follow earliest binding of each dependency).
- Deliberate omissions belong in cut policy / explicit omission lists — not silent gaps.

### After rebuild

1. `npm run report:causal-structure`
2. Propagate cue tags on authorized derivatives
3. `npm run report:meaning-audit`
4. Meaning review checklist (next section)

## When structure is green

Structure green means: fact availability vs step order, knowledge/action gates, Festival coverage of required facts, cue order vs `dependsOnFactIds`, light type gates (e.g. withheld ≠ dialogue-only), and Festival ledger not claiming active authorship.

It does **not** mean dialogue wording or still prompts are narratively correct.

## Meaning checklist (agent)

- Does each bound cue’s wording (or silence/action) carry the fact for the intended audience without forced exposition?
- Does `beliefStateAtIntroduction` match who should know vs who must stay wrong?
- Do still prompts / shot descriptions contradict or omit a load-bearing visual consequence of the fact?
- Are trailer (and similar) omissions preserved in text, metadata, and inherited descriptions?
- Do not auto-rewrite dialogue or prompts; report findings and propose edits for author approval.

## Agent report shape

After meaning review, prefer:

```text
## Meaning audit (<cut>)
- Structure: green (report:causal-structure) | debt: …
- Facts reviewed: N
- Findings:
  - factId — severity — observation — proposed fix (layer)
- Upward-propagation: none | needs author gate (conflict …)
```

## Ledger retirement

Festival-master continuity file remains on disk for provenance. `report:causal-validity` must not treat it as a live green SoT. Mapping table: [`MASTER_FACT_MIGRATION_MAP.md`](MASTER_FACT_MIGRATION_MAP.md).

## Related

- Layer map / upward gate: [`AGENTS.md`](../../AGENTS.md), [`docs/AGENT_ONBOARDING.md`](../AGENT_ONBOARDING.md)
- Outline procedure: [`docs/GUIA_ESCALETA.md`](../GUIA_ESCALETA.md), [`docs/ESCALETA.md`](../ESCALETA.md)
- Generation depth: [`AGENT_GENERATION_BRIEF.md`](AGENT_GENERATION_BRIEF.md)
