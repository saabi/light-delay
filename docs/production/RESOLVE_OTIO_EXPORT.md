# Resolve OTIO export — assembly and take-swap

English source. Not narrative authority. Does not authorize generation.

Companion to `AGENT_GENERATION_BRIEF.md` (plans, artifacts) and `docs/technical/HIGGSFIELD_MCP.md` (download later). This file is the interchange contract for importing a Light Delay cut into DaVinci Resolve **before** every take exists, then relinking downloaded video without throwing away editorial cuts.

Status: researched 2026-09-12. Frame rate for this exporter: **24 fps**.

## 1. Why OTIO

Resolve 18.5+ imports and **exports** OpenTimelineIO:

| File | What it is | Use |
| --- | --- | --- |
| `.otio` | JSON timeline + **plain filesystem** media paths | Daily assembly and take-swap |
| `.otioz` | Timeline plus copied media | Occasional hand-off snapshot; do not commit |

Cuts, clip order, source in/out, track structure, gaps, basic markers, and clip names round-trip. Color, Fusion graphs, Fairlight volume automation, and most effects do **not**. That is enough to treat a Resolve **export** as the edit spine when placeholders become takes.

| Format | Easy to generate | Stills held to duration | Separate audio | Incremental missing media | This repo |
| --- | --- | --- | --- | --- | --- |
| OTIO `.otio` | Yes (JSON) | Clip `source_range` on an image URL; **verify in Resolve** (§8) | Separate audio tracks | Point at real PNGs/WAVs; regenerate or `--swap` | **v1** |
| FCPXML / FCP7 XML | Painful DTD / rational times | **Documented** by Blackmagic for held stills | Yes (roles vs tracks) | Relink by path | Follow-up if OTIO stills collapse to 1 frame |
| EDL | Trivial | No | ~2 tracks | Offline slugs | No |
| AAF | Hard | Yes (Avid) | Excellent | Overkill | No |
| Resolve `.drp` | Not a public format | — | — | — | No |

Do not generate `.drp`. Do not commit generated `.otio` (local machine paths) or `.otioz`. Output default: `tmp/resolve-otio/` (gitignored).

## 2. Cuts and media

First-class ScriptFiles:

- `script:light-delay-festival-master`
- `script:light-delay-trailer-master`

Trailer stills and EN dialogue WAVs already reuse Festival `imageAssetId` / `audioAssetId`. The exporter follows those IDs; it does not invent trailer-only media.

Picture chain (same as the animatic): `shot.selectedTakeId` → take → `videoAssetId` if the file exists, else `imageAssetId` → `data/assets.json` → `static/` as a **native Windows path** (`E:\\Work\\light-delay\\static\\...`). Reverse-engineered from a Resolve 20.1 export of five stills (`tmp/resolve-otio/Timeline 1.otio`): Clip.2, `media_references.DEFAULT_MEDIA`, still `available_range` of 1 frame, `source_range` = hold length, `global_start_time` 01:00:00:00 (86400 frames at 24 fps), `metadata.Resolve_OTIO`, RationalTime as `24.0` / `120.0`. Do not emit `file://` URLs or POSIX slashes on Windows.

Dialogue chain: `cuePlacements` → cue `content.variants.<lang>.audioAssetId` → WAV, timed as `shotOriginMs + atMs` (same formula as `buildShotDialogueTimeline`).

Higgsfield ingest is **out of scope** here. When a take is on disk, register it:

`static/assets/animatic/video/<slug>/…` → `assets.json` (`kind: video`) → `take.videoAssetId`.

`--swap` only reads that field.

## 3. Frame rate

This exporter **locks 24 fps**. `durationMs` / `atMs` snap with `round(ms * 24 / 1000)`. Sub-frame times are not represented. The CLI prints a snap report (`--check`). Blender preview rate in `ANIMATION_WORKFLOW.md` may still differ; do not assume they match.

## 4. Fresh assembly layout

| Track | Kind | Contents |
| --- | --- | --- |
| V1 Picture | Video | One clip per shot in ScriptFile order. Length = snapped `durationMs`. Video file if `videoAssetId` exists on disk; else the storyboard still. Missing still → `Gap` (reported), not `MissingReference`. |
| A1 Dialogue | Audio | Cue WAVs **only for shots still on a still**. Gaps where nobody speaks. |
| A2 Take audio | Audio | For shots already on video: the **same** MOV/MP4 as V1, same range (Resolve often will not pull embedded audio from an OTIO video clip alone). |

Clip `name` is the shot id with `:` replaced by `__` (e.g. `festival-master__shot-plan-031`). Resolve 20 on Windows aborts the whole OTIO import when clip or timeline names contain a colon. The original `shotId` stays in namespaced metadata:

```json
"metadata": {
  "light_delay": {
    "shotId": "festival-master:shot-plan-031",
    "takeId": "festival-master:shot-plan-031:take-01",
    "mediaKind": "still",
    "cueIds": ["festival-master:cue-0062"]
  }
}
```

Resolve may drop custom metadata on export. **Clip name (and metadata `shotId`) are the durable match keys.** Still clips hold duration via `source_range`; `available_range` on a PNG is **1 frame** (the file’s real length). Do not emit FreezeFrame or per-clip markers — Resolve’s OTIO reader may abort the whole import on those.

## 5. Authority after Resolve edits

Resolve **can** export `.otio` (File → Export → Timeline). Use that file as the edit spine.

| Stage | Picture / audio timing | New media paths |
| --- | --- | --- |
| No Resolve export yet | ScriptFile | ScriptFile |
| After `--from-otio` `--swap` | **The exported OTIO** (order, trims, gaps, splits) | `take.videoAssetId` / stills from ScriptFile |

Swap does **not** write trims back into `shot.durationMs`. ScriptFile stays narrative/animatic authority; the OTIO is the Resolve assembly.

Preserve: clip order, `source_range.duration`, gaps, unmatched user clips (B-roll).

Replace only picture clips whose matched `shotId` is still a still (metadata `mediaKind: still` or still URL) **and** whose selected take now has a video file on disk.

Audio with the take: drop A1 WAV clips for that shot / its `cueIds`; put the video file on A2 aligned to the picture clip’s range.

Still → video in-points: a still’s `start_time` is meaningless. Map split placeholders in V1 order to sequential slices of the new take (`[0, D1)`, `[D1, D1+D2)`, …). Ignore a non-zero in-point on a still unless `mediaKind` was already `video`.

Unmatched `videoAssetId`s (take exists, no clip in the OTIO) are **reported, not inserted** — inserting would fight a reorder.

Round-trip that is **not** preserved: color, Fusion, speed ramps beyond OTIO, Fairlight volume, most transitions except a basic dissolve if Resolve emits one.

## 6. CLI

```text
npm run export:resolve-otio
npm run export:resolve-otio:festival
npm run export:resolve-otio:trailer
npm run export:resolve-otio:all
npm run export:resolve-otio:check
```

```text
node scripts/export-resolve-otio.mjs --script-id script:light-delay-festival-master --lang en
node scripts/export-resolve-otio.mjs --script-id script:light-delay-trailer-master --lang en
node scripts/export-resolve-otio.mjs --all
node scripts/export-resolve-otio.mjs --from-otio path/to/resolve-export.otio --script-id script:light-delay-festival-master --swap
```

| Flag | Default | Role |
| --- | --- | --- |
| `--script-id` | Festival-master | Which ScriptFile |
| `--all` | off | Write both cuts |
| `--lang` | `en` | Dialogue variant |
| `--fps` | `24` | Snap rate |
| `--out` | `tmp/resolve-otio/<slug>.otio` | Destination (ignored for `--all`) |
| `--from-otio` | — | Resolve export to relink |
| `--swap` | off | Relink takes onto that export |
| `--check` | off | Report only; do not write |

Swap is **per file**: `--from-otio` plus the matching `--script-id`. Do not swap both cuts from one Resolve export.

## 7. Import in Resolve

1. Edit page (not Cut).
2. File → Import → Timeline → the `.otio`.
3. **Uncheck Automatically set project settings** (the OTIO has no picture size; leaving this on can abort the import). Keep 1920×1080 and 24 fps as already shown.
4. Leave **Automatically import source clips into media pool** on.
5. **Import timeline** can stay empty — OTIO is a single timeline; Resolve uses **Timeline name**.
6. First import `tmp/resolve-otio/smoke-one-still.otio` (one PNG, no colons). If that lands, import the Festival/trailer files.
7. If paths miss, point at the repo `static/` tree (subfolders are walked).
8. Later relink by filename: **Ignore file extensions when matching** so `shot-plan-031.png` can become `shot-plan-031.mov` *if* you use that convention. This repo’s primary path is regenerate / `--swap`, not basename relink.

If import still adds nothing: Media Pool → right-click Timelines → Show Log → Import Log. The same lines are in `%AppData%\Blackmagic Design\DaVinci Resolve\Support\logs\davinci_resolve.log` (`Import Log (Fatal) - failed to import OTIO timeline`). Resolve does not log a per-clip reason.

Scripting API import often leaves clips unlinked; UI import is the reliable path.

## 8. Still-duration smoke test (manual)

OTIO still-holds are not as explicitly documented as FCPXML stills. After the first export:

1. Import `tmp/resolve-otio/smoke-one-still.otio` first (3-second hold of the title still).
2. Then import `tmp/resolve-otio/light-delay-festival-master.otio`.
3. Confirm a storyboard PNG holds for the shot length (several seconds), not one frame.
4. Confirm a dialogue WAV sits on A1 at the cue.

If stills collapse to one frame, the fallback is FCPXML / FCP7 XML from the same builder (not implemented in v1).

## 9. What this does not do

- Download Higgsfield results or write `videoAssetId`.
- Update ScriptFile timings from Resolve.
- Bundle media (`.otioz`).
- Authorize generation.
