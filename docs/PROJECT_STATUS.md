# Estado del proyecto

## 2026-08-31 — Referencia visual de Harlan

- Descripción canónica bilingüe ampliada para distinguir a Harlan de Voss en silueta, rostro, vestuario y actitud.
- Hoja regenerada en `static/assets/characters/harlan/model-sheet-v2.png` y registrada como reemplazo con procedencia.
- El staging de Higgsfield incluye Zao, Harlan (v2) y briefs de escena 5; falta confirmar externamente que Harlan no colapsa con Voss antes del freeze de prompts.

## 2026-08-31 — Referencias terrestres separadas

- La hoja combinada de manifestantes se conserva para multitudes, pero Aqueronte y partidarios del contacto tienen ahora hojas independientes y descripciones bilingües.
- La periodista tiene una hoja neutral para posibles insertos en cámara; sus tomas de voz en off no se alteran.
- Catálogo y staging actualizados: 142 assets registrados y 34 copias preparadas para Higgsfield.

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
- **Escaletas causales por cut:** los cuatro scripts tienen sinopsis y una capa `story` legible (12 main, 7 tráiler, 12 largo, 15 festival) sobre el detalle editorial existente (17/9/28/44). Los hitos cuentan una historia continua con los detalles cerrados; el detalle conserva IDs históricos y cobertura separada para tratamiento, guion y animatic. Ya no se regeneran desde resúmenes de escena.
- **Lectura aislada y protección del tráiler:** `report:outline-story` exporta sólo la columna vertebral narrativa para revisión humana; la falta de enlaces causales en `story` es error. `check:trailer-spoilers` y su prueba de regresión impiden identificar al culpable o confirmar envío, recepción, muerte, contención de la amenaza o resultado del saludo en el avance.
- **Fatalidad fuera de campo diferenciada:** main, festival y largo confirman la muerte de Zao mediante golpe seco, cese de forcejeo/respiración y negro sostenido. El tráiler conserva el mismo corte previo al ataque, pero sale pronto del negro con música continua y deja inciertos tanto la muerte como el envío.
- **Razonamiento crítico restaurado:** main, festival y largo explican en escaleta por qué Zao descarta Tierra (doble retardo hasta la Ardor) y Proxima (oclusión de Júpiter L2–L1), y por qué sólo sirve apuntar al corredor futuro. También conservan que Harlan supone erróneamente un envío a la Tierra, se tranquiliza, lamenta la suerte de Zao y suspira antes de matarla.
- **Llegada, orden y carrera verificables:** Harlan asciende por servicio y abre la escotilla al nivel del puente justo durante la llamada; sólo reacciona ante «la verdadera firma apunta a—». Voss sopesa la implicación de Sorell, la envía a verificar y luego exige que busque a Harlan y no entre sola; la demora resultante y las rutas servicio/circulación cotidiana explican quién llega primero.
- **Cadena probatoria y cierre sincronizados:** main y Festival implementan token personal de Zao, snapshot del manifiesto firmado por hardware, auditoría independiente de Elin, contención física de Okoye con Voss en el puente y envío final del informe terrestre sin respuesta. La escaleta larga conserva esa intención, pero su implementación quedó diferida. Festival implementa E–G tanto en cues como en 29 tomas nuevas.
- **Informes editoriales en web y CLI:** rutas dinámicas `/reports/` y exportación `npm run report:all` (12 informes × 4 guiones) desde un único `report-runner.mjs` compartido.
- **Deuda visual del animatic:** inventario provisional de 208 candidatos `needs_regeneration` (112 main + 67 Festival + 29 tráiler) y 11 placeholders main `needs_replacement` (créditos + escenas 5–8). La producción visual queda bloqueada hasta aprobar ritmo, encuadres, referencias y freeze por cut; informes en `npm run report:editorial`.
- **Estimación de diálogo hablado:** montaje vs tiempo de diálogo estimado (WPM) en guion, animatic y player; flags editoriales por toma (>2 hablantes, fuera de cámara); `npm run report:dialogue-timing` genera MD+JSON en `reports/dialogue-timing/`.
- **Bloqueo 3D Proxima/Ardor:** `blender/light-delay-blockout.blend` con siluetas exteriores; hábitats de Proxima como rueda radial; checklist y deuda de detalle en docs técnicos; hoja de ruta de producción y mapa de tomas exteriores/animación.
- **Carrusel de assets en entidades:** detalle de personaje/lugar/vehículo/objeto muestra las imágenes raster de `referenceAssetIds` en un carrusel; Proxima y Celestial Ardor incluyen sheet, proportional, stills de bloqueo y escala común.
- **Miniaturas de catálogo:** WebP derivados en `static/assets/_thumbs/` (`thumbs:generate` / `thumbs:sync`); las tarjetas de arte/entidades usan la miniatura; el detalle sigue con el original.
- **Carrusel automático en tarjetas:** si una entidad tiene varias referencias raster, la tarjeta rota miniaturas sin controles; el detalle mantiene navegación manual.
- **Documentación reconciliada:** fuentes activas saneadas contra los JSON y el estado 3D vigente; 17 escenas de historia (+ título/créditos), 128 tomas/takes, 100 frames legacy y 142 imágenes quedan diferenciados.
- **Sitio público bilingüe y presentación:** inglés por defecto en `/`, español en `/es/`, landing pública, archivo editorial en `/project`, selector de idioma con rutas recargables, Paraglide JS, SEO canónico con `hreflang`, Open Graph, sitemap, manifest, favicon y marca propia. Las rutas EN/ES se prerenderizan también con `BASE_PATH=/light-delay`.
- **Copy de portada revisado:** la landing identifica la obra como ciencia ficción dura, simplifica la premisa de Zao sin cambiar el canon, usa inglés estadounidense coherente con `en_US` y alinea numerales, nombre del corto y CTA del archivo en EN/ES.
- **Generación i18n reproducible:** `npm run check` genera los módulos tipados de Paraglide antes de `svelte-check`; el compilador directo y el plugin de Vite comparten opciones, incluido el base path de Pages. Una instalación limpia ya no depende de artefactos ignorados del entorno local.
- **Texto legacy portado y traducido:** las cinco páginas prose, los índices de arte/personajes y la portada legacy tienen equivalentes basados en datos. Notas, biblia, reporte, momentos y estructura de 30 minutos se migraron con jerarquía, listas, tablas y beats; la copia española se reconcilió con el canon vigente y la inglesa conserva la misma topología. `data/legacy-text-migration.json` funciona como ledger verificable.
- **Contenido narrativo bilingüe:** guiones, diálogos, subtítulos derivados, escenas, beats, tomas, assets, entidades, taxonomía, funciones, variantes y outlines llevan inglés **inline** (`LocalizedString` / `variants.en`). Los overlays `public.en.json` y `entities.en.json` están retirados/vacíos. `validate:translations` exige `es`+`en`; el inglés sigue en `draft` y el español conserva autoridad. Paraglide cubre sólo el chrome de UI.
- **Arquitectura de producción sin generación:** JSON Schema ejecutable, planes provider-neutral por cut, segmentación a 8 s, presupuesto de adjuntos, artefactos still/first/last/audio, snapshots Seedance/Higgsfield y compilador que rechaza prompts bloqueados. Los prompts reales permanecen nulos hasta aprobación editorial; no se generaron medios.
- **Preparación de prompts del Festival:** las 67 tomas A–G declaran propósito, bindings de entidades y contexto físico. A–D quedó reconciliado con Ardor atracada, microgravedad, transmisión óptica, empuje posterior y displays en inglés. El informe ya sólo bloquea este cut por freeze editorial y muestras de voz ausentes.
- **Ledger causal ejecutable:** main y Festival validan una cadena de 13 pasos y 13 acciones con hechos previos, conocimiento por actor y referencias a escaleta/tomas. Voss envía la búsqueda por demora y negación, no por conocer aún la muerte. Tráiler y largo permanecen `not_applicable` sin falso verde porque no exponen una cadena causal completa implementada. `report:causal-validity` corre en CI.
- **Notas humanas:** contrato ampliado y `docs/PENDING_AUTHOR_NOTES.md` generado desde los JSON (`notes:build` / `notes:check`); el informe actual reúne 167 notas abiertas por prioridad y ruta exacta.
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

## Decisiones abiertas

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
- Assets: 142 imágenes registradas en `static/assets/` (100 frames legacy, 1 frame nuevo escena 5, 3 cartelas de título, 37 referencias y 1 placeholder técnico). `legacy-site/assets/` permanece intacto como referencia.
- Documentos prose: cinco páginas legacy extraídas y traducidas en `data/documents.json`; canon y tres referencias históricas/editoriales también exponen variante inglesa; validación exige paridad de bloques ES/EN y cobertura del ledger de migración.
- Estado editorial: las traducciones inglesas permanecen en `draft`; el canon estructurado es todavía un `stub`; los cuatro scripts registrados continúan en `draft`.
- Calidad del último pase validado: `validate:data` (incluido JSON Schema), `validate:docs`, `validate:translations`, `generated:check`, ledger causal, `svelte-check`, pruebas unitarias y build estático. E2E y lint estricto continúan fuera de CI; Vite mantiene el warning conocido del chunk de repositorios >500 kB.
- Validación pendiente: los 142 assets registrados existen y el grafo actual no mostró referencias rotas en la auditoría puntual, pero el validador de CI no comprueba todavía paths físicos ni toda la integridad padre/hijo.

## Próxima fase técnica

- Retirar o aislar `npm run extract:legacy` antes de volver a presentarlo como comando seguro y resolver la autoridad ejecutable del esquema.
- Migrar CI a Node LTS, normalizar formato y añadir lint + Playwright al gate de Pages.
- Separar en el futuro el motor genérico de autoría/consulta y el paquete de contenido de Light Delay antes de ofrecer una plataforma reutilizable con licencia propia.
- Fase 7: desarrollar el tratamiento largo sólo tras revisión editorial y limpiar duplicados binarios tras revisar paridad.
- Revisar los tres candidatos de retropropagación sin sincronizarlos automáticamente entre scripts.
- Refinar títulos de escena animatic vs encabezados de guion (véase `SCRIPT_ANIMATIC_SYNC.md`).
- Pruebas de regresión ampliadas del modo Película (fullscreen, subtítulos, restauración de toma y controles por teclado).

## Criterio de migración terminada

La migración no está completa hasta que todo contenido accesible desde `legacy-site/index.html`, todas las imágenes y todas las funciones del animatic estén disponibles en la aplicación Svelte sin depender de datos incrustados en HTML.
