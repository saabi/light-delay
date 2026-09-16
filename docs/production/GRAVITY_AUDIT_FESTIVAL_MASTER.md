# Gravity-state audit — Festival-master

Non-authoritative production audit. Status of narrative facts here is inherited
from the master narrative outline and the Festival-master derived outline; this
document does not itself carry authority — see `AGENTS.md`'s layer map.

Scoped to gravity only. For every other category of parent-outline fact that
can go missing at the shot/prompt layer (ship geography, object/prop
grounding, character-presence fidelity, `contexts.json` visual/sound rules),
see the companion report:
`docs/production/OUTLINE_FIDELITY_AUDIT_FESTIVAL_MASTER.md`.

**Scope:** every Shot + still `Take.generation.prompt` in
`script:light-delay-festival-master` (104 shots / 104 takes across 33 scenes),
checked against `data/outlines/light-delay-master-narrative.json` (master,
authoritative) and `data/outlines/light-delay-festival-master.json` (derived
festival cut), for correct microgravity (MG) vs. steady 1 g flagging.

**Result:** 2 confirmed wrong-gravity problems found and fixed (Findings A and
B, §3), plus (§8) 33 shots whose prompts stated no gravity at all — fixed by
requiring every prompt to be self-sufficient, since the image model never
sees anything but that prompt and its referenced assets.

## 1. How gravity is (and isn't) tracked in the data

There is no structured `gravity` field anywhere in the schema — not on `Shot`,
`Take`, or `Scene` (`src/lib/types/script.ts`; no `data/schemas/script.schema.json`
exists at all). The concept lives in two places instead:

1. **`data/production/contexts.json`** — a scene-scoped lookup assigning one of
   `context:ardor-thrust-gravity` (1g), `context:ardor-coast-microgravity` (MG),
   or `context:ardor-remote-cutoff-transition` (the moment of a cutoff) to scenes
   of `script:light-delay-festival-master` via `sceneIds`.
2. **Free-text prose** in `Shot.description.en` and `Take.generation.prompt`,
   using one of two boilerplate sentences:
   - MG: *"Microgravity: hair, loose straps, tools, and small debris drift
     freely; bodies move by handhold, not footing."*
   - 1g: *"Steady 1 g artificial gravity: feet planted, normal weight, no
     floating debris."*

**Two prompt template families coexist in this script.** A "rich" template
(`... Setting: ... [gravity boilerplate] ... Cast: ...`) explicitly restates
gravity; an older "terse" template (`Action: ... Composition: ... Camera: ...
Preserve the specified blocking, physics, timing, dynamic behavior...`) never
states gravity explicitly at all, relying on a generic "preserve physics"
instruction. Both templates appear throughout the script, including inside
scenes that are unambiguously correct — this is a stylistic/migration split, not
itself a gravity error. Only the rich-template shots could be checked by exact
substring match for a *wrong* gravity sentence; terse-template shots are
"unspecified," not "wrong."

## 2. The authoritative gravity timeline

Built by walking all 209 cues of `script:light-delay-festival-master` in order
and finding every thrust/engine/weight/gravity mention, then cross-referencing
against `master:framing-gravity` (which states the ship runs 1g through most of
powered transit but drops to microgravity exactly 4 times) and the Festival
outline's `sourceRefs`.

| Dip | Cut cue | Resume cue | Outline refs |
|---|---|---|---|
| 1 | `cue-0025` (periapsis, scene-06) | `cue-0029` (scene-06, same scene) | `master:story-a3b` → `festival-master:story-03` |
| 2 | `cue-0030` (scene-07) | `cue-0091b` + `cue-0095` (scene-17) | `master:story-a4/a5` → `story-04`; murder `master:story-c3/c3a/c3b` → `story-09`; resume `master:story-c10` → `story-12` |
| 3 | `cue-0107` (scene-19) | `cue-0113b` (scene-20) | `master:story-c10b/d3/d4` → `story-14` |
| 4 | `cue-0157` (scene-26) | **none found afterward** — `cue-0171` ("no thrust, no vibration... until we're certain it's safe") confirms it | `master:story-f3/f4` → `story-20`; `f5/f6` → `story-21` |

Resulting scene-by-scene timeline:

- **1g** — title, 02, 03, 04, 05
- **MG (dip 1)** — 06
- **MG (dip 2, incl. the murder)** — 07–16
- **1g** — 17, 18
- **MG (dip 3)** — 19
- **1g** — 20–25 (**including 25**)
- **MG (dip 4, no resume — confirmed with the author)** — 26, 27, 28, 29, 31, 32
- **N/A** — scene-00-title (static title card, no bodies), scene-30 (EVA/exterior
  vacuum — inherently weightless regardless of the ship's interior state, except
  `shot-plan-090` which is a ship-interior bridge shot and correctly carries the
  MG marker), scene-32-credits (static exterior cards, no bodies)

## 3. Findings, resolved

### Finding A — scenes 28/29/31/32 mis-assigned to 1g

`data/production/contexts.json` assigned these 4 post-climax scenes (the
greeting, Voss/Sorell's reconciliation, the station's answer, and the epilogue)
to `context:ardor-thrust-gravity` (1g), but no relight cue exists anywhere after
the dip-4 cutoff (`cue-0157`), and `cue-0171` has a character explicitly forbid
thrust. **Confirmed with the author: the ship stays in microgravity through the
end of the film; no relight is ever depicted.**

**Fix applied:**
- Removed scenes 28, 29, 31, 32 from `context:ardor-thrust-gravity`'s
  `sceneIds` for `script:light-delay-festival-master`.
- Added a new context, `context:ardor-post-climax-microgravity` (status
  `draft`, sourced to `cue-0157`/`cue-0171`), rather than folding them into
  `context:ardor-coast-microgravity` — that context's `physics` text is specific
  to "approach to and transit through the local throat," which does not
  describe an indefinite post-climax safety hold. Scenes 28, 29, 31, 32 are now
  assigned to the new context.
- None of these scenes' own shots explicitly contradicted microgravity (most
  use the terse template, which states no gravity either way — see §1), so no
  other shot text needed correcting. As the first shot of this stretch,
  `shot-plan-083` (scene-28) previously had neither a gravity marker nor any
  in-frame reinforcement of the state; added one legibility touch there — a
  small physical detail (a stylus drifting at the end of its tether) — to both
  `Shot.description` (en/es) and its prompt, plus the explicit microgravity
  clause in the prompt, so the stretch doesn't rely solely on scenes 26/27's
  earlier cueing. `imageStatus` set to `needs_regeneration` / `canon_mismatch`.

### Finding B — scene 25 prompts said microgravity; scene is 1g

Scene 25 ("Three routes close," the chase-splits sequence) is unambiguously 1g:
the master outline (`master:story-f2`, "faster, but far more dangerous **under
thrust**"), `contexts.json` (`ardor-thrust-gravity`), and all 3 shots' own
`Shot.description.en` agree — but all 3 shots' `Take.generation.prompt` values
carried the MG boilerplate verbatim, contradicting their own description. This
reads as a copy/paste error from an adjacent MG shot during a recent prompt
pass (both scene-25 and scene-26/27 shots were regenerated to the richer
template on 2026‑09‑13, and 26/27 are correctly MG), not an authorial choice.
**Confirmed with the author: scene 25 is 1g.**

**Fix applied:** replaced the MG sentence with the 1g sentence in
`Take.generation.prompt` for `shot-plan-074`, `shot-plan-075`, `shot-plan-076`.
`Shot.description.en` was already correct (no change needed).
`imageStatus` set to `needs_regeneration` / `canon_mismatch` on all 3 takes,
since all 3 already have a generated image that would now show the wrong
physics.

## 4. Change list (files touched)

- `data/scripts/light-delay-festival-master.json`
  - `shot-plan-074:take-01`, `shot-plan-075:take-01`, `shot-plan-076:take-01`:
    prompt MG → 1g; `imageStatus` → `needs_regeneration` (`canon_mismatch`).
  - `shot-plan-083` / `shot-plan-083:take-01`: description (en/es) and prompt
    gained a microgravity detail + explicit clause; `imageStatus` →
    `needs_regeneration` (`canon_mismatch`).
- `data/production/contexts.json`
  - `context:ardor-thrust-gravity` (festival-master assignment): removed
    scenes 28, 29, 31, 32.
  - New context `context:ardor-post-climax-microgravity` added (status
    `draft`), assigned to scenes 28, 29, 31, 32.
- `data/production/plans/light-delay-festival-master.json` — regenerated via
  `npm run production:plans` (a build step over the two files above, not an AI
  image regeneration) so the derived plan stays in sync.
- No image was regenerated. **Follow-up for whoever runs image generation:** 4
  takes now carry `imageStatus.status = "needs_regeneration"` (`shot-plan-074`,
  `-075`, `-076`, `-083`) — see each take's `replacementBrief` for what to
  change.

## 5. Full per-shot table

Columns: cues placed on the shot; the gravity state derived for this scene from
§2; the outline/cue evidence used; the current `contexts.json` assignment;
whether the exact boilerplate sentence is present in `Shot.description.en` /
`Take.generation.prompt`; which prompt template family the shot uses (§1); and
the resulting flag. Historical "OK" rows may still show `none` under Desc./Prompt
marker for terse templates that relied on audience-sequence economy
(`DIALOGUE_AND_PROMPT_LESSONS.md` §2). That silence is **not** acceptable for
still generation going forward: every body/loose-object still must carry an
explicit correct gravity clause in the prompt (§2c). Re-audit prompt markers
before regenerating stills; do not treat a blank Prompt marker as green for
image work. No gravity *state* `MISMATCH` remains after the fixes above.

<!-- GRAVITY_TABLE_START -->
| Shot | Scene | Cues | Expected | Evidence | Context assignment | Desc. marker | Prompt marker | Template | Flag |
|---|---|---|---|---|---|---|---|---|---|
| shot-plan-title | scene-00-title | cue-0001 | N/A (title card) | story-01 / pre-dip | ardor-docked-at-proxima | none | none | other | N/A |
| shot-plan-001 | scene-02 | cue-0002, cue-0003 | 1g | story-01 / pre-dip | ardor-docked-at-proxima + ardor-operational-displays | none | 1g | rich | OK |
| shot-plan-002 | scene-02 | cue-0004, cue-0005 | 1g | story-01 / pre-dip | ardor-docked-at-proxima + ardor-operational-displays | none | 1g | rich | OK |
| shot-plan-003 | scene-02 | cue-0006, cue-0007 | 1g | story-01 / pre-dip | ardor-docked-at-proxima + ardor-operational-displays | none | 1g | rich | OK |
| shot-plan-004 | scene-03 | cue-0008, cue-0009 | 1g | story-01 / pre-dip | ardor-docked-at-proxima + ardor-operational-displays | none | 1g | rich | OK |
| shot-plan-005 | scene-03 | cue-0010, cue-0011 | 1g | story-01 / pre-dip | ardor-docked-at-proxima + ardor-operational-displays | none | 1g | rich | OK |
| shot-plan-006 | scene-04 | cue-0012 | 1g | story-02 / pre-dip | proxima-dock | none | 1g | rich | OK |
| shot-plan-007 | scene-04 | cue-0013, cue-0014 | 1g | story-02 / pre-dip | proxima-dock | none | 1g | rich | OK |
| shot-plan-008 | scene-04 | cue-0015, cue-0016 | 1g | story-02 / pre-dip | proxima-dock | none | 1g | rich | OK |
| shot-plan-009 | scene-04 | cue-0017, cue-0018 | 1g | story-02 / pre-dip | proxima-dock | none | 1g | rich | OK |
| shot-plan-010 | scene-05 | cue-0019, cue-0020 | 1g | story-02 / cue-0019 "steady thrust" | ardor-thrust-gravity + ardor-operational-displays | none | 1g | rich | OK |
| shot-plan-011 | scene-05 | cue-0021, cue-0022 | 1g | story-02 / cue-0019 "steady thrust" | ardor-thrust-gravity + ardor-operational-displays | none | 1g | rich | OK |
| shot-plan-012 | scene-05 | cue-0023, cue-0024 | 1g | story-02 / cue-0019 "steady thrust" | ardor-thrust-gravity + ardor-operational-displays | none | 1g | rich | OK |
| shot-plan-013b | scene-06 | cue-0024b | MG | story-03 / master:a3b / cue-0025 cut → cue-0029 resume | ardor-coast-microgravity | none | none | rich | OK |
| shot-plan-013 | scene-06 | cue-0025 | MG | story-03 / master:a3b / cue-0025 cut → cue-0029 resume | ardor-coast-microgravity | none | MG | rich | OK |
| shot-plan-014 | scene-06 | cue-0026, cue-0027 | MG | story-03 / master:a3b / cue-0025 cut → cue-0029 resume | ardor-coast-microgravity | none | MG | rich | OK |
| shot-plan-015 | scene-06 | cue-0028, cue-0029 | MG | story-03 / master:a3b / cue-0025 cut → cue-0029 resume | ardor-coast-microgravity | none | MG | rich | OK |
| shot-plan-016b | scene-07 | cue-0029c, cue-0030 | MG | story-04 / master:a4 / cue-0030 cut (dip 2 starts) | ardor-coast-microgravity + ardor-operational-displays | none | none | rich | OK |
| shot-plan-016 | scene-07 | cue-0030b, cue-0031 | MG | story-04 / master:a4 / cue-0030 cut (dip 2 starts) | ardor-coast-microgravity + ardor-operational-displays | none | MG | rich | OK |
| shot-plan-017 | scene-07 | cue-0032, cue-0033, cue-0034 | MG | story-04 / master:a4 / cue-0030 cut (dip 2 starts) | ardor-coast-microgravity + ardor-operational-displays | none | MG | rich | OK |
| shot-plan-018 | scene-08 | cue-0035, cue-0036, cue-0037 | MG | story-05 / master:a5 / inside dip 2 | ardor-coast-microgravity | none | none | terse | OK |
| shot-plan-019 | scene-08 | cue-0038, cue-0039, cue-0040 | MG | story-05 / master:a5 / inside dip 2 | ardor-coast-microgravity | none | none | terse | OK |
| shot-plan-020 | scene-09 | cue-0041 | MG | story-06 / master:b1-b4 / inside dip 2 | ardor-coast-microgravity + ardor-operational-displays | none | none | terse | OK |
| shot-plan-021 | scene-09 | cue-0042, cue-0043 | MG | story-06 / master:b1-b4 / inside dip 2 | ardor-coast-microgravity + ardor-operational-displays | none | none | terse | OK |
| shot-plan-022 | scene-09 | cue-0044, cue-0045 | MG | story-06 / master:b1-b4 / inside dip 2 | ardor-coast-microgravity + ardor-operational-displays | none | none | terse | OK |
| shot-plan-023 | scene-10 | cue-0046, cue-0047 | MG | story-07 / master:b4b / inside dip 2 | ardor-coast-microgravity | none | none | terse | OK |
| shot-plan-024 | scene-10 | cue-0048, cue-0049 | MG | story-07 / master:b4b / inside dip 2 | ardor-coast-microgravity | none | none | terse | OK |
| shot-plan-025 | scene-10 | cue-0050, cue-0051 | MG | story-07 / master:b4b / inside dip 2 | ardor-coast-microgravity | none | none | terse | OK |
| shot-plan-026 | scene-11 | cue-0052 | MG | story-07 / inside dip 2 | ardor-coast-microgravity | none | MG | rich | OK |
| shot-plan-027 | scene-11 | cue-0053, cue-0054 | MG | story-07 / inside dip 2 | ardor-coast-microgravity | none | MG | rich | OK |
| shot-plan-028 | scene-11 | cue-0055, cue-0056 | MG | story-07 / inside dip 2 | ardor-coast-microgravity | none | MG | rich | OK |
| shot-plan-029 | scene-12 | cue-0057, cue-0058 | MG | story-08 / inside dip 2 | ardor-coast-microgravity + zao-optical-transmission + ardor-operational-displays | none | none | terse | OK |
| shot-plan-030 | scene-12 | cue-0059, cue-0059b, cue-0060 | MG | story-08 / inside dip 2 | ardor-coast-microgravity + zao-optical-transmission + ardor-operational-displays | none | none | terse | OK |
| shot-plan-031 | scene-12 | cue-0061, cue-0062 | MG | story-08 / inside dip 2 | ardor-coast-microgravity + zao-optical-transmission + ardor-operational-displays | none | none | terse | OK |
| shot-plan-032 | scene-12 | cue-0063, cue-0064 | MG | story-08 / inside dip 2 | ardor-coast-microgravity + zao-optical-transmission + ardor-operational-displays | none | none | terse | OK |
| shot-plan-033 | scene-13 | cue-0065 | MG | story-08 / inside dip 2 | ardor-coast-microgravity + zao-optical-transmission + ardor-operational-displays | none | MG | rich | OK |
| shot-plan-034 | scene-13 | cue-0066 | MG | story-08 / inside dip 2 | ardor-coast-microgravity + zao-optical-transmission + ardor-operational-displays | none | MG | rich | OK |
| shot-plan-035 | scene-13 | cue-0067, cue-0068 | MG | story-08 / inside dip 2 | ardor-coast-microgravity + zao-optical-transmission + ardor-operational-displays | none | MG | rich | OK |
| shot-plan-036 | scene-14 | cue-0069, cue-0070 | MG | story-09 / master:c3/c3a/c3b (murder) / inside dip 2 | ardor-coast-microgravity + zao-optical-transmission | none | none | terse | OK |
| shot-plan-037 | scene-14 | cue-0071, cue-0072, cue-0073 | MG | story-09 / master:c3/c3a/c3b (murder) / inside dip 2 | ardor-coast-microgravity + zao-optical-transmission | none | none | terse | OK |
| shot-plan-038 | scene-14 | cue-0074, cue-0075, cue-0076 | MG | story-09 / master:c3/c3a/c3b (murder) / inside dip 2 | ardor-coast-microgravity + zao-optical-transmission | none | none | terse | OK |
| shot-plan-039 | scene-15 | cue-0076b, cue-0076c, cue-0077, cue-0078, cue-0078b | MG | story-09 / inside dip 2 (cue-0082 body drifts) | ardor-coast-microgravity + ardor-operational-displays | none | MG | rich | OK |
| shot-plan-040 | scene-15 | cue-0079, cue-0080 | MG | story-09 / inside dip 2 (cue-0082 body drifts) | ardor-coast-microgravity + ardor-operational-displays | none | none | terse | OK |
| shot-plan-040b | scene-15 | cue-0082b | MG | story-09 / inside dip 2 (cue-0082 body drifts) | ardor-coast-microgravity + ardor-operational-displays | none | none | other | OK |
| shot-plan-041 | scene-15 | cue-0081, cue-0082 | MG | story-09 / inside dip 2 (cue-0082 body drifts) | ardor-coast-microgravity + ardor-operational-displays | none | none | terse | OK |
| shot-plan-042 | scene-16 | cue-0083, cue-0084 | MG | story-09 / inside dip 2 (cue-0083 drifting body) | ardor-coast-microgravity | none | none | other | OK |
| shot-plan-043 | scene-16 | cue-0085, cue-0086 | MG | story-09 / inside dip 2 (cue-0083 drifting body) | ardor-coast-microgravity | none | MG | rich | OK |
| shot-plan-044 | scene-16 | cue-0087, cue-0088 | MG | story-09 / inside dip 2 (cue-0083 drifting body) | ardor-coast-microgravity | none | none | other | OK |
| shot-plan-045 | scene-16 | cue-0089, cue-0090, cue-0091 | MG | story-09 / inside dip 2 (cue-0083 drifting body) | ardor-coast-microgravity | none | none | terse | OK |
| shot-plan-045b | scene-16 | cue-0091c | MG | story-09 / inside dip 2 (cue-0083 drifting body) | ardor-coast-microgravity | none | none | other | OK |
| shot-plan-046 | scene-17 | cue-0091b, cue-0092 | 1g | story-10 / master:c10 / cue-0091b + cue-0095 resume | ardor-thrust-gravity | none | none | terse | OK |
| shot-plan-047 | scene-17 | cue-0093, cue-0094 | 1g | story-10 / master:c10 / cue-0091b + cue-0095 resume | ardor-thrust-gravity | none | 1g | rich | OK |
| shot-plan-048 | scene-17 | cue-0095, cue-0096 | 1g | story-10 / master:c10 / cue-0091b + cue-0095 resume | ardor-thrust-gravity | none | 1g | rich | OK |
| shot-plan-049 | scene-17 | cue-0097, cue-0098 | 1g | story-10 / master:c10 / cue-0091b + cue-0095 resume | ardor-thrust-gravity | none | 1g | rich | OK |
| shot-plan-050 | scene-18 | cue-0099, cue-0100 | 1g | story-11 / after resume | ardor-thrust-gravity + ardor-operational-displays | none | 1g | rich | OK |
| shot-plan-051 | scene-18 | cue-0101, cue-0102 | 1g | story-11 / after resume | ardor-thrust-gravity + ardor-operational-displays | none | 1g | rich | OK |
| shot-plan-052 | scene-18 | cue-0103, cue-0104 | 1g | story-11 / after resume | ardor-thrust-gravity + ardor-operational-displays | none | 1g | rich | OK |
| shot-plan-053 | scene-18 | cue-0105, cue-0106 | 1g | story-11 / after resume | ardor-thrust-gravity + ardor-operational-displays | none | 1g | rich | OK |
| shot-plan-054 | scene-19 | cue-0107, cue-0107b, cue-0108 | MG | story-14 / master:c10b,d3,d4 / cue-0107 cut (dip 3) | ardor-coast-microgravity | none | MG | rich | OK |
| shot-plan-055 | scene-19 | cue-0109, cue-0110 | MG | story-14 / master:c10b,d3,d4 / cue-0107 cut (dip 3) | ardor-coast-microgravity | none | MG | rich | OK |
| shot-plan-056 | scene-19 | cue-0111, cue-0112, cue-0113 | MG | story-14 / master:c10b,d3,d4 / cue-0107 cut (dip 3) | ardor-coast-microgravity | none | MG | rich | OK |
| shot-plan-057 | scene-20 | cue-0113b–cue-0122 | 1g | story-13 / cue-0113b resume | ardor-thrust-gravity + zao-optical-transmission + ardor-operational-displays | none | 1g | rich | OK |
| shot-plan-060 | scene-21 | cue-music-zao-01-change, cue-0123–cue-0125 | 1g | story-15 / after resume | ardor-thrust-gravity + zao-optical-transmission + ardor-operational-displays | none | 1g | rich | OK |
| shot-plan-062 | scene-21 | cue-0126–cue-0128 | 1g bridge; MG in monitor inset | story-15 / after resume | ardor-thrust-gravity + zao-optical-transmission + ardor-operational-displays | none | 1g bridge | rich | OK |
| shot-plan-064 | scene-21 | cue-0129, cue-0130 | 1g | story-15 / after resume | ardor-thrust-gravity + zao-optical-transmission + ardor-operational-displays | none | 1g | rich | OK |
| shot-plan-065 | scene-22 | cue-0131–cue-0136 | 1g | story-16 / after resume | ardor-thrust-gravity | none | 1g | rich | OK |
| shot-plan-068 | scene-23 | cue-music-sabotage-04-change, cue-0137–cue-0143 | 1g | story-17 / after resume | ardor-thrust-gravity + ardor-operational-displays | none | 1g | rich | OK |
| shot-plan-071 | scene-24 | cue-0144–cue-0150 | 1g | story-18 / after resume | ardor-thrust-gravity | none | 1g | rich | OK |
| shot-plan-074 | scene-25 | cue-0151, cue-0152 | 1g | story-19 / master:f2 "faster, but far more dangerous under thrust" | ardor-thrust-gravity | none | 1g | rich | OK |
| shot-plan-075 | scene-25 | cue-0153, cue-0154 | 1g | story-19 / master:f2 "faster, but far more dangerous under thrust" | ardor-thrust-gravity | none | 1g | rich | OK |
| shot-plan-076 | scene-25 | cue-0155, cue-0156 | 1g | story-19 / master:f2 "faster, but far more dangerous under thrust" | ardor-thrust-gravity | none | 1g | rich | OK |
| shot-plan-077 | scene-26 | cue-0157, cue-0158 | MG | story-20 / master:f3,f4 / cue-0157 cut (dip 4) + cue-0158 | ardor-remote-cutoff-transition | none | MG | rich | OK |
| shot-plan-078 | scene-26 | cue-0159, cue-0160 | MG | story-20 / master:f3,f4 / cue-0157 cut (dip 4) + cue-0158 | ardor-remote-cutoff-transition | none | MG | rich | OK |
| shot-plan-079 | scene-26 | cue-0161, cue-0162, cue-0163 | MG | story-20 / master:f3,f4 / cue-0157 cut (dip 4) + cue-0158 | ardor-remote-cutoff-transition | none | MG | rich | OK |
| shot-plan-080 | scene-27 | cue-0164, cue-0165 | MG | story-20 / inside dip 4 (cue-0171 "no thrust") | ardor-remote-cutoff-transition + ardor-operational-displays | none | none | terse | OK |
| shot-plan-081 | scene-27 | cue-0166, cue-0167, cue-0168 | MG | story-20 / inside dip 4 (cue-0171 "no thrust") | ardor-remote-cutoff-transition + ardor-operational-displays | none | none | terse | OK |
| shot-plan-082 | scene-27 | cue-0169, cue-0170, cue-0171 | MG | story-20 / inside dip 4 (cue-0171 "no thrust") | ardor-remote-cutoff-transition + ardor-operational-displays | none | none | terse | OK |
| shot-plan-083 | scene-28 | cue-0172 | MG | story-21 / master:f5,f6 / inside dip 4, no resume — decided: stays MG | ardor-post-climax-microgravity + ardor-operational-displays | none | MG | terse | OK |
| shot-plan-084 | scene-28 | cue-0173, cue-0174 | MG | story-21 / master:f5,f6 / inside dip 4, no resume — decided: stays MG | ardor-post-climax-microgravity + ardor-operational-displays | none | none | terse | OK |
| shot-plan-085 | scene-28 | cue-0175, cue-0176 | MG | story-21 / master:f5,f6 / inside dip 4, no resume — decided: stays MG | ardor-post-climax-microgravity + ardor-operational-displays | none | none | terse | OK |
| shot-plan-086 | scene-29 | cue-0177, cue-0178 | MG | story-21 / inside dip 4, no resume — decided: stays MG | ardor-post-climax-microgravity + ardor-operational-displays | none | none | terse | OK |
| shot-plan-087 | scene-29 | cue-0179, cue-0180 | MG | story-21 / inside dip 4, no resume — decided: stays MG | ardor-post-climax-microgravity + ardor-operational-displays | none | none | terse | OK |
| shot-plan-088 | scene-29 | cue-0181, cue-0182 | MG | story-21 / inside dip 4, no resume — decided: stays MG | ardor-post-climax-microgravity + ardor-operational-displays | none | none | terse | OK |
| shot-plan-089 | scene-30 | cue-0183 | N/A (EVA/vacuum) | story-22 / EVA — exterior vacuum, N/A to interior boilerplate | ardor-exterior-vacuum | none | none | terse | N/A |
| shot-plan-090 | scene-30 | cue-0184 | N/A (EVA/vacuum) | story-22 / EVA — exterior vacuum, N/A to interior boilerplate | ardor-exterior-vacuum | none | MG | rich | N/A |
| shot-plan-091 | scene-30 | cue-0185 | N/A (EVA/vacuum) | story-22 / EVA — exterior vacuum, N/A to interior boilerplate | ardor-exterior-vacuum | none | none | terse | N/A |
| shot-plan-092 | scene-30 | cue-0186, cue-0187 | N/A (EVA/vacuum) | story-22 / EVA — exterior vacuum, N/A to interior boilerplate | ardor-exterior-vacuum | none | none | terse | N/A |
| shot-plan-093 | scene-31 | cue-0188, cue-0189 | MG | story-23 / inside dip 4, no resume — decided: stays MG | ardor-post-climax-microgravity | none | none | terse | OK |
| shot-plan-094 | scene-31 | cue-0190, cue-0191 | MG | story-23 / inside dip 4, no resume — decided: stays MG | ardor-post-climax-microgravity | none | none | terse | OK |
| shot-plan-095 | scene-32 | cue-0192, cue-0193 | MG | story-24 / inside dip 4, no resume — decided: stays MG | ardor-post-climax-microgravity + zao-optical-transmission + ardor-operational-displays | none | none | terse | OK |
| shot-plan-096 | scene-32 | cue-0194, cue-0195, cue-0196 | MG | story-24 / inside dip 4, no resume — decided: stays MG | ardor-post-climax-microgravity + zao-optical-transmission + ardor-operational-displays | none | none | terse | OK |
| shot-plan-credit-01 | scene-32-credits | cue-credits | N/A | N/A — exterior static cards, no bodies on screen | (none) | none | 1g | rich | N/A |
| shot-plan-credit-02 | scene-32-credits | cue-credits | N/A | N/A — exterior static cards, no bodies on screen | (none) | none | 1g | rich | N/A |
| shot-plan-credit-03 | scene-32-credits | cue-credits | N/A | N/A — exterior static cards, no bodies on screen | (none) | none | 1g | rich | N/A |
<!-- GRAVITY_TABLE_END -->

## 6. Incidental observations (not fixed — out of this audit's scope)

- **Two pre-existing takes contain leftover spoken-dialogue quotes** in their
  still prompts (`shot-plan-041`, `shot-plan-045` — flagged by `npm run
  scrub:still-prompts:check`), unrelated to gravity and already present before
  this audit's edits (confirmed via `git diff`, which shows no touch to those
  shots). Not fixed here; flagging for a separate pass per `AGENTS.md`'s "no
  spoken dialogue in still prompts" rule.
- **The 3 end-credits prompts** (`shot-plan-credit-01/02/03`) each carry the
  full 1g boilerplate sentence even though they're static exterior cards with
  no bodies in frame — harmless (nothing in frame to contradict), but a
  candidate for cleanup if the credits prompts are revisited.
- **`trailerMasterScript.spec.ts`** has one pre-existing failing test
  (`reuses already-generated Festival-master frames...`) caused by
  `data/scripts/light-delay-trailer-master.json` already being mid-edit before
  this audit started (per the session's initial `git status`); this audit never
  touched that file. Unrelated to gravity; flagging for whoever owns that
  in-progress edit.

## 7. Verification performed

- `npm run validate:schemas` — OK (27 files).
- `node scripts/validate-data.mjs` — OK.
- `node scripts/validate-lifecycle.mjs` — OK.
- `npm run scrub:still-prompts:check` — no new leftover dialogue introduced by
  this audit's edits (the 2 pre-existing leaks above are unchanged).
- `npx vitest run src/lib/data/repositories/festivalMasterScript.spec.ts` — all
  8 tests pass, including the gravity-event cue-substring test.
- `npx vitest run` (full unit suite) — 140/141 pass; the 1 failure is the
  pre-existing, unrelated `trailerMasterScript.spec.ts` case above.
- `npm run production:plans` / `:check` — regenerated and now up to date.
- Re-derived the per-shot table (§5) after the fixes and confirmed 0 remaining
  `MISMATCH` rows.

## 8. Second pass — every prompt must be self-sufficient, not just "not wrong"

`festival-master:shot-plan-021` (scene-09, MG) surfaced a flaw in §5's "OK"
column: it treated a shot as fine whenever it had **no** gravity marker,
reasoning that continuity is "inherited from the scene" and citing
`DIALOGUE_AND_PROMPT_LESSONS.md`'s §2 "cue it once or twice" convention. That
convention is about how a **human viewer** experiences a moving sequence of
shots; it does not apply to a **still-image generation prompt**, which is a
stateless, one-shot request — the model sees only that prompt's text and its
referenced assets, never the scene, never neighboring shots, never
`contexts.json`. This is now formalized as
`DIALOGUE_AND_PROMPT_LESSONS.md` §2c ("Stateless still prompts: restate what
the model cannot inherit"), which names this exact shot as its worked
example — treat §2c as the authoritative convention going forward, this
section just records the resulting data fix.

**Re-scanned all 104 shots** for the two canonical sentences *or* any other
unambiguous explicit gravity language (the literal words "microgravity",
"weightless", "zero-g", "steady 1 g", "under thrust", or the existing
"No gravity reference (exterior shot)" note). This is broader than §5's
exact-two-sentence check, because several shots already say "in
microgravity" or similar in their own prose without using the fixed
boilerplate — those are already sufficient and were left alone
(`shot-plan-040/041/042/044/045/045b/013b/016b`).

**33 shots still had no explicit statement at all** and were fixed by
inserting the correct sentence into `Take.generation.prompt` (never into
`Shot.description` — see rationale below):

- 27 interior MG shots: `018, 019, 020, 021, 022, 023, 024, 025, 029, 030,
  031, 032, 036, 037, 038, 080, 081, 082, 084, 085, 086, 087, 088, 093, 094,
  095, 096` — inserted the existing MG sentence.
- 2 interior 1g shots: `046, 057` — inserted the existing 1g sentence.
- 3 EVA/vacuum shots: `089, 091, 092` (Sorell's tethered exit — previously
  treated as N/A in §5 because they don't fit the ship-interior 1g/MG
  dichotomy, but they are still stateless prompts depicting a body in
  microgravity and needed their own statement) — inserted a new sentence,
  since the ship-interior wording references handrails/deck architecture
  that doesn't exist in open space: *"Vacuum microgravity: the suited body
  and tether drift freely; no floor, no footing, movement by tether and
  momentum only."*
- 1 exterior establishing shot, `shot-plan-040b` (ship threading the throat,
  no characters in frame) — inserted the existing exterior note, *"No
  gravity reference (exterior shot)."*, matching `013b`/`016b`.

All 33 insertions were made by locating each shot's own `Take` block by its
unique id and inserting the sentence immediately before that prompt's
closing "Preserve the specified blocking..." (or, for `040b`, before "No
characters, no text or watermark.") — never a blind find-and-replace of that
shared closing phrase, which repeats verbatim across dozens of untouched
takes. Verified: exactly those 33 `generation.prompt` strings changed and no
other field in any take was touched.

**`Shot.description` was deliberately left unchanged.** The established
convention across dozens of already-correct shots (e.g.
`shot-plan-010/011/012/047-053/058-076`) is that the explicit gravity clause
lives only in the compiled prompt, not in the narrative `description` prose;
there is no prompt compiler in this repo that would regenerate a prompt from
its description and overwrite this fix, so `AGENTS.md`'s "prompt-only edits
get overwritten by compilers" risk doesn't apply here.

**`imageStatus`:** all 33 takes already had a generated image, produced from
a prompt that did not specify the correct physics. Marked all 33
`imageStatus.status: "needs_regeneration"` / `reasons: ["canon_mismatch"]`
with an explanation and `replacementBrief` (same convention as §3/§4) — the
existing images' correctness is unverified by construction, not merely
"probably fine." No image was regenerated in this pass.

### Second-pass verification

- Re-ran the (broadened) gap detector across all 104 shots: 0 shots remain
  without an explicit gravity/vacuum/exterior statement, other than the
  still-legitimately-exempt set (title card, 3 credits cards — no bodies or
  props in frame at all).
- `npm run validate:schemas`, `node scripts/validate-data.mjs`, `node
  scripts/validate-lifecycle.mjs` — all OK.
- `npm run scrub:still-prompts:check` — unchanged (still exactly the 2
  pre-existing, unrelated leaks from §7).
- `npx vitest run src/lib/data/repositories/festivalMasterScript.spec.ts` —
  8/8 pass (shot/take/cue counts unchanged; only prompt text and
  `imageStatus` changed).
- `npm run production:plans` / `:check` — regenerated and up to date again.

## 9. Superseded rows — Proxima interiors (2026-09-13)

Rows 169–177 above (shots 001–009, "1g … OK") predate the Proxima interior
locations. Per `docs/technical/PROXIMA_STATION.md` §3–§5 and the author's
2026-09-13 decision: scenes 02–03 take place in the **Operations Gallery**
inside a rotating habitat ring at **≈ 0.5 g** (`context:proxima-habitat-ring`),
and scene 04 inside the **axial transfer shaft** on the non-rotating spine in
**microgravity** (`context:proxima-dock`). Prompts 001–009 now state those
gravity states; the earlier "1 g" rows are retained as history and are no
longer correct. Enforced by `node scripts/report-festival-master-reference-audit.mjs`
(gravity wording by context).
