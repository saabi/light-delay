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

Multi-speaker TTS outlines (rev. 14, 37 attributed dialogues from the master):

- EN: `docs/wip/outiline-for-kokoro-tts.voices.md`
- ES: `docs/wip/outiline-for-kokoro-tts.voices.es.md`
- Rebuild from MD exports: `python scripts/build-tts-voices-outlines.py`

Audience short-story (chapters, no frontmatter; 35 audible dialogues):

- Prose: `docs/wip/audience-narrative.en.md` / `.es.md`
- TTS: `docs/wip/audience-narrative.voices.en.md` / `.voices.es.md`
- Rebuild: `python scripts/build-tts-voices-outlines.py --source audience`
- Example: `python scripts/generate-dual-outline-audio.py --lang en --script docs/wip/audience-narrative.voices.en.md --chunks-dir E:/Models/Qwen3-TTS/output/outline-chunks/en-audience`

## 5. Pronouncing Sorell in audio text

ASCII **Sorell** mispronounces in Kokoro/Qwen. Desired spoken form: **Soréll**.

1. Speaker tag (not spoken): `[Sorell]`
2. Narration / dialogue that says her name: `Soréll` / `Soréll’s`
3. Do **not** use Misaki IPA spans with Kokoro ONNX (read literally)
4. See headers of `docs/wip/outiline-for-kokoro-tts.voices.md` (+ `.voices.es.md`)
5. A/B test: `python scripts/test-sorell-pronunciation.py`

```markdown
[Narrator]
With artificial intelligence assistance, Soréll has spent months studying the sequence.

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
