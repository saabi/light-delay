# Higgsfield MCP — referencia para planificación de generación

Fecha de corte documental: 2026-08-31.

Documento de **investigación previa a cuenta**. Resume la documentación pública de Higgsfield sobre MCP, CLI y créditos, y propone cómo encajar un flujo de **dos agentes** (compilación de prompts JSON + ejecución vía MCP) con el pipeline de Light Delay. No sustituye el catálogo vivo del servidor: tras crear la cuenta hay que volver a inspeccionar las herramientas expuestas.

Relacionado: [`docs/ARQUITECTURA_GENERACION.md`](../ARQUITECTURA_GENERACION.md), [`docs/PRODUCTION_PLAN.md`](../PRODUCTION_PLAN.md), [`docs/production/SEEDANCE_PROMPTING.md`](../production/SEEDANCE_PROMPTING.md) (oficio de prompts; inglés), [`docs/production/RESOLVE_OTIO_EXPORT.md`](../production/RESOLVE_OTIO_EXPORT.md) (ensamblado OTIO para DaVinci Resolve; inglés), [`data/production/provider-capabilities.json`](../../data/production/provider-capabilities.json), [`higgsfield-uploads/`](../../higgsfield-uploads/).

---

## 1. Hallazgo crítico: Unlimited 24 h ≠ MCP

Si el plan es usar la **ventana Unlimited de 24 h** (trial “All Unlimited” o promoción equivalente) **a través de MCP**, la documentación oficial de Higgsfield dice lo contrario:

| Superficie | Unlimited / free gens | Créditos |
| --- | --- | --- |
| **Web** (`higgsfield.ai`, toggle Unlimited ON) | Sí, según plan y modelo | Sí en modo crédito |
| **MCP** (`https://mcp.higgsfield.ai/mcp`) | **No** | **Siempre** |
| **CLI + Skills** | **No** | **Siempre** |
| Canvas, Supercomputer, plugins, etc. | **No** | **Siempre** |

Fuentes oficiales:

- [What is Higgsfield MCP?](https://higgsfield.ai/creator-hub/help-center/integrations/what-is-higgsfield-mcp)
- [What are Unlimited models?](https://higgsfield.ai/creator-hub/help-center/credits/what-are-unlimited-models-and-which-plans-include-them)
- [How do credits work?](https://higgsfield.ai/creator-hub/help-center/credits/how-credits-work)
- [Higgsfield All Unlimited explained](https://higgsfield.ai/blog/higgsfield-all-unlimited-explained)

**Implicación para Light Delay:** el flujo “agente A compila JSON → agente B llama MCP” **consumirá créditos** aunque en la web tengáis Unlimited activo. Para aprovechar Unlimited sin créditos, la generación debe hacerse **manualmente en la web** (o rediseñar el pipeline). Presupuestad créditos antes de una corrida masiva por MCP.

**Nota:** existen servidores MCP **no oficiales** de terceros (p. ej. wrappers “unlimited” en GitHub/Glama) que documentan herramientas como `generate_video` con parámetros distintos. No son el conector hospedado por Higgsfield; usan otras credenciales/API y sus términos no coinciden con la ayuda oficial. Este documento se centra en el **MCP oficial**.

---

## 2. Superficies de integración

### 2.1 MCP oficial (objetivo del agente ejecutor)

- **URL del servidor:** `https://mcp.higgsfield.ai/mcp` (variante de respaldo citada en blogs: `https://mcp.higgsfield.ai` si el cliente rechaza la ruta `/mcp`).
- **Transporte:** HTTP streamable (remoto).
- **Autenticación:** OAuth con la cuenta Higgsfield. **Sin API key** en el conector oficial.
- **Requisito:** suscripción activa de pago (según la guía de conexión).
- **Salida:** resultados en **Assets** de `higgsfield.ai`, etiquetados como origen MCP.

### 2.2 CLI + Skills (alternativa para Cursor / Claude Code)

Higgsfield recomienda **CLI + Skills** para agentes de código (menor overhead de tokens, salida más estructurada):

```bash
npx skills add higgsfield-ai/skills
higgsfield auth login
```

Skills documentadas: `generate`, `soul`, `product-photoshoot`. Compatible con Claude Code, Cursor, Codex.

Para Cursor también existe integración por **Marketplace** además de MCP manual.

Fuente: [How do I access Higgsfield via CLI?](https://higgsfield.ai/creator-hub/help-center/integrations/how-do-i-access-higgsfield-via-cli)

### 2.3 Web

Única superficie donde aplican **Unlimited** y **free generations** (con toggle Unlimited en el panel del modelo).

---

## 3. Conexión en Cursor (MCP)

Según la [guía oficial de conexión](https://higgsfield.ai/creator-hub/help-center/integrations/how-do-i-connect-higgsfield-to-ai-agent):

1. Cursor → **Customize → Marketplace** → Higgsfield → **Add** → iniciar sesión.
2. O bien: añadir conector MCP manual con URL `https://mcp.higgsfield.ai/mcp` (mismo flujo que Claude).

**Verificación sin gastar créditos de video:** en un chat nuevo, pedir al agente:

- `What is my Higgsfield credit balance?`
- `List my recent Higgsfield generations.`

Si no invoca herramientas, revisar que el conector esté activo en la conversación.

**Cursor en este repo:** el namespace dinámico `plugin-higgsfield-higgsfield` puede estar disponible en Cursor; hasta tener cuenta, no se puede inspeccionar el esquema real de herramientas. Tras el alta, usar `GetDynamicTools` / listado de herramientas del cliente MCP y **actualizar la sección 6** de este documento con los nombres exactos.

---

## 4. Qué permite el MCP oficial (capacidades, no nombres de tools)

Tabla resumida de la documentación de conexión (operaciones, no esquema JSON):

| Operación | MCP |
| --- | --- |
| Generación de imagen y video (todos los modelos expuestos) | ✓ |
| Upscaling imagen/video | ✓ |
| Eliminación de fondo | ✓ |
| Expand image / reframe video | ✓ |
| Kling 3.0 Motion Control | ✓ |
| Personajes Soul y Elements | ✓ |
| Audio (voz, clonación, dubbing, etc.) | ✓ |
| Personal Clipper | ✓ |
| Consultar saldo, listar generaciones/subidas | ✓ |
| Unlimited / generaciones gratis | ✗ |

Modelos citados en marketing y guías de terceros (lista **no contractual**; confirmar en cuenta): Seedance 2.0/2.5, Sora 2, Kling 3.x, Veo 3.1, WAN 2.6/2.7, Minimax Hailuo 02, Soul 2.0, Nano Banana Pro, GPT Image 2, Flux 2, Seedream, etc.

**Video:** clips típicamente **hasta ~15 s** por job en materiales públicos; la duración exacta depende del modelo.

**Imagen:** hasta **4K** en varios modelos.

---

## 5. Referencias e imágenes

Reglas oficiales para MCP ([guía de conexión](https://higgsfield.ai/creator-hub/help-center/integrations/how-do-i-connect-higgsfield-to-ai-agent)):

1. **El agente no “lee” adjuntos del chat como input directo del modelo.** Hay un paso de subida a Higgsfield (ventana de upload que abre el conector).
2. **Archivo local:** pedir al agente que abra la ventana de subida; tras confirmar, referenciar el rol en el prompt (“usa la imagen subida como referencia de personaje”).
3. **URL pública:** pegar URL directa de imagen; el agente la importa a uploads de Higgsfield.
4. **Generaciones previas / Soul / Elements:** por nombre o historial, sin re-subir.
5. **Image-to-video:** suele requerir frame inicial (`start_image` en APIs comunitarias); para Kling Motion Control, imagen + video de movimiento por separado.

**Light Delay:** los PNG de [`higgsfield-uploads/`](../../higgsfield-uploads/) deben subirse en la corrida (o publicarse en URL HTTPS accesible si el flujo lo admite). El ejecutor debe registrar qué archivo remoto corresponde a cada `assetId` local.

### Límites Seedance 2.0 (snapshot del repo)

En [`data/production/provider-capabilities.json`](../../data/production/provider-capabilities.json) (documental, `executable: false`):

| Recurso | Límite Seedance 2.0 (snapshot 2026-08-29) |
| --- | --- |
| Imágenes de referencia | 9 |
| Videos de referencia | 3 |
| Audios de referencia | 3 |
| **Total referencias** | **12** |
| Segmento de campaña (`campaign:higgsfield-trial-24h`) | **30 s** (`maxSegmentMs`, alineado a Seedance 2.5) |

Seedance 2.5 figura con `maxDurationMs: 30000` en el mismo archivo; el snapshot sigue `provisional` / no ejecutable hasta confirmar catálogo MCP/CLI. Oficio de prompts: [`SEEDANCE_PROMPTING.md`](../production/SEEDANCE_PROMPTING.md) (muestras de voz, no WAV de diálogo TTS; tomas consecutivas < 30 s).

---

## 6. Superficie de herramientas (verificada 2026-09-14)

Catálogo vivo tras OAuth en Cursor: [`data/production/higgsfield-mcp-catalog.snapshot.json`](../../data/production/higgsfield-mcp-catalog.snapshot.json). El servidor oficial sí publica nombres de tools al cliente MCP; no usar wrappers comunitarios.

| Bucket | Tools oficiales |
| --- | --- |
| Generación | `generate_image`, `generate_video`, `generate_audio` (+ `*_batch`, `jobs_wait`, `job_status`, `show_generation_by_ids`) |
| Coste / saldo | `generate_video` / `generate_image` con `get_cost: true` (no envía job); `balance`; `transactions` |
| Modelos | `models_explore` (`list` / `search` / `get` / `recommend`) |
| Referencias | `media_upload_widget` (archivos locales; no adjuntar al chat); `media_import_url`; `show_medias`; `show_characters`; `show_reference_elements` |
| Cuenta | `list_workspaces`, `select_workspace` |

**Seedance 2.5** (`seedance_2_5`): modos `t2v` / `omni_reference` / `video_edit` / `video_extension`; duración **4–30 s**; resolución `480p` / `720p` / `1080p`. Light Delay pasa **`generate_audio: true`** (sonido nativo) salvo clip mudo pedido por el autor, y **`resolution: 480p`** on every Festival Seedance job (snapshot `preferredResolution`; MCP catalog default is **720p** — never omit). Voice-sample `@Audio` refs: combined duration **≤ 30 s**. Approved bank WAVs stay at `static/assets/voices/en/*.wav`; durable **5 s MP3** clips live under `static/assets/voices/en/seedance-5s/` (`npm run prepare:seedance-voice-clips`) and are what handoff/`prepare:higgsfield` stages (`metadata.seedanceUploadPath`). Upload real **MP3** bytes when the signed URL expects `audio/mpeg`. Preflight 2026-09-14: 8 s, 480p, 16:9, `t2v` = **20 créditos** con audio on u off; sin job. Gallery smoke 23 s / 480p / omni ≈ **57.5 créditos**. Unlimited web **no** es gastable por MCP en esta cuenta.

Nombres antiguos de wrappers no oficiales (`generate_raw`, `account_info`, `list_models`) **no** coinciden con el servidor hospedado.

### Flujo asíncrono recomendado para el agente ejecutor

```text
1. (Opcional) Consultar saldo y coste estimado; pedir confirmación humana.
2. Subir referencias locales → obtener handles/IDs en Higgsfield.
3. Enviar job de generación (imagen o video).
4. Poll de estado hasta completed / failed (videos: orden de minutos).
5. Registrar en el manifiesto de corrida: generationId, URL de asset, créditos, modelo.
6. Descargar a ruta acordada en el repo (si la política del proyecto lo permite).
```

Fallos: créditos suelen reembolsarse en minutos salvo modelos excepcionales ([How do credits work?](https://higgsfield.ai/creator-hub/help-center/credits/how-credits-work)).

---

## 7. Créditos y gobernanza

- Todo MCP/CLI **deduce créditos** al tipo estándar del modelo/resolución/duración.
- El coste se muestra en la UI web **antes** de confirmar; vía MCP hay que **pedir explícitamente** coste y aprobación (“Before generating anything, tell me the credit cost and wait for my confirmation”).
- No hay tope duro por sesión en la plataforma; solo instrucciones al agente.
- Historial: **Manage Account → Usage**.

---

## 8. Arquitectura propuesta: dos agentes + JSON

Alineado con [`docs/ARQUITECTURA_GENERACION.md`](../ARQUITECTURA_GENERACION.md): el compilador no debe parsear Markdown en caliente; el ejecutor no debe inventar prompts.

### Agente 1 — Compilador de corrida (solo datos del repo)

**Entrada:** `data/production/plans/<script>.json`, tomas con `freeze` aprobado, briefs ES cerrados, [`higgsfield-uploads/MANIFEST.md`](../../higgsfield-uploads/MANIFEST.md).

**Salida:** archivo de corrida JSON bajo `reports/runs/` (regenerable, gitignored) vía `npm run handoff:visual-stretch`. Schema: `data/schemas/run.schema.json`. Resultados con créditos: `data/production/runs/*-results.json` (`visual-stretch-result.schema.json`).

### Agente 2 — Ejecutor MCP (solo envío y seguimiento)

**Entrada:** el JSON de corrida + archivos en `higgsfield-uploads/`.

**Acciones:** OAuth ya configurado en el cliente; subir referencias; invocar tools; poll; escribir manifiesto de resultados (`data/production/runs/<runId>-results.json` propuesto).

### Esquema mínimo propuesto para cada job

```json
{
  "jobId": "main:shot-05-07:seg-01",
  "shotId": "main:shot-05-07",
  "segmentId": "main:shot-05-07:segment-01",
  "kind": "video",
  "provider": "higgsfield-mcp-official",
  "model": "seedance-2.0",
  "prompt": {
    "compiledEn": "…",
    "negativeEn": "…"
  },
  "parameters": {
    "aspectRatio": "16:9",
    "durationSeconds": 30,
    "resolution": "1080p",
    "generateAudio": true
  },
  "references": [
    {
      "role": "character",
      "localStagingPath": "higgsfield-uploads/characters/light-delay-character-harlan.png",
      "assetId": "asset:character-harlan-sheet"
    },
    {
      "role": "scene",
      "localStagingPath": "higgsfield-uploads/brief/light-delay-brief-harlan-service-hatch-com-sabotage.png",
      "assetId": "asset:animatic-05-07"
    },
    {
      "role": "location",
      "localStagingPath": "higgsfield-uploads/brief/light-delay-brief-celestial-ardor-bridge-service-shaft.png",
      "assetId": "asset:location-celestial-ardor-bridge-service-shaft-reference"
    }
  ],
  "preflight": {
    "requiresHumanApproval": true,
    "maxCredits": null,
    "notes": "MCP always spends credits"
  },
  "status": "pending"
}
```

Campos a rellenar tras la primera conexión real: `model` exacto aceptado por el tool, nombres de roles de media, límites de `duration`/`resolution`, y si `input_files` del MCP acepta rutas locales o exige upload previo.

### Reglas editoriales Light Delay

- Prompt compilado en **inglés**; brief humano en español en el plan, no en el job.
- Displays diegéticos solo en inglés ([`docs/PRODUCTION_PLAN.md`](../PRODUCTION_PLAN.md)).
- No superar 12 referencias totales por job si se usa Seedance 2.0 según snapshot.
- Segmentos ≤ **30 s** según `campaign:higgsfield-trial-24h` / Seedance 2.5 single-pass; confirmar en preflight que el plan de cuenta no baje ese techo.
- Ejecutar `npm run prepare:higgsfield` antes de cada corrida para refrescar staging (incluye `higgsfield-uploads/stretch/` con nombres estables por `assetId`, en el **mismo orden** que `references[]` del handoff: keyframes → visuals efectivos → voice samples).

---

## 8b. MCP smoke runbook (English — visual stretch / Seedance)

Hard gates:

| Run artifact | `nonExecutable` | Submit to Higgsfield? |
| --- | --- | --- |
| `handoff:visual-stretch --allow-preview-prompt` | `true` | **Never** |
| Frozen ready run (`status: ready`) | `false` | Only after human cost confirmation |
| Plan job with `runnable: false` or `generationGate` / `generation_deferred` / `generation_blocked` blockers | — | **Never** (author must clear `Take.productionGate` first; rebuild plan) |

Authoring hold SoT is **`Take.productionGate`** on the script take (`deferred` / `blocked`), not `imageStatus` and not plan-hand-authored fields. Plans/stretch jobs only **derive** `generationGate` + blockers (`docs/production/VISUAL_STRETCH_PIPELINE.md`, `AGENT_GENERATION_BRIEF.md`). Agents must:

- Refuse submit/handoff-as-executable when the source plan job is not `runnable` or lists production-gate blockers (including `missing_keyframe:*` / `uncovered_video_entity:*`, and video-scoped holds `generation_deferred:video` / `member_generation_deferred:video:*`). A video-scoped hold does not block the corresponding still job.
- Refuse on `reference_budget:*`. Prefer structured `referenceBudget` on the plan job. `reference_pack_required` = author/attach packs for uncovered entities; `reference_consolidation_required` = merge existing refs (do not add packs for covered overflow). Never silently trim still reference lists.
- Not invent or clear `productionGate` / prerequisites without explicit author instruction; clearing a gate means editing the **script take**, then `npm run production:plans` so derived plan fields update.
- Not treat a deferred take as regen debt (`imageStatus`).
- Not trim stretch `referenceAssetIds` for Seedance; not invent `videoReferenceAssetIds` unless the author authored that tri-state list (`SEEDANCE_PROMPTING.md` §6.2).

Agent steps for a **paid** smoke (after a stretch `videoPromptFreeze` is approved and the plan job is `runnable`):

1. **Pin workspace:** `select_workspace` → Private Ultra `e4d99f54-5f04-4f20-8544-330c41232965` (see `data/production/higgsfield-mcp-catalog.snapshot.json`).
2. `node scripts/higgsfield-preflight.mjs --probe` — record live model catalog, credits, and **concurrency** (account/plan/model; API returns 400 when concurrent cap is hit; Concurrency Boost can raise it; caps change). Campaign `concurrency` is the project ceiling once verified (`null` until then). Smoke always uses `executionPolicy.maxJobs: 1`.
3. `npm run prepare:higgsfield` — refresh staging; stretch refs under `higgsfield-uploads/stretch/` in handoff order (keyframes → effective visuals → voice).
4. Use the **exact** frozen run JSON (`reports/runs/` or promoted path). Do **not** re-run handoff between submit and register (`inputDigest` covers the prompt).
5. **References / media ledger:** for each `references[]` entry in order — if `remoteMediaId` is set, pass that `media_id` and **do not** upload; if absent, upload the staging file via Cursor MCP `media_upload_widget` (local path; not a chat attachment). Map every used `assetId` → remote handle in the result (including reused ids). Never put `mimeType` / `durationMs` on ready-run `references[]` (schema `additionalProperties: false`); remote ids live on `remoteMediaId` / results `uploadHandles` / the ledger.
6. Before generating: `generate_video` with `get_cost: true`. **Package-prep report (required before waiting for go):** in the same message, list **(a)** credit cost per job and total, **(b)** duration / resolution / mode, **(c)** every input asset the job will attach — `assetId`, role (`keyframe` / `start_image` / `end_image` / `image_references` / `audio_references` / …), staging or repo path, and whether the handle is **ledger reuse** or a **fresh upload**. For multi-job packages, one table/rows-per-job is enough. Do **not** quote cost alone. Then **wait for human confirmation**. Stretch defaults: `omni_reference`, `resolution: 480p`, `aspect_ratio: 16:9`, `generate_audio: true` unless the author asked for a silent clip. **Never omit** `resolution` (catalog default is 720p). When offered, **decline** style preset `24bae836-2c4a-48e0-89b6-49fcc0b21612` (“IN THE DARK”) and note it in result notes.
7. Submit **exactly one** job; stop (`stopAfterFirst`, no retry/continue/auto-accept). On failure / 422 / timeout: **stop and report** — do not auto-resubmit a second paid job.
8. **Download** the completed video from Higgsfield Assets into the repo under `static/assets/animatic/frames/<segment>/stretches/.../` (or a temp path you will pass to `--video`). Record remote upload handles per `assetId`.
9. Write `data/production/runs/<runId>-results.json` (`visual-stretch-result.schema.json`) with `sourceRunId`, `inputDigest`, `providerJobId` when returned, output hash/duration, upload handles, and `output.repoPath` / sha256 of the downloaded file.
10. `npm run register:visual-stretch-video -- --from … --run <ready-run.json> [--video …]` — binds the clip at **job** level only; never changes `selectedTakeId`. Requires a `status: ready` / `nonExecutable: false` run whose digests match. Register **upserts** `data/production/higgsfield-media-ledger.json`. Movie mode then **replaces those member stills** with the clip (`needs_review` / `current`). `production:plans` rebuilds keep `outputs.assetId` by reading `assets.json` `metadata.stretchJobId`. An unregistered MP4 does not play.

### Media ledger (reuse uploads)

- **SoT:** `data/production/higgsfield-media-ledger.json` (schema `higgsfield-media-ledger.schema.json`). Key = `assetId` + sha256 of **staging bytes** (`resolveStretchStagingSource` — Seedance 5s MP3s ≠ bank WAVs).
- Ready handoff fills optional `references[].remoteMediaId` on cache hit.
- Rebuild / seed from run results: `npm run rebuild:higgsfield-media-ledger` → also writes `data/production/higgsfield-media-duplicates.json` (`keepers` + `deleteCandidates`).
- Voice assets with `metadata.seedanceUploadPath` are **not** seeded from historical handles (often full WAV); next job uploads the MP3 once, then caches.
- **Duplicate cleanup:** MCP has **no** delete-media tool. In Higgsfield Assets UI, delete only `deleteCandidates` (input uploads). Never delete keepers. Never delete generation **output** videos you still want remote. Inputs are reusable; outputs are separate assets.
- Do not invent a parallel handle map outside the ledger + per-run `uploadHandles`.

### Singleton packages vs stretch register

Festival shot packages such as 039, 040b, and the title sting are **not** `visualStretchJobs`. Land the MP4 under `static/`, add a `kind: video` row in `assets.json`, and set the selected take’s `videoAssetId` so Movie mode replaces that shot’s still. **Do not** run `register:visual-stretch-video` on them. Leaving the file on disk without `videoAssetId` keeps the still.

### `video_extension` quirks (pointer)

See notes on `run-festival-master-shot-plan-040b-rev-2-video-1-ready-results.json`: `start_image` is rejected on `video_extension`; send the last frame via image refs; the provider may return only the new segment — join locally onto the prior clip.

Ready (frozen, executable plan job):

```bash
npm run handoff:visual-stretch -- --script light-delay-festival-master --job <videoJobId>
```

Preview (never submit):

```bash
npm run handoff:visual-stretch -- --script light-delay-festival-master --job <videoJobId> --allow-preview-prompt
```

Schemas: `data/schemas/run.schema.json` (handoff), `data/schemas/visual-stretch-result.schema.json` (tracked results), `data/schemas/higgsfield-media-ledger.schema.json` (upload cache). Same rules are embedded in each ready run file’s `agentInstructions`.

---

## 9. Checklists

### Antes de suscribir (Ultra × 1 mes)

- [ ] Matriz tráiler/festival y presupuesto de créditos: [`docs/production/HIGGSFIELD_PRE_SUBSCRIBE_CHECKLIST.md`](../production/HIGGSFIELD_PRE_SUBSCRIBE_CHECKLIST.md) (`npm run production:checklist:higgsfield`).
- [ ] Cerrar puertas editoriales listadas en ese documento (guion, diálogo, `compiledPrompt`, proyecto festival).

### Antes de abrir cuenta

- [ ] Decidir: ¿MCP con créditos o web Unlimited sin automatización?
- [ ] Leer este documento y [`higgsfield-uploads/TODO.md`](../../higgsfield-uploads/TODO.md).
- [ ] Tener tomas con brief aprobado y freeze (ver `npm run report:prompt-readiness`).

### Inmediatamente tras crear cuenta

- [ ] Conectar MCP en Cursor (`https://mcp.higgsfield.ai/mcp`).
- [ ] Listar herramientas expuestas; **copiar nombres y esquemas** a un anexo de este doc o a `data/production/higgsfield-mcp-catalog.snapshot.json`.
- [ ] Probar saldo + una imagen barata + un video corto; anotar créditos y latencia.
- [ ] Probar subida desde `higgsfield-uploads/characters/light-delay-character-zao.png`.
- [ ] Confirmar si Harlan v2 se separa de Voss en generación (control manual).
- [ ] Actualizar `provider-capabilities.json` si los límites reales difieren.

### Antes de una corrida masiva

- [ ] `npm run prepare:higgsfield`
- [ ] Compilar JSON de corrida (agente 1).
- [ ] Revisión humana de prompts y referencias.
- [ ] Presupuesto de créditos vs. número de jobs.
- [ ] `node scripts/higgsfield-preflight.mjs` (solo lectura; ampliar cuando exista cuenta).

---

## 10. Fuentes consultadas

| Tema | URL | Notas |
| --- | --- | --- |
| Qué es MCP | https://higgsfield.ai/creator-hub/help-center/integrations/what-is-higgsfield-mcp | Créditos siempre en MCP |
| Conexión agentes | https://higgsfield.ai/creator-hub/help-center/integrations/how-do-i-connect-higgsfield-to-ai-agent | Upload de referencias, operaciones |
| CLI vs MCP | https://higgsfield.ai/creator-hub/help-center/integrations/how-do-i-access-higgsfield-via-cli | Skills para coding agents |
| Créditos | https://higgsfield.ai/creator-hub/help-center/credits/how-credits-work | Unlimited solo web |
| Unlimited | https://higgsfield.ai/creator-hub/help-center/credits/what-are-unlimited-models-and-which-plans-include-them | Toggle solo en web |
| Landing MCP | https://higgsfield.ai/mcp | Marketing, 30+ modelos |
| Blog Unlimited 24 h | https://higgsfield.ai/blog/higgsfield-all-unlimited-explained | MCP sigue en créditos |
| Guía comunitaria (tools) | https://mcp.directory/blog/higgsfield-mcp-guide | **No oficial**; útil como hipótesis de nombres |

---

## 11. Pendiente tras el alta (acción humana)

1. Volcar el catálogo real de tools MCP a un snapshot versionado en el repo.
2. Decidir si el ejecutor usa **MCP oficial** o **CLI Skills** en Cursor (Higgsfield favorece CLI para código).
3. Usar `handoff:visual-stretch` / registrar resultados en `data/production/runs/` (ver §8b). No hay adaptador de submit in-repo — el agente MCP ejecuta el runbook.
4. Reconciliar la campaña `campaign:higgsfield-trial-24h` con la política real de créditos si se confirma que Unlimited no aplica a MCP.
