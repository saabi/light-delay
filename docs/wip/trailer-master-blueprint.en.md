# Trailer (master-derived) — editorial blueprint

`script:light-delay-trailer-master`, sourced from `script:light-delay-festival-master`. Draft,
~87.6s (~1:28), 7 scenes, 22 shots. This document records the beat-mapping and reuse/condense decisions
behind each shot, mirroring the festival-master shot blueprint's purpose.

Structural model: the old trailer (`script:light-delay-trailer`, deprecated, sourced from the old
`main-short` continuity) is built around a different mechanism (an "autonomous payload," a "Velari
channel" trigger, a quarantine effort) that no longer matches the current story. This trailer reuses
the old trailer's *functional shape and restraint* — scale → mission doctrine → anomaly → warning cut
short → suspicion → reveal → unresolved ticking clock → title/tagline/credits, ending before contact
resolves — rebuilt entirely from festival-master's actual 103 shots and dialogue.

**Image reuse convention**: each shot's take copies `imageAssetId` directly from its
`festival-master` source shot when one already exists (no re-render needed). For the 6 shots whose
source is still mid-regeneration in festival-master (from the earlier gravity-staging fix), the
trailer take carries its own standalone `generation.prompt` instead of depending on a pending image.

**Dialogue audio reuse**: every spoken English cue points at the Festival-master WAV via the same
`audioAssetId` (no new TTS). Shot durations were refit to those measured performances, so the
storyboard is longer than the original condensed-copy estimate. Four trailer lines remain
editorially condensed on the page while playing the fuller source take:

| Trailer cue | Source cue | Trailer copy | Source performance |
| --- | --- | --- | --- |
| `cue-a-03` | `cue-0005` | "We answer carefully. We listen. Then we judge." | "They gave us a primer and waited. We answer carefully, we listen, then we judge." |
| `cue-b-02` | `cue-0042` | "A geophysical impulse package. Multi-megaton." | "Geophysical impulse package… one point three tonnes." (`cue-0043` is not linked) |
| `cue-e-01` | `cue-0126` | "If this reaches you — I found a weapon in the shielded vault." | The full recorded vault warning |
| `cue-f-01` | `cue-0167` | "It's keyed to the ship's own clock." | The full clock / time-reference explanation |

Relink and refit: `npm run fit:trailer-master-dialogue-audio`.

## Scene a — Arrival (~18.0s)

| Shot | Source | Image | Line(s) |
| --- | --- | --- | --- |
| `shot-a-01` | `shot-plan-title` | reused | (silent, cold open) |
| `shot-a-02` | `shot-plan-002` | reused | harlan: "I wish they were right." / sorell: "We answer carefully. We listen. Then we judge." |
| `shot-a-03` | `shot-plan-012` | reused | voss: "First we arrive. Philosophy after turnover." |
| `shot-a-04` | `shot-plan-011` | reused | sorell: "Better than telling the Velari we arrived in the Flying Radiator." |

## Scene b — The anomaly (~8.2s)

| Shot | Source | Image | Line(s) |
| --- | --- | --- | --- |
| `shot-b-01` | `shot-plan-016` | reused | zao: "Something's off. We used more fuel than we had to." |
| `shot-b-02` | `shot-plan-021` | **own prompt** (source pending) | zao: "A geophysical impulse package. Multi-megaton." (condensed from the source's fuller line) |

## Scene c — The warning (~8.0s)

| Shot | Source | Image | Line(s) |
| --- | --- | --- | --- |
| `shot-c-01` | `shot-plan-023` | **own prompt** (source pending) | zao: "Bridge, Zao. I have found a grave attempt to sabotage the mission—" |
| `shot-c-02` | `shot-plan-024` | **own prompt** (source pending) | voss: "Zao? Repeat." |
| `shot-c-03` | — (new) | new black frame | (hard cut to black, no dialogue — the attack happens off-page) |

## Scene d — Suspicion (~9.0s)

| Shot | Source | Image | Line(s) |
| --- | --- | --- | --- |
| `shot-d-01` | `shot-plan-047` | reused | sorell: "I found her like this. I tried to help her." |
| `shot-d-02` | `shot-plan-048` | reused | harlan: "She wanted the contact delayed. You heard her." |
| `shot-d-03` | `shot-plan-058` | reused | rao: "Zao didn't miss like that." |

## Scene e — The reveal (~15.2s)

| Shot | Source | Image | Line(s) |
| --- | --- | --- | --- |
| `shot-e-01` | `shot-plan-062` | reused | zao (recorded): "If this reaches you — I found a weapon in the shielded vault." (condensed from the full recorded message) |

## Scene f — The clock (~16.3s)

| Shot | Source | Image | Line(s) |
| --- | --- | --- | --- |
| `shot-f-01` | `shot-plan-081` | **own prompt** (source pending) | rao: "It's keyed to the ship's own clock." (condensed) |
| `shot-f-02` | `shot-plan-082` | **own prompt** (source pending) | voss: "Status?" / rao: "It isn't disarmed. It just isn't going off here." |
| `shot-f-03` | `shot-plan-087` | **own prompt** (source pending) | (silent — wordless, unresolved tease of the Velari ship) |
| `shot-f-04` | `shot-plan-039` | reused | harlan: "No stopping it now." (button line before the title) |

## Scene g — Title, tagline, credits (~13s)

| Shot | Source | Image | Content |
| --- | --- | --- | --- |
| `shot-g-01` | `shot-plan-title` | reused (bookend) | Title card: "LIGHT DELAY" |
| `shot-g-02` | `shot-plan-title` | reused (bookend) | Tagline card: "SOMETIMES, ARRIVING LATE IS ARRIVING ON TIME." (reused verbatim from the old trailer's tagline — still fits) |
| `shot-g-03` | `shot-plan-credit-01` | reused image, **new text** | "WRITTEN AND PRODUCED BY / AUTHOR_NAME_PLACEHOLDER" |
| `shot-g-04` | `shot-plan-credit-02` | reused image, **new text** | "AI ASSISTANCE / ChatGPT · Claude · Gemini · Cursor Composer" |
| `shot-g-05` | `shot-plan-credit-03` | reused image, **new text** | "PRODUCTION TOOLS / Light Delay schema & production tools" |

Credit text deliberately does **not** reuse festival-master's own end-credit cue (`cue-credits`,
which repeats a single generic "A film developed by..." card three times) — the old trailer's three
distinct cards (written/produced by, AI assistance, production tools) are clearer and are reused
verbatim instead, only the backing images are shared with festival-master's credit shots.

## Regeneration list

Exactly the 6 shots whose festival-master source is still pending its own regeneration:
`shot-b-02`, `shot-c-01`, `shot-c-02`, `shot-f-01`, `shot-f-02`, `shot-f-03` — plus the brand-new
black-frame shot `shot-c-03`. The remaining 15 shots reuse an already-generated frame and need no
new image work.
