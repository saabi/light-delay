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
3. `register-visual-stretch-sheet.mjs` lands the file via **same-directory `.partial` + atomic rename** (EXDEV-safe on Windows) into `static/assets/animatic/frames/<script-segment>/stretches/<slug>/sheet.png` (temp paths never enter JSON).
4. `split-visual-stretch-sheet.mjs` (sharp) crops panels to `panel-NN.png`.
5. `register-visual-stretch-panels.mjs` creates **derived assets** (`source.originalAssetId` → sheet) and **new candidate takes** (`selectedTakeId` unchanged; idempotent by `stretchJobId` + shot; refuses if that candidate is selected). Backfills plan `derivedTakeId` / `derivedAssetId` when the plan file exists.
6. Playback uses the selected take only — never the unsplit sheet as a shot frame.

## Layout policy

Default ladder: **1–4 → 2×2**, **5–9 → 3×3**, **10+ → blocker** (split into authored stretches). **4×4** only when the still-provider snapshot lists a 4×4 layout and panels meet `minPanelResolution`. Compilers and validate-data read that flag from `provider-capabilities.json`. `blankCells` are **1-based**; omit or `[]` when the grid is full. Three-member pilot uses `blankCells: [4]`. Authored overrides are validated as strictly as compiler layouts.

Output size: **largest** listed `outputSizes` entry that still meets `minPanelResolution` for the layout (not merely `outputSizes[0]`).

Inner gutters only (`gutterFraction`, pilot `0.02`). Letterbox/pillarbox **computed** from output size vs content aspect; stored on the job as `computedMargins`.

## Jobs and Seedance

Plan root `visualStretchJobs[]`. Still modes: `combined_storyboard_sheet` | `independent_shared_authority` (author/provider only; `coherenceException` required). Video: `grouped_seedance` with `dependsOnStillJobId`. A stretch is **not** one video job — partition by segment ceiling (`min(campaign.maxSegmentMs, provider.maxDurationMs)`). Seedance 2.5 hard limit is **30 s** per generation on Higgsfield ([product FAQ](https://higgsfield.ai/seedance-2.5)); resolution (including 480p) does not raise that ceiling. Single members longer than the ceiling get `member_exceeds_max_duration` rather than a clean oversized job.

Still jobs budget every authored `referenceAssetIds` entry against the still-provider limits (gpt-image-2: 8). Seedance jobs use ordered keyframe images plus **either** authored `videoReferenceAssetIds` (explicit policy) **or** uncovered still-list leftovers (fallback when the property is absent). Coverage is per registered-keyframe shot only — one keyframe does not cover the whole stretch cast. Custom assets not on an entity’s catalog sheet list do not satisfy entity completeness. Jobs always set `runnable: false` when any blocker is present (including `member_exceeds_max_duration` and `missing_keyframe:*`). Each job pins `providerSnapshotId`. **No submission adapter exists in-repo** — MCP agents consume a §8 **run file** from the handoff CLI.

`Take.productionGate` (`deferred` / `blocked`) on any member source take blocks **both** still and Seedance jobs for that stretch (no silent partial). Derived plan field `generationGate` carries `status`, `reasonCode`, `takeIds`, and (when deferred) `prerequisiteAssetIds`. When members mix deferred and blocked, derived `status` is **deferred** (union of deferred prerequisites; all hold takeIds retained). Script takes remain SoT; do not hand-author `generationGate` on the plan.

Plan job reference fields: `stillReferenceAssetIds` (complete still list, never trimmed), `videoReferencePolicy` (`fallback`|`explicit`), optional authored `videoReferenceAssetIds` only when explicit, derived `effectiveVideoReferenceAssetIds` + `voiceSampleAssetIds`. Deprecated `sharedReferenceAssetIds` must equal the still list on still jobs and effective video visuals on video jobs.

### Agent / Fable rules (still vs video refs)

- Never remove a reference from the still/keyframe list because it will appear in video.
- Populate `videoReferenceAssetIds` separately when video needs a different static set (tri-state: absent = fallback; `[]` = explicit empty).
- Generate keyframes from the complete still list first.
- Compile video references only after keyframes are registered.
- Do not treat a video job as runnable while required keyframes are missing (`missing_keyframe:*`) or explicit completeness fails (`uncovered_video_entity:*`).
- Staging/`prepare:higgsfield` must preserve handoff order: keyframes → effective visuals → voice.

### MCP handoff boundary

```text
generation plan job → §8 run JSON (preview) → [future freeze → ready] → one MCP smoke → result manifest → job-level register
```

- `npm run handoff:visual-stretch -- --script … --job … --allow-preview-prompt` writes `reports/runs/*.json` with `nonExecutable: true` / `status: preview`. **Never submit preview runs to Higgsfield.**
- Paid smoke requires a future freeze that sets plan `compiledPrompt`, run `status: ready`, and `nonExecutable: false`, then human cost confirmation.
- `executionPolicy.smoke_test` forces `maxJobs: 1` regardless of platform parallel capacity (account concurrency is recorded separately; see `HIGGSFIELD_MCP.md`).
- Keep the exact run file used for any future submit; do not re-handoff between submit and register (`inputDigest` covers the prompt).
- After completion: download the generated video from Higgsfield Assets into the repo under `static/` (agreed stretch path), then register with `--run` pointing at the exact ready run file used for submit. Freeze must omit null keyframe slots from executable `references[]` while keeping `missing_keyframe:*` blockers until panels exist.

Voice samples: **one** approved `sampleAssetIds` entry per dialogue speaker for the job language (`en` first), matching `SEEDANCE_PROMPTING.md` §4 / §6.1 — not every variant's samples.

## Asset status

Reuse `imageStatus`: sheet `needs_review` after register; panel candidates `needs_review`; video asset `needs_review` after job-level register; `needs_replacement` + explanation if split fails. Job-record `supersededByJobId` only — not an asset status enum.

## CLI

```bash
npm run compile:visual-stretch -- --script light-delay-festival-master --stretch festival-master:stretch-bridge-meal-010-012
npm run report:visual-stretches -- --script script:light-delay-festival-master
npm run handoff:visual-stretch -- --script light-delay-festival-master --job <stretchJobId> --allow-preview-prompt
npm run register:visual-stretch-sheet -- --script light-delay-festival-master --stretch <id> --from <generator-output.png>
npm run split:visual-stretch -- --script light-delay-festival-master --stretch <id> [--dry-run]
npm run register:visual-stretch-panels -- --script light-delay-festival-master --stretch <id> [--dry-run]
npm run register:visual-stretch-video -- --from data/production/runs/<runId>-results.json --run <ready-run.json> [--video <downloaded.mp4>]
```

## UI (v1)

JSON/CLI authoring. ShotCard badge + ShotDetailsPanel expose stretch id, revision, members, sheet, still refs, video reference policy (and authored video refs when explicit), selected vs candidate, blockers from the shared completeness predicate. Deferred/blocked `Take.productionGate` shows as a readiness flag and take-section badge (reason + prerequisite catalog/manifest status). Full `/stretches/[scriptId]` deferred.
