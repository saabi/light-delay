# Light Delay — Soundtrack guide

**Status:** English source of truth for musical direction. Defines registers and principles; the Festival-master beat cue sheet lives in `docs/wip/festival-master-music-cues.en.md`.

**Purpose:** Orient composition or generation (e.g. Suno) so sound reinforces the physics and tone of the cut without explaining the world to the audience.

**Scope:** Sonic registers, the central human motif, and a compositional device derived from light delay. Beat-level assignment is in the Festival-master cue sheet / Suno prompt pack — not in deprecated cut shot notes.

**Current production cut:** `script:light-delay-festival-master` (authorized Festival-master WIP). Trailer policy below applies to `script:light-delay-trailer-master` when that cut gets its own music pass (not this pass).

---

## Principles

1. **Music does not “act.”** It accompanies a system working, a process being corrupted, or the otherness of contact; it does not replace dialogue or announce the plot.
2. **Physics generates form.** Light delay is not only theme: it can be a mixing and composition resource (delay, echo, phased canon).
3. **Few clear registers.** Three environmental textures plus one minimal human motif are enough to bind the arc; there is no need for a theme per character.
4. **Vein references, not pastiche.** Mentions of existing scores indicate climate and method, not quotes to copy.

## Zao’s death: film vs trailer

- On **Festival-master** (and any future complete-film derivatives), the frame leaves the violence before the act. During sustained black, a brief struggle and one dry bodily impact are heard; then struggle and breath cease, and black holds long enough to confirm fatality without showing it. Existing diegetic `sound` / `silence` cues own those facts (e.g. withheld recording silence; death impact on black).
- On **trailer-master**, the cut before the attack is reused, but black is brief: no resolving blow, no mortuary silence; music may keep a pulse and the next image arrives soon. Both Zao’s fate and the success of her transmission must stay open.
- The score does not replace those facts. In the film it yields to diegetic sound and silence; in the trailer it preserves the question without faking an answer.

Deprecated names `main` / `festival` / `long` / `trailer` in older notes are salvage-only and must not be treated as current authority.

---

## Registers

### 1. Ship / engineering

| | |
| --- | --- |
| **Use** | Systems, trajectory, bridge and habitat under normal regime |
| **Character** | Ambient electronic, nearly diegetic |
| **Palette** | Cold synthetic textures, low-frequency drones; sound that could be mistaken for real hull hum |
| **Melody** | No lead melody |
| **Vein** | *Ad Astra* (Max Richter); *Annihilation* (Ben Salisbury / Geoff Barrow) |

Supports narrative precision: music accompanies the system in motion; it does not dramatize over it.

### 2. Sabotage / diplomatic core

| | |
| --- | --- |
| **Use** | Payload corruption; discovery and murder aftermath; procedural tension around the vault and investigation |
| **Character** | Percussive, irregular, contained dissonance |
| **Palette** | Pulses that do not quite lock; layers that drift out of phase |
| **Avoid** | Classical thriller orchestra |
| **Guide idea** | “Corrupted” or procedural music, as if the material itself were compromised |

### 3. Velari

| | |
| --- | --- |
| **Use** | Contact, Velari infrastructure, interstellar otherness when it has its own sonic presence |
| **Character** | Deliberately alien to the rest of the score |
| **Palette** | Processed choir, microtonality, non-tempered scales |
| **Vein** | *Arrival* (Jóhann Jóhannsson): the alien is heard before it is explained |

Gives sonic consequence to Velari transit and station not belonging to the Ardor’s acoustic world. Does not invent new distances or orbits.

### 4. Central motif (human)

| | |
| --- | --- |
| **Anchor use** | Zao’s warning / signed message when it returns to the bridge |
| **Character** | Human, melodic, minimal |
| **Suggested instrumentation** | Single instrument (cello or piano) |
| **Form** | A simple few-note phrase that can survive alone |

**Dramatic function:** The thread that binds the rest. The same phrase is barely implied inside ship/engineering and sabotage textures so that when the message lands, the ear already recognizes it without having heard it complete before.

---

## Device: light delay in the mix

Light delay is the plot engine; it can become a compositional device, not only a theme:

- **Real delay / echo** in the mix (a layer that arrives “late” relative to another).
- **Canon** in which one instrumental voice repeats what another played seconds earlier, with growing offset under distance or isolation.

Consistent with treating physics as a generator of narrative form, not decoration.

---

## Related artifacts

- Beat cue sheet: `docs/wip/festival-master-music-cues.en.md`
- Suno free-tier prompt pack: `docs/wip/festival-master-suno-prompts.en.md`
- Encoded cues: `MusicCue` entries on `data/scripts/light-delay-festival-master.json` (`trackAssetId` filled after stems are generated and registered)

This document does not authorize final audio production by itself and does not replace the screenplay or animatic.
