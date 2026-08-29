# Estado del proyecto

Fecha de corte: 2026-08-29.

## Completado

- **Escaleta (outline):** contrato + UI `/outline/[scriptId]` (agrupa por escena, i18n de diálogo); festival con JSON + EN inline; `report:outline-missing` / `report:outline-gaps`; guía en `docs/GUIA_ESCALETA.md` y regla en `AGENTS.md`.
- **Guion corto — ritmo, causalidad y láser:** 17 escenas, 124 tomas y 30:39,5 de montaje derivado; ocho tripulantes de misión declarados. Ver `docs/EDICION_ESCENA_LASER_Y_RITMO_DIALOGO.md` y `docs/CONTINUIDAD_CAUSAL_GUIONES.md`.
- **Informes editoriales en web y CLI:** rutas dinámicas `/reports/` y exportación `npm run report:all` (12 informes × 4 guiones) desde un único `report-runner.mjs` compartido.
- **Deuda visual del animatic:** inventario provisional de 141 candidatos `needs_regeneration` (112 main + 29 tráiler) y 12 placeholders main `needs_replacement`. La producción visual queda bloqueada por guion hasta cerrar causalidad y cobertura; informes en `npm run report:editorial`.
- **Estimación de diálogo hablado:** montaje vs tiempo de diálogo estimado (WPM) en guion, animatic y player; flags editoriales por toma (>2 hablantes, fuera de cámara); `npm run report:dialogue-timing` genera MD+JSON en `reports/dialogue-timing/`.
- **Bloqueo 3D Proxima/Ardor:** `blender/light-delay-blockout.blend` con siluetas exteriores; hábitats de Proxima como rueda radial; checklist y deuda de detalle en docs técnicos; hoja de ruta de producción y mapa de tomas exteriores/animación.
- **Carrusel de assets en entidades:** detalle de personaje/lugar/vehículo/objeto muestra las imágenes raster de `referenceAssetIds` en un carrusel; Proxima y Celestial Ardor incluyen sheet, proportional, stills de bloqueo y escala común.
- **Miniaturas de catálogo:** WebP derivados en `static/assets/_thumbs/` (`thumbs:generate` / `thumbs:sync`); las tarjetas de arte/entidades usan la miniatura; el detalle sigue con el original.
- **Carrusel automático en tarjetas:** si una entidad tiene varias referencias raster, la tarjeta rota miniaturas sin controles; el detalle mantiene navegación manual.
- **Documentación reconciliada:** fuentes activas saneadas contra los JSON y el estado 3D vigente; 17 escenas, 124 tomas/takes, 100 frames legacy y 132 imágenes quedan diferenciados.
- **Sitio público bilingüe y presentación:** inglés por defecto en `/`, español en `/es/`, landing pública, archivo editorial en `/project`, selector de idioma con rutas recargables, Paraglide JS, SEO canónico con `hreflang`, Open Graph, sitemap, manifest, favicon y marca propia. Las rutas EN/ES se prerenderizan también con `BASE_PATH=/light-delay`.
- **Copy de portada revisado:** la landing identifica la obra como ciencia ficción dura, simplifica la premisa de Zao sin cambiar el canon, usa inglés estadounidense coherente con `en_US` y alinea numerales, nombre del corto y CTA del archivo en EN/ES.
- **Generación i18n reproducible:** `npm run check` genera los módulos tipados de Paraglide antes de `svelte-check`; el compilador directo y el plugin de Vite comparten opciones, incluido el base path de Pages. Una instalación limpia ya no depende de artefactos ignorados del entorno local.
- **Texto legacy portado y traducido:** las cinco páginas prose, los índices de arte/personajes y la portada legacy tienen equivalentes basados en datos. Notas, biblia, reporte, momentos y estructura de 30 minutos se migraron con jerarquía, listas, tablas y beats; la copia española se reconcilió con el canon vigente y la inglesa conserva la misma topología. `data/legacy-text-migration.json` funciona como ledger verificable.
- **Contenido narrativo bilingüe:** los cuatro scripts, diálogos, subtítulos derivados, escenas, beats, tomas, assets, taxonomía de comparación, funciones, variantes y outlines llevan inglés **inline** (`LocalizedString` / `variants.en`); `npm run validate:translations` exige `es`+`en` en esos campos. El inglés de historia está en `draft`; el español conserva autoridad. La galería de entidades sigue con overlay `entities.en.json`. Paraglide cubre solo el chrome de UI.
- **Navegación responsive:** todas las rutas salvo Modo película usan header global compacto + rail persistente en escritorio y barra inferior + hoja modal en móvil. El umbral `calc(26.88em + 52.8ch)` responde a capacidad tipográfica; ambos modos enlazan el repositorio de GitHub.
- **Player adaptable:** landscape conserva la composición inmersiva; portrait ordena frame, detalles desplegables y controles persistentes, con continuidad de toma, progreso y panel al cambiar orientación.
- **Auditoría móvil:** inicio, guion, animatic, arte, comparación, documentos, entidades y assets adaptan grillas, tablas, metadatos y controles sin desborde horizontal a 320 px.
- **Identidad operativa de Elin Rao:** se conserva `character:rao` y el nombre legal; diálogo, cartelas y texto activo usan «Elin» para evitar confusión sonora con Zao.
- **Fallback y detalle de toma:** claqueta técnica neutral registrada para imágenes faltantes/fallidas; editor y player señalizan placeholders. «Detalles de la toma» funciona por clic/tecla `D` y presenta contexto, cámara, cues, takes, revisión y procedencia.
- **GitHub Pages:** repositorio público y Pages habilitado para `https://saabi.github.io/light-delay/`; build con `@sveltejs/adapter-static`, prerender global, fallback `404.html`, `BASE_PATH=/light-delay` y workflow que descarga Git LFS y valida datos, documentación, tipos y pruebas antes de publicar pushes a `master`.
- **Secuencia Zao/Harlan antes del cruce:** escenas 5–8 reescritas con cámara y diálogo coherentes: aviso parcial, jammer visible, corte físico de COM A/B, puntería del láser exterior al corredor futuro, rutas distintas en microgravedad, asesinato/limpieza, hallazgo de Sorell y coartada de Harlan. Sorell queda establecida como testigo con credencial comprometida, no como sospechosa.
- **Animatic principal revisado:** 17 escenas, 124 tomas y 30:39,5. Las escenas 5–8 conservan la secuencia detallada de bloqueo, transmisión, asesinato, hallazgo y coartada; 12 tomas nuevas usan placeholder. No se regeneraron imágenes.
- **Arquitectura mínima de Celestial Ardor:** vestíbulo axial encuadrable desde el puente, acceso de servicio oculto, cilindros central/servicio, distribuidor COM A/B y control físico dedicado del láser incorporados a canon, datos y notas técnicas.
- **Deuda diferida:** `TODO.md` concentra el registro vigente de deuda narrativa, visual y técnica: extractor legacy inseguro, autoridad/validación de esquema, Node/CI, arte desactualizado, cálculo del enlace láser, revisión editorial de traducciones y futuro sistema general de notas editoriales. El estado estructurado de imágenes y las validaciones documental/i18n ya están implementados.
- **Comparación entre guiones (V1.1):** taxonomía versionada de 13 dimensiones de canon —incluidas cronología y operaciones/gravedad de la Ardor— y 11 eventos, perfiles declarativos en los cuatro scripts y ruta `/compare/[scriptId]?against=<ScriptId>` para canon, eventos, reparto, variantes y funciones. La herramienta no infiere herencia de diálogo ni fusiones/divisiones.
- **Largometraje recuperado:** `script:light-delay-long` registrado como tratamiento de 100 min, 4 actos, 28 escenas y 28 beats, sin cues/shots/takes inventados. Incorpora el canon vigente y conserva procedencia hacia documentos o escenas del corto.
- **Reparto largo:** catorce nombres recuperados y catalogados: Zao, Voss, Harlan, Sorell, Elin, Cael, Keene, Vega, Wei, Hassan, Carvalho, Okoye, Volkov y Tanaka. La revisión autorizada está en `docs/REVISION_LARGOMETRAJE_RECUPERADO.md`.
- **Multi-script / Festival Cut (ADR-0001 Accepted):** registro en `project.json`, IDs `character:…` / `main:…` / `festival:…`, scripts en `data/scripts/`, funciones narrativas, festival con 7 escenas y **35 tomas** (A–D; E–G pendientes), rutas `/script/[scriptId]` y `/animatic/[scriptId]`, overlay de animatic acotado por script+versión.
- **Selector de guion adaptable:** `ScriptSwitcher` permanece visible en el rail de escritorio y dentro de la hoja móvil de `ProjectNav`; Guion/Animatic respetan el cut activo (sessionStorage + URL).
- **Tráiler (~1:30):** `data/scripts/light-delay-trailer.json` — 9 secuencias del brief, 29 tomas reutilizando frames del main short; regenerable con `npm run build:trailer`.
- **Modo película:** chrome alineado al legacy en landscape (`AnimaticPlayer` fullscreen con meta, detalles flotantes y barra inferior) y flujo frame → detalles → controles en portrait.
- **Higgsfield (staging):** el staging actual todavía excluye Harlan y Elin; el generador ya habilita la sheet legal de Elin Rao con slug estable `rao`, mientras Harlan sigue bloqueado por similitud visual con Voss. No se refrescó el staging ni se generó arte en este pase.
- **Referencias de escala:** `proportional-reference` por entidad (Proxima, Celestial Ardor) y comparativa común en `art-bible/scale-references/`.
- **Retorno de Modo película:** el enlace a edición restaura la toma activa mediante `?shot=` y centra/enfoca su tarjeta; hay control visible de pantalla completa.
- Guion corto revisado de 17 escenas con objetivo de 30 minutos.
- Lista de momentos clave y versión acotada sincronizadas.
- Biblia de producción y reporte comprensivo actualizados al canon reciente.
- Notas técnicas de continuidad revisadas.
- Biblia visual con personajes, localizaciones, naves y objetos clave.
- Animatic textual de 124 tomas (30:39,5 de montaje derivado).
- 100 imágenes 1536 × 864 reutilizadas; 12 tomas nuevas con placeholder; los reemplazos pendientes están registrados en `TODO.md` y en notas de toma.
- Modo Película con subtítulos, controles, timeline y panel de detalles.
- Edición de duraciones con persistencia local y recálculo del total.
- Bootstrap SvelteKit 2 / Svelte 5 en la raíz (TypeScript, lint, Vitest, Playwright).
- Fase 0 de migración (baseline histórico): inventario HTML/assets; 17 escenas / 100 tomas / 100 frames legacy verificados; mapa `static/assets`; stub de sync guion↔animatic.
- Fase 1 (+ extracción inicial, baseline histórico): tipos TypeScript, validadores a mano, loaders/repositorios/selectores, JSON inicial en `data/` (17 escenas / 100 tomas / 98 diálogos ES), `npm run extract:legacy` y `npm run validate:data`.
- Fases 2–6 (aplicación): shell + documentos; copia de assets a `static/assets/`; rutas de arte/entidades/assets; lector de guion; editor de animatic; player a pantalla completa. Medios solo vía `/assets/...`.

## Decisiones abiertas

1. **Duración real.** Los 30:00 son el objetivo; el montaje de datos suma 30:39,5. Debe validarse mediante lectura cronometrada y luego con animación/video.
2. **Festival Cut.** Datos con 7 escenas y **35 tomas** (A–D construidas); faltan E–G, imágenes canónicas y el array `sequences` sigue vacío. Ver escaleta y `docs/CUIDADOS_NARRATIVOS.md`.
3. **Tráiler.** Versión animatic operativa reutilizando frames del main; falta auditoría causal final, afinado de ritmo, posibles stills exclusivos de título y audio.
4. **Cobertura estructural.** Antes de habilitar imágenes deben resolverse por prioridad los placements, propósitos, framing y bindings que afecten continuidad o producción. Festival y largo no pueden figurar como completos mientras no tengan tomas.
5. **Escaletas por cut.** Festival tiene JSON con EN inline; faltan main/trailer/long (`report:outline-missing`). Sembrar desde continuidad causal y `eventCoverage` sin inventar cobertura ausente; seguir `docs/GUIA_ESCALETA.md`.
6. **Procedencia completa.** Los prompts exactos, parámetros y referencias de varias imágenes no quedaron incluidos en los manifests actuales.
7. **Especialidades de Volkov y Tanaka.** La fuente recuperada sólo respalda parcialmente la vinculación de Volkov con controles manuales y no define una función estable para Tanaka. No deben completarse por invención.
8. **Retropropagación al corto.** Vega como pista falsa acotada y mayor textura de especialistas son candidatos; requieren decisión narrativa independiente. No retropropagar automáticamente el reparto largo.

## Notas técnicas recientes

- GitHub Pages: build estático con `adapter-static`; `BASE_PATH` permite desarrollo local en `/` y publicación estándar en `/light-delay/`; rutas y medios públicos pasan por helpers de base path. La concurrencia del workflow se separa por referencia.
- Inventario: `docs/MIGRATION_INVENTORY.md`. Sync: `docs/SCRIPT_ANIMATIC_SYNC.md`. Rutas: `docs/ASSET_PATH_MAP.md`.
- Bootstrap SvelteKit validado. `.nvmrc` aún fija Node 25, ya fuera de soporte; migrar a una línea LTS forma parte de la deuda prioritaria.
- Autoridad de esquema documentada actualmente: tipos TypeScript de `JSON_FORMAT.md` + addendum i18n (sin Zod). Falta convertirla en autoridad runtime única y eliminar la deriva con el validador JavaScript.
- Política de idioma: español = fuente de verdad. Detalle en `AGENTS.md`.
- Política narrativa: evitar exposición forzada; revelar por pensamiento/decisión del personaje (véase `AGENTS.md`).
- Haz de Zao: `docs/SIGNAL_BEAM_REQUIREMENTS.md` conserva sólo una aproximación visual; el presupuesto óptico exacto permanece en `TODO.md`.
- Assets: 132 imágenes registradas en `static/assets/` (100 frames legacy, 31 referencias y 1 placeholder técnico). `legacy-site/assets/` permanece intacto como referencia.
- Documentos prose: cinco páginas legacy extraídas y traducidas en `data/documents.json`; canon y tres referencias históricas/editoriales también exponen variante inglesa; validación exige paridad de bloques ES/EN y cobertura del ledger de migración.
- Estado editorial: las traducciones inglesas permanecen en `draft`; el canon estructurado es todavía un `stub`; los cuatro scripts registrados continúan en `draft`.
- Calidad de este pase: `validate:data`, `validate:docs` y `validate:translations` pasan; Svelte/TypeScript informa 0 errores y 0 warnings; 66 pruebas unitarias pasan y el build estático completa. E2E no se ejecutó. `npm run lint` sigue siendo un gate no estricto y enumera 34 archivos preexistentes fuera de formato; el workflow de Pages todavía no ejecuta lint ni E2E.
- Validación pendiente: los 132 assets registrados existen y el grafo actual no mostró referencias rotas en la auditoría puntual, pero el validador de CI no comprueba todavía paths físicos ni toda la integridad padre/hijo.

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
