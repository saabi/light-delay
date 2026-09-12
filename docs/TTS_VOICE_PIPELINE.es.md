# Pipeline de voces TTS (Light Delay)

Guía canónica en el repositorio para recrear `E:\Models\`, generar muestras de
voz y renderizar el audio de la escaleta. Los knobs de clonación viven en
[`docs/wip/qwen-icl-clone-defaults.json`](wip/qwen-icl-clone-defaults.json).
Notas locales de instalación de Seed-VC: `E:/Models/Seed-VC/LIGHT_DELAY_NOTES.md`
(derivadas; ante conflicto prevalece este documento).

Fuente inglesa: [`TTS_VOICE_PIPELINE.en.md`](TTS_VOICE_PIPELINE.en.md). Esta copia española es una traducción y debe declarar cualquier desfase de revisión.

## 1. Árbol esperado bajo `E:\Models\`

```text
E:\Models\
├── Kokoro\                      # kokoro-v1.0.onnx + voices-v1.0.bin
├── Qwen3-TTS\
│   ├── hf-cache\                # pesos Hugging Face (Base + VoiceDesign)
│   ├── candidates\              # candidatos VoiceDesign por personaje
│   └── output\
│       ├── outline-chunks\{en,es}\   # cue WAVs + index.json (render incremental)
│       ├── imitation-pass\{en,es}\   # tomas de actor → timbre de personaje (SVC/F0)
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

Mapa L1 → personaje **(sólo inglés / native-L1 histórico):** Zao←mandarín, Voss←alemán,
Harlan←británico, Elin←hindi, Sorell←francés, Okoye←igbo.

## 3. Refs ES latinoamericanas (vigente)

Las refs castellanas del elenco **no** usan prosodia L1 extranjera. Timbre =
`static/assets/voices/en/{Character}.wav`; prosodia = donantes
`E:/Models/voice-donors/es/{accent}/`.

| Personaje | Variedad | Donante |
|-----------|----------|---------|
| Zao | Bogotá | `colombian-bogota` |
| Voss | Lima | `peruvian-lima` |
| Harlan | Buenos Aires | `rioplatense` |
| Elin | Medellín (proxy Bogotá) | `colombian-bogota` |
| Sorell | Santiago del Estero | `santiago-del-estero` |
| Okoye | Caracas | `venezuelan` |

```powershell
E:\Models\Seed-VC\.venv\Scripts\python.exe scripts/pipeline-spanish-latam-regional-qwen.py --seedvc-only
python scripts/pipeline-spanish-latam-regional-qwen.py --qwen-only
# Tras curar: --promote --character Zao --take path\to\finalist.wav
```

Salida: `…/es-accents/latam-regional/`. Instruct Qwen ES = acento regional latino,
sin «light L1 colour». Native-L1 ES y selected-slow quedan como archivo local, no
como autoridad de refs.

## 3b. Generar candidatos native-L1 (histórico EN; ES sustituido por §3)

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
| | instruct | expresivo; EN puede conservar color L1 suave |
| | `max_new_tokens` / cola | `3072` / `dialogueTailMs` 220 (anti-corte de finales) |
| | `repetition_penalty` | `1.05` |

```powershell
# Inglés (sigue vigente para pools L1 EN)
E:\Models\Seed-VC\.venv\Scripts\python.exe scripts/pipeline-english-native-l1-v2-qwen.py --seedvc-only
python scripts/pipeline-english-native-l1-v2-qwen.py --qwen-only

# Español native-L1: histórico; usar §3 LatAm en su lugar
```

Pools EN: `…/en-accents/native-l1-v2/finalists/{Character}/`. Tras elegir una toma,
copiarla a `static/assets/voices/en/{Character}.wav` y actualizar
`selection.json` / casts. Si el WAV ya no dice la frase de `REF_TEXT.txt`, dejar
sidecar `{stem}_whisper.txt` o regenerar Whisper al renderizar (`--whisper-ref-text`).

**Estado actual (2026-09-09):** EN = selected-slow-v2 / native-L1. ES = LatAm regional
(donantes × timbre EN) tras promoción desde `latam-regional/`. Ver cada
`selection.json`. El dual ES puede seguir en refs L1 antiguas hasta regenerarlo.

## 4. Pase de imitación (Seed-VC SVC / F0)

Pista **paralela** a Qwen3-TTS: no sintetiza texto. Conserva la toma del actor
(contenido, acento imitado, contorno F0 emocional) y pinta encima el timbre de
la ref curada. No sustituye los duales de la escaleta ni del relato.

El actor imita el acento objetivo. `auto_f0_adjust` queda **encendido** por
defecto: asienta el contorno emocional en el registro del personaje sin
aplastar la toma. Decisión de escucha: A/B Elin y Zao ES del 2026-09-06
(`auto_f0` off vs on) contra las mismas cuatro grabaciones de origen. El panel
del Studio sigue exponiendo el interruptor; cada `metadata.json` de toma guarda
los knobs reales para reproducir tomas antiguas con auto-F0 apagado.

No usar Gradio en producción. `app_svc.py` es la misma pila que
`inference.py --f0-condition True`. Equivalencia:

| Gradio (`app_svc.py`) | CLI / JSON |
|----------------------|------------|
| Source Audio | `--source` / cuerpo `POST` / Studio |
| Reference Audio | `--character` + `--lang` → `static/assets/voices/{lang}/{Character}.wav` |
| f0-condition (siempre en SVC) | `seedVc.f0_condition: true` (no se apaga) |
| Auto F0 adjust | `--auto-f0-adjust` (defecto **on**) |
| Pitch shift | `--semi-tone-shift` (defecto 0) |
| Diffusion steps 50–100 | `--diffusion-steps` (defecto **50**) |

No usar `app_vc.py`, `inference_v2.py`, `seed_vc_wrapper.py` ni los pipelines
native-L1 → Qwen ICL para esta pista. Knobs portátiles:
[`docs/wip/seedvc-imitation-defaults.json`](wip/seedvc-imitation-defaults.json).
Rutas de máquina: env `LIGHT_DELAY_SEEDVC_ROOT`, `LIGHT_DELAY_AUDIO_ROOT`,
`LIGHT_DELAY_IMITATION_ROOT` o
[`docs/wip/seedvc-imitation-defaults.local.json.example`](wip/seedvc-imitation-defaults.local.json.example)
(copiar a `*.local.json`, gitignored). Precedencia: entorno → archivo local →
defaults portátiles. El navegador nunca recibe ni envía rutas de filesystem.

```powershell
python scripts/convert-imitation-performance.py --check
npm run tts:imitation:check

python scripts/convert-imitation-performance.py --check-local
npm run tts:imitation:check:local

E:\Models\Seed-VC\.venv\Scripts\python.exe scripts/convert-imitation-performance.py `
  --source path\to\toma.wav --character Zao --lang es

E:\Models\Seed-VC\.venv\Scripts\python.exe scripts/convert-imitation-performance.py --serve --port 8765
```

`--check` es seguro para CI: catálogo lógico, knobs, casts del repo. No exige
`E:\Models`. `--check-local` exige el audio root, 275 cues a 24 kHz y la
instalación Seed-VC; falla en voz alta si faltan. El worker con el Python del
sistema puede servir la línea de tiempo y Play; **Cargar modelo** y Convertir
exigen el venv de Seed-VC (`munch`, torch, GPU).

Studio local (`npm run dev` + worker en `:8765`): Vite hace proxy de
`/v1/imitation` hacia `http://127.0.0.1:8765` **sin duplicar el prefijo**.
GitHub Pages no anuncia `/studio`. El worker carga la GPU en el primer convert
o `POST /v1/imitation/prepare` (`modelState`: unloaded | loading | ready | error).
Convert serializado (409 si está ocupado). Ensamblado GPU-free a
`assembled/audience-*.mp3`; nunca pisa
`light-delay-audience-dual-*.mp3`. Tomas versionadas bajo
`imitationRoot/overlays/{outputId}/{safeDialogueKey}/takes/{takeId}/`. El stale es
por huella de diálogo (`contentHash` + speaker + idioma + engine), no por el
índice del cue ni por el hash del WAV Qwen. Accept persiste entre regeneraciones
del dual mientras el diálogo no cambie (`audience-dialogue-id` estable). Limpieza
de tomas no aceptadas: fuera del MVP (trabajo futuro: candidatas antiguas que no
sean el puntero aceptado).

Backfill del índice actual (sin resintetizar):

```powershell
python scripts/backfill-audience-stable-dialogue-ids.py
python scripts/migrate-imitation-overlays-to-dialogue-ids.py
```

Tras cambiar la prosa o la dirección, regenerar voices (`npm run tts:audience:build`)
para que los Markdown TTS lleven `<!-- audience-dialogue-id: … -->` y el dual
escriba `stableDialogueId` en `index.json`.

Contrato HTTP (orígenes CORS = scheme+host+port, nunca `github.io`):

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

## 5. Audio de la escaleta (chunks + ensamblado)

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

## 5b. Audio de diálogo del animatic (ScriptFile → chunks → modo película)

La generación offline reutiliza el pipeline dual. Un driver exporta las cues de
diálogo de un `ScriptFile` a markdown de voces y llama a
`generate-dual-outline-audio.py`. Los chunks viven en
`E:/Models/Qwen3-TTS/output/animatic-chunks/{scriptSlug}/{lang}/` con
`index.json` + `script-link.json`. `--promote` copia los WAV aceptados a
`static/assets/audio/dialogue/…` y escribe `DialogueVariant.audioAssetId`
(explícito; no se ejecuta en cada regen).

```powershell
npm run tts:animatic-dialogue
npm run tts:animatic-dialogue:promote
# Continuidad archivada:
npm run tts:animatic-dialogue:main-short
npm run tts:animatic-dialogue:main-short:promote
```

El modo película del animatic reproduce los assets promocionados con
`WebAudioCueSequencer` (`startMs` absoluto = duraciones de tomas previas + `atMs`
del placement). Demo EN vigente del Festival:
`animatic-light-delay-festival-master-en` (126 cues).

Scripts TTS multi-voz de la escaleta (rev. 17, 38 citas atribuidas desde el master):

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

El dual ES y sus 287 chunks se regeneraron desde el texto ES en lastSyncedRevision 19
(~48.5 min). El dual EN está en revisión 19 (~49.0 min). El texto ES permanece
`needs_revision`.

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

## 6. Pronunciación de Sorell en texto para audio

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
**Próxima**, en cambio, se escribe correctamente en la traducción española y no pertenece al mapa fonético.

## 7. Referencias rápidas

| Recurso | Ruta |
|---------|------|
| Knobs ICL / Seed-VC V2 | `docs/wip/qwen-icl-clone-defaults.json` |
| Knobs imitación SVC/F0 | `docs/wip/seedvc-imitation-defaults.json` |
| Biblia de voces | `docs/DESCRIPCION_DE_VOCES_DE_PERSONAJES.md` |
| Refs selected | `static/assets/voices/` |
| Helper ICL | `scripts/lib/qwen_icl.py` |
| Helper imitación | `scripts/lib/seedvc_imitation.py` |
| Catálogo de salidas | `data/production/audio/audio-outputs.json` |
| Overlay / ensamble | `scripts/lib/imitation_overlay.py`, `imitation_assemble.py`, `imitation_http.py` |
| CLI imitación | `scripts/convert-imitation-performance.py` |
| Pipeline ES | `scripts/pipeline-spanish-native-l1-v2-qwen.py` |
| Pipeline EN | `scripts/pipeline-english-native-l1-v2-qwen.py` |
| Outline dual | `scripts/generate-dual-outline-audio.py` |

La revisión 19 mueve el sabotaje de mando de vuelo después del asesinato de Zao.
El dual EN se regeneró el 2026-09-11 (`light-delay-audience-dual-en.mp3`, 287 cues,
~49.0 min). El dual ES se regeneró el mismo día desde lastSyncedRevision 19
(`light-delay-audience-dual-es.mp3`, 287 cues, ~48.5 min). El texto ES sigue
`needs_revision`. Los IDs de diálogo se conservan; texto o dirección cambiados
deben invalidar las tomas dependientes.
