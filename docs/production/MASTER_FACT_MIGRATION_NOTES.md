# Master fact migration notes

Collected reasoning for the **Verdict**/**Notes** columns in [`MASTER_FACT_MIGRATION_MAP.md`](MASTER_FACT_MIGRATION_MAP.md). **Applied 2026-09-13** to the master outline + Festival cue bindings (see map post-apply set). Read the cross-cutting finding first — it changes how you should re-derive *every* flagged row, not just the ones with their own section.

Source material for this pass: the full ledger (`data/continuity/light-delay-festival-master.json` — facts, steps, knowledgeEvents, actionRequirements) and the master outline prose (`data/outlines/light-delay-master-narrative.json`) at every claimed `introducedInStepId`, plus neighboring steps wherever the claimed step's prose didn't support the fact.

## Cross-cutting finding: systematic late/adjacent-step anchoring

Across roughly a third of the 24 rows, the claimed `introducedInStepId` is the step *after* the one whose prose actually establishes the fact — as if the 1:1 port picked "the next outline step in the Festival story's `sourceRefs` chain" rather than matching content. Confirmed examples, each with an exact master step id whose prose is a much closer match than the claimed one:

- `first-thrust-cutoff-done` (fact-03) → claimed `a3c`, prose is crew banter; `a3b` ("Transit and the first gravity dip") is the actual thrust-cutoff/turnover beat.
- `sabotage-heard-comms-cut` (fact-06) → claimed `b4b` ("Sorell volunteers" — the bridge's *response*), but the sabotage acts themselves are `b2`/`b3`, two steps earlier.
- `only-moving-intercept-left` (fact-07) → claimed `b6` ("Targeting mathematics"), but `b5` is literally titled "The only possible warning" and its prose is close to verbatim the fact's description.
- `zao-dead-flight-cut-after-murder` (fact-09) → claimed `c3b` ("The throat crossing," merely "juxtaposed" with the murder editorially), but `c3` is literally titled "Murder" and `c3a` is literally titled "The vault secured and flight controls cut."
- `sorell-found-body-cameras` (fact-10) → claimed `c5` ("Reconnection" — Harlan's actions + camera feed resuming), but `c4` ("Sorell arrives") is the actual discovery beat.
- `evidence-converges-revoke-harlan` (fact-17) → claimed `e5` (entirely about signature *authentication*), but "isolate Harlan / release Sorell" is `e6`'s content.
- `clean-greeting-prepared` (fact-22) → claimed `g1`, but `f6` already says "[Sorell] completes the greeting" — `g1` is authorization + transmission, a later beat.

**When you re-derive an intro step, don't trust adjacency — re-check the claimed step's actual prose against the neighboring steps' prose, every time.**

---

## `sabotage-heard-comms-cut` (fact-06) — highest-value finding

Claimed intro: `b4b`. Actual source beats: `b2` (Harlan jams Zao's wireless — secret, no witnesses) and `b3` (Harlan physically cuts wired comms + cameras — secret, no witnesses). Two propositions with **two different, incompatible visibility levels** are currently merged into one `overt`-ish fact:

- "The bridge hears Zao's sabotage report cut off mid-sentence" — genuinely overt, everyone present knows *something* happened.
- "Harlan personally is the one who cut wireless/wired/cameras" — must be `withheld`; only the audience (and Harlan) know this until evidence converges much later.

**This is not a style nitpick — it's a live correctness bug carried in the current ledger.** Its `knowledgeEvents` for `fact-06` record all six characters (harlan, zao, voss, rao, sorell, okoye) as "knowers" of fact-06 at `causal-06` — i.e. the current model already claims **everyone knows Harlan is the culprit from story beat 6**, three steps before the murder even happens. A mechanical port carries this straight into the master. Any future belief-state or actionRequirement check built on this fact (e.g. "no one accuses Harlan before evidence converges") would be silently wrong.

**Proposed split:**
- `master:fact-bridge-hears-cutoff-warning` — `audienceVisibility: overt`, knowers = present bridge crew, intro `b2`.
- `master:fact-harlan-jams-wireless` — `audienceVisibility: withheld`, knower = `character:harlan` only, intro `b2`.
- `master:fact-harlan-cuts-wired-comms-cameras` — `audienceVisibility: withheld`, knower = `character:harlan` only, intro `b3`.

---

## `zao-dead-flight-cut-after-murder` (fact-09) — second-highest-value finding

Claimed intro: `c3b` ("The throat crossing" — visually juxtaposed with the murder, but the murder isn't depicted there). The precise beats already exist as separate steps: `c3` is literally titled **"Murder,"** `c3a` is literally titled **"The vault secured and flight controls cut."** This is exactly the order-gate the whole pipeline exists to check — it's what the Vitest test at `src/lib/data/repositories/festivalMasterScript.spec.ts:90-110` currently checks via English string order, and what the pipeline replaces with fact-id order.

**Proposed split — three facts, not two.** `c3a`'s own title bundles two of Harlan's actions ("The vault secured **and** flight controls cut"), and the vault half is load-bearing on its own: it's what `vault-lock-rejects-timing-diagnostic` (fact-14) depends on later, and that dependency currently doesn't exist anywhere in the graph — fact-14 just asserts the lock is hostile with no fact explaining why.

- `master:fact-zao-murdered` — intro `c3`.
- `master:fact-harlan-secures-vault` — intro `c3a`, `dependsOnFactIds: [master:fact-zao-murdered]`. **New mint** — currently has no representation anywhere.
- `master:fact-flight-controls-cut` — intro `c3a`, `dependsOnFactIds: [master:fact-zao-murdered]`.

**Downstream:** add `master:fact-harlan-secures-vault` to `vault-lock-rejects-timing-diagnostic`'s (fact-14) `dependsOnFactIds` when that row is ported — see its own section below — so "the lock rejects command authority" is actually derived from "Harlan secured it," not asserted independently.

---

## `recording-ids-bomb-harlan` (fact-16) / `evidence-converges-revoke-harlan` (fact-17)

`recording-ids-bomb-harlan` (fact-16, claimed intro `e2`) calls the recording "authenticated" — but authentication is `e5`'s entire content ("Elin verifies the cryptographic signature... The authentication answers Harlan's objection"), a separate step three beats later. Meanwhile `evidence-converges-revoke-harlan` (fact-17, claimed intro `e5`) describes isolating Harlan and releasing Sorell — but that's `e6`'s content ("Voss revokes Harlan's network authority... ends Sorell's custody"), not `e5`'s (which is purely about the signature check). So `e5` currently has **no fact of its own**, even though it's a distinct, load-bearing beat — it's what "answers Harlan's objection," i.e. what turns a contested recording into settled evidence.

**Proposed fix (touches 3 facts, 1 step realignment):**
- `master:fact-recording-identifies-bomb-harlan` — drop "authenticated" from the description; intro stays `e2`.
- `master:fact-recording-authenticated` — **new**, intro `e5`, `dependsOnFactIds: [master:fact-recording-identifies-bomb-harlan]`.
- `master:fact-evidence-converges-revoke-harlan` — **move** intro from `e5` to `e6`; `dependsOnFactIds: [master:fact-recording-authenticated]`.

**Also fix while here:** the existing `actionRequirements` entry at `causal-16` ("Voss: order an abort only after hearing the authenticated warning") is currently gated on `fact-15` (the `d7` signal-detection fact), not on the recording/authentication facts at all — re-point it at the new `master:fact-recording-authenticated` (or `-identifies-bomb-harlan`) once the split lands, since `d7` only detects an incoming signal, it doesn't establish what it says.

---

## `undeclared-mass-neutron-aft` (fact-04)

Claimed intro: `a5`. The fact bundles two distinct observations that map to two adjacent, purpose-built steps: `a4` is literally titled **"Discrepancy"** (the fuel/mass anomaly), `a5` is titled **"Understanding"** (the dosimeter/neutron-excess reading, explicitly still ambiguous at that point — "the reading cannot yet distinguish an off-ratio fusion burn from a compact shielded source"). Keeping this as one fact currently mints the neutron-source conclusion a step earlier than the story actually commits to it.

**Proposed split:** `master:fact-fuel-mass-discrepancy` (intro `a4`) and `master:fact-neutron-excess-detected` (intro `a5`, `dependsOnFactIds: [master:fact-fuel-mass-discrepancy]`).

**Not a merge candidate with fact-05** despite being adjacent: fact-04's content is later **independently rediscovered** by Elin/Okoye at `d2b`/`d4` without Zao's fuller knowledge (she's dead, the recording hasn't played) — that's a real second knowledge-thread the split preserves; merging into fact-05 would lose it.

---

## `burst-sent-earth-wrong-inference` (fact-08)

Claimed intro: `c2`. This is the pipeline's own headline belief-state example, and it needs to become a pure belief fact, not a compound of world-truth + wrong-belief. The "world-truth" half (what the burst actually targeted) is **already covered** by the existing `only-moving-intercept-left` → `burst-corridor-signal-incoming` chain (fact-07 → fact-15: `b5` "the only possible warning" / `d7` "reception confirms the moving receiver"). **Don't mint a third "true target" fact** — narrow fact-08 down to just:

`master:fact-harlan-believes-burst-reached-earth` — a true fact about Harlan's psychological state ("Harlan believes X"), intro `c2`. Represent his belief via a `knowledgeEvents` entry for `character:harlan` only (not the dropped `knowersAtIntroduction` field). This is exactly the "audience learns via fact-15 at `d7`, Harlan still believes wrong-X until [never explicitly corrected on-screen]" case the `knowledgeEvents`/`actionRequirements` model was chosen to support.

---

## `harlan-loading-access-open` (fact-02)

`a3`'s prose (Zao/Elin's systems-check ritual) doesn't mention Harlan's access at all — no textual support at the claimed intro step. Didn't have `a1`/`a2` prose in hand to confirm the right target this pass. **Re-derive against `a1`/`a2` before porting** — don't assume the current `a3` anchor is even approximately right.

## `sorell-found-body-cameras` (fact-10)

"Found Zao" is `c4` ("Sorell arrives" — "She finds Zao drifting, catches her, and attempts aid"), not `c5`. The camera-evidence half of the fact ("restored cameras show only the rescue attempt") is a distinct, later, more consequential claim — it's the exculpatory-ambiguity evidence that `harlan-accusation-not-proof` (fact-11) and the fact-17 cluster build on — and deserves its own fact at `c5`, not a clause riding on fact-10.

## `harlan-accusation-not-proof` (fact-11)

The accusation itself is `c7` ("Found" — "How could you? Why?"); "does not prove" is `c9`'s conclusion. Keep the intro at `c9` (that's the load-bearing "case stays open" claim gating fact-12), but either drop the "Harlan's accusation" framing from the description or split the accusation itself out to its own fact at `c7`.

## `vault-lock-rejects-timing-diagnostic` (fact-14)

"Elin left a timing diagnostic beside it" isn't in the `d4` prose available this pass — possibly a scene/shot-level detail not present in the outline body. Verify against the source before porting as-is. Independent of that: once `master:fact-harlan-secures-vault` exists (see the fact-09 section above), add it to this fact's `dependsOnFactIds` — the lock's hostility should derive from Harlan having secured it, not stand alone in the graph.

## `bomb-delayable-scientific-input` (fact-21)

The actual act (Rao using the timing input instead of cutting power) isn't shown in the `f6` prose available this pass — `f6` shows the aftermath ("deadline deferred"). Check for an intervening step (an `f5`?) before locking the intro step; don't anchor to `f6` by default the way several other rows were.

## `clean-greeting-prepared` (fact-22)

`f6` already says "[Sorell] completes the greeting" — that's "prepared." `g1` is authorization + transmission, a later beat. Consider splitting `master:fact-greeting-completed` (intro `f6`) from `master:fact-greeting-authorized-sent` (intro `g1`) rather than keeping one fact spanning both.
