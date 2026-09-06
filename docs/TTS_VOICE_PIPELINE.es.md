# Pipeline de voces TTS (Light Delay)

Guía canónica en el repositorio para recrear `E:\Models\`, generar muestras de
voz y renderizar el audio de la escaleta. Los knobs de clonación viven en
[`docs/wip/qwen-icl-clone-defaults.json`](wip/qwen-icl-clone-defaults.json).
Notas locales de instalación de Seed-VC: `E:/Models/Seed-VC/LIGHT_DELAY_NOTES.md`
(derivadas; ante conflicto prevalece este documento).

English: [`TTS_VOICE_PIPELINE.en.md`](TTS_VOICE_PIPELINE.en.md).

## 1. Árbol esperado bajo `E:\Models\`

```text
E:\Models\
├── Kokoro\                      # kokoro-v1.0.onnx + voices-v1.0.bin
├── Qwen3-TTS\
│   ├── hf-cache\                # pesos Hugging Face (Base + VoiceDesign)
│   ├── candidates\              # candidatos VoiceDesign por personaje
│   └── output\
│       ├── outline-chunks\{en,es}\   # cue WAVs + index.json (render incremental)
│       ├── light-delay-outline-dual.mp3
│       ├── light-delay-audience-dual-es.mp3
│       └── pronunciation-tests\
│           ├── en-accents\native-l1-v2\
│           └── es-accents\native-l1-v2\
├── Seed-VC\                     # repo + .venv + checkpoints HF
└── voice-donors\
    ├── en\                      # EdAcc L1-English (legado / fallback)
    ├── es\                      # regionales OpenSLR, etc.
    └── native\                  # L1 auténtico: mandarin, german, british-english,
                                 # hindi, french, igbo (4 clips c/u)
```

Las refs curadas del elenco viven **en el repo**:
`static/assets/voices/{en,es}/{Character}.wav` + `REF_TEXT.txt`.

## 2. Recrear el entorno

### 2.1 Seed-VC

```powershell
# Clonar upstream en E:\Models\Seed-VC
cd E:\Models\Seed-VC
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-light-delay.txt   # si existe; si no, deps de inference
pip install hf_xet
$env:HF_HUB_CACHE = "E:\Models\Seed-VC\checkpoints\hf_cache"
$env:HF_HOME = $env:HF_HUB_CACHE
# Primera llamada a inference_v2 descarga Plachta/Seed-VC + ASTRAL
```

Usar siempre el Python del venv de Seed-VC para pintar voces (`--seedvc-only`).

### 2.2 Qwen3-TTS + Kokoro (system Python / CUDA)

- Instalar PyTorch CUDA, `qwen-tts`, `openai-whisper`, `soundfile`, `kokoro-onnx`,
  `onnxruntime-gpu` (**no** instalar `onnxruntime` CPU junto al GPU).
- Poner las DLL CUDA de PyTorch en `PATH` (el script `generate-dual-outline-audio.py`
  lo hace vía `bootstrap_kokoro_cuda()`).
- Casts: `docs/wip/qwen3-tts-cast.json` (EN), `docs/wip/qwen3-tts-cast.es.json` (ES),
  `docs/wip/kokoro-voice-cast.json`.

### 2.3 Donantes nativos

```powershell
python scripts/download-native-language-donors.py
# → E:\Models\voice-donors\native\{lang}\native-00..03.wav
```

Mapa L1 → personaje: Zao←mandarín, Voss←alemán, Harlan←británico, Elin←hindi,
Sorell←francés, Okoye←igbo.

## 3. Generar candidatos native-L1 (Seed-VC V2 + Qwen ICL)

Knobs canónicos (`qwen-icl-clone-defaults.json`):

| Etapa | Parámetro | Valor |
|-------|-----------|-------|
| Seed-VC V2 | `convert_style` | `false` (conserva prosodia L1) |
| | `intelligibility_cfg_rate` | `0.90` |
| | `similarity_cfg_rate` | `0.55` |
| | `diffusion_steps` | `35` |
| Qwen Base | `x_vector_only` | **`false`** (ICL; `true` borra `ref_code`) |
| | `ref_text` | Whisper-medium del `*_v2.wav` |
| | `temperature` / `top_p` | `0.82` / `0.90` |
| | instruct | expresivo + acento L1 suave (ES); prefijo en cues con `[QwenInstruct]` |
| | `max_new_tokens` / cola | `3072` / `dialogueTailMs` 220 (anti-corte de finales) |
| | `repetition_penalty` | `1.05` |

```powershell
# Español
E:\Models\Seed-VC\.venv\Scripts\python.exe scripts/pipeline-spanish-native-l1-v2-qwen.py --seedvc-only
python scripts/pipeline-spanish-native-l1-v2-qwen.py --qwen-only

# Inglés
E:\Models\Seed-VC\.venv\Scripts\python.exe scripts/pipeline-english-native-l1-v2-qwen.py --seedvc-only
python scripts/pipeline-english-native-l1-v2-qwen.py --qwen-only
```

Pools de curaduría: `…/native-l1-v2/finalists/{Character}/`. Tras elegir una toma,
copiarla a `static/assets/voices/{lang}/{Character}.wav` y actualizar
`selection.json` / casts. Si el WAV ya no dice la frase de `REF_TEXT.txt`, dejar
sidecar `{stem}_whisper.txt` o regenerar Whisper al renderizar (`--whisper-ref-text`).

**Estado actual (2026-09-05):** las seis tomas EN y ES ya están promocionadas en
`static/assets/voices/{en,es}/` (Okoye ES = Igbo L1). Ver cada `selection.json`.

## 4. Audio de la escaleta (chunks + ensamblado)

Script: `scripts/generate-dual-outline-audio.py`.

Cada cue se guarda en disco y se indexa. Si cambia el WAV de un personaje, el
`voice_fingerprint` invalida sólo sus cues de diálogo.

```text
E:\Models\Qwen3-TTS\output\outline-chunks\en\
├── index.json          # orden, hashes, pre_silence_ms, rutas
└── audio\
    └── 00042_Sorell_a1b2c3d4.wav
```

```powershell
# Primera pasada (sintetiza + ensambla)
python scripts/generate-dual-outline-audio.py --lang en

# Tras reemplazar static/assets/voices/en/Sorell.wav: sólo regenerar Sorell
python scripts/generate-dual-outline-audio.py --lang en --force-speaker Sorell

# Sólo reensamblar desde el índice (sin cargar modelos)
python scripts/generate-dual-outline-audio.py --lang en --assemble-only

# Español (usa por defecto outiline-for-kokoro-tts.voices.es.md)
python scripts/generate-dual-outline-audio.py --lang es
```

Scripts TTS multi-voz (rev. 14, 37 diálogos atribuidos desde el master):

- EN: `docs/wip/outiline-for-kokoro-tts.voices.md`
- ES: `docs/wip/outiline-for-kokoro-tts.voices.es.md`
- Rebuild desde exports MD: `python scripts/build-tts-voices-outlines.py`

Relato para público (capítulos, sin frontmatter; 35 diálogos audibles):

- ES/EN prosa: `docs/wip/audience-narrative.es.md` / `.en.md`
- TTS: `docs/wip/audience-narrative.voices.es.md` / `.voices.en.md`
- Rebuild: `python scripts/build-tts-voices-outlines.py --source audience`
- Ejemplo: `python scripts/generate-dual-outline-audio.py --lang es --script docs/wip/audience-narrative.voices.es.md --chunks-dir E:/Models/Qwen3-TTS/output/outline-chunks/es-audience`

Flags útiles: `--chunks-dir`, `--force-all`, `--no-assemble`, `--limit`,
`--dialogue-only-limit`, `--whisper-ref-text`.

## 5. Pronunciación de Sorell en texto para audio

**Problema:** «Sorell» en ASCII suena mal en Kokoro/Qwen (aprox. «sorel» / «sore-ell»).
La forma hablada deseada es **Soréll** (acento en la e).

### Reglas

1. **Etiqueta de hablante** (metadato, no se lee): siempre ASCII
   `[Sorell]`
2. **Texto narrado o diálogo que nombra al personaje:** usar la forma acentuada
   `Soréll` / `Soréll’s` (EN) · `Soréll` / `de Soréll` (ES)
3. **No usar spans Misaki IPA** que combinen la etiqueta `Sorell` con la transcripción
   `/səˈɹɛl/` mediante sintaxis de enlace; con Kokoro ONNX el
   runtime lee el span como texto literal. Preferir la grafía `Soréll`.
4. El formateador `scripts/format-outline-for-kokoro.mjs` **no** debe reintroducir
   IPA; el script de voces documenta la convención en la cabecera de
   `docs/wip/outiline-for-kokoro-tts.voices.md` (+ `.voices.es.md`).
5. Prueba A/B: `python scripts/test-sorell-pronunciation.py`
   → `E:/Models/Qwen3-TTS/output/pronunciation-tests/sorell-pronunciation-ab.wav`

### Ejemplo

```markdown
[Narrator]
With artificial intelligence assistance, Soréll has spent months studying the sequence.

[Sorell]
[QwenInstruct] Ceremonial resolve.
"They wrote the primer. This is the first time they’ll hear us read it back."
```

Misma regla al preparar guiones o outlines futuros destinados a TTS: **tag ASCII,
nombre hablado con tilde**.

## 6. Referencias rápidas

| Recurso | Ruta |
|---------|------|
| Knobs ICL / Seed-VC V2 | `docs/wip/qwen-icl-clone-defaults.json` |
| Biblia de voces | `docs/DESCRIPCION_DE_VOCES_DE_PERSONAJES.md` |
| Refs selected | `static/assets/voices/` |
| Helper compartido | `scripts/lib/qwen_icl.py` |
| Pipeline ES | `scripts/pipeline-spanish-native-l1-v2-qwen.py` |
| Pipeline EN | `scripts/pipeline-english-native-l1-v2-qwen.py` |
| Outline dual | `scripts/generate-dual-outline-audio.py` |
