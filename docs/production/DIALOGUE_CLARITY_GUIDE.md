# Dialogue clarity guide — writing for character voice without losing the audience

Companion to `DIALOGUE_AND_PROMPT_LESSONS.md` (correctness/consistency fixes: belief-state,
argument-content, naming) and `AGENT_GENERATION_BRIEF.md` §7 (tone pass: harsh → human/colloquial,
consult `voice-profiles.json` before rewriting, no accent-by-misspelling). This document is about a
different, narrower failure mode found repeatedly across the corpus: lines that are **accurate and
in-character but too compressed for a general audience to parse on a single hearing**, especially at
festival-cut pace where a line plays once, at speed, often over visuals doing their own work.

Status: recommendations, not narrative authority. Verified against the repository on 2026-09-12.

## The problem in one sentence

A line can be *correct* (says the right thing, sounds like the right character) and still fail the
audience if its meaning only lands on a second read — because it's a sentence fragment, an elliptical
callback that assumes the audience is holding the previous line in short-term memory, or dense
technical shorthand nobody in the audience has context for. Festival-cut dialogue especially trends
toward this: characters under pressure clip their sentences, which is dramatically true to the moment
but easy to over-apply until every exchange reads like a telegram.

## Recent examples of this exact fix (grounded, from the current script)

These are real edits already made to `script:light-delay-festival-master`; use them as the calibration
reference — the target is closer to the "after" column, not maximal expansion.

| Cue | Before | After | What changed |
| --- | --- | --- | --- |
| vault readout (Zao reads the controller) | *"Geophysical impulse package… one point three tonnes."* | *"This is an impulse warhead for geophysical research from the Proxima… one point three tonnes."* | Named what the object **is** (a warhead), not just its technical label. A general audience doesn't reliably parse "impulse package" as a bomb; "warhead" does the work in one word. |
| same beat, next line | *"Multi-megaton. Contact coordinates. Contact time."* | *"Multi-megaton. Set for the contact coordinates — and the contact time!"* | Three noun fragments became one clause with a verb (*"Set for"*) connecting them, plus a dash-and-exclamation to keep the mounting horror. The audience now gets *what the numbers mean* (they're a countdown target), not just a list of jargon. |
| Elin, dismissing Harlan's claim | *"Could have is not did."* | *"Could have doesn't mean did."* | Fixed telegraph-grammar into a real sentence. The compressed version reads as clipped *and* slightly broken English — ambiguous whether that's a character choice or an error. The fix keeps it just as short but grammatically whole, so terseness reads as intentional, not garbled. |
| Elin, countering Harlan again | *"Agree is not prove."* | *"Agreement isn't proof."* | Same fix, same pattern: noun forms instead of a dropped-article fragment. |
| Harlan, persuading Okoye | *"You served long enough to know caution isn't treason."* | *"I know you, Dara. I know what duty costs you."* | Not a length fix — a **legibility-of-motive** fix. The original stated an abstract proposition (caution vs. treason) the audience has to unpack under time pressure; the rewrite is concrete and personal (uses her name, names the actual stake — what duty has cost her) and does the same persuasive work faster to parse, not slower. |
| Sorell, pressing Voss to act | *"Be right now. We can talk about sorry later."* | *"We can be sorry later. Right now, I need to be right."* | Reordered for the natural information sequence (concession first, demand second) instead of demand-then-concession, which reads as backwards on first hearing even though every word is the same idea. |

Pattern across all six: **none of these added exposition or explained the plot.** Each kept the same
information and the same character register; the fix was almost always grammar (a fragment becoming a
clause), word choice (a precise concrete noun replacing a vague technical one), or sequencing
(reordering clauses into the order a listener actually needs them in) — not padding.

## What to do, in order of priority

1. **Give jargon a plain-language anchor the first time it's used.** "Impulse package" → "impulse
   warhead." Not every technical term needs this (the audience doesn't need "neutron peak" spelled out
   if the visual and the reaction sell the danger), but anything load-bearing for the plot — the thing
   that *is* the threat, the device that *is* the clue — should be nameable by ear on first hearing.
   Test: could an audience member repeat back what the object/event is, using only what was said aloud?
2. **Turn noun-fragment lists into a clause.** "Contact coordinates. Contact time." tells you two nouns
   are important but not what they're *for*. Adding one verb ("Set for the contact coordinates — and
   the contact time") turns a list into a fact the audience can hold onto.
3. **Fix telegraph-grammar into whole sentences, even short ones.** "Could have is not did" versus
   "Could have doesn't mean did" are the same length and the same bluntness, but only one of them is
   unambiguously a deliberate rhetorical style rather than broken syntax. Terseness should read as a
   character choice, never as a copyediting gap.
4. **Prefer the concrete and personal over the abstract, at equal or shorter length.** "Caution isn't
   treason" is a proposition the audience has to evaluate; "I know what duty costs you" is a claim
   about a specific person the audience just watched be under duty's pressure. The concrete version is
   both easier to parse instantly and does more characterization per word.
5. **Sequence clauses in the order a first-time listener needs them**, not the order that scans best on
   the page. Concession-then-ask reads as reasoning; ask-then-concession reads as a reversal the ear has
   to double back on mid-sentence.
6. **Don't fix clarity by adding a sentence that explains the plot.** This is the boundary that
   distinguishes clarity work from forced exposition (`AGENTS.md`, `AGENT_GENERATION_BRIEF.md` §7): if
   the fix requires a character to state something purely for the audience's benefit that no one in the
   scene would actually need to say to each other, it's exposition, not clarity, and it's a regression
   even if it makes the plot more legible on paper.

## How to tell "appropriately terse" from "too cryptic" for a given line

Ask, for the specific character and moment:

- **Does the line's terseness come from the character's established voice, or from the writing
  compressing for its own sake?** Check `voice-profiles.json`'s `dialogueStyle`/`prosody` for that
  speaker — e.g. Rao's profile already establishes she "firms up, accelerates, and speaks with
  conclusive precision" in technical mode, so clipped technical lines are *in character* for her; the
  same clipping on a character without that established trait may just be under-written.
- **Is this the audience's only exposure to the information in the line?** A line that's the sole
  carrier of a plot-load-bearing fact (what the device is, who did what, what the stakes are) needs
  more legibility headroom than a line that's mood/character color the audience can afford to half-miss.
- **Does the moment's pace actually demand brevity**, or is the brevity a holdover from an earlier,
  more expository draft that got cut down and never re-expanded where it needed to be? Several of the
  fixes above were exactly this: an earlier tightening pass (see `e95aec8`, "Tighten Festival
  dialogue") correctly cut bloat elsewhere but left a few lines cut past the point of parseability.
- **Read it aloud at performance speed, once, with no visual context.** If the plot-relevant content
  doesn't land on that single pass, it's a candidate for this treatment regardless of how well it
  reads on the page.

## Calibration: this is not a license to expand every short line

The project has pushed dialogue in both directions at different times — a tightening pass
(`e95aec8`) cut bloat and inconsistency; the clarity fixes above then *re-expanded* a handful of lines
that tightening had left under-parseable. Both are legitimate; the skill is telling which a given line
needs. Signs a line should stay short as-is:
- It's confirmed by the visual (a readout the camera also shows, an action the blocking already makes
  obvious) — redundant clarity in dialogue is padding when the image already carries the information.
- The character's profile establishes clipped delivery as their default register and the content isn't
  plot-load-bearing.
- It's a one-word or one-clause reaction (agreement, refusal, an exclamation) rather than a line
  carrying new information.

## Applying this across the rest of the corpus

The two passes that produced the examples above (`e95aec8`, `ad199b3`) covered a handful of lines each,
found opportunistically while working on other things — this has **not** been done as a systematic pass
over all ~130+ dialogue cues. A useful audit method: read each scene's dialogue cues in isolation (text
only, no stage direction, no visuals) and flag any line where the plot-relevant content doesn't land on
one read. Cross-check flagged lines against the speaker's `voice-profiles.json` entry before rewriting,
per §7 of `AGENT_GENERATION_BRIEF.md` — and re-run `npm run report:dialogue-style` /
`npm run validate:data` after any batch of changes, same as every other dialogue pass this project has
made.

This generalizes to Spanish too: an ES variant carried over from a since-clarified EN source needs the
same clarity pass, not just a literal retranslation — check that the ES phrasing has the same plain-
language anchor for load-bearing terms, not only grammatical correctness.
