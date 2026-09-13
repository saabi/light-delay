# Estado del proyecto

## Current working set (agents)

- **Policy:** [`AGENTS.md`](../AGENTS.md) · day-one map: [`docs/AGENT_ONBOARDING.md`](AGENT_ONBOARDING.md)
- **Narrative SoT:** `outline:light-delay-master-narrative` / `data/outlines/light-delay-master-narrative.json` (WIP authoritative)
- **Production WIP:** `script:light-delay-festival-master` (+ festival-master outline). **Trailer WIP:** `script:light-delay-trailer-master`
- **Stub only:** `script:light-delay-master-narrative` / `canonicalScriptId` — empty routes, not “no screenplay”
- **Do not treat as current:** deprecated `main-short` / `festival` / `trailer` / `long`; `docs/CANON_DECISIONS.md`; `legacy-site/`
- **Do:** edit EN first; higher layers win; upward-propagation gate for conflicting lower-layer story fixes; edit `Shot.description` before prompts; no image regen unless asked
- `data/outlines/light-delay-master-narrative.json` es ahora la fuente de verdad narrativa (histórico / ADR-0002). El estado WIP sigue indicando trabajo pendiente, pero ya no la subordina al corto anterior.

## 2026-09-12 — Agent onboarding spine (English source)

- `AGENTS.md` is English-first with working set, layer map, and upward-propagation gate (two approvals).
- Added `docs/AGENT_ONBOARDING.md`, thin `CLAUDE.md` / `.github/copilot-instructions.md`, and aligned secondary pointers.

## 2026-09-12 — Regenerated Transport Sphere-dependent Festival-master stills (English source)

- Storyboard stills 088, 089, 091, and 092 regenerated against the corrected Transport Sphere reference.

## 2026-09-12 — Regenerated Ardor and Velari visual reference sheets (English source)

- New Ardor/Velari sheets registered; dependent Festival-master takes marked stale for later regeneration.

## 2026-09-12 — OTIO dialect matched to Resolve 20.1 export (English source)

- Assemblies use Windows backslash `target_url`s, `Resolve_OTIO` metadata, float RationalTime,
  and a 01:00:00:00 start. Re-export and import `smoke-one-still.otio` first.

## 2026-09-12 — Scrubbing: sin saturación por cues duplicadas

- El seek del secuenciador Web Audio podía arrancar dos veces el mismo cue durante un
  scrub (carrera entre `ensureWindow` en vuelo). Corregido con epoch de schedule + reserva
  de id antes del await.

## 2026-09-12 — Vault readout: timer to arrival, not coordinates (English source)

- Zao’s vault readout (`festival-master:cue-0043`) now reads “Multi-megaton. The timer is set
  to arrival time!” Shot-021 still marked stale. EN TTS for `0043`/`0126` regenerated;
  trailer `cue-e-01` re-linked.

## 2026-09-12 — TTS EN del Festival master (claridad + vault)

- Promovidos WAV EN de claridad (`0024`, `0062`, `0133`, `0140`) y vault (`0043`,
  `0126`). Fit Festival ~809.9 s; tráiler ~87.8 s (16/16). Fit en verde.

## 2026-09-12 — Export OTIO para DaVinci Resolve

- Nuevo `docs/production/RESOLVE_OTIO_EXPORT.md` (inglés): ensamblado OpenTimelineIO a 24 fps de
  Festival-master y trailer-master, con stills y WAV de diálogo como placeholders y `--swap` para
  relinkear tomas sobre un OTIO exportado desde Resolve sin perder recortes ni orden.
- CLI: `npm run export:resolve-otio:all`. Los `.otio` generados viven en `tmp/resolve-otio/`
  (ignorado por git). No autoriza generación.

## 2026-09-12 — Festival-master continuity and storyboard corrections (English source)

- The bridge beats after throat exit now keep Sorell below deck until the explicit retrieval beat; shot 045 shows her only in the restored camera feed, and shot 046 places her on the bridge after retrieval.
- Added `festival-master:shot-plan-045b` to make Voss's order and the contrasting service-shaft/central-route travel leg visible in the animatic data.
- Regenerated shots 040, 041, 044, 045, and 046 and generated 045b using the current Ardor/service-shaft references, with planets and unrelated locations excluded from these interior frames.
- Take reference IDs, generation prompts, image metadata, and the production manifest are synchronized. Spanish documentation remains a translation pass and is not authoritative for this update.

## 2026-09-12 — Seguimiento de claridad: cue-0062 retimada

- Autorizado a extender la toma cuando una reescritura de claridad lo requiera, se corrigió la
  cuarta candidata que había quedado señalada sin tocar: `cue-0062` (Zao) ahora nombra a qué se
  refiere cada negación ("not back to Earth, not through the throat, not to them" en vez de "Not
  back. Not through. Not to them."). La línea pasó de 16 a 20 palabras (6140ms → 7700ms estimados).
- Propagado el cambio de duración: `shot-plan-031` 12060 → 13620 ms; `scene-12.targetDurationMs`
  40670 → 42230; duración objetivo del guion 808199 → 809759; entrada y etiqueta (~13:28 → ~13:29)
  en `project.json`. `audioAssetId` de la cue eliminado, igual que las otras tres. Ninguna otra cue
  de esa toma necesitó moverse (`cue-0062` es la última). Expectativas de test actualizadas.

## 2026-09-12 — Pase de claridad de diálogo del Festival master (inglés)

- Revisadas las 131 cues de diálogo en inglés de `script:light-delay-festival-master` contra
  `DIALOGUE_CLARITY_GUIDE.md`. La mayor parte del corpus ya es clara; se corrigieron 3 líneas
  (`cue-0024` "turnover" sin ancla hablada → "can wait"; `cue-0133`, lista de seis ítems reordenada
  para adelantar la conclusión; `cue-0140` "the plan" → "the autopilot", término nunca dicho en voz
  alta en ningún otro lugar). `cue-0062` quedó identificada pero sin tocar por falta de margen de
  tiempo en su toma.
- Sincronizados los resúmenes de beat, descripciones de toma, el blueprint, la exportación de voces
  TTS y el manifiesto de generación que citaban esas líneas textualmente. Las variantes en español
  quedaron intencionalmente sin tocar (traducción diferida, mismo criterio que la corrección previa
  de `cue-0042`/`cue-0043`).
- `audioAssetId` eliminado en las 3 cues (más la cue equivalente del tráiler, que reutiliza el audio
  de `cue-0024`) para que el pipeline de TTS las regenere; ninguna duración de toma/escena/acto/guion
  cambió, ya que las tres reescrituras conservan el mismo conteo de palabras.

## 2026-09-12 — Notas de prompting Seedance

- Nuevo `docs/production/SEEDANCE_PROMPTING.md` (inglés): oficio de prompts de video para
  **Seedance 2.5** (enrutado de tarea, mapa de referencias, línea de tiempo a segundos enteros,
  bloqueos de edición/extensión). Los techos publicados siguen siendo provisionales hasta
  preflight. Enlazado desde el brief de generación, la arquitectura, Higgsfield MCP y las lecciones
  de diálogo/prompt.
- Referencias de audio de Seedance: sólo muestras aprobadas (`sampleAssetIds`) de quien habla en
  el pedido; no adjuntar WAV de diálogo TTS del animatic. Tomas consecutivas, mismo lugar y elenco,
  suma menor de 30 s: un solo trabajo (§6.1–6.2).

## 2026-09-12 — Guía de claridad de diálogo

- Nuevo `docs/production/DIALOGUE_CLARITY_GUIDE.md`: documenta el patrón de líneas correctas pero
  demasiado crípticas para audiencia general, con seis ejemplos concretos de antes/después ya
  aplicados (lectura de la ojiva en la bóveda, líneas de Elin, línea de Harlan a Okoye, línea de
  Sorell), un método de corrección priorizado y calibración frente al paso previo de ajuste/recorte
  de diálogo para no sobre-expandir líneas que sí deben quedar breves.

## 2026-09-12 — Documento de lecciones de diálogo y prompts

- Nuevo `docs/production/DIALOGUE_AND_PROMPT_LESSONS.md`: destila correcciones editoriales
  recurrentes (deriva descripción/prompt, legibilidad de transiciones físicas, precisión del
  estado de creencia del hablante, verificación del argumento de la línea, nomenclatura de
  catálogo, economía de prosa frente a hojas de referencia, continuidad de vestuario/equipo) en
  recomendaciones reutilizables para el resto del corpus de tomas/diálogo y para los futuros
  prompts de first-frame, last-frame y video.

## 2026-09-12 — Regenerated Festival-master shot-plan-040b

- Replaced `shot-plan-040b`, whose previous still used the obsolete Ardor sail/fin silhouette.
- The replacement uses the clean multi-angle Ardor sheet and keeps the active throat as a transient distortion between distributed Velari nodes; no station rings or characters are present.
- Updated take-level references, prompt, production plan, and thumbnail.

## 2026-09-12 — Typecheck CI desbloqueado

- Corregidos 13 errores de `svelte-check` en helpers/specs del tráiler master y
  del fit de diálogo; expectativas de duración/catálogo de audio alineadas con
  los fits vigentes. `npm run check` en verde de nuevo para el deploy a Pages.

## 2026-09-12 — Artefactos editoriales regenerados (deploy)

- `MASTER_RELEVANCE_REPORT`, `PENDING_AUTHOR_NOTES` y el plan de generación del
  Festival master regenerados; `purpose` EN/ES añadido a los beats del tráiler
  master. `generated:check` y `validate:translations` en verde.

## 2026-09-12 — Diálogo ES desfasado del Festival master actualizado

- Completadas 5 variantes ES ausentes y reescritas las que no seguían el inglés
  vigente (bóveda `0042`/`0043`, `0120`, `0162`, `0167`, `0171` + citas en beat-09 /
  shot-021). Sigue `needs_revision`. Cobertura de diálogo ES: 131/131.

## 2026-09-12 — Sync de subtítulos en el player

- Cambiar solo el idioma de subtítulos ya no reclona el guion ni desincroniza
  el reloj visual respecto del audio Web Audio; el estado de idioma es
  fine-grained y el secuenciador se realinea tras un reschedule de diálogo.

## 2026-09-12 — Prompts de still sin diálogo/subtítulos

- Los `generation.prompt` del Festival master y del tráiler master ya no incluyen
  líneas habladas ni copy de subtítulos (sí conservan UI diegética intencional).
  No se añade boilerplate de “avoid subtitles”: basta con no suministrar el texto.
- Herramienta `scrub:still-prompts` / `:check`; regla en blueprint y
  `AGENT_GENERATION_BRIEF`. Las PNG ya generadas con texto quemado no se
  regeneraron en este pase.

## 2026-09-12 — Ardor multi-angle reference and exterior still correction

## 2026-09-12 — Diálogo EN del readout en la bóveda (cue-0042/0043)

- `festival-master:cue-0042`: “This is an impulse warhead for geophysical research from the Proxima… one point three tonnes.”
- `festival-master:cue-0043`: “Multi-megaton. Set for the contact coordinates — and the contact time!”
- TTS EN regenerado (2 cues) + promote; fit Festival (~808.2 s) y tráiler master (~88.8 s, reusa WAV de `cue-0042`). Fit en verde.

## 2026-09-12 — Regenerated Festival-master shot-plan-016b

- Replaced the `festival-master:shot-plan-016b` storyboard still because it used a superseded Celestial Ardor design with solar-sail-like structures.
- The replacement uses the current axial cylindrical Ardor reference and preserves the master beat: engine-first retrograde braking near the closed Velari throat, with the torch dimming to zero and the distributed node field remaining distant.
- Updated the English generation prompt, rebuilt the production plan, refreshed the thumbnail, and passed `validate:data` and `validate:docs`.

## 2026-09-12 — Audio de diálogo del tráiler master reutilizado del Festival

- Las 16 cues habladas EN de `script:light-delay-trailer-master` apuntan ahora a los
  WAV ya promocionados del Festival master (mismo `audioAssetId`; sin TTS nuevo).
  Cuatro líneas condensadas conservan el texto corto y reproducen la interpretación
  fuente más larga.
- Tomas reajustadas a la duración medida: **67,7s → 87,6s** (~1:28). El modo Película
  del storyboard del tráiler ya puede oír ese diálogo.

## 2026-09-12 — Regeneración de tomas pendientes del Festival Master

- Se regeneraron las 33 tomas marcadas para actualización (31 sin imagen y las revisadas `088`, `089` y `091`), incluyendo `094`–`096`, y se registraron las 103 imágenes del storyboard del Festival Master.
- Las tomas `088`, `089`, `091` y `092` llevan ahora `asset:vehicle-velari-transport-sphere-sheet`; `092` añade también `asset:character-velari-envoy-sheet`. Sus prompts sólo describen acción, física y comportamiento dinámico; la apariencia está delegada a las referencias.
- Se eliminó de esos prompts la referencia heredada de la hoja obsoleta de la nave emisaria. El catálogo de `vehicle:velari-transport-sphere` ya no conserva la nota visual stale.
- La auditoría de referencias queda en verde (`takes=103`, `references=482`, `errors=0`); `validate:data` y los planes de producción también pasan.

## 2026-09-12 — Nuevo tráiler derivado del master

- **Nuevo guion `script:light-delay-trailer-master`** (borrador, ~87,6s, 7 escenas, 22 tomas),
  derivado de `script:light-delay-festival-master`. El tráiler anterior (deprecado) se basaba en
  un mecanismo de la continuidad vieja; este reutiliza su forma funcional y su contención — no
  resuelve el contacto — pero reconstruido con las tomas y diálogos reales del Festival master.
- 15 de 22 tomas reutilizan un frame ya generado vía `imageAssetId`; 6 tomas cuyo origen todavía
  está pendiente de regeneración tienen su propio prompt independiente; 1 toma nueva (negro
  sostenido) marca el ataque fuera de cuadro. Los créditos reutilizan el texto más claro del
  tráiler anterior en vez del crédito genérico repetido de festival-master.
- Nueva escaleta `outline:light-delay-trailer-master` y nuevo
  `docs/wip/trailer-master-blueprint.en.md`.
- Corregido un error residual: las descripciones de `shot-plan-081`/`082` nunca se habían
  actualizado con el diálogo corregido, y un compilador de prompts concurrente había regenerado
  sus prompts a partir de esa descripción obsoleta. Ambas descripciones ya coinciden con el
  diálogo vigente.

## 2026-09-12 — Diálogo EN del storyboard Festival master completo

- Generadas y promocionadas las 8 cues EN que faltaban
  (`cue-0003`, `0059b`, `0076b`, `0076c`, `0120`, `0162`, `0167`, `0171`).
- Catálogo `animatic-light-delay-festival-master-en`: **131** cues; fit en verde
  (~806.5 s). Español de diálogo sigue sin audio.

## 2026-09-12 — JSON alineado tras borrar hojas de referencia

- Eliminada la entrada `asset:vehicle-celestial-ardor-sheet` tras borrar
  `static/assets/vehicles/celestial-ardor/model-sheet.png`. Las referencias vigentes pasan a
  `asset:vehicle-celestial-ardor-jupiter`.
- La hoja antigua de Harlan (`model-sheet.png`) ya estaba sustituida por `model-sheet-v2.png`
  en el catálogo; se actualizaron rutas residuales en manifiestos de pósters. El
  `previousPath` de procedencia se conserva.

## 2026-09-12 — Auditoría de microgravedad, legibilidad del empuje y claridad de diálogo

- **Auditoría de gravedad**: se trazó la línea temporal real de corte/reanudación de empuje de la
  propia historia (no sólo la etiqueta `setting.continuity` de cada escena, que estaba incompleta) y
  se encontraron dos tramos confirmados con el prompt incorrecto "Steady 1 g" mientras el empuje ya
  estaba cortado: escenas 7–16 y escenas 27–32 (el cuarto corte nunca se reanuda — confirmado por la
  propia línea de Voss "Keep it watched. No thrust"). Se etiquetaron las 11 escenas nuevas como
  microgravedad.
- Se auditaron 31 tomas individualmente — **se vio cada imagen actual antes de decidir**, según la
  instrucción vigente de no marcar como obsoleto lo que ya está bien. 3 imágenes (`shot-plan-016`,
  `017`, `090`) ya mostraban microgravedad a pesar del texto incorrecto — se conservaron, sólo se
  corrigió el prompt. Las otras **28 tomas** mostraban claramente una pose de gravedad normal y se
  marcaron para regeneración.
- **Legibilidad de las transiciones de empuje**: se agregó refuerzo visual más una cue de sonido
  interior emparejada a las dos reanudaciones poco marcadas (`shot-plan-046`, `057`); no se tocaron
  las transiciones ya cubiertas (diálogo, la toma exterior de lucimiento, o sonido solo después de las
  primeras una o dos veces).
- **Corregida `shot-plan-092`**: la imagen mostraba a Sorell de pie en un interior sin traje EVA,
  contradiciendo `shot-plan-089`/`091`. Prompt corregido, regenerada.
- **Siete aclaraciones de diálogo** (extendiendo tomas existentes): la línea del reportero
  reordenada para que "I wish they were right" de Harlan se refiera claramente a los partidarios
  esperanzados; el "they'll never know who saved them" de Harlan con su contexto faltante; su "one
  sign we bite" reescrito como el argumento de disuasión que siempre quiso ser; la línea de Rao en
  la desactivación de la bomba ampliada a una explicación real; el "no thrust" de Voss ampliado a
  una decisión de seguridad explícita y continua; el sabotaje silencioso de Harlan en
  `shot-plan-039` con una reacción y una intención habladas antes del acto; el razonamiento de Zao
  en `shot-plan-030` con un objetivo declarado antes de la geometría.
- Tomas sin cambios (103/103). Duración del guion: 773.357ms → **803.560ms** (~13:24).

## 2026-09-12 — Hoja visual del enviado Velari

- La referencia visual del individuo `character:velari-envoy` se regeneró a partir de la toma
  `festival-master:shot-plan-092`, que es la apariencia vigente del enviado en el master: manto
  orgánico alargado y translúcido, patrones luminosos ramificados y ausencia de rostro o extremidades
  humanoides.
- La hoja anterior de la nave emisaria pertenece a una continuidad antigua y no se usa para el master;
  la nave emisaria queda fuera de esta referencia. El archivo nuevo es
  `static/assets/characters/velari-envoy/model-sheet.png` y permanece pendiente de revisión editorial.

## 2026-09-12 — Toma de lucimiento para el salto de ~29 horas hasta L2

- **Nueva toma `shot-plan-016b`** (5s, exterior, sin personajes) agregada a la escena 7 ("El
  combustible de más"): el Ardor llega retrógrado, con el motor por delante, cerca de la boca del
  túnel mientras su antorcha se apaga al terminar la desaceleración, con el campo de nodos distante
  al fondo. La escena 6 (periapsis, aún cerca de Júpiter) cortaba directo a la escena 7 (ya "cerca de
  la boca") sin señalar que pasaron ~29 horas de desaceleración (según la propia matemática de
  tránsito de la escaleta maestra) — la audiencia lo leería como continuo. Incluye una nueva `TextCue`
  con `presentation: 'time_card'` ("29 HOURS LATER" / "29 HORAS DESPUÉS", `cue-0029c`), reutilizando
  un mecanismo del esquema ya usado una vez en el trailer/corto deprecados pero nunca en
  festival-master.
- Reasignada la cue de acción `cue-0030` a la nueva toma exterior, con texto ampliado para nombrar la
  desaceleración transcurrida; retemporizada `shot-plan-016` (se quitó la cláusula ahora redundante,
  8.80s → 7.90s) — su imagen ya generada no se ve afectada (es un plano interior OTS de Zao) y se
  conserva sin regenerar.
- Tomas: 102 → **103**. Duración del guion: 769.257ms → **773.357ms** (~12:53).

## 2026-09-12 — Toma exterior de la periapsis de Júpiter y corrección de la escalera del cilindro central

- **Nueva toma `shot-plan-013b`** (5s, exterior, sin personajes) agregada a la escena 6 ("Primer
  descenso de gravedad"): el Ardor retroiluminado por Júpiter y los arcos tenues de su anillo durante
  el giro de la periapsis. El propio texto de la escaleta maestra para este beat ("la nave gira de
  prógrado a retrógrado, retroiluminada por Júpiter y sus anillos") nunca se había mostrado — el beat
  era sólo de interior. Basada en la referencia ya existente `asset:vehicle-celestial-ardor-jupiter`;
  nueva entidad de ubicación `location:jupiter-periapsis`. Nueva cue de acción `cue-0024b`. Tomas:
  101 → **102**; duración del guion +5.000ms.
- **Corregida la geometría de la escalera en `shot-plan-074`**: las dos escaleras helicoidales
  opuestas del cilindro central están documentadas (por su hoja de referencia) para seguir la pared
  curva del eje y entrelazarse en cada descanso — el resto de las tomas en esta ubicación lo muestran
  bien, pero `shot-plan-074` (que compone tres ubicaciones en un mismo cuadro) mostraba dos escaleras
  independientes que no siguen la pared y una escalerilla central suelta, fusionando la escalera del
  cilindro central con la escalerilla recta del cilindro de servicio. Se enriqueció la descripción de
  `location:celestial-ardor-central-access` con la geometría de la escalera (antes no documentada a
  nivel de la ubicación) y se reescribió el prompt de `shot-plan-074` con restricción negativa
  explícita para mantener ambas estructuras visualmente distintas. Imagen marcada para regeneración.
- Duración recalculada: 764.257ms → **769.257ms** (~12:49).

## 2026-09-12 — Ajuste de audio de diálogo del Festival master (EN)

- Generadas/promocionadas las 2 cues EN nuevas (`cue-0030b`, `cue-0107b`); 128/128 con WAV.
- Fit de timings: medición real de WAV, sin solapes ni desbordes de toma; huecos ociosos
  comprimidos; silencios de suspense conservados. Montaje **764 257** ms.
- `npm run fit:festival-master-dialogue-audio` / `report:dialogue-audio-fit`.

## 2026-09-12 — Continuidad de posición y diálogo faltante en el Festival master

- **Metadata de presencia/visibilidad corregida contra las imágenes ya generadas** en 9 tomas
  (`shot-plan-024`, `025`, `026`, `027`, `041`, `042`, `043`, `044`, `045`, `059`): se revisó cada
  imagen antes de editar; en todos los casos la imagen ya mostraba el blocking correcto y sólo la
  metadata (`visibleRefs`/`offScreenCharacterIds`) estaba mal. Ninguna de estas imágenes se marcó
  obsoleta.
- **`shot-plan-019` regenerada**: la única imagen de esta pasada que contradecía su propia toma
  (Harlan y Zao caminando juntos con un maletín inventado, en vez de Harlan yéndose solo). Prompt
  reescrito para continuar el blocking ya establecido en `shot-plan-018`.
- **Geometría imposible del puente durante el cruce del agujero de gusano, corregida de raíz**
  (`shot-plan-040`, `041`): ambas tomas estaban ligadas sólo a la ubicación exterior
  `location:velari-wormhole-mouth`, así que la generación no tenía referencia de interior y renderizó
  una ventana grande a nivel de piso hacia la garganta — imposible, ya que las cubiertas del puente
  son perpendiculares al eje de empuje y el canon del puente sólo tiene ventanas pequeñas reforzadas.
  Ambas tomas se reasignaron a `location:celestial-ardor-bridge` (secundaria: la boca del agujero de
  gusano), se agregó `celestial-ardor-bridge` a `secondaryLocationIds` de la escena 15, y ambos
  prompts se reescribieron con restricción negativa explícita contra vidrio grande/panorámico. Ambas
  imágenes se regeneraron.
- **Nueva toma `shot-plan-040b`** (5s, exterior, sin personajes) insertada entre 040 y 041 para que
  la audiencia siga viendo el cruce desde afuera. Nueva cue de acción `cue-0082b`.
- **Dos líneas de diálogo faltantes agregadas**, ambas extendiendo la toma existente:
  `shot-plan-016` gana la línea de Zao "Something's off. We used more fuel than we had to." antes
  de "Burn's clean..." (8.00s → 9.00s); `shot-plan-054` gana la línea de Rao "The shielding bay.
  That's where I'd hide a neutron source." (8.00s → 6.10s).
- **`visibleRefs[].role` agregado en las 101 tomas** para fijar la posición/orientación explícita de
  cada personaje y evitar el drift de posición entre tomas consecutivas.
- Duración total recalculada: 763.340ms → **767.440ms** (~12:47). Tomas: 100 → **101**.

## 2026-09-12 — Traducción ES del ScriptFile/storyboard Festival master

- Rellenado el español de `script:light-delay-festival-master` (estructura, diálogo,
  acciones, notas de interpretación y descripciones de toma). Diálogo `needs_revision`.
- Los prompts de generación de imagen siguen sólo en inglés.
- `localization.es.status`: `needs_revision`. `validate:translations` en verde.

## 2026-09-12 — Festival-master storyboard batch 01

- Generated and registered 103 storyboard stills for the title card, shots 001–096, inserted shots 013b/016b/040b, and the three Festival Master credits.
- Regenerated stale compositions for shots 019, 040, and 041 after their blocking/camera canon changed; all generated stills remain provisional pending visual review.
- The selected takes now resolve to those images, but all remain `needs_review` / provisional pending continuity and visual-quality review.
- The batch manifest records the attached visible-shot references; off-screen characters are not attached as references.

## 2026-09-12 — Festival-master storyboard reference preparation

- Festival-master now has deterministic visible-only reference rebuilding, resolved image paths in its generation plan, and explicit off-screen character exclusion checks.
- Production contexts cover all 100 Festival-master shots, including title/credits, Proxima departure, Ardor gravity states, optical transmission, and exterior contact.
- The reference audit passes with 100 takes, 523 image references, zero missing paths, and zero off-screen character attachments. Storyboard generation remains gated by missing purpose/framing fields and editorial prompt freeze approval.

## 2026-09-12 — Audio de diálogo del Festival master (EN)

- Generadas y promocionadas **126** cues EN para
  `script:light-delay-festival-master` (WAV en
  `static/assets/audio/dialogue/light-delay-festival-master/en/`).
- `npm run tts:animatic-dialogue` apunta al Festival master; main-short queda en
  los alias `:main-short`. El modo película ya puede reproducir el diálogo EN.

## 2026-09-12 — Removed superseded shaft references

- Removed the obsolete central-access sheet and horizontal service-cylinder v2 sheet so they cannot be selected accidentally.
- Current v2/v3 references remain registered and all validation checks pass.

## 2026-09-12 — Reference-locked Proxima dock and Ardor shaft sheets

- The active Proxima dock now uses a v3 reference generated with the existing Proxima station and Celestial Ardor model sheets attached as actual inputs, preserving current geography and scale.
- The central access reference now preserves the bridge's two helical staircases and continuous railing system. The restricted service shaft now reads vertically through stacked decks while remaining longitudinal along the ship axis and using ladder segments rather than helical stairs.
- Catalogs, generation manifest, static location manifest, and thumbnails are synchronized; superseded image files remain retained for provenance.

## 2026-09-11 — Diagramas de escala Proxima/Ardor fuera del storyboard

- Las referencias proporcionales y de escala común ya no entran en
  `generation.referenceAssetIds` de las tomas; viven en `specs/` / art bible.
- El sync del Festival filtra assets con `storyboardEligible: false` o rutas de diagrama.

## 2026-09-11 — Corrected ship and Proxima reference geography

- Replaced the active engineering, reactor service-bay, and service-cylinder references with orientation-correct v2 sheets. Engineering and reactor workspaces now read as transverse decks perpendicular to the Ardor thrust axis; service-cylinder access doors are radial side-wall hatches, not end-cap doors.
- Replaced the obsolete Proxima dock reference with a current external axial dock on the non-rotating station spine, including the capture collar, transfer tube, service gantry, umbilicals, and correct Ardor scale/orientation.
- Superseded images remain in place for provenance; active catalog paths and generation prompts now point to the corrected versions.

## 2026-09-11 — Limpieza de referencias visuales obsoletas (Proxima / puente)

- Eliminadas del catálogo y de `referenceAssetIds` las hojas borradas de Proxima Station
  (concept + proporcional) y del puente (concept sheet), más el viewport Blender berthed.
- Thumbnails huérfanos sincronizados; planes de producción y brief de agente actualizados.

## 2026-09-11 — Festival master storyboard reference assets

- Generated nine new reference sheets with GPT-Image-2 for the master-derived Festival Cut: reactor service bay, inner shielding vault, central access cylinder, restricted service cylinder, geophysical impulse package, Harlan wrist device, time-reference diagnostic unit, wired communications distributor, and Velari personal transport sphere.
- Reused existing bridge, engineering, cast, station, transmitter, and Velari-emissary references as continuity anchors; existing images were not overwritten.
- Registered the assets and entity bindings, added the provider-neutral asset-generation manifest/schema, and included `light-delay-festival-master` in the generation-plan builder.
- Take-level reference synchronization now includes primary/secondary locations and visible master props. The plan remains blocked pending contexts, voice samples, editorial prompt freeze, and provider preflight.

## 2026-09-11 — Storyboard del Festival: duraciones de toma extendidas al ritmo natural del diálogo

- Corregidas las 23 tomas señaladas en el pase anterior de storyboard cuya duración asignada por el
  blueprint era irreal para la extensión de su diálogo. Recalculados `durationMs`/`cuePlacements` de
  cada una con el mismo estimador WPM de `spoken-duration-core.mjs` a ritmo natural completo (sin
  compresión), y propagado el cambio a `targetDurationMs` de las 17 escenas afectadas.
- La duración total pasa de 11:30 a **12:43** (763.340 ms) como consecuencia — confirmado como
  aceptable: un diálogo entregable es en sí mismo una exigencia de legibilidad causal, que el rango
  de 10–12 minutos del outline permite superar explícitamente. Actualizado el lenguaje de objetivo y
  techo en el framing del outline y en `docs/wip/festival-cut-screenplay-runway.en.md`.
- Corregida la regla obsoleta del blueprint "cada candidato de video dura ocho segundos o menos" al
  techo real de campaña de 30 s (`maxSegmentMs`) — el único lugar del repositorio que aún decía 8 s;
  dos de las tomas corregidas (la advertencia grabada de Zao) ahora duran 16,5 s y 24,4 s bajo ese
  techo corregido. Actualizadas las dos aserciones `≤8` correspondientes en
  `festivalMasterScript.spec.ts` (techo por toma y constante de duración total) para que coincidan.
- Actualizados el `targetDurationMs` y la etiqueta del registro en `data/project.json` junto con los
  del propio guion.

## 2026-09-11 — Audio de diálogo del animatic (TTS offline + reproducción en modo película)

- Secuenciador Web Audio compartido con prefetch rodante; el Studio lo reutiliza.
- El modo película del animatic reproduce WAV promocionados según placements
  relativos a cada toma, con mute y subtítulos alineados a `timingByLanguage`.
- Driver offline desde ScriptFile → chunks duales → catálogo; `--promote` escribe
  `audioAssetId` en el guion y `assets.json`. Primera demo: main-short EN
  (98 cues promocionadas; MP3 ensamblado ~7.2 min en Models).

## 2026-09-11 — Storyboard del Festival: registros Shot/Take y prompts de imagen fija

- Implementados los 96 candidatos de toma reservados y las 4 cartelas no narrativas del
  `docs/wip/festival-master-shot-blueprint.en.md` como registros `Shot` + `Take` reales en
  `script:light-delay-festival-master` (100 tomas, 100 takes), conservando los IDs reservados del
  blueprint sin cambios para trazabilidad.
- Redactado un prompt de generación de imagen fija (`generation.prompt` + `negativePrompt`, sólo
  inglés) por cada take, en el registro confirmado "grounded cinematic hard science fiction". Ningún
  take fija proveedor, modelo o asset de imagen: no se generó nada. Los prompts de video, first/last
  frame, audio final y el plan de generación neutral al proveedor quedan explícitamente fuera de este
  pase.
- Calculados los `cuePlacements` a partir del texto real de cada cue con el estimador WPM ya existente
  (`spoken-duration-core.mjs`) en lugar de inventar una heurística nueva; señaladas 23 tomas donde la
  duración objetivo del blueprint es irreal para la extensión del diálogo a ritmo normal, comprimiendo
  sus placements proporcionalmente para mantenerlos válidos hasta un pase editorial de tiempos durante
  la fase de video/audio.
- Añadidas notas `visual`/`open` de referencia pendiente a tres localizaciones heredadas sin imagen
  usadas en la persecución y el puente del Festival (`command-vestibule`, `central-access`,
  `service-cylinder`), siguiendo la convención ya usada en la bóveda/bahía de servicio del reactor.
- Un pase de control de calidad detectó y corrigió 13 tomas donde una transcripción mecánica de la
  doble lista visible/off-screen del blueprint (pensada para planificar cobertura de video en varias
  tomas) excluía por error a un personaje de una imagen fija que claramente lo muestra en cámara (p.
  ej. Zao grabando su propia advertencia, Voss enviando el informe final a la Tierra) — verificado
  contra el texto del prompt de cada toma, no contra la abreviatura del blueprint. También se
  completó `generation.referenceAssetIds` por take a partir de las hojas de referencia existentes de
  los personajes en cámara y de la localización principal, que el primer pase había omitido.
- Actualizadas las aserciones de hito de `festivalMasterScript.spec.ts` y `extracted-data.spec.ts`
  (antes exigían `shots`/`takes` vacíos) al nuevo estado, y corregida la cabecera del propio blueprint,
  que afirmaba que esos arrays "permanecen vacíos".

## 2026-09-11 — Diálogo, catálogo de props y limpieza de referencias obsoletas del Festival

- Revisadas las 197 cues de `script:light-delay-festival-master` contra los perfiles de voz y biografías
  de los seis protagonistas. Corregidas dos líneas agramaticales (Rao, Harlan) y dos matices de
  consistencia de voz de Sorell; reescrita la apelación de Harlan a Okoye en tono personal sin inventar
  un incidente compartido; añadida una línea de Harlan al beat de sabotaje de vuelo, antes mudo.
- Catalogados tres objetos nuevos (bomba, dispositivo de muñeca de Harlan, unidad de diagnóstico de
  Elin), un personaje nuevo (el enviado Velari individual) y un vehículo nuevo (esfera de transporte
  Velari, distinta en escala de la nave emisaria de 300-600 m); ninguno tenía entrada previa pese a
  nombrarse repetidamente en el guion. Cada uno queda con una nota `visual` abierta señalando que
  falta su hoja de referencia.
- Eliminada la referencia obsoleta a `object:diplomatic-quantum-core` de `declaredEntityRefs` y
  corregida la función dramática del distribuidor cableado para quitar su encuadre "diplomático"
  residual. Verificado que ningún término del canon deprecado (láser, núcleo cuántico, cian, relé de
  override, cartucho de saludo) sigue apareciendo en el texto activo de las cues.
- Verificada la coherencia del blueprint de storyboard contra el guion vigente (195/195 referencias de
  cue resuelven) y actualizadas sus celdas citadas para las cinco líneas de diálogo cambiadas o añadidas.
- Precisada la descripción de `object:time-reference-diagnostic-unit` (desplaza el reloj de
  comparación del controlador de la bomba para que la cuenta atrás salte más allá de la detonación),
  subida su nota visual a prioridad `high`, y enlazadas por `objectRefs` las tres cues de acción donde
  Elin lo planta y lo usa (`cue-0112`, `cue-0166`, `cue-0168`).
- Aclarada la línea de Zao en `beat-03`: "That wasn't hope." → "That wasn't hope. Not from Harlan."
  Misma entrega contenida y sin acusación; ahora sin ambigüedad sobre a quién se refiere.

## 2026-09-11 — Geografía de reactor corregida en el Festival vigente

- El guion `script:light-delay-festival-master` ya no usa `location:diplomatic-core-room`: distingue el compartimiento exterior de servicio del reactor y la bóveda interior de blindaje definidos por el master.
- Las dos localizaciones nuevas están catalogadas y vinculadas jerárquicamente, pero no tienen hojas visuales. Sus notas impiden reutilizar como sustituto la hoja obsoleta del núcleo diplomático.
- Las 96 unidades narrativas del blueprint declaran ahora la localización primaria y las secundarias que hereda cada candidato. No se crearon tomas, takes, prompts ni imágenes.
- La validación comprueba jerarquías de localización, referencias de escenas y que un guion activo no use localizaciones clasificadas como obsoletas. Los cuatro cuts anteriores permanecen intactos y exentos como archivo deprecado.

## 2026-09-11 — Guion Festival derivado y blueprint de storyboard

- `script:light-delay-festival-master` ya contiene el primer guion fuente en inglés: 3 actos, 11 secuencias, 31 escenas narrativas más título/créditos, 33 beats y 125 cues de diálogo dentro de un objetivo total de 11:30.
- Los 24 hitos de la escaleta Festival tienen cobertura de guion explícita por escenas, beats y cues. El ledger `data/continuity/light-delay-festival-master.json` registra estados de conocimiento y precondiciones sin inventar evidencia de animatic.
- `docs/wip/festival-master-shot-blueprint.en.md` reserva 96 unidades narrativas y cuatro cartelas, todas de hasta ocho segundos, con cámara, personajes, cues, continuidad y referencias. Sigue siendo un blueprint: `shots` y `takes` permanecen vacíos y no se asignaron imágenes ni prompts.
- Se preservan el ocultamiento del mensaje hasta F08, las cuatro entradas en microgravedad y el sabotaje de vuelo posterior al asesinato. La única voz terrestre inteligible adicional es la periodista, con perfil de voz inglés propio.
- `script.localization` marca el español como `not_started`; el validador permite ese desfase declarado sin relajar los guiones bilingües históricos.

## 2026-09-11 — Campaña generación: maxSegmentMs 30 s

- `campaign:higgsfield-trial-24h.maxSegmentMs` pasa de 8 s a **30 s** (Seedance 2.5).
- Builder lee el tope desde `provider-capabilities.json`; planes regenerados.

## 2026-09-11 — Studio: outputs desde catálogo (incl. Festival EN)

- `/studio` lista todos los outputs de `audio-outputs.json` vía el worker
  (`fetchOutputs`), con etiquetas localizadas; `audience-festival-en` es
  seleccionable y carga su timeline/chunks.

## 2026-09-11 — Dual festival EN (escaleta festival rev. 1)

- Generado `E:/Models/Qwen3-TTS/output/light-delay-festival-audience-dual-en.mp3`
  (~14.9 min) y `outline-chunks/en-festival-audience/` (114 cues @ 24 kHz).
- 25 diálogos Qwen sintetizados; catálogo `audience-festival-en` current.
- Chunks separados del dual master (`en-audience`).

## 2026-09-11 — Relato de audiencia del Festival derivado

- Creado el relato inglés de 11 capítulos derivado de `outline:light-delay-festival-master`, con trazabilidad explícita de sus 24 beats y las cuatro transiciones a microgravedad.
- Conserva el ocultamiento del destino y mecanismo del mensaje hasta la recepción, y ubica el sabotaje de vuelo después del asesinato.
- Registra 25 diálogos con dirección inglesa; el guion Festival posterior los revisa como material de adaptación y ya no depende de que el stub permanezca vacío.
- El registro y las herramientas de audiencia ahora admiten múltiples narrativas. La traducción española del Festival queda `not_started`. Dual EN generado después (~14.9 min).

## 2026-09-11 — Nuevo Festival derivado del master rev. 19

- Registrado `script:light-delay-festival-master` como derivado WIP independiente dentro de `continuity:light-delay-master-wip`; el Festival anterior permanece deprecado.
- Su escaleta story-only comprime los 58 hitos del master en 24 beats y 11 secuencias, con objetivo aproximado de 11:30 y rango editorial de 10–12 minutos.
- La trazabilidad outline→outline y el nuevo `report:outline-derivation` comprueban revisión fuente y cobertura causal completa. La UI muestra revisión, estado y enlaces a los hitos master.
- El `ScriptFile` dejó de estar vacío en el pase de guion posterior. `docs/wip/festival-cut-screenplay-runway.en.md` conserva procedencia de planificación; el estado vigente se resume en la entrada superior.

## 2026-09-11 — Dual de audiencia ES (lastSyncedRevision 19)

- Generado `E:/Models/Qwen3-TTS/output/light-delay-audience-dual-es.mp3` (~48.5 min)
  y `outline-chunks/es-audience/` (287 cues @ 24 kHz).
- Reuso 240; regenerados 47 (4 diálogos Qwen nuevos, incl. `p2-voss-doubt`).
- Catálogo `audience-es`: `sourceOutlineRevision` 19, `expectedCueCount` 287.
  Texto ES permanece `needs_revision` frente a la fuente inglesa.

## 2026-09-11 — Español al beat de sabotaje (master rev. 19)

- Master ES, `audience-narrative.es.md`, voces ES y escaleta ES actualizados al sabotaje
  de vuelo post-asesinato; `lastSyncedRevision` 19, status `needs_revision`.
- Diálogos de audiencia ES: 37 (incluye `p2-voss-doubt`). Export completo ES sigue
  bloqueado por campos españoles ausentes fuera de este beat; la escaleta ES se retuvo
  y se editó a mano en los pasajes del commit.

## 2026-09-11 — Dual de audiencia EN (master rev. 19)

- Generado `E:/Models/Qwen3-TTS/output/light-delay-audience-dual-en.mp3` (~49.0 min)
  y `outline-chunks/en-audience/` (287 cues @ 24 kHz).
- Reuso por content_hash: 283; regenerados 4 (solo narrador Kokoro).
- Catálogo `audience-en`: `sourceOutlineRevision` 19, `expectedCueCount` 287, current.
- Dual ES regenerado después (véase entrada superior).

## 2026-09-11 — Master revision 19: post-murder flight sabotage

- Harlan leaves flight control untouched before meeting Zao, preserving the later communications cut as the first unequivocal reveal of his guilt.
- Once Zao’s partial warning makes a later abort foreseeable, he murders her, secures the vault, cuts the bridge flight-command inputs at the adjacent local console, and then restores communications and cameras.
- English outline, audience narrative, generated outline export, and English TTS voice text are revision 19. Spanish remains at revision 17 and is not modified in this pass.
- The English audience dual was regenerated afterward for revision 19 (see the entry above).

## 2026-09-11 — Dual de audiencia EN (master rev. 18)

- Generado `E:/Models/Qwen3-TTS/output/light-delay-audience-dual-en.mp3` (~48.7 min)
  y `outline-chunks/en-audience/` (287 cues @ 24 kHz).
- Reuso por content_hash: 267; regenerados 20 (incl. 2 diálogos Qwen nuevos).
- Catálogo `audience-en`: `sourceOutlineRevision` 18, `expectedCueCount` 287, current.
- ES (`audience-es`) permanece stale en prosa rev. 15 / master ES 17.

## 2026-09-11 — English source policy and master revision 18

- English is now the active narrative and documentary source; Spanish is a subsequent translation. Deprecated cuts retain their historical Spanish cue provenance without governing new work.
- Master revision 18 repairs the Prologue reaction order, establishes Voss's visible misreading before Zao responds, and clarifies sabotage, search, evidence, survivor, motive, and detonation causality in English.
- `outline.localization` records Spanish as `needs_revision`, last synchronized at revision 17. The Spanish master export, audience narrative, voice script, and audio were deliberately not regenerated.
- The UI and validation pipeline now expose and tolerate that declared revision gap while continuing to require complete English source text.

## 2026-09-11 — Dual de audiencia EN (master rev. 17)

- Generado `E:/Models/Qwen3-TTS/output/light-delay-audience-dual-en.mp3` (~47.8 min)
  y `outline-chunks/en-audience/` (287 cues @ 24 kHz).
- Reuso por content_hash: 244; regenerados 43 (incl. 2 diálogos Qwen nuevos).
- Catálogo `audience-en`: `sourceOutlineRevision` 17, `expectedCueCount` 287, current.
- ES (`audience-es`) permanece stale en prosa rev. 15. Workers Studio detenidos
  durante la generación GPU; reiniciar worker/sidecar si se vuelve a `/studio`.

## 2026-09-10 — Continuidad temporal y causal, master rev. 17

- Auditoría continua desde la muerte de Zao; C10b conserva ID y pasa a la secuencia D.
- Tierra recibe antes de la explosión, pero su retransmisión llega tarde. Cronología de
  trece minutos desde recepción: mensaje y evidencia, aborto fallido, persecución y rescate.
- Harlan sabotea el mando remoto durante su inspección final; el control local queda a popa.
  Voss intenta abortar temprano. La mentira de Harlan sobre el acceso de Sorell queda interrogada.
- Elin prueba el vector antes de recibir, usa información explícita del mensaje y equipo
  diagnóstico establecido para sustituir la referencia temporal. La carga sigue armada y vigilada.
- Relatos ES/EN, exports y textos TTS sincronizados; se corrigen reparto, cuarta microgravedad,
  cronograma antiguo/nuevo y revelación prematura. Conservados 58 beats y 36 diálogos de audiencia.
- Registro de las quince correcciones y cronología: `docs/wip/continuity-review.es.md` y `.en.md`.
  En aquel momento los audios de prosa rev. 15 seguían pendientes; el dual EN se regeneró
  el 2026-09-11 (véase la entrada superior).
- Verificación final 2026-09-11: 96 tests unitarios y dos de catálogo de audio aprobados;
  check de Svelte/TypeScript, validaciones y derivados verdes. Readability sin errores;
  seis advertencias por beats breves, mayormente del archivo. Pruebas antiguas de Okoye
  reconciliadas con el perfil vigente de Caracas sin cambiar su caracterización.

## 2026-09-09 — Studio: regenerar con Qwen3-TTS

- En `/studio`, modo **Regenerar (Qwen3-TTS)** junto a **Imitar (Seed-VC)**.
- Ajuste de knobs emocionales/generativos y `instruct`; Accept/Listen/Assemble
  siguen sobre overlays keyed por diálogo estable.
- Worker: `regenerate` + `prepare-qwen` (GPU perezosa, lock compartido).
- Regenerar usa sidecar `qwen-studio-sidecar.py` cuando el worker es el venv
  Seed-VC (sin `qwen_tts`); Python del dual / `LIGHT_DELAY_QWEN_PYTHON`.
- Purga de tomas no aceptadas en overlays (`purge-takes`) desde el Studio.
- Ayuda contextual `?` por knob Qwen (ES/EN) en el panel Regenerar.

## 2026-09-09 — Refs ES latinoamericanas desde timbre EN

- Biblia y perfiles: castellano del elenco = Bogotá, Lima, Buenos Aires, Medellín,
  Santiago del Estero, Caracas. Sin mandarín/germánico/británico/hindi/francés/igbo
  en la viñeta ES. Inglés L1 sin cambios.
- Generación: `voice-donors/es/*` coloreados con `static/assets/voices/en/{Character}.wav`
  → `…/es-accents/latam-regional/`. Curaduría en `static/assets/voices/es/`.
- Dual ES de audiencia regenerado (~43.8 min): 36 diálogos con refs LatAm;
  narrador Kokoro reutilizado. MP3:
  `E:/Models/Qwen3-TTS/output/light-delay-audience-dual-es.mp3`.

## 2026-09-06 — Cuatro transiciones a microgravedad (master rev. 16)

- La escaleta maestra incorpora `C10b`, el giro de 180° a mitad del tramo entre
  la boca lejana y la estación Velari. La maniobra es la tercera entrada en
  microgravedad; el corte del clímax pasa a ser la cuarta.
- El master conserva 11 secciones de contexto y 8 secciones narrativas, ahora
  con 58 beats `story`. Los exports y relatos textuales ES/EN están sincronizados.
- Los duales de audiencia y sus 275 chunks siguen correspondiendo a rev. 15 y
  quedan marcados como desactualizados hasta una regeneración posterior.

## 2026-09-06 — Tomas estables por audience-dialogue-id

- Overlays de imitación keyed por `audience-dialogue-id`; stale = contentHash +
  speaker + idioma + engine. Regenerar el dual sin cambiar diálogos no exige
  Accept de nuevo. Backfill del índice y migración one-shot de tomas ya grabadas.

## 2026-09-06 — Studio local de imitación

- Editor `/studio` (SvelteKit, sólo `npm run dev`) + worker `:8765` con GPU
  perezosa. Catálogo `audience-es` / `audience-en` (275 cues, 24 kHz). Auto-F0
  on por A/B Elin/Zao ES. Tomas versionadas; stale a nivel de cue; ensamblado
  no pisa los duales canónicos. GitHub Pages no publica la ruta ni el worker.
- El historial de tomas permite escuchar una conversión antes de aceptarla; Play
  no cambia hasta el puntero aceptado.
- Cargar modelo y Convertir requieren `E:\Models\Seed-VC\.venv`. El worker
  reinserta el `site-packages` del venv al cargar el modelo y muestra el
  intérprete en diagnósticos. En Windows el bind de `:8765` es exclusivo.

## 2026-09-06 — Pase de imitación Seed-VC SVC (F0)

- Nueva pista paralela a Qwen: la toma del actor (acento imitado + emoción)
  conserva el contorno F0; Seed-VC pinta el timbre de
  `static/assets/voices/{lang}/{Character}.wav`.
- CLI y worker local: `scripts/convert-imitation-performance.py` (`--check`,
  `--check-local`, conversión, `--serve` en `:8765` **sin** cargar GPU al
  arrancar). Knobs portátiles:
  `docs/wip/seedvc-imitation-defaults.json` (`f0_condition` on, `auto_f0_adjust`
  on, 50 pasos). Rutas de máquina en env o `seedvc-imitation-defaults.local.json`.
- Studio en `/studio` con `npm run dev` + worker. GitHub Pages no aloja este
  worker ni anuncia la ruta.

## 2026-09-06 — Audio del relato para público regenerado

- Duales alineados con rev. 15, **Lúz Tardía** / **Próxima**, pausas de capítulo
  y `pronunciationMap` de Sorell:
  `E:/Models/Qwen3-TTS/output/light-delay-audience-dual-es.mp3` (~43.3 min);
  `E:/Models/Qwen3-TTS/output/light-delay-audience-dual-en.mp3` (~42.4 min).
- Los MP3 anteriores quedan sustituidos. No se regeneraron refs de voz ni los
  duales de la escaleta general.

## 2026-09-06 — Localización y autoridad del pipeline TTS

- La narrativa vigente y el relato para público escriben **Lúz Tardía** y
  **Próxima** en español; las formas inglesas siguen como **Light Delay** y **Proxima**.
- El builder obtiene la revisión de `light-delay-master-narrative.json`, no de los
  Markdown. `audience-dialogue-performance.json` tiene identidad estable y referencia
  explícita al outline que gobierna su revisión.
- Los once capítulos separan el número pronunciado de su título mediante una pausa
  de 1200 ms. `Sorell` permanece en las fuentes; el mapa de la variante de voz genera
  **Soréll** (EN) o **Sorél** (ES).
- Las instrucciones Qwen declaran idioma, situación dramática y entrega en lenguaje
  natural. Los derivados Markdown y los duales de audiencia ya coinciden con esas
  fuentes.

## 2026-09-06 — Relato para público rev. 15 y dirección de interpretación estable

- El relato EN recibió una revisión narrativa profunda; la versión ES se reescribió
  en presente con la misma estructura causal, orden de revelaciones y 12 secciones.
- Las dos fuentes contienen 36 intervenciones audibles enlazadas por
  `audience-dialogue-id`; ya no se sincronizan por índice ni por el texto traducido.
- `data/production/audio/audience-dialogue-performance.json` conserva intención
  dramática bilingüe e indicaciones específicas para interpretar cada idioma.
- El builder falla ante IDs ausentes/duplicados, pasos master inválidos o hablantes
  discordantes. `npm run tts:audience:check` verifica también fuentes y derivados.
- La escaleta maestra pasa a revisión 15 con los diálogos corregidos y sus exports
  Markdown regenerados. Conserva 38 citas; el relato oye 36 porque omite la cita
  de encuadre P1 y reproduce la despedida de Zao sólo en E2, no en B7.
- Los MP3 de las entradas anteriores quedaron obsoletos frente al texto rev. 15;
  ya fueron regenerados (véase la entrada de audio del mismo día).

## 2026-09-06 — Audience: Ardor Celestial + pausa tras número de capítulo

- ES: nombre completo de la nave **Ardor Celestial** (antes «Celestial Ardor»).
- Capítulos EN/ES: `Chapter N. …` / `Capítulo N. …` (punto = pausa corta TTS).
- **Listo:** `light-delay-audience-dual-es.mp3` (~47.7 min);
  `light-delay-audience-dual-en.mp3` (~51.0 min).

## 2026-09-06 — Audience: pausa tras Prólogo + Capítulos numerados

- Prólogo/Prologue se habla solo; pausa 1200 ms; luego el subtítulo.
- Capítulos: `Chapter N — …` / `Capítulo N — …` (1–11) en prosa y voces.
- Builder: `audience_heading_cues` en `build-tts-voices-outlines.py`.
- **Listo:** `light-delay-audience-dual-es.mp3` (~47.8 min) y
  `light-delay-audience-dual-en.mp3` (~51.0 min; también regeneró diálogo EN
  con refs selected-slow-v2).

## 2026-09-06 — Refs selected-slow-v2 promocionadas; regen audience ES

- Voces EN/ES en `static/assets/voices/` reemplazadas por selected-slow-v2.
- **Listo:** `light-delay-audience-dual-es.mp3` (refs lentas + línea Proxima como Harlan;
  reuso por content_hash; narrador no regenerado en el pase final).

## 2026-09-06 — Candidatos lentos v2 (EN acento intacto / ES suavizado)

- **Listo para revisar:** `…/{en,es}-accents/selected-slow-v2/` (6 WAV c/u).
- Ritmo más pausado; EN conserva L1; ES acento más suave.
- Promover tras escucha: `python scripts/regenerate-selected-voice-refs-slower.py --lang all --promote-only`

## 2026-09-06 — Candidatos lentos desde voces selected

## 2026-09-06 — Ritmo: sin time-stretch; refs más lentas

- `dialogueSpeed` vuelto a **1.0** (EN/ES): el stretch post-synth sonaba mal.
- Camino correcto: regenerar muestras ICL (`*_v2_qwen-{en,es}.wav`) con instruct
  de ritmo pausado (opcional: Seed-VC `length_adjust` > 1), curar, promover a
  `static/assets/voices/`, luego regen de diálogo.
- Regen EN con stretch **cancelado**.

## 2026-09-06 — Diálogo EN: más lento + temp + frases completas

- Plan EN (temp/completitud/acentos) sigue válido **sin** time-stretch; ritmo vía
  muestras nuevas.

## 2026-09-06 — Diálogo ES: más lento + temp 0.82 + acento suave

- `dialogueSpeed: 0.85`, temp/top_p `0.82`/`0.90`, instruct de acento L1 ligero.
- **Listo:** `E:/Models/Qwen3-TTS/output/light-delay-audience-dual-es.mp3`
  (~48.1 min; 36 diálogo regenerados + narrador; speed/temp/acento aplicados).

## 2026-09-06 — Qwen: instruct más expresivo

- Default + prefijo de expresividad en clone ICL (`qwen-icl-clone-defaults.json`).
- Refs maestras intactas. Knobs vigentes: ver entrada superior (temp 0.82).
- **Listo:** diálogo ES regenerado + ensamblado →
  `E:/Models/Qwen3-TTS/output/light-delay-audience-dual-es.mp3`
  (`--force-speaker` ×6; narrador Kokoro reutilizado).

## 2026-09-05 — Audience ES: Alex 0.85 + léxico + diálogo Soréll

- Cast ES: `em_alex` a **0.85**. Título: **Lúz Tardía**. *inhibidor de señales* /
  *pantallas*. Cue de Soréll sobre la IA ahora es diálogo `[Sorell]`.
- Fuentes: `audience-narrative.es.md` / `.voices.es.md` (EN hermano sincronizado).
- **Listo:** `E:/Models/Qwen3-TTS/output/light-delay-audience-dual-es.mp3`
  (~47.7 min; Alex 0.85 + Qwen ICL; chunks en `outline-chunks/es-audience/`).

## 2026-09-05 — Render audience EN listo

- **Listo:** `E:/Models/Qwen3-TTS/output/light-delay-audience-dual-en.mp3`
  (~50.7 min; 283 cues; narrador Kokoro `am_michael` + Qwen ICL).
- Script: `docs/wip/audience-narrative.voices.en.md`
- Chunks: `E:/Models/Qwen3-TTS/output/outline-chunks/en-audience/`

## 2026-09-05 — Narrador ES = Kokoro `em_alex`; render audience ES

- Cast: `docs/wip/kokoro-voice-cast.es.json`. Preferencia argentina/barítono
  sigue pendiente (no hay pack Kokoro); Alex es LatAm interim.
- **Listo:** `E:/Models/Qwen3-TTS/output/light-delay-audience-dual-es.mp3`
  (chunks en `outline-chunks/es-audience/`). El ensamblado dual escribe MP3
  (192 kb/s) por defecto.

## 2026-09-05 — Refs de voz native-L1 promocionadas

- EN/ES: las seis tomas seleccionadas de `native-l1-v2/finalists/` están en
  `static/assets/voices/{en,es}/` (Zao, Voss, Harlan, Elin, Sorell, Okoye).
- Procedencia en cada `selection.json`. Okoye ES = Igbo L1 (ya no rioplatense).
- Tras reemplazo, regenerar cues de diálogo con
  `generate-dual-outline-audio.py --force-speaker …` o `--force-all`.

## 2026-09-05 — Relato narrativo para público (capítulos + TTS)

- `docs/wip/audience-narrative.es.md` / `.en.md`: versión para oyentes/lectores
  (12 capítulos, sin Purpose/Cast/Motive/física como frontmatter). Descubrimiento
  con Zao; mensaje completo y solución de retardo de luz sólo en «El mensaje» /
  *The Message*.
- Multi-voz: `audience-narrative.voices.es.md` / `.voices.en.md` (35 diálogos
  atribuidos, mismos hablantes). Render sugerido con
  `--chunks-dir …/outline-chunks/{es,en}-audience`.
- Rebuild: `python scripts/build-tts-voices-outlines.py --source audience` (o
  `--source all`).

## 2026-09-05 — Outlines TTS multi-voz alineados a rev. 14

- EN/ES listos para render dual: `docs/wip/outiline-for-kokoro-tts.voices.md` y
  `.voices.es.md` (37 diálogos, hablantes idénticos; Cast con formación
  lingüística rev. 14; Soréll en prosa, tag `[Sorell]`).
- Hermanas sin tags para narración continua: `outiline-for-kokoro-tts.md` /
  `.es.md`. Regeneración: `python scripts/build-tts-voices-outlines.py`.
- `--lang es` en `generate-dual-outline-audio.py` apunta al outline ES por defecto.
- El master ya atribuye las 37 citas con `speakerId`; no hubo que marcar
  ambigüedades adicionales en el JSON.

## 2026-09-06 — Formación lingüística y dirección bilingüe del elenco maestro

- `data/voice-profiles.json` separa ahora el timbre común de la prosodia, el lugar y variedad de aprendizaje y el estilo de diálogo por idioma para Zao, Elin, Harlan, Voss, Sorell y Okoye.
- Formación fijada: Zao (Singapur/Bogotá), Elin (Bengaluru/Medellín), Harlan (Portsmouth/Buenos Aires), Voss (Toronto/Lima), Sorell (Montréal/Santiago del Estero) y Okoye (Enugu/Caracas). La sección Reparto de la escaleta maestra conserva estos datos como biografía WIP.
- La narrativa maestra sube a revisión 14 y sus 37 citas poseen `speakerId`. Los Markdown ES/EN muestran la atribución y el round-trip la conserva; `report:dialogue-style` bloquea citas anónimas y perfiles bilingües incompletos.
- El diálogo existente del master fue auditado con diferencias sutiles y no fonéticas. Los cuts deprecados no se modificaron. Sus diálogos y las referencias TTS generadas antes de fijar estas variedades requieren revisión antes de cualquier rescate; los WAV WIP aún no están registrados como muestras aprobadas en `sampleAssetIds`.
- La ficha pública de cada personaje presenta por idioma locale, formación, prosodia y estilo de diálogo. El schema de perfiles de voz y las pruebas de repositorio formalizan el contrato.

## 2026-09-05 — La escaleta maestra pasa a ser la autoridad narrativa WIP

- `data/outlines/light-delay-master-narrative.json` es ahora la fuente de verdad narrativa. El estado WIP sigue indicando trabajo pendiente, pero ya no la subordina al corto anterior.
- `project.narrativeAuthority` registra outline, continuidad y stub; `canonicalScriptId` apunta a `script:light-delay-master-narrative`. Las rutas `/outline`, `/script` y `/animatic` abren respectivamente el master o estados vacíos honestos sin inventar implementación.
- Main-short, Festival, tráiler y long quedan `deprecated`; sus animatics, planes de generación, ledgers y checklist Higgsfield quedan `obsolete` y retenidos sólo para rescatar diálogo, puesta, restricciones y procedencia.
- `data/editorial-lifecycle.json` y el informe generado `docs/MASTER_RELEVANCE_REPORT.md` clasifican  autoridad, compatibilidad, revisión, archivo y obsolescencia. Los casos inciertos se retienen; nada se elimina hasta cumplir cuatro compuertas globales.
- Los Markdown ES/EN de la narrativa maestra ahora se generan desde el JSON con `master-outline:export`; la importación inversa sólo escribe un candidato separado.
- La UI agrupa el archivo deprecado, muestra avisos de ciclo de vida en productos/entidades/assets, evita indexar rutas archivadas y excluye los cortes anteriores del sitemap.
- La arquitectura y transición quedan documentadas en `docs/ADR-0002-MASTER-NARRATIVE-AUTHORITY.md`. `docs/CANON_DECISIONS.md`, la sincronización y el ledger causal anteriores llevan aviso explícito de deprecación.
- `object:optical-contingency-transmitter` conserva su ID para procedencia, pero adopta la denominación del master «matriz óptica de comunicaciones de larga distancia». La referencia visual asociada requiere revisión y el compartimiento de servicio del reactor, la bóveda radiológica, el jammer, el dispositivo de muñeca y el paquete de impulso geofísico siguen como deuda explícita de catálogo.

## 2026-09-05 — Identidad nigeriana propia para Dara Okoye

- `character:okoye` incorpora rasgos, apariencia y vestuario bilingües; deja de compartir la hoja y el perfil de voz del tripulante genérico de seguridad.
- Nueva hoja propia `static/assets/characters/okoye/model-sheet.png`: mujer nigeriana de alrededor de cuarenta años, complexión atlética compacta, traje carbón, tether y elementos de inmovilización no letales. El prompt, las referencias y la elegibilidad no verificada quedan registrados en el asset.
- `voice:okoye` fija contralto; inglés con inflexión nigeriana/igbo (Enugu) y castellano venezolano formal de Caracas. No se registra todavía ninguna muestra aprobada en `sampleAssetIds` más allá de las refs TTS en `static/assets/voices/`; el material TTS WIP preexistente queda pendiente de reevaluación tras LatAm.
- La narrativa maestra sube a rev. 13: amplía la función de Okoye, corrige dos pronombres masculinos y selecciona una variante de continuidad que no hereda el pasado operativo con Harlan del canon primario. Conserva 11 secciones de contexto, 8 secciones narrativas y 57 beats.
- La ficha pública de personajes muestra rol, rasgos, apariencia, vestuario y voz cuando existen. Catálogo actual: 143 assets, incluidas 38 referencias.

## 2026-09-04 — Dual TTS de la escaleta narrada (WIP)

- Pipeline: Kokoro (`am_michael`) para narración; Qwen3-TTS 1.7B Base + refs curadas para diálogo
  (Zao, Voss, Harlan, Elin, Sorell y Okoye; las muestras siguen siendo material WIP, no assets de voz aprobados).
- Emoción/entonación: 37 líneas `[QwenInstruct]` en
  `docs/wip/outiline-for-kokoro-tts.voices.md` (+ espejo ES); dirección de
  interpretación por línea (no son tags Kokoro). Rebuild:
  `scripts/build-tts-voices-outlines.py`.
- Render dual: `scripts/generate-dual-outline-audio.py --lang en|es` → chunks en
  `E:/Models/Qwen3-TTS/output/outline-chunks/{en,es}/` + WAV ensamblado
  `light-delay-outline-dual.mp3`. Casts `qwen3-tts-cast.json` /
  `qwen3-tts-cast.es.json`. Guía: `docs/TTS_VOICE_PIPELINE.es.md`.
- Nota técnica: no instalar `onnxruntime` (CPU) junto a `onnxruntime-gpu`; el EP CUDA de Kokoro
  requiere solo el paquete GPU + DLLs CUDA de PyTorch en PATH.
- **Timbre vs prosodia (Seed-VC V2 + Qwen ICL):** Canon en
  `docs/wip/qwen-icl-clone-defaults.json` y `docs/TTS_VOICE_PIPELINE.es.md`. Seed-VC pinta L1 nativo sobre timbre selected;
  Qwen clona con **ICL** (`x_vector_only=false` + Whisper del `*_v2.wav`, temp=0.70,
  top_p=0.85). `x_vector_only` borra `ref_code` y la prosodia Seed-VC. Notas locales:
  `E:/Models/Seed-VC/LIGHT_DELAY_NOTES.md`.
  - Outline dual: `generate-dual-outline-audio.py --lang en|es` usa los mismos knobs
    (casts `qwen3-tts-cast.json` / `qwen3-tts-cast.es.json`); regeneración por personaje
    vía `--force-speaker` / fingerprint del WAV.
  - Pronunciación hablada de Sorell: grafía **Soréll** en prosa/diálogo; tag `[Sorell]` ASCII.
  - EN native-L1 V2: `…/en-accents/native-l1-v2/` — **24/24** Qwen ICL. Script
    `pipeline-english-native-l1-v2-qwen.py`. Curaduría pendiente.
  - ES native-L1 V2: `…/es-accents/native-l1-v2/` — **24/24** Qwen ICL. Script
    `pipeline-spanish-native-l1-v2-qwen.py`. Curaduría pendiente.
  - ES/EN selected en repo: `static/assets/voices/{es,en}/` — native-L1 V2 + Qwen
    ICL (Zao, Voss, Harlan, Elin, Sorell, Okoye; sin Cael). Ver `selection.json`.
  - Donantes: `E:/Models/voice-donors/{en,es,native}/` (nativo: 4 clips × 6 L1).
  - Pools EdAcc / l1-prosody / okoye-rioplatense / native-l1 V1 EN: borrados (obsoletos).

## 2026-09-04 — Ventana final, regreso de Harlan y encuentro Velari (WIP, no canon)

- `docs/wip/general-narrative-outline.en.md` está en rev. 13. El tramo desde la boca lejana hasta
  la estación baja a ~17,4 millones de km y ~23 h 25 min; el trayecto óptico de Zao se mantiene
  en 167,8 AU / 23 h 15 min y deja unos 10–15 minutos para E–F.
- Harlan sube por servicio con intención de informar y retomar su puesto; al oír a Zao cambia de
  plan y activa el jammer preparado desde su dispositivo de muñeca. El jammer no se añade como
  pista de la investigación.
- El contexto inicial incorpora la biología y el lenguaje luminoso Velari necesarios para que la
  escaleta sea autosuficiente. F7 y G2–G2b fijan la secuencia silencio, atención y habla dentro de
  una esfera ambiental de ~5 m, bajo la sombra solar de la estación.
- `data/outlines/light-delay-master-narrative.json` ya está sincronizado con rev. 13 en español e
  inglés: conserva 11 secciones de contexto, 8 secciones narrativas y 57 beats `story`, sin
  inventar implementación. La descripción Velari vive dentro de `Terminology` como prosa
  estructurada y la fidelidad inglesa se verifica contra la revisión y el SHA-256 de la fuente.

## 2026-09-04 — Narrativa maestra estructurada (WIP, no canon)

- Quinta entrada registrada: `script:light-delay-master-narrative`, dentro de la continuidad de desarrollo `continuity:light-delay-master-wip`; no altera `canonicalScriptId`, los cuatro guiones COM/láser ni el tratamiento largo de ~100 minutos.
- La conversión inicial tomó íntegramente la revisión 11; las entradas superiores registran su sincronización posterior hasta rev. 13. Conserva 11 secciones de contexto, 8 secciones narrativas y 57 beats `story`, sin inventar actos, escenas, cues, tomas, cobertura o planes de generación.
- El español y el inglés conviven inline. Los textos ingleses de P1–G3 se derivan literalmente del Markdown —normalizando sólo su estructura— y `npm run build:master-outline:check` los verifica contra ruta, revisión y SHA-256.
- El contrato admite `framing`, `storySections` y `story.body`; `/outline/[scriptId]` presenta contexto anterior/posterior, navegación por secuencia, aviso no canónico y la prosa completa. Guion, editor y player muestran estados vacíos seguros para esta entrada.
- El Markdown WIP se conserva como procedencia histórica en inglés. La fuente autoral de la entrada estructurada es el JSON bilingüe; una futura adopción en otros cuts requiere una decisión explícita.

## 2026-09-04 — Vindicación imaginada de Harlan (WIP, no canon)

- `docs/wip/general-narrative-outline.en.md` está en rev. 11. Harlan teme que el mensaje de Zao
  lo condene, pero también espera que permita una vindicación póstuma; al creer que el disparo
  falló, lamenta en privado que nadie sepa quién «los salvó».
- El reconocimiento queda como recompensa psicológica, no como cuarto motivo operativo. El
  informe final atribuye a Zao el rescate de la tripulación y la preservación del contacto.
- Esa revisión del Markdown no tocó `data/outlines/` ni guiones y no sustituyó el canon vigente; su conversión estructurada posterior está registrada en la entrada superior.
- El Markdown fuente sigue sólo en inglés; la escaleta JSON derivada ya contiene español e inglés inline.

## 2026-09-04 — Hipótesis falsa de sabotaje de combustible (WIP, no canon)

- `docs/wip/general-narrative-outline.en.md` está en rev. 10. Harlan unifica inicialmente el
  consumo extra y los neutrones como sabotaje del sistema D–³He; Elin descarta la fuga, demuestra
  masa adicional y localiza una fuente compacta detrás de la puerta antes del mensaje de Zao.
- Esa revisión intermedia no tocó `data/outlines/` ni guiones y no sustituyó el canon vigente.
- El Markdown fuente sigue sólo en inglés; la traducción vive en la escaleta JSON posterior.

## 2026-09-04 — Revelación diferida del mensaje de Zao (WIP, no canon)

- `docs/wip/general-narrative-outline.en.md` está en rev. 9. El público ve que Zao transmite,
  pero comparte con la tripulación la incertidumbre sobre el destino del disparo hasta que E2
  revela el cálculo y la grabación mediante flashback.
- Esa revisión intermedia no tocó `data/outlines/` ni guiones y no sustituyó el canon vigente.
- El Markdown fuente sigue sólo en inglés; la traducción vive en la escaleta JSON posterior.

## 2026-09-03 — Escaleta narrativa general (WIP, no canon)

- Borrador maestro en `docs/wip/general-narrative-outline.en.md` (rev. 7; antes `festival-cut-outline-v2-restructured-EN.md`). Cadena causal a longitud natural, adaptable a cortes corto/medio/largo.
- Esa revisión inicial no tocó `data/outlines/` ni guiones. El Markdown fuente permanece sólo en inglés.
- No sustituye el canon vigente (sabotaje COM / láser). La escaleta JSON posterior registra esta rama como WIP no canónico; cualquier adopción todavía requiere confirmación explícita.

## 2026-09-01 — Consola del puente y tomas de tránsito de Júpiter

- Blockout actualizado; GLB de la consola en `blender/bridge-console-station.glb` (LFS).
- Hojas de vista en `static/assets/props/bridge-console-station-with-chair/`; pendiente registrarlas en el catálogo de assets.
- Escenas de toma de tránsito: `blender/shots/jupiter-transit-a-01b-approach-sunlit.blend` y `jupiter-transit-a-01c-flip-and-burn.blend`.

## 2026-09-01 — Checklist pre-suscripción Higgsfield

- Estrategia acordada: **Ultra × 1 mes** tras congelar outline/guion/animatic/prompts; no suscribir hasta cerrar editorial.
- Checklist regenerable: `docs/production/HIGGSFIELD_PRE_SUBSCRIBE_CHECKLIST.md` (28 video gens tráiler, 46 festival nuevos, 5+4 PNG skip, ~888 cr @ 480p sin reintentos). JSON: `data/production/checklists/higgsfield-pre-subscribe.json`.

## 2026-08-31 — Referencia Higgsfield MCP

- Referencia operativa MCP (créditos vs Unlimited, dos agentes, JSON de corrida): `docs/technical/HIGGSFIELD_MCP.md`.

## 2026-08-31 — Referencia visual de Harlan

- Descripción canónica bilingüe ampliada para distinguir a Harlan de Voss en silueta, rostro, vestuario y actitud.
- Hoja regenerada en `static/assets/characters/harlan/model-sheet-v2.png` y registrada como reemplazo con procedencia.
- El staging de Higgsfield incluye Zao, Harlan (v2) y briefs de escena 5; falta confirmar externamente que Harlan no colapsa con Voss antes del freeze de prompts.

## 2026-08-31 — Referencias terrestres separadas

- La hoja combinada de manifestantes se conserva para multitudes, pero Aqueronte y partidarios del contacto tienen ahora hojas independientes y descripciones bilingües.
- La periodista tiene una hoja neutral para posibles insertos en cámara; sus tomas de voz en off no se alteran.
- Catálogo y staging actualizados: 143 assets registrados y 34 copias preparadas para Higgsfield.

Fecha de corte: 2026-08-31.

## Completado

- **Completitud de metadatos de toma:** Main tiene propósito y encuadre en sus tomas de historia y cartelas; Festival conserva cobertura en A–G más título/créditos; el generador y JSON del tráiler cubren propósito y encuadre sin heredar spoilers. La deuda restante está separada en bindings, placements, performance y subcampos avanzados de cámara.
- **Títulos y créditos:** cold open + título diferido (`LUZ TARDÍA` / `LIGHT DELAY`, una línea) + créditos finales en main y Festival; tráiler con marca, lema y créditos al cierre. Specs en [`docs/TITLE_AND_CREDITS.md`](TITLE_AND_CREDITS.md). Las tres cartelas de título/lema ya usan PNG en `static/assets/animatic/titles/`; nombre legal del autor aún `AUTHOR_NAME_PLACEHOLDER` y las cartelas de créditos siguen con placeholder.
- **Guion corto — ritmo, causalidad y láser:** 17 escenas de historia (+ título/créditos), **128** tomas y ~30:50,5 de montaje derivado; ocho tripulantes de misión declarados. Ver `docs/EDICION_ESCENA_LASER_Y_RITMO_DIALOGO.md` y `docs/CONTINUIDAD_CAUSAL_GUIONES.md`.
- **Clímax causal revisado en main y Festival:** la cámara prueba que Sorell llegó después de la muerte y Voss suspende la credencial comprometida con escolta, sin tratarla como culpable. El token de Zao autentica evidencia; Voss revoca a Harlan; Elin necesita cinco segundos para cerrar la rama hostil. Bajo 1 g, Harlan bloquea el accionamiento principal; el corte programado a T−12 s inicia microgravedad y Okoye supera una vacilación ante su apelación para redirigirlo con pasamanos y tether. Sorell valida el saludo fuera de línea, Voss lo preautoriza y el protocolo lo libera automáticamente en T=0.
- **Referencia realista del puente:** `static/assets/locations/celestial-ardor-bridge/realistic-reference.png` (1536 × 864) fue rehecha desde el blockout corregido. Las escaleras tienen barandas interiores continuas —también sobre los descansos horizontales— y barandas exteriores paralelas, con las aberturas funcionales junto a ambos cilindros. Ventanas pequeñas y reforzadas recorren todas las paredes visibles del casco; se mantienen paneles compuestos claros, acentos apagados, tapicería y luz de trabajo habitable.
- **Referencia cercana de puestos:** `static/assets/locations/celestial-ardor-bridge/realistic-console-reference.png` (1536 × 979) aplica el mismo acabado desde una cámara próxima a los seis puestos y la silla de capitán, conservando las barandas aportadas y las ventanas reforzadas en todo el casco visible.
- **Referencia del acceso de servicio:** `static/assets/locations/celestial-ardor-bridge/realistic-service-shaft-reference.png` (1536 × 864) establece el ángulo para la entrada oculta de Harlan detrás de las escaleras; mantiene el acceso fuera de cuadro y jerarquiza visualmente la silla de capitán sin alterar su posición.
- **Puente y bloqueo de Harlan:** la geometría documentada ya coincide con el modelo: seis puestos en arco, silla de capitán, mesa para seis, escaleras abiertas junto a servicio/ascensor y escotilla de servicio con bandeja COM A/B contigua fuera de la vista. Main, Festival y largo conservan el orden causal exacto: ascenso y apertura de escotilla durante la llamada, jammer, apertura de bandeja, desenchufe cableado, reingreso, cierre y descenso.
- **Cartelas inglesas de título:** `static/assets/animatic/titles/` contiene `film-title.png`, `trailer-brand.png` y `trailer-tagline.png`, todos opacos y normalizados a 1536 × 864. Registrados en `data/assets.json` y enlazados en main, Festival y tráiler; el título principal y la marca usan únicamente `LIGHT DELAY`.
- **Campaña de afiches V1:** cuatro conceptos en formatos apaisado y retrato, disponibles en español e inglés bajo `static/assets/marketing/posters/v1/`, con continuidad basada en las hojas canónicas de personajes, Proxima, Celestial Ardor y la Estación Velari. El manifiesto de marketing conserva copy, dimensiones, orientación, pares localizados y referencias; la elegibilidad para concurso permanece sin verificar.
- **Escaletas causales por cut:** las seis entradas tienen synopsis y una capa `story` legible: 12 main, 7 tráiler, 12 largo y 15 Festival deprecado; 58 master WIP; y 24 beats en el nuevo Festival derivado. El master permanece story-only; el nuevo Festival ya declara cobertura de guion pero no de animatic. Sus 24 beats trazan los 58 hitos master sin omisiones.
- **Lectura aislada y protección del tráiler:** `report:outline-story` exporta sólo la columna vertebral narrativa para revisión humana; la falta de enlaces causales en `story` es error. `check:trailer-spoilers` y su prueba de regresión impiden identificar al culpable o confirmar envío, recepción, muerte, contención de la amenaza o resultado del saludo en el avance.
- **Fatalidad fuera de campo diferenciada:** main, festival y largo confirman la muerte de Zao mediante golpe seco, cese de forcejeo/respiración y negro sostenido. El tráiler conserva el mismo corte previo al ataque, pero sale pronto del negro con música continua y deja inciertos tanto la muerte como el envío.
- **Razonamiento crítico restaurado:** main, festival y largo explican en escaleta por qué Zao descarta Tierra (doble retardo hasta la Ardor) y Proxima (oclusión de Júpiter L2–L1), y por qué sólo sirve apuntar al corredor futuro. También conservan que Harlan supone erróneamente un envío a la Tierra, se tranquiliza, lamenta la suerte de Zao y suspira antes de matarla.
- **Llegada, orden y carrera verificables:** Harlan asciende por servicio y abre la escotilla al nivel del puente justo durante la llamada; sólo reacciona ante «la verdadera firma apunta a—». Voss sopesa la implicación de Sorell, la envía a verificar y luego exige que busque a Harlan y no entre sola; la demora resultante y las rutas servicio/circulación cotidiana explican quién llega primero.
- **Cadena probatoria y cierre sincronizados:** main y Festival implementan token personal de Zao, snapshot del manifiesto firmado por hardware, auditoría independiente de Elin, contención física de Okoye con Voss en el puente y envío final del informe terrestre sin respuesta. La escaleta larga conserva esa intención, pero su implementación quedó diferida. Festival implementa E–G tanto en cues como en 29 tomas nuevas.
- **Informes editoriales en web y CLI:** rutas dinámicas `/reports/` y exportación `npm run report:all` desde un único `report-runner.mjs` compartido. Los defaults apuntan al master; una auditoría de productos anteriores requiere selección explícita o `--include-deprecated`.
- **Deuda visual del animatic:** inventario provisional de 208 candidatos `needs_regeneration` (112 main + 67 Festival + 29 tráiler) y 11 placeholders main `needs_replacement` (créditos + escenas 5–8). La producción visual queda bloqueada hasta aprobar ritmo, encuadres, referencias y freeze por cut; informes en `npm run report:editorial`.
- **Estimación de diálogo hablado:** montaje vs tiempo de diálogo estimado (WPM) en guion, animatic y player; flags editoriales por toma (>2 hablantes, fuera de cámara); `npm run report:dialogue-timing` genera MD+JSON en `reports/dialogue-timing/`.
- **Bloqueo 3D Proxima/Ardor:** `blender/light-delay-blockout.blend` con siluetas exteriores; hábitats de Proxima como rueda radial; checklist y deuda de detalle en docs técnicos; hoja de ruta de producción y mapa de tomas exteriores/animación.
- **Carrusel de assets en entidades:** detalle de personaje/lugar/vehículo/objeto muestra las imágenes raster de `referenceAssetIds` en un carrusel; Proxima y Celestial Ardor incluyen sheet, proportional, stills de bloqueo y escala común.
- **Miniaturas de catálogo:** WebP derivados en `static/assets/_thumbs/` (`thumbs:generate` / `thumbs:sync`); las tarjetas de arte/entidades usan la miniatura; el detalle sigue con el original.
- **Carrusel automático en tarjetas:** si una entidad tiene varias referencias raster, la tarjeta rota miniaturas sin controles; el detalle mantiene navegación manual.
- **Documentación reconciliada:** fuentes activas saneadas contra los JSON y el estado 3D vigente; 17 escenas de historia (+ título/créditos), 128 tomas/takes, 100 frames legacy y 143 imágenes quedan diferenciados.
- **Sitio público bilingüe y presentación:** inglés por defecto en `/`, español en `/es/`, landing pública, archivo editorial en `/project`, selector de idioma con rutas recargables, Paraglide JS, SEO canónico con `hreflang`, Open Graph, sitemap, manifest, favicon y marca propia. Las rutas EN/ES se prerenderizan también con `BASE_PATH=/light-delay`.
- **Copy de portada revisado:** la landing identifica la obra como ciencia ficción dura, simplifica la premisa de Zao sin cambiar el canon, usa inglés estadounidense coherente con `en_US` y alinea numerales, nombre del corto y CTA del archivo en EN/ES.
- **Generación i18n reproducible:** `npm run check` genera los módulos tipados de Paraglide antes de `svelte-check`; el compilador directo y el plugin de Vite comparten opciones, incluido el base path de Pages. Una instalación limpia ya no depende de artefactos ignorados del entorno local.
- **Texto legacy portado y traducido:** las cinco páginas prose, los índices de arte/personajes y la portada legacy tienen equivalentes basados en datos. Notas, biblia, reporte, momentos y estructura de 30 minutos se migraron con jerarquía, listas, tablas y beats; la copia española se reconcilió con el canon vigente y la inglesa conserva la misma topología. `data/legacy-text-migration.json` funciona como ledger verificable.
- **Contenido narrativo bilingüe:** guiones, diálogos, subtítulos derivados, escenas, beats, tomas, assets, entidades, taxonomía, funciones, variantes y outlines llevan inglés **inline** (`LocalizedString` / `variants.en`). Los overlays `public.en.json` y `entities.en.json` están retirados/vacíos. `validate:translations` exige `es`+`en`; el inglés sigue en `draft` y el español conserva autoridad. Paraglide cubre sólo el chrome de UI.
- **Arquitectura de producción sin generación:** JSON Schema ejecutable, planes provider-neutral por cut, segmentación a 8 s, presupuesto de adjuntos, artefactos still/first/last/audio, snapshots Seedance/Higgsfield y compilador que rechaza prompts bloqueados. Los prompts reales permanecen nulos hasta aprobación editorial; no se generaron medios.
- **Preparación de prompts del Festival:** las 67 tomas A–G declaran propósito, bindings de entidades y contexto físico. A–D quedó reconciliado con Ardor atracada, microgravedad, transmisión óptica, empuje posterior y displays en inglés. El informe ya sólo bloquea este cut por freeze editorial y muestras de voz ausentes.
- **Ledger causal ejecutable:** main y Festival validan una cadena de 13 pasos y 13 acciones con hechos previos, conocimiento por actor y referencias a escaleta/tomas. Voss envía la búsqueda por demora y negación, no por conocer aún la muerte. Tráiler y largo permanecen `not_applicable` sin falso verde porque no exponen una cadena causal completa implementada. `report:causal-validity` corre en CI.
- **Notas humanas:** contrato ampliado y `docs/PENDING_AUTHOR_NOTES.md` generado desde los JSON (`notes:build` / `notes:check`); el informe separa **0 notas vigentes** de **167 notas archivadas** pertenecientes a material deprecado/obsoleto, preservadas para rescate.
- **Navegación responsive:** todas las rutas salvo Modo película usan header global compacto + rail persistente en escritorio y barra inferior + hoja modal en móvil. El umbral `calc(26.88em + 52.8ch)` responde a capacidad tipográfica; ambos modos enlazan el repositorio de GitHub.
- **Player adaptable:** landscape conserva la composición inmersiva; portrait ordena frame, detalles desplegables y controles persistentes, con continuidad de toma, progreso y panel al cambiar orientación.
- **Auditoría móvil:** inicio, guion, animatic, arte, comparación, documentos, entidades y assets adaptan grillas, tablas, metadatos y controles sin desborde horizontal a 320 px.
- **Identidad operativa de Elin Rao:** se conserva `character:rao` y el nombre legal; diálogo, cartelas y texto activo usan «Elin» para evitar confusión sonora con Zao.
- **Fallback y detalle de toma:** claqueta técnica neutral registrada para imágenes faltantes/fallidas; editor y player señalizan placeholders. «Detalles de la toma» funciona por clic/tecla `D` y presenta contexto, cámara, cues, takes, revisión y procedencia.
- **GitHub Pages:** repositorio público y Pages habilitado para `https://saabi.github.io/light-delay/`; build con `@sveltejs/adapter-static`, prerender global, fallback `404.html`, `BASE_PATH=/light-delay` y workflow que descarga Git LFS y valida datos, documentación, tipos y pruebas antes de publicar pushes a `master`.
- **Secuencia Zao/Harlan antes del cruce:** escenas 5–8 reescritas con cámara y diálogo coherentes: aviso parcial, jammer visible, corte físico de COM A/B, puntería del láser exterior al corredor futuro, rutas distintas en microgravedad, asesinato/limpieza, hallazgo de Sorell y coartada de Harlan. Sorell queda establecida como testigo con credencial comprometida, no como sospechosa.
- **Animatic principal revisado:** 17 escenas de historia (+ título/créditos), **128** tomas y ~30:50,5. Las escenas 5–8 conservan la secuencia detallada de bloqueo, transmisión, asesinato, hallazgo y coartada; 12 tomas nuevas usan placeholder. No se regeneraron imágenes.
- **Arquitectura mínima de Celestial Ardor:** vestíbulo axial encuadrable desde el puente, acceso de servicio oculto, cilindros central/servicio, distribuidor COM A/B y control físico dedicado del láser incorporados a canon, datos y notas técnicas.
- **Deuda diferida:** `TODO.md` concentra el registro vigente de deuda narrativa, visual y técnica: extractor legacy inseguro, cobertura parcial del esquema, lint/E2E, arte desactualizado, cálculo del enlace láser y revisión editorial de traducciones. El sistema general de notas y el estado estructurado de imágenes ya están implementados.
- **Comparación entre guiones (V1.1):** taxonomía versionada de 13 dimensiones de canon —incluidas cronología y operaciones/gravedad de la Ardor— y 11 eventos, perfiles declarativos en los cuatro scripts y ruta `/compare/[scriptId]?against=<ScriptId>` para canon, eventos, reparto, variantes y funciones. La herramienta no infiere herencia de diálogo ni fusiones/divisiones.
- **Largometraje recuperado:** `script:light-delay-long` registrado como tratamiento de 100 min, 4 actos, 28 escenas y 28 beats, sin cues/shots/takes inventados. Incorpora el canon vigente y conserva procedencia hacia documentos o escenas del corto.
- **Reparto largo:** catorce nombres recuperados y catalogados: Zao, Voss, Harlan, Sorell, Elin, Cael, Keene, Vega, Wei, Hassan, Carvalho, Okoye, Volkov y Tanaka. La revisión autorizada está en `docs/REVISION_LARGOMETRAJE_RECUPERADO.md`.
- **Multi-script / Festival Cut (ADR-0001 Accepted):** festival tiene 9 escenas (A–G + título + créditos) y **71** tomas. Las 29 tomas E–G completan evidencia, override, cuarentena, contacto y cierre con stills reutilizados como placeholders; no se generaron medios.
- **Displays diegéticos:** los planes de generación fijan `diegeticTextLanguage: en` y extraen únicamente la variante inglesa de cues `interface`. La traducción española permanece editorial y una eventual edición visual en español será un derivado, no una interfaz bilingüe.
- **Selector de guion adaptable:** `ScriptSwitcher` permanece visible en el rail de escritorio y dentro de la hoja móvil de `ProjectNav`; Guion/Animatic respetan el cut activo (sessionStorage + URL).
- **Tráiler (1:32,5):** `data/scripts/light-delay-trailer.json` — 9 secuencias, 29 tomas reutilizando frames del main short y 0 sobras de diálogo; regenerable y verificable desde `build:trailer`.
- **Modo película:** chrome alineado al legacy en landscape (`AnimaticPlayer` fullscreen con meta, detalles flotantes y barra inferior) y flujo frame → detalles → controles en portrait.
- **Higgsfield (staging):** `higgsfield-uploads/` incluye Zao, Harlan (hoja v2), Voss y briefs de escena 5; regenerable con `npm run prepare:higgsfield`. Falta verificación externa de que Harlan no colapsa con Voss antes del freeze de prompts.
- **Referencias de escala:** `proportional-reference` por entidad (Proxima, Celestial Ardor) y comparativa común en `art-bible/scale-references/`.
- **Retorno de Modo película:** el enlace a edición restaura la toma activa mediante `?shot=` y centra/enfoca su tarjeta; hay control visible de pantalla completa.
- Guion corto revisado de 17 escenas con objetivo de 30 minutos.
- Lista de momentos clave y versión acotada sincronizadas.
- Biblia de producción y reporte comprensivo actualizados al canon reciente.
- Notas técnicas de continuidad revisadas.
- Biblia visual con personajes, localizaciones, naves y objetos clave.
- Animatic textual de **128** tomas (~30:50,5 de montaje derivado).
- 100 imágenes 1536 × 864 reutilizadas; cartela de título enlazada; 11 tomas nuevas con placeholder (créditos + escenas 5–8); los reemplazos pendientes están registrados en `TODO.md` y en notas de toma.
- Modo Película con subtítulos, controles, timeline y panel de detalles.
- Edición de duraciones con persistencia local y recálculo del total.
- Bootstrap SvelteKit 2 / Svelte 5 en la raíz (TypeScript, lint, Vitest, Playwright).
- Fase 0 de migración (baseline histórico): inventario HTML/assets; 17 escenas / 100 tomas / 100 frames legacy verificados; mapa `static/assets`; stub de sync guion↔animatic.
- Fase 1 (+ extracción inicial, baseline histórico): tipos TypeScript, validadores a mano, loaders/repositorios/selectores, JSON inicial en `data/` (17 escenas / 100 tomas / 98 diálogos ES), `npm run extract:legacy` y `npm run validate:data`.
- Fases 2–6 (aplicación): shell + documentos; copia de assets a `static/assets/`; rutas de arte/entidades/assets; lector de guion; editor de animatic; player a pantalla completa. Medios solo vía `/assets/...`.

## Decisiones anteriores de la continuidad archivada

> Esta lista se conserva como procedencia. No autoriza trabajo nuevo sobre los productos deprecados; cualquier punto aún útil debe reevaluarse al derivar versiones nuevas desde el master.

1. **Duración real.** Los 30:00 son el objetivo; el montaje de datos suma ~30:50,5 (historia + título/créditos). Debe validarse mediante lectura cronometrada y luego con animación/video.
2. **Festival Cut.** Datos con 9 escenas (A–G + título/créditos), guion y animatic y **71** tomas. La asamblea con cartelas suma ~6:14,2; cinco minutos es sólo un orden de magnitud y no un máximo estricto. Faltan lectura/montaje editorial, imágenes canónicas y poblar el array `sequences`. Ver escaleta y `docs/CUIDADOS_NARRATIVOS.md`.
3. **Tráiler.** Versión animatic operativa de **33** tomas (1:42,5): ya oculta identidad del culpable, éxito del envío/recepción y destino de Zao; incluye marca, lema y créditos. Marca y lema ya usan PNG; faltan stills de créditos (ver docs/TITLE_AND_CREDITS.md) y audio.
4. **Cobertura estructural.** Antes de habilitar imágenes deben resolverse por prioridad los placements, bindings y datos de performance que afecten continuidad o producción. Main, Festival y tráiler ya cerraron propósito y framing; la deuda medida restante se concentra en bindings, placements, performance y subcampos avanzados de cámara. El largo no puede figurar como animatic completo mientras no tenga tomas.
5. **Cobertura de Festival y largo.** El largo tiene tratamiento pero todavía no guion dialogado ni animatic. Su escaleta ya incorpora el clímax causal vigente, pero tratamiento, generador, ledger, comparación y producción quedaron expresamente diferidos y no deben figurar como sincronizados. Festival ya cubre A–G con tomas y placements, pero sus stills son provisionales y no autorizan generación hasta aprobar ritmo, performance y freeze visual.
6. **Procedencia completa.** Los prompts exactos, parámetros y referencias de varias imágenes no quedaron incluidos en los manifests actuales.
7. **Especialidades de Volkov y Tanaka.** La fuente recuperada sólo respalda parcialmente la vinculación de Volkov con controles manuales y no define una función estable para Tanaka. No deben completarse por invención.
8. **Retropropagación al corto.** Vega como pista falsa acotada y mayor textura de especialistas son candidatos; requieren decisión narrativa independiente. No retropropagar automáticamente el reparto largo.
9. **Eslogan del tráiler.** `THE MESSAGE ARRIVED BEFORE THEY DID.` funciona como pieza de campaña, pero afirma una llegada y podría debilitar la regla vigente de no confirmar recepción en el tráiler. El PNG existe como candidato, pero no debe incorporarse al cut hasta decidir si “arrived” se interpreta como llegada física de la señal o como recepción confirmada.

## Notas técnicas recientes

- GitHub Pages: build estático con `adapter-static`; `BASE_PATH` permite desarrollo local en `/` y publicación estándar en `/light-delay/`; rutas y medios públicos pasan por helpers de base path. La concurrencia del workflow se separa por referencia.
- Inventario: `docs/MIGRATION_INVENTORY.md`. Sync: `docs/SCRIPT_ANIMATIC_SYNC.md`. Rutas: `docs/ASSET_PATH_MAP.md`.
- `.nvmrc` fija Node 24 LTS. CI conserva LFS/build Pages y ahora comprueba artefactos generados, JSON Schema y ledger causal; lint estricto y E2E siguen pendientes.
- JSON Schema 2020-12 es autoridad runtime para outlines, archivo histórico y datos de producción/continuidad; genera tipos TypeScript. Falta extenderlo a scripts, proyecto, entidades, assets y documentos para retirar la validación manual duplicada.
- Política de idioma: español = fuente de verdad. Detalle en `AGENTS.md`.
- Política narrativa: evitar exposición forzada; revelar por pensamiento/decisión del personaje (véase `AGENTS.md`).
- Haz de Zao: `docs/SIGNAL_BEAM_REQUIREMENTS.md` conserva sólo una aproximación visual; el presupuesto óptico exacto permanece en `TODO.md`.
- Assets: 143 imágenes registradas en `static/assets/` (100 frames legacy, 1 frame nuevo escena 5, 3 cartelas de título, 38 referencias y 1 placeholder técnico). `legacy-site/assets/` permanece intacto como referencia.
- Documentos prose: cinco páginas legacy extraídas y traducidas en `data/documents.json`; canon y tres referencias históricas/editoriales también exponen variante inglesa; validación exige paridad de bloques ES/EN y cobertura del ledger de migración.
- Estado editorial: la narrativa maestra es la autoridad WIP y conserva su `ScriptFile` stub. El nuevo Festival ya posee guion fuente en inglés y blueprint, con español `not_started` y sin tomas, takes ni animatic; las otras cuatro entradas siguen deprecadas.
- Calidad del último pase validado: `validate:data` (incluido JSON Schema), `validate:docs`, `validate:translations`, `generated:check`, ledger causal, `svelte-check`, 86 pruebas unitarias, build estático y 18 pruebas Playwright. E2E y lint estricto continúan fuera de CI; Vite mantiene el warning conocido del chunk de repositorios >500 kB.
- Validación pendiente: los 143 assets registrados existen y el grafo actual no mostró referencias rotas en la auditoría puntual, pero el validador de CI no comprueba todavía paths físicos ni toda la integridad padre/hijo.

## Próxima fase técnica y editorial

- Completar la escaleta maestra y revisar el inventario `review_required` antes de autorizar cualquier derivado o producción visual.
- Mantener los productos anteriores disponibles sólo para rescate hasta cerrar las cuatro compuertas de eliminación.
- Retirar o aislar `npm run extract:legacy` antes de volver a presentarlo como comando seguro y resolver la autoridad ejecutable del esquema.
- Migrar CI a Node LTS, normalizar formato y añadir lint + Playwright al gate de Pages.
- Separar en el futuro el motor genérico de autoría/consulta y el paquete de contenido de Light Delay antes de ofrecer una plataforma reutilizable con licencia propia.
- Definir versiones nuevas —incluido cualquier largometraje— sólo como derivados explícitos del master terminado; no continuar el tratamiento anterior.
- Evaluar material rescatable sin retropropagar automáticamente decisiones entre productos.
- Refinar títulos de escena animatic vs encabezados de guion (véase `SCRIPT_ANIMATIC_SYNC.md`).
- Pruebas de regresión ampliadas del modo Película (fullscreen, subtítulos, restauración de toma y controles por teclado).

## Criterio de migración terminada

La migración no está completa hasta que todo contenido accesible desde `legacy-site/index.html`, todas las imágenes y todas las funciones del animatic estén disponibles en la aplicación Svelte sin depender de datos incrustados en HTML.
