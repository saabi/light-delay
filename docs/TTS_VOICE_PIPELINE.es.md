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

Scripts TTS multi-voz de la escaleta (rev. 15, 38 citas atribuidas desde el master):

- EN: `docs/wip/outiline-for-kokoro-tts.voices.md`
- ES: `docs/wip/outiline-for-kokoro-tts.voices.es.md`
- Rebuild desde exports MD: `python scripts/build-tts-voices-outlines.py`

Relato para público (12 secciones, sin frontmatter; **36 diálogos audibles**):

- ES/EN prosa: `docs/wip/audience-narrative.es.md` / `.en.md`
- TTS: `docs/wip/audience-narrative.voices.es.md` / `.voices.en.md`
- Dirección por ID: `data/production/audio/audience-dialogue-performance.json`
- Revisión: se obtiene exclusivamente de `data/outlines/light-delay-master-narrative.json`
- Rebuild: `npm run tts:audience:build`
- Verificación de estructura, paridad, atribución y derivados:
  `npm run tts:audience:check`
- Ejemplo: `python scripts/generate-dual-outline-audio.py --lang es --script docs/wip/audience-narrative.voices.es.md --chunks-dir E:/Models/Qwen3-TTS/output/outline-chunks/es-audience`

Cada cita audible lleva un comentario estable `audience-dialogue-id` en ambas
fuentes. Ese ID, no el índice ni el texto traducido, selecciona una entrada con:

- intención dramática compartida y bilingüe;
- indicación específica para interpretación EN;
- indicación específica para interpretación ES.

El builder compone una directiva `[QwenInstruct]` natural en inglés, declara el
idioma objetivo y combina situación dramática con entrega específica. No
hay fallback genérico en el relato para público: un ID ausente, duplicado, sin
paso master válido o atribuido a otro personaje detiene la generación.

La API oficial documenta `instruct` para VoiceDesign y CustomVoice 1.7B. Este
pipeline conserva el timbre clonado con Base mediante `instruct_ids` internos;
por eso todo cambio de dirección requiere escucha comparativa antes de aprobar audio.
Véase [Qwen3-TTS](https://github.com/QwenLM/Qwen3-TTS) y su
[informe técnico](https://arxiv.org/abs/2601.15621).

La diferencia de conteo es deliberada: el master contiene 38 citas. El relato
omite la cita de encuadre P1 y hace audible la despedida de Zao sólo en E2 —no en
su primera aparición de B7— para preservar la revelación; por eso contiene 36.

Los Markdown `audience-narrative.voices.*.md` son derivados y se reconstruyen
después de editar las fuentes o la dirección. Los MP3 y chunks existentes quedan
obsoletos cuando cambia cualquiera de esos insumos; este comando **no** los
regenera.

Flags útiles: `--chunks-dir`, `--force-all`, `--no-assemble`, `--limit`,
`--dialogue-only-limit`, `--whisper-ref-text`.

## 5. Pronunciación de Sorell en texto para audio

**Problema:** la grafía editorial `Sorell` necesita una ayuda distinta por idioma.
La forma hablada es **Soréll** en inglés y **Sorél** en español.

### Reglas

1. **Etiqueta de hablante** (metadato, no se lee): siempre ASCII
   `[Sorell]`
2. **Fuentes narrativas y datos editoriales:** conservar `Sorell`.
3. **Texto compilado para voz:** `Soréll` / `Soréll’s` (EN) y `Sorél` (ES),
   mediante `voiceProfiles[].variants[].pronunciationMap`.
4. **No usar spans Misaki IPA** que combinen la etiqueta `Sorell` con la transcripción
   `/səˈɹɛl/` mediante sintaxis de enlace; con Kokoro ONNX el
   runtime lee el span como texto literal. Preferir la grafía `Soréll`.
5. El formateador `scripts/format-outline-for-kokoro.mjs` **no** debe reintroducir
   IPA; el script de voces documenta la convención en la cabecera de
   `docs/wip/outiline-for-kokoro-tts.voices.md` (+ `.voices.es.md`).
6. Prueba A/B: `python scripts/test-sorell-pronunciation.py`
   → `E:/Models/Qwen3-TTS/output/pronunciation-tests/sorell-pronunciation-ab.wav`

### Ejemplo

```markdown
[Narrator]
With artificial intelligence assistance, Sorell has spent months studying the sequence.

[Sorell]
[QwenInstruct] Ceremonial resolve.
"They wrote the primer. This is the first time they’ll hear us read it back."
```

La transformación ocurre al generar los derivados TTS. El topónimo español
**Próxima**, en cambio, se escribe correctamente desde la fuente y no pertenece al mapa fonético.

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
