# Dialogue and prompt lessons — recommendations for the rest of the corpus

Companion to `AGENT_GENERATION_BRIEF.md` (authority chain, contracts, `compilePrompt` sections,
tooling). That brief says *how* prompts are compiled and what the pipeline enforces mechanically.
This document is different: it distills recurring, human-judgment defects found and fixed across
several editorial passes over `script:light-delay-festival-master` — the microgravity/thrust-transition
audit, the trailer-master build, and a handful of one-off dialogue/prompt corrections — into rules to
apply proactively to the ~103 shots and ~130+ cues in the corpus, most of which have not had this
specific scrutiny yet.

Status: recommendations, not narrative or schema authority. Verified against the repository on
2026-09-12. Where a rule is already enforced by tooling, this doc says so and points at the tool
instead of re-explaining it — don't duplicate that work by hand.

## 1. Edit the shot `description`, not just the take `generation.prompt`

**What happened:** `shot-plan-081` and `shot-plan-082` had their dialogue corrected at some point, but
only the take's `generation.prompt` was updated — the shot's own `description` field kept the old
text. A later, independent prompt-regeneration pass (`scripts/prepare-festival-master-regeneration.mjs`
and the structured-template compiler) rebuilt both prompts *from `description`*, silently reverting the
dialogue fix with no error anywhere in the pipeline.

**Rule:** `Shot.description` is the durable source of truth the compiler reads from; `Take.generation.prompt`
is a derived, disposable artifact that can and will be regenerated out from under a hand-edit. Any
correction that touches what a shot shows or what a line says must land in `description` (both `en`
and `es`) first. If you only need the prompt for something immediately, still update `description` in
the same edit — don't leave the two to drift.

**Apply to the rest of the corpus:** spot-check a sample of shots whose `description` hasn't been
touched since dialogue passes were made on their cues (compare `description` prose against the
cue's current `spokenText` for the same beat) — the 081/082 pattern (dialogue cue fixed, shot
description not) can recur anywhere a cue was rewritten after its shot was first authored.

## 2. Physics-transition legibility: cue it once or twice, not every time

**What happened:** the Ardor's four thrust-cut/microgravity-transition events (periapsis, precision
crossing, third and fourth cuts) originally read identically each time — silent, undifferentiated
"microgravity" state changes an audience has no way to notice. The fix added a visual **and** audio
legibility cue (loose straps rising, a restraint click, a spoon tapping its tether, engine tone
draining away) to the **first** transition, a lighter version to the **second**, and left the third and
fourth as plain restated physical fact (`thrust cuts for the third/fourth time`) with only the visual
consequence (bodies/tools floating free).

**Rule:** the first one or two occurrences of a recurring physical state-change teach the audience the
grammar; repeating the full cue every time is redundant and reads as padding. Establish it richly once
(sound + visual), reinforce it lightly once more if there's a real gap between occurrences, then let
later occurrences be carried by the plain restated fact plus visual consequence alone.

**Sound-in-vacuum corollary:** an audio legibility cue only belongs where the point-of-view is inside
a pressurized structure that can actually carry the sound (restraint clicks, engine vibration through
the hull, "a low structural chorus travels through the bridge's hull" for the wormhole-mouth opening).
A shot set in open space or explicitly in vacuum (EVA, exterior hull, the transport sphere approach)
must not carry an audio cue in its `description`/`prompt` — physical consequence there is visual only
(debris drift, suit reactions, no sound-implying language).

**Apply to the rest of the corpus:** any other repeating physical/environmental state change (not just
gravity — e.g. pressurization, lighting mode changes, alarm states) should get the same "establish
richly once, then let repetition carry itself" treatment rather than a cue on every occurrence.

**Does not apply to still-image generation prompts.** §2 is about how a **human viewer** experiences
emphasis across a *sequence* of moving shots. A still generator sees only this request's prompt text
plus attached reference assets — it has no memory of scene `setting.continuity`, adjacent shots, or
earlier "teaching" cues. See §2c.

## 2b. Dialogue clarity for a general audience

Split out into its own document, `DIALOGUE_CLARITY_GUIDE.md` — it covers a distinct failure mode
(accurate, in-character lines that are still too compressed for an audience to parse on one hearing)
with its own worked examples and audit method. Read it alongside this section whenever revising
dialogue, not just when auditing prompts.

## 2c. Stateless still prompts: restate what the model cannot inherit

**What happened (`shot-plan-021` and peers):** scene `setting.continuity` correctly marked
microgravity, and §2 allowed later vault shots to stay "terse" for the *audience*. The still
generator never sees that scene field. Prompts that only said "preserve … physics" without naming
microgravity vs 1 g left gravity underspecified for a one-shot, memoryless request.

**Rule (stills / storyboard / first–last frame image prompts):** every fact the image model must
know has to arrive in **this** request — as prompt text and/or an attached reference asset. The
model cannot inherit scene-level continuity, outline context, production contexts, or neighboring
shots unless those facts are restated or shown in an attached sheet.

Concretely:

- **Gravity:** any still that depicts a body, planted stance, or loose object must carry an
  **explicit, correct** gravity statement (e.g. microgravity with drift / handholds, or steady
  thrust 1 g with weight). Full stop. Do not rely on scene continuity alone.
- **Other non-inherited state:** same bar for suit/helmet, prop ownership, diegetic screen content
  (English-only), lighting mode, vacuum vs pressurized — anything that changes how the frame
  should look and is not already unambiguous on an attached reference.
- **Reference sheets:** appearance locked by an attached sheet need not be re-litigated in prose
  (§6); **state that the sheet does not show** (gravity, this-moment pose, which prop is in hand)
  still belongs in the prompt.
- **Spoken dialogue:** stills must **not** include spoken lines or subtitle text
  (`npm run scrub:still-prompts:check`). That exception is for **stills only**.
- **Video (e.g. Seedance 2.5):** different contract — cue text plus approved voice-sample `@Audio`
  refs are inputs the model is meant to use for speech. Do not apply the still no-dialogue scrub
  to Seedance job prompts; see `SEEDANCE_PROMPTING.md` §6. Physics and other visual state still
  need to be explicit in the video prompt the same way (the model does not read `ScriptFile`
  scene continuity either).

**Apply to the rest of the corpus:** when auditing or compiling still prompts, treat missing
gravity (or other load-bearing physical state) on a body/loose-object frame as a defect even if
the scene is correctly marked microgravity/1 g and §2 would omit a repeated *audience* cue.

## 3. Dialogue must match the speaker's actual belief state, not the audience's later knowledge

**What happened (`cue-0120`):** an earlier draft of Harlan's line implied he "tried" to stop the signal
— but at this point in the story Harlan believes he *succeeded*; he doesn't yet know the transmission
got through. The line was rewritten to: *"Zao missed her aim. The signal's gone, unrecoverable — now
they'll never know who saved them."* — stated as settled fact from his POV, with no hedge that
foreshadows his own eventual failure.

**Rule:** before finalizing or editing any line, check the continuity ledger / preceding beats for what
that character currently knows and believes at that exact narrative moment — not what's true, not what
the audience knows, not what a later scene reveals. A character who doesn't yet know they're wrong
should never speak like someone hedging toward being wrong.

**Apply to the rest of the corpus:** this is a useful audit lens to rerun broadly — for any dialogue
cue, ask "does this speaker know this yet?" It's an easy category of error to reintroduce during any
future line edit, since fixing wording for tone/rhythm can accidentally leak information the speaker
shouldn't have yet.

## 4. Check the *argument* a line makes, not just its surface plausibility

**What happened (`cue-0162`):** an earlier draft of Harlan's "one sign we bite" line read as being
about humans turning on each other — plausible-sounding in isolation, but wrong: his actual motive
(established elsewhere) is **deterrence toward the Velari**. The corrected line makes that explicit:
*"One sign that we're not defenseless — that we can bite back — and they'll think twice before they
take what they want from us. Earth needs those years."*

**Rule:** when a dialogue line is making an argument or stating a reason, verify its logical content
against the character's actually-established motive/reasoning elsewhere in the script — not just
whether the sentence sounds dramatically plausible on its own. A line can read well and still argue
the wrong thing.

**Apply to the rest of the corpus:** any line carrying causal/argumentative weight (a character
explaining *why* they did something, or what they believe will happen) is worth this same check,
especially lines drafted or revised independently of the scene that establishes the character's
underlying motive.

## 5. Name things by their catalog identity; don't describe them by comparison to another entity

**What happened (`shot-plan-088`):** the Velari Transport Sphere's prompt described it as "not to be
confused with the much larger organic emissary ship" — using a second, differently-named entity as a
reference point instead of naming the sphere itself. `vehicle:velari-transport-sphere`'s own catalog
entry already carries this disambiguation in its `description` field (*"it must not be confused with
the 300–600 m emissary vehicle"*) — restating it inside a shot prompt via comparison is redundant and,
worse, risks a generator treating "emissary" as something to render. The fix names the entity directly:
*"The Velari Transport Sphere — a small transparent spherical craft, personal/shuttle scale —
approaching with no visible engines or exhaust."*

**Rule:** look up an entity's actual catalog name (`characters.json` / `vehicles.json` / `objects.json`
/ `locations.json`) before describing it in a prompt, and use that name. Don't substitute a comparison
to a different named entity for the thing's own identity — it's fragile (the comparison entity might
not even appear in the shot) and it duplicates disambiguation the catalog record already owns.

**Apply to the rest of the corpus:** grep shot descriptions/prompts for comparative phrasing ("not to
be confused with," "unlike the," "smaller/larger than the") pointing at another named entity, and
prefer the entity's own catalog name plus its own distinguishing physical traits instead.

## 6. Standalone-prompt economy: don't compete with a reference sheet that already exists

Every prompt is read standalone, accompanied only by whichever reference-sheet assets are attached —
never alongside this document, the scene record, or any other prompt (§2c). Two failure modes follow
directly from that:

- **No reference sheet exists yet:** describe the entity fully and by name (per §5) — the prompt is
  the only source of truth the generator has.
- **A reference sheet exists and is attached:** the sheet is the visual source of truth for that
  entity's appearance; heavy re-description in the prompt prose competes with it rather than
  reinforcing it, and the two can drift out of sync over time in ways prose-only entities can't. Keep
  the prompt's mention light — enough to place and orient the entity in the shot (pose, framing,
  interaction), not to re-litigate what it looks like.

This principle is already established and was the basis for a plan (attaching
`asset:vehicle-velari-transport-sphere-sheet` and `asset:character-velari-envoy-sheet`, and lightening
their shots' prose accordingly) that another agent is currently handling — don't duplicate that
specific work. But the underlying rule generalizes: **before writing or auditing any shot's
description/prompt, check whether the entities in it already have an attached reference sheet in
`referenceAssetIds`, and calibrate prose weight accordingly** — full description only for what has no
visual source of truth yet.

## 7. Cross-check costume/equipment state against the shot's actual physical context

**What happened (`shot-plan-092`):** the generated image showed Sorell indoors and out of her EVA
suit, contradicting the immediately adjacent shots (`shot-plan-089`/`091`), which both establish her
on a tether in open space. Fixed by making the suit/helmet state explicit in the description: *"Still
in her EVA suit and helmet, Sorell reaches the transparent sphere in open space..."*

**Rule:** for any shot involving a costume/equipment state that depends on the surrounding physical
context (EVA suit in vacuum, restraint harness during a gravity transition, radiation gear near the
vault), don't assume the state carries over correctly — state it explicitly in the description and
verify it against the immediately adjacent shots in the same continuous action.

**Apply to the rest of the corpus:** any sequence with an EVA/suit-up or suit-doff beat, or any prop
whose presence/absence is plot-load-bearing (the wrist device, the jammer, the recorder), is worth the
same adjacent-shot consistency check.

## 8. Already solved — don't re-solve these by hand

- **Spoken dialogue leaking into *still* image prompts.** A concurrent pass added
  `scripts/lib/still-prompt-no-dialogue.mjs` and `npm run scrub:still-prompts:check`: omitting the
  spoken line from `generation.prompt` is sufficient; don't pad prompts with "avoid subtitles"
  boilerplate. Use the existing tool rather than hand-auditing for this. **Does not apply to
  Seedance / video prompts**, which intentionally carry cue text and voice-sample audio refs
  (`SEEDANCE_PROMPTING.md` §6).
- **Trailer-style condensing without losing the causal payload.** The trailer-master build condensed
  several lines for pacing (e.g. Zao's long vault-discovery paragraph down to *"If this reaches you —
  I found a weapon in the shielded vault."*) — the rule there, worth reusing anywhere else a line gets
  trimmed for time: keep the information the line exists to convey, cut connective tissue, never cut
  the fact the beat depends on.

## 9. Where this generalizes to first/last-frame and video-generation prompts

None of these are dialogue-in-prompt rules specific to still images — they're about what's true of the
shot at a given instant, which is exactly what `firstFrame`/`lastFrame` anchors and video-segment
prompts also compile from (`AGENT_GENERATION_BRIEF.md` §2, the same `compilePrompt` 11 sections used
for stills). Concretely:

- §1 (edit `description`, not the derived artifact) applies unchanged — `firstFrame`/`lastFrame`/video
  prompts will be compiled from the same shot data, so the same drift risk exists the moment any of
  those artifacts get hand-touched independently of `description`.
- §2 (audience physics-transition *legibility* economy) still guides how richly the *story*
  dramatizes a recurring thrust cut; §2c requires every compiled `physics` string (and still /
  first–last image prompt) to **name the correct gravity state** anyway — the generator is
  stateless. Sound-in-vacuum stays in `audio` / description craft. For `firstFrame`/`lastFrame`,
  put the §2 *teaching* cue on the pair of frames that must read as before/after at a glance, and
  still state gravity explicitly on both.
- §5/§6 (catalog naming, reference-sheet economy) apply identically — a video segment's `subjects`/
  `continuity` sections need the same entity-identity discipline as a still's prompt.
- §7 (costume/equipment continuity) matters most at segment boundaries: a `lastFrame` anchor and the
  next segment's `firstFrame` must agree on suit/equipment state exactly, since
  `continuation: last_frame_as_next_first` chains them directly.

No `firstFrame`/`lastFrame` or video-segment prompts exist yet for `light-delay-festival-master`
(per `AGENT_GENERATION_BRIEF.md` §6, `compiledPrompt` stays `null` pre-freeze) — these rules are
written now so they're applied from the start once that work begins, instead of needing a second
audit pass later. For Seedance-facing video prompt *shape* (task routing, `@` reference maps,
integer-second beats, voice-sample audio refs, consecutive-shot jobs under 30 s), use
`SEEDANCE_PROMPTING.md` §6; it does not replace this file's editorial rules. Never attach generated
cue WAVs as Seedance `@Audio` references.
