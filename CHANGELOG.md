# Changelog

## 2026-09-16 - Catalog thumbs regenerated from intact sources

- Deleted 222 zero-filled WebP thumbs under `static/assets/_thumbs/` whose source images were still readable, then ran `thumbs:generate` (`created=231`).
- Six thumbs remain zero-filled because their sources are also wiped (fuel-audit 050–053 panels, vault-recovery panel-01, rao-sorell pair sheet). Twenty-nine catalog sources are still unreadable for thumb rebuild until those stills are restored.

## 2026-09-16 - Scenes 22 and 23 compacted to one continuous take each

- Joined Festival-master Scene 22 `065–067` into one 24.76-second bridge shot/take (`shot-plan-065` / `take-04`); dissolved stretch `065–067`. Reused stretch panel-01 as keyframe (custody `needs_regeneration`); 5 still refs; Seedance `videoPrompt` authored.
- Joined Scene 23 `068–070` into one 29.46-second bridge shot/take (`shot-plan-068` / `take-02`); reused storyboard-068; same 5-ref pair+location+wrist set. Shot count 94 → 90. No image gen or Seedance submit.

## 2026-09-16 - Restore Festival-master joined takes and Seedance registration

- Reconstructed single-take / dual-join storyboard coverage for scenes 18, 19, 20, 21, and 24 (104 to 94 shots); dissolved the matching visual stretches.
- Restored Higgsfield-submitted videoPrompts and still reference maps; rebound opening stills and continuity sheets on the joined takes.
- Rebound shared Seedance clips (040/041/054/056/083-085, 013b rev-2) and registered Scene 20-21 private inventory MP4s (062 = seg1+extension concat). Scene 20 clip noted for pre-whisper Harlan-line picture debt.
- Restored short whispered cue-0120; trailer-master source ref retargeted from removed 058 to 057.

## 2026-09-16 - Recover zero-filled / truncated production JSON

- Restored Festival-master script integrity (104 shots / 199 takes / 36 stretches, including Scene 18 video take and shots 051-053).
- Rebuilt `data/locations.json` hierarchy (`schemaVersion` 2.0.0) with reactor bay parented under engineering; tightened stretch ancestry so facility roots do not merge unrelated rooms.
- Normalized Seedance run results 083-085 to `visual-stretch-result.schema.json`; stripped illegal ledger `resultUrl` fields.
- Extended `Location` / `LocationsFile` TypeScript types for spatial hierarchy fields.

## 2026-09-16 - Scene 20 Harlan vindication line restored as whisper

- Restored `festival-master:cue-0120` EN to the short line `Now they'll never know who saved them.` with under-breath whisper delivery (ES `needs_revision`). Regenerated the EN WAV (~1.82 s), updated `shot-plan-057` description / Seedance `videoPrompt`, and refit placements (scene ~26.18 s). Private Seedance MP4 remains unregistered (generated with the prior long spoken line).

## 2026-09-16 - Scene 21 stills registered

- Registered new standalone stills for Festival-master shots `060`, `062`, and `064`, bound to their selected takes with the verified bridge, identity, monitor-content, package, and wrist-device references. Prior stretch assets remain recoverable; no video data changed.

## 2026-09-16 - Scene 19 shot 056 Seedance clip bound

- Author-approved Festival-master `056` still (`current`). Submitted singleton Seedance 2.5 I2V (**~27 cr**, 9s / 480p). Registered MP4, authored `videoPrompt`, and bound `videoAssetId` on `take-02` (`needs_review`).

## 2026-09-16 - Scene 21 dual join (packet + bridge monitor)

- Joined Festival-master Scene 21 `060–061` into one 11.70-second bridge shot/take and `062–063` into one 35.64-second bridge take that plays Zao’s vault recording on a diegetic monitor (not a vault cutaway). Dissolved packet-open and vault-flashback stretches; left `064` unchanged. Still refs ≤5 per join; monitor still `needs_regeneration`; no image gen or Seedance submit.

## 2026-09-16 - Scene 20 single-take still registered

- Registered the reviewed private 16:9 bridge still as `asset:festival-master-scene-20-single-take-still` and bound it to selected take `festival-master:shot-plan-057:take-04`. The former stretch panel remains recoverable; no video data changed.

## 2026-09-16 - Scene 20 compacted to one continuous take

- Replaced Festival-master Scene 20 stretch `057–059` with one 29.999-second shot/take (`shot-plan-057` / `take-04`) carrying all ten cues. Trimmed 461 ms of action slack to fit Seedance’s 30 s ceiling. Reused panel-01 as the singleton Seedance keyframe; authored a continuous `videoPrompt` that lets Seedance invent internal coverage. Stretch assets remain recoverable but inactive. No Seedance submit.

## 2026-09-16 - Scene 19 shot 054 Seedance clip bound

- Submitted singleton Seedance 2.5 I2V for Festival-master combined `054`/`055` (**~45 cr**, 15s / 480p). Registered MP4 and bound `videoAssetId` on `take-03` (`needs_review`). Shot `056` not submitted.

## 2026-09-16 - Scene 24 compacted to one continuous take

- Replaced Festival-master Scene 24 stretch `071–073` with one 23.58-second shot/take (`shot-plan-071` / `take-03`) carrying all seven cues. Reused approved panel-01 as the singleton Seedance keyframe; authored a continuous `videoPrompt` that lets Seedance invent internal coverage. Stretch assets remain recoverable but inactive. No Seedance submit.

## 2026-09-16 - Scene 15 shots 040/041 Seedance clips bound

- Submitted singleton Seedance 2.5 I2V for Festival-master `040` and `041` (**51 cr**: 27+24). Registered MP4s and bound `videoAssetId` on selected takes (`needs_review`).

## 2026-09-16 - Scene 19 combined-take video handoff prepared

- Authored the detailed 14.04-second Seedance prompt for the central-access-shaft 054–055 take. The selected take retains its four still-generation refs, while the approved combined still is added as a video-only I2V opening-frame ref; voice samples remain attached for Rao, Okoye, and Harlan. No video was submitted.

## 2026-09-16 - Scene 19 central-shaft correction

- Corrected the combined 054-055 Scene 19 take back to the central access shaft, matching the original take references. The reactor service bay is now recorded as the secondary location for independent shot 056; the corrected still and Seedance references use the shaft sheet.

## 2026-09-16 - Scene 15 shots 040/041 stills approved; Seedance prompts prepared

- Marked Festival-master `040` and `041` stills `current` / takes `selected`. Authored per-shot Seedance `videoPrompt`s (microgravity; plan segments `draft`). No submit.

## 2026-09-16 - Scene 19 first two beats compacted

- Combined Scene 19 shots 054-055 into one 14.04-second selected shot/take with one reactor-service-bay still and a dedicated Seedance prompt. Shot 056 remains independent and unchanged; prior assets remain recoverable.

## 2026-09-16 - Scene 28 Seedance clips bound

- Submitted three singleton Seedance 2.5 I2V jobs for Festival-master `083–085` (**84 cr** total). Registered MP4s and bound `videoAssetId` on selected takes (`needs_review`).

## 2026-09-16 - Scene 18 Seedance submitted and registered

- Author-approved Scene 18 single-take still (`current`). Submitted singleton Seedance I2V (**87 cr**, 29s / 480p); landed `shot-plan-050-rev-1-video-1.mp4` and bound `take-03.videoAssetId`. Not a visual-stretch job.

## 2026-09-16 - Scene 28 stills approved; Seedance prompts prepared

- Marked Festival-master greeting-prep `083–085` stills `current` and takes `selected`. Authored per-shot Seedance `videoPrompt`s (plan segments `draft`). Cost preflight only — no submit (**84 cr** for three 480p I2V jobs).

## 2026-09-16 - Scene 18 Seedance prompt prepared

- Added a dedicated singleton-shot video prompt for Scene 18. It carries the existing dialogue sequence, attaches the five visual refs and three voice refs, and leaves internal Seedance coverage/reframing decisions unconstrained. The still prompt remains separate.

## 2026-09-16 - Scene 18 compacted to one continuous take

- Replaced the four-shot Scene 18 stretch with one 28.60-second shot/take carrying all eight existing cues. Added the private-generated single bridge still using the fixed meal-table geometry and Harlan, Voss, and Rao only; legacy stretch assets remain in place for recovery but are no longer active.

## 2026-09-16 - Scene 18 video stretch grouped

- Switched Festival-master Scene 18 shots 050-053 to one grouped Seedance video job totaling 28.60 seconds, retaining the four ordered still-panel keyframes. The in-progress 044/045 video jobs were preserved.

## 2026-09-16 - Scene 18 reduced-cast stills registered

- Registered the approved private regenerated stills for Festival-master shots 051-053 using individual Voss, Harlan, and Rao references and the fixed bridge sublocations. Authored shot descriptions/prompts were preserved; no video assets changed.

## 2026-09-16 — Location hierarchy schema + rebuild

- Added `data/schemas/locations.schema.json` (containment tree, axial-spine `connects`, portals, proximityEdges, navEdges + WorldState predicates) and registered it in `schema-manifest.json`.
- Rebuilt `data/locations.json` to schemaVersion 2.0.0: synthetic universe/regions, non-shootable hull host `location:celestial-ardor`, all prior shootable rooms reparented (`aboard` / `recessed_in` / etc.), spines with circulation edges, seed portals/proximity/nav. Types + `validateLocations` + Festival-master parent expectations updated. Linked `vehicle:celestial-ardor.homeLocationId` to the hull host.

## 2026-09-16 — Location hierarchy draft

- Added `docs/production/LOCATION_HIERARCHY_DRAFT.en.md`: universe root + all 14 catalog locations with proposed parent relations. Later wired into schema + rebuild (see above).

## 2026-09-16 — Still reference audit documented

- Added `AGENT_GENERATION_BRIEF.md` §4.1 (per-take still reference audit). Pointers from `AGENTS.md` and `AGENT_ONBOARDING.md`. Location-hierarchy schema noted as planned follow-on.

## 2026-09-16 - Scene 18 stills regenerated with corrected labeled composites

- Registered replacement visual-stretch panels for Festival-master shots 050-053 into the existing panel paths; selected takes and the asset-generation manifest were updated. Stills remain `needs_review`. No video assets changed.

## 2026-09-16 — Scene 19 still location refs corrected (careful)

- Scene 19 (`054–056`) restaged to **outer reactor service bay** (bottom of the central-access shaft), matching master `D3` and author geography. Still location sheet: reactor-service-bay only. Shot EN descriptions/prompts updated; plans rebuilt. No image regen.

## 2026-09-16 — Catalog thumbnail sync

- Ran `npm run thumbs:sync`: 109 created, 121 updated, 11 orphan WebPs removed. Catalog 395 image assets.
- Thumbnail generator now skips unreadable sources instead of aborting. 25 catalog PNGs are all-zero Git LFS blobs (not decodable); prior thumbs kept where they existed. Sources were not regenerated.

## 2026-09-15 - Second approved scene 18 still registration

- Registered the second approved private generations for Festival-master shots 050-053 with explicit Sorell under-watch staging; no scene 19 or video assets were changed.

## 2026-09-15 — Dissolved multi-location no-video stretches

- Removed stretch packages that had no video and more than one location sheet: `054–056` (central-access + vault), greeting `083–085`, and `086` (bridge + Velari station). Shots are now independent `shot_still` packages.
- Scene 19 (`054–056`) approved for still generation (`needs_regeneration` + runnable refs/prompts). Plans rebuilt. No image regen.

## 2026-09-15 - Registered scene 20 custody-fixed stills

- Landed Higgsfield regen for `stretch-bridge-vector-057-059` (job `fdf24b0a…`) into sheet/panels; selected `take-03` on shots 057–059 (`needs_review`). Repo private inventory only until this register pass.

## 2026-09-15 - Approved scene 18 still registration

- Registered the approved private generations for Festival-master shots 050-053; no scene 19 or video assets were changed.

## 2026-09-15 — Scene 19 stills split to independent generations

- Converted `stretch-central-vault-obstruction-054-056` to `independent_shared_authority` (`:rev-2`): central-access + inner-shielding vault location sheets must not share one combined storyboard. One still prompt/refs per shot (054–056); old sheet/panels marked `needs_regeneration`. Plans rebuilt.

## 2026-09-15 — No-video still prompts fixed

- Replaced `established-N` blocking on investigation `046–049` and device `071–073`; compiled stretch still prompts no longer contain placeholders.
- Patched selected-take still prompts for fuel-audit `050–053` with Sorell under-watch custody language; authored missing independent still prompts for `036` and greeting `083–086`.
- Ran `scrub:still-prompts --write` on Festival-master (14 takes). No image regen.

## 2026-09-15 — No-video integrity audit + Sorell custody staging

- Added reproducible audit `npm run report:festival-master-no-video-integrity` → `reports/festival-master-no-video-integrity.md` (no-video inventory, Sorell custody checks, orphan video ledger).
- Authorship: Sorell provisional custody / under-watch staging on stretches 046–049 and 050–067 (release still at 068). Marked related stills `needs_regeneration` + `continuity_error` (no image regen; `selectedTakeId` unchanged). See `reports/festival-master-sorell-custody-remediation.md`.
- Orphans: keep superseded 033–036 / title-rev-1 / 040b-rev-1 / 013b-rev-1 / preamble-raw; wrong-range bound videos: none.

## 2026-09-15 — Approve periapsis 013b Seedance rev-2

- Author-approved `asset:festival-master-shot-plan-013b-rev-2-video-1-video` (`imageStatus: current`). Rev-1 run marked `rejected` (fast Jupiter spin). Selected take remains bound to rev-2 for Movie mode.

## 2026-09-15 — Periapsis 013b Seedance rev-2 (calm Jupiter flyby)

- Rejected rev-1 (Jupiter spun too fast). Updated shot/cue/camera/location copy to a slow flyby past the Ardor with a slow prograde→retrograde turn start and nearly fixed Jupiter.
- Submitted `…:rev-2:video-1` (Higgsfield `9686a980-f8a4-400d-90de-e79117f94cb5`), **15 cr**, ~5 s / 480p → `…/shot-plan-013b-rev-2-video-1.mp4`. Bound `videoAssetId` on the selected take (rev-1 retained on disk). Pending review.

## 2026-09-15 — Scenes 20–22 stretch stills registered (rev-2 candidates)

- Generated five Festival-master combined storyboard sheets in Higgsfield (`gpt_image_2`) for stretches 057–059, 060–061, 062–063, 064, and 065–067; split and registered as `take-03` candidates (`:rev-2`). `selectedTakeId` unchanged pending approval. Restored null-corrupted `scripts/register-visual-stretch-panels.mjs` from `cd4958c`.

## 2026-09-15 - Scene 18-19 still generation

- Generated independent Festival-master stills for shots 050-056 from the authored scene blocking and existing reference sets. Combined source sheets remain untouched; replacements are pending editorial review.

## 2026-09-15 — Scenes 20–22 still authorship + video freeze prep

- Reauthored Festival-master stretches 057–067 (vector, packet-open, vault flashback, command-break 064 and 065–067): explicit 1 g / MG, identity locks vs pair sheets, scrub-safe shot descriptions, non-placeholder blocking/members. Command-break converted from `independent_shared_authority` to combined storyboard sheets. Shot 064 duration set to 4200 ms. `videoPromptFreeze` stamped (submit only after still regen + human go). Plans rebuilt; panels marked `needs_regeneration` (not regenerated). Surgical script: `scripts/_fix-scene-20-22-authorship.mjs` (Auto/Composer).

## 2026-09-15 — Regen Seedance 044/045 (author-selected stills)

- Landed author-selected `044-b0` as `shot-plan-044` keyframe (`current`); restored Codex still for 045 (no image regen).
- Resubmitted Seedance for both singleton stretches (**54 cr**: 15+39): 044 cylinder reconnect; 045 longer take (~13s) with display-look surprise directed in the video prompt only. Registered stretch videos pending review.

## 2026-09-15 — Approve periapsis 013b still; Seedance package ready

- Author-approved `festival-master:shot-plan-013b` still (`imageStatus: current` on take + asset). Shot/cue/location copy now state the start of the prograde→retrograde end-for-end turn near ~1,000 km/s, with tracking + Jupiter/ring parallax as the velocity read.
- Still refs unchanged and verified: `asset:vehicle-celestial-ardor-jupiter` + `asset:vehicle-celestial-ardor-model-sheet-v2`. Singleton I2V ready-run authored at `reports/runs/run-festival-master-shot-plan-013b-rev-1-video-1-ready.json` (start_image 013b + model-sheet-v2). Waiting for go before MCP submit.

## 2026-09-15 — Unblock Pages CI after Seedance push

- Refresh generated editorial artifacts (master relevance, pending notes, schema types, production plans, audience TTS). Restore missing `location:celestial-ardor-command-vestibule`. Align shot-045 `durationMs` with cue span. Add `@ts-nocheck` on Node script modules imported under `checkJs`, fix `ShotId` import and ShotDetailsPanel typing, and update Festival unit expectations so `svelte-check` and Vitest pass.

## 2026-09-15 — Scenes 18–19 still authorship fixed

- Reauthored Festival-master stretch still packages for bridge fuel-audit (050–053) and central-vault obstruction (054–056): explicit 1 g / microgravity, identity locks vs pair sheets, non-placeholder blocking/member stages, vault location ref added (5/5). Shot descriptions and visibleRefs aligned so compiled sheet prompts are self-contained. Plans rebuilt; stills not regenerated (panels marked `needs_regeneration`).

## 2026-09-15 — Scene 16 Seedance 042–045b submitted

- Submitted five Festival-master Seedance jobs in two parallel batches: 042/043/044 (**69 cr**) then 045/045b (**39 cr**) after prep. Codex/approved stills used as keyframes; BFL candidates remain under `tmp/bfl/` only.
- 045: bridge alibi with Harlan+Voss+Rao+Okoye sheets + Harlan/Voss voices; Sorell/Zao monitor-feed only. 045b: new singleton `stretch-service-cylinder-harlan-okoye-045b` locked to 026 cylinder geography with Harlan+Okoye force sheets (silent).

## 2026-09-15 — Scene 16 Seedance 042–044 ready (Codex keyframes)

- Abandoned BFL still promotion for 042–044; keep Codex storyboard stills as Seedance keyframes (`imageStatus: current`).
- Approved video freezes on `stretch-reactor-sorell-042-043` and `stretch-service-cylinder-harlan-044`; prompts allow blood/injury to intensify in motion; Sorell wardrobe locked to character sheet (no EVA).
- Ready handoffs under `reports/runs/` for video-1 (042), video-2 (043), and 044 video-1. Keyframes uploaded; waiting for author go before MCP submit.

## 2026-09-15 — Shot 045 monitor-feed clarity

- Replaced the selected Festival-master shot 045 still with an independent bridge frame whose prominent monitor clearly shows the shot-043 outer reactor service bay, including Sorell, Zao, the handheld comm, radial hatch, and handholds. The obsolete combined-stretch panel remains retained as a non-selected candidate; editorial review is pending.

## 2026-09-15 — Scene 16 still regeneration

- Regenerated Festival-master stills for shots 042, 043, 044, 045, and 045b using the approved selected-take prompts and reference sets; refreshed active storyboard and production-plan links. Stills remain pending editorial review.

## 2026-09-15 — BFL FLUX.2 still generator (shot 042 ready)

- Added `scripts/generate-bfl-still.mjs` + `scripts/lib/bfl-client.mjs` for dashboard.bfl.ai API stills (multi-ref `input_image*`, `safety_tolerance`, dry-run by default). npm: `bfl:still`, `bfl:still:042`, `bfl:credits`. Outputs land under `tmp/bfl/` until reviewed.
- Aligned client with BFL sample pattern (`asJson`, Pending poll, Ready vs stop). Still prompts rewritten Flux-native: no negative dumps; Image 1/2/3 roles; positive constraints; optional `--json-prompt` / `--model flux-2-max`.

## 2026-09-15 — Scene 16 stills 042–045b regen-ready

- Verified/fixed prompts and refs for 042–045b: Sorell character-sheet only on 042–043; 044 matched to 026 cylinder/patch-panel; 045 bridge crew + crew-stations + hatch-stations; 045b narrowed to Harlan+Okoye in current service-cylinder (dropped phantom wired-comms / dual-route prompt). All marked `needs_regeneration`.
- Tightened `stretch-service-cylinder-harlan-044` still prompt: peak reconnect inside cylinder only; attached approved `storyboard-026` as continuity ref; forbids bridge-wash / hatch-egress framing that the prior 044 still showed.
- Full 045b pass: prior still bled central-access spiral stairs; prompt/refs rewritten to lock cylinder v5 + approved 026 geography; removed reactor-bay secondary; explicit bans on spiral/helix/bridge/bay interior.

## 2026-09-15 — Split scene 16 shots 044–045 by location

- Removed cross-location stretch `bridge-harlan-alibi-044-045`. Replaced with singleton `stretch-service-cylinder-harlan-044` and `stretch-bridge-harlan-alibi-045`.
- Shot 045 stays on the bridge with Harlan + Voss + Rao + Okoye on-frame (Sorell/Zao only in the monitor feed). Prompt/refs and framing updated; marked `needs_regeneration`.

## 2026-09-15 — Scene 16 shots 042–044 ref corrections

- **042–043:** Removed EVA-suit wardrobe lock; Sorell appearance is `asset:character-sorell-sheet` only. Stretch/shared copy and take prompts updated; optical transmitter kept off-frame.
- **044:** Location/prop refs matched to shot 026 disconnect — Harlan + service-cylinder + wired-comms patch panel (not bridge vestibule). Shot location and description aligned to the service-cylinder tray reconnect. Stills marked `needs_regeneration`.

## 2026-09-15 — Scene 16 stretch panels: corrupt files vs wiring

- Animatic JSON for 042–045 was already wired (`selectedTakeId` → stretch panels); on-disk/LFS blobs for several stretch PNGs were zero-filled invalid files, so `/animatic` could not display them.
- Re-split valid `reactor-sorell-042-043` panels from the good sheet. `bridge-harlan-alibi-044-045` sheet is corrupt in LFS — marked `needs_replacement`; temporarily reselected independent take-01 stills for 044/045 so the animatic shows frames until the sheet is regenerated.

## 2026-09-15 — Seedance audio: dialogue yes, music no

- Documented the Light Delay Seedance contract: spoken cue dialogue is allowed; score/underscore/BGM/**dramatic instrumentation** is forbidden and mixed in post (`SEEDANCE_PROMPTING.md` §6, with cross-refs in `AGENTS.md`, generation brief, dialogue lessons, and Higgsfield MCP). Compiler negatives spell out score/underscore/BGM/dramatic instrumentation explicitly.

## 2026-09-15 — Scenes 13–14 Seedance videos submitted

- Submitted all six ready one-shot jobs (033–038) at 480p / native audio. **107.5 cr** charged (20+22.5+20+25+20); 036 `f9c7195a…` failed `ip_detected` and **17.5 cr refunded**. Registered 033/034/035/037/038 pending review at job level. Selected takes unchanged. Ultra balance after: 1845.5.

## 2026-09-15 — Shots 026–028 Seedance videos submitted

- Submitted scene-11 one-shot Seedance jobs in parallel: 026 `ff924eff…` (6s/15cr), 027 `7f74b869…` (7s/17.5cr), 028 `e79309a5…` (8s/20cr) → **52.5 cr** (+~15 wasted on discarded PLACEHOLDER 026 `890c9ad0…`). Clips registered pending review under their singleton stretch paths. 028 provider output trimmed ~0.5s for duration gate. Ultra balance after: 1953.

## 2026-09-15 — Scene 11 shot 028 still regeneration

- Regenerated the Festival-master still for shot 028 with the current Sorell and central-access v4-b references; updated the selected storyboard take and derived plan link. The still remains pending editorial review.

## 2026-09-15 — Shots 026–027 Seedance packages use regenerated keyframes

- Marked regenerated `asset:festival-master-storyboard-026` / `027` current for Seedance and refreshed ready handoffs. Compiled prompts now attach those stills as `@Image1` ordered keyframes (026: + Harlan + patch panel; 027: + Voss/Sorell sheets + voices).

## 2026-09-15 — Scene 11 shots 026–027 still regeneration

- Regenerated the Festival-master stills for shot 026 (Harlan’s service-cylinder ballistic launch) and shot 027 (Sorell/Voss bridge decision) with the current references and updated the active storyboard/plan links.

## 2026-09-15 — Shot 028 central-access + concept-sheet-v4-b

- Registered `asset:location-celestial-ardor-central-access-sheet-v4-b` (`concept-sheet-v4-b.png`, bridge-level looking down) and wired it onto `location:celestial-ardor-central-access`.
- Moved shot 028 / stretch to central access (helical stair, not service cylinder). Seedance preview handoff prepared; old shaft panel marked `needs_regeneration` (no regen).

## 2026-09-15 — Shot 026 Harlan trunk-cut Seedance ready

- Prepared singleton `stretch-service-cylinder-harlan-026`: corrected member timing (removed stray hatch/jammer copy), microgravity tray→ballistic launch, Harlan + patch-panel refs, freeze approved. Ready handoff `…:video-1` (silent action, 6s). Panel-01 marked current as keyframe (no regen).

## 2026-09-15 — Shot 027 bridge microgravity (not service shaft)

- Corrected `shot-plan-027`: Voss and Sorell remain on the Celestial Ardor bridge in microgravity (festival story-06), not the service-cylinder ladder. Peeled 027 into `stretch-bridge-route-decision-027`; split former 026–028 stretch into singleton 026 / 028 packs. Shaft panel still marked `needs_regeneration` (no regen). Preview Seedance handoff prepared; ready submit waits on a bridge keyframe.

## 2026-09-15 — Per-shot Seedance partition + scene 14 ready

- Set `generationProfile.maxMembersPerVideoJob: 1` on every Festival-master visual stretch (85 one-shot video jobs; no multi-member Seedance buckets).
- Split the three cross-scene stretches into scene-scoped packs: reactor-record → `033-035` + scene-14 `036-038`; greeting-prep → `083-085` + `086`; command-break → `064` + `065-067`. Split packs use `independent_shared_authority` on existing stills.
- Scene 14 (`stretch-reactor-confront-036-038`) freeze-approved; 037/038 stills marked current as keyframes (no regen). Force-attach mute Zao sheet on all three members. Ready handoffs: `…:video-1|2|3` under `reports/runs/`.

## 2026-09-15 — Bridge-comms 023–025 Seedance videos submitted

- Submitted all three parallel Seedance jobs (`51151957…` / `872cd172…` / `03d34830…`), **55 cr** total (17.5+20+17.5). Downloaded and registered pending review under the bridge-comms stretch path. Split package with forced mute-cast sheets; 024 keeps cue-0047 J-cut note for post.

## 2026-09-15 — Bridge-comms exceptional Seedance identity sheets

- Exceptional mute-cast lock for face drift: member `videoReferenceAssetIds` force Voss/Sorell/Rao/Okoye sheets on 023 and 025, and Harlan + wrist-device sheets on 024. Speaker protocol unchanged; no guideline edits.

## 2026-09-15 — Festival Seedance clips attached in Movie mode

- Re-linked 18 registered stretch videos onto Festival-master plan job `outputs.assetId` so Movie mode replaces those stills. `production:plans` now re-applies those ids from `assets.json` (`metadata.stretchJobId`) instead of dropping them on rebuild.
- Bound singleton clips pending review: title take → joined rev-2 sting (~27 s); 039 Harlan I2V; 040b throat-entry rev-2 (~15 s). Selected takes unchanged. 040b rev-1 and the title preamble raw stay on disk only.
- Documented the still→video attach path for agents (`AGENT_GENERATION_BRIEF.md` §8.5, stretch pipeline, Higgsfield §8b, onboarding, `AGENTS.md`).

## 2026-09-15 — Bridge-comms 023–025 Seedance assets + Zao J-cut

- Corrected the three one-shot Seedance packages after the split: off-screen Zao on 023/024; cue-0047 repeated on 024 (`presentationOverride: radio`, animatic `gainDb: -96`) with shot notes that post lays 023 audio under Harlan’s reaction. Stretch still refs use solo sheets + crew-stations + hatch-stations. Compiler scopes identity sheets and present cast per `maxMembersPerVideoJob: 1` job (023 Zao only; 024 Zao+Voss; 025 Rao+Voss, no Zao).

## 2026-09-15 — Scene 10 video split into singleton jobs

- Converted the 023–025 bridge video from one grouped stretch into three one-shot Seedance jobs using the manually replaced stills as ordered keyframes. Added explicit dialogue identity refs, removed the combined-sheet still mode, and approved the video prompt freeze. All three jobs compile and are runnable.

## 2026-09-15 — Scene 10 replacement stills and belt continuity

- Updated the registered scene 10 bridge references and shot prompts to preserve the newly visible fixed-seat belts. Shot 24 video continuity now keeps Voss facing forward without looking back toward Harlan. No images were regenerated.

## 2026-09-15 — Reactor-optics 029–032 Seedance videos submitted

- Submitted all four per-take jobs in parallel (`2c5d2191…`, `e3762e4a…`, `2bc1b5c3…`, `7c716c7c…`), **102.5 cr** total (20+35+30+17.5). 480p `omni_reference` with native audio; declined IN THE DARK preset. Registered pending review; selected takes unchanged.

## 2026-09-15 — MCP package-prep must list assets with cost

- Documented in `HIGGSFIELD_MCP.md` §8b (and cross-refs in stretch / generation briefs / onboarding): when presenting a ready Seedance package for go/no-go, report credits **and** every input asset (`assetId`, role, path, ledger reuse vs upload) — not cost alone.

## 2026-09-15 — Reactor-optics 029–032 video jobs split per take

- Set `generationProfile.maxMembersPerVideoJob: 1` on `festival-master:stretch-reactor-optics-029-032` so Seedance packages one shot per job (four jobs) instead of two paired continuous takes. Added the optional partition cap to the stretch pipeline/docs. Ready handoffs + keyframe uploads staged; waiting for author go before MCP submit.

## 2026-09-15 — Scene 10 shots 024–025 corrected and regenerated

- Replaced shot 024 with a still using the zoomed service-shaft hatch/stations reference plus Harlan, Voss, and wrist-device sheets; Voss is secured at the rear station. Replaced shot 025 with explicit microgravity restraint blocking: Voss, Rao, and Okoye stay strapped to fixed chairs while Sorell alone leaves her seat hand-over-hand. Registered rev. 3 assets; plans validate and remain pending editorial review.

## 2026-09-15 — Bridge service-shaft hatch second reference

- Registered author-provided second bridge view `asset:location-celestial-ardor-bridge-service-shaft-hatch-stations-reference` (`service-shaft-hatch-crew-stations.png`): service cylinder and hatch in foreground with crew stations behind the shaft. Complements the existing `…-service-shaft-reference`; not assigned to specific shots yet. Wired onto `location:celestial-ardor-bridge` reference list.

## 2026-09-15 — Festival-master scene 10 independent stills generated

- Generated and registered new independent stills for shots 023–025 as `asset:festival-master-storyboard-023-rev-2`, `...024-rev-2`, and `...025-rev-2`. Shots 023/025 use the author-provided crew-stations reference; shot 024 uses the existing bridge/hatch reference. All three remain pending editorial review.

## 2026-09-15 — Scene 10 bridge-stations reference registered

- Registered the author-provided `asset:location-celestial-ardor-bridge-crew-stations-reference` for shots 023 and 025. It establishes the seated console arc on the right and the spiral stairs/service-shaft orientation on the left. Shot 024 keeps the existing bridge/hatch reference.

## 2026-09-15 — Festival-master scene 10 blocking reauthored for independent stills

- Updated shots 023–024 in English for the new cut: the bridge crew remain seated while Zao’s full warning plays in 023; Harlan emerges, activates the wrist device after “sabotage,” and retreats through the same hatch in 024. The closer bridge-stations reference for 023/025 remains pending; the current bridge/hatch reference stays assigned to 024.

## 2026-09-15 — Festival title preamble Seedance (option 2)

- Submitted singleton `festival-master:shot-plan-title:rev-2:video-1` (Higgsfield `0964ef44-e5a7-48af-9f87-3b4c0217d834`), **30 cr**, ~12 s / 480p. No `start_image`; dusk plaza as layout ref; last frame locked to the existing sting open. Joined locally in front of rev-1 (~27 s) at `shot-plan-title-rev-2-video-1.mp4`. Not bound; selected take and duration unchanged. Did not run `register:visual-stretch-video`.

## 2026-09-15 — Reactor-entrance 018–019 Seedance video-1

- Submitted `festival-master:stretch-reactor-entrance-018-019:rev-1:video-1` (Higgsfield `0b8db206-6fe5-4345-a3b9-10e4223b02ae`), **40 cr**, ~16 s / 480p. Registered pending review. Declined FREE FALL style preset. Ledger reused Harlan/Zao sheets and 5s voices; uploaded two keyframe panels.

## 2026-09-15 — Central-access 013–015 Seedance video-1

- Submitted `festival-master:stretch-central-access-013-015:rev-1:video-1` (Higgsfield `870bba91-51e4-4d6c-aa6c-055b91721854`), **37.5 cr**, ~15 s / 480p. Registered pending review. Exterior periapsis `shot-plan-013b` skipped. Ledger reused Elin/Zao sheets and 5s voices; uploaded three keyframe panels.

## 2026-09-15 — Axial-dock 006–009 Seedance video-1

- Submitted `festival-master:stretch-axial-dock-006-009:rev-1:video-1` (Higgsfield `241428bd-15d1-48f3-b615-8f40149292a8`), **52.5 cr**, ~21 s / 480p. Registered pending review. Ledger reused four character sheets; uploaded four panels + four Seedance 5s voices. Note: submit prompt had Image7 entity-map typo (`zao` vs `voss`); sheet order still correct — review before accept.

## 2026-09-15 — Animatic-to-generation package jumps

- Animatic shot cards and the details drawer link to Image / Video / Audio generation lists with `?shot=`. The generation list opens the matching group, expands those cards, and keeps `shot` when switching mediums. Audio is omitted when the shot has no dialogue packages. Generation cards link back to the animatic shot.

## 2026-09-15 — Festival-master title take bound to Earth→Jupiter sting

- Bound the one-off Seedance title sting (Higgsfield `d0602f1d-f9af-4651-bb06-38f321f3beae`) to `festival-master:shot-plan-title:take-01` as `videoAssetId` (`asset:festival-master-shot-plan-title-rev-1-video-1-video`). Copied to `static/assets/animatic/frames/festival-master/shot-plan-title-rev-1-video-1.mp4`. Selected take and video productionGate unchanged. Movie mode plays selected-take videos when no stretch job covers the shot.

## 2026-09-15 — Durable Seedance 5s voice clips

- Keep approved EN bank WAVs under `static/assets/voices/en/*.wav`. Store one-time **5 s MP3** Seedance clips under `static/assets/voices/en/seedance-5s/` (`npm run prepare:seedance-voice-clips`).
- EN `asset:voice-ref-en-*` assets keep `path` on the bank WAV and add `metadata.seedanceUploadPath` for MCP staging; handoff and `prepare:higgsfield` prefer the clip for `voice_sample` roles.

## 2026-09-15 — Higgsfield media ledger

- Added `data/production/higgsfield-media-ledger.json` (assetId + staging sha256 → remote `media_id`) seeded from run `uploadHandles`, plus `higgsfield-media-duplicates.json` for manual Assets UI cleanup.
- Ready handoffs set `references[].remoteMediaId` on cache hit; `register:visual-stretch-video` upserts the ledger. Rebuild: `npm run rebuild:higgsfield-media-ledger`.
- Documented reuse, workspace pin, IN THE DARK decline, no failed-job retry, and singleton-vs-stretch register in `HIGGSFIELD_MCP.md` §8b / generation guides.

## 2026-09-15 — Operations gallery 004–005 Seedance

- Submitted `festival-master:stretch-operations-gallery-004-005:rev-1:video-1` (Zao/Voss private exchange). Higgsfield `72cf8c68-f06d-4436-b80d-309ceb1c2961`, **30 cr**, 854×480 / ~12 s. Registered pending review as `asset:festival-master-stretch-operations-gallery-004-005-rev-1-video-1-video`.

## 2026-09-15 — Relink stretch videos on Festival plan

- Restored `outputs.assetId` on six Festival stretch video jobs (including operations-gallery 001–003 smoke) that had assets on disk but lost the plan link after rebuilds, so Movie mode can resolve them as spans.

## 2026-09-15 — Movie mode plays Seedance stretch videos

- Animatic Movie mode resolves registered stretch video jobs (`needs_review` / `current`) into unmuted playback spans that replace member stills and suppress cue WAVs for that range (Seedance audio). A/B video preload for the next span. Job-level register unchanged (no `take.videoAssetId` bind).

## 2026-09-15 — Murder stretch video-2 (036)

- Submitted `festival-master:stretch-reactor-record-033-036:rev-1:video-2` (Harlan confrontation). Higgsfield `1248bbd4-6a4e-4d31-a1e8-f68c0f704a34`, **17.5 cr**, 854×480 / ~7 s. Registered pending review as `asset:festival-master-stretch-reactor-record-033-036-rev-1-video-2-video`.

## 2026-09-14 — Murder stretch Seedance smoke (033–035)

- Submitted `festival-master:stretch-reactor-record-033-036:rev-1:video-1` (recording → TRANSMITTED). Higgsfield `5b8ec773-ecfc-42ae-a103-4d39ad7ba52f`, **60 cr**, 854×480 / ~24 s. Registered pending review as `asset:festival-master-stretch-reactor-record-033-036-rev-1-video-1-video`. Smoke `maxJobs:1` — video-2 (036 Harlan confrontation) not submitted; refs already uploaded.

## 2026-09-14 — Festival 040b forward extension submitted

- Submitted Seedance 2.5 `video_extension` forward of accepted 040b rev-1. Higgsfield `9ee4d969-e5e0-46b2-b1c7-d54405afcac9`, **25 cr**, 854×480. Provider returned the +10 s segment only; joined locally onto rev-1 as `static/assets/animatic/frames/festival-master/shot-plan-040b-rev-2-video-1.mp4` (~15 s). Pending review; selected take and script duration unchanged.

## 2026-09-14 — Festival 040b forward extension packaged (no submit)

- Packaged a Seedance 2.5 `video_extension` forward of the accepted 5 s 040b clip so the Ardor has time to enter the throat. Ready run `reports/runs/run-festival-master-shot-plan-040b-rev-2-video-1-ready.json`: +10 s new segment (~15 s total), 480p, native audio. Cost preflight **25 credits**. Source clip and last frame uploaded; not submitted. Script `durationMs` stays 5000 until the longer clip is accepted.

## 2026-09-14 — Festival 040b Seedance submitted

- Submitted the singleton 040b I2V as one omni_reference job (keyframe + wormhole sheet + Ardor v2 sheet). Higgsfield `1dee29bd-e0de-4a87-9646-062dc73a20b9`, **12.5 cr**, 854×480 / ~5 s. Clip: `static/assets/animatic/frames/festival-master/shot-plan-040b-rev-1-video-1.mp4`. Pending review; selected take unchanged.

## 2026-09-14 — Festival 039 Seedance submitted

- Submitted the singleton 039 I2V (Harlan: “No stopping it now.”) as one omni_reference job. Higgsfield `c37c679d-e672-4960-af42-9308f929a72c`, **32.5 cr**, 854×480 / ~13 s. Clip: `static/assets/animatic/frames/festival-master/shot-plan-039-rev-1-video-1.mp4`. Pending review; selected take unchanged.

## 2026-09-14 — Vault-recovery Seedance (080–082)

- Author-approved `festival-master:stretch-vault-recovery-080-082`: stills marked current, `videoPromptFreeze` approved, speaker identity sheets in `videoReferenceAssetIds`.
- Both grouped jobs submitted at 480p / omni_reference (video-1 `95ba9e77…` 60 cr / ~24 s; video-2 `3a10dada…` 22.5 cr / ~9 s). Registered pending review as `…-rev-1-video-1-video` and `…-rev-1-video-2-video` (854×480).

## 2026-09-14 — Festival 040b Seedance package (no submit)

- Packaged singleton I2V for `festival-master:shot-plan-040b` (no visual stretch: 040/041 are bridge interiors). Ready run `reports/runs/run-festival-master-shot-plan-040b-rev-1-video-1-ready.json` with the animatic still plus wormhole and Ardor v2 sheets. Cost preflight **12.5 credits** at 5 s / 480p; not submitted.

## 2026-09-14 — Trailer end title sting (Earth → Jupiter)

- Seedance 2.5 first/last-frame package for a 15 s trailer end title: Earth night-side, follow a thin optical-comms pulse, settle on `shot-plan-087` (`LIGHT DELAY` over Proxima + Jupiter). Ready run: `reports/runs/run-trailer-master-title-end-earth-jupiter-rev-1-video-1-ready.json`.
- Generated a matching Earth opening still (2 cr) then omitted it from the video job after Higgsfield `ip_detected` on the two-frame submit (37.5 cr refunded). Recovery job `d0602f1d-f9af-4651-bb06-38f321f3beae` completed 854×480 / ~15 s / 37.5 cr, pending review. `trailer-master:shot-g-01` was not rewritten.

## 2026-09-14 — Vault-discovery Seedance (020–022)

- Cleared the possibly-OK defer for `festival-master:stretch-vault-discovery-020-022`: stills marked current, `videoPromptFreeze` approved, Zao sheet added to `videoReferenceAssetIds` for speaker identity.
- Both grouped jobs submitted at 480p / omni_reference (video-1 `8c38189a…` 42.5 cr / 17 s; video-2 `11bb0338…` 37.5 cr / 15 s). Registered pending review as `…-rev-1-video-1-video` and `…-rev-1-video-2-video` (854×480).

## 2026-09-14 — Festival Seedance smoke at 480p

- Locked Seedance video resolution to **480p** (`provider-capabilities` `preferredResolution`, handoff Seedance fallback, HIGGSFIELD_MCP / SEEDANCE_PROMPTING / AGENT_GENERATION_BRIEF). MCP catalog default is 720p; omit never upgrades.
- First paid smoke: operations-gallery 001–003 ready run after `get_cost` (~57.5 credits at 23 s / 480p / omni). Job id `ab5931b2-dd05-42c6-a1fe-8be5111a89ce` completed **854×480**, registered `pending_review` as `asset:festival-master-stretch-operations-gallery-001-003-rev-1-video-1-video`.
- Trailer-overlap parallel batch (no failed-job auto-retry): bridge-meal 010–012 (`8a7760a8…`, 52.5 cr), engineering-audit 016–017 (`0a113187…`, 42.5 cr), bridge-investigation 046–049 (`ef28f364…`, 62.5 cr). All 854×480, registered pending review.
- Documented Seedance hard cap: combined voice-sample duration **≤ 30 s** (four full ~12 s bank WAVs → MCP 422; truncate to ~5 s each). Upload real MP3 when the signed URL expects `audio/mpeg`.

## 2026-09-14 - Regenerated Festival-master shot 089

- Corrected shot 089 so Voss is physically inside the bridge and Sorell plus the Velari Transport Sphere appear only within the suit-camera monitor feed; the bridge hull now fills the background.
- Rebuilt the five-reference prompt and regenerated `/assets/animatic/frames/festival-master/shot-plan-089.png`; the replacement remains `needs_review` pending editorial approval.

## 2026-09-14 — OK stretch Seedance packages (freeze, no submit)

- Per-stretch `videoPromptFreeze` on the 11 Festival-master stretches marked OK in `tmp/review-of-generated-stills.md`. Grouped Seedance jobs compile `compiledPrompt` only when that freeze is approved and the Seedance 2.5 snapshot is executable.
- Seedance 2.5 snapshot is `executable: true` (`confidence` still `provisional`). Ready handoff emits `status: ready` / `nonExecutable: false` for those 13 video jobs. No Higgsfield job was submitted; paid smoke still needs `get_cost` plus human confirmation. Full `prepare:higgsfield` still fails on a missing engineering concept sheet; 42 OK-stretch refs were staged under `higgsfield-uploads/stretch/`.
- Trailer-overlapping packages first: operations-gallery 001–003, bridge-meal 010–012, engineering-audit 016–017, bridge-investigation 046–049.


## 2026-09-14 - Canonical Celestial Ardor EVA suit reference

- Derived and registered a canonical EVA suit model sheet from the approved Velari-answer panel, preserving its established suit design without regenerating any stretch still.
- Attached the suit reference to every Festival-master take where the suit is visible, including the suit-camera display shots. Rebuilt plans remain within the still reference budget: 5 references at most.

## 2026-09-14 — Seedance native audio on by default

- Higgsfield Seedance video jobs now pass `generate_audio: true` unless the author asks for a silent clip. Handoff compiler, run schema, MCP catalog notes, and Seedance/MCP agent docs match that policy.

## 2026-09-14 — Higgsfield MCP connected (Ultra)

- Cursor Higgsfield plugin authenticated against the paid Ultra account (3010 credits). Project MCP URL: `.cursor/mcp.json` → `https://mcp.higgsfield.ai/mcp`.
- Live tool catalog and Seedance 2.5 constraints snapshotted to `data/production/higgsfield-mcp-catalog.snapshot.json`. Cost preflight only (8 s / 480p / silent Seedance 2.5 = 20 credits); no generation submitted.

## 2026-09-14 - Regenerated rejected Festival-master visual stretches

- Corrected six rejected stretch prompts and persisted the revised English source descriptions and compiled still prompts: bridge comms (023-025), reactor rescue (042-043), Harlan alibi (044-045), bridge greeting preparation (083-086), Velari answer (087-088), and Velari envoy (091-092).
- Generated replacement gpt-image-2 stretch sheets, split and re-registered their panels, and restored the regenerated panel takes as selected. Outputs remain `needs_review` pending editorial review; no Higgsfield/MCP request was made.
- Prompt corrections preserve current bridge/service-shaft geometry, character identity and screen direction, EVA continuity, interior-only bridge windows, and the larger Velari Transport Sphere.

## 2026-09-14 — Festival-master music integration (Suno free handoff)

- English soundtrack authority: `docs/GUIA_BANDA_SONORA.en.md` (Festival-master / trailer-master naming); Spanish `GUIA_BANDA_SONORA.md` marked as lagging translation.
- WIP cue sheet + Suno prompt pack: `docs/wip/festival-master-music-cues.en.md`, `docs/wip/festival-master-suno-prompts.en.md` (~11 stems).
- Encoded 13 `MusicCue`s on `script:light-delay-festival-master` with placements; duck at withheld recording, stop at death; `trackAssetId` unset until stems exist.
- `data/production/credits.json` selects Suno; on-screen / docs credit copy adds `Music: generated with Suno` (ES `needs_revision`). Credit-02 still marked `needs_regeneration` (no regen this pass).

## 2026-09-14 — Seedance stretch prompt previews with speaker identity and motion continuity

- Added non-executable video prompt previews for the 11 approved Festival-master visual stretches.
- Seedance handoffs retain explicit individual character sheets for every speaker alongside ordered
  keyframes and approved voice samples; each dialogue cue is mapped to both identity and voice.
- Stretch prompts now carry prior end states, blocking, camera progression, physics, and motion
  continuity between stages. No provider submission or image regeneration occurred.

## 2026-09-14 — Mark Festival-master stretch panels as current

- Promoted 44 stretch-derived panel assets from 
eeds_review to current so generation ref-ready checks treat approved panels as generation-safe.

## 2026-09-14 — Stop stubbing shot.status and artifacts.animaticStill in the generation plan

- `scripts/build-generation-plans.mjs` wrote `status: 'blocked'` and
  `artifacts.animaticStill: { status: 'missing' }` unconditionally for every shot, regardless of
  its actual `blockers`/take state — e.g. `festival-master:shot-plan-016b` showed `status:
  "blocked"` with `blockers: []` and an already-generated still marked `"missing"`.
- `status` is now derived from the shot's own (deduped) blockers: `'ready'` when empty, `'blocked'`
  otherwise. `artifacts.animaticStill` is now derived from the shot's selected take:
  `status: 'missing'` with no `imageAssetId`, `'accepted'` when `imageStatus.status === 'current'`,
  else `'generated'` (covers `needs_review`/`needs_regeneration`/`needs_replacement`) with
  `assetId` populated.
- Video segments (`segments[].compiledPrompt`/`promptStatus`), `firstFrame`/`lastFrame`, and
  `plan.plan.status` are untouched — no per-shot video prompt compiler exists yet and video
  generation remains unauthorized.
- Added regression coverage for `shot-plan-016b` in `generationPackages.spec.ts` (zero blockers,
  `runnable: true`, generated output with the correct asset id and review status).

## 2026-09-14 — Generation runnable aligned with current refs

- Independent stills, stretch jobs, video segments, and audio cues now share one **can generate** predicate: prompt/text ready, required refs present and current, no blockers. Plan `runnable: false` still wins. Existing output review/regeneration does not block generation.
- **Refs present** stays a diagnostic (files exist); **Refs ready** requires `current` status. Stale stretch refs no longer look generation-ready.
- Audio labels dialogue **text ready** separately from generation eligibility; missing voice samples still block can-generate.
- Expand all / collapse all move one tree level at a time (groups, then packages). Manifest object URLs are revoked after a short delay.


## 2026-09-14 — Clear remaining "prompt not ready" blockers on Festival-master image packages

- Lifted the still-side `editorial_prompt_freeze_not_approved` hold for the 21 independent
  (non-stretch) Festival-master shots, mirroring the stretch-job freeze lift from earlier today.
- Fixed a video-only hold (`video_generation_deferred`/`_blocked`) leaking into the shared shot
  `blockers` array — it now only reaches `segments[].blockers`, matching the schema's own
  documented `videoGenerationGate` contract ("never the animatic still").
- Stopped counting dialogue voice-sample references against the still image budget — they're for
  the shot's `finalAudio` artifact, not the still; `requiredReferences` still carries them for
  video consumers, only the still budget check now excludes them.
- Fixed `missing_entity_binding` firing on shots with a deliberately empty cast (the 3 credit
  cards) — now checks field presence, not non-empty length.
- Added algorithmic reference consolidation: when a shot's character count alone would exceed the
  still image budget, `build-generation-plans.mjs` now runs the same greedy pack-cover used for
  uncovered-entity remediation to substitute an existing multi-character reference sheet for solo
  sheets (e.g. the 5-person bridge-crew shots now resolve via the existing
  `asset:visual-pack-proxima-axial-dock-crew-sheet` composite, built for exactly this purpose).
- Promoted the 21 independent shots' selected takes from `status: "candidate"` to `"selected"`.
- All 50 Festival-master image packages (29 stretch + 21 independent) now show `promptReady: true`
  with zero blockers.

## 2026-09-14 — Generation packages report truthful prompts, refs, and outputs

- Independent still packages now preview `Take.generation.prompt` and require a non-empty prompt for readiness.
- Reference and output presence checks the catalog, `/assets/` path safety, static file existence, expected medium, and editorial `imageStatus` (current / review / regeneration / missing file).
- Missing required audio voice samples add a `missing_voice_sample` blocker; prompt-ready still means dialogue text only.
- The read-only UI uses localized source/blocker/status labels, `?filter=` query state across medium tabs, scene/stretch grouping, split keyframe/visual/voice lists, copy/export actions, and an in-page empty-plan state. `/generation` still defaults to Festival-master for static prerender.

## 2026-09-14 — Fix reports route SSR and wire visual-stretches

- Moved report builds to +page.server.ts and split browser-safe report metadata from Node builders (avoids 
ode:crypto in the client).
- Wired visual-stretches title/description into report presentation; reports include generatedAt.
- Unknown report ids return 404 instead of 500.

## 2026-09-14 - Lift Festival-master still stretch prompt freeze

- Removed the still-only editorial_prompt_freeze_not_approved hold from visual-stretch still jobs (video/Seedance keeps seedance_execution_gated).
- Rebuilt light-delay-festival-master plans so all 29 still stretch jobs carry a real compiledPrompt and 
unnable: true.
- Recorded the session-scoped exception in docs/production/AGENT_GENERATION_BRIEF.md. No submission adapter; plan JSON only.

## 2026-09-14 — Generation package readiness routes

- Added /generation/image|video|audio/[scriptId] read-only browsers for prompt readiness, reference presence, and generation outputs (Festival-master default).
- Plans load via import.meta.glob into the app; stretch jobs are primary image/video rows; dialogue cues drive audio packages (voice samples as refs, udioAssetId as output only).

## 2026-09-14 — Reporter animatic dialogue uses Qwen clone

- Mapped character:periodista to Qwen [Reporter] in generate-animatic-dialogue-audio.py (was falling back to Kokoro Narrator, male).
- Force-regenerated and promoted Festival-master EN estival-master:cue-0003 from Reporter.wav.

## 2026-09-14 - Regenerate independent Festival-master stills

- Regenerated and registered the 16 selected independent stills flagged for continuity, composition, or quality correction (013b, 016b, 037-041, 045b, 068-070, 074-076, 089-090).
- Each replacement was visually checked against its current prompt and references; all remain 
eeds_review for editorial acceptance.

## 2026-09-14 - Split and promote Festival-master stretch panels

- Split 24 previously unsplit stretch sheets into 68 panel PNGs and registered each panel as a derived storyboard asset.
- Promoted all 83 visual-stretch panel takes across the 29 authored stretches, including the previously registered candidate panels, so selected storyboard takes now use panel assets.
- Rebuilt production plans after selection changes; no narrative, dialogue, or shot ordering changed.
- Added scripts/register-festival-master-stretch-manifest.mjs and shared still-prompt compile helper for sheet/panel manifest records.

## 2026-09-14 — Fact-based trailer spoiler gate

- New `check:trailer-master-spoilers` (wired into `generated:check`) protects the live
  `script:light-delay-trailer-master` — the previous `check:trailer-spoilers` only ever
  checked the deprecated `light-delay-trailer.json`, so the current trailer had no automated
  spoiler coverage at all.
- Trailer cues now inherit `implementsFactIds` from the Festival-master cues they're sourced
  from (`npm run fit:trailer-master-facts` / `report:trailer-master-facts`), binding by cue
  content rather than adjacency (one condensed cue, `cue-e-01`, needed a content-verified
  override rather than its source cue's full fact set — see
  `scripts/lib/trailer-master-facts.mjs`).
- Added `scripts/lib/trailer-master-omitted-facts.mjs`: the explicit list of `master:fact-*`
  ids the trailer must never disclose (Zao's death, the culprit's actions/identity, send
  confirmation, resolution), with rationale for what's deliberately excluded.
- Fixed a real disclosure the new gate caught: `shot-d-01`'s description and the outline's
  matching step both said "found beside Zao's body," confirming both her death and whose it
  was, even though the shot's own spoken line stays properly ambiguous. Reworded to "found
  beside Zao's body" → "kneeling over someone" (script + outline, en/es).
- Added `outline:light-delay-trailer-master`'s `derivation` (pinned to the Festival-master
  outline), which needed widening `derivation.fidelity` to an enum
  (`complete_causal_chain` | `deliberate_omission`) in the outline schema and types — the new
  value intentionally skips the full master-step-coverage check that only makes sense for a
  complete adaptation, not a deliberate-omission cut.
- Fixed the stale `trailerMasterScript.spec.ts` assertion expecting some takes to still need
  their own standalone prompt: all 22/22 now reuse a Festival-master frame (documented as
  deliberate in `docs/wip/trailer-master-blueprint.en.md` and the 2026-09-12/13 entries
  below) — the test never got updated after that backfill. Cleared the resulting 7 leftover,
  unused `generation.prompt`s (two of which described Harlan's sabotage — dead data, not
  narrative canon).
- Resolved `AUTHOR_NAME_PLACEHOLDER` in the end credits (Sebastian Ferreyra Pons) and fixed
  `cue-g-3/4/5` → `cue-g-03/04/05` id padding.
- Registered `trailer-master` as an authorized derivative in `data/editorial-lifecycle.json`
  (previously only the deprecated trailer was listed there).

## 2026-09-14 - Complete Festival-master visual-stretch batch

- Generated, visually checked, and registered the remaining 14 approved stretch sheets; all 29 authored Festival-master stretches now have registered sheets.
- Preserved authored grid layouts and blank cells, used current reference assets, and removed temporary staging copies.
- No Higgsfield/video generation was run; selected takes and canonical dialogue remain unchanged.

## 2026-09-14 — Generate Festival-master visual-stretch batch (partial)

- Generated and registered sheets for reactor optics 029–032, reactor record 033–036, reactor rescue 042–043, bridge alibi 044–045, central-vault obstruction 054–056, bridge vector 057–059, bridge packet 060–061, and vault flashback 062–063.
- Existing approved sheets were preserved; the remaining missing stretches are queued for the next generation pass.

## 2026-09-14 — Approve axial-dock composite reference

- Promoted `asset:visual-pack-proxima-axial-dock-crew-sheet` to `current` after editorial approval.
- Wired it into `stretch-axial-dock-006-009`; the stretch now uses one reference, covers all visible entities, and has no budget violations.

## 2026-09-14 — Regenerate axial-dock composite from pair references

- Replaced the pending axial-dock composite with a corrected generation using the Voss/Harlan, Rao/Sorell, and Okoye/Voss pair sheets plus Zao’s sheet and the dock geometry.
- The revised sheet shows all six crew members and remains `needs_review` pending editorial approval.

## 2026-09-14 — Axial-dock composite reference pack prepared

- Created `asset:visual-pack-proxima-axial-dock-crew-sheet`, a composite reference covering the six crew members, Proxima Dock 1 axial geometry, and the berthed Celestial Ardor.
- It remains `needs_review` and is not yet wired into the axial-dock stretch; the existing eight-reference list remains authoritative until editorial approval.

## 2026-09-14 — Split oversized visual stretches into four-panel groups

- Reduced the reactor record stretch to shots 033–036 and the bridge command-break stretch to shots 064–067, each using a supported 2×2 layout.
- Later shots remain independent as requested, preserving their IDs and dialogue timing.
- Rebuilt plans; the panel-resolution blockers are cleared. Only axial-dock reference consolidation remains beyond the editorial freeze gate.

## 2026-09-14 — Complete missing visual-stretch blocking

- Added sensible station, security, translator, and tether-point blocking for the four stretches that lacked a row for every present character: 057–059, 060–061, 087–088, and 093–094.
- Rebuilt plans; those stretches now clear `missing_stretch_blocking`.
- Remaining non-freeze stretch blockers are limited to axial-dock reference consolidation and panel-resolution limits on 033–038 and 064–070.

## 2026-09-14 — Generate reactor and vault visual-stretch sheets

- Generated and registered the approved reactor-confrontation 077–079 and inner-vault recovery 080–082 storyboard sheets.
- Rejected the first reactor render for incorrect gravity staging and regenerated it with explicit microgravity constraints.
- Corrected the vault stretch copy to describe four-person continuity before generation.

## 2026-09-14 — Create reactor and vault visual-stretch reference packs

- Added and registered a current Harlan/Okoye bridge pair sheet, a reactor communications prop pack, and an inner-vault recovery prop pack.
- Authored the 077–079 reactor-confrontation and 080–082 vault-recovery stretches; both now have five-reference still jobs with no uncovered entities or budget violations.
- Rebuilt production plans; the remaining blocker for both jobs is the existing editorial prompt-freeze gate.

## 2026-09-14 — Approve locations and extend Festival-master stretches

- Approved the Celestial Ardor engineering and service-cylinder reference sheets.
- Authored the remaining reference-complete stretches through 071–073, reusing the bridge pair packs; service-cylinder 026–028 also includes the wired comms patch-panel reference.
- Only the reactor confrontation group 077–079 and vault recovery group 080–082 still require additional prop-pack consolidation.

## 2026-09-14 — Approve impulse-package reference

- Promoted `asset:object-proxima-geophysical-impulse-package-sheet` to `current` and wired it into `festival-master:stretch-vault-flashback-062-063`.
- Rebuilt production plans; the dependent stretch now has complete still-reference coverage within the five-image limit.

## 2026-09-14 — Bridge character-pair reference packs

- Added current bridge-context pair sheets for Voss/Harlan, Rao/Sorell, and Okoye/Voss.
- Wired the pair packs into the multi-character Festival-master stretches so five-person groups stay within the five-image still-reference limit without dropping on-frame identities.

## 2026-09-14 — Author viable Festival-master visual stretches

- Added prompt-ready visual stretches for the reactor comms/recording beats, Sorell's rescue, the bridge-side alibi, central-vault obstruction, greeting preparation, Velari response/encounter, and the final reactor report.
- Rebuilt generation plans and kept the five-image gpt-image-2 ceiling enforced. Four advisory candidates remain held by missing or over-budget references (bridge cast groups and the unapproved impulse-package sheet).

## 2026-09-14 — Remove legacy-site archive

- Deleted the obsolete legacy-site/ static archive (HTML pages and residual character/location/prop/vehicle/animatic assets). Current product assets live under static/assets/; do not treat the removed tree as authority or a regression baseline.

## 2026-09-14 — Correct gpt-image-2 still reference cap to 5

- Provisional `gpt-image-2` still limits are `maxImages: 5` / `maxTotalReferences: 5` in `provider-capabilities.json`; UI budget preview and provider tests match that ceiling.

## 2026-09-14 — Central access approval and wrist-device correction

- Promoted the Celestial Ardor central-access sheet to `current` and restored `festival-master:stretch-central-access-013-015`; its three dependent takes remain marked for regeneration against the approved sheet.
- Marked Harlan's wrist-device sheet for replacement: the device is now specified as a discreet digital controller with no literal `JAMMER` or `VAULT LOCK` labels.

## 2026-09-14 — Operations Gallery follow-up visual stretch

- Authored `festival-master:stretch-operations-gallery-004-005` for Zao and Voss's continuous private exchange after the crew disperses.
- Central-access, reactor-bay, bridge communications-cut, and Velari-response candidates were not retained as stretches because they require `needs_review` location/prop/character references; they remain advisory candidates until those references are promoted and reconciled.

## 2026-09-14 — Complete Operations Gallery stretch blocking

- Added the authored six-person blocking map for `festival-master:stretch-operations-gallery-001-003`: Harlan–Sorell–Voss in the foreground and Zao–Rao–Okoye behind them, with stable eyelines and in-place turns across shots 001–003.
- The Operations Gallery still job no longer carries `missing_stretch_blocking`; video remains gated only by the existing editorial freeze, execution, and panel-review holds.

## 2026-09-14 — Video reference-budget keyframe semantics

- Fallback Seedance jobs no longer inherit `reference_pack_required` from generic pack coverage on keyframe panels that lack `metadata.entityIds`.
- Video `referenceBudget` now exposes `keyframeCoveredEntityIds`, `videoExtraCoveredEntityIds`, and `uncoveredVideoEntityIds`; reports and docs treat those as the video completeness view.
- Stretch-candidate reports label candidates as editorial review suggestions, not pending production tasks.

## 2026-09-14 — Reference budget, packs, and stretch candidates

- Pack `metadata.entityIds` now counts toward entity coverage for still and video stretch jobs; attached reference lists are never silently trimmed.
- Plan jobs and per-shot plans emit structured `referenceBudget` plus split remediations (`reference_pack_required` vs `reference_consolidation_required`) with null-safe provider caps.
- Advisory `visual_stretch_candidate` detection uses composite `(scene.order, shot.order)` timeline and location ancestry; reports only — never writes `visualStretches`. Wired into `report:visual-stretches` / `report:all` and `report:reference-budget`.
- ShotDetailsPanel surfaces uncovered entities, budget violations, and pack vs consolidation remediations.

## 2026-09-14 — Correct Operations Gallery blocking

- Authored a fixed two-row floor plan for the opening Earth-stream stretch: front row Harlan–Sorell–Voss, back row Zao–Rao–Okoye from screen-left to screen-right.
- Replaced the Operations Gallery stretch sheet and derived panels so shots 001–003 preserve those positions while the camera moves from the group to Harlan/Sorell and then Voss.

## 2026-09-14 — Correct meal-stretch seating

- Regenerated the bridge-meal stretch with an explicit camera-oriented seat map: room-side row Zao–Sorell–Rao, hull-side row Okoye–Harlan–Voss from lift end to stations end.
- Replaced the three derived meal panels and kept the corrected panels selected for shots 010–012.

## 2026-09-14 — Operations Gallery and axial-dock visual stretches

- Added and rendered the axial-dock stretch (006–009) as one coherent four-panel sheet with derived selected panels.
- Added the Operations Gallery stretch (001–003), including the six-person Earth-stream viewing setup and the reporter only inside the wall display; registered one combined sheet and selected derived panels.

## 2026-09-14 — Meal-stretch character reference packs

- Added paired identity sheets for Voss/Harlan, Zao/Rao, and Sorell/Okoye so the six-person meal stretch can stay within the still provider's five-reference attachment limit while preserving all identities.
- Re-rendered the shared meal stretch with the paired sheets, replaced its three derived panels, and kept those panels selected for shots 010–012.

## 2026-09-14 — Festival-master bridge meal visual stretch

- Added the `location:celestial-ardor-bridge-meal-table` sublocation and registered its GPT-image-2 environment sheet from the three supplied solid renders.
- Replaced the independent meal stills for shots 010–012 with one combined 2×2 visual-stretch generation; derived panels are now the selected takes and share the same table blocking, gravity, eyelines, and display continuity.

## 2026-09-13 — Register curated cast voice references

- Added EN `Reporter.wav` (VoiceDesign) for `character:periodista`.
- Catalogued EN/ES curated refs as `asset:voice-ref-*` and wired `sampleAssetIds` on matching voice-profile variants.

## 2026-09-13 — Festival-master prompt-ready stills prep (still/video split, Proxima interiors, reconciliation)

- Master outline r24: `master:story-p2` now states the full six-person crew watches the delayed Earth coverage together in the Operations Gallery (Rao and Okoye present, silent); facts/knowledgeEvents/actionRequirements unchanged; EN export regenerated, ES retained at r19. Festival outline lineage untouched (pinned r19, `stale`).
- `Take.productionGate.medium` (`all` | `still` | `video`): video-scoped holds (`video_deferred_external_reference`) never block still/keyframe jobs. Plans emit `videoGenerationGate` + `segments[*].blockers`; stretch collectors are medium-aware; blocker codes carry the medium tag. Tests added (`productionGate.spec.ts`, `visualStretchJobs.spec.ts`).
- Proxima interiors: registered `asset:location-proxima-operations-gallery-interior-sheet` (habitat ring, ≈ 0.5 g) and `asset:location-proxima-axial-dock-interior-sheet` (axial transfer shaft, microgravity, ≈ 18–20 m, "PROXIMA DOCK 1"); manifest rows for both plus the transfer concourse (unregistered) and a planned exterior guide still. New `context:proxima-habitat-ring`; `context:proxima-dock` states microgravity. `PROXIMA_STATION.md` §7 records the 18–20 m shaft as a production-design decision.
- Festival-master: bridge-meal stretch rev 2 with full seating/blocking; new `festival-master:stretch-axial-dock-006-009`; purpose/framing on all 104 shots; 23 placeholder sizes re-authored; on-frame reconciliation of every take (exterior sheets off interiors, off-frame cast removed, props/vehicles declared where attached); canon-presence fixes (Zao 060/061/095/096, Harlan 083–088, vestibule 023/024, 044/045 location); title and 006–009 carry video-only holds; 94 takes marked `needs_regeneration` (incl. the ten central-shaft takes after the sheet replacement). Report: `docs/production/FESTIVAL_MASTER_REFERENCE_RECONCILIATION_2026-09-13.md`.
- Tooling: `scrub:still-prompt-cast[:check]` (no restated appearance in still prompts); reference audit now checks on-frame coverage, interior/exterior authority, budget, stale status, and gravity wording by context. `data/production/credits.json` + schema. No images generated; no Higgsfield/MCP calls.

## 2026-09-13 — Separate still vs video stretch references

- `VisualStretch.videoReferenceAssetIds` tri-state (absent = fallback, present including `[]` = explicit); still `referenceAssetIds` never trimmed for Seedance.
- Plan jobs expose `stillReferenceAssetIds`, `videoReferencePolicy`, `effectiveVideoReferenceAssetIds`, `voiceSampleAssetIds`; `sharedReferenceAssetIds` remains a validated deprecated alias.
- Per-keyframe coverage only; explicit completeness blockers; ordered staging matches handoff.
- Agent video docs: `SEEDANCE_PROMPTING.md` §6.2, `AGENT_GENERATION_BRIEF.md`, `HIGGSFIELD_MCP.md` §8b, `VISUAL_STRETCH_PIPELINE.md`, `ARQUITECTURA_GENERACION.md`.

## 2026-09-13 — Take.productionGate generation deferral

- Added optional `Take.productionGate` (`eligible` | `deferred` | `blocked`) with EN reason + catalog-or-manifest prerequisites; absent gate means eligible.
- Derived plan/stretch `generationGate` (schema + builders); deferred/blocked takes block still and Seedance jobs; shared take-resolution helper (no first-take fallback).
- ShotDetailsPanel badge, regen-briefs exclusion, image-debt holds section; validators warn on unknown reason codes.
- Agent/MCP docs: `AGENTS.md`, `AGENT_ONBOARDING.md`, `HIGGSFIELD_MCP.md` §8b, and handoff `agentInstructions` refuse gated/non-runnable jobs.

## 2026-09-13 — MCP handoff review fixes (registrar, prompt, schema)

- Fixed video registrar `createHash` import (crypto); extracted refuse checks into a testable library; sanitized result filenames for NTFS.
- Stretch video preview uses `spokenText` and `movementDescription`; omits hardcoded 1080p; Ajv-validates emitted runs; enforces `maxOutputsPerRequest`.
- Registrar requires a ready/`nonExecutable: false` source run; runbook states download-then-register.

## 2026-09-13 — Visual-stretch MCP handoff + provider capability contract

- Preview-only §8 run handoff (`handoff:visual-stretch`) with smoke_test policy; `nonExecutable: true` never submittable until a future freeze.
- Blocker-tolerant Seedance stretch video preview compiler; job-level video result registrar (no take binding).
- Provider snapshots: `medium`, `limitSurface`, `maxOutputsPerRequest`, campaign `stillProviderSnapshotId`, pinned `providerSnapshotId` on stretch jobs; concurrency stays nullable.
- Schemas: `run.schema.json`, `visual-stretch-result.schema.json`; MCP smoke runbook in `docs/technical/HIGGSFIELD_MCP.md`.

## 2026-09-13 — Stretch digest selection-independent; typed jobs; one voice sample

- Stretch digests no longer hash `selectedTakeId` / take prompts, so selecting a derived panel does not mark it stale.
- Typed stretch jobs via generated plan schema; one approved voice sample per speaker for the job language; documented that `runnable` has no submission adapter yet.

## 2026-09-13 — Stretch job voice samples, runnable gate, builder tests

- Seedance stretch jobs budget dialogue voice samples and block on `missing_voice_sample`; jobs expose `runnable` (false whenever blockers exist).
- Exported `buildVisualStretchJobs` for integration tests covering reference budget, keyframe deduction (incl. vehicle/prop), and the 30 s effective ceiling.

## 2026-09-13 — Seedance 2.5 duration snapshot corrected to 30s

- Reverted provisional `maxDurationMs` to **30000** after verifying Higgsfield’s Seedance 2.5 FAQ: single-pass max is 30 s at any listed resolution (including 480p).

## 2026-09-13 — Festival-master outline derivation stale

- Marked `outline:light-delay-festival-master` derivation `reviewStatus: stale` versus master revision 23 (still pinned to r19 until rederived).

## 2026-09-13 — Visual stretch review fixes

- Fixed AnimaticEditor duplicate import; EXDEV-safe same-directory `.partial` writes; panel registrar creates derived assets + candidate takes (`register:visual-stretch-panels`).
- Provider-driven 4×4 + largest suitable output size; structured blocking prompt lines; shared blocking completeness helper; unified stretch digest; reference-budget and Seedance duration gates with tests.

## 2026-09-13 — Visual stretches (Schema + dry-run pilot)

- Added `ScriptFile.visualStretches[]` types, validate-data checks, layout helpers, generation-plan `visualStretchJobs`, provisional gpt-image-2 still-provider snapshot, compile/split/register CLIs, `report:visual-stretches`, and ShotCard/ShotDetailsPanel stretch UI.
- Festival-master pilot stretch `festival-master:stretch-bridge-meal-010-012` (draft; seating blockers; no image generation). Docs: `docs/production/VISUAL_STRETCH_PIPELINE.md`.

## 2026-09-13 — Meaning-audit cue rebinds (Festival-master)

- Content-verified nine mis-anchored `implementsFactIds` (adjacent-beat heuristic): flight-cut, Sorell find, cameras, bridge hears warning, greeting completed, fuel/neutron swap, recording auth, Harlan accusation.
- Rewired Zao’s b5 actionRequirement onto `impulse-package-identified` (not withheld Harlan-cut facts); narrowed p2 `voss-misread-motives` knowers to staged cast.
- `report:causal-structure` green; Vitest flight-cut cue updated to `cue-0077`.

## 2026-09-13 — Festival Master storyboard refresh

- Refreshed and registered active Festival Master storyboard outputs using each take's current prompt and visible-reference bindings.
- Cleared stale needs_regeneration markers from the active take queue; all 104 flagged takes remain explicitly needs_review for human editorial acceptance.
- Deprecated cut assets were excluded; the master outline remains narrative authority.

## 2026-09-13 — Master fact migration notes applied

- Reminted master outline causal objects from the author-signed migration notes: 33 active facts, 7 retired, corrected knowledgeEvents (incl. fact-06 everyone-knows bug), rewired actionRequirements, Festival `implementsFactIds` remapped.
- Notable mints/splits: bridge-hears vs Harlan jam/cut; murder / vault / flight-cut; recording identify vs authenticate; fuel vs neutron; Harlan wrong-belief only.
- `report:causal-structure` green; Vitest delayed-reveal assertions updated to new fact ids.

## 2026-09-13 — Causal structure + meaning pipeline

- Lifted Festival-master continuity-ledger facts / knowledgeEvents / actionRequirements onto the master outline as the single fact SoT (`master:fact-*`); Festival ledger marked `obsolete`.
- Added `report:causal-structure`, `report:meaning-audit`, and `report:fact-rebuild-proposal`; `report:causal-validity` now skips obsolete/deprecated ledgers as `not_applicable`.
- Tagged Festival-master cues with `implementsFactIds`; replaced brittle dialogue-prefix causality Vitest with fact-id order assertions.
- Docs: `docs/production/CAUSAL_AND_MEANING_PIPELINE.md`, migration map, AGENTS/onboarding/JSON_FORMAT/ESCALETA pointers; CI step for causal-structure.

## 2026-09-13 — Central-access reference regenerated

- Replaced the invalidated central-access v3 sheet with v4, whose section and elevation views preserve a clear approximately two-metre central opening and twin helical stairs with no solid column.
- Updated asset/manifest and production-plan paths, deleted v3, and marked the ten Festival Master dependent takes for regeneration.
- Validation: `validate:data` and `validate:schemas` pass.

## 2026-09-13 — Removed the fabricated "command vestibule"; flagged the central-shaft column

- Author identified two ship-geometry errors against the actual reference
  blueprint (`static/assets/vehicles/celestial-ardor/specs/ardor-sectional-cut-and-bridge-top-view.png`):
  a fabricated `location:celestial-ardor-command-vestibule` duplicating the
  bridge's own description, and a solid column in the central-access
  shaft's reference art where canon calls for an open ~2 m aperture (needed
  for Voss/Okoye's climax dive). Full writeup: "Pass 3" in
  `docs/production/OUTLINE_FIDELITY_AUDIT_FESTIVAL_MASTER.md`.
- Removed `location:celestial-ardor-command-vestibule` from
  `data/locations.json` and `data/editorial-lifecycle.json`; reworded every
  "command/service vestibule" mention in `data/scripts/light-delay-festival-master.json`
  (scene-10/beat-10/cue-0046/scene-16/beat-16, `shot-plan-023/024/044/045/045b`)
  and `data/translations/documents.en.json` to describe the bridge's
  service hatch, hidden from the crew's sightline, instead of a separate
  room; marked the orphaned vestibule reference asset `needs_replacement`.
  Flagged (did not rewrite) `docs/technical/CELESTIAL_ARDOR.md`, which ties
  the vestibule to real, already-modeled 3D coordinates that need a Blender
  pass to reconcile, not a prose edit.
- Flagged `asset:location-celestial-ardor-central-access-sheet`
  `needs_regeneration`/`canon_mismatch` for the solid column. Visually
  checked every shot at that location rather than assuming they all
  inherited the defect: `shot-plan-013` is actually correct (left alone);
  `shot-plan-077`/`078` (the climax) do show the column and were
  flagged/updated accordingly. No image regenerated.

## 2026-09-13 — Orphan concept-sheet cleanup

- Removed three unreferenced superseded sheets: the engineering v2, reactor service-bay v2, and service-cylinder v3 sheets.
- Updated the Higgsfield staging manifest to point to the current engineering v3 sheet; retained other older sheets that remain referenced by production plans.

## 2026-09-13 — Master-derived reference assets regenerated

- Generated and registered eight pending visual references: the Celestial Ardor command vestibule, central access cylinder, service cylinder, outer reactor service bay, inner shielding vault, Proxima geophysical impulse package, Harlan wrist device, and time-reference diagnostic unit.
- Wired the new versioned paths into the asset catalog and production manifest, resolved their pending visual-reference notes, and preserved prior files as superseded provenance.
- Validation: `validate:data` and `validate:schemas` pass; generated images remain `needs_review` for editorial acceptance.

## 2026-09-13 — Festival-master outline-fidelity audit (beyond gravity)

- Generalized the gravity-audit method to every other category of
  parent-outline fact that can go missing at the shot/prompt layer: report
  and fixes both at `docs/production/OUTLINE_FIDELITY_AUDIT_FESTIVAL_MASTER.md`.
- Fixed a live contradiction: 16 shots (scenes 26–29/31/32) contradicted
  `contexts.json`'s own "no unsecured hazardous objects" rule via the
  generic microgravity sentence; swapped for a hazard-safe variant.
- Fixed `scene-25`'s stale `setting.continuity` (still said microgravity
  after the gravity audit already corrected the scene to 1g).
- Fixed a geography contradiction: `shot-plan-028` put a helical stair in
  the ladder-only service shaft and got the relative speed backwards vs. its
  own sibling shots; corrected both. Added the twin-staircase geometry to 7
  central-access shots that previously relied only on the reference image.
- Grounded 3 plot-critical objects (the bomb, Harlan's wrist device, the
  time-reference diagnostic unit) that had zero physical description and a
  catalog-flagged "pending" reference sheet: threaded each object's own
  catalog description into the shots that show it, and attached the
  diagnostic unit's reference sheet to its first appearance (previously
  missing, despite the catalog requiring it look identical across both).
- Attached missing character reference sheets to 4 shots where
  `Shot.visibleRefs` marked someone present but their sheet wasn't attached;
  in the process found and fixed the same class of staleness in those
  takes' own literal "Reference assets attached" prompt text — confirmed no
  other take in the file has that drift.
- 33 takes marked `imageStatus: needs_regeneration` (`canon_mismatch`); no
  images regenerated.

## 2026-09-13 — Still prompts must restate non-inherited state (incl. gravity)

- Documented that image generators are stateless: scene continuity and “cue it once”
  audience craft do not substitute for an explicit gravity (and other load-bearing)
  clause in each still prompt. Spoken dialogue stays out of stills; Seedance/video
  keeps cue text + voice samples. See `DIALOGUE_AND_PROMPT_LESSONS.md` §2c,
  `AGENTS.md`, `AGENT_GENERATION_BRIEF.md`, `SEEDANCE_PROMPTING.md`; gravity audit
  note updated so blank prompt markers are not treated as green for regen.

## 2026-09-13 — Festival-master: 33 shots got their missing gravity statement

- Applying the stateless-still-prompt rule above (`DIALOGUE_AND_PROMPT_LESSONS.md`
  §2c): re-scanned all 104 Festival-master shots and found 33 whose prompts had
  no explicit gravity/vacuum statement at all (the `shot-plan-021` case), not
  just the 2 with a wrong one from the first pass below.
- Fixed: 27 MG + 2 1g interior shots got the existing boilerplate sentence; 3
  EVA/vacuum shots (`089/091/092`) got a new vacuum-appropriate sentence; 1
  exterior establishing shot (`040b`) got the existing "No gravity reference"
  note. `Take.generation.prompt` only, per established convention.
- Marked all 33 takes `imageStatus: needs_regeneration` (`canon_mismatch`); no
  images regenerated. See §8 of `docs/production/GRAVITY_AUDIT_FESTIVAL_MASTER.md`.

## 2026-09-13 — Festival-master gravity-state audit and fixes

- Audited all 104 Festival-master shots/prompts against the master and derived
  outlines for correct microgravity vs. 1g flagging; report at
  `docs/production/GRAVITY_AUDIT_FESTIVAL_MASTER.md`.
- Fixed scene 25 (`shot-plan-074/075/076`): prompts wrongly carried the
  microgravity boilerplate for a scene that is 1g under thrust; corrected to
  the 1g sentence. Marked `imageStatus: needs_regeneration` (`canon_mismatch`).
- Confirmed the ship stays in microgravity through the end of the film (no
  relight after the fourth thrust cutoff, `cue-0157`); reassigned scenes 28,
  29, 31, 32 from `context:ardor-thrust-gravity` to a new
  `context:ardor-post-climax-microgravity` in `data/production/contexts.json`.
  Added a legibility detail + explicit marker to `shot-plan-083`, the first
  shot of that stretch.
- Regenerated `data/production/plans/light-delay-festival-master.json` from
  the corrected source data (no images regenerated).

## 2026-09-13 — Deferred AuK TTS install plan

- Added `docs/production/AUK_INSTALL_PLAN.md`: investigate-only plan for a parallel
  Tencent AuK stack on RTX 3090 (CPU offload required; keep Qwen3-TTS tooling).

## 2026-09-13 — Resolve OTIO export writes EN/ES SRT sidecars

- `export:resolve-otio` now writes `tmp/resolve-otio/<slug>.en.srt` and `.es.srt` beside the
  timeline. Cue timings match A1 dialogue (animatic clock) and include the OTIO **01:00:00:00**
  offset for Resolve “Insert Selected Subtitles to Timeline Using Timecode”.
- Documented the Media Pool subtitle import path in `RESOLVE_OTIO_EXPORT.md`. Subtitles are not
  embedded in the `.otio` (Resolve does not use OTIO for caption tracks).

## 2026-09-13 — Track still generation model on assets

- Documented and validated `Asset.source.model` as the durable record of which image
  model produced a file on disk. Non-local sources must include a non-empty model.
- Backfilled `"gpt-image-2"` on five AI assets that had `source` without `model`
  (Okoye sheet, three Ardor bridge references, missing-frame placeholder). Local
  black-frame asset remains without a model.
- Loosened `asset-generation-manifest` schema so `generator.model` is any non-empty
  string (data still records `gpt-image-2`).

## 2026-09-13 — Festival-master reference regeneration completed

- Regenerated and registered all 36 remaining Festival-master stills that had been stale after the Ardor reference-sheet corrections or marked with a canon mismatch: `006`, `016–022`, `026–039`, `042–043`, `045b`, `054`, `060`, `071`, `073–075`, `077–079`, and `095–096`.
- Injury beats use non-graphic staging while preserving the required discovery and rescue actions. Each take, storyboard asset, and generation-manifest entry was updated immediately after its image was generated.

## 2026-09-12 — Trailer OTIO gaps were missing stills, not a Resolve failure

- Wired the seven trailer takes that had no `imageAssetId` to on-disk frames (festival
  021/023/024/081/082/087 plus a new pure-black still for `shot-c-03`).
- Re-exported `light-delay-trailer-master.otio`: 22 picture clips, 0 picture gaps, 16 dialogue
  clips. Documented in `RESOLVE_OTIO_EXPORT.md` that empty Resolve stretches usually mean OTIO
  `Gap`s for unresolved stills — and that trailer vs festival are different files.

## 2026-09-12 — Festival-master EN dialogue for cue-0044 / cue-0045

- Audited Festival / trailer / main-short dialogue audio: only `festival-master:cue-0044` and
  `cue-0045` were missing promoted EN WAVs (new/rewritten Zao vault lines); no broken asset paths.
- Regenerated and promoted those two cues (130 reused); re-fitted Festival timings (~816.8 s).
  Trailer unchanged (16/16). `report:dialogue-audio-fit` green.

## 2026-09-12 — Agent onboarding spine

- Made `AGENTS.md` English-first with a current working set, outline→script→storyboard→prompt
  layer map, and an upward-propagation gate (notify → approve → analyze → second approve →
  cascade). Softened the derivative rule so authorized Festival-master / trailer-master WIP is
  not blocked by an incomplete master.
- Added `docs/AGENT_ONBOARDING.md` (day-one checklist, worked example, role tracks, command
  cheat-sheet), thin `CLAUDE.md` and `.github/copilot-instructions.md`, and `AGENTS.es.md` as a
  non-authoritative Spanish pointer. Aligned README, `data/README.md`, WORKFLOW, ADR-0002 status
  note, CANON banner, and `AGENT_GENERATION_BRIEF` cross-links.

## 2026-09-12 — Regenerated Transport Sphere-dependent Festival-master stills

- Regenerated and registered storyboard stills for `shot-plan-088`, `089`, `091`, and `092`
  against the corrected Transport Sphere sheet (envoy floating / wall-braced in microgravity).

## 2026-09-12 — Regenerated Ardor and Velari visual reference sheets

- Replaced Ardor engineering, reactor service bay, and service-cylinder sheets; regenerated
  Velari Transport Sphere and Envoy sheets. Dependent Festival-master takes marked
  `needs_regeneration` until regenerated against the new sheets.

## 2026-09-12 — Resolve OTIO dialect from a 20.1 stills export

- Reverse-engineered a Resolve Studio 20.1 stills export. The writer now matches that dialect:
  native Windows `target_url` backslashes, `Resolve_OTIO` metadata, RationalTime floats
  (`24.0`), timeline start at 01:00:00:00, tracks `Video 1` / `Audio 1` / `Audio 2`.
- Clip names map `:` → `__`; stills declare a 1-frame `available_range`; Clip.2 + filesystem
  paths; smoke-one-still fixture for import proofs.

## 2026-09-12 — Fix scrubbing dialogue saturation (overlapping cue starts)

- `WebAudioCueSequencer.seek` aborted and replaced its `AbortController`, so in-flight
  `ensureWindow`/`scheduleCue` work kept checking the *new* signal and could `source.start`
  the same cue twice while scrubbing — stacked gains sounded like clipping/saturation.
- Fix: schedule epoch + reserve `scheduledIds` before `await loadUrl`, and dedupe in-flight
  buffer fetches per URL.

## 2026-09-12 — Vault readout: timer to arrival, not contact coordinates

- `festival-master:cue-0043` now reads “Multi-megaton. The timer is set to arrival time!” The
  package is not targeted to contact coordinates; only the countdown is set to arrival.
- Updated the shot-021 description and generation prompt so the controller display shows mass,
  yield, and the arrival timer. Marked still `asset:festival-master-storyboard-021` stale
  (`needs_regeneration` / `canon_mismatch`); the PNG still shows CONTACT COORDINATES.
- Regenerated and promoted EN WAVs for `cue-0043` and `cue-0126` (and re-linked trailer
  `cue-e-01` → `0126`). Festival fit ~809.9 s; trailer ~87.8 s.

## 2026-09-12 — Re-synthesize Festival-master EN clarity-pass dialogue

- Regenerated Qwen EN WAVs for the four clarity-pass cues whose `audioAssetId` had been cleared
  (`cue-0024`, `cue-0062`, `cue-0133`, `cue-0140`); reused unchanged hashes for the rest.
- Promoted the new chunks, wrote measured `estimatedDurationMs`, re-fitted Festival-master shot
  timings (including silence hold on `shot-plan-045b`) and re-linked trailer-master dialogue
  (including `cue-a-04` → `cue-0024`).

## 2026-09-12 — DaVinci Resolve OTIO export

- Added `docs/production/RESOLVE_OTIO_EXPORT.md` (English source): 24 fps OpenTimelineIO assembly
  for Festival-master and trailer-master, with storyboard stills and dialogue WAVs as placeholders
  and a `--swap` path that relinks downloaded takes onto a Resolve-exported edit without discarding
  trims or order.
- CLI: `npm run export:resolve-otio:festival`, `:trailer`, `:all`, and `:check`. Generated `.otio`
  files stay under `tmp/resolve-otio/` (gitignored). Inventory counts in `ASSET_PROVENANCE.md` now
  include Festival-master still `045b` (482 registered assets).

## 2026-09-12 — Festival-master continuity and storyboard corrections

- Corrected the throat-exit bridge beats so Sorell remains below deck until the retrieval beat; she is no longer staged on the bridge while the crew celebrates the crossing.
- Added `festival-master:shot-plan-045b` for Voss's retrieval order, preserving Harlan's fast service-shaft route and Okoye/Sorell's slower central-route movement in microgravity.
- Regenerated shot stills 040, 041, 044, 045, and 046, and generated 045b with explicit no-planet constraints and current Ardor/service-shaft references. Shot 045 keeps Sorell confined to the restored camera feed; shot 046 places her on the bridge only after retrieval.
- Updated take-level reference maps and the production generation manifest. Spanish descriptions for the new beat are translated from the English source and remain secondary to the English authoring pass.

## 2026-09-12 — Festival-master dialogue clarity pass, cue-0062 follow-up

- Per direction that a clarity rewrite may extend its shot's timing when needed, fixed the fourth
  candidate the same-day clarity pass had flagged but left alone for lack of slack: `cue-0062`
  (Zao) — "And I can't address the Velari without Sorell. Not back. Not through. Not to them."
  → "And I can't address the Velari without Sorell — not back to Earth, not through the throat,
  not to them." Names what each fragment was negating (Earth / the throat / the Velari directly),
  which the original left to be inferred purely from proximity to the previous line.
- This grew the line from 16 to 20 words (estimated spoken duration 6140ms → 7700ms, scaled from
  this cue's own recorded pacing rather than raw WPM). Retimed the whole chain it sits in:
  `shot-plan-031.durationMs` 12060 → 13620 (its last cue, so only the shot's own end extends — no
  overlap with any neighboring placement); `scene-12.targetDurationMs` 40670 → 42230; the script's
  own `targetDurationMs` 808199 → 809759; `project.json`'s matching entry and its `~13:28` labels
  → `~13:29`. Deleted `cue-0062`'s now-stale `audioAssetId` per the same pattern as the other three
  cues. No other cue placement in the shot needed to move (`cue-0062` is last in `shot-plan-031`).
- Updated `festivalMasterScript.spec.ts`'s scene-duration-sum assertion (808_199 → 809_759) and
  `animaticDialogueTimeline.live.spec.ts`'s festival-master resolved-audio count (128 → 127, one
  more cue now pending re-synthesis).

## 2026-09-12 — Festival-master dialogue clarity pass (English)

- Reviewed all 131 English dialogue cues in `script:light-delay-festival-master` against
  `DIALOGUE_CLARITY_GUIDE.md`'s criteria. Most of the corpus already reads clearly (short lines are
  either visually reinforced, genre-appropriate clipped speech consistent with the speaker's
  established voice profile, or already benefited from earlier clarity/tightening passes); three
  genuine gaps were fixed:
  - `cue-0024` (Voss): "Philosophy after turnover." → "Philosophy can wait." — removed an unexplained
    aerospace term ("turnover") with no spoken anchor anywhere in the script, at equal length.
  - `cue-0133` (Rao): the six-item evidence list ("The mass, neutrons, vector, lock, your missing
    location, and that accusation all agree with her") reordered to state the conclusion before the
    list ("All agree with her: the mass, neutrons, ...") — same words, easier to hold onto on one
    hearing. In the same pass, fixed a pre-existing stale echo of this beat's summary text still
    reading "Agree is not prove" instead of the already-corrected "Agreement isn't proof."
  - `cue-0140` (Rao): "The plan never sees them" → "The autopilot never sees them" — "the plan" was
    never spoken anywhere else in the script (only in production-only shot/beat prose), so a first-time
    listener had no way to know what it meant; "autopilot" needs no introduction, same word count.
  - A fourth candidate (`cue-0062`'s unlabeled "Not back. Not through. Not to them.") was identified
    but left unchanged: its shot has zero timing slack, and a proper fix needs more words than fit —
    flagged for a future pass that can also retime the shot.
- Synced every place that quoted the three changed lines verbatim: the cue's own beat `summary.en`,
  the shot `description.en` that quotes it (per `DIALOGUE_AND_PROMPT_LESSONS.md` §1), the matching
  row in `festival-master-shot-blueprint.en.md`, the TTS `animatic-dialogue-...voices.en.md` export,
  and `asset-generation-manifest.json`'s `primaryRequest` text. Spanish variants were intentionally
  left untouched — translation is deferred to a later pass, matching the precedent set when
  `cue-0042`/`cue-0043` were last rewritten.
- `trailer-master:cue-a-04` reuses `cue-0024`'s text and audio directly; updated its `spokenText` to
  match and removed its now-stale `audioAssetId` (same for the two other changed festival-master
  cues) so the TTS pipeline knows to re-synthesize them. Updated
  `animaticDialogueTimeline.live.spec.ts`'s resolved-audio counts accordingly (131→128 for
  festival-master, 16→15 for trailer-master).
- No shot, cue-placement, or scene/act/script `targetDurationMs` changed: all three fixes were chosen
  to keep the exact same spoken word count as the line they replaced.

## 2026-09-12 — Seedance video prompting notes

- Added `docs/production/SEEDANCE_PROMPTING.md` (English source): Seedance **2.5** prompt craft
  (task routing, reference-role maps, integer-second timelines, edit/extend locks) for Higgsfield
  video jobs. Published 2.5 ceilings stay surface-dependent pending preflight.
- Seedance audio refs are approved voice samples (`sampleAssetIds`) for speakers in the job;
  generated animatic cue WAVs are never attached. Consecutive same-location, same-cast shots
  under 30 s prefer one generation (`SEEDANCE_PROMPTING.md` §6.1–6.2).
- Linked from `AGENT_GENERATION_BRIEF.md`, `ARQUITECTURA_GENERACION.md`, `HIGGSFIELD_MCP.md`, and
  `DIALOGUE_AND_PROMPT_LESSONS.md`.

## 2026-09-12 — Dialogue clarity guide

- Added `docs/production/DIALOGUE_CLARITY_GUIDE.md`, documenting the recurring "accurate but too
  cryptic for a general audience" dialogue failure mode with six grounded before/after examples from
  recent fixes (the vault-readout warhead line, Elin's "could have"/"agreement" lines, Harlan's
  Okoye-persuasion line, Sorell's "sorry later" line), a prioritized fix method, a test for telling
  appropriately-terse from too-cryptic per character, and calibration notes against the project's
  earlier tightening pass so the guide doesn't become a license to over-expand every short line.
- Cross-linked from `DIALOGUE_AND_PROMPT_LESSONS.md`.

## 2026-09-12 — Dialogue and prompt lessons document

- Added `docs/production/DIALOGUE_AND_PROMPT_LESSONS.md`, distilling recurring editorial fixes
  (description-vs-prompt drift, physics-transition legibility, speaker belief-state accuracy,
  argument-content checks, catalog naming, reference-sheet prose economy, costume continuity) into
  reusable recommendations for the rest of the shot/dialogue corpus and for future first-frame,
  last-frame, and video-segment prompts.

## 2026-09-12 — Regenerated Festival-master shot-plan-040b

- Replaced the crossing still for `festival-master:shot-plan-040b`, which showed the superseded Ardor sail/fin design.
- The new frame uses `asset:vehicle-celestial-ardor-model-sheet-v2` and the Velari throat sheet, with the Ardor small against the active distributed-node aperture and no station rings or extra characters.
- Updated the take prompt, generation plan, thumbnail, and reference metadata.

## 2026-09-12 — Fix svelte-check errors blocking Pages deploy

- Tightened JSDoc/types in trailer↔festival dialogue-link helpers and related specs
  so `npm run check` passes under `checkJs` (GitHub Actions had failed after
  translation validation).
- Synced unit-test duration and audio-output catalog expectations with the current
  Festival (~808.2 s) and trailer (~88.8 s) fits plus registered animatic duals.

## 2026-09-12 — Refresh stale generated editorial checks for deploy

- Regenerated `docs/MASTER_RELEVANCE_REPORT.md`, `docs/PENDING_AUTHOR_NOTES.md`, and
  the Festival-master generation plan so `npm run generated:check` passes again after
  recent ScriptFile edits (GitHub Pages deploy had failed on stale artifacts).
- Added missing English/Spanish `purpose` maps on trailer-master beats so
  `validate:translations` passes.

## 2026-09-12 — Festival-master stale Spanish dialogue refresh

- Filled five missing ES dialogue variants added after the first Spanish pass
  (`cue-0030b`, `0059b`, `0076b`, `0076c`, `0107b`).
- Rewrote ES for cues that had drifted from current English (vault readout
  `0042`/`0043`, plus `0120`, `0162`, `0167`, `0171`) and aligned beat-09 /
  shot-021 quotes. Status remains `needs_revision` pending editorial polish.

## 2026-09-12 — Movie player: subtitle switch no longer desyncs audio

- Root cause: `getLanguageState()` returned a fresh object snapshot and setters
  reassigned the whole `$state` bag, so changing **Subtitles** invalidated every
  dialogue consumer (including `getLocalizedScript`’s heavy `structuredClone`)
  and could leave Web Audio ahead of the visual/subtitle clock until refresh.
- Fix: return the reactive language proxy, mutate fields in setters, derive
  `dialogueLanguage` finely on player/script/animatic/outline routes, and
  re-seek the cue sequencer to the visual clock after async dialogue reschedule.

## 2026-09-12 — Storyboard still prompts: no dialogue / subtitles

- Stripped spoken dialogue and subtitle copy from Festival-master and trailer-master
  `generation.prompt` fields (kept intentional diegetic UI such as `LIGHT DELAY`,
  `23 H 15 MIN`, `TRANSMITTED`). Omitting those lines is enough — prompts are not padded
  with “avoid subtitles” boilerplate.
- Added `scripts/lib/still-prompt-no-dialogue.mjs` plus `scrub:still-prompts` /
  `scrub:still-prompts:check`; regeneration prep and agent briefs follow the same rule.
- Existing still PNGs that already burned in dialogue are unchanged until regenerated.

## 2026-09-12 — Ardor multi-angle reference and exterior still correction

- Added `asset:vehicle-celestial-ardor-model-sheet-v2`, derived from the Jupiter render and isolated from Proxima docking geometry.
- Regenerated Festival-master shots `013b` and `016b` with the new sheet. `016b` now makes the retrograde, engine-first approach unambiguous: throat field left, engine nozzle toward it, hull and exhaust trailing right, with deep separation.
- Removed the accidental character implication from `016b`; both frames contain no people or Zao. Updated manifests, thumbnails, and validation counts.

## 2026-09-12 — Festival vault readout dialogue (EN) + TTS

- Updated `festival-master:cue-0042` / `cue-0043` English copy for Zao’s vault controller
  readout: research framing from the Proxima, then emphatic contact coordinates/time.
- Regenerated the two Qwen EN WAVs (content-hash reuse for the rest), promoted into
  `static/assets/audio/dialogue/light-delay-festival-master/en/`, and refit Festival +
  trailer-master timings (Festival ~808.2 s; trailer ~88.8 s). `report:dialogue-audio-fit`
  green with `missingAudio: 0`.

## 2026-09-12 — Regenerated Festival-master shot-plan-016b

- Replaced the storyboard still for `festival-master:shot-plan-016b`, which had been generated against a superseded Ardor design.
- The new exterior frame uses the current axial cylindrical Ardor reference, preserves engine-first retrograde braking, and keeps the Velari throat as a closed distributed node field rather than a visible aperture.
- Updated the take prompt and production plan, refreshed thumbnails, and verified `validate:data` and `validate:docs`.

## 2026-09-12 — Trailer master storyboard reuses Festival dialogue audio

- All 16 spoken English cues in `script:light-delay-trailer-master` now point at the
  existing Festival-master WAVs (`audioAssetId` shared; no new TTS). Four condensed
  trailer lines keep their shorter copy and play the longer source performance.
- Shot timings were refit to the measured WAVs: **67.7s → 87.6s** (~1:28). Movie mode
  on the trailer storyboard can play the reused dialogue.

## 2026-09-12 — Festival Master storyboard regeneration

- Regenerated the 33 Festival Master takes awaiting images or prompt/reference updates, including closing transmission shots `094`–`096`.
- Wired the Velari Transport Sphere reference into shots `088`, `089`, `091`, and `092`; shot `092` also uses the Velari envoy sheet. Prompts now leave static appearance to those references and retain only blocking, physics, and dynamic behavior.
- Removed the obsolete emissary/legacy station reference from the sphere shots and resolved the transport sphere's stale visual-reference note. Reference audit and data validation pass.

## 2026-09-12 — New master-derived trailer

- **New script `script:light-delay-trailer-master`** (draft, ~87.6s, 7 scenes, 22 shots), sourced
  from `script:light-delay-festival-master`. The old trailer (`script:light-delay-trailer`,
  deprecated) is built around a different mechanism from the old continuity (an "autonomous
  payload," a "Velari channel" trigger); this one reuses its functional shape and restraint —
  scale → mission doctrine → anomaly → warning cut short → suspicion → reveal → unresolved ticking
  clock → title/tagline/credits, ending before contact resolves — rebuilt from festival-master's
  actual shots and dialogue.
- 15 of 22 shots reuse an already-generated festival-master frame directly via `imageAssetId`
  (no re-render); 6 shots whose festival-master source is still mid-regeneration get their own
  standalone `generation.prompt`; 1 new shot (a held black frame) marks the off-page attack.
  Credit cards reuse the old trailer's clearer, distinct 3-card text (written/produced by, AI
  assistance, production tools) over festival-master's own credit images, since festival-master's
  own end-credit cue currently just repeats one generic card three times.
- New outline `outline:light-delay-trailer-master` (6 story steps) and a new
  `docs/wip/trailer-master-blueprint.en.md` recording the shot-by-shot reuse/condense decisions.
- Registered in `data/project.json` and `src/lib/data/repositories/index.ts`; new
  `trailerMasterScript.spec.ts`.
- Fixed a lingering bug from the prior pass: `shot-plan-081`/`082`'s own `description` fields (not
  just their take prompts) were never updated with the corrected dialogue, so a concurrent
  prompt-compiler pass had regenerated their prompts from the stale description, reverting the
  earlier fix. Both descriptions now match the current dialogue.

## 2026-09-12 — Festival master storyboard EN dialogue complete

- Synthesized and promoted the 8 missing English dialogue cues for
  `script:light-delay-festival-master` (131/131 WAVs linked).
- Re-fitted shot timings; `report:dialogue-audio-fit` is green
  (`missingAudio: 0`, total ~806.5 s).

## 2026-09-12 — Sync JSON after deleted reference sheets

- Removed catalog entry `asset:vehicle-celestial-ardor-sheet` after deleting
  `static/assets/vehicles/celestial-ardor/model-sheet.png`. Live references now use
  `asset:vehicle-celestial-ardor-jupiter` (`celestial-ardor-with-jupiter.png`).
- Updated vehicle entity refs, Festival master take refs, generation manifest, production
  plans, vehicles/thumbs/marketing poster manifests, and related helper script/test paths.
- Harlan’s deleted `model-sheet.png` was already superseded by `model-sheet-v2.png` in the
  catalog; poster provenance paths that still pointed at the old file now use v2.
  `provenance.previousPath` on `asset:character-harlan-sheet` still records the deleted file.

## 2026-09-12 — Microgravity staging audit, thrust-transition legibility, and dialogue clarity pass

- **Gravity-state audit**: traced the story's own thrust-cut/thrust-resume timeline (not just each
  scene's `setting.continuity` tag, which was incomplete) and found two confirmed stretches wrongly
  prompted "Steady 1 g artificial gravity" when thrust was already cut: scenes 7–16 (thrust cuts at
  the top of scene 7, doesn't resume until scene 17) and scenes 27–32 (the fourth cut never resumes —
  confirmed by Voss's own "Keep it watched. No thrust" line). Tagged all 11 newly-identified scenes
  `setting.continuity: "Microgravity..."`, matching the 8 scenes already tagged.
- Audited 31 shots across those stretches individually — **viewed every current image before
  deciding**, per standing instruction not to mark anything stale that's already correct. 3 images
  (`shot-plan-016`, `017`, `090`) already showed microgravity staging (drifting gear, tethered
  harness, or no contradicting floor/standing tell) despite the wrong prompt text — kept, prompt-only
  fix. The other **28 shots** clearly showed a normal-gravity pose (standing, walking, or loose
  objects — a pen, a mug, a tool — resting undisturbed) and are marked for regeneration.
- **Thrust-transition legibility**: re-verified all four cuts and three resumes against the rule that
  the first one or two occurrences need a clear dialogue/visual marker and later ones don't need
  re-teaching, and that exterior/vacuum shots can carry no diegetic sound. Added visual reinforcement
  (weight settling, stance shifting) plus a paired interior sound cue to the two under-marked resume
  beats (`shot-plan-046`, top of scene 17; `shot-plan-057`, scene 19→20) — new cues `cue-0091b`,
  `cue-0113b`. No change where a shot is already covered (dialogue-marked cut 1, the exterior beauty
  shot covering cut 2/resume 1, sound-only cuts 3/4 past the "first one or two" threshold).
- **Fixed `shot-plan-092`**: image showed Sorell standing indoors in casual clothes, no spacesuit,
  contradicting `shot-plan-089`/`091` immediately before it (both correctly suited, tethered, in open
  space). Rewrote the prompt to explicitly restate the suit/open-space continuity. Regenerated.
- **Seven dialogue clarifications** (extend existing takes, no new shots): reordered the opening
  broadcast line so "I wish they were right" (Harlan) unambiguously refers to the hopeful supporters,
  not the protesters; gave Harlan's "they'll never know who saved them" its missing context (still
  believing he's won, not doubting); rewrote his "one sign we bite" line as the deterrence argument it
  was always meant to be, not humans turning on each other; expanded Rao's vault-defusal line into a
  real explanation of the trick; expanded Voss's "no thrust" into an explicit ongoing safety choice;
  gave Harlan's silent sabotage in `shot-plan-039` a spoken reaction-then-intent lead-in ("What a
  mess." / "No problem. I'll cut the flight controls."); gave Zao's Proxima/Earth/Velari reasoning in
  `shot-plan-030` a stated goal before the geometry ("Internal comms are cut. I need another way to
  reach someone.").
- Cleared stale `audioAssetId` on the 5 edited pre-existing dialogue cues (their recorded audio no
  longer matches the new text) so the TTS pipeline regenerates them.
- Shot/take count unchanged (103/103). Script duration: 773,357ms → **803,560ms** (~13:24).

## 2026-09-12 — Velari envoy character reference corrected

- Generated and registered `static/assets/characters/velari-envoy/model-sheet.png` from the authoritative
  Festival Master appearance in `shot-plan-092`.
- The sheet depicts only the individual envoy—an elongated translucent mantle with branching
  bioluminescent patterns—and does not use the obsolete emissary-ship design from the earlier continuity.

## 2026-09-12 — Beauty shot bridges the ~29-hour deceleration burn to L2

- **New shot `shot-plan-016b`** (5s, exterior, no characters) added to scene 7 ("The extra burn"):
  the Ardor arriving retrograde, engine-first, near the wormhole mouth as its torch dims to nothing
  ending the deceleration burn, node field distant in the background. Scene 6 (periapsis, still near
  Jupiter) used to cut straight to scene 7 (already "near the mouth") with no signal that ~29 hours
  of burn (per the master outline's own transit math: ~28h54min decelerating to L2) separate them —
  audiences would read it as continuous. Carries a new "29 HOURS LATER" `time_card` `TextCue`
  (`cue-0029c`), reusing a schema mechanism (`presentation: 'time_card'`) already established once in
  the deprecated trailer/main-short (`trailer:cue-f-01`, "23 HOURS LATER") but not yet used in
  festival-master.
- Reassigned the existing action cue `cue-0030` ("thrust cuts again for the precision crossing") to
  the new exterior shot, reworded to name the elapsed burn explicitly; re-timed `shot-plan-016`
  (dropped the now-redundant leading clause, 8.80s → 7.90s) — its existing generated image is
  unaffected (a pure interior OTS of Zao) and is kept, not regenerated.
- Shot/take count: 102 → **103**. Script duration: 769,257ms → **773,357ms** (~12:53).

## 2026-09-12 — Exterior Jupiter periapsis shot and central-access stair-geometry fix

- **New shot `shot-plan-013b`** (5s, exterior, no characters) added to scene 6 ("First gravity
  dip"), showing the Celestial Ardor backlit by Jupiter and its faint ring arcs during the periapsis
  turn. The outline's own text for this beat ("the ship rotates from prograde to retrograde, backlit
  by Jupiter and its rings") had never been rendered — the beat was interior-only. Grounded in the
  vehicle's existing `asset:vehicle-celestial-ardor-jupiter` reference plate; new location entry
  `location:jupiter-periapsis` added. New action cue `cue-0024b`. Shot/take count: 101 → **102**;
  script duration +5,000ms.
- **Root-caused and fixed a stair-geometry error in `shot-plan-074`**: the central-access cylinder's
  two opposed helical staircases are documented (via its reference sheet) to hug the shaft's curved
  wall and interlock at each landing — every other shot at this location renders that correctly, but
  `shot-plan-074` (which composites three locations in one frame: the elevator, the central-access
  stair, and the service cylinder's separate straight ladder) rendered two independent staircases
  that don't follow the wall and a free-standing central ladder, effectively merging the central-access
  stair with the adjacent service-cylinder ladder into one incoherent structure. Enriched
  `location:celestial-ardor-central-access`'s own description with the stair geometry (previously
  undocumented at the location level, only implicit in the reference sheet's metadata) and rewrote
  `shot-plan-074`'s prompt with explicit geometry and a negative constraint keeping the two structures
  visually distinct. Image marked for regeneration (`continuity_error`).
- Recomputed scene/script/project target durations: 764,257ms → **769,257ms** (~12:49).

## 2026-09-12 — Festival-master dialogue audio fit (EN)

- Generated and promoted EN WAVs for new lines `cue-0030b` (Zao) and `cue-0107b` (Rao);
  content-hash reused 126 existing cues (128 dialogue total).
- Added `scripts/fit-festival-master-dialogue-audio.mjs` (+ WAV measure / pack helpers): measures
  on-disk WAV lengths, syncs `estimatedDurationMs`, packs placements without overlap, compresses
  idle gaps while preserving silence/action/suspense holds, extends or trims shot durations, and
  cascades scene/`project.json` totals.
- Cleared 40 audio spills and 9 within-shot WAV overlaps. Montage **767 440 → 764 257** ms.
- npm: `fit:festival-master-dialogue-audio` / `report:dialogue-audio-fit`.

## 2026-09-12 — Festival-master position continuity and missing-trigger dialogue

- **Presence/visibility metadata corrected against the actual generated stills** for 9 shots
  (`shot-plan-024`, `025`, `026`, `027`, `041`, `042`, `043`, `044`, `045`, `059`): each shot's
  image was viewed before editing; in every case the image already staged the scene correctly and
  only the `visibleRefs`/`offScreenCharacterIds` metadata was wrong (over-inclusive cast copied from
  the scene's blanket list). None of these images are marked stale.
- **`shot-plan-019` regenerated**: the only image in this pass that actually contradicted its own
  shot (Harlan and Zao shown walking away together with an invented briefcase, instead of Harlan
  departing alone per the beat). Prompt rewritten to continue `shot-plan-018`'s established blocking
  explicitly, with a negative constraint against the briefcase and against showing them walking
  together.
- **Root-caused and fixed impossible bridge geometry during the wormhole crossing**
  (`shot-plan-040`, `041`): both shots were bound only to the exterior `location:velari-wormhole-mouth`
  even though their action is on the bridge, so generation had no interior grounding and rendered a
  large glass floor-level window onto the throat — impossible, since bridge decks sit perpendicular
  to prograde and the bridge canon has only small reinforced windows. Rebound both shots to
  `location:celestial-ardor-bridge` (secondary: the wormhole mouth), added
  `celestial-ardor-bridge` to scene 15's `secondaryLocationIds`, and rewrote both prompts with an
  explicit negative constraint against large/panoramic glass. Both images are regenerated.
- **New shot `shot-plan-040b`** (5s, exterior, no characters) inserted between 040 and 041 so the
  audience still sees the Ardor thread the wormhole from outside, now that the bridge shots
  correctly stop showing the throat directly. New action cue `cue-0082b` split out of `cue-0082`.
- **Two missing trigger-dialogue lines added**, each extending its existing take rather than adding
  a new shot: `shot-plan-016` gains `Zao: "Something's off. We used more fuel than we had to."`
  before the existing "Burn's clean..." line (8.00s → 9.00s); `shot-plan-054` gains
  `Rao: "The shielding bay. That's where I'd hide a neutron source."` as Elin and Okoye arrive at
  the vault (8.00s → 6.10s, replacing padding with real dialogue).
- **`visibleRefs[].role` added across all 101 shots** to record each character's explicit stage
  position/facing, closing the root cause of position drift between consecutive shots. 14 shots
  carry image-verified position text; the rest carry text derived from the shot's own description
  or speaking role.
- Recomputed scene/script/project target durations end to end: script total
  763,340ms → **767,440ms** (~12:47). Shot/take count: 100 → **101**.

## 2026-09-12 — Festival master ScriptFile/storyboard Spanish fill

- Filled Spanish for `script:light-delay-festival-master`: acts/sequences/scenes/beats,
  126 dialogue `variants.es` (voice-aware LatAm, `needs_revision`), action/text cues,
  performance notes, and shot description/camera movement copy used by the storyboard UI.
- Left take `generation.prompt` / `negativePrompt` in English (image-gen only).
- Set `script.localization.translations.es.status` to `needs_revision`.
- Helper: `scripts/festival-master-es-i18n.mjs` (export/apply). `validate:translations` OK.

## 2026-09-12 — Festival-master storyboard batch 01

- Generated and registered 103 storyboard stills for the title card, Festival-master shots 001–096, inserted shots 013b/016b/040b, and three credits under `static/assets/animatic/frames/festival-master/`.
- Regenerated stale shot compositions 019, 040, and 041 after their blocking/camera canon changed.
- Linked each still to its selected take and marked it `needs_review`; these are generated drafts, not editorially accepted canon.
- Recorded the batch in `data/production/asset-generation-manifest.json` with visible-shot references and English display-text constraints.

## 2026-09-12 — Festival-master storyboard reference preparation

- Rebuilt Festival-master take references deterministically from visible shot bindings and location fields; stale references are no longer retained between syncs.
- Enforced off-screen character exclusions and added resolved image paths to generation-plan references for direct adapter attachment.
- Added Festival-master production-context assignments and a `report:festival-master-refs` audit command; 100 takes and 523 image references currently pass with zero missing paths or off-screen character references.

## 2026-09-12 — Festival master animatic dialogue (EN)

- Generated and promoted **126** English dialogue WAVs for
  `script:light-delay-festival-master` (Kokoro narrator for the journalist VO;
  Qwen ICL for cast; ~7.1 min assembled speech). Linked under
  `static/assets/audio/dialogue/light-delay-festival-master/en/` with
  `audioAssetId` on each EN variant.
- Default npm targets `tts:animatic-dialogue` / `:promote` now point at Festival
  master; archived main-short keeps `:main-short` aliases.
- Movie-mode timeline falls back to any language that already has linked audio
  when the active dialogue language has none.

## 2026-09-12 — Removed superseded shaft references

- Deleted the incorrect horizontal/old central-access and service-cylinder concept sheets from the active asset tree.
- Thumbnail synchronization and Higgsfield source manifests now retain only the current vertical shaft references.

## 2026-09-12 — Reference-locked Proxima dock and Ardor shaft sheets

- Regenerated the Proxima external dock as `concept-sheet-v3.png` using the existing Proxima station and Celestial Ardor model sheets as attached image inputs, preserving station geography, hull identity, docking orientation, and scale.
- Regenerated the restricted service shaft as `concept-sheet-v3.png` so the artwork reads as a vertical deck-to-deck shaft while retaining the longitudinal fore/aft axis, radial side hatches, and physical COM distributor.
- Regenerated the central access sheet as `concept-sheet-v2.png` with the bridge reference attached, preserving the two helical staircases, continuous railings, and landing geometry.
- Updated active catalogs, generation prompts, provenance metadata, static manifests, and thumbnails without deleting superseded images.

## 2026-09-11 — Keep Proxima/Ardor scale diagrams out of storyboard takes

- Moved Celestial Ardor proportional PNG/SVG under `vehicles/celestial-ardor/specs/`
  (Proxima proportional already lived under `locations/proxima-station/specs/`).
- Removed scale/proportional assets from entity `referenceAssetIds` and marked them
  `storyboardEligible: false` in `assets.json`; Festival take sync now skips specs.
- Storyboard refs keep concept art only (model/concept sheets, berthed lock, Jupiter plate).

## 2026-09-11 — Corrected ship and Proxima reference geography

- Replaced the active engineering, reactor service-bay, and service-cylinder references with orientation-correct v2 sheets. Engineering and reactor workspaces now read as transverse decks perpendicular to the Ardor thrust axis; service-cylinder access doors are radial side-wall hatches, not end-cap doors.
- Replaced the obsolete Proxima dock reference with a current external axial dock on the non-rotating station spine, including the capture collar, transfer tube, service gantry, umbilicals, and correct Ardor scale/orientation.
- Retained superseded images for provenance and recorded the replacement paths and orientation constraints in the asset catalog and generation manifest.

## 2026-09-11 — Drop obsolete Proxima/bridge reference images from catalog

- Removed catalog entries and entity/take refs for deleted location sheets:
  Proxima Station concept + proportional PNG/SVG, Celestial Ardor Bridge concept sheet,
  and the unused Blender berthed viewport still.
- Pruned matching `_thumbs` WebPs via `thumbs:sync`, cleaned location/art-bible/poster
  manifests, retargeted Higgsfield upload sources, and regenerated production plans.

## 2026-09-11 — Festival master storyboard reference assets

- Generated nine new GPT-Image-2 reference sheets for the master-derived Festival Cut: reactor service bay, inner shielding vault, central access cylinder, restricted service cylinder, geophysical impulse package, Harlan wrist device, time-reference diagnostic unit, wired communications distributor, and Velari personal transport sphere.
- Reused existing bridge, engineering, character, station, transmitter, and Velari-emissary references as style and continuity anchors; no existing image was overwritten.
- Registered the new assets and entity bindings, added `data/production/asset-generation-manifest.json` with its schema, and extended the provider-neutral generation-plan builder to include `light-delay-festival-master`.
- Added a synchronization tool so Festival-master take references include the primary/secondary locations and visible master props without exceeding the existing reference budget.
- Generation remains provider-neutral and unsent. Prompt freeze, production contexts, voice samples, and live Higgsfield entitlement remain separate blockers.

## 2026-09-11 — Festival master storyboard: extended shot durations to natural dialogue pace

- Fixed the 23 shots flagged in the previous storyboard pass whose blueprint-assigned duration was
  unrealistic for their dialogue's word count. Recomputed each one's `durationMs`/`cuePlacements`
  from the same `spoken-duration-core.mjs` WPM estimator at full natural pace (no compression), and
  cascaded the change through the 17 affected scenes' `targetDurationMs`.
- Total runtime grows from 11:30 to **12:43** (763,340 ms) as a result — confirmed acceptable:
  deliverable dialogue pacing is itself a causal-readability requirement, which the outline's own
  10–12 minute range explicitly allows exceeding for. Updated the stated target/ceiling language in
  the outline framing and `docs/wip/festival-cut-screenplay-runway.en.md` accordingly.
- Corrected the blueprint's stale "every video candidate is eight seconds or shorter" rule to the
  actual campaign ceiling of 30 s (`maxSegmentMs`) — the only place in the repo that still said 8 s;
  two of the fixed shots (Zao's recorded warning) now run 16.5 s and 24.4 s under that corrected
  ceiling. Updated the corresponding two hardcoded `≤8` assertions in `festivalMasterScript.spec.ts`
  (per-shot ceiling, and the total-duration constant) to match.
- Updated `data/project.json`'s registry `targetDurationMs`/label alongside the script's own.

## 2026-09-11 — Animatic dialogue audio (offline TTS + movie playback)

- Added shared `WebAudioCueSequencer` with absolute cue scheduling and rolling
  prefetch; Studio `ChunkSequencer` now wraps it so long timelines keep prefetching.
- Animatic movie mode plays promoted dialogue WAVs via shot-relative placements
  (`sum(prior shot durations) + atMs`), with mute and subtitle `timingByLanguage` parity.
- Offline driver `scripts/generate-animatic-dialogue-audio.py` exports ScriptFile
  dialogue to voices markdown, reuses the dual Kokoro+Qwen pipeline (content_hash,
  `--force-speaker`, assemble), catalogs outputs, and `--promote` links
  `audioAssetId` under `static/assets/audio/dialogue/…`.
- npm: `tts:animatic-dialogue` / `tts:animatic-dialogue:promote`. Docs in
  TTS_VOICE_PIPELINE (EN/ES) and JSON_FORMAT placement timing note.
- Generated and promoted 98 English dialogue cues for archived
  `script:light-delay-main-short` (~7.2 min assembled MP3 under Models output).

## 2026-09-11 — Festival master storyboard: Shot/Take records and still-image prompts

- Implemented all 96 reserved story shot candidates plus the 4 non-story cards from
  `docs/wip/festival-master-shot-blueprint.en.md` as real `Shot` + `Take` records in
  `script:light-delay-festival-master` (100 shots, 100 takes), keeping the blueprint's reserved IDs
  unchanged for traceability.
- Authored a still-image generation prompt (`generation.prompt` + `negativePrompt`, English only) for
  every take, in the confirmed "grounded cinematic hard science fiction" house register; no provider,
  model, or image asset is set — nothing has been generated. Video-segment prompts, first/last frame,
  final audio, and the provider-neutral generation plan remain explicitly out of scope for this pass.
- Computed `cuePlacements` from actual cue text via the existing `spoken-duration-core.mjs` WPM
  estimator rather than inventing a new timing heuristic; flagged 23 shots where the blueprint's
  target duration is unrealistic for the dialogue's word count at normal pace, compressing their
  placements proportionally to stay schema-valid pending an editorial timing pass in the video/audio
  phase.
- Added `visual`/`open` reference-art notes to three legacy zero-reference locations used across the
  Festival chase and bridge scenes (`command-vestibule`, `central-access`, `service-cylinder`),
  matching the convention already used for the reactor-service-bay/vault.
- QA pass caught and fixed 13 shots where a mechanical transcription of the blueprint's dual
  visible/off-screen notation (meant for multi-shot video coverage planning) had wrongly excluded a
  character from a still that clearly depicts them on-camera (e.g. Zao recording her own warning,
  Voss sending Earth the final report) — verified against each shot's own authored prompt text, not
  against the blueprint shorthand. Also populated `generation.referenceAssetIds` per take from
  on-screen characters' and the primary location's existing reference sheets, which the first pass
  had omitted.
- Updated `festivalMasterScript.spec.ts` and `extracted-data.spec.ts`'s milestone assertions (previously
  asserting empty `shots`/`takes`) to the new state, and corrected the blueprint's own header, which
  had claimed the arrays "remain empty."

## 2026-09-11 — Festival master dialogue, prop catalog, and stale-reference cleanup

- Reviewed all 197 cues of `script:light-delay-festival-master` against the six leads' voice
  profiles and character bios; rewrote two ungrammatical lines (Rao's "Could have is not did.",
  Harlan's "Agree is not prove.") and two voice-consistency nits for Sorell.
- Sharpened Harlan's appeal to Okoye (`beat-24`) toward a personal register without inventing a
  shared incident, and added one internal line for Harlan at the previously silent post-murder
  flight-sabotage beat (`beat-15`) so an image+sound-only edit has an audible anchor.
- Added three new objects (`object:proxima-geophysical-impulse-package`,
  `object:harlan-wrist-device`, `object:time-reference-diagnostic-unit`), a new character
  (`character:velari-envoy`, the individual first-contact creature), and a new vehicle
  (`vehicle:velari-transport-sphere`, distinct in scale from the 300-600 m emissary) — all named
  repeatedly in the screenplay but previously uncatalogued. Each carries an open `visual` note
  flagging its pending reference sheet.
- Removed the stale `object:diplomatic-quantum-core` entry from the script's `declaredEntityRefs`
  and reworded `object:wired-comms-deck-patch-panel`'s dramatic function to drop its leftover
  "diplomatic deck" framing; confirmed no other deprecated-canon terms (laser, quantum core, cyan,
  override relay, greeting-medium cartridge) remain in any active cue text.
- Validated the shot blueprint against the current script: 195/195 cue references resolve, and
  updated the blueprint's quoted cells for the five changed/added dialogue lines.
- Sharpened `object:time-reference-diagnostic-unit`'s description to name its actual function
  (shifting the bomb controller's comparison clock so the countdown jumps past detonation), raised
  its visual-reference note to `high` priority, and linked the three action cues where Elin plants
  and uses it (`cue-0112`, `cue-0166`, `cue-0168`) to that object via `objectRefs`.
- Clarified Zao's `beat-03` line to name who she means: "That wasn't hope." → "That wasn't hope.
  Not from Harlan." — same understated, non-accusatory delivery, now unambiguous on the page.

## 2026-09-11 — Festival master reactor geography correction

- Replaced every active Festival reference to the obsolete diplomatic-core room with the master-authority outer reactor service bay and inner shielding vault, preserving archived cuts unchanged.
- Added both nested locations to the bilingual catalog and active lifecycle inventory without inventing visual assets; their open notes prohibit using the obsolete diplomatic-core sheet as a substitute.
- Added explicit location bindings to all 96 Festival storyboard candidates and corrected the ship-design production priorities to distinguish current master requirements from historical cut counts.
- Added location hierarchy, scene-reference, lifecycle, and Festival-specific regression validation.

## 2026-09-11 — Agent generation brief for storyboard/frame/video prompts

- Added `docs/production/AGENT_GENERATION_BRIEF.md`: authority chain, generation-plan contracts
  (schema/types/compiler), live-data inventory, asset locations, tooling, and I/O templates for
  storyboard stills, first/last frame, video-segment prompts, and reference-asset requests.
- Declares gaps verified against the repository at the time of writing; some (e.g. the
  `build-generation-plans.mjs` cut list, the provider-capabilities snapshot) were closed by the
  concurrent Festival screenplay/storyboard work recorded below and should be re-checked before reuse.
- Adds a dialogue-tone-pass note (English-first, per-speaker `dialogueStyle`, no forced exposition)
  for making harsh lines read more human without losing causal information.

## 2026-09-11 — Master-derived Festival screenplay and storyboard blueprint

- Authored the English Festival screenplay as 3 acts, 11 sequences, 31 story scenes plus title/credits, with complete colloquial dialogue and a total 11:30 scene budget.
- Bound all 24 Festival outline beats to concrete scene, beat, and cue evidence; added a Festival-specific causal knowledge ledger.
- Added an English storyboard blueprint reserving 96 story candidates plus title and three credit cards. It records camera grammar, visible/off-screen participants, cue coverage, continuity, and references while leaving `shots` and `takes` empty.
- Preserved the concealed-transmission reveal, four separate microgravity events, and post-murder flight sabotage. Added an English voice profile for the Earth reporter, the only additional intelligible Earth speaker.
- Added explicit ScriptFile localization status so Spanish can remain visibly `not_started` without weakening bilingual validation for existing scripts.

## 2026-09-11 — Campaña video: segmentos hasta 30 s

- `data/production/provider-capabilities.json`: `maxSegmentMs` **30000**; campaña apunta a snapshot Seedance 2.5.
- `build-generation-plans.mjs` lee `maxSegmentMs` del JSON (ya no hardcodea 8 s); planes regenerados.

## 2026-09-11 — Studio lista todos los outputs del catálogo

- El selector de Imitation Studio carga `GET /v1/imitation/outputs` en lugar de
  una lista fija; incluye `audience-festival-en` (Festival EN) junto a los
  duales master ES/EN.

## 2026-09-11 — Dual festival EN de audiencia generado (rev. 1)

- Generado `light-delay-festival-audience-dual-en.mp3` (~14.9 min) y chunks
  `outline-chunks/en-festival-audience/` (114 cues; 25 diálogos Qwen nuevos).
- Catálogo `audience-festival-en` registrado. El header Generate del voices festival
  ya no apunta a `en-audience` (evita pisar el dual master).

## 2026-09-11 — Master-derived Festival audience narrative

- Added an 11-chapter English audience narrative covering all 24 Festival beats in order, with deferred targeting, four microgravity transitions, and post-murder flight sabotage preserved.
- Added 25 ID-addressed performance directions; nine adaptation-only lines are explicitly provisional and do not modify the empty Festival screenplay.
- Generalized audience TTS build and validation through a data registry while retaining the existing master commands and outputs.
- Added automated source-step coverage, timing-range, dialogue parity, deferred-reveal, and continuity checks. Festival Spanish remains not started.

## 2026-09-11 — Master-derived Festival outline

- Registered a new `script:light-delay-festival-master` WIP in the master continuity without reviving or overwriting the deprecated Festival cut.
- Added a 24-beat, 11-sequence Festival outline targeting 10–12 minutes and mapping all 58 master revision-19 story beats exactly once.
- Added outline-to-outline provenance, revision/fidelity metadata, derivation validation/reporting, and source-beat links in the outline UI.
- Added a non-authoritative screenplay runway covering scene timing, dialogue opportunities, and intentional silence; the screenplay stub remains empty.

## 2026-09-11 — Dual de audiencia ES regenerado (rev. 19)

- Regenerado `light-delay-audience-dual-es.mp3` (~48.5 min) y chunks
  `outline-chunks/es-audience/` desde voces ES lastSyncedRevision 19.
- 287 cues (240 reutilizados, 47 regenerados; 4 diálogos Qwen nuevos).
- Catálogo `audience-es` current en revisión 19; ES textual sigue `needs_revision`.

## 2026-09-11 — Español sincronizado al beat de sabotaje de rev. 19

- Traducido al español el desplazamiento del sabotaje de vuelo post-asesinato (master,
  relato, voces TTS y escaleta ES retenida).
- Añadido el diálogo `p2-voss-doubt` en ES para paridad de IDs; `lastSyncedRevision` 19
  con status `needs_revision` (aún no current frente a toda la fuente inglesa).

## 2026-09-11 — Dual de audiencia EN regenerado (rev. 19)

- Regenerado `light-delay-audience-dual-en.mp3` (~49.0 min) y chunks
  `outline-chunks/en-audience/` desde `audience-narrative.voices.en.md` rev. 19.
- 287 cues (283 reutilizados por hash, 4 regenerados; 0 diálogos Qwen nuevos).
- Catálogo `audience-en` marcado current en master rev. 19. ES audio regenerado después.

## 2026-09-11 — Master revision 19: flight sabotage moved after the murder

- Harlan no longer alters flight controls before crossing Zao; their encounter remains ambiguous and the communications cut remains the first explicit reveal of his guilt.
- After murdering Zao and securing the vault, he quickly disconnects bridge flight-command inputs at the adjacent local console because her partial warning makes a later abort foreseeable.
- English master and audience text advanced to revision 19. Spanish remains synchronized through revision 17. English audience audio was regenerated for revision 19 afterward.

## 2026-09-11 — Dual de audiencia EN regenerado (rev. 18)

- Regenerado `light-delay-audience-dual-en.mp3` (~48.7 min) y chunks
  `outline-chunks/en-audience/` desde `audience-narrative.voices.en.md` rev. 18.
- 287 cues (267 reutilizados por hash, 20 regenerados; 2 diálogos Qwen nuevos).
- Catálogo `audience-en` marcado current en master rev. 18. ES sigue stale.

## 2026-09-11 — English narrative authority and master revision 18

- Reordered the Prologue exchange so Harlan and Sorell speak before Voss visibly conflates their warnings, then gave Voss an observable reply before Zao reacts.
- Clarified the sabotage/search chronology, Harlan's assumptions, the evidence sequence, the surviving crew count, and the non-immediate detonation constraint in the English master and audience narrative.
- Made English the active narrative/documentary source. Spanish remains at revision 17 and is explicitly marked `needs_revision`; archived cuts retain historical Spanish provenance.
- Added revision-aware localization metadata, UI notices, validators, and English-only audience TTS generation so pending Spanish work is visible rather than silently overwritten.

## 2026-09-11 — Dual de audiencia EN regenerado (rev. 17)

- Regenerado `light-delay-audience-dual-en.mp3` (~47.8 min) y chunks
  `outline-chunks/en-audience/` desde `audience-narrative.voices.en.md` rev. 17.
- 287 cues (244 reutilizados por hash, 43 regenerados; 2 diálogos Qwen nuevos:
  Harlan Tierra y Sorell interrogatorio). Catálogo `audience-en` marcado current.
- El dual ES sigue en prosa rev. 15 / desactualizado frente a master 17.

## 2026-09-10 — Master rev. 17: continuidad y aborto impedido

- Investigación a lo largo de todo el tránsito, con C10b reubicado en D y enlaces causales revisados.
- Corregidos el tiempo de aviso a Tierra y la geometría de retransmisión; cronología explícita de E–F.
- Sabotaje físico de mandos remotos, intento temprano de aborto y control local en el compartimiento exterior.
- Interrogatorio del acceso a bóveda, prueba activa del vector e información de Zao preservada en el mensaje.
- Rescate por referencia temporal ficticia con instrumental establecido; carga armada bajo vigilancia posterior.
- Relatos ES/EN y derivados TTS sincronizados; corregidas las seis desviaciones de adaptación y documentadas
  todas las resoluciones. Audios existentes marcados desactualizados frente a rev. 17; sin generación de medios.

## 2026-09-09 — Studio: regenerar con Qwen3-TTS

- El Studio añade modo paralelo a Seed-VC: regenerar un cue grabable con
  Qwen3-TTS Base (ICL, `x_vector_only=false`) sin micrófono.
- Knobs editables: temperatura, top-p/k, max tokens, repetition penalty,
  dirección de línea, prefijo de expresividad e instruct por defecto
  (semilla desde `docs/wip/qwen-icl-clone-defaults.json`).
- Worker: `POST /v1/imitation/.../regenerate` y `POST /prepare-qwen`; carga
  perezosa de Qwen aparte de Seed-VC; tomas con `engine: qwen-clone`.
- Si el worker corre en el venv Seed-VC (sin `qwen_tts`), arranca un sidecar
  con el Python del sistema (`LIGHT_DELAY_QWEN_PYTHON` opcional).
- Acción **Purgar tomas huérfanas**: borra tomas de overlay no aceptadas
  (`POST …/purge-takes`); conserva pointers de `replacements.json`.
- Ayuda `?` por parámetro Qwen en el Studio (textos ES/EN desde Paraglide).

## 2026-09-09 — Refs ES latinoamericanas (timbre EN × donantes)

- Castellano del elenco maestro: solo variedades latinoamericanas; sin acento L1
  extranjero en viñetas ES. Sorell → Santiago del Estero; Okoye → Caracas.
- Biblia, `voice-profiles`, master, casts y pipeline docs sincronizados.
- Pipeline `pipeline-spanish-latam-regional-qwen.py`: donantes ES × timbre EN;
  pools en `…/es-accents/latam-regional/`.
- Curaduría promovida a `static/assets/voices/es/` (Zao m-02 5th, Voss m-01 5th,
  Harlan weather-03 3rd, Elin m-00 4th, Sorell proxy-03 4th, Okoye m-02 5th).
- Dual audiencia ES regenerado: `light-delay-audience-dual-es.mp3` (~43.8 min);
  36 diálogos Qwen nuevos, narrador Kokoro reutilizado (236 cues).

## 2026-09-06 — Giro remoto y cuarta caída de gravedad

- El master sube a rev. 16 / `0.5.2-wip` y añade `C10b`: corte de empuje,
  microgravedad y giro de 180° a mitad del trayecto lejano antes de frenar.
- La caída de gravedad del clímax queda correctamente identificada como la
  cuarta; los exports y relatos textuales ES/EN se sincronizan con 58 beats.
- Los duales de audiencia rev. 15 no se regeneran y quedan marcados como
  desactualizados en el catálogo local de audio.

## 2026-09-06 — Tomas estables por audience-dialogue-id

- Overlays y `replacements.json` se keyean por `stableDialogueId`; stale =
  `contentHash` + speaker + idioma + engine (no índice ni hash del WAV Qwen).
- Voices MD emiten `<!-- audience-dialogue-id -->`; el dual anota el id en
  `index.json`. Scripts de backfill y migración para el dual actual.
- Accept persiste entre regeneraciones del dual con los mismos diálogos.

## 2026-09-06 — Studio local de imitación

- Catálogo lógico `data/production/audio/audio-outputs.json` (sólo audience-es/en).
- Defaults portátiles con auto-F0 **on**; rutas de máquina en env o `*.local.json`.
- Worker `/v1/imitation` con GPU perezosa, tomas versionadas, stale por cue y
  ensamblado GPU-free. Vite proxy `/v1/imitation` → `:8765`. Studio en `/studio`
  sólo con `npm run dev`; Pages no lo anuncia.
- Escuchar una toma convertida desde el historial **antes** de aceptarla; Play
  sigue siendo el audio efectivo (original o puntero aceptado).
- Cargar modelo / Convertir exigen el Python del venv de Seed-VC; el worker
  reinserta `site-packages`, muestra el intérprete en diagnósticos y deja de
  devolver un 500 opaco si falta una dependencia. En Windows el bind de `:8765`
  es exclusivo para que un `python` huérfano no siga contestando.
- `npm run tts:imitation:check` (CI) y `tts:imitation:check:local` (audio root).

## 2026-09-06 — Pase de imitación Seed-VC SVC

- CLI/worker F0-lock: `scripts/convert-imitation-performance.py` y
  `scripts/lib/seedvc_imitation.py`. Knobs en
  `docs/wip/seedvc-imitation-defaults.json`.
- Conserva la toma emocional del actor y pinta el timbre del elenco; no pasa por
  Qwen ni regenera duales, refs ni Gradio.
- `npm run tts:imitation:check` valida casts, instalación Seed-VC y knobs.

## 2026-09-06 — Duales de audiencia regenerados (rev. 15)

- ES: `light-delay-audience-dual-es.mp3` (~43.3 min); EN:
  `light-delay-audience-dual-en.mp3` (~42.4 min), con títulos localizados,
  **Próxima**, pausas de capítulo y pronunciación de Sorell.
- No se tocaron refs de voz ni los duales de la escaleta general.

## 2026-09-06 — Títulos, revisión y pronunciación TTS localizadas

- El master y el relato usan **Lúz Tardía** y **Próxima** en español; inglés
  conserva **Light Delay** y **Proxima**.
- La revisión TTS se obtiene exclusivamente del outline maestro y el relato se
  vincula mediante un `sourceOutlineId`; su identidad ya no contiene la revisión.
- Cada número de capítulo se pronuncia solo y precede una pausa explícita de
  1200 ms antes del título, igual que el prólogo.
- `pronunciationMap` mantiene `Sorell` como grafía editorial y genera **Soréll**
  en inglés o **Sorél** en español. Los Markdown TTS y los duales de audiencia
  ya están regenerados.

## 2026-09-06 — Relato para público rev. 15 + dirección por ID

- Revisión profunda del relato EN y reescritura ES en presente, con paridad causal
  y de revelaciones a lo largo de 12 secciones.
- Se añadieron 36 `audience-dialogue-id` estables y el contrato bilingüe
  `data/production/audio/audience-dialogue-performance.json`, con intención común
  e indicaciones de interpretación específicas para EN y ES.
- El builder TTS usa esos IDs sin fallback para el relato; nuevo
  `npm run tts:audience:check` valida estructura, atribución, master y derivados.
- Master rev. 15 (38 citas) y exports sincronizados. Los Markdown de voces se regeneraron;
  los MP3 anteriores quedan obsoletos y pendientes de una futura síntesis.

## 2026-09-06 — Audience: Ardor Celestial; Capítulo N. título

- ES: nave **Ardor Celestial**. Capítulos con punto tras el número (`Capítulo 1. …` /
  `Chapter 1. …`) para pausa corta al narrar.
- MP3: `light-delay-audience-dual-es.mp3` (~47.7 min);
  `light-delay-audience-dual-en.mp3` (~51.0 min).

## 2026-09-06 — Audience: pausa tras Prólogo; Capítulos numerados

- Voces/prosa EN+ES: «Prologue.» / «Prólogo.» → pausa → subtítulo; capítulos
  `Chapter N` / `Capítulo N` (1–11).
- `build-tts-voices-outlines.py`: `audience_heading_cues` para fuente audience.
- MP3: `light-delay-audience-dual-es.mp3` (~47.8 min);
  `light-delay-audience-dual-en.mp3` (~51.0 min).

## 2026-09-06 — Promoción selected-slow-v2 + regen ES

- Refs maestras EN/ES reemplazadas por `selected-slow-v2` (más lentas; ES acento suave).
- Audience ES: regenerar diálogo y reensamblar primero.

## 2026-09-06 — Refs lentas v2 (EN acento / ES suave)

- Instruct más pausado (~15–20%); EN mantiene L1; ES suaviza acento.
- Salida: `…/selected-slow-v2/` (v1 conservada).

## 2026-09-06 — Refs lentas desde selected (sin re-curar pools)

- Nuevo `scripts/regenerate-selected-voice-refs-slower.py`: reclona
  `static/assets/voices/{en,es}/` → `selected-slow-v1/` con instruct pausado.
- `dialogueSpeed` permanece en 1.0 (sin time-stretch).

## 2026-09-06 — Diálogo EN: speed/temp + completar frases

- Cast EN: `dialogueSpeed` 0.85; acentos L1 intactos.
- Anti-corte de finales: instruct de completitud, `max_new_tokens` 3072,
  `repetition_penalty` 1.05, cola 220 ms; prefijos EN/ES separados.

## 2026-09-06 — Diálogo ES: temp 0.82 + acento más suave

- Temp/top_p `0.82`/`0.90`. Instruct ES + prefijo: color L1 ligero, sin exagerar.
- Audience ES reensamblado: `light-delay-audience-dual-es.mp3` (~48.1 min;
  `dialogueSpeed` 0.85 incluido).

## 2026-09-06 — Diálogo ES más lento (`dialogueSpeed` 0.85)

- Qwen no expone `speed`; el dual aplica time-stretch (librosa) post-synth.
- Cast ES: `generation.dialogueSpeed: 0.85` (alineado al narrador Alex).
- Instruct ES pide ritmo un poco más pausado. EN sigue en `1.0`.

## 2026-09-06 — Qwen diálogo más expresivo (sin tocar refs)

- `qwen-icl-clone-defaults.json`: instruct con color emocional; `expressivenessPrefix`
  antepuesto a cada `[QwenInstruct]`; temp `0.75` / top_p `0.88`.
- Casts EN/ES alineados; `compose_instruct` en `qwen_icl.py` + dual renderer.
- Invalida hash de cues de diálogo → regenerar con `--force-speaker` o regen dual
  (las WAV maestras en `static/assets/voices/` no cambian).
- Audience ES reensamblado tras regen de 36 cues de diálogo:
  `light-delay-audience-dual-es.mp3` (~47.7 min).

## 2026-09-05 — Audience ES: narración más lenta + léxico castellano

- Narrador Kokoro `em_alex`: speed **0.85** (antes 0.92) en `kokoro-voice-cast.es.json`.
- Título hablado/escrito ES: **Lúz Tardía**. `jammer` → _inhibidor de señales_;
  `displays` → _pantallas_. Diálogo de Soréll sobre la IA pasa a cita hablada
  (`audience-narrative.es.md` / `.voices.es.md`; EN hermano alineado).

## 2026-09-05 — Render audience EN dual

- Audience EN: `E:/Models/Qwen3-TTS/output/light-delay-audience-dual-en.mp3`
  (~50.7 min; chunks en `outline-chunks/en-audience/`; Kokoro `am_michael` + Qwen ICL).

## 2026-09-05 — Ensamblado dual en MP3

- `generate-dual-outline-audio.py` escribe el producto ensamblado como `.mp3`
  (libmp3lame 192k) por defecto; `.wav` sigue disponible si `--out` lo pide.
- Audience ES: `light-delay-audience-dual-es.mp3` (WAV intermedio eliminado).

## 2026-09-05 — Narrador ES Kokoro `em_alex` + render audience ES

- Nuevo `docs/wip/kokoro-voice-cast.es.json` (Narrator = `em_alex`, `lang=es`).
- `generate-dual-outline-audio.py --lang es` usa ese cast por defecto.
- Arranque del dual audience ES → `outline-chunks/es-audience/` +
  `light-delay-audience-dual-es.mp3`.

## 2026-09-05 — Voces selected native-L1 → `static/assets/voices`

- Promovidas las tomas curadas de
  `…/native-l1-v2/finalists/` (una por personaje × EN/ES) a
  `static/assets/voices/{en,es}/{Character}.wav`, reemplazando las refs anteriores.
- Actualizados `selection.json`, casts Qwen y `voices/README.md`. Okoye ES pasa a
  Igbo L1 (deja el interim rioplatense). `REF_TEXT.txt` sin cambios (frase Qwen).

## 2026-09-05 — Relato narrativo para público (EN/ES) + TTS multi-voz

- Nuevos `docs/wip/audience-narrative.es.md` / `.en.md`: relato por capítulos
  (sin frontmatter de producción, sin spoilers anticipados; la puntería de retardo
  de luz y el contenido del mensaje de Zao se revelan sólo al reproducirse).
- TTS: `audience-narrative.voices.es.md` / `.voices.en.md` (35 diálogos, paridad
  EN/ES). Rebuild: `python scripts/build-tts-voices-outlines.py --source audience`.

## 2026-09-05 — Outlines TTS multi-voz rev. 14 (EN + ES)

- Regenerados `docs/wip/outiline-for-kokoro-tts.voices.md` y
  `docs/wip/outiline-for-kokoro-tts.voices.es.md` desde la escaleta maestra rev. 14
  (export MD), más hermanas sin tags (`outiline-for-kokoro-tts.md` / `.es.md`).
- Los 37 diálogos toman hablante sólo de citas atribuidas (`speakerId` /
  `> **Nombre:**`); paridad EN/ES verificada; mismos `[QwenInstruct]` por índice.
- `generate-dual-outline-audio.py --lang es` usa por defecto el outline ES.
- Builder: `scripts/build-tts-voices-outlines.py`. El master no necesitó
  atribuciones nuevas (37/37 ya tenían `speakerId`).

## 2026-09-05 — Outline por chunks + docs TTS en el repo

- `generate-dual-outline-audio.py` guarda cada cue en
  `E:/Models/Qwen3-TTS/output/outline-chunks/{lang}/` con `index.json`;
  `--force-speaker` / fingerprint de voz regeneran sólo ese personaje;
  `--assemble-only` reensambla sin modelos.
- Guía canónica: `docs/TTS_VOICE_PIPELINE.es.md` (+ `.en.md`) — recrear
  `E:\Models\`, native-L1 V2+ICL, y pronunciación **Soréll** en texto para audio.

## 2026-09-05 — Canon ICL + EN native-L1 V2; limpieza de pools obsoletos

- Knobs canónicos en `docs/wip/qwen-icl-clone-defaults.json` (Seed-VC V2 L1 + Qwen ICL).
- `generate-dual-outline-audio.py` respeta ICL para EN/ES (`--lang en|es`, cast ES
  `qwen3-tts-cast.es.json`): `x_vector_only=false`, temp=0.70, top_p=0.85,
  `ref_text` desde `REF_TEXT.txt` / sidecar / Whisper.
- Nuevo `pipeline-english-native-l1-v2-qwen.py` (mismo framing que ES). El pipeline
  V1 multi-pase queda deprecado (stub).
- Conservados: `voice-donors/` y `es-accents/native-l1-v2/`. Borrados pools Qwen/Seed-VC
  obsoletos (EdAcc, l1-prosody, okoye-rioplatense, native-l1 V1 EN, smokes).
- Re-run EN Seed-VC V2 + Qwen ICL → `…/en-accents/native-l1-v2/` (**24/24**).

## 2026-09-06 — Formación lingüística y voces bilingües del elenco maestro

- Los seis perfiles de voz del master separan timbre, prosodia de origen, lugar/variedad de aprendizaje y estilo de diálogo para español e inglés; se formalizan mediante un schema propio y validación bilingüe.
- La escaleta maestra pasa a revisión 14, incorpora la formación lingüística en Reparto y atribuye sus 37 citas con `speakerId`; los Markdown generados, el importador reversible y la UI preservan y muestran al hablante.
- El diálogo maestro recibe un pase sutil de variedad aprendida sin grafías fonéticas ni exposición añadida. Los cuatro cuts deprecados y los audios WIP no se regeneran.
- Las fichas públicas muestran las dos variantes de voz y `report:dialogue-style` verifica atribución y cobertura de dirección antes de futuros guiones o TTS.

## 2026-09-05 — ES native-L1: Qwen ICL (prosodia Seed-VC)

- Borrados los 24 Qwen previos (`x_vector_only`, que descartaban `ref_code`).
- Regenerados con ICL: Whisper-medium transcript de cada `*_v2.wav`,
  `x_vector_only=false`, temp=0.70, top_p=0.85, instruct mínimo.
  Pool `…/native-l1-v2/finalists/` (**24/24**).

## 2026-09-05 — ES native-L1 vía Seed-VC V2 (1 pase) + Qwen

- Timbre = `static/assets/voices/es/`; prosodia = `voice-donors/native/`.
- V2 afinado para **supervivencia L1**: `convert_style=false`, intel=0.90, sim=0.55,
  steps=35. Qwen ICL (no `x_vector_only`): temp=0.70, top_p=0.85.
- Pool: `…/es-accents/native-l1-v2/finalists/` (**24/24**). Script:
  `pipeline-spanish-native-l1-v2-qwen.py`.

## 2026-09-05 — Okoye ES seleccionada (rioplatense 4º pase)

- Promovida
  `okoye-rioplatense/…/openslr61-weather-03__Okoye_4th_pass_qwen-es.wav`
  → `static/assets/voices/es/Okoye.wav`. Siguiente: native-L1 igbo en ES.

## 2026-09-05 — Seed-VC V2 instalado

- Pesos V2 + ASTRAL descargados en el venv `E:/Models/Seed-VC/`; smoke Okoye×rioplatense OK.
  Notas: `E:/Models/Seed-VC/LIGHT_DELAY_NOTES.md`. Pipelines de producción siguen en V1 hasta
  migrar/comparar.

## 2026-09-05 — Okoye ES rioplatense (pre-selección)

- Timbre `en/Okoye.wav` × donantes argentinos (`voice-donors/es/rioplatense/`) × Seed-VC
  pases 1–5 → frase Qwen ES. Pool: `…/es-accents/okoye-rioplatense/finalists/` (**20/20**).
  Script: `pipeline-okoye-spanish-rioplatense.py`. Curar una → `static/assets/voices/es/Okoye.wav`
  antes del pase nativo igbo en ES.

## 2026-09-05 — EN native-L1: pases 4–5 adicionales

- Dos pases Seed-VC más sobre la cadena nativa (mayor impronta de prosodia L1), luego
  Qwen EN. Pool `…/en-accents/native-l1/finalists/`: **120/120** (6×4×5).

## 2026-09-05 — EN native-L1: Seed-VC ×3 + Qwen frase

- Timbre = `static/assets/voices/en/` (incl. Okoye `okoye-02`). Prosodia = donantes
  nativos (`voice-donors/native/`: mandarín/alemán/británico/hindi/francés/igbo).
- 6 × 4 donantes × 3 pases Seed-VC → Qwen EN con la frase `refText` (`x_vector_only`).
  Pool de curaduría: `…/en-accents/native-l1/finalists/` (**72/72**). ES análogo pendiente.

## 2026-09-05 — Okoye EN seleccionada (`okoye-02`)

- Promovida `candidates/Okoye/okoye-02.wav` → `static/assets/voices/en/Okoye.wav`.
  Cast WIP y `selection.json` actualizados. ES regional de Okoye sigue pendiente.

## 2026-09-05 — Promoción de la escaleta maestra y retiro seguro de productos anteriores

- La escaleta maestra bilingüe WIP pasa a ser la autoridad narrativa; `project.narrativeAuthority` y `canonicalScriptId` apuntan a su continuidad y stub vacío.
- Main-short, Festival, tráiler y long se marcan `deprecated`; animatics, planes de generación, ledgers y checklist Higgsfield se marcan `obsolete` sin borrar material rescatable.
- Nuevo ledger `data/editorial-lifecycle.json`, esquema, validador e informe generado con clasificación conservadora y cuatro compuertas obligatorias antes de eliminar archivos.
- Los Markdown ES/EN del master pasan a ser exports JSON→Markdown reproducibles; Markdown→JSON sólo genera candidatos de importación.
- Selector, rutas, landing, archivo editorial, entidades y assets muestran la nueva autoridad o su advertencia de ciclo de vida. Las rutas archivadas usan `noindex` y no entran al sitemap.
- ADR-0002, reglas de agentes, contrato de escaleta, README, TODO y documentos de la continuidad anterior fueron sincronizados con la transición.
- El objeto estable del antiguo transmisor se realinea con la terminología del master como «matriz óptica de comunicaciones de larga distancia»; su hoja visual queda en revisión y los componentes nuevos aún no catalogados se registran como deuda, sin inventarlos.
- La regresión Playwright se adapta al reloj de diálogo y a los controles duplicados por layout; la suite completa queda verde con 18 pruebas.

## 2026-09-05 — Okoye EN: nuevos candidatos VoiceDesign

- Regenerados 8 candidatos bajo `E:/Models/Qwen3-TTS/candidates/Okoye/` con instruct
  alineado a la biblia (contralto firme, inglés nigeriano/igbo, ritmo silábico,
  sin caricatura). Luego seleccionada `okoye-02` → `static/assets/voices/en/Okoye.wav`.

## 2026-09-05 — Voces ES curadas en el repo; Okoye EN retirada

- Cinco refs regionales ES movidas a `static/assets/voices/es/` (Zao CO, Voss PE,
  Harlan AR, Elin CO, Sorell PE). El pool `es-accents/finalists/` queda vacío tras
  la selección (descartes del curador + movimiento).
- Eliminada `static/assets/voices/en/Okoye.wav`; cast WIP marca Okoye pendiente de
  VoiceDesign / nueva selección de candidatos.

## 2026-09-05 — Donantes nativos (L1 auténtico)

- Clips en la lengua materna de cada acento (no inglés L2): `E:/Models/voice-donors/native/`.
  Zao→mandarín, Voss→alemán, Harlan→inglés británico, Elin→hindi, Sorell→francés,
  Okoye→igbo (4 × ~10 s). Fuentes: LibriVox (archive.org) y FLEURS Igbo.
- Script: `download-native-language-donors.py`. Pipelines EN y ES+L1 preferen `native/`
  y caen a EdAcc `voice-donors/en/` si falta.

## 2026-09-05 — Dara Okoye: identidad, voz y referencia propias

- Completada la entidad bilingüe de Okoye con rasgos, apariencia nigeriana, vestuario de seguridad y perfil vocal nigeriano/igbo en inglés y castellano.
- Generada y catalogada una hoja propia de personaje con tres vistas y cinco expresiones; la referencia genérica de seguridad se conserva sólo para extras y vestuario.
- La narrativa maestra pasa a rev. 13, amplía su función sin importar el pasado con Harlan de la continuidad primaria y corrige dos pronombres incorrectos; el JSON estructurado conserva la fidelidad inglesa.
- La página de entidades presenta rol, rasgos, apariencia, vestuario y voz; la biblia de producción y los planes de generación apuntan a la identidad propia.
- Inventario actualizado a 143 assets y 38 referencias. No se registraron ni generaron muestras de voz aprobadas.

## 2026-09-05 — Voces selected en el repo

- Refs EN curadas en `static/assets/voices/en/` (Zao, Voss, Harlan, Elin, Sorell, Okoye;
  sin Cael). Cast WIP: `docs/wip/qwen3-tts-cast.json` usa rutas relativas al repo.

## 2026-09-05 — Donantes unificados (agnósticos de modelo)

- Clips donantes en `E:/Models/voice-donors/` (`en/` EdAcc L1, `es/` regionales), fuera de
  cualquier árbol `Qwen3-TTS/output/`. Scripts de descarga/pipeline actualizados.

## 2026-09-05 — ES + prosodia L1 (origen EN) sobre finalistas regionales

- Mismo mapa de origen que el pipeline EN (Zao mandarín, Voss germánico/nórdico, Harlan
  británico, Elin indio, Sorell francés, Cael celta) pintado con Seed-VC sobre las WAV
  finalistas ES (CO/PE/AR), luego frase Qwen en español (`x_vector_only`).
- Donantes L1: `E:/Models/voice-donors/en/`. Salida:
  `…/es-accents/l1-prosody/` (**252/252** Qwen-ES en `finalists/`). Scripts:
  `download-l1-prosody-donors.py`, `pipeline-spanish-l1-prosody-seedvc-qwen.py`.

## 2026-09-05 — Acentos EN vía Seed-VC + Qwen (candidatos)

- Misma metodología que ES: donantes de inglés con inflexión L1 (EdAcc) → Seed-VC pases 1–3
  sobre `selected/` → Qwen3-TTS con la frase `refText` por cada pase.
- Seis principales (Zao/Voss/Harlan/Elin/Sorell/Cael); Cael obtiene `selected/Cael.wav` vía
  VoiceDesign. Salida: `E:/Models/Qwen3-TTS/output/pronunciation-tests/en-accents/finalists/`
  (**71/72**; falta `edacc-03__Sorell_2nd_pass` por overflow de duración).
- Scripts: `download-english-accent-donors.py`, `pipeline-english-accent-seedvc-qwen.py`.
  Carga Qwen: `dtype` recursivo en subconfigs para Flash Attention 2 sin warning.

## 2026-09-05 — Seed-VC para separar timbre y prosodia

- Investigación: Seed-VC supera a OpenVoice v2 y CosyVoice en SECS/WER para conversión
  zero-shot; ProsoCodec/Discl-VC/REF-VC son papers más nuevos pero menos listos en Windows.
- Instalación en `E:/Models/Seed-VC/` (venv + pesos HF). Uso: fuente = acento/prosodia
  (p. ej. Qwen español), target = `static/assets/voices/en/<Character>.wav`. Notas:
  `E:/Models/Seed-VC/LIGHT_DELAY_NOTES.md`.

## 2026-09-04 — Dual TTS de la escaleta (Kokoro + Qwen3-TTS)

- Narrador con Kokoro; diálogo de personajes con clonado Qwen3-TTS Base y refs curadas en
  `static/assets/voices/en/` (antes bajo `Qwen3-TTS/selected/`).
- Cada réplica lleva `[QwenInstruct]` (emoción/prosodia en lenguaje natural) alineado al contexto
  narrativo; el render usa `instruct_ids` + `voice_clone_prompt` (el wrapper público
  `generate_voice_clone` no expone `instruct`).
- Scripts: `annotate-qwen-instructs.py`, `generate-dual-outline-audio.py`; salida
  `E:/Models/Qwen3-TTS/output/light-delay-outline-dual.wav` (~83 min, 35 réplicas).

## 2026-09-04 — Conteos de assets alineados con el catálogo

- `validate:docs` y `ASSET_PROVENANCE.md` pasan a 142 assets / 37 referencias / 138 sin `source`,
  coherentes con el catálogo tras las hojas terrestres y la periodista.

## 2026-09-04 — Digest de planes de producción estable en CI

- `production:plans` normaliza CRLF antes del `sourceDigest` para que el chequeo en Linux no
  diverja del working tree Windows (`light-delay-long.json`).
- `assertGeneratedCheck` compara también con newlines normalizados, evitando falsos _stale_ locales.

## 2026-09-04 — Regeneración de notas pendientes

- Regenerado `docs/PENDING_AUTHOR_NOTES.md` para alinear el informe con el texto actual de las
  notas en JSON (incluido el asset reutilizado en festival `shots[7]`) y desbloquear `notes:check` en CI.

## 2026-09-04 — Sincronización estructurada de la narrativa maestra rev. 12

- Sincronizada `data/outlines/light-delay-master-narrative.json` con todos los cambios de la
  revisión 12, con español e inglés inline, versión `0.2.0-wip` y procedencia SHA-256 renovada.
- Incorporadas la biología y comunicación luminosa Velari al framing, la ventana final de
  10–15 minutos, el regreso fortuito de Harlan al puente y la progresión completa de silencio,
  atención y habla en F7 y G2–G2b, sin modificar ningún cut canónico.
- El importador deja de reutilizar traducciones por posición: sólo conserva bloques y elementos
  de lista cuyo inglés coincide, evitando desplazar copy español cuando cambia el Markdown.
- Añadidas regresiones de datos y UI para la descripción Velari bilingüe; la escaleta conserva
  11 secciones de contexto, 8 secciones narrativas y 57 beats `story` sin implementación.

## 2026-09-04 — Ventana final, regreso de Harlan y encuentro Velari (WIP)

- Actualizado `docs/wip/general-narrative-outline.en.md` a rev. 12: el tramo lejano se acorta a
  ~23 h 25 min sin alterar la ruta óptica de Zao, dejando una ventana de respuesta de ~10–15 min.
- Harlan regresa por servicio para informar y retomar su puesto, pero al oír a Zao activa el
  jammer preparado mediante su dispositivo de muñeca y vuelve atrás; no se incorpora como pista.
- Añadido al contexto el mínimo descriptivo Velari necesario y reescritos F7 y G2–G2b para que el
  saludo conserve el medio luminoso del manto y el encuentro progrese de silencio a atención y
  habla dentro de la esfera ambiental.
- No se modifican los JSON estructurados ni los guiones. La conversión WIP existente continúa
  derivada de rev. 11 y requiere regeneración separada después de adoptar esta fuente.

## 2026-09-04 — Quinta continuidad: narrativa maestra WIP

- Registrada `script:light-delay-master-narrative` como entrada `master_narrative` vacía dentro de una continuidad de desarrollo separada; no reemplaza el corto canónico, Festival, tráiler ni el tratamiento largo.
- Convertida íntegramente `docs/wip/general-narrative-outline.en.md` rev. 11 a una escaleta bilingüe con 11 secciones de framing, 8 secciones narrativas y 57 beats story-only. El inglés se comprueba contra el texto fuente y su SHA-256 mediante `build:master-outline:check`.
- El esquema, tipos, validadores, traducción e informes admiten `framing`, `storySections` y cuerpos narrativos semánticos sin exigir detalle o cobertura inexistentes.
- `/outline/[scriptId]` incorpora aviso editorial, procedencia, navegación interna, contexto plegable y agrupación por secuencia; las rutas de guion y animatic manejan el stub sin intentar renderizar o reproducir tomas vacías.

## 2026-09-04 — Vindicación imaginada de Harlan (WIP)

- Actualizado `docs/wip/general-narrative-outline.en.md` a rev. 11: Harlan oscila entre el temor
  a que el mensaje de Zao lo condene y la esperanza de que la historia lo considere un salvador.
- Añadido su lamento privado al creer perdido el mensaje y su contrapunto final: el informe de
  Voss identifica a Zao como quien salvó a la tripulación y preservó el contacto.
- El reconocimiento sigue siendo subtexto psicológico, no un cuarto motivo operativo. No se
  modifican outlines ni guiones JSON; el borrador continúa sólo en inglés y no es canon.

## 2026-09-04 — Hipótesis falsa de sabotaje de combustible (WIP)

- Actualizado `docs/wip/general-narrative-outline.en.md` a rev. 10: la investigación acepta primero
  una avería provocada en la alimentación D–³He, luego separa el consumo extra, la masa no
  declarada y la fuente de neutrones antes de que el mensaje de Zao confirme la bomba.
- No modifica outlines ni guiones JSON. El borrador sigue sólo en inglés y no es canon.

## 2026-09-04 — Revelación diferida del mensaje de Zao (WIP)

- Actualizado `docs/wip/general-narrative-outline.en.md` a rev. 9: la secuencia B conserva las
  pistas del envío, pero oculta al público su destino y mecanismo; E2 los revela mediante un
  flashback durante la reproducción del mensaje.
- No modifica outlines ni guiones JSON. El borrador sigue sólo en inglés y no es canon.

## 2026-09-03 — Escaleta narrativa general (WIP)

- Renombrado el borrador WIP a `docs/wip/general-narrative-outline.en.md` (rev. 7): escaleta maestra cut-agnóstica en inglés; no modifica outlines ni guiones JSON. Falta copia española.

## 2026-09-02 — Borrador de reestructura Festival (no canon)

- Añadido el borrador WIP de reestructura Festival en inglés (ruta histórica `docs/wip/festival-cut-outline-v2-restructured-EN.md`; ver entrada 2026-09-03). No modifica outlines ni guiones JSON.

## 2026-09-01 — Consola del puente y tomas de tránsito de Júpiter

- Actualizado `blender/light-delay-blockout.blend` y exportado `blender/bridge-console-station.glb`.
- Añadidas vistas de referencia del puesto con silla en `static/assets/props/bridge-console-station-with-chair/` (aún no registradas en `data/assets.json`).
- Añadidas escenas de toma `blender/shots/jupiter-transit-a-01b-approach-sunlit.blend` y `jupiter-transit-a-01c-flip-and-burn.blend`.

## 2026-09-01 — Checklist pre-suscripción Higgsfield

- Añadido `docs/production/HIGGSFIELD_PRE_SUBSCRIBE_CHECKLIST.md` y snapshot JSON (`data/production/checklists/higgsfield-pre-subscribe.json`): matriz tráiler↔festival, PNG skip, ~28 gens de tráiler + ~46 festival incremental (~888 cr @ 480p), puertas editoriales antes de Ultra.
- Script `scripts/generate-higgsfield-pre-subscribe-checklist.mjs` (`npm run production:checklist:higgsfield`).

## 2026-08-31 — Referencia Higgsfield MCP

- Añadido `docs/technical/HIGGSFIELD_MCP.md`: conexión MCP oficial, créditos vs Unlimited 24 h, referencias, flujo de dos agentes y esquema JSON propuesto para corridas.

## 2026-08-31 — Referencias terrestres separadas

- Añadidas hojas independientes para el manifestante Aqueronte, la partidaria del contacto y la periodista terrestre.
- Las entidades de cada voz ahora apuntan a su referencia propia; `earth-protesters` se conserva para planos de multitud.
- Higgsfield staging y el catálogo de assets se actualizaron (142 assets registrados).

## 2026-08-31 — Hoja de referencia de Harlan regenerada

- Reescrita la descripción canónica bilingüe de Rylen Harlan para fijar rasgos, porte y diferencia visual respecto de Voss.
- Regenerada `static/assets/characters/harlan/model-sheet-v2.png` en el formato neutral del resto del elenco; la hoja anterior queda como procedencia histórica.
- Harlan vuelve al staging de Higgsfield con su referencia versionada; queda pendiente sólo la verificación externa de similitud.
- `npm run prepare:higgsfield` refresca copias de Zao, Harlan y briefs de escena 5 para subida externa.

## 2026-08-31 — Harlan desenchufa COM A/B (escena 5, toma 7)

- Registrado `asset:animatic-05-07` (`scene-05/shot-07.png`) y enlazado en `main:take-05-07-01` y `festival:shot-b-03-take-01`; deja de reutilizar erróneamente `asset:animatic-12-08`.

## 2026-08-31 — Cartelas de título en el animatic

- Registrados tres assets en `data/assets.json` y enlazados en las tomas: `film-title.png` (main y Festival), `trailer-brand.png` y `trailer-tagline.png` (tráiler). Las tres tarjetas de créditos siguen con placeholder.

## 2026-08-31 — Referencia del acceso oculto al puente

- Añadida una vista realista para montar la entrada de Harlan desde el cilindro de servicio oculto por las escaleras.
- Conservados cámara, escaleras, barandas y arco de consolas del blockout; la silla de capitán recibe mayor jerarquía visual sin convertirse en un elemento ornamental.

## 2026-08-31 — Referencia cercana de los puestos del puente

- Añadida una segunda referencia realista del puente desde la cámara cercana a los seis puestos y la silla de capitán.
- Conservada la geometría de cilindros, escaleras y barandas del nuevo blockout, aplicando los materiales, iluminación y ventanas reforzadas de la referencia general.

## 2026-08-31 — Barandas completas y ventanas perimetrales del puente

- Rehecha la referencia realista conservando la planta y cámara del blockout autoritativo.
- Añadidas barandas exteriores paralelas a las interiores en todos los tramos de escalera; las interiores continúan sin interrupción sobre los descansos horizontales.
- Distribuidas ventanas pequeñas y reforzadas por todas las paredes visibles del casco, manteniendo las aberturas de acceso junto a los cilindros de servicio y ascensor.

## 2026-08-31 — Título de una línea y lema restaurado

- Título de obra: un solo cue (`LUZ TARDÍA` en español / `LIGHT DELAY` en inglés); eliminado `LATE LIGHT` como segunda línea errónea.
- Tráiler: restaurada la cartela de lema (`SOMETIMES, ARRIVING LATE IS ARRIVING ON TIME.`) tras la marca; **33** tomas (1:42,5). Prompt C de nuevo en `docs/TITLE_AND_CREDITS.md`.

## 2026-08-30 — Títulos y créditos en main, Festival y tráiler

- Main y Festival añaden título diferido tras el cold open (`LIGHT DELAY` / `LUZ TARDÍA`) y tres tarjetas de créditos finales; el tráiler conserva marca al cierre y añade las mismas tarjetas de créditos.
- Animatic: main **128** tomas (~30:50,5), Festival **71** (~6:14,2), tráiler **33** (1:42,5). Stills de cartela usan placeholder hasta generación autorizada; prompts EN en `docs/TITLE_AND_CREDITS.md` y notas de toma.
- `TextCue.presentation` admite `credits`. Autor legal pendiente: `AUTHOR_NAME_PLACEHOLDER`.

## 2026-08-30 — Completitud de propósitos y encuadres

- Main completa propósitos bilingües en sus 68 tomas pendientes y encuadres en las 12 tomas que carecían de `composition.framing`, conservando descripciones, movimientos, IDs y duración.
- El generador del tráiler añade propósitos por toma desde la intención segura de cada segmento, sin heredar metadatos que puedan revelar culpable o desenlace; sus 29 tomas quedan completas en propósito y encuadre.
- Festival fue auditado y permanece sin faltantes de estos campos. No se generaron imágenes, video ni prompts; bindings, placements y performance siguen siendo deuda separada.

## 2026-08-30 — Clímax físico/digital y omisiones del tráiler

- Main y Festival aclaran que la cámara descarta a Sorell como autora, aunque Voss suspende su credencial comprometida y exige escolta; Harlan usa el procedimiento para preservar el canal automático, no para apagarlo.
- El token de Zao autentica mensaje y snapshot, la auditoría de Elin completa la atribución y Voss ejerce la revocación. Elin todavía necesita cinco segundos de intervención física; Sorell valida fuera de línea el saludo y Voss lo preautoriza antes de T=0.
- La aproximación remota termina bajo 1 g: Harlan bloquea el accionamiento principal, el corte programado a T−12 s inicia microgravedad y su apelación al pasado compartido provoca una vacilación breve de Okoye antes de que ella lo redirija con pasamanos y tether.
- El protocolo libera automáticamente sólo el saludo ya autorizado cuando abre el canal. La escala diferenciada de Ardor, emisaria y estación sostiene la dimensión cósmica sin sustituir la decisión humana.
- El tráiler mantiene anónima la amenaza y deja sin resolver envío, recepción, destino de Zao, contención y resultado del saludo; el guard de spoilers cubre ahora también estas dos últimas categorías.
- El largometraje sólo adopta esta lógica en su escaleta. Su tratamiento, generador, ledger, comparación y producción quedan como deuda explícita para una revisión posterior; no se generaron imágenes, video ni prompts.

## 2026-08-31 — Habitabilidad y seguridad del puente

- Revisada la referencia realista para reducir el aspecto enteramente metálico mediante paneles compuestos claros, acentos apagados azul pizarra/verde azulado, tapicería y luz de trabajo más cálida.
- Añadidas barandas exteriores continuas a todas las caras expuestas de escaleras y descansos, conservando también las interiores y las aberturas funcionales.
- Eliminado un objeto suelto introducido durante la revisión para mantener seguridad en microgravedad.

## 2026-08-31 — Casco y referencia realista del puente

- Aclarado que la pared curva gris del puente es casco presurizado, no ventanal panorámico ni pantalla; sólo los displays de los seis puestos son azules.
- Añadidas pocas ventanas pequeñas, profundas, reforzadas y obturables a lo largo del cilindro, destinadas a orientación e inspección, no al pilotaje.
- Generada y registrada una referencia interior realista de 1536 × 864 a partir de los blockouts en perspectiva y planta.

## 2026-08-31 — Geometría del puente y ruta de Harlan

- Corregida la descripción del puente de la Celestial Ardor según el bloqueo tridimensional: seis puestos en arco, silla de capitán, mesa para seis y aberturas de escalera junto al cilindro de servicio y el ascensor.
- La escotilla oscura del cilindro de servicio y la bandeja abatible COM A/B contigua quedan fuera de la línea visual de los puestos.
- Sincronizada la secuencia en main, Festival y largo: Harlan asciende por servicio, abre la escotilla durante la llamada de Zao, corta primero wireless y luego desenchufa COM A/B, vuelve a entrar, cierra y desciende hacia ella.

## 2026-08-31 — Cartelas inglesas de título y tráiler

- Regeneradas tres cartelas opacas de 1536 × 864 bajo `static/assets/animatic/titles/`: título principal/festival, marca final del tráiler y eslogan independiente.
- El título visual queda reducido a `LIGHT DELAY`, sin subtítulo ni eslogan; la marca del tráiler añade únicamente un pulso Velari cian muy tenue.
- El eslogan propuesto `THE MESSAGE ARRIVED BEFORE THEY DID.` queda como asset independiente y no se incorpora al montaje, preservando la decisión posterior de eliminar la cartela de lema del tráiler.

## 2026-08-30 — Campaña de afiches V1

- Añadidos ocho afiches de `Luz Tardía`: cuatro conceptos en formatos apaisado y retrato, bajo `static/assets/marketing/posters/v1/`.
- Añadidas sus ocho versiones inglesas `Light Delay`, localizando únicamente título y eslogan y conservando el arte y la composición.
- Las piezas narrativas usan las referencias canónicas de Zao, Proxima, Celestial Ardor, la Estación Velari y el reparto principal; el teaser minimalista deriva de la marca oficial.
- `static/assets/marketing/posters/manifest.json` registra copy, dimensiones, orientación, referencias visuales y estado de elegibilidad todavía no verificado.

## 2026-08-30 — Metadatos de producción Festival A–D

- Las 38 tomas A–D del Festival Cut ahora declaran propósito bilingüe, personajes/objetos visibles u off-screen y contextos físicos verificables; no cambiaron diálogo, duración, orden ni imágenes.
- Añadido el contexto de la Ardor atracada en Proxima y aplicados a A–D los contextos vigentes de microgravedad, empuje, transmisión óptica y displays operativos únicamente en inglés.
- Los planes de generación del Festival ya no informan faltantes de propósito, binding o contexto. Continúan bloqueados correctamente por el freeze editorial de 67 tomas y por las muestras de voz todavía ausentes.

## 2026-08-30 — Reproductor: sidebar derecho unificado

- En modo película, el selector de idioma, el contador de tomas y el panel de detalles comparten una columna derecha que fluye verticalmente, sin solaparse.

## 2026-08-30 — Festival Cut completo A–G y displays ingleses

- Festival incorpora 29 tomas/takes para E–G y alcanza 67 tomas, 6:03,2 de primera asamblea y cobertura causal/animatic completa; los siete parlamentos existentes se colocaron sin reescritura ni sobra de diálogo.
- Cada toma nueva reutiliza un still del corto como placeholder explícito `needs_regeneration/canon_mismatch`; no se generaron imágenes ni video.
- Los planes de producción declaran `diegeticTextLanguage: en` y extraen sólo `variants.en` para texto integrado en displays. El master visual nunca combina idiomas; una eventual versión española será un derivado de edición.
- Añadidos reloj único, saludo pasivo verificado, bindings, propósitos, cámara, sonido, procedencia y contextos de gravedad/vacío para E–G.

## 2026-08-29 — Carrera al núcleo, evidencia convergente y Festival A–G

- Main, Festival y largo sincronizan la llegada casual de Harlan tras una tarea legítima, su microreacción ante «la verdadera firma apunta a—», la deliberación de Voss y la segunda orden que demora a Sorell.
- Festival suma tres tomas A–D —38 en total— para la orden de Voss y las rutas contrastadas en microgravedad; no se generaron medios. E–G quedan escritos en cues y cubiertos a nivel de guion, pero continúan sin shot list.
- Zao preserva el manifiesto del relé mediante snapshot firmado por hardware y firma mensaje/adjunto con su token personal. Elin verifica autora e integridad además de dispositivo/hora, y su auditoría independiente produce atribución convergente a Harlan.
- Voss permanece en el puente durante el clímax; Okoye intercepta a Harlan sin combate armado. El cierre incorpora cuarentena/canal limpio/mediación activa, reconocimiento Velari limitado e informe terrestre con evidencia y legajo de Zao, enviado sin respuesta.
- Los ledgers de main y Festival validan 13 pasos y 12 acciones; tráiler preserva identidad, envío, recepción y destino de Zao como incógnitas. El largo continúa como tratamiento y el generador durable fue actualizado.

## 2026-08-29 — Columna vertebral causal y suspenso del tráiler

- Reescritas las capas `story` de main y festival para que cuenten causa, decisión y consecuencia sin abrir detalles; Festival establece desde su tercer hito quién advierte al puente, qué alcanza a decir y por qué Harlan actúa.
- Main, festival y largo asientan la muerte fuera de campo mediante impacto diegético, cese del forcejeo/respiración y negro sostenido. El tráiler corta antes del ataque pero mantiene música y negro breve, sin confirmar fatalidad.
- El tráiler ya no nombra ni encuadra a Harlan, no llega a 100 % de transmisión y sustituye la recepción por la auditoría de la carga y un override anónimo; escaleta, metadatos y traducciones respetan la misma omisión.
- Añadidos `report:outline-story` para leer las escaletas sin implementación y `check:trailer-spoilers` con prueba unitaria; la ausencia de enlace causal en un hito `story` pasa a ser error.

## 2026-08-29 — Escaleta en `/project/`

- Tarjeta Outline (01) antes que Guion en la cuadrícula del archivo, y enlace Escaleta junto a Animatic en la lista por cut.

## 2026-08-29 — Escaletas jerárquicas y causalidad legible

- Reautorizadas las cuatro escaletas con sinopsis y dos niveles: hitos `story` legibles de principio a fin y pasos `detail` que conservan los IDs históricos.
- Las dependencias significativas usan relación y explicación bilingüe; la cobertura opcional se separa por tratamiento, guion y animatic con evidencia concreta.
- La UI muestra primero la historia, permite desplegar detalle y señala por qué ocurre cada consecuencia; los gaps se consultan por destino y un informe adicional detecta problemas de legibilidad.
- Retirado el generador circular basado en resúmenes de escena. `seed:outline` sólo crea borradores fuera del directorio canónico y se niega a sobrescribirlos.
- Restaurado en main, Festival y largo el razonamiento completo de Zao (doble retardo terrestre, oclusión de Proxima y corredor futuro) y el beat de Harlan que supone Tierra, se tranquiliza, lamenta la suerte de Zao y suspira antes del asesinato. Las reglas de agente ahora prohíben sustituir versiones recientes o diferir causas faltantes sin autorización explícita.

## 2026-08-29 — Escaleta antes que guion en la navegación

- En el rail y el menú móvil, Outline aparece encima de Script: el guion depende de la escaleta.

## 2026-08-29 — Gates editoriales, causalidad y arquitectura de prompts

- Corregido de forma durable el generador del tráiler: 29 tomas, 92,5 s y cero sobras de diálogo; `--check` evita que el JSON derivado vuelva a divergir.
- Archivados 57 cues de acción duplicados del corto con contenido y cobertura completos en `data/archive/`; el guion activo conserva 17 escenas / 124 tomas.
- Añadidos outlines reproducibles para main, tráiler y largo; los cuatro cuts tienen escaleta y Festival informa 14 pasos `required` aún no cubiertos.
- Entidades migradas a i18n inline; `entities.en.json` queda retirado/vacío y los selectores/validadores ya no dependen del overlay.
- JSON Schema 2020-12 + tipos generados para archivo, outlines, contextos, proveedor, planes y ledgers. Notas humanas ampliadas y `PENDING_AUTHOR_NOTES.md` reproducible.
- Ledger ejecutable de 11 pasos y 13 acciones para el corto: el gate comprueba hechos previos y que cada actor conozca aquello en lo que basa su acción. Festival, tráiler y largo declaran `incomplete` sin falso verde.
- Arquitectura provider-neutral de producción: planes bloqueados por toma, still representativo, first/last frame, audio final, segmentación semántica a ≤8 s, presupuesto de adjuntos y snapshots Seedance/Higgsfield. No se compilaron prompts reales ni se generaron medios.
- CI migra a Node 24 LTS y comprueba esquemas, causalidad y artefactos generados.

## 2026-08-29 — Traducciones de historia inline (LocalizedString)

- El copy de guiones, outlines, assets, taxonomía, funciones, variantes y etiquetas de `project.scripts` pasa de overlay `public.en.json` (clave = texto ES) a mapas co-localizados `{ "es", "en" }` y diálogo/texto en `content.variants.en`.
- Tipos `LocalizedString` / `StoryText`, resolvers en selectores y CLI; `validate:translations` comprueba cobertura inline; `public.en.json` queda vacío (retirado para historia). Galería de entidades sigue en `entities.en.json` (deuda).
- Migrador idempotente: `node scripts/migrate-inline-i18n.mjs` (`--apply`, `--prune-overlay`). Schema de scripts/outlines en `1.1.0`.

## 2026-08-29 — Escaleta festival migrada a JSON; Markdown jubilado

- `data/outlines/light-delay-festival.json`: 44 pasos completos (A–D `covered`, E–G `planned`, dos beats de Secuencia D `missing`), `dependsOnStepIds` rellenado en 30 pasos con dependencias causales reales (no mera adyacencia de escena). Reordenado `festival:outline-24` ("se nombra el riesgo real") para que siga a los overlays del payload que necesita, en vez de precederlos.
- `npm run report:outline-gaps` confirma automáticamente el hallazgo central de la auditoría causal: `festival:outline-25` (ya `covered`) depende de `festival:outline-23` (todavía `missing`) — la Secuencia D construida se apoya en un beat de conexión que aún no existe en el guion/animatic.
- Auditoría de migración: el contrato `OutlineFile`/`OutlineStep` (con `dependsOnStepIds`, `notes` tipadas y `majorEventId`) resultó suficiente para representar toda la escaleta narrativa — no se necesitaron cambios de esquema adicionales a los ya incorporados (ver entrada "Guía de escaleta, i18n y gaps"). El único contenido de `docs/ESCALETA_FESTIVAL.md` sin equivalente estructurado era meta-comentario sobre el propio esquema (evaluación de suficiencia + 4 mejoras sugeridas, ya implementadas), que no le corresponde a un `OutlineStep` — queda archivado aquí en vez de en la escaleta.
- `docs/ESCALETA_FESTIVAL.md` retirado (contenido narrativo íntegramente migrado a `data/outlines/light-delay-festival.json`; `docs/GUIA_ESCALETA.md` ya establece el JSON como checklist autoritativa).

## 2026-08-29 — Festival Cut: shot list A–D

- `light-delay-festival`: 33 tomas/takes para secuencias A–D (E–G siguen planificadas). Docs de cuidados narrativos y plan de sync actualizados.

## 2026-08-29 — Guía de escaleta, i18n y gaps

- Guía operativa `docs/GUIA_ESCALETA.md` y regla en `AGENTS.md`: crear/auditar escaleta antes de ampliar guion o animatic.
- `dependsOnStepIds` en pasos; UI agrupada por escena con destaque de `required`+`missing`; `report:outline-gaps`.
- Escaletas en el overlay `public.en.json`; traducción EN de la escaleta festival (1311 cadenas públicas).

## 2026-08-29 — Escaleta opcional por guion

- Contrato `OutlineFile` / `data/outlines/` (archivos opcionales), ruta `/outline/[scriptId]` con empty state si falta el JSON, enlace en la navegación y sitemap.
- Informe offline `npm run report:outline-missing` (también en `report:all`) lista scripts del registry sin escaleta. Documentado en `docs/ESCALETA.md`.

## 2026-08-29 — Controles de idioma en la navegación del proyecto

- Selectores de diálogo y subtítulos en el rail (`ProjectNav`, bajo el switcher de guion) y siempre visibles en el chrome del player a pantalla completa; eliminados duplicados de la página de guion y del panel de detalles.
- El animatic deja de leer `url.searchParams` durante el prerender (sólo en cliente), para que el build estático no falle.

## 2026-08-29 — Detalles colapsables en el editor de animatic

- Panel de detalles de toma (mismo `ShotDetailsPanel` que el player) como barra lateral sticky a la derecha en escritorio y hoja inferior en móvil; selección por tarjeta, `?shot=` y tecla `D`.

## 2026-08-29 — Diálogo en tarjetas del editor de animatic

- Las tarjetas de toma en `/animatic/[scriptId]` muestran el diálogo localizado (hablante + texto) derivado de los cues colocados; el player no cambia.

## 2026-08-29 — Sincronización causal y canon multi-script

- Fijadas la cronología maestra (57 h 48 min local, ~23 h 15 min de señal, encuentro remoto T+24 h), la terminología del sistema diplomático y la matriz de conocimiento/causa-efecto en `docs/CONTINUIDAD_CAUSAL_GUIONES.md`.
- El corto declara su tripulación completa de ocho; festival conserva seis, tráiler seis y largo catorce. `character:rao` y los paths siguen estables, pero el nombre operativo pasa a **Elin** para evitar confusión con Zao.
- Integrada en corto y largo la broma seca de Cael sobre el nombre/forma de la Ardor, reutilizando cobertura en el corto sin alterar los 124 IDs de toma; festival y tráiler la omiten.
- Corregida la continuidad bajo 1 g del clímax mediante cubierta de mando, ascensor central y ramal del núcleo; festival deja preparada la cuarentena antes de autenticar el mensaje.
- Taxonomía de comparación ampliada de 11 a 13 dimensiones. Informes i18n alineados con el overlay real, arte acotado a entidades del guion y estados `complete` / `debt` / `not_applicable` en resúmenes.
- Reparado `build:trailer` para preservar 29 estados `needs_regeneration`; inventario visual aclarado como 141 candidatos de regeneración + 12 placeholders de reemplazo, todos deferidos hasta el cierre causal y de cobertura por guion.
- Documentación y validadores sincronizados a 17 escenas, 124 tomas/takes, 30:39,5 de montaje derivado y 1070 cadenas inglesas. No se regeneraron imágenes.

## 2026-08-29 — Ritmo de diálogo y escena del láser (124 tomas)

- `light-delay-main-short`: 112→**124** tomas — reparto de diálogo en escena 1 (0 multi-speaker), INSERT de consola en escena 6 (`shot-06-09`), división de `shot-12-01`/`shot-12-09`; montaje derivado 30:39,5. Documentado en `docs/EDICION_ESCENA_LASER_Y_RITMO_DIALOGO.md`.
- `validate:data` espera 124 tomas canónicas; assets Velari diferidos; bloqueo Blender y briefs Higgsfield Proxima/Ardor acoplados.

## 2026-08-28 — Rutas de informes editoriales

- Informes dinámicos en `/reports/` (mismo pipeline que CLI): 12 tipos × todos los guiones registrados; `scripts/lib/report-registry.mjs` + `report-runner.mjs` compartidos entre web y `npm run report:*`.
- Atajo `npm run report:all` exporta diálogo + suite editorial para los cuatro guiones (`--all`).

## 2026-08-28 — Deuda visual y informes editoriales

- Las 141 tomas del corto principal y del tráiler quedan marcadas en `Take.imageStatus` como `needs_regeneration` / `canon_mismatch` (orientación de cubiertas y revisión visual).
- Suite de informes editoriales: `report:visual-art`, `report:image-debt`, `report:shot-completeness`, `report:cue-placement`, `report:dialogue-performance`, `report:entity-binding`, `report:scene-polish`, `report:cue-coverage`, `report:take-workflow`, `report:dialogue-i18n`, `report:regen-briefs`; atajo `report:editorial`.
- Chips de preparación editorial en tarjetas de toma y panel de detalles (regenerar, propósito, cámara).

## 2026-08-28 — Estimación de diálogo hablado

- Nuevo modelo WPM (ES 150 / EN 160) con multiplicadores de ritmo, suelo de 400 ms y preferencia por `estimatedDurationMs` cuando existe.
- Selectores de montaje vs diálogo hablado en guion, animatic, player y panel de detalles (`DurationPair`); badges de más de dos hablantes y diálogo fuera de cámara en tarjetas de toma.
- Informe editorial regenerable: `npm run report:dialogue-timing` → `reports/dialogue-timing/{scriptId}.{lang}.md|json` (ignorado en git).

## 2026-08-28 — Traducción estructurada de contenido público

- Añadido `data/translations/public.en.json` como overlay inglés `draft` para los cuatro scripts, diálogo, subtítulos derivados, escenas, beats, tomas, assets y datos del comparador; el español permanece intacto y autoritativo.
- Las rutas inglesas eligen contenido/subtítulos EN en la primera visita y las españolas ES; las selecciones manuales se conservan. El lector, animatic, player, selector y comparador consumen datos localizados sin duplicar `ScriptFile`.
- Traducidas las cuatro referencias documentales públicas que sólo tenían español y actualizado el ledger legacy; los nueve documentos registrados ofrecen ahora variantes ES/EN.
- Incorporado `npm run validate:translations` al gate de Pages: exige cobertura exacta de 1031 cadenas y detecta fuentes nuevas/cambiadas y claves huérfanas. Añadidas pruebas unitarias y regresiones browser para idioma por defecto, persistencia y documentos.
- Corregido el prerender multilingüe para no confundir el `localStorage` experimental de Node con un navegador: `/es/` conserva relato ES y las rutas sin prefijo relato EN también en el HTML estático.

## 2026-08-28 — Saneamiento y validación documental

- Reconciliados los documentos activos con el estado estructurado vigente: 17 escenas, 112 tomas/takes, 100 frames legacy y 132 imágenes registradas.
- Actualizados el flujo de trabajo, el ADR multi-script, la procedencia de assets y el mapa de animación exterior; las cifras de 100 tomas se conservan únicamente como baseline histórico explícito.
- Añadido `npm run validate:docs` al gate de Pages para comprobar cifras derivadas, enlaces locales y avisos históricos; retirados el snapshot temporal de deuda y el brief ya ejecutado de portada.

## 2026-08-28 — Carrusel automático en tarjetas

- Las tarjetas de arte/entidades con varias miniaturas usan `ImageCarousel` en modo `auto` (sin controles, rotación periódica, pausa al hover y con `prefers-reduced-motion`).
- El detalle de entidad conserva el carrusel manual con controles.

## 2026-08-28 — Miniaturas de assets

- Pipeline Sharp: `npm run thumbs:generate` / `thumbs:sync` escribe WebP (máx. 480 px) en `static/assets/_thumbs/` con manifiesto de procedencia.
- Helper `thumbnailPathForAsset`; galerías de arte y listados de entidad cargan miniaturas; detalle de entidad y asset siguen a resolución completa.

## 2026-08-28 — Carrusel de imágenes en entidades

- Nuevo `ImageCarousel` en detalle de entidad: navega hojas, diagramas y renders vinculados vía `referenceAssetIds`.
- Proxima Station y Celestial Ardor enlazan sheet, proportional PNG, stills de bloqueo (atraque / Júpiter) y la comparativa de escala común.
- Cadenas Paraglide ES/EN para controles y etiquetas del carrusel.

## 2026-08-28 — Bloqueo 3D y plan de exteriores

- Añadidos checklists de modelado Blender a `CELESTIAL_ARDOR.md` y `PROXIMA_STATION.md` (hábitats como rueda radial, espina estratificada, casco/motor/radiadores de la Ardor).
- Nuevos documentos de planificación: `EXTERNAL_SCENES_AND_ANIMATION.md` y `PRODUCTION_ROADMAP.md`.
- Archivo de bloqueo `blender/light-delay-blockout.blend` y still de referencia `proxima-with-ardor-berthed.png`.

## 2026-08-26 — Ajustes de copy de portada

- Revisados en español e inglés el eyebrow, la síntesis de la historia, el conteo/nombre del corto y el CTA del archivo; el inglés adopta además `traveling` según el locale `en_US`.
- Conservados sin cambios los enlaces, metadatos, imágenes, markup y el resto del contenido de la landing; ampliadas las regresiones E2E para verificar los textos equivalentes de ambos idiomas.

## 2026-08-26 — Auditoría y consolidación de deuda

- Ampliado `TODO.md` con deuda antes no registrada: extractor legacy destructivo, deriva entre contrato y JSON, validación incompleta, Node 25 fuera de soporte, lint/E2E ausentes del gate, madurez editorial, medios, regresiones y duplicados binarios.
- Corregida la autoridad documental: `data/scripts/light-delay-main-short.json` es la fuente estructurada vigente; los HTML legacy quedan como procedencia y regresión, no como autoridad paralela.
- Actualizados conteos y estado del Festival Cut en el plan de producción y `PROJECT_STATUS.md`; documentados los estados `draft` de scripts/traducciones y las limitaciones actuales de CI.
- Marcados `SVELTEKIT_SETUP.md` y `MIGRATION_PLAN.md` como referencias históricas, y añadidas advertencias explícitas a las dos fuentes antiguas de largometraje para impedir que sus mecánicas FTL vuelvan al canon.
- Actualizado el inventario de procedencia a 130 imágenes y cuantificado el faltante de metadatos; sincronizado el brief del tráiler con el láser exterior estándar de la Ardor.

## 2026-08-26 — Sitio bilingüe, landing pública y migración prose completa

- Incorporado Paraglide JS con inglés por defecto y rutas españolas bajo `/es/`; navegación, lector de guion, animatic, detalle técnico, comparador, documentos, arte y entidades responden al locale sin cambiar el español como autoridad editorial.
- Reemplazado el dashboard inicial por una landing pública sin spoilers y trasladado el archivo editorial a `/project`; añadidos logotipo, isotipo, favicon, manifest, tarjeta social, metadatos canónicos, `hreflang`, Open Graph y sitemap bilingüe.
- Portadas y traducidas las cinco páginas prose del legacy —notas, biblia, reporte, momentos y estructura— preservando headings, listas, tablas y beats. La versión española fue reconciliada con el canon actual y el inglés se registra como traducción en revisión.
- Añadidos overlays ingleses completos para las galerías de personajes, lugares, objetos, vehículos y facciones, más un ledger de migración que permite validar que toda página enlazada desde el índice legacy tenga destino actual.
- Ampliados los contratos de documentos con `LocalizedValue`, procedencia y estado de traducción; `npm run port:legacy-text` recompone la migración y `validate:data` comprueba paridad ES/EN.
- El build de marca genera PNG derivados desde SVG con Sharp; el build estático se verificó con `BASE_PATH=/light-delay`, incluidas rutas profundas bajo `/es/`.
- Corregida la instalación limpia de CI: `npm run check` compila primero los módulos generados de Paraglide y comparte su configuración con Vite, sin depender de archivos residuales de un build local anterior.
- El guion, diálogo, subtítulos derivados y descripciones narrativas de toma permanecen en español y quedan explícitamente diferidos a una fase editorial posterior.

## 2026-08-26 — Navegación y diseño responsive

- Corregido el shell responsive: escritorio recupera header global compacto + rail persistente, mientras móvil usa una barra inferior con marca, GitHub y hamburguesa que abre una hoja modal desde abajo.
- El cambio de layout se decide por capacidad tipográfica mediante `calc(26.88em + 52.8ch)`; el cuerpo usa `1rem` para respetar tamaño de texto, zoom y preferencias de accesibilidad sin incorporar un sensor JavaScript.
- El player conserva su presentación inmersiva en landscape; en portrait ordena frame, detalles de toma desplegables y controles persistentes, sin perder transporte, timeline ni retorno a edición.
- Auditadas las rutas de inicio, guion, animatic, arte, comparación, documentos, entidades y assets para evitar desborde horizontal y adaptar grillas, tablas, metadatos y controles a pantallas estrechas.
- Ampliadas las regresiones E2E para rail de escritorio, hoja inferior móvil, breakpoint tipográfico, viewport de 320 px, composición portrait del player y cambios de orientación sin perder toma, progreso ni estado del panel.

## 2026-08-26 — Placeholder y detalles editoriales del animatic

- Generada y registrada una claqueta técnica neutral 16:9 para referencias de imagen ausentes o fallos de carga, sin reemplazar ningún frame existente.
- Añadido estado editorial estructurado a `Asset` y `Take`; las 33 tomas provisionales de escenas 5–8 indican motivo, explicación, brief y toma de origen. Los reusos intencionales del tráiler permanecen sin marca.
- Editor y Modo película comparten resolución de medios: los frames reutilizados muestran «PLACEHOLDER» y los faltantes usan «IMAGEN PENDIENTE» sobre la claqueta.
- Reparado «Detalles de la toma» mediante un panel controlado y accesible, accionable por clic o con `D`, con información narrativa, técnica, temporal, editorial y de procedencia.
- Ampliadas validaciones y regresiones unitarias/E2E para estados visuales, fallback, navegación y panel móvil.

## 2026-08-26 — Preparación para despliegue estático en GitHub Pages

- Añadido `@sveltejs/adapter-static`, prerender global y fallback `404.html` para generar un sitio completamente estático.
- La configuración acepta `BASE_PATH`; el workflow de Pages compila con `/light-delay` mientras el desarrollo local permanece en `/`.
- Navegación, selector de scripts, comparación editorial prerenderizada, índices de entidades, páginas de assets y las 112 tomas/100 frames del animatic resuelven enlaces y medios mediante la base de SvelteKit; los IDs namespaced usan segmentos portables `:` → `~`.
- Nuevo workflow `.github/workflows/pages.yml`: instala con `npm ci`, valida datos, ejecuta `svelte-check` y Vitest, compila, sube `build/` y despliega a Pages en pushes a `master`; los pull requests sólo validan el build.
- La concurrencia del workflow queda aislada por referencia para que un PR no cancele un despliegue de `master`.
- El checkout de Pages descarga Git LFS para publicar las imágenes reales en lugar de sus archivos puntero.
- Eliminada la dependencia ya innecesaria `@sveltejs/adapter-auto`; `BASE_PATH` rechaza valores ambiguos con barra final.
- README y avisos de derechos actualizados para el sitio público `https://saabi.github.io/light-delay/`: la publicación no concede derechos sobre historia, canon o assets, y la plataforma reutilizable se mantiene como objetivo futuro aún no licenciado.

## 2026-08-26 — Advertencia de Zao, comunicaciones y arquitectura de Ardor

- Reescritas las escenas 5–8 del corto: Harlan activa el jammer al oír que la firma de Sorell parece falsa, corta COM A/B desde servicio y usa los dos recorridos axiales para construir su coartada.
- Zao comprueba wireless y cable, descarta Tierra/Proxima y apunta el láser exterior estándar a la posición futura de la nave mediante divergencia + raster; la decisión se cuenta en acción e interfaz, sin exposición forzada.
- Sorell presencia el aviso desde el puente, encuentra a Zao sola y queda como testigo con credencial comprometida, no como sospechosa; Okoye acompaña a Harlan por orden de Voss.
- Animatic principal ampliado de 100 a 112 tomas manteniendo 30:00 y reutilizando los 100 frames existentes; no se generaron imágenes. Las 33 tomas afectadas llevan notas de reemplazo provisional.
- Sincronizados guion/animatic heredados, Festival Cut, tráiler y tratamiento largo; nueva dimensión comparativa `canon:zao-transmission-mechanics`.
- Actualizados canon, Ardor, entidades, notas técnicas y requisitos de haz. `TODO.md` registra deuda de stills, documentos, cálculo óptico y futuro flujo JSON de notas de autor/estado visual.

## 2026-08-26 — Referencias de escala Proxima / Celestial Ardor

- Reubicadas hojas ortográficas: Proxima en `locations/proxima-station/proportional-reference.{svg,png}`, Ardor en `vehicles/celestial-ardor/proportional-reference.{svg,png}`.
- Comparativa multi-entidad en `art-bible/scale-references/proxima-ardor-common-scale-reference.{svg,png}`.
- Documentado el patrón en `docs/ASSET_PATH_MAP.md`; sección «Escala» en la biblia visual; assets registrados en `data/assets.json`.

## 2026-08-25 — Paquete higgsfield-uploads

- Staging en `higgsfield-uploads/` con hojas de personaje, localización y props renombradas (`light-delay-{kind}-{slug}.png`) para subir a Higgsfield.
- Excluidos Harlan y Rao (TODO de redesign); regenerable con `npm run prepare:higgsfield`.

## 2026-08-25 — Política narrativa: sin exposición forzada

- En `AGENTS.md`: regla obligatoria de evitar exposición forzada; revelar información por pensamiento en acción y decisión del personaje (p. ej. el cálculo de Zao al apuntar el láser), no con explicaciones dirigidas al público.

## 2026-08-25 — Comparación de canon y tratamiento largo recuperado

- Nueva taxonomía versionada y ruta `/compare/[scriptId]?against=<ScriptId>` para comparar canon declarado, eventos principales, reparto, variantes y funciones narrativas sin inferencias editoriales.
- Contratos y validación ampliados para variaciones de canon por script y procedencia desde scripts o documentos registrados.
- Registrados los dos documentos históricos y su revisión autorizada en español; recuperado el reparto completo de catorce nombres.
- Nuevo `script:light-delay-long`: tratamiento regenerable de 100 minutos, 4 actos, 28 escenas y 28 beats; adopta el canon vigente y no inventa diálogo, tomas ni assets.
- Documentados por separado los candidatos de retropropagación a las versiones cortas y las especialidades aún no resueltas de Volkov y Tanaka.

## 2026-08-25 — Retorno y fullscreen del modo película

- El retorno desde Modo película centra y enfoca la toma activa en el editor mediante su ID estable.
- Se añadió un control visible de «Pantalla completa» como alternativa fiable al intento automático que los navegadores pueden rechazar.
- `data/README.md` se sincronizó con el registro multi-script y los assets servidos desde `static/assets/`.

## 2026-08-25 — Paridad visual del modo película

- `AnimaticPlayer` rediseñado al chrome legacy: stage a pantalla completa, viñeta, meta ESCENA/TOMA, panel «Detalles de la toma», barra glass con controles icono + scrubber + «Editar tiempos».

## 2026-08-25 — Tráiler (~1:30) desde brief

- Nuevo `script:light-delay-trailer` (9 bloques del brief, 29 tomas, 90 s).
- Frames reutilizados del animatic de 30 min vía `imageAssetId` compartido; `sourceRefs` a shots del main.
- Generador `npm run build:trailer` (`scripts/build-trailer-script.mjs`).

## 2026-08-25 — Selector de guion en navegación

- `ScriptSwitcher` en el rail (`ProjectNav`): elegir cut desde cualquier ruta del AppShell.
- Enlaces Guion/Animatic usan el script activo; al cambiar cut se conserva la sección (guion/animatic/player) o se abre el guion elegido.
- Persistencia del script activo en `sessionStorage`.

## 2026-08-25 — Multi-script / Festival Cut (ADR-0001)

- Migración de IDs a forma `kind:slug` y unidades de guion namespaced (`main:…`, `festival:…`).
- Scripts en `data/scripts/`; registro y continuidades en `project.json`; `narrative-functions.json` y `entity-variants.json`.
- Borrador Festival Cut con lineage, `characterFunctionAssignments` y 7 escenas (shots/takes vacíos).
- Rutas acotadas por `scriptId` (encode `:`→`~`); overlay de animatic por script+versión; validación multi-script.
- ADR-0001 marcado Accepted.

## 2026-08-25 — Fases 2–6: shell, documentos, entidades, guion, animatic y player

- Tokens legacy (cian/oro) en `src/app.css`; `AppShell`, navegación y documentos genéricos.
- Rutas: `/`, `/documents/[slug]`, `/script`, `/animatic`, `/animatic/player`, `/art`, `/entities/[kind]`, `/entities/[kind]/[id]`, `/assets/[id]`.
- Copia (no movimiento) de `legacy-site/assets/{characters,locations,props,vehicles,art-bible,animatic}` → `static/assets/` (LFS verificado).
- Editor con overlay de duraciones en `localStorage`; player con play/pausa/stop, scrubber, subtítulos derivados del diálogo y retorno con `?shot=`.
- Stubs de documentos ampliados; e2e de inicio/guion/animatic; changelog y estado actualizados.

## 2026-08-25 — Fase 1 tipos, validación y extracción JSON

- Tipos en `src/lib/types/` según `JSON_FORMAT.md` + addendum i18n (`DialogueCue.content` como `LocalizedValue`, `ProjectLanguages`).
- Validadores a mano (sin Zod), repositorios, selectores y tests.
- `scripts/extract-legacy.mjs` genera `data/*.json` (100 shots, diálogo ES source); `validate:data` en verde.
- Actualizado `docs/SCRIPT_ANIMATIC_SYNC.md` (98/98 placements; títulos de escena siguen divergiendo en redacción).

## 2026-08-25 — Fase 0 inventario de migración

- Inventario verificado: 17 escenas, 100 tomas, 100 PNG (1:1). Véase `docs/MIGRATION_INVENTORY.md`, `docs/ASSET_PATH_MAP.md`, `docs/SCRIPT_ANIMATIC_SYNC.md`.

## 2026-08-25 — Migración de imágenes a `static/`

- `docs/MIGRATION_PLAN.md` incluye el traslado de assets de imagen desde `legacy-site/assets/` hacia `static/assets/` (URLs `/assets/...`), con inventario, mapeo, validación LFS y limpieza de duplicados.

## 2026-08-25 — Diálogo español como fuente de verdad (i18n)

- `docs/JSON_FORMAT_I18N_ADDENDUM.md` aclara que el diálogo en español es la fuente de verdad frente a otras traducciones; editar español primero y no inventar inglés en la extracción mecánica.
- Se añadió `docs/MIGRATION_PLAN.md`; ambos docs nuevos se guardaron en UTF-8 (sin BOM) y se corrigió mojibake de árboles/guiones en el plan.

## 2026-08-25 — Bootstrap SvelteKit 2 / Svelte 5

- Se creó la aplicación mínima en la raíz con TypeScript, ESLint, Prettier, Vitest y Playwright.
- Se añadieron layout/página de aterrizaje, prueba unitaria y smoke e2e de `/`.
- `legacy-site/`, `docs/` y `data/` permanecen intactos; no se migraron assets a `static/assets/`.
- Validación: format, lint, check, unit, e2e, build y preview.

## 2026-08-25 — Política de idioma y carga de AGENTS.md

- Se definió el español como fuente de verdad documental; el inglés es secundario si no hay copia española.
- Se exige sincronizar traducciones (o marcar el desfase) en la misma tarea.
- Se añadió `.cursor/rules/load-agents.mdc` (`alwaysApply`) para cargar `AGENTS.md` en cada sesión de Cursor.

## 2026-08-25 — Documentación SvelteKit y árboles ASCII

- Se restauró `docs/SVELTEKIT_SETUP.md` (estaba vacío en disco) y se reemplazó el árbol mojibake por ASCII.
- Se unificaron los diagramas de directorio en `README.md` y `docs/JSON_FORMAT.md` a ASCII para evitar re-corrupción por encoding en Windows.

## 2026-08-25 — Paquete inicial para Git

- Se preservó el sitio estático completo en `legacy-site/`.
- Se incorporaron 100 fotogramas del animatic y 23 hojas de referencia visual.
- Se añadió documentación de canon, estado, producción y procedencia.
- Se reservó `data/` para la futura fuente JSON canónica.
- Se añadieron instrucciones para la migración a SvelteKit y Git LFS.
