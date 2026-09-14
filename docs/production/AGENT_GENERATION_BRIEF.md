# Agent generation brief — storyboard, frame and video prompts

Companion reference for any agent (human or model) compiling `data/production/plans/*.json`
generation-plan JSON — storyboard/animatic stills, first/last frame, video-segment prompts,
and reference-asset requests — for a Light Delay script. It indexes authority, contracts,
live data and tooling; it does not itself authorize generation. Read `AGENTS.md` first, then
`docs/AGENT_ONBOARDING.md` for the day-one working set and layer map; this document only adds the
generation-pipeline layer on top of them.

Status: reference document, English source. Not narrative authority. Verified against the
repository on 2026-09-11; re-check line numbers and counts before relying on them long after
that date, since the festival screenplay this brief supports is being authored concurrently.

**Storyboard stills:** durable source for what a shot shows is `Shot.description`; `Take.generation.prompt`
is a disposable compiled artifact (see `DIALOGUE_AND_PROMPT_LESSONS.md` §1). Each still request is
**stateless** — restate gravity and other load-bearing visual state in the prompt (or via attached
refs); scene continuity is not visible to the image model (§2c). Still prompts must not paste spoken
dialogue (`npm run scrub:still-prompts:check`); Seedance/video prompts intentionally include cue text
and voice-sample `@Audio` refs instead.

## 1. Authority chain (read in this order)

| # | File | Why |
| --- | --- | --- |
| 0 | `docs/AGENT_ONBOARDING.md` | Day-one working set, layer map, upward-propagation gate |
| 1 | `AGENTS.md` | Canon, master authority, no invention, no unauthorized (re)generation |
| 2 | `docs/ADR-0002-MASTER-NARRATIVE-AUTHORITY.md` | Which narrative/plan is current vs. deprecated, deletion gates |
| 3 | `docs/ARQUITECTURA_GENERACION.md` (ES) | Pipeline: plan → ES brief → freeze → EN prompt → adapter; the 11 compiler sections |
| 4 | `docs/technical/HIGGSFIELD_MCP.md` (ES) | Seedance/MCP limits, credits, staging, the proposed job-JSON shape |
| 4c | `docs/production/RESOLVE_OTIO_EXPORT.md` (EN) | DaVinci Resolve OTIO assembly + take-swap. Not generation authority |
| 5 | `docs/JSON_FORMAT.md` + `docs/JSON_FORMAT_I18N_ADDENDUM.md` | `ScriptFile` contract: shots, composition, cues, diegetic EN-only text, dialogue variants |
| 6 | `docs/PROJECT_STATUS.md` / `TODO.md` | Current freeze/blocker state — **`TODO.md` predates the Festival-master derivative** authorized in `data/editorial-lifecycle.json` (`lifecycle:master-festival-derivative`); its "do not extend Festival" language does not apply to that authorized WIP, only to the deprecated `light-delay-festival` cut |
| 7 | `data/README.md` | Map of the `data/` tree |

Narrative authority for this work: `outline:light-delay-master-narrative` (rev. 19) →
`outline:light-delay-festival-master` (24 beats, derivation validated) → `script:light-delay-festival-master`
(screenplay being authored now). Generation-plan work in this brief targets that script once shots exist;
do not point it at the deprecated `script:light-delay-festival`.

## 2. Contracts (schema + types + compiler)

| File | Why |
| --- | --- |
| `data/schemas/generation-plan.schema.json` | Shape of the plan JSON: `plan`, per-shot `artifacts`/`requiredReferences`/`segments`, optional derived `generationGate` |
| `scripts/lib/production-gate.mjs` | `Take.productionGate` validation + shared take resolution + plan/stretch `generationGate` derivation |
| `data/schemas/provider-capabilities.schema.json` | Provider snapshots + campaigns (limits, `executable`) |
| `data/schemas/production-contexts.schema.json` | Physical/visual contexts assigned to scenes/shots |
| `data/schemas/continuity-ledger.schema.json` | Deprecated cut ledgers (obsolete authorship); live facts are on the master outline |
| `docs/production/CAUSAL_AND_MEANING_PIPELINE.md` | Fact rebuild + `report:causal-structure` / `report:meaning-audit` |
| `data/schemas/outline.schema.json` | Outline coverage/derivation contract |
| `data/schemas/voice-profiles.schema.json` | Voice samples as audio references |
| `data/schemas/common.schema.json` / `schema-manifest.json` | Shared `$defs` + manifest-driven validation |
| `src/lib/types/generated/production.ts` | Generated plan types — **do not hand-edit**; run `npm run schema:types` after a schema change |
| `docs/JSON_FORMAT.md` § Script structure | `Shot`/`Take`/`ShotComposition`/`CameraDirection`/`generation?` fields |
| `src/lib/types/entities.ts` / `assets.ts` | `referenceAssetIds`, `Asset.imageStatus` |
| `scripts/lib/generation-planning.mjs` | `compilePrompt` (11 sections), `planSegments`, `checkReferenceBudget`, `resolveDiegeticText` |
| `src/lib/generation/planning.spec.js` | Fixtures showing the exact expected shape/behavior of the four functions above |
| `docs/technical/HIGGSFIELD_MCP.md` § 8 / §8b | Run JSON (`data/schemas/run.schema.json`) + MCP smoke runbook; preview handoffs via `handoff:visual-stretch` |


**Compiled prompt section order** (`compilePrompt` in `generation-planning.mjs`, enforced by throwing on
any missing key): `style → actionTiming → subjects → location → camera → lighting → physics → interfaceVfx
→ continuity → audio → negative`. All in English. `compilePrompt` also throws immediately if `blockers`
is non-empty — do not populate a section string to force through a blocked shot.

## 3. Live data to consult per shot

| File | Role |
| --- | --- |
| `data/production/provider-capabilities.json` | Seedance 2.5 snapshot `maxDurationMs: 30000`, `executable: false`; campaign `campaign:higgsfield-trial-24h` → `maxSegmentMs: 30000` |
| `data/production/contexts.json` | Physics/look per scene/shot context (e.g. `context:ardor-coast-microgravity`) |
| `data/production/plans/light-delay-*.json` | Shape examples only — their content is `obsolete` (old cuts); do not reuse their references or briefs as current |
| `data/project.json` | Registered scripts, `narrativeAuthority`, lineage |
| `data/editorial-lifecycle.json` | Authority/compatibility/obsolete classification, including the Festival-master derivative entry |
| `data/characters.json` / `locations.json` / `objects.json` / `vehicles.json` | Entities + `referenceAssetIds` — **see gap in §6: the bomb, vault, jammer and Harlan's wrist device have no catalog entries yet** |
| `data/entity-variants.json` | Visual variants by continuity |
| `data/assets.json` | `assetId` → path under `static/assets/` |
| `data/voice-profiles.json` | Voice samples (`sampleAssetIds`). Main cast EN/ES refs + EN Reporter are wired (`asset:voice-ref-*`); do not substitute generated cue WAVs |
| `data/outlines/light-delay-festival-master.json` + `data/scripts/light-delay-festival-master.json` | Festival WIP outline (authoritative for beats) + script (being populated with shots now) |
| Deprecated cuts `data/scripts/light-delay-{main-short,festival,trailer,long}.json` | Rescue only — dialogue, staging, compatible assets; never authority |

Cast check for Festival-master (Zao, Voss, Harlan, Elin/Rao, Sorell, Okoye): all six have exactly one
reference asset (`referenceAssetIds.length === 1`, a model sheet) and a `voice:*` profile id. Other
catalog characters (`keene`, `vega`, `wei`, `hassan`, `carvalho`, `volkov`, `tanaka`) have zero reference
assets and belong to an earlier, larger-crew continuity — do not pull them into Festival-master shots.

## 4. Visual assets (storyboard / first-last / refs / 3D)

| Location | Use for the agent |
| --- | --- |
| `static/assets/characters/` | Model sheets → character refs |
| `static/assets/locations/` | Concept sheets + 3D refs (e.g. Proxima berthed) |
| `static/assets/vehicles/` | Ardor + Jupiter / proportions |
| `static/assets/props/` | Core, transmitter, override relay, greeting medium… |
| `static/assets/art-bible/scale-references/` | Common Proxima/Ardor scale |
| `static/assets/animatic/frames/` | Legacy stills (`animaticStill` / briefs) — old cuts only |
| `higgsfield-uploads/` + `MANIFEST.md` | Renamed staging ready for HF — currently indexes the **old** cast/locations/props; will need new entries once Festival-master shots exist |
| `docs/technical/CELESTIAL_ARDOR.md` / `PROXIMA_STATION.md` | Visual/physical canon for prompts |
| `docs/technical/ANIMATION_WORKFLOW.md` | Blender master + per-shot `.blend` → AI pass |
| `docs/technical/EXTERNAL_SCENES_AND_ANIMATION.md` | Exterior ↔ 3D map |
| `docs/technical/PRODUCTION_ROADMAP.md` | 3D modeling order |
| `docs/SIGNAL_BEAM_REQUIREMENTS.md` | Laser/VFX geometry (superseded in Festival-master: no laser — see below) |
| `docs/ASSET_PROVENANCE.md` / `ASSET_PATH_MAP.md` | What exists and where |
| `blender/light-delay-blockout.blend` (+ `blender/shots/*.blend`) | 3D guides / raw renders as video/image refs |

**Continuity note:** Festival-master's climax mechanism is a physical bomb in a vault plus local
flight-control sabotage, authenticated by an optical warning burst — not the older COM-sabotage/laser
canon `SIGNAL_BEAM_REQUIREMENTS.md` describes. Treat that document as background on beam physics only;
do not import its narrative framing (culprit-reveal-by-laser) into Festival-master prompts.

Per shot, the plan records:

- `artifacts.animaticStill` (required) — storyboard/animatic still

### Festival-master reference rule

For `script:light-delay-festival-master`, image references are rebuilt from the shot's
`visibleRefs`, `locationId`, and `secondaryLocationIds`. `offScreenCharacterIds` is an
absolute exclusion: an off-screen character must not receive a model-sheet reference,
even when that character speaks, appears in voice-over, or was referenced by an older
take. Generation-plan references include the resolved asset path as well as the stable
asset ID so an image adapter can attach the actual file. Props and vehicles should be
listed in `visibleRefs` when they are visible; prose mentions alone do not authorize an
image attachment.
- `artifacts.firstFrame` / `lastFrame` — Seedance boundaries / extension anchors
- `artifacts.finalAudio` — when the shot carries dialogue (later mix/lock; **not** a Seedance
  attachment). Seedance jobs attach `sampleAssetIds` only (`SEEDANCE_PROMPTING.md` §6.1)
- `requiredReferences[]` — `character` / `location` / `prop` / `video` (Blender guide) / `voice_sample`,
  each `{ kind: image|video|audio, id, required, role }`. Audio refs are approved voice samples for
  speakers in the shot or grouped run; never `DialogueVariant.audioAssetId`

Segments: `continuation: none | accepted_video_and_last_frame | last_frame_as_next_first`, used when a
shot exceeds 30 s or needs to chain (see `planSegments` — it prefers a semantic cue boundary within the
last quarter of the segment budget, else a hard cut at `maxSegmentMs`). The inverse case — consecutive
same-location, same-cast shots whose durations sum to under 30 s — prefers **one** Seedance job
covering the run (`SEEDANCE_PROMPTING.md` §6.2); shot IDs stay distinct.

## 5. Tooling (do not invent another format)

| Command | Function |
| --- | --- |
| `npm run production:plans` | `scripts/build-generation-plans.mjs` — **currently hardcoded to the four deprecated cuts only** (`main-short`, `festival`, `trailer`, `long`); it will need an explicit addition before it can (re)build `light-delay-festival-master`'s plan |
| `npm run report:prompt-readiness` | Blockers / budget / segments |
| `npm run report:causal-structure` | Master facts + Festival cue bindings (live) |
| `npm run report:causal-validity` | Obsolete/deprecated cut ledgers only |
| `npm run report:meaning-audit` | Meaning packet after structure green |
| `npm run prepare:higgsfield` | Copies sheets → `higgsfield-uploads/` |
| `npm run validate:schemas` / `npm run schema:types` | Contracts |
| `node scripts/higgsfield-preflight.mjs` | Preflight only — never submits |
| `npm run export:resolve-otio:all` | OTIO assembly for Festival-master and trailer-master (`RESOLVE_OTIO_EXPORT.md`) |

## 6. Gaps to declare explicitly (verified 2026-09-11)

The master storyboard asset pass now has a provider-neutral asset manifest at
`data/production/asset-generation-manifest.json`, validated by
`data/schemas/asset-generation-manifest.schema.json`. It records the nine new
GPT-Image-2 reference sheets, their style anchors, structured English prompts,
and project output paths. The manifest does not authorize a provider run.

- **No `storyboard.schema.json` / no standalone "storyboard JSON" product.** It lives today in
  `Shot.composition` + PNG stills + plan `artifacts.animaticStill`.
- **`run.schema.json` + preview handoffs** under `reports/runs/` (`npm run handoff:visual-stretch`). Tracked results: `data/production/runs/*-results.json` (`visual-stretch-result.schema.json`). Preview/`nonExecutable` runs must never be submitted; paid smoke needs a future freeze. Runbook: `HIGGSFIELD_MCP.md` §8b.
- **`scripts/build-generation-plans.mjs`** regenerates deprecated cuts plus `light-delay-festival-master` (includes `visualStretchJobs` with pinned `providerSnapshotId`).
- **`compiledPrompt` must stay `null`** on every real plan until editorial freeze for that cut,
  per `docs/ARQUITECTURA_GENERACION.md` — unless this conversation explicitly says otherwise.
- **No catalog entries yet for the bomb/vault/jammer/wrist device.** `objects.json` has no
  entry for Proxima's geophysical impulse package, its radiological vault, Harlan's jammer, or his
  wrist device — all central to Festival-master's F03–F05, F09–F10 beats. `TODO.md` already flags
  this ("Catálogo faltante del master"); it blocks `requiredReferences` for any shot that needs them
  until modeled (description + reference sheet), not before.
- **Result manifests record remote upload handles** per `assetId` when an MCP smoke completes; there is still no general asset↔remote registry beyond that.
- **`shots_index.json` / `_shot_template.blend`** are documented in `ANIMATION_WORKFLOW.md` but
  incomplete.
- **Seedance 2.5 stays `provisional` / `executable: false`** in `provider-capabilities.json` until
  its catalog/CLI/MCP contract is confirmed against a live account.
- **`higgsfield-uploads/`** still indexes legacy cast sheets; `prepare:higgsfield` also stages stretch refs under `stretch/` in **handoff order** (keyframe slots → effective video visuals → voice), not arbitrary Set insertion order.
- **Stretch still vs video refs:** keep `VisualStretch.referenceAssetIds` complete for still/keyframe jobs; optional `videoReferenceAssetIds` is a separate tri-state list for Seedance extras (`VISUAL_STRETCH_PIPELINE.md`, `SEEDANCE_PROMPTING.md` §6.2). Do not invent pilot `videoReferenceAssetIds` on Festival-master without author instruction.

## 7. Dialogue tone pass (harsh → human/colloquial)

When a line reads too stiff, formal, or expository:

- Edit the **English** text first (source of truth); Spanish stays `needs_revision` until a later pass.
- Consult `data/voice-profiles.json` for that speaker's EN `dialogueStyle`/`prosody`/`languageFormation`
  before rewriting — the goal is a natural register consistent with who they are, not a generic
  colloquial flattening of every character to the same voice.
- Do not represent accent through misspelling, dropped grammar, or phonetic transcription (`AGENTS.md`).
- Do not turn a rewrite into forced exposition — a line that now explains the plot "for the audience"
  is a regression even if it sounds more natural in isolation. Preserve the causal information the line
  was carrying (see `AGENTS.md` on forced exposition vs. dramatic reasoning).
- Applies to: (a) dialogue cues in `script:light-delay-festival-master` as they're authored; (b) the
  25 lines already in `data/production/audio/festival-audience-dialogue-performance.json` /
  `docs/wip/festival-cut-audience-narrative.voices.en.md` if reused as screenplay seed material — note
  9 of those are explicitly `lineStatus: provisional` and carry no screenplay authority on their own.

## 8. I/O templates

### 8.1 Shot generation-plan entry (matches `generation-plan.schema.json`)

```json
{
  "shotId": "festival-master:shot-05-03",
  "status": "blocked",
  "blockers": ["editorial_prompt_freeze_not_approved"],
  "diegeticText": [],
  "artifacts": {
    "animaticStill": { "required": true, "status": "missing" },
    "firstFrame": { "required": false, "status": "missing" },
    "lastFrame": { "required": false, "status": "missing" },
    "finalAudio": { "required": true, "status": "missing" }
  },
  "requiredReferences": [
    { "kind": "image", "id": "asset:character-zao-sheet", "required": true, "role": "character" },
    { "kind": "image", "id": "asset:location-celestial-ardor-bridge-realistic-reference", "required": true, "role": "location" }
  ],
  "segments": [
    {
      "id": "festival-master:shot-05-03:segment-01",
      "startMs": 0,
      "endMs": 7500,
      "continuation": "none",
      "promptStatus": "blocked",
      "compiledPrompt": null
    }
  ]
}
```

### 8.2 Compiled prompt (only once unblocked and frozen — 11 sections, English)

```text
style: <film stock/render look, consistent per-cut style token>
actionTiming: <what happens, in what order, over what duration>
subjects: <who/what is visible, blocking, performance beat>
location: <set + context id physics/visual rules that apply>
camera: <size, angle, lens, movement>
lighting: <source, quality, motivated practicals>
physics: <gravity state — 1g / microgravity / transition — from context id>
interfaceVfx: <diegetic screens/holograms — English text only, from resolveDiegeticText>
continuity: <what must match the surrounding shots/takes>
audio: <voice-sample role map + script cue as spoken text; diegetic SFX; never generated cue WAVs>
negative: <what must not appear>
```

### 8.3 Reference-asset request (when `requiredReferences` names something uncataloged)

```json
{
  "requestedAssetId": "asset:prop-geophysical-impulse-package-sheet",
  "entityToCreateFirst": { "kind": "object", "suggestedId": "object:geophysical-impulse-package" },
  "blockedShots": ["festival-master:shot-05-03"],
  "note": "No catalog entry exists (see AGENT_GENERATION_BRIEF §6). Model the object (description,
  dramaticFunction, ownerCharacterId if relevant) before requesting art; do not generate a sheet
  from a bare shot description."
}
```

### 8.4 Reference-video request (exterior 3D guide, e.g. Proxima/Ardor establishing shots)

```json
{
  "role": "video",
  "kind": "blender_guide",
  "purpose": "Camera/orbit guide for an AI video pass, not a final render.",
  "sourceBlend": "blender/shots/<name>.blend",
  "relatedShotIds": ["festival-master:shot-01-01"],
  "status": "missing"
}
```

## 9. Operating rules (paste-ready)

> You generate Light Delay production JSON only.
> Authority: `AGENTS.md` + `ADR-0002` + `outline:light-delay-master-narrative` → `outline:light-delay-festival-master`
> (not the deprecated `light-delay-festival` cut).
> Output must validate against `data/schemas/generation-plan.schema.json`.
> Video/image prompts: English only, via the 11 `compilePrompt` sections in
> `scripts/lib/generation-planning.mjs` — do not invent a different section set or order.
> Storyboard / animatic still prompts: never paste spoken dialogue or subtitle text into
> `generation.prompt`. Describe visible action and intentional diegetic UI only; omitting the
> lines is enough — do not pad prompts with “avoid subtitles” boilerplate
> (`scripts/lib/still-prompt-no-dialogue.mjs`, `npm run scrub:still-prompts:check`).
> Respect campaign `maxSegmentMs` (30 s) from `provider-capabilities.json`; longer shots → segments +
> `continuation`/extension per `planSegments`. Consecutive same-location, same-cast shots under 30 s
> → one Seedance 2.5 job (`SEEDANCE_PROMPTING.md` §6.2).
> Artifacts are distinct: `animaticStill` (storyboard), `firstFrame`, `lastFrame`, `finalAudio`; plus
> `requiredReferences` from characters/locations/objects/vehicles, optional Blender guide videos/stills,
> and `voice_sample` audio from `sampleAssetIds` for speakers in the job. Never attach generated
> dialogue WAVs (`audioAssetId`) to a Seedance prompt.
> Do not invent missing references — mark blockers and file a reference-asset request (§8.3) instead.
> Do not submit anything to Higgsfield. Do not regenerate existing PNGs unless explicitly ordered.
> Skip takes with `productionGate.status` of `deferred` or `blocked` (and any stretch job that lists them in `generationGate.takeIds`) until the author clears the gate — do not treat that as `imageStatus` debt. Respect the gate's `medium`: a `video`-scoped hold (`video_deferred_external_reference`) skips only Seedance/video work; generate the still/keyframe normally. `needs_regeneration` never blocks a still.
> Never remove a stretch `referenceAssetIds` entry because video will depict the same subject; author Seedance-only static refs on optional `videoReferenceAssetIds` (absent = fallback from still list; present including `[]` = explicit). Generate keyframes from the full still list first; compile video refs only after keyframes are registered; refuse runnable video while `missing_keyframe:*` or `uncovered_video_entity:*` remains (`VISUAL_STRETCH_PIPELINE.md`). Refuse `reference_budget:*` without trimming; use pack `metadata.entityIds` for multi-entity still coverage and explicit video extras. Fallback Seedance jobs do **not** inherit `reference_pack_required` from keyframe panels lacking `entityIds` — read `keyframeCoveredEntityIds` / `uncoveredVideoEntityIds`. `reference_pack_required` vs `reference_consolidation_required` are distinct remediations.
> Keep `compiledPrompt: null` until editorial freeze unless told otherwise for this session.
> When rewriting dialogue for tone, edit English only and consult that speaker's voice-profile
> `dialogueStyle` first; never fix tone by adding exposition.
> Read `docs/ARQUITECTURA_GENERACION.md`, `docs/technical/HIGGSFIELD_MCP.md`, and
> `docs/production/SEEDANCE_PROMPTING.md` before writing video prompts.
