# Seedance 2.5 prompting — craft notes for Light Delay video

Companion to `AGENT_GENERATION_BRIEF.md` (authority, contracts, 11-section `compilePrompt`) and
`docs/ARQUITECTURA_GENERACION.md` (plan → freeze → English prompt → adapter). This file is the
prompt-craft layer for Seedance 2.5 video jobs. It does not authorize generation, freeze a cut, or
replace `data/production/provider-capabilities.json`.

Status: English source. Not narrative authority. Researched 2026-09-12.

## 1. Target and evidence

Light Delay intends to generate video on **Seedance 2.5** (Higgsfield). ByteDance launched 2.5 on
2026-07-31; Higgsfield help still lists 2.0–2.5 as of 2026-09-09. This file is the 2.5 prompt-craft
layer for those jobs.

Treat published 2.5 numbers (duration, resolution, reference budget, start/end-frame roles) as
**surface-dependent**. The repo snapshot in `provider-capabilities.json` is still `provisional` /
`executable: false`. Confirm on the live Higgsfield catalog / MCP tools before a paid run.

This document is **not** a substitute for preflight. MCP/CLI always spend credits even if web
Unlimited is on (`docs/technical/HIGGSFIELD_MCP.md`).

## 2. Choose the task before writing the prompt

Official 2.5 guidance: the highest-leverage decision is the job type, not adjective density.

| Task | When | Prompt emphasizes | Preserve |
| --- | --- | --- | --- |
| Reference / new generation | No finished clip | What to create; what each `@Image` / `@Video` / `@Audio` controls | Identity, layout, motion, or audio roles stated explicitly |
| Image-to-video | Approved still must be the opening frame | Motion, camera path, atmosphere, audio — **do not redescribe** what the still already shows | Face, wardrobe, product geometry, composition already in the still |
| Video editing | A finished clip exists and only a local change is needed | Object, region, or time window that changes | “Keep everything else unchanged” plus named camera / layout / rhythm locks |
| Video extension | A finished clip must continue forward, backward, or through a bridge | Direction, duration, and the first new beat | Aspect ratio, visual state, audio transition, motion continuity |
| First / last frame | Boundary images lock the shot | What happens **between** the frames | Matching aspect ratios on both images; duration may still be set |

Locked tasks (edit, extension, first/last-frame) often freeze aspect ratio and sometimes duration
from the input. Do not fight those locks in the prompt.

For Light Delay, map artifacts as:

- `animaticStill` → I2V opening frame or identity still, not a video prompt dump. Consecutive
  shots grouped into one job (§6.2) may attach several stills as **ordered keyframes**.
- `firstFrame` / `lastFrame` → locked-boundary generation or extension anchors.
- Accepted prior segment + its last frame → extension / `continuation: last_frame_as_next_first`.
- Audio **references** for the job → approved voice samples only (`VoiceProfileVariant.sampleAssetIds`).
  Never attach generated dialogue WAVs. Seedance 2.5 performs the cue from those samples (§6.1).
- `finalAudio` remains a distinct later mix/lock artifact if the cut needs one. It is not a Seedance
  input, and local TTS is not a substitute for it.

## 3. A reliable prompt shape

Public 2.5 guides converge on the same stack. Write it in English.

```text
Asset mapping
+ one-sentence brief (subject + location + event + style + camera treatment)
+ timeline or stages (action, camera, lighting, audio per beat)
+ global constraints (identity, physics, no subtitles, no BGM, aspect)
```

Base formula when there are few or no references:

```text
Subject + action/event
+ scene/environment
+ visual style
+ camera movement/cut
+ audio
```

Higgsfield’s shorter web checklist is the same idea: **subject/action → setting/lighting → camera →
mood**. Vague prompts produce generic motion.

Five production layers (BeatAPI restatement of BytePlus 2.5 rules):

1. Task declaration — generate, edit, or extend.
2. Reference-role map — one line per asset, including what **not** to import.
3. Subject and world locks — identity, count, wardrobe, layout, continuity.
4. Timeline — ordered beats with one primary action each.
5. Failure-specific constraints — only the mistakes that would make this take unusable.

Do not pad with “cinematic masterpiece / 8K / no morphing” laundry lists. Name the failure you
actually fear (identity swap, burned-in captions, extra characters, wrong gravity).

## 4. Map every reference, then stop adding files

2.5 documented ceilings (ByteDance / fal, 2026-08-07): up to **30 images**, **10 videos**, **10
audio** (50 slots). Recommended stability is much smaller: **1–8 image-defined subjects**, **1–5**
video/audio subjects, **5–10 s** per motion-reference clip. Capacity is not a target.

Higgsfield 2.0 snapshot in this repo: 9 / 3 / 3 / 12 total
(`provider:higgsfield:seedance-2.0:2026-08-29`). Do not mix those numbers into a 2.5 prompt
budget without preflight.

Rules that recur across official and Higgsfield help:

- Bind assets in **upload order** in the prompt. Do not rely on text burned into a PNG, and do not
  make the model guess who is who.
- Each file gets **one job**: identity, product/prop, location, camera/motion, voice, music, rhythm.
  `@Image 1 defines Zao's appearance; ignore the background` is testable. `Use all refs for the vibe`
  is not.
- If only part of an asset should transfer, say what must **not** inherit (cast, wardrobe, warehouse,
  camera frustum, motion paths).
- Multi-view of **one** subject: say so (`Images 1–4 are the same lamp, front/left/right/rear. Output
  contains exactly one lamp`).
- Storyboard grids: fewer than **15** panels; line art is better than cluttered photoreal collages.
  Grids control **order and framing**, not pixel alignment. Use separate ordered keyframes when
  composition must be strict: `Use Images 1 through N in order as keyframes`.
- Clay / white-model / blockout video: inherit shot order, camera path, blocking, timing — **not**
  gray shading, gizmos, or the stand-in’s appearance. The prompt must still name real subjects,
  location, materials, and light. ByteDance 2.5 explicitly advertises this “clay render” path.

Light Delay: character/location/vehicle/prop sheets already exist. Per
`DIALOGUE_AND_PROMPT_LESSONS.md` §6, do **not** re-describe appearance in the video prompt. Place and
orient the entity (pose, eyeline, hands, screen direction) and let the attached sheet own the look.

Audio attachments follow the same economy: one approved sample per speaker who talks in the job,
mapped as `@Audio N` / voice. Do not attach mute characters' samples, and do not attach cue WAVs
(§6.1).

Higgsfield web `@` roles (help center, 2026-09-09): `@character` (face within one generation),
`@style`, `@motion`, `@audio`. Cross-clip identity uses a saved **Element** (Soul ID if the face is a
real person). MCP/CLI do not read chat attachments; upload first, then name the role in the prompt
(`HIGGSFIELD_MCP.md` §5).

## 5. Direct time: stages first, timestamps when a beat must land

Integer-second markers work in 2.5: `[0s]`, `[4s]`, or contiguous ranges `0–3 seconds, 3–7 seconds`.
Start at zero, stay chronological, leave **no unexplained gaps**. Timestamps are pacing guidance, not
frame-accurate editorial.

Density (the failure mode that wastes the most credits):

- One **primary** action (or one camera move) per beat.
- About **2–3 seconds** for a visible action. A 5 s clip wants ~2–3 markers; 8–10 s wants ~3–5; a
  30 s scene wants about **four to six** meaningful beats, not a marker every second.
- Too little in a window → the model improvises. Too much → omitted actions or frantic cutting.
- Last beat needs time to **settle** (hold, land, or finish the line).
- For ordinary narratives, **stages with end states** are enough; use one-second precision only for
  a handoff, entrance/exit, transition, or explicit cue.

Stage template:

```text
[Stage n]
Initial / continue-from: <what must still be true>
Primary event: <one observable change>
End state: <positions, prop ownership, gravity, light — what a still of this second would show>
```

Camera language 2.5 reads directly (use the visible result if the term is uncommon): extreme wide,
medium, close-up, push-in, pull-out / pull back wide, pan, tilt, truck, dolly in, arc / orbital,
crane up, handheld follow, tracking, overhead, low angle, one-take, rack focus (describe the planes).
One camera path per beat. If the move is exotic, write what the audience sees.

Emotion: visible change (`eyes redden, jaw sets, breath shortens`), not an abstract mood word alone.

Physics: name direction, speed, range, and hold. “Debris drifts” is weak; “a loose tether rises and
stops against the ceiling handrail over four seconds, then holds” is reviewable. If anatomy or
microgravity fails, reduce speed and motion range before piling on negatives.

## 6. Audio, dialogue, and text

**Unlike storyboard stills**, Seedance jobs are allowed — and expected — to include spoken cue
text and approved voice-sample `@Audio` references. The still-only scrub
(`npm run scrub:still-prompts:check`) must not be applied here. Visual physics (gravity, suit
state, etc.) remains explicit in the prompt the same way as stills: the model does not inherit
scene `setting.continuity` (`DIALOGUE_AND_PROMPT_LESSONS.md` §2c).

2.5 generates native audio in the same pass. Optional explicit markup in some BytePlus/fal materials:

| Content | Markup | Example |
| --- | --- | --- |
| Music | `( )` | `(low structural hull tone, no melody)` |
| Sound effects | `< >` | `<restraint click>` |
| Dialogue | `{ }` | `{Burn's clean.}` |
| On-screen captions | `【 】` | avoid for Light Delay picture |

If English is spoken as the wrong language, reinforce **before** the line: language + variety +
delivery + speaker + `{line}`. Do **not** represent accent with phonetic spelling
(`AGENTS.md` / `voice-profiles.json`).

Light Delay constraints that override generic Seedance examples:

- Prompt language is **English**.
- Spoken lines come from the script cue, not invented coverage. Put the cue in `{ }` (or the
  equivalent spoken-line markup) and let Seedance perform it.
- **No burned-in subtitles or caption cards** in the picture (`No subtitles` as a global
  constraint). Subtitles are derived later from dialogue data.
- Diegetic display text stays English-only (`JSON_FORMAT.md`).
- Trailer prompts must preserve trailer omissions (no culprit ID; no confirmed send, reception, or
  death of Zao).

Vacuum: no diegetic SFX in open space. Interior pressurized shots may carry hull/restraint/engine
cues (`DIALOGUE_AND_PROMPT_LESSONS.md` §2).

### 6.1 Voice samples only — never generated dialogue audio

Local TTS (Qwen/Kokoro/Seed-VC cue WAVs) is useful for **animatic playback and timing**. It is not
expressive enough to use as a Seedance 2.5 speech reference. For video jobs, attach the **selected
voice samples** and let Seedance generate the spoken line from those samples plus the cue text.

Attach:

- `VoiceProfileVariant.sampleAssetIds` for the job language, and only for characters who **talk**
  in that shot or grouped run.
- One sample per speaker unless a second approved sample is required for a distinct register
  (do not dump the whole variant array “for luck”).

Do **not** attach:

- `DialogueVariant.audioAssetId` (promoted animatic cue WAVs under `static/assets/audio/dialogue/`).
- Outline/imitation-pass/WIP takes under `E:\Models\` or unpromoted studio chunks.
- Donor files, pronunciation tests, or dual-outline mixes.
- Voice samples for characters who are silent in the job (image sheets still attach if they are
  visible).

Bind each sample in the asset map: `@Audio 1 is Zao's approved English voice sample; use it for
timbre and delivery of her lines only. Ignore any words in the sample; speak the cue text below.`
The sample owns **who it sounds like**. The prompt owns **what is said** (script cue) and **when**
(the beat). If the sample contains other words, say to ignore them so Seedance does not lip-sync
the reference take.

`scripts/build-generation-plans.mjs` already records `role: voice_sample` from `sampleAssetIds` and
blocks on `missing_voice_sample:<characterId>`. Missing samples still block; do not substitute a
generated cue WAV to clear the blocker.

Animatic movie mode continues to play `audioAssetId`. That path and the Seedance attachment list
are different files.

### 6.2 Consecutive shots in one generation (under 30 s)

Prefer **one** Seedance 2.5 job covering a run of related shots when all of the following hold:

- The shots are **immediately consecutive** in editorial/playback order (no intervening shot).
- They share the **same location** (`locationId`; matching `secondaryLocationIds` if any).
- They share the **same characters** (visible set and speakers; no unmotivated cast change).
- Combined duration is **under 30 s** (campaign `maxSegmentMs` / 2.5 single-pass ceiling — confirm
  on the live catalog).

Why: identity, wardrobe, light, blocking, and voice stay in one take instead of being re-inferred
at every cut. Rapid coverage in one room is the usual case.

How:

- Keep distinct `shotId`s in the `ScriptFile`. Grouping is a **job** strategy, not a merge of
  shots in data.
- Attach each shot's approved still as an ordered keyframe (`Use Images 1 through N in order as
  keyframes` / one stage per shot). Do not collapse several framings into one still. When those
  stills were produced from a **visual stretch** combined sheet, use the **split panel** assets as
  keyframes; the full sheet may be attached additionally as a blocking/storyboard reference
  (`docs/production/VISUAL_STRETCH_PIPELINE.md`). A long stretch may require **multiple** Seedance
  jobs under the segment ceiling, each depending on the same still job.
- Write the timeline as stages that follow those shots: one primary action (or camera move) per
  beat; about four to six beats in a 30 s clip.
- Attach one voice sample per speaker who talks **anywhere in the run**, still ignoring sample
  wording.
- If the run is a motivated entrance/exit, say so in the beat that crosses the threshold; that is
  not a cast change for the purpose of this rule.

Do **not** group across a location change, a scene/time jump, a cast change, or a sum that meets or
exceeds 30 s. Those stay separate jobs (or `planSegments` + extension). A single shot longer than
30 s still splits on a semantic cue per `planSegments`; this section is the inverse case.

## 7. Edit and extend without rewriting the shot

Editing pattern (2.5 official / fal):

1. `@Video 1` is the **sole editing master**.
2. Name the object, region, or time window to change.
3. Name the replacement reference.
4. State what must remain unchanged (identity, blocking, camera, event order, audio).

Extension: name direction (`forward` / `backward` / bridge), duration, and the first new beat.
Match the source aspect ratio. Prefer the accepted clip **plus** its last frame as the next first
frame when the attachment budget allows (`ARQUITECTURA_GENERACION.md`).

First/last-frame: matching aspect ratios. If they differ, 2.5 docs warn the last frame may stretch
to the first.

## 8. How this maps onto Light Delay’s 11 compiler sections

`compilePrompt` order stays `style → actionTiming → subjects → location → camera → lighting →
physics → interfaceVfx → continuity → audio → negative`. Do not invent a second section set. When
assembling a Seedance-facing string from those sections, fold them as:

| `compilePrompt` section | Seedance layer |
| --- | --- |
| `style` | One-sentence brief + global look |
| `subjects` | Asset map + identity locks; no appearance essay if a sheet is attached |
| `location` | Scene / environment; ignore people in location stills |
| `actionTiming` | Stages or `[Ns]` beats; one action per window |
| `camera` | One move per beat; uncommon terms spelled out as visible result |
| `lighting` | Global + per-beat shifts (`gradually`) |
| `physics` | Gravity/thrust state, speed, holds |
| `interfaceVfx` | English diegetic UI only; no subtitle burn-in |
| `continuity` | End states, wardrobe/equipment, screen direction |
| `audio` | Voice-sample role map + cue text in `{ }`; vacuum rule; no cue WAVs |
| `negative` | Failure-specific only |

Shot `description` remains the durable source. Do not hand-edit a compiled Seedance string while
leaving `description` stale (`DIALOGUE_AND_PROMPT_LESSONS.md` §1).

## 9. Iteration that does not burn the budget

Higgsfield help (2026-09-09) and creator 2.5 walkthroughs agree:

1. Prototype **short** and at **720p** (I2V from the approved still is more predictable than T2V).
2. Confirm beats, identity, and camera on the cheap pass.
3. Change **one** variable per retry (prompt **or** a reference, not both).
4. Spend full duration / high resolution only on the locked prompt.
5. Review the **whole** clip; 2.0-era advice was that many failures show up around 5–8 s.
6. Prefer a targeted **edit** of a working take over a full re-roll.

Credit cost follows model + resolution + duration, not the native-audio toggle (Higgsfield FAQ).
MCP/CLI always charge.

## 10. Preflight checklist (prompt craft)

- Task is generate, I2V, edit, extend, or first/last-frame — not a blend of all five.
- Every attached file has a number, a subject, one responsibility, and an exclusion if needed.
- Time ranges are contiguous from 0; each beat has one primary action and a visible end state.
- Camera moves in a beat do not contradict each other.
- Identity, wardrobe, prop count, and gravity/thrust state do not change unless the story does.
- The last beat can land.
- Uncommon camera terms describe the visible result.
- Global constraints cover subtitles, extra characters, BGM, and the specific physics failure.
- English dialogue matches the cue; trailer omissions are intact.
- Audio refs are approved `sampleAssetIds` for speakers in the job only — no generated cue WAVs.
- Consecutive same-location, same-cast shots under 30 s are one job unless a split is required.
- `compiledPrompt` stays `null` until editorial freeze unless this session explicitly overrides.

## 11. Worked skeleton (engineering interior, non-spoiler)

Illustrative only — replace IDs, duration, and cue text from the live `ScriptFile`. Not a generation
order.

```text
Task: image-to-video, 8 seconds, 16:9.

Asset mapping:
@Image 1 is the approved opening still (animatic take). Use its composition, wardrobe, and set.
Do not invent extra crew or windows.
@Image 2 is Zao's model sheet; appearance only.
@Audio 1 is Zao's approved English voice sample (sampleAssetIds). Timbre and delivery only;
ignore any words in the sample. Do not attach a generated cue WAV.

Brief: Zao at an engineering console in microgravity, hard-SF photoreal, slow handheld.

0–3s: medium shot, camera locked. A loose tether drifts upward behind her. She braces one hand
on the console.
3–6s: slow push-in to MCU. She reads the display; English diegetic numerals only.
6–8s: she stills, then speaks in American English: {Something's off. We used more fuel than we
had to.} Hold the last frame.

Global: Steady microgravity (hair and tether drift; no planted stance). No subtitles, no captions,
no BGM, no extra characters, no large windows. Interior hull vibration only; no vacuum SFX.
```

## 12. Open items (live Higgsfield 2.5 catalog)

Mark resolved in a dated subsection when preflight answers them:

- Model ID on Higgsfield web / API / MCP / CLI (`seedance_2_5` vs picker label).
- Max duration, resolution, aspect list, and whether start/end-frame roles exist on that surface.
- Reference ceilings vs the published 30/10/10 envelope.
- Whether 2.5 Edit is a separate model on the account in use.
- Credit table vs duration/resolution.
- Whether timestamp syntax, `@` roles, and clay-render inheritance match the sources in §13.

## 13. Sources (retrieved 2026-09-12)

| Source | URL | Used for |
| --- | --- | --- |
| ByteDance Seed — Seedance 2.5 launch | https://seed.bytedance.com/en/blog/one-take-creation-flexible-referencing-introducing-seedance-2-5 | 30 s, 30/10/10 refs, clay/white-model, timestamps |
| ByteDance Seedance 2.5 product page | https://seed.bytedance.com/en/seedance2_5 | Long-form + reference/edit positioning |
| Seedance.tv prompting guide part 1 | https://docs.seedance.tv/en/seedance-2-5-prompting-guide | Four-part prompt, locked vs unlocked, mapping, timelines |
| fal “How to use Seedance 2.5” (updated 2026-08-07, BytePlus-edited) | https://fal.ai/learn/devs/how-to-use-seedance-2-5 | Formula, role templates, stages, edit/extend locks, audio markup |
| Higgsfield help: How do I use Seedance? (modified 2026-09-09) | https://higgsfield.ai/creator-hub/help-center/ai-models/how-do-i-use-seedance | Web prompt order, camera terms, `@` roles, 720p prototype, 2.5 vs 2.0 lengths |
| Higgsfield: Seedance 2.5 on Higgsfield (2026) | https://higgsfield.ai/blog/seedance-2-5-on-higgsfield-2026 | Example structured prompt |
| BeatAPI restatement of BytePlus 2.5 rules | https://beatapi.io/blog/seedance-2-5-guide | Task routing, five-layer brief, 4–6 beats / 30 s |
| Timestamp craft notes | https://www.seedance.tv/blog/seedance-2-5-timestamp-prompts | Marker syntax, 2–3 s per action, troubleshooting |

Repo snapshots and pipeline (not prompt craft): `data/production/provider-capabilities.json`,
`docs/technical/HIGGSFIELD_MCP.md`, `docs/ARQUITECTURA_GENERACION.md`.
