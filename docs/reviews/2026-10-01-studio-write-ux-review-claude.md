# Studio Write — UX review

Oct 1, 2026 · Claude Opus 5.5

Review of the Studio Write surface on `implementation/m2-authoring` at `164799d` (M2.5 merged), measured against [`STUDIO_DESIGN_SYSTEM.md`](../STUDIO_DESIGN_SYSTEM.md), [`V2_UI_AND_VERTICAL_SLICE.md`](../V2_UI_AND_VERTICAL_SLICE.md) and [ADR-0004](../ADR-0004-AUTHORING-STORY-STATE-AND-PROVISIONAL-WORK.md). The owner's running instance was inspected read-only. All states were exercised on a separate in-memory Studio in Chromium at 1440×900, 1100×800 and 390×844. This review records evidence for the guideline revision of the same date; it changes no code.

## Summary

The surface follows the letter of the design system: neutral palette, hairlines, no cards, hover-revealed controls. It misses the intent of the Write lens. It behaves as a form of per-element text fields, not a screenplay editor. The chrome exposes the persistence model. Keeping one's own edit takes three explicit steps. The guidelines contributed: they are mostly adjectives and prohibitions, which an implementation can satisfy by subtraction while omitting positive capabilities.

## Defects (fix regardless of design direction)

| # | Defect | Evidence |
| --- | --- | --- |
| U1 | Wrapped text is hidden. Each element is a fixed-height `textarea` (`rows` 1–2, `overflow: hidden`). | Dialogue with two lines: `scrollHeight` 51 px in a 27 px box; only "lit." visible after acceptance. At 390 px the action line is cut after "clears the". Stored text is complete. |
| U2 | Switching cut silently discards unsaved edits. `openVersion` resets elements and `dirty`. No reload guard either. | Edit Feature → Trailer → Feature: edit gone, no warning. The outage banner meanwhile says "Your unsaved work is kept in this browser". |
| U3 | Declared fonts are not shipped. Inter and Courier Prime fall back to system faces (Segoe UI / Courier New on Windows). | `document.fonts` empty. |
| U4 | Every element shows a vertical resize grip. | `resize: vertical`. |
| U5 | Restore is one click, without preview or confirmation, and is offered for the current revision. | History panel. |
| U6 | "Review changes" stays primary while a Proposal is pending. | Review state. |
| U7 | Muted text fails AA at small sizes; much UI text is 9–11 px; ↑/↓ targets ≈18 px; focused text fields show only a 1 px hairline. | `#74746f` on `#f7f7f5` = 4.38:1. |
| U8 | The connectivity banner pushes the document down while typing. | Outage state. |

## Design findings

1. **Not an editor.** Elements are independent fields. Enter does not create an element, Tab does not change type, selection and undo do not cross elements. Only "+ Action" exists, so dialogue, character cues and scene headings cannot be added.
2. **No application identity.** The left of the app bar shows the project name, then "Project — Scene". Users read the project as the application, and the scene title has no home of its own.
3. **Model vocabulary in the chrome.** "Authoritative screenplay", "Authoritative projection", "Project revision 0", "Draft saved · provisional", "deterministic local Draft comparison", raw `proposal:…` IDs.
4. **Status in three places.** The second bar, the document header and the footer repeat the same state ("Unsaved Draft changes" / "Draft has unsaved changes").
5. **Chrome budget.** Two bars (90 px) carry a duplicated project name, a single "Write" tab and split related actions (Save Draft and Review changes on different rows).
6. **Layout instability.** Opening a panel re-centres the page.
7. **Review in the wrong place.** Two full copies of the line in a 288 px sidebar instead of track changes in the document.
8. **Ceremony.** Save Draft → Review changes → Accept to keep one's own sentence. ADR-0004 requires distinct *Saved* and *Accepted* promises; it does not require a manual save or a review panel for the author's own edits.

## Disposition

Guideline revision first, then implementation in phases: correctness (U1–U8), shell and identity, saving and committing, continuous editor. See the revised [design system](../STUDIO_DESIGN_SYSTEM.md), [Write lens](../V2_UI_AND_VERTICAL_SLICE.md#write-lens) and the [ADR-0004 addendum](../ADR-0004-AUTHORING-STORY-STATE-AND-PROVISIONAL-WORK.md#addendum--saving-and-committing-in-write-oct-1-2026).

The owner's existing responsive and typographic method (character-measured breakpoints, rem-only sizing, readability preferences) was adopted from Color Lab, Spanwise, World Lab, svizzle's `ScreenSensor`, and the note [*Glyph metrics and responsive design*](https://ferreyrapons.com/notes/glyph-metrics-responsive-design). Chromium 141 was checked to evaluate `ch` in container-query conditions against the query container's own font, which gives per-container character breakpoints in CSS.
