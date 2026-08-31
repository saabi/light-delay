# Títulos y créditos

Estado: especificación de presentación para main, Festival y tráiler. El español es la fuente editorial de los cues; las stills generadas usan inglés en imagen por ahora. No autoriza generación hasta el freeze del cut.

## Colocación

| Cut | Cold open | Título diferido | Cierre |
|-----|-----------|-----------------|--------|
| Main | Escena 01 | `main:scene-title` / `main:shot-title-01` | `main:scene-18` créditos |
| Festival | Overlay diegético en `festival:shot-a-01` | `festival:scene-title` | `festival:scene-h` créditos |
| Tráiler | VO inicial | Mid `FIRST CONTACT` (cue); marca al final | Créditos tras lema en `trailer:scene-i` |

## Full frame vs alpha

| Asset | Entrega | Prompt |
|-------|---------|--------|
| Título de obra (main/festival) | Full frame opaco 1536×864 | A |
| Marca final tráiler | Full frame | B |
| Lema tráiler | Full frame | C |
| Créditos (3 tarjetas) | Full frame | D1–D3 |
| Mid `FIRST CONTACT` tráiler | Alpha PNG | E |
| HUD misión Festival | Alpha PNG | F |

## Copy on-image (generación EN)

```text
LIGHT DELAY
LATE LIGHT

SOMETIMES, ARRIVING LATE IS ARRIVING ON TIME.

WRITTEN AND PRODUCED BY
AUTHOR_NAME_PLACEHOLDER

AI ASSISTANCE
ChatGPT · Claude · Gemini · Cursor Composer

PRODUCTION TOOLS
Light Delay schema & production tools

FIRST CONTACT
FIRST CONTACT — VELARI MISSION
```

Los cues JSON conservan español fuente + inglés draft. `AUTHOR_NAME_PLACEHOLDER` se sustituye cuando el autor aporte el nombre legal.

## Prompts (EN → modelo)

### A — Delayed film title (full frame)

```text
Still frame for a hard science-fiction short film title card, 1536x864, 16:9.
Full opaque image, NOT transparent, NOT an overlay plate.
Absolute black void background (#000000), empty deep space with no stars or only the faintest dust.
Centered English title stack only:
  top line: LIGHT DELAY
  second line, smaller: LATE LIGHT
Clean geometric sans-serif, wide letter-spacing on the top line, precise kerning, cool neutral white to pale blue-white type.
Optional subtle motif: two or three extremely soft horizontal luminous layers behind the words, arriving with a slight optical delay feel (light lag), very low intensity, no bloom blowout.
Mood: restrained, cold, documentary hard-SF, not fantasy, not trailer-explosion energy.
No Spanish text, no ships, no planets, no people, no UI, no logos, no tagline, no extra words.
Photoreal cinematic grade, flat title design, high legibility.
```

### B — Trailer end brand (full frame)

```text
Still frame for the end title of a hard science-fiction trailer, 1536x864, 16:9.
Full opaque image, NOT an alpha overlay.
Near-black void. Centered English title only:
  LIGHT DELAY
  LATE LIGHT
Same typography rules as the main title card: geometric sans, wide tracking, cool white.
Add one quiet organic bioluminescent pulse in the deep background — a single soft teal-cyan Velari light bloom, distant and abstract, not a creature, not a spaceship, not a space station silhouette.
Suggest delayed light: title glyphs feel like stacked light layers with a tiny temporal offset, elegant not flashy.
No Spanish text, no tagline on this frame. No characters, no readable HUD, no studio logo.
Cinematic, minimal, unresolved first-contact tension.
```

### C — Trailer tagline (full frame)

```text
Still frame title card, 1536x864, 16:9, full opaque black field.
Single centered English caption in clean geometric sans, medium tracking, cool white:
SOMETIMES, ARRIVING LATE IS ARRIVING ON TIME.
No Spanish text. No other words. No title above. No ships, planets, people, UI, logos, or decorative flourishes.
Hard science-fiction restraint, high legibility, flat design on pure black.
```

### D1 — Author/producer credit (full frame)

```text
End credit still, 1536x864, 16:9, full opaque pure black background.
Centered English credit block in clean geometric sans, cool white, high legibility:
Role line (smaller, tracked): WRITTEN AND PRODUCED BY
Name line (larger): AUTHOR_NAME_PLACEHOLDER
No Spanish text, no photos, no logos, no film strip, no particles, no extra credits on this card.
Minimal hard-SF end-credit aesthetic.
```

### D2 — AI assistance (full frame)

```text
End credit still, 1536x864, 16:9, full opaque pure black background.
Centered English credit block, clean geometric sans, cool white:
Role line: AI ASSISTANCE
Names line: ChatGPT · Claude · Gemini · Cursor Composer
Equal visual weight among the four names, no product icons, no chat-bubble illustrations, no robot imagery.
No Spanish text. Minimal, typographic only.
```

### D3 — Production tools (full frame)

```text
End credit still, 1536x864, 16:9, full opaque pure black background.
Centered English credit block, clean geometric sans, cool white:
Role line: PRODUCTION TOOLS
Names line: Light Delay schema & production tools
Typographic only; no IDE screenshots, no JSON braces as decoration, no logos, no Spanish text.
Minimal hard-SF end-credit aesthetic.
```

### E — Trailer mid mission label (alpha)

```text
Transparent PNG overlay plate, 1536x864, 16:9, alpha background fully transparent.
Only the English words: FIRST CONTACT
Clean geometric sans, wide tracking, cool white (or soft HUD cyan-white), centered in the upper third or true center.
No Spanish text, no background fill, no black bar, no box, no glow bloom that creates an opaque halo — keep edges clean for compositing over a live spacecraft separation plate.
No other text, no brackets, no mission codes.
Flat title typography suitable as a non-diegetic mission card.
```

### F — Festival diegetic mission HUD (alpha)

```text
Transparent PNG HUD overlay, 1536x864, 16:9, alpha fully transparent.
Diegetic mission label only, English operational style:
FIRST CONTACT — VELARI MISSION
Smaller than a film title, technical interface typography, thin geometric sans, soft cyan-white, placed as if over an exterior wide shot (lower-third or corner-safe), not centered hero title.
No Spanish text, no opaque panels, no glass cards, no flags, no film title LIGHT DELAY.
Clean edges for compositing over Proxima / Jupiter / Celestial Ardor dock plate.
```

## Datos

- Presentación de cue: `title` | `caption` | `credits` | `interface` (misión Festival).
- Tomas nuevas usan `asset:animatic-placeholder-missing-frame` hasta generación autorizada.
- Regenerar tráiler: `npm run build:trailer` (incluye créditos en `scripts/build-trailer-script.mjs`).
