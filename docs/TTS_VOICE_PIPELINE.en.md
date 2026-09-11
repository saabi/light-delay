# TTS voice pipeline (Light Delay)

Canonical in-repo guide to recreate `E:\Models\`, generate voice samples, and
render outline audio. Clone knobs live in
[`docs/wip/qwen-icl-clone-defaults.json`](wip/qwen-icl-clone-defaults.json).
Local Seed-VC install notes: `E:/Models/Seed-VC/LIGHT_DELAY_NOTES.md`
(derived; this document wins on conflict).

Spanish translation: [`TTS_VOICE_PIPELINE.es.md`](TTS_VOICE_PIPELINE.es.md).

## 1. Expected tree under `E:\Models\`

```text
E:\Models\
├── Kokoro\                      # kokoro-v1.0.onnx + voices-v1.0.bin
├── Qwen3-TTS\
│   ├── hf-cache\
│   ├── candidates\
│   └── output\
│       ├── outline-chunks\{en,es}\
│       ├── imitation-pass\{en,es}\   # actor takes → character timbre (SVC/F0)
│       ├── light-delay-outline-dual.mp3
│       ├── light-delay-audience-dual-es.mp3
│       └── pronunciation-tests\
│           ├── en-accents\native-l1-v2\
│           └── es-accents\native-l1-v2\
├── Seed-VC\
└── voice-donors\{en,es,native}\
```

Curated cast refs live **in the repo**:
`static/assets/voices/{en,es}/{Character}.wav` + `REF_TEXT.txt`.

## 2. Recreate the environment

### Seed-VC

Use `E:\Models\Seed-VC\.venv` for all `--seedvc-only` paint runs. Set
`HF_HUB_CACHE` / `HF_HOME` to `E:\Models\Seed-VC\checkpoints\hf_cache`. First
`inference_v2` call downloads `Plachta/Seed-VC` + ASTRAL.

### Qwen3-TTS + Kokoro

System Python + CUDA: `qwen-tts`, Whisper, `soundfile`, `kokoro-onnx`,
`onnxruntime-gpu` only (never install CPU `onnxruntime` beside it). Casts:
`qwen3-tts-cast.json`, `qwen3-tts-cast.es.json`, `kokoro-voice-cast.json`.

### Native donors

```powershell
python scripts/download-native-language-donors.py
```

L1 map: Zao←Mandarin, Voss←German, Harlan←British English, Elin←Hindi,
Sorell←French, Okoye←Igbo (**English / historical native-L1 only**).

## 3. Latin American Spanish refs (current)

Cast Spanish refs do **not** use foreign L1 prosody. Timbre =
`static/assets/voices/en/{Character}.wav`; prosody =
`E:/Models/voice-donors/es/{accent}/`.

| Character | Variety | Donor folder |
|-----------|---------|--------------|
| Zao | Bogotá | `colombian-bogota` |
| Voss | Lima | `peruvian-lima` |
| Harlan | Buenos Aires | `rioplatense` |
| Elin | Medellín (Bogotá proxy) | `colombian-bogota` |
| Sorell | Santiago del Estero | `santiago-del-estero` |
| Okoye | Caracas | `venezuelan` |

```powershell
E:\Models\Seed-VC\.venv\Scripts\python.exe scripts/pipeline-spanish-latam-regional-qwen.py --seedvc-only
python scripts/pipeline-spanish-latam-regional-qwen.py --qwen-only
# After curating: --promote --character Zao --take path\to\finalist.wav
```

Output: `…/es-accents/latam-regional/`. Qwen ES instruct = regional Latin American,
no “light L1 colour”. Native-L1 ES and selected-slow remain local archive only.

## 3b. Native-L1 candidates (EN still; ES superseded by §3)

Canonical knobs (see JSON): V2 `convert_style=false`, intel `0.90`, sim `0.55`,
steps `35`; Qwen **ICL** (`x_vector_only=false` + Whisper of each `*_v2.wav`),
temp `0.82`, top_p `0.90`, expressive language instruct (+ prefix on per-line `[QwenInstruct]`).
Dialogue uses `dialogueSpeed` `0.85` (EN+ES), `dialogueTailMs` 220, `max_new_tokens` 3072,
and completion-oriented instruct. EN may keep curated L1 colour; ES uses §3 instead.

```powershell
E:\Models\Seed-VC\.venv\Scripts\python.exe scripts/pipeline-english-native-l1-v2-qwen.py --seedvc-only
python scripts/pipeline-english-native-l1-v2-qwen.py --qwen-only
```

Promote chosen EN finalists into `static/assets/voices/en/`.
**Current (2026-09-09):** EN = selected-slow-v2 / native-L1. ES = LatAm regional
(donors × EN timbre) after promotion from `latam-regional/`. See each
`selection.json`. The ES dual may still use older L1 refs until regenerated.

## 4. Imitation pass (Seed-VC SVC / F0)

A **parallel** track to Qwen3-TTS: it does not synthesize from text. It keeps the
actor take (content, imitated accent, emotional F0 contour) and paints the curated
character timbre on top. It does not replace outline or audience duals.

The actor imitates the target accent. `auto_f0_adjust` defaults **on**: it seats
the emotional contour in the character's range without flattening the take.
Listening decision: 2026-09-06 Elin and Zao ES A/B (`auto_f0` off vs on) against
the same four source recordings. The Studio panel still exposes the toggle;
per-take `metadata.json` stores the knobs actually used so older off takes stay
reproducible.

Do not launch Gradio for production. `app_svc.py` is the UI for the same stack as
`inference.py --f0-condition True`:

| Gradio (`app_svc.py`) | CLI / JSON |
|----------------------|------------|
| Source Audio | `--source` / `POST` body / Studio |
| Reference Audio | `--character` + `--lang` → `static/assets/voices/{lang}/{Character}.wav` |
| f0-condition (always on in SVC) | `seedVc.f0_condition: true` (never off) |
| Auto F0 adjust | `--auto-f0-adjust` (default **on**) |
| Pitch shift | `--semi-tone-shift` (default 0) |
| Diffusion steps 50–100 | `--diffusion-steps` (default **50**) |

Do not use `app_vc.py`, `inference_v2.py`, `seed_vc_wrapper.py`, or the native-L1
→ Qwen ICL pipelines for this track. Portable knobs:
[`docs/wip/seedvc-imitation-defaults.json`](wip/seedvc-imitation-defaults.json).
Machine paths: env `LIGHT_DELAY_SEEDVC_ROOT`, `LIGHT_DELAY_AUDIO_ROOT`,
`LIGHT_DELAY_IMITATION_ROOT` or
[`docs/wip/seedvc-imitation-defaults.local.json.example`](wip/seedvc-imitation-defaults.local.json.example)
(copy to `*.local.json`, gitignored). Precedence: environment → local file →
portable defaults. The browser never receives or posts filesystem paths.

```powershell
python scripts/convert-imitation-performance.py --check
npm run tts:imitation:check

python scripts/convert-imitation-performance.py --check-local
npm run tts:imitation:check:local

E:\Models\Seed-VC\.venv\Scripts\python.exe scripts/convert-imitation-performance.py `
  --source path\to\take.wav --character Zao --lang es

E:\Models\Seed-VC\.venv\Scripts\python.exe scripts/convert-imitation-performance.py --serve --port 8765
```

`--check` is CI-safe: logical catalog, knobs, in-repo casts. It does not require
`E:\Models`. `--check-local` requires the audio root, 275 cues at 24 kHz, and the
Seed-VC install; it fails loudly when those are missing. A worker started with
system Python can still serve the timeline and Play; **Load model** and Convert
need the Seed-VC venv (`munch`, torch, GPU).

Local Studio (`npm run dev` + worker on `:8765`): Vite proxies `/v1/imitation` to
`http://127.0.0.1:8765` **without duplicating the prefix**. GitHub Pages does not
advertise `/studio`. The worker loads the GPU on the first convert or
`POST /v1/imitation/prepare` (`modelState`: unloaded | loading | ready | error).
Convert is serialized (409 if busy). GPU-free assemble writes
`assembled/audience-*.mp3` and never overwrites
`light-delay-audience-dual-*.mp3`. Versioned takes live under
`imitationRoot/overlays/{outputId}/{safeDialogueKey}/takes/{takeId}/`. Stale is
dialogue-level (`contentHash` + speaker + language + engine), not cue index or
the Qwen WAV hash. Accept survives dual regenerations while dialogue content is
unchanged (stable `audience-dialogue-id`). Cleanup of unaccepted takes is out of
MVP (future job: old candidates that are not the accepted pointer).

Backfill the current index without resynthesizing:

```powershell
python scripts/backfill-audience-stable-dialogue-ids.py
python scripts/migrate-imitation-overlays-to-dialogue-ids.py
```

After prose or direction changes, rebuild voices (`npm run tts:audience:build`)
so TTS Markdown carries `<!-- audience-dialogue-id: … -->` and the dual writes
`stableDialogueId` into `index.json`.

HTTP contract (CORS origins = scheme+host+port, never `github.io`):

- `GET /v1/imitation/health`
- `GET /v1/imitation/defaults`
- `GET /v1/imitation/outputs`
- `GET /v1/imitation/outputs/{id}/timeline`
- `GET /v1/imitation/outputs/{id}/chunks/{cueId}`
- `GET /v1/imitation/outputs/{id}/takes/{takeId}/audio`
- `GET /v1/imitation/outputs/{id}/assembled`
- `POST /v1/imitation/prepare`
- `POST /v1/imitation/outputs/{id}/cues/{cueId}/convert`
- `POST /v1/imitation/outputs/{id}/cues/{cueId}/accept`
- `POST /v1/imitation/outputs/{id}/cues/{cueId}/restore`
- `POST /v1/imitation/outputs/{id}/assemble`

## 5. Outline audio (chunks + assemble)

`scripts/generate-dual-outline-audio.py` stores each cue under
`outline-chunks/{lang}/` with `index.json`. Changing a character WAV updates
`voice_fingerprint` and only that speaker’s dialogue needs regen.

```powershell
python scripts/generate-dual-outline-audio.py --lang en
python scripts/generate-dual-outline-audio.py --lang en --force-speaker Sorell
python scripts/generate-dual-outline-audio.py --lang en --assemble-only
# Spanish defaults to outiline-for-kokoro-tts.voices.es.md
python scripts/generate-dual-outline-audio.py --lang es
```

Multi-speaker TTS outlines (rev. 17, 38 attributed quotations from the master):

- EN: `docs/wip/outiline-for-kokoro-tts.voices.md`
- ES: `docs/wip/outiline-for-kokoro-tts.voices.es.md`
- Rebuild from MD exports: `python scripts/build-tts-voices-outlines.py`

Audience short story (12 sections, no frontmatter; **37 audible English dialogues** at master revision 18; Spanish remains at 36/revision 17):

- Prose: `docs/wip/audience-narrative.en.md` / `.es.md`
- TTS: `docs/wip/audience-narrative.voices.en.md` / `.voices.es.md`
- ID-keyed direction: `data/production/audio/audience-dialogue-performance.json`
- Revision: read exclusively from `data/outlines/light-delay-master-narrative.json`
- Rebuild: `npm run tts:audience:build`
- Check structure, parity, attribution, and derivatives:
  `npm run tts:audience:check`
- Example: `python scripts/generate-dual-outline-audio.py --lang en --script docs/wip/audience-narrative.voices.en.md --chunks-dir E:/Models/Qwen3-TTS/output/outline-chunks/en-audience`

The Spanish audience dual and its 275 chunks were generated from revision 15.
The English audience dual was regenerated for revision 17 (287 cues). Master revision
18 changes the English source again, so both audio catalogs are now stale and retained
only for reference and salvage until regenerated.

Every audible quotation has the same stable `audience-dialogue-id` comment in
both source files. That ID—not its array position or translated wording—selects
an entry containing a shared bilingual dramatic intent plus separate EN and ES
performance direction.

The builder emits one natural-language `[QwenInstruct]` in English, explicitly
names the target language, and combines dramatic situation with language-specific
delivery. There is no generic fallback for the audience
narrative: generation stops on a missing or duplicate ID, an invalid master
step, or a speaker mismatch.

The official API documents `instruct` for VoiceDesign and CustomVoice 1.7B.
This pipeline preserves cloned Base timbre through internal `instruct_ids`, so
direction changes still require comparative listening before audio approval.
See [Qwen3-TTS](https://github.com/QwenLM/Qwen3-TTS) and its
[technical report](https://arxiv.org/abs/2601.15621).

The count difference is deliberate. The master has 38 quotations. The audience
narrative omits the P1 framing quotation and makes Zao's farewell audible only
in E2—not in its first B7 appearance—to preserve the reveal, so it has 36.

`audience-narrative.voices.*.md` files are derived and must be rebuilt after a
source or direction edit. Existing MP3s and chunks become stale when either
input changes; this rebuild command does **not** regenerate them.

## 6. Pronouncing Sorell in audio text

The canonical written name is **Sorell**. Its generated spoken form is
**Soréll** in English and **Sorél** in Spanish.

1. Speaker tag (not spoken): `[Sorell]`
2. Editorial narrative and performance data: `Sorell`
3. Generated narration/dialogue: `Soréll` / `Soréll’s` (EN), `Sorél` (ES),
   resolved from `voiceProfiles[].variants[].pronunciationMap`
4. Do **not** use Misaki IPA spans with Kokoro ONNX (read literally)
5. See headers of `docs/wip/outiline-for-kokoro-tts.voices.md` (+ `.voices.es.md`)
6. A/B test: `python scripts/test-sorell-pronunciation.py`

```markdown
[Narrator]
With artificial intelligence assistance, Sorell has spent months studying the sequence.

[Sorell]
[QwenInstruct] Ceremonial resolve.
"They wrote the primer."
```

## 7. Quick links

| Resource | Path |
|----------|------|
| ICL / V2 knobs | `docs/wip/qwen-icl-clone-defaults.json` |
| Imitation SVC/F0 knobs | `docs/wip/seedvc-imitation-defaults.json` |
| Voice bible | `docs/DESCRIPCION_DE_VOCES_DE_PERSONAJES.md` |
| Selected refs | `static/assets/voices/` |
| ICL helper | `scripts/lib/qwen_icl.py` |
| Imitation helper | `scripts/lib/seedvc_imitation.py` |
| Audio catalog | `data/production/audio/audio-outputs.json` |
| Overlay / assemble | `scripts/lib/imitation_overlay.py`, `imitation_assemble.py`, `imitation_http.py` |
| Imitation CLI | `scripts/convert-imitation-performance.py` |
| ES / EN pipelines | `scripts/pipeline-*-native-l1-v2-qwen.py` |
| Dual outline | `scripts/generate-dual-outline-audio.py` |

Revision 18 makes English the source and corrects the Prologue reaction order and related
causality. Its English voice script has been regenerated, but the existing English audience
audio is still revision 17 (`light-delay-audience-dual-en.mp3`, 287 cues, ~47.8 min). The
Spanish voice script remains revision 17 and its audio remains prose revision 15. Dialogue IDs
are preserved; changed text or direction must invalidate dependent takes.
