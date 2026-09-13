# Visual stretch pipeline

English source. Not narrative authority. Implements shared multi-shot still coherence for Light Delay.

## Purpose

Consecutive same-location shots often share cast layout, physics, and lighting. Still prompts are **stateless** (`DIALOGUE_AND_PROMPT_LESSONS.md` §2c), so independent generations drift. A **visual stretch** on `ScriptFile.visualStretches[]` holds stretch-constant blocking once; the compiler builds **one ordered multi-panel storyboard sheet**; the repository **splits** panels into derived candidate takes. Seedance later attaches those panels as ordered keyframes (`SEEDANCE_PROMPTING.md` §6.2) and may attach the sheet as an optional blocking reference.

## Authority

| Layer | Owns |
| --- | --- |
| Stretch | Positions, physics, lighting, absences, sharedDescription (stretch-constant only) |
| Shot.description / composition / camera | Shot-specific framing and action |
| Member stages | startState / event / endState |
| Take.generation.prompt | Disposable compile output |

Conflict on a stretch-constant fact → compilation blocker (do not invent seats).

## Generation boundary

1. Repo compiles prompt + layout (`scripts/compile-visual-stretch.mjs` / `scripts/lib/visual-stretch.mjs`).
2. **Agent image-generation tool** (currently gpt-image-2) produces the grid when the author authorizes it.
3. `register-visual-stretch-sheet.mjs` lands the file via **OS temp + atomic rename** into `static/assets/.../stretches/<slug>/sheet.png` (temp paths never enter JSON).
4. `split-visual-stretch-sheet.mjs` (sharp) crops panels; registrar creates **new candidate takes** (`selectedTakeId` unchanged).
5. Playback uses the selected take only — never the unsplit sheet as a shot frame.

## Layout policy

Default ladder: **1–4 → 2×2**, **5–9 → 3×3**, **10+ → blocker** (split into authored stretches). **4×4** only if the still-provider snapshot allows it and panels meet `minPanelResolution`. `blankCells` are **1-based**; omit or `[]` when the grid is full. Three-member pilot uses `blankCells: [4]`. Authored overrides are validated as strictly as compiler layouts.

Inner gutters only (`gutterFraction`, pilot `0.02`). Letterbox/pillarbox **computed** from output size vs content aspect; stored on the job as `computedMargins`.

## Jobs and Seedance

Plan root `visualStretchJobs[]`. Still modes: `combined_storyboard_sheet` | `independent_shared_authority` (author/provider only; `coherenceException` required). Video: `grouped_seedance` with `dependsOnStillJobId`. A stretch is **not** one video job — partition by segment ceiling (~30 s). `compiledPrompt` stays `null` until editorial freeze.

## Asset status

Reuse `imageStatus`: sheet `needs_review` after register; `needs_replacement` + explanation if split fails. Job-record `supersededByJobId` only — not an asset status enum.

## CLI

```bash
npm run compile:visual-stretch -- --script light-delay-festival-master --stretch festival-master:stretch-bridge-meal-010-012
npm run report:visual-stretches -- --script script:light-delay-festival-master
npm run register:visual-stretch-sheet -- --script light-delay-festival-master --stretch <id> --from <generator-output.png>
npm run split:visual-stretch -- --script light-delay-festival-master --stretch <id> [--dry-run]
```

## UI (v1)

JSON/CLI authoring. ShotCard badge + ShotDetailsPanel expose stretch id, revision, members, sheet, selected vs candidate, blockers. Full `/stretches/[scriptId]` deferred.
