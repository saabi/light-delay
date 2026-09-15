# Festival-master — Suno free-tier prompt pack

**Status:** WIP handoff (not narrative SoT). English.  
**Cut:** `script:light-delay-festival-master`.  
**Cue sheet:** [`festival-master-music-cues.en.md`](festival-master-music-cues.en.md).  
**Guide:** [`docs/GUIA_BANDA_SONORA.en.md`](../GUIA_BANDA_SONORA.en.md).  
**Generator:** Suno **free** account (external). No local YuE2/ACE in this pass.

Stems are instrumental underscore beds. Assemble in Resolve/Fairlight; do not expect one continuous 13.6-minute Suno render.

---

## Operator checklist (Suno free)

1. Confirm current free-tier terms and attribution rules before festival submission.
2. Prefer **instrumental** / instrumental-leaning modes; no sung lyrics.
3. Generate **multiple takes** per stem; keep best-of-N.
4. Export WAV (preferred) or high-quality MP3.
5. Name files to match stem ids below.
6. Stage locally under:  
   `static/assets/audio/music/light-delay-festival-master/<stem-id>.wav`  
   (registration + `trackAssetId` linking is a **later** pass — not this pack).
7. Duck/stop at death and withheld-recording beats in the edit even if a stem overruns.

### Shared negative / avoid (append to every stem)

```text
sung lyrics, vocal choir with words, pop song structure, verse chorus hooks,
generic thriller orchestra stabs, trailer whooshes, comedy stingers,
plot-expository melody, heroic fanfare, EDM drops, karaoke, vocal ad-libs,
watermark voice, radio DJ, dialogue, speech
```

### Shared style base

```text
instrumental cinematic underscore, hard science fiction, restrained, precise,
no melody that acts or announces the plot, music accompanies systems and pressure
```

---

## Stems

### `fm-stem-ship-01`

| | |
| --- | --- |
| **Filename** | `fm-stem-ship-01.wav` |
| **Plays** | `beat-00-title` → `beat-05` (title, ops gallery, meal / dock) |
| **Target duration** | ~90–120 s (loopable / trimable) |
| **BPM / feel** | Slow pulse or free; ~60–72 if pulsed; almost diegetic |

**Style / tags**

```text
instrumental cinematic underscore, hard science fiction, cold synth drones,
low-frequency hull hum, ambient electronic, nearly diegetic ship systems,
sparse, restrained, no lead melody, Ad Astra / Annihilation vein without pastiche
```

**Negative:** *(shared)* + `warm strings theme, romantic piano, action percussion`

---

### `fm-stem-ship-02`

| | |
| --- | --- |
| **Filename** | `fm-stem-ship-02.wav` |
| **Plays** | `beat-06` first gravity dip |
| **Target duration** | ~45–70 s |
| **BPM / feel** | Same register as ship-01; slightly denser LF, unsettled but not sabotage |

**Style / tags**

```text
instrumental cinematic underscore, hard science fiction, cold synth drones,
microgravity tension, denser low end, ship systems still nearly diegetic,
sparse, no thriller orchestra, continuous with prior ship bed
```

**Negative:** *(shared)* + `horror risers, jump-scare hits`

---

### `fm-stem-sabotage-01`

| | |
| --- | --- |
| **Filename** | `fm-stem-sabotage-01.wav` |
| **Plays** | `beat-07` → `beat-09` (extra burn → package) |
| **Target duration** | ~70–100 s |
| **BPM / feel** | Irregular pulses; layers slightly out of phase |

**Style / tags**

```text
instrumental cinematic underscore, procedural dissonance, corrupted systems,
irregular percussion, out-of-phase layers, contained tension,
diplomatic-core sabotage atmosphere, no classical thriller orchestra
```

**Negative:** *(shared)* + `heroic brass, chase music, rock drums`

---

### `fm-stem-sabotage-02`

| | |
| --- | --- |
| **Filename** | `fm-stem-sabotage-02.wav` |
| **Plays** | `beat-10` → `beat-12` (warning breaks → optics) |
| **Target duration** | ~80–110 s |
| **BPM / feel** | Same sabotage family; slightly more urgency, still contained |

**Style / tags**

```text
instrumental cinematic underscore, procedural dissonance, failed comms tension,
irregular pulses, metallic textures, optical-array focus,
corrupted process music, hard SF, no action trailer score
```

**Negative:** *(shared)*

**Edit note:** Duck hard under `beat-13` withheld recording; do not generate a separate “silent” stem.

---

### `fm-stem-sabotage-03`

| | |
| --- | --- |
| **Filename** | `fm-stem-sabotage-03.wav` |
| **Plays** | `beat-15` → `beat-20` (after murder through empty direction) |
| **Target duration** | ~120–160 s (or two takes: 15–17 and 18–20) |
| **BPM / feel** | Colder, thinner than sabotage-01/02; investigative |

**Style / tags**

```text
instrumental cinematic underscore, cold procedural dissonance after violence,
thinner texture, irregular pulses, investigation atmosphere,
no mourning strings, no funeral march, hard SF restraint
```

**Negative:** *(shared)* + `requiem choir, sentimental cello theme`  
(Zao motif is reserved for later stems.)

**Edit note:** Music is **stopped** through `beat-14` death black before this stem starts.

---

### `fm-stem-zao-01`

| | |
| --- | --- |
| **Filename** | `fm-stem-zao-01.wav` |
| **Plays** | `beat-21` → `beat-22` (message arrives / not the voice) |
| **Target duration** | ~50–80 s |
| **BPM / feel** | Slow; single-line motif |

**Style / tags**

```text
instrumental cinematic underscore, minimal human motif, solo cello or solo piano,
simple few-note phrase, intimate, restrained, hard science fiction,
message-return recognition without sentimentality, no sung lyrics
```

**Negative:** *(shared)* + `full orchestra statement, power ballad, choir`

---

### `fm-stem-sabotage-04`

| | |
| --- | --- |
| **Filename** | `fm-stem-sabotage-04.wav` |
| **Plays** | `beat-23` → `beat-27` (eleven minutes through countdown) |
| **Target duration** | ~100–140 s |
| **BPM / feel** | Urgent irregular pulse; ease slightly toward clarity at end |

**Style / tags**

```text
instrumental cinematic underscore, countdown pressure, procedural dissonance,
irregular percussion, contained urgency, hard SF,
avoid classical thriller orchestra and trailer whooshes
```

**Negative:** *(shared)* + `ticking clock sample cliché if overplayed as comedy`

---

### `fm-stem-velari-01`

| | |
| --- | --- |
| **Filename** | `fm-stem-velari-01.wav` |
| **Plays** | `beat-28` → `beat-30` (greeting / station answers / envoy) |
| **Target duration** | ~70–100 s |
| **BPM / feel** | Non-tempered / microtonal drift; alien but not horror |

**Style / tags**

```text
instrumental cinematic underscore, alien contact atmosphere, processed choir without words,
microtonal, non-tempered scales, Arrival vein without pastiche,
deliberately other than the ship score, luminous not triumphant
```

**Negative:** *(shared)* + `military march, victory fanfare, cute alien whimsy`

---

### `fm-stem-zao-02`

| | |
| --- | --- |
| **Filename** | `fm-stem-zao-02.wav` |
| **Plays** | `beat-31` → `beat-32` (work before return / you made it in time) |
| **Target duration** | ~45–70 s |
| **BPM / feel** | Soft return of motif over faint ship drone |

**Style / tags**

```text
instrumental cinematic underscore, soft return of minimal cello or piano motif,
faint cold ship drone underneath, dedication without sentimentality,
hard science fiction ending, sparse
```

**Negative:** *(shared)* + `tearjerker strings, pop outro`

---

### `fm-stem-credits`

| | |
| --- | --- |
| **Filename** | `fm-stem-credits.wav` |
| **Plays** | `beat-32-credits` (~21 s across three cards; generate ~40–60 s and fade) |
| **Target duration** | ~40–60 s |
| **BPM / feel** | Residual ship bed; fade to silence |

**Style / tags**

```text
instrumental cinematic underscore, residual cold synth drone,
end credits bed, sparse, fade to silence, hard SF typographic mood
```

**Negative:** *(shared)* + `end-credit pop song, vocal theme`

---

## After generation (next pass — not this pack)

1. Drop WAVs into `static/assets/audio/music/light-delay-festival-master/`.
2. Register in `data/assets.json` (`kind: "audio"`, `role: "music"`).
3. Set matching `MusicCue.trackAssetId` values on Festival-master.
4. Optional: OTIO A3 music track / animatic sequencer.
