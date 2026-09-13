# Outline-fidelity audit — Festival-master

**Status: Pass 1 (report) and Pass 2 (fixes) both complete.** See §"Pass 2 —
fixes applied" at the end for exactly what changed.

Non-authoritative production audit, companion to
`docs/production/GRAVITY_AUDIT_FESTIVAL_MASTER.md`. Same method, generalized:
a fact declared once at a higher layer (an outline, `data/production/
contexts.json`, `data/objects.json`, or a `Scene`/`Shot` field) is invisible
to a still-image generator unless it is restated in that shot's own
`Shot.description`/`Take.generation.prompt` — the model never sees the
outline, the scene record, `contexts.json`, the object catalog, or any other
shot (`docs/production/DIALOGUE_AND_PROMPT_LESSONS.md` §2c).

Sections A–G below are the original Pass 1 findings, unedited. The user
reviewed and approved the full proposed fix list; every item was then applied
(Pass 2) — see the final section for exactly what changed and how it was
verified.

## Summary

| Category | Result |
|---|---|
| A. `contexts.json` rules vs. shot prompts | **1 contradiction** (16 shots) |
| B. `Scene.setting.continuity` accuracy | **1 stale value** (scene-25) |
| C. Ship geography (`master:framing-setting`) | **1 contradiction** (1 shot) + **7 under-specified** shots |
| D. Object/prop visual grounding | **3 objects** with zero/thin grounding, one missing its reference sheet entirely |
| E. Character-presence fidelity | **21 misses** across 11 shots (mixed confidence) |
| F. Light confirmation passes | Clean — no fix needed |
| G. Noted, not in scope | 1 optional cleanup item (excess, not missing) |

---

## A. `data/production/contexts.json` rules vs. shot prompts

All 9 contexts' `physics`/`visualRules`/`soundRules` were checked against
their assigned scenes' shots.

### A1 — CONTRADICTION: hazardous-object rule vs. the generic microgravity sentence

`context:ardor-remote-cutoff-transition` (scenes 26–27) and
`context:ardor-post-climax-microgravity` (scenes 28/29/31/32, added during
the gravity-audit Pass 2) both declare:

> *"Do not show unsecured hazardous objects. Only straps, flexible cables,
> hair, and secured items rise."*

But **16 shots** in exactly those scenes instead carry the generic
microgravity sentence added by the gravity audit:

> *"Microgravity: hair, loose straps, tools, and small debris drift freely;
> bodies move by handhold, not footing."*

"Tools... drift freely" directly contradicts "do not show unsecured
hazardous objects" — most acutely in `shot-plan-081`, set inside the inner
shielding vault next to the armed bomb
(`asset:object-proxima-geophysical-impulse-package-sheet` is attached to that
very take).

Affected shots: `shot-plan-077, 078, 079` (scene-26), `080, 081, 082`
(scene-27), `083, 084, 085` (scene-28), `086, 087, 088` (scene-29), `093, 094`
(scene-31), `095, 096` (scene-32).

**Proposed fix (Pass 2):** replace the generic sentence in these 16 takes
with a hazard-safe variant consistent with the context's own visual rule,
e.g. *"Microgravity: hair and secured straps drift; no loose tools or
unsecured hazardous debris — only already-secured items move."*

### A2 — other contexts checked, no contradiction found

- `context:ardor-remote-cutoff-transition`'s staging note ("before cutoff,
  Harlan blocks the primary actuator using footing... afterward Okoye
  redirects his momentum with handrails and a tether") — `shot-plan-078`
  ("...redirect Harlan's momentum and tether him to a rail") matches. The
  "before cutoff, footing" half of the beat isn't depicted in any single
  Festival-master shot, but nothing contradicts it either — likely just
  compressed out of this cut. No fix proposed.
- `context:zao-optical-transmission` ("dedicated physical route... aims at
  the ship's future corridor... without forced explanatory exposition") —
  `shot-plan-031/035/060/095/096` read as specific and non-expository
  ("narrow divergence sweep," "TRANSMITTED," never an aim point). Clean.
- `context:ardor-docked-at-proxima` / `context:proxima-dock` ("do not depict
  the interior as already in transit" / "not inside a giant hangar") —
  title/`shot-plan-001/004/006` all read as appropriately docked/pre-transit.
  Clean.
- `context:ardor-operational-displays` (English-only display text) —
  confirmed well-covered across the script (already noted in the gravity
  audit).
- `context:ardor-exterior-vacuum`'s sound rule (no diegetic sound in vacuum)
  — not yet actionable; no takes carry an audio component today. Flagged as
  a forward-looking risk only (already documented in `DIALOGUE_AND_PROMPT_
  LESSONS.md` §2c/`SEEDANCE_PROMPTING.md` §6 for when video/audio prompts
  begin).

---

## B. `Scene.setting.continuity` accuracy

All 33 scenes checked against the gravity audit's final timeline. Every
scene uses one of two boilerplate sentences ("Follow the master-derived
flight state stated in action." for 1g scenes; "Microgravity; follow the
stated flight event." for MG scenes) — **except one**:

### B1 — STALE: scene-25

`festival-master:scene-25`'s `setting.continuity.en` still reads
*"Microgravity; follow the stated flight event."*, left over from before the
gravity audit confirmed and fixed scene-25 as **1g** (Finding B of the
gravity audit — `shot-plan-074/075/076`'s prompts were corrected, but this
Scene-level field was never touched).

**Proposed fix (Pass 2):** change to *"Follow the master-derived flight
state stated in action."*, matching the other 1g scenes (20–24).

All other 32 scenes' `continuity` values are consistent with the confirmed
timeline (including 28/29/31/32, correctly "Microgravity" per the gravity
audit's Finding A resolution).

---

## C. Ship/station geography (`master:framing-setting`)

`master:framing-setting` establishes three parallel shafts between decks: a
speed-governed elevator, **a central shaft with two helical staircases**,
and **a narrower service shaft divided into ladder segments** — confirmed
distinct in the reference-sheet metadata (`location:celestial-ardor-
central-access` → `stairSystem: "two-helical-staircases-with-continuous-
railings"`; `location:celestial-ardor-service-cylinder` →
`stairSystem: "ladder-segments-not-helical-stairs"`).

### C1 — CONTRADICTION: `shot-plan-028` puts a helical stair in the ladder-only shaft

`shot-plan-028` is set at `location:celestial-ardor-service-cylinder` (the
ladder shaft) but both `Shot.description.en` and `Take.generation.prompt`
say Sorell "moves hand-over-hand down **the slower helical stair**" — the
wrong structure for this location, and its own `Setting:` clause elsewhere
in the same prompt correctly describes the service cylinder as having no
stairs at all ("peripheral technical trays, maintenance handholds..."), so
the prompt contradicts itself.

This also conflicts with the story's own established relative speed: in
`shot-plan-027`, Sorell explicitly takes the service route because it's
**faster** ("I can reach her faster than I can repair a repeater"), and
`shot-plan-045b` later confirms "quick through the service shaft and slow
through the central route" — but `shot-plan-028` calls Sorell's route "the
**slower**" one. Both the structure name and the relative-speed
characterization are backwards.

**Proposed fix (Pass 2):** rewrite to something like *"...moves hand-over-
hand down the service shaft's ladder segments..."* and drop "slower" (or
replace with "faster," matching 027/045b).

### C2 — MISSING (under-specified): 7 of 8 central-access shots never restate the twin-staircase geometry

Only `shot-plan-074` (added during a targeted disambiguation for the climax
chase) restates the twin-staircase detail explicitly, with a matching
negative-prompt guard against merging the two staircases into one. The other
7 shots at `location:celestial-ardor-central-access`
(`shot-plan-013, 014, 015, 054, 055, 056, 076`) describe the space only
generically ("a long handrail-lined trunk with rest landings and hatches"),
relying entirely on the attached reference image to carry the twin-staircase
geometry.

**Proposed fix (Pass 2):** fold `shot-plan-074`'s already-approved geometry
phrasing into these 7 shots' `Setting:` clauses (prompt-only; their
descriptions don't need the geometry detail restated in prose, matching the
established convention).

### C3 — other locations checked, no contradiction found

Reactor-service-bay (23 shots) and inner-shielding-vault (8 shots) — spot-
checked every shot mentioning a distance/orientation word; none contradicts
the "~65 m aft of bridge" fact or the vault/bay relationship.
`shot-plan-077`'s "fifteen metres above" is an internally-consistent detail,
not sourced from `framing-setting`, and not contradicted elsewhere.
Proxima Station and docking shots: clean (see A2).

---

## D. Object/prop visual grounding

`data/objects.json` has 8 entries; 3 carry an **open, high-priority "visual
reference pending"** note, meaning their reference-sheet asset is itself not
yet confirmed authoritative:

| Object | Catalog description exists? | Reference sheet | Shots referencing it |
|---|---|---|---|
| `object:proxima-geophysical-impulse-package` (the bomb) | Yes, detailed (1.3 t, multi-megaton, protected controller, scientific service input) | Pending | `020, 021, 062, 081, 082` |
| `object:harlan-wrist-device` | Yes (activates jammer, controls vault lock) | Pending | `017, 024, 039, 044, 070, 071, 078, 080` |
| `object:time-reference-diagnostic-unit` | Yes, and explicitly requires it "look identical across the two separated scenes where it appears" (beat-19 and beat-27) | Pending | `056` (planted, beat-19), `081` (connected, beat-27) |

**None of these 13 shots restate any part of the catalog's own physical/
functional description in prose** — appearance and function are 100%
delegated to a reference sheet that the catalog itself flags as not yet
trustworthy. This is the same failure shape as gravity (a fact exists one
layer up and never gets restated), compounded by the sheet not being solid
ground to fall back on either.

### D1 — MISSING (worse case): `shot-plan-056` doesn't even attach the diagnostic unit's reference sheet

`shot-plan-081` (the second appearance, beat-27) attaches
`asset:object-time-reference-diagnostic-unit-sheet`. **`shot-plan-056` (the
first appearance/planting, beat-19) attaches no reference for the object at
all** and describes it only as "a small diagnostic instrument" — given the
catalog's own continuity requirement (must look identical in both scenes),
this is the highest-confidence, highest-risk gap in this category: the first
appearance has neither a picture nor a description to anchor to.

**Proposed fix (Pass 2):**
- Attach `asset:object-time-reference-diagnostic-unit-sheet` to
  `shot-plan-056` (it's the same object; the sheet should govern both, even
  while "pending" — that flag is about master-derived confirmation, not
  about whether to use it at all).
- Thread a short physical/functional descriptor drawn from each object's
  own catalog `description` into all 13 shots' `Shot.description`/prompt —
  e.g. for the bomb, something like "a dull, roughly human-height
  cylindrical device with an illuminated countdown controller"; for the
  wrist device, "a compact wrist-mounted control unit with a small
  screen." Exact wording to be drafted from each catalog entry, not
  invented from scratch.
- Flag the underlying "reference sheet pending" catalog notes prominently
  in the fix-list as a dependency this audit cannot itself close — that's a
  separate asset-generation task.

---

## E. Character-presence fidelity

Mechanical check: for every shot, for every `Shot.visibleRefs` entry marking
a character physically present (i.e. not "off-screen"/"not visible"/
"remains below"/similar), does that take's `referenceAssetIds` include the
character's canonical sheet? 329 present-character instances checked; **21
misses across 11 shots**. Composition size is included below as a rough
confidence signal — wider shots (MS/ELS/OTS) are more likely genuine gaps
(a background character the frame should show), tighter ones (CU/INSERT/
MCU) are more likely legitimate compositional exclusions, but this
distinction needs a human's judgment per shot, not an automated one.

| Shot | Composition | Character(s) missing their sheet | Confidence |
|---|---|---|---|
| `shot-plan-023` | INSERT | Rao, Okoye | Low — tight insert |
| `shot-plan-046` | OTS | Okoye | Medium |
| `shot-plan-057` | CU | Sorell | Low — tight CU |
| `shot-plan-080` | MS | Okoye, Harlan | **Higher** |
| `shot-plan-081` | CU | Voss, Okoye, Harlan | Low — tight CU |
| `shot-plan-083` | INSERT | Harlan | Low — tight insert |
| `shot-plan-084` | MCU | Harlan | Medium |
| `shot-plan-085` | ELS | Harlan | **Higher** — wide shot |
| `shot-plan-086` | MS | Okoye, Harlan | **Higher** |
| `shot-plan-087` | CU | Rao, Okoye, Harlan | Low — tight CU |
| `shot-plan-088` | OTS | Voss, Rao, Okoye, Harlan | **Higher** — OTS implies ≥2 people in frame |

**Proposed fix (Pass 2):** for the "Higher" confidence rows, either attach
the missing character's sheet (if they should be visible in that framing)
or, on review, correct `Shot.visibleRefs` if the character was never
actually meant to be in that shot. The "Low"/"Medium" rows are likely fine
as-is (tight framings legitimately excluding people who are in the room but
not in frame) — recommend leaving them unless the user's review says
otherwise, per `DIALOGUE_AND_PROMPT_LESSONS.md` §6 (once established,
economy of restatement is correct, not a gap, and the same logic extends to
not needing every present-but-off-frame body pictured).

---

## F. Light confirmation passes — clean, no fix needed

- **Velari biology.** Only one shot (`shot-plan-092`) physically depicts the
  envoy, and it correctly restates the master's scale/anatomy ("roughly 2.5
  to 3 metres tall..."). No other Velari-station shot shows a body to get
  wrong. Clean.
- **Costume/equipment continuity.** Beyond the EVA-suit case
  `DIALOGUE_AND_PROMPT_LESSONS.md` §7 already documents (`shot-plan-092`),
  checked Harlan's tether/restraint continuity from capture (`shot-plan-078`:
  "tether him to a rail") through `shot-plan-079` ("tethered and
  restrained") — consistent, no drift. Clean.
- **On-screen numeric overlays.** Spot-checked in the prior research pass;
  consistently correct where present. Clean.

---

## G. Noted, not in this audit's core scope

**§6 reference-sheet economy — Harlan and Okoye are over-described, not
under-described.** Every shot using the older, richer prompt template that
includes a full `Cast:` description of Harlan or Okoye *also* attaches their
reference sheet — 100% overlap across roughly 30+ shots each. Per
`DIALOGUE_AND_PROMPT_LESSONS.md` §6, once a sheet is attached, heavy re-
description competes with it rather than helping; Voss/Sorell/Zao/Rao
already use the lighter "(matching her/his established reference sheet)"
form throughout, but Harlan and Okoye never got migrated to it. This is
**excess, not missing, information** — the opposite of everything else in
this report — so it's noted here as an optional cleanup item rather than
folded into the fix list above. Include in Pass 2 only if the user wants it.

---

## Proposed fix list (for review — nothing applied yet)

1. **A1** — 16 shots: swap the generic MG sentence for a hazard-safe variant (scenes 26–29/31/32).
2. **B1** — 1 field: fix `scene-25`'s `setting.continuity` to 1g.
3. **C1** — 1 shot: fix `shot-plan-028`'s wrong stair type + wrong relative speed.
4. **C2** — 7 shots: add the twin-staircase geometry clause to the remaining central-access shots.
5. **D1** — 13 shots: thread each object's catalog description into its shots' prose; attach the missing reference sheet on `shot-plan-056`.
6. **E** — up to 4 "Higher confidence" shots (`080, 085, 086, 088`): attach missing character sheets or correct `visibleRefs`, pending review of the rest.
7. *(Optional, not required)* **G** — lighten Harlan/Okoye's `Cast:` prose across ~30+ shots to match the established economy form.

Each applied fix followed the gravity-audit conventions: edit
`Shot.description` before/with the prompt where a durable fact is added,
prompt-only where only compiled phrasing changes, mark
`imageStatus: needs_regeneration` (`canon_mismatch`) on any take whose
prompt materially changes and already has an image, and re-run the full
validation suite afterward.

---

## Pass 2 — fixes applied

Items 1–6 were approved and applied exactly as proposed. Item 7 (G) was
**not** applied — it was explicitly marked optional/excess-not-missing and
out of this audit's core scope; it remains available as a future cleanup
pass if wanted.

1. **A1 (16 shots)** — `shot-plan-077` through `096` (scenes 26–29/31/32):
   replaced the generic *"Microgravity: hair, loose straps, tools, and small
   debris drift freely..."* sentence with a hazard-safe variant: *"Microgravity:
   hair and secured straps drift; no loose tools or unsecured hazardous
   debris — only already-secured items move."* No longer contradicts
   `context:ardor-remote-cutoff-transition`/`ardor-post-climax-microgravity`'s
   own visual rule.
2. **B1 (1 field)** — `scene-25.setting.continuity` corrected from
   "Microgravity; follow the stated flight event." to "Follow the
   master-derived flight state stated in action.", matching the other 1g
   scenes.
3. **C1 (1 shot)** — `shot-plan-028`'s description and prompt corrected from
   "moves hand-over-hand down the slower helical stair" to "moves
   hand-over-hand down the service shaft's faster ladder segments" (both the
   wrong structure type and the wrong relative speed are fixed; now
   consistent with `shot-plan-027`/`045b`). The prompt's `Setting:` clause
   now also explicitly notes "straight ladder segments (not a helix)".
4. **C2 (7 shots)** — `shot-plan-013, 014, 015, 054, 055, 056, 076`: the
   generic central-access `Setting:` clause was replaced with the
   twin-staircase geometry already used in `shot-plan-074`: "...its two
   helical staircases following the cylinder's curved wall and interlocking
   with each other at every landing, sharing one continuous inner railing."
5. **D1 (9 shots + 1 attachment)** — on closer inspection while implementing,
   a few of the originally-listed 13 shots already carried adequate visual
   language (`shot-plan-020`'s "squat, armored, tonne-scale device," `021`'s
   "small illuminated controller") and were left unchanged rather than
   overwritten. Concretely applied:
   - Attached the missing `asset:object-time-reference-diagnostic-unit-sheet`
     to `shot-plan-056` (the object's first appearance), so both of its
     appearances (`056` planted, `081` connected) now share the same
     reference, matching the catalog's explicit "must look identical"
     requirement.
   - Added a wrist-device visual descriptor ("a slim wrist-mounted control
     unit with a small illuminated screen") to `shot-plan-024, 039, 044, 071,
     078, 080` — the 6 shots that actually show the device on screen (`017`
     and `070` were left alone: `017` depicts a different object, Zao's own
     wrist dosimeter — noted below — and `070` only mentions the wrist
     device in forward-looking dialogue, not in frame).
   - Added the impulse-package descriptor ("a squat, armored, tonne-scale
     device", reused from `020` for cross-shot consistency) to `shot-plan-062,
     081`. `082` was left unchanged — the bomb is background context there,
     not the frame's subject.
6. **E (4 shots)** — `shot-plan-080, 085, 086, 088`: attached the missing
   character reference sheets (Okoye/Harlan for `080`; Harlan for `085`;
   Okoye/Harlan for `086`; Voss/Rao/Okoye/Harlan for `088`). While fixing
   these, found and corrected a **new instance of the same class of bug**:
   each of these takes' compiled prompt also carries a literal "Reference
   assets attached: ..." text list, which had gone stale relative to the
   `referenceAssetIds` array even before this pass touched it — updated to
   match. A whole-file scan afterward confirmed no other take has this
   drift.

All 33 changed takes (16 from A1, 7 from C2 minus overlap with A1's 083, 9
from D1, 4 from E, plus `028`'s own take — some takes appear in more than
one fix) had `imageStatus` set to `needs_regeneration` / `canon_mismatch`
with an explanation and `replacementBrief`, unless already so flagged by an
earlier pass. **No image was regenerated.**

**Incidental finding, not fixed:** `shot-plan-017`'s `referenceAssetIds`
includes `asset:object-harlan-wrist-device-sheet`, but the shot actually
depicts Zao's own wrist dosimeter, a different, uncataloged item — the
device itself never appears in that frame. Left as-is (removing a reference
wasn't part of the approved fix list, and the shot's own prose doesn't claim
the device is present), flagged here for a future pass.

### Verification

- `npm run validate:schemas` — OK (27 files).
- `node scripts/validate-data.mjs` / `validate-lifecycle.mjs` — OK.
- `npm run scrub:still-prompts:check` — unchanged (still exactly the 2
  pre-existing, unrelated leaks noted in the gravity audit).
- `npx vitest run src/lib/data/repositories/festivalMasterScript.spec.ts` —
  8/8 pass.
- `npm run production:plans` / `:check` — regenerated and up to date.
- Re-ran every category's mechanical check (hazard sentence, scene
  continuity, staircase phrase, reference-sheet attachment) against the
  fixed data: 0 remaining issues in any of them.
- Whole-file scan for `referenceAssetIds` vs. prompt-text "Reference assets
  attached" drift: 0 mismatches anywhere in the script.

---

## Pass 3 — two ship-geometry errors reported by the author

The author identified, and confirmed against the ship's own reference
blueprint (`static/assets/vehicles/celestial-ardor/specs/
ardor-sectional-cut-and-bridge-top-view.png` — one circular bridge deck: six
crew stations against the hull, a six-seat meeting table, and a central
shaft/stair with an **open** center; the elevator and service shafts are two
separate smaller circles beside it), two errors this audit's Category C
(ship geography) had not caught:

### Fixed

1. **A fabricated location, `location:celestial-ardor-command-vestibule`,
   was invented and wired throughout the data.** `location:celestial-ardor-bridge`'s
   own description already fully covers what the vestibule was invented to
   explain ("A helical stair wraps the central opening... The dark service
   hatch and adjacent tray remain hidden from the stations") — the vestibule
   entry instead described "two stairs" and "a landing," contradicting the
   bridge's own one-helical-stair description. None of the shots staging
   Harlan hidden from the crew (`shot-plan-023/024/044/045/045b`) ever needed
   a wall or door — concealment always came from the crew facing forward /
   backs turned, exactly matching "a different POV within the same bridge
   room."
   - Removed the `location:celestial-ardor-command-vestibule` entry from
     `data/locations.json` and its stale `refs` entry from
     `data/editorial-lifecycle.json`'s `lifecycle:master-required-entities`
     group (it was never actually named by the master outline).
   - Reworded every "command vestibule"/"service vestibule" mention in
     `data/scripts/light-delay-festival-master.json` (`scene-10`, `beat-10`,
     `cue-0046`, `scene-16`/`beat-16`'s summary, `shot-plan-023/024/044/045/045b`'s
     descriptions/prompts) to describe the same idea the bridge entry
     already uses — the service hatch, hidden from the crew stations'
     sightline, within the bridge. Dropped `shot-plan-023/024`'s
     `secondaryLocationIds` pointing at the deleted location (their
     `referenceAssetIds` already correctly used the existing
     `asset:location-celestial-ardor-bridge-service-shaft-reference` — the
     camera-angle asset built for exactly this "concealed arrival" framing —
     so no asset change was needed there).
   - Marked the orphaned `asset:location-celestial-ardor-command-vestibule`
     entry in `data/assets.json` `needs_replacement`/`canon_mismatch`,
     explaining the error and pointing at the two assets to use instead. Its
     file stays on disk for provenance.
   - Reworded the two "axial vestibule" mentions in
     `data/translations/documents.en.json` to describe the central shaft's
     exit instead of a separate vestibule.
   - Flagged, but did **not** rewrite, `docs/technical/CELESTIAL_ARDOR.md`:
     it describes the vestibule as a real, already-modeled 3D space with its
     own Blender coordinates (a grab-handle prop, a dock-access rail
     endpoint, trunk hole-cut ranges) — rewriting that prose without
     verifying against the actual `.blend` file risks creating a new,
     worse mismatch. Added a prominent note at the top of the document
     instead, explaining the correction and what whoever next touches the
     3D model needs to reconcile.
   - **Explicitly left alone:** the deprecated `light-delay-main-short.json`/
     `light-delay-festival.json` cuts (not updated as current product, per
     `AGENTS.md`); `light-delay-trailer-master.json` (also references the
     vestibule, but has unrelated concurrent edits in progress — flagged
     here as a follow-up rather than risked); `data/production/
     asset-generation-manifest.json`'s historical log entries (a record of
     what was actually requested/generated, not a live source of truth);
     and scattered mentions in `docs/MASTER_RELEVANCE_REPORT.md`,
     `docs/PENDING_AUTHOR_NOTES.md`, `docs/ASSET_REFERENCE_AUDIT.tmp.md`,
     `docs/wip/festival-master-shot-blueprint.en.md`, `docs/technical/
     ANIMATION_WORKFLOW.md`/`PRODUCTION_ROADMAP.md`/`PROXIMA_STATION.md`,
     historical `CHANGELOG.md`/`docs/PROJECT_STATUS.md` entries, and
     `tmp/`/`reports/` scratch and batch files — none of these are live
     sources of truth for the current cut, and rewriting history/scratch
     files was judged lower value than the risk of touching them.

2. **The central-access shaft's reference art shows a solid column where
   canon calls for an open center.** `master:framing-setting` is explicit:
   *"Railings, stringers, and structural supports leave a continuous aligned
   opening approximately 2 m in clear diameter through the center of the
   shaft."* The climax (`master:story-f4`) depends on this — Voss and Okoye
   dive through that opening to intercept Harlan. Every shot's own text was
   already correct; the error is visual only, in
   `asset:location-celestial-ardor-central-access-sheet` (its "section
   through center" cutaway shows a solid disk instead of a ~2 m hole).
   - Flagged that asset `needs_regeneration`/`canon_mismatch` in
     `data/assets.json`, citing the outline spec and the climax dependency.
   - Visually inspected the generated stills for every shot at this
     location rather than assuming they all inherited the defect:
     `shot-plan-013` (deep look down the shaft) is actually **correct** —
     open center, no column — despite using the same flawed reference, so
     it was **not** re-flagged for this reason. `shot-plan-077` and `078`
     (the climax shots) **do** show the solid column; `077` was upgraded
     from `needs_review` to `needs_regeneration`/`canon_mismatch` and `078`'s
     existing explanation (already `needs_regeneration` for an unrelated
     wrist-device fix) was extended to also cover the column. The other
     shots at this location keep whatever `imageStatus` they already had
     from earlier passes — none were re-flagged without a confirmed visual
     defect.
   - No image was regenerated in this pass.

### Verification

- Repo-wide re-grep for "vestibule"/"vestíbulo": 0 remaining hits in
  `data/locations.json`, `data/editorial-lifecycle.json`, or the active
  `light-delay-festival-master.json`/`light-delay-trailer-master.json`... — see the
  "explicitly left alone" list above for every remaining hit and why.
- `npm run validate:schemas` — OK (27 files).
- `node scripts/validate-data.mjs` — OK.
- `node scripts/validate-lifecycle.mjs` — OK (`active` count dropped by
  exactly 1, matching the removed location entity).
- `npm run scrub:still-prompts:check` — unchanged (still exactly the 2
  pre-existing, unrelated leaks).
- `npx vitest run src/lib/data/repositories/festivalMasterScript.spec.ts` —
  8/8 pass.
- `npm run production:plans` / `:check` — regenerated and up to date.
