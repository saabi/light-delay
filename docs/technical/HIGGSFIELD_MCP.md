# Higgsfield MCP — referencia para planificación de generación

Fecha de corte documental: 2026-08-31.

Documento de **investigación previa a cuenta**. Resume la documentación pública de Higgsfield sobre MCP, CLI y créditos, y propone cómo encajar un flujo de **dos agentes** (compilación de prompts JSON + ejecución vía MCP) con el pipeline de Light Delay. No sustituye el catálogo vivo del servidor: tras crear la cuenta hay que volver a inspeccionar las herramientas expuestas.

Relacionado: [`docs/ARQUITECTURA_GENERACION.md`](../ARQUITECTURA_GENERACION.md), [`docs/PRODUCTION_PLAN.md`](../PRODUCTION_PLAN.md), [`data/production/provider-capabilities.json`](../../data/production/provider-capabilities.json), [`higgsfield-uploads/`](../../higgsfield-uploads/).

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
| Segmento de campaña trial (autor) | **8 s** (`campaign:higgsfield-trial-24h`) |

Seedance 2.5 figura como perfil **provisional** de marketing; no usar para validar envíos hasta confirmar catálogo MCP/CLI.

---

## 6. Superficie de herramientas (inferida; verificar con cuenta)

Higgsfield **no publica** un OpenAPI completo del MCP hospedado. La ayuda describe **capacidades**; blogs y servidores comunitarios agrupan herramientas así:

| Bucket | Comportamiento típico | Parámetros habituales (comunidad / blogs) |
| --- | --- | --- |
| Imagen | Síncrono o casi inmediato | `prompt`, `model`, `aspect_ratio`, referencias, calidad/resolución |
| Video | **Asíncrono** (submit → poll → URL) | `prompt`, `model`, `duration`, `aspect_ratio`, `resolution`, `input_files` / `start_image` |
| Marketing presets | Workflow acotado | URL o fotos de producto, preset (UGC, unboxing, etc.) |
| Soul / personaje | Entrenar + reutilizar ID | fotos de referencia, nombre |
| Historial / saldo | Lectura | — |

Nombres citados en wrappers **no oficiales** (solo referencia): `generate_image`, `generate_video`, `get_generation_status`, `create_character`, `list_characters`, `generate_raw`, `list_models`, `account_info`. **No asumir** que el servidor oficial expone los mismos nombres o campos hasta listar tools tras OAuth.

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

**Salida:** archivo de corrida JSON (propuesta de ruta: `data/production/runs/<runId>.json`, **aún no implementado en el repo**).

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
    "durationSeconds": 8,
    "resolution": "1080p",
    "generateAudio": false
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
- Segmentos ≤ 8 s mientras `campaign:higgsfield-trial-24h` siga acotando la campaña documental (independiente del límite del modelo).
- Ejecutar `npm run prepare:higgsfield` antes de cada corrida para refrescar staging.

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
3. Implementar `data/production/runs/` y el adaptador que lea el JSON de corrida (fuera del alcance de este documento).
4. Reconciliar la campaña `campaign:higgsfield-trial-24h` con la política real de créditos si se confirma que Unlimited no aplica a MCP.
