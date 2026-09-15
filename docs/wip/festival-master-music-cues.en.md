# Festival-master music cue sheet

**Status:** WIP staging (not narrative SoT). English authorship.  
**Cut:** `script:light-delay-festival-master` (~13.6 min, 33 beats, 104 shots).  
**Authority above:** [`docs/GUIA_BANDA_SONORA.en.md`](../GUIA_BANDA_SONORA.en.md).  
**Suno handoff:** [`festival-master-suno-prompts.en.md`](festival-master-suno-prompts.en.md).  
**Encoded as:** `MusicCue` rows on the Festival-master script (`trackAssetId` empty until stems are registered).

Do **not** invent cues from deprecated `main-short` / `festival` shot notes.

Registers: `ship` | `sabotage` | `velari` | `zao_motif` | `silence` | blend.  
Operations align with `MusicCue.operation`: `start` | `continue` | `change` | `duck` | `swell` | `fade_out` | `stop`.

---

## Hard rules (death / withheld recording)

| Beat | Anchor cues | Music must |
| --- | --- | --- |
| `beat-13` The silent recording | `cue-0066` silence (~9 s); diegetic hatch/confirm `cue-0068` | **Duck** under withheld recording; do not fill the silence with melody |
| `beat-14` Too late to answer | `cue-0076` diegetic impact on black (Zao’s breath stops) | **Stop** before / at impact; leave black to diegesis + silence — no pulse through fatality |
| Trailer-master | (out of this pass) | May keep pulse on brief black; not authored here |

Dialogue ducking: whenever a beat lists dialogue, keep underscore under speech (−6 to −12 dB feel); swell only in dialogue gaps or wordless action.

---

## Stem map (~11 stems)

Resolve/Fairlight will assemble these into the full bed. Target clip lengths fit free-tier Suno practice (not one continuous 13.6 min render).

| Stem id | Register | Beats covered | Approx role |
| --- | --- | --- | --- |
| `fm-stem-ship-01` | ship | beat-00-title → beat-05 | Title through meal / normal regime |
| `fm-stem-ship-02` | ship | beat-06 | First gravity dip (same vein, slight denser low end) |
| `fm-stem-sabotage-01` | sabotage | beat-07 → beat-09 | Extra burn through package discovery |
| `fm-stem-sabotage-02` | sabotage | beat-10 → beat-12 | Warning breaks through optical contingency |
| *(no stem)* | silence / stop | beat-13 → beat-14 | Duck then full stop for recording + death |
| `fm-stem-sabotage-03` | sabotage | beat-15 → beat-20 | Aftermath investigation / empty direction |
| `fm-stem-zao-01` | zao_motif | beat-21 → beat-22 | Message arrives; “not the voice” |
| `fm-stem-sabotage-04` | sabotage | beat-23 → beat-27 | Eleven minutes through bomb countdown |
| `fm-stem-velari-01` | velari | beat-28 → beat-30 | Greeting / station answers / envoy |
| `fm-stem-zao-02` | zao_motif (+ soft ship) | beat-31 → beat-32 | Work before return; “you made it in time” |
| `fm-stem-credits` | ship residual → fade | beat-32-credits | Credits bed, fade out |

---

## Beat-by-beat sheet

| # | Beat id | Title | Register | Op | Stem | Dialogue duck | Notes |
| --- | ---: | --- | --- | --- | --- | --- | --- |
| 1 | `beat-00-title` | Title card | ship | start | ship-01 | n/a | Sparse cold drone under title |
| 2 | `beat-02` | Forty-three minutes late | ship | continue | ship-01 | yes | Ops gallery / Earth wall |
| 3 | `beat-03` | That was not hope | ship | continue | ship-01 | yes | |
| 4 | `beat-04` | One more pass | ship | continue | ship-01 | yes | Axial dock |
| 5 | `beat-05` | A name and a greeting | ship | continue | ship-01 | yes | Meal; keep nearly diegetic |
| 6 | `beat-06` | First gravity dip | ship | change | ship-02 | yes | Micro-g; denser LF, still ship register |
| 7 | `beat-07` | The extra burn | sabotage | change | sabotage-01 | yes | First corruption texture |
| 8 | `beat-08` | A direction | sabotage | continue | sabotage-01 | yes | |
| 9 | `beat-09` | The package | sabotage | continue | sabotage-01 | yes | Vault / package |
| 10 | `beat-10` | The warning breaks | sabotage | change | sabotage-02 | yes | Comms cut |
| 11 | `beat-11` | Two routes aft | sabotage | continue | sabotage-02 | yes | |
| 12 | `beat-12` | Not back, not through | sabotage | continue | sabotage-02 | yes | Optics / contingency aim |
| 13 | `beat-13` | The silent recording | ship→silence | duck | *(hold sabotage-02 ducked)* | n/a (silence owns content) | Yield to `cue-0066`; diegetic hatch after |
| 14 | `beat-14` | Too late to answer | silence | stop | — | yes until black | **Stop** for `cue-0076` impact; no underscore on fatality black |
| 15 | `beat-15` | Contingency after murder | sabotage | start | sabotage-03 | yes | Resume after black; colder, thinner |
| 16 | `beat-16` | The picture Harlan wanted | sabotage | continue | sabotage-03 | yes | |
| 17 | `beat-17` | Suspicion travels | sabotage | continue | sabotage-03 | yes | |
| 18 | `beat-18` | One theory, two failures | sabotage | continue | sabotage-03 | yes | |
| 19 | `beat-19` | Third gravity dip | sabotage | continue | sabotage-03 | yes | |
| 20 | `beat-20` | The empty direction | sabotage | continue | sabotage-03 | yes | |
| 21 | `beat-21` | Zao’s message arrives | zao_motif | change / swell | zao-01 | yes | Motif complete for the first time under playback |
| 22 | `beat-22` | Not the voice | zao_motif | continue / duck | zao-01 | yes | Motif under verification dialogue |
| 23 | `beat-23` | Eleven minutes | sabotage | change | sabotage-04 | yes | Urgency without thriller orchestra |
| 24 | `beat-24` | The offered wrist | sabotage | continue | sabotage-04 | yes | |
| 25 | `beat-25` | Three routes close | sabotage | continue | sabotage-04 | yes | |
| 26 | `beat-26` | Fourth gravity dip | sabotage | continue | sabotage-04 | yes | |
| 27 | `beat-27` | Four, three, two, one | sabotage | continue / fade toward resolve | sabotage-04 | yes | Countdown; ease toward ship clarity as bomb holds |
| 28 | `beat-28` | Read it back | ship→velari | change | velari-01 | yes | Human greeting; Velari register enters under contact |
| 29 | `beat-29` | The station answers | velari | continue / swell | velari-01 | soft | Deliberate station silence in picture; music stays alien, not triumphant |
| 30 | `beat-30` | Someone | velari | continue | velari-01 | yes | Envoy approach |
| 31 | `beat-31` | Work before return | zao_motif + soft ship | change | zao-02 | yes | Soft motif under bridge watch |
| 32 | `beat-32` | You made it in time | zao_motif | swell then settle | zao-02 | yes | Final dedication without sentimentality |
| 33 | `beat-32-credits` | Credit cards | ship residual | fade_out | credits | n/a | Bed under credits; fade clean |

---

## Encoded MusicCue ids (script)

| Cue id | Beat | operation | Stem |
| --- | --- | --- | --- |
| `festival-master:cue-music-ship-01-start` | beat-00-title | start | ship-01 |
| `festival-master:cue-music-ship-01-continue` | beat-02 | continue | ship-01 |
| `festival-master:cue-music-ship-02-change` | beat-06 | change | ship-02 |
| `festival-master:cue-music-sabotage-01-change` | beat-07 | change | sabotage-01 |
| `festival-master:cue-music-sabotage-02-change` | beat-10 | change | sabotage-02 |
| `festival-master:cue-music-duck-recording` | beat-13 | duck | — |
| `festival-master:cue-music-stop-death` | beat-14 | stop | — |
| `festival-master:cue-music-sabotage-03-start` | beat-15 | start | sabotage-03 |
| `festival-master:cue-music-zao-01-change` | beat-21 | change | zao-01 |
| `festival-master:cue-music-sabotage-04-change` | beat-23 | change | sabotage-04 |
| `festival-master:cue-music-velari-01-change` | beat-28 | change | velari-01 |
| `festival-master:cue-music-zao-02-change` | beat-31 | change | zao-02 |
| `festival-master:cue-music-credits-fade` | beat-32-credits | fade_out | credits |

Placements attach each cue to the first shot of its beat at `atMs: 0`. Intermediate beats inherit the active stem via `continue` semantics in mix (no extra cue rows required).
