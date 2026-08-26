# Light Delay — Homepage Copy Fixes

**Scope:** English landing page (`https://saabi.github.io/light-delay/`), source file(s) for the homepage content. Locate the markdown/template source that generates this page — it will contain frontmatter and the sections below in order.

**Note on Spanish page:** the ES homepage (`/es/`) is a close translation and shares issue #1 (numeral inconsistency) and issue #3 (short-film naming) in its own wording ("17" vs. "Diecisiete", "el cortometraje principal" vs. implied naming). If a parallel ES source file exists, apply the equivalent fixes there once the EN wording is finalized — don't auto-translate the English strings below; have a human/translator confirm the ES equivalents.

Apply the following edits in order. Each entry gives the exact current text, the exact replacement text, and why. Do not alter any text, links, or markup not listed here.

---

## 1. Story section — trim and clarify

**Location:** Section `01 — The story`

**Find:**
> A human mission approaches a meeting that may never be possible again. When an engineer discovers sabotage and internal communications fail, she must aim the ship's external laser at its own future trajectory before the person responsible reaches her.

**Replace with:**
> A human mission approaches an unrepeatable encounter. When an engineer discovers sabotage and internal communications fail, she must aim the ship's external laser at its future trajectory before the saboteur reaches her.

**Why:**
- "a meeting that may never be possible again" → "an unrepeatable encounter": tighter, matches the weight of the Spanish original ("un encuentro irrepetible"), avoids the administrative connotation of "meeting."
- "its own future trajectory" → "its future trajectory": "own" is redundant (whose else would it be).
- "the person responsible" → "the saboteur": the word "sabotage" was already introduced one clause earlier — reuse it instead of a generic paraphrase.

---

## 2. Tagline — add "hard"

**Location:** Top eyebrow tag, above the H1

**Find:**
> Science-fiction short film · In development

**Replace with:**
> Hard science-fiction short film · In development

**Why:** The meta description already calls this "a hard science-fiction short film," but that word never appears in the visible copy. Given the project's identity rests specifically on scientific rigor, it should appear on-page, not just in metadata.

---

## 3. Spelling convention — Americanize "travelling"

**Location:** Subhead, below the H1

**Find:**
> ...a warning that can only catch them by travelling at the speed of light.

**Replace with:**
> ...a warning that can only catch them by traveling at the speed of light.

**Why:** The page's `og:locale` is `en_US`. Single-L "traveling" is the American spelling; double-L is British. Standardize to match the declared locale. (If other pages on the site consistently use British spelling instead, flag this back rather than applying — check for a sitewide convention first.)

---

## 4. Numeral and naming consistency — script card

**Location:** Nav card for the script (`Canonical script`)

**Find:**
> Seventeen scenes from the principal short film.

**Replace with:**
> 17 scenes from the main short film.

**Why:** Two inconsistencies in one line:
- "Seventeen" (spelled out) vs. "17" used in Section 03 ("The main short has 17 scenes") — pick one convention. Use the numeral, since it sits next to "112-shot animatic" elsewhere on the page and should match style.
- "the principal short film" vs. "the main short" (Section 03) — same object, two different labels. Standardize on "the main short[ film]."

---

## 5. CTA consistency — nav cards

**Location:** Fourth nav card (`Project archive`)

**Find:**
> **Open the project archive →**

**Replace with:**
> **Open →**

**Why:** The other three cards all end in a plain "Open →". This one is uniquely long and repeats the card's own title ("Project archive... Open the project archive"), which reads as an inconsistency rather than intentional emphasis. Match the other three.

---

## Do NOT change

- "In development" appears three times (tag line, Section 02, footer). This is confirmed intentional status framing — leave as is.
- All links, hrefs, image sources, and frontmatter fields (meta-description, og tags, etc.) are correct as-is — do not touch.
- Section 02 and Section 03 body copy (other than the numeral/naming fix in #4) are unchanged.

---

## After applying

1. Diff the rendered page against the current live version to confirm only the five spans above changed.
2. Re-read Section 01 and the tagline aloud to confirm flow.
3. Flag back if a sitewide spelling convention (American vs. British) is found that contradicts fix #3.
