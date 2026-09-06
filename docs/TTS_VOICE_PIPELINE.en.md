# TTS voice pipeline (Light Delay)

Canonical in-repo guide to recreate `E:\Models\`, generate voice samples, and
render outline audio. Clone knobs live in
[`docs/wip/qwen-icl-clone-defaults.json`](wip/qwen-icl-clone-defaults.json).
Local Seed-VC install notes: `E:/Models/Seed-VC/LIGHT_DELAY_NOTES.md`
(derived; this document wins on conflict).

Español (fuente): [`TTS_VOICE_PIPELINE.es.md`](TTS_VOICE_PIPELINE.es.md).

## 1. Expected tree under `E:\Models\`

```text
E:\Models\
├── Kokoro\                      # kokoro-v1.0.onnx + voices-v1.0.bin
├── Qwen3-TTS\
│   ├── hf-cache\
│   ├── candidates\
│   └── output\
│       ├── outline-chunks\{en,es}\
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
Sorell←French, Okoye←Igbo.

## 3. Native-L1 candidates (Seed-VC V2 + Qwen ICL)

Canonical knobs (see JSON): V2 `convert_style=false`, intel `0.90`, sim `0.55`,
steps `35`; Qwen **ICL** (`x_vector_only=false` + Whisper of each `*_v2.wav`),
temp `0.82`, top_p `0.90`, expressive language instruct (+ prefix on per-line `[QwenInstruct]`).
Dialogue uses `dialogueSpeed` `0.85` (EN+ES), `dialogueTailMs` 220, `max_new_tokens` 3072,
and completion-oriented instruct. ES also softens L1 accent; EN keeps curated accents.

```powershell
E:\Models\Seed-VC\.venv\Scripts\python.exe scripts/pipeline-spanish-native-l1-v2-qwen.py --seedvc-only
python scripts/pipeline-spanish-native-l1-v2-qwen.py --qwen-only

E:\Models\Seed-VC\.venv\Scripts\python.exe scripts/pipeline-english-native-l1-v2-qwen.py --seedvc-only
python scripts/pipeline-english-native-l1-v2-qwen.py --qwen-only
```

Promote chosen finalists into `static/assets/voices/{lang}/`.
**Current (2026-09-05):** six EN + six ES native-L1 ICL takes promoted; see
`selection.json` (Okoye ES = Igbo L1).

## 4. Outline audio (chunks + assemble)

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

Multi-speaker TTS outlines (rev. 15, 38 attributed quotations from the master):

- EN: `docs/wip/outiline-for-kokoro-tts.voices.md`
- ES: `docs/wip/outiline-for-kokoro-tts.voices.es.md`
- Rebuild from MD exports: `python scripts/build-tts-voices-outlines.py`

Audience short story (12 sections, no frontmatter; **36 audible dialogues**):

- Prose: `docs/wip/audience-narrative.en.md` / `.es.md`
- TTS: `docs/wip/audience-narrative.voices.en.md` / `.voices.es.md`
- ID-keyed direction: `data/production/audio/audience-dialogue-performance.json`
- Revision: read exclusively from `data/outlines/light-delay-master-narrative.json`
- Rebuild: `npm run tts:audience:build`
- Check structure, parity, attribution, and derivatives:
  `npm run tts:audience:check`
- Example: `python scripts/generate-dual-outline-audio.py --lang en --script docs/wip/audience-narrative.voices.en.md --chunks-dir E:/Models/Qwen3-TTS/output/outline-chunks/en-audience`

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

## 5. Pronouncing Sorell in audio text

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

## 6. Quick links

| Resource | Path |
|----------|------|
| ICL / V2 knobs | `docs/wip/qwen-icl-clone-defaults.json` |
| Voice bible | `docs/DESCRIPCION_DE_VOCES_DE_PERSONAJES.md` |
| Selected refs | `static/assets/voices/` |
| Shared helper | `scripts/lib/qwen_icl.py` |
| ES / EN pipelines | `scripts/pipeline-*-native-l1-v2-qwen.py` |
| Dual outline | `scripts/generate-dual-outline-audio.py` |
