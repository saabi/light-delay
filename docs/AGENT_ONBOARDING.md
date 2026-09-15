# Agent onboarding

Short day-one index for agents. **Policy lives only in [`AGENTS.md`](../AGENTS.md).** This file indexes; it does not invent a second rule set.

Status: English source. Not narrative authority.

## Day-one checklist

1. Read [`AGENTS.md`](../AGENTS.md) (working set, layer map, upward-propagation gate).
2. Narrative SoT = `data/outlines/light-delay-master-narrative.json` (WIP authoritative).
3. Production WIP = `script:light-delay-festival-master` (+ its outline). Trailer WIP = `script:light-delay-trailer-master`.
4. `canonicalScriptId` / master script = empty **route stub**, not “no screenplay exists.”
5. Deprecated: `main-short`, `festival`, `trailer`, `long`. Never confuse `light-delay-festival` with `light-delay-festival-master`.
6. Lifecycle / authorized derivatives: `data/editorial-lifecycle.json`.
7. Edit English first; Spanish may be `needs_revision`.
8. Higher layers win. Conflicting lower-layer story fixes → **notify → first approval → repercussion proposal → second approval → edit top-down** (`AGENTS.md`).
9. Edit `Shot.description` before / with `Take.generation.prompt`. Still prompts: no spoken dialogue (`npm run scrub:still-prompts:check`).
10. Do not regenerate images unless asked; `imageStatus` records debt only. Generation holds use `Take.productionGate` (skip deferred/blocked until cleared; plan `generationGate` is derived). Stretch still refs stay complete; optional `videoReferenceAssetIds` is separate. After Seedance, register/attach the clip so Movie mode replaces stills (`AGENT_GENERATION_BRIEF.md` §8.5).
11. After material edits: `CHANGELOG.md`, `docs/PROJECT_STATUS.md`, `npm run validate:data`.

## Layer map

```text
Master outline
  → Derived outline
    → ScriptFile (cues / dialogue)
      → Shots + Takes (storyboard)
        → Take.generation.prompt
          → assets / plans / manifest
```

Authority flows **down**. Compatible lower-only fixes (typo, timing slack, non-story prompt scrub) do not need the upward gate.

### Worked example (upward gate)

**Symptom:** Festival-master dialogue and a shot still claim the bomb is “set for contact coordinates,” but the intended canon is that **only the timer is set to arrival time**.

**Wrong:** Silently rewrite the cue and prompt and leave the outline claiming coordinates, or silently rewrite the outline without asking.

**Right:**

1. Notify the author: lower layer wants timer-only; higher outline/script copy still says coordinates (or the reverse).
2. Wait for approval to treat timer-only as the direction.
3. List repercussions (derived outline beat, scene/beat summaries, cues, shot descriptions, prompts, object catalog, trailer outline, TTS links, stale still).
4. Wait for second approval of that cascade.
5. Edit the highest affected authoritative layer first, then cascade down; mark the still stale — do not regenerate unless asked.

## Role tracks (read next)

| Task | Read next |
| --- | --- |
| Narrative / outline | [`docs/ADR-0002-MASTER-NARRATIVE-AUTHORITY.md`](ADR-0002-MASTER-NARRATIVE-AUTHORITY.md), master outline JSON, [`docs/GUIA_ESCALETA.md`](GUIA_ESCALETA.md), [`docs/ESCALETA.md`](ESCALETA.md), [`docs/production/CAUSAL_AND_MEANING_PIPELINE.md`](production/CAUSAL_AND_MEANING_PIPELINE.md), [`docs/PROJECT_STATUS.md`](PROJECT_STATUS.md) |
| Script / dialogue | `data/scripts/light-delay-festival-master.json`, `data/voice-profiles.json`, [`docs/production/DIALOGUE_AND_PROMPT_LESSONS.md`](production/DIALOGUE_AND_PROMPT_LESSONS.md), [`docs/production/DIALOGUE_CLARITY_GUIDE.md`](production/DIALOGUE_CLARITY_GUIDE.md) |
| Storyboard / stills / prompts | [`docs/production/AGENT_GENERATION_BRIEF.md`](production/AGENT_GENERATION_BRIEF.md), [`docs/ARQUITECTURA_GENERACION.md`](ARQUITECTURA_GENERACION.md), prompt lessons above |
| Causal rebuild / meaning | [`docs/production/CAUSAL_AND_MEANING_PIPELINE.md`](production/CAUSAL_AND_MEANING_PIPELINE.md), `npm run report:causal-structure`, `npm run report:meaning-audit` |
| Visual stretches (multi-shot stills) | [`docs/production/VISUAL_STRETCH_PIPELINE.md`](production/VISUAL_STRETCH_PIPELINE.md), `npm run compile:visual-stretch`, `npm run report:visual-stretches` |
| MCP / Seedance smoke | [`docs/technical/HIGGSFIELD_MCP.md`](technical/HIGGSFIELD_MCP.md) §8b — package-prep must report **cost + input assets** before waiting for go |
| App / Svelte | [`README.md`](../README.md), `src/lib/data/`, [`docs/ADR-0001-MULTI-SCRIPT-CONTINUITIES.md`](ADR-0001-MULTI-SCRIPT-CONTINUITIES.md) |
| Media tooling | [`docs/production/RESOLVE_OTIO_EXPORT.md`](production/RESOLVE_OTIO_EXPORT.md), TTS scripts in `package.json` — not generation authority |

## Do not treat as current authority

| Item | Why |
| --- | --- |
| `docs/CANON_DECISIONS.md` | Previous continuity; provenance only |
| `script:light-delay-festival` / main-short / trailer / long | Deprecated products |
| Obsolete `data/production/plans/light-delay-{main-short,festival,trailer,long}.json` | Old cuts; do not reuse as current briefs |
| `legacy-site/` | Archive for rescue only |
| Generated `docs/wip/*` master Markdown exports | Derived from JSON; not hand SoT |
| Blueprint MD under `docs/wip/` | Staging for shot IDs; not SoT |

## Command cheat-sheet

| Command | Use |
| --- | --- |
| `npm run validate:data` | Primary data / schema / lifecycle gate |
| `npm run validate:docs` | Doc claims + local Markdown links |
| `npm run validate:translations` | Inline i18n completeness |
| `npm run scrub:still-prompts:check` | No spoken dialogue in **still** prompts (not Seedance/video) |
| `npm run report:image-debt` / `report:prompt-readiness` | Production readiness (images / plans) |
| `npm run report:causal-structure` | Live master + Festival fact bindings |
| `npm run report:causal-validity` | Deprecated/obsolete cut ledgers only |
| `npm run compile:visual-stretch` | Dry-run combined-sheet prompt for a stretch |
| `npm run register:visual-stretch-video` | Attach a downloaded Seedance stretch clip so Movie mode replaces member stills |
| `npm run rebuild:higgsfield-media-ledger` | Seed Higgsfield upload cache + duplicates report (`HIGGSFIELD_MCP.md` §8b) |
| `npm run report:visual-stretches` | Stretch membership / blockers |
| `npm run report:meaning-audit` | Meaning-review packet after structure is green |
| `npm run check:trailer-spoilers` | Trailer omission rules |
| `npm run generated:check` | Stale generated artifacts |

Depth for generation: [`docs/production/AGENT_GENERATION_BRIEF.md`](production/AGENT_GENERATION_BRIEF.md). Outline procedure: [`docs/GUIA_ESCALETA.md`](GUIA_ESCALETA.md). Causal pipeline: [`docs/production/CAUSAL_AND_MEANING_PIPELINE.md`](production/CAUSAL_AND_MEANING_PIPELINE.md).
