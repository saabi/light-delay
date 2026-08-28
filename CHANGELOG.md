# Changelog

## 2026-08-28 — Saneamiento y validación documental

- Reconciliados los documentos activos con el estado estructurado vigente: 17 escenas, 112 tomas/takes, 100 frames legacy y 132 imágenes registradas.
- Actualizados el flujo de trabajo, el ADR multi-script, la procedencia de assets y el mapa de animación exterior; las cifras de 100 tomas se conservan únicamente como baseline histórico explícito.
- Añadido `npm run validate:docs` al gate de Pages para comprobar cifras derivadas, enlaces locales y avisos históricos; retirados el snapshot temporal de deuda y el brief ya ejecutado de portada.

## 2026-08-28 — Carrusel automático en tarjetas

- Las tarjetas de arte/entidades con varias miniaturas usan `ImageCarousel` en modo `auto` (sin controles, rotación periódica, pausa al hover y con `prefers-reduced-motion`).
- El detalle de entidad conserva el carrusel manual con controles.

## 2026-08-28 — Miniaturas de assets

- Pipeline Sharp: `npm run thumbs:generate` / `thumbs:sync` escribe WebP (máx. 480 px) en `static/assets/_thumbs/` con manifiesto de procedencia.
- Helper `thumbnailPathForAsset`; galerías de arte y listados de entidad cargan miniaturas; detalle de entidad y asset siguen a resolución completa.

## 2026-08-28 — Carrusel de imágenes en entidades

- Nuevo `ImageCarousel` en detalle de entidad: navega hojas, diagramas y renders vinculados vía `referenceAssetIds`.
- Proxima Station y Celestial Ardor enlazan sheet, proportional PNG, stills de bloqueo (atraque / Júpiter) y la comparativa de escala común.
- Cadenas Paraglide ES/EN para controles y etiquetas del carrusel.

## 2026-08-28 — Bloqueo 3D y plan de exteriores

- Añadidos checklists de modelado Blender a `CELESTIAL_ARDOR.md` y `PROXIMA_STATION.md` (hábitats como rueda radial, espina estratificada, casco/motor/radiadores de la Ardor).
- Nuevos documentos de planificación: `EXTERNAL_SCENES_AND_ANIMATION.md` y `PRODUCTION_ROADMAP.md`.
- Archivo de bloqueo `blender/light-delay-blockout.blend` y still de referencia `proxima-with-ardor-berthed.png`.

## 2026-08-26 — Ajustes de copy de portada

- Revisados en español e inglés el eyebrow, la síntesis de la historia, el conteo/nombre del corto y el CTA del archivo; el inglés adopta además `traveling` según el locale `en_US`.
- Conservados sin cambios los enlaces, metadatos, imágenes, markup y el resto del contenido de la landing; ampliadas las regresiones E2E para verificar los textos equivalentes de ambos idiomas.

## 2026-08-26 — Auditoría y consolidación de deuda

- Ampliado `TODO.md` con deuda antes no registrada: extractor legacy destructivo, deriva entre contrato y JSON, validación incompleta, Node 25 fuera de soporte, lint/E2E ausentes del gate, madurez editorial, medios, regresiones y duplicados binarios.
- Corregida la autoridad documental: `data/scripts/light-delay-main-short.json` es la fuente estructurada vigente; los HTML legacy quedan como procedencia y regresión, no como autoridad paralela.
- Actualizados conteos y estado del Festival Cut en el plan de producción y `PROJECT_STATUS.md`; documentados los estados `draft` de scripts/traducciones y las limitaciones actuales de CI.
- Marcados `SVELTEKIT_SETUP.md` y `MIGRATION_PLAN.md` como referencias históricas, y añadidas advertencias explícitas a las dos fuentes antiguas de largometraje para impedir que sus mecánicas FTL vuelvan al canon.
- Actualizado el inventario de procedencia a 130 imágenes y cuantificado el faltante de metadatos; sincronizado el brief del tráiler con el láser exterior estándar de la Ardor.

## 2026-08-26 — Sitio bilingüe, landing pública y migración prose completa

- Incorporado Paraglide JS con inglés por defecto y rutas españolas bajo `/es/`; navegación, lector de guion, animatic, detalle técnico, comparador, documentos, arte y entidades responden al locale sin cambiar el español como autoridad editorial.
- Reemplazado el dashboard inicial por una landing pública sin spoilers y trasladado el archivo editorial a `/project`; añadidos logotipo, isotipo, favicon, manifest, tarjeta social, metadatos canónicos, `hreflang`, Open Graph y sitemap bilingüe.
- Portadas y traducidas las cinco páginas prose del legacy —notas, biblia, reporte, momentos y estructura— preservando headings, listas, tablas y beats. La versión española fue reconciliada con el canon actual y el inglés se registra como traducción en revisión.
- Añadidos overlays ingleses completos para las galerías de personajes, lugares, objetos, vehículos y facciones, más un ledger de migración que permite validar que toda página enlazada desde el índice legacy tenga destino actual.
- Ampliados los contratos de documentos con `LocalizedValue`, procedencia y estado de traducción; `npm run port:legacy-text` recompone la migración y `validate:data` comprueba paridad ES/EN.
- El build de marca genera PNG derivados desde SVG con Sharp; el build estático se verificó con `BASE_PATH=/light-delay`, incluidas rutas profundas bajo `/es/`.
- Corregida la instalación limpia de CI: `npm run check` compila primero los módulos generados de Paraglide y comparte su configuración con Vite, sin depender de archivos residuales de un build local anterior.
- El guion, diálogo, subtítulos derivados y descripciones narrativas de toma permanecen en español y quedan explícitamente diferidos a una fase editorial posterior.

## 2026-08-26 — Navegación y diseño responsive

- Corregido el shell responsive: escritorio recupera header global compacto + rail persistente, mientras móvil usa una barra inferior con marca, GitHub y hamburguesa que abre una hoja modal desde abajo.
- El cambio de layout se decide por capacidad tipográfica mediante `calc(26.88em + 52.8ch)`; el cuerpo usa `1rem` para respetar tamaño de texto, zoom y preferencias de accesibilidad sin incorporar un sensor JavaScript.
- El player conserva su presentación inmersiva en landscape; en portrait ordena frame, detalles de toma desplegables y controles persistentes, sin perder transporte, timeline ni retorno a edición.
- Auditadas las rutas de inicio, guion, animatic, arte, comparación, documentos, entidades y assets para evitar desborde horizontal y adaptar grillas, tablas, metadatos y controles a pantallas estrechas.
- Ampliadas las regresiones E2E para rail de escritorio, hoja inferior móvil, breakpoint tipográfico, viewport de 320 px, composición portrait del player y cambios de orientación sin perder toma, progreso ni estado del panel.

## 2026-08-26 — Placeholder y detalles editoriales del animatic

- Generada y registrada una claqueta técnica neutral 16:9 para referencias de imagen ausentes o fallos de carga, sin reemplazar ningún frame existente.
- Añadido estado editorial estructurado a `Asset` y `Take`; las 33 tomas provisionales de escenas 5–8 indican motivo, explicación, brief y toma de origen. Los reusos intencionales del tráiler permanecen sin marca.
- Editor y Modo película comparten resolución de medios: los frames reutilizados muestran «PLACEHOLDER» y los faltantes usan «IMAGEN PENDIENTE» sobre la claqueta.
- Reparado «Detalles de la toma» mediante un panel controlado y accesible, accionable por clic o con `D`, con información narrativa, técnica, temporal, editorial y de procedencia.
- Ampliadas validaciones y regresiones unitarias/E2E para estados visuales, fallback, navegación y panel móvil.

## 2026-08-26 — Preparación para despliegue estático en GitHub Pages

- Añadido `@sveltejs/adapter-static`, prerender global y fallback `404.html` para generar un sitio completamente estático.
- La configuración acepta `BASE_PATH`; el workflow de Pages compila con `/light-delay` mientras el desarrollo local permanece en `/`.
- Navegación, selector de scripts, comparación editorial prerenderizada, índices de entidades, páginas de assets y las 112 tomas/100 frames del animatic resuelven enlaces y medios mediante la base de SvelteKit; los IDs namespaced usan segmentos portables `:` → `~`.
- Nuevo workflow `.github/workflows/pages.yml`: instala con `npm ci`, valida datos, ejecuta `svelte-check` y Vitest, compila, sube `build/` y despliega a Pages en pushes a `master`; los pull requests sólo validan el build.
- La concurrencia del workflow queda aislada por referencia para que un PR no cancele un despliegue de `master`.
- El checkout de Pages descarga Git LFS para publicar las imágenes reales en lugar de sus archivos puntero.
- Eliminada la dependencia ya innecesaria `@sveltejs/adapter-auto`; `BASE_PATH` rechaza valores ambiguos con barra final.
- README y avisos de derechos actualizados para el sitio público `https://saabi.github.io/light-delay/`: la publicación no concede derechos sobre historia, canon o assets, y la plataforma reutilizable se mantiene como objetivo futuro aún no licenciado.

## 2026-08-26 — Advertencia de Zao, comunicaciones y arquitectura de Ardor

- Reescritas las escenas 5–8 del corto: Harlan activa el jammer al oír que la firma de Sorell parece falsa, corta COM A/B desde servicio y usa los dos recorridos axiales para construir su coartada.
- Zao comprueba wireless y cable, descarta Tierra/Proxima y apunta el láser exterior estándar a la posición futura de la nave mediante divergencia + raster; la decisión se cuenta en acción e interfaz, sin exposición forzada.
- Sorell presencia el aviso desde el puente, encuentra a Zao sola y queda como testigo con credencial comprometida, no como sospechosa; Okoye acompaña a Harlan por orden de Voss.
- Animatic principal ampliado de 100 a 112 tomas manteniendo 30:00 y reutilizando los 100 frames existentes; no se generaron imágenes. Las 33 tomas afectadas llevan notas de reemplazo provisional.
- Sincronizados guion/animatic heredados, Festival Cut, tráiler y tratamiento largo; nueva dimensión comparativa `canon:zao-transmission-mechanics`.
- Actualizados canon, Ardor, entidades, notas técnicas y requisitos de haz. `TODO.md` registra deuda de stills, documentos, cálculo óptico y futuro flujo JSON de notas de autor/estado visual.

## 2026-08-26 — Referencias de escala Proxima / Celestial Ardor

- Reubicadas hojas ortográficas: Proxima en `locations/proxima-station/proportional-reference.{svg,png}`, Ardor en `vehicles/celestial-ardor/proportional-reference.{svg,png}`.
- Comparativa multi-entidad en `art-bible/scale-references/proxima-ardor-common-scale-reference.{svg,png}`.
- Documentado el patrón en `docs/ASSET_PATH_MAP.md`; sección «Escala» en la biblia visual; assets registrados en `data/assets.json`.

## 2026-08-25 — Paquete higgsfield-uploads

- Staging en `higgsfield-uploads/` con hojas de personaje, localización y props renombradas (`light-delay-{kind}-{slug}.png`) para subir a Higgsfield.
- Excluidos Harlan y Rao (TODO de redesign); regenerable con `npm run prepare:higgsfield`.

## 2026-08-25 — Política narrativa: sin exposición forzada

- En `AGENTS.md`: regla obligatoria de evitar exposición forzada; revelar información por pensamiento en acción y decisión del personaje (p. ej. el cálculo de Zao al apuntar el láser), no con explicaciones dirigidas al público.

## 2026-08-25 — Comparación de canon y tratamiento largo recuperado

- Nueva taxonomía versionada y ruta `/compare/[scriptId]?against=<ScriptId>` para comparar canon declarado, eventos principales, reparto, variantes y funciones narrativas sin inferencias editoriales.
- Contratos y validación ampliados para variaciones de canon por script y procedencia desde scripts o documentos registrados.
- Registrados los dos documentos históricos y su revisión autorizada en español; recuperado el reparto completo de catorce nombres.
- Nuevo `script:light-delay-long`: tratamiento regenerable de 100 minutos, 4 actos, 28 escenas y 28 beats; adopta el canon vigente y no inventa diálogo, tomas ni assets.
- Documentados por separado los candidatos de retropropagación a las versiones cortas y las especialidades aún no resueltas de Volkov y Tanaka.

## 2026-08-25 — Retorno y fullscreen del modo película

- El retorno desde Modo película centra y enfoca la toma activa en el editor mediante su ID estable.
- Se añadió un control visible de «Pantalla completa» como alternativa fiable al intento automático que los navegadores pueden rechazar.
- `data/README.md` se sincronizó con el registro multi-script y los assets servidos desde `static/assets/`.

## 2026-08-25 — Paridad visual del modo película

- `AnimaticPlayer` rediseñado al chrome legacy: stage a pantalla completa, viñeta, meta ESCENA/TOMA, panel «Detalles de la toma», barra glass con controles icono + scrubber + «Editar tiempos».

## 2026-08-25 — Tráiler (~1:30) desde brief

- Nuevo `script:light-delay-trailer` (9 bloques del brief, 29 tomas, 90 s).
- Frames reutilizados del animatic de 30 min vía `imageAssetId` compartido; `sourceRefs` a shots del main.
- Generador `npm run build:trailer` (`scripts/build-trailer-script.mjs`).

## 2026-08-25 — Selector de guion en navegación

- `ScriptSwitcher` en el rail (`ProjectNav`): elegir cut desde cualquier ruta del AppShell.
- Enlaces Guion/Animatic usan el script activo; al cambiar cut se conserva la sección (guion/animatic/player) o se abre el guion elegido.
- Persistencia del script activo en `sessionStorage`.

## 2026-08-25 — Multi-script / Festival Cut (ADR-0001)

- Migración de IDs a forma `kind:slug` y unidades de guion namespaced (`main:…`, `festival:…`).
- Scripts en `data/scripts/`; registro y continuidades en `project.json`; `narrative-functions.json` y `entity-variants.json`.
- Borrador Festival Cut con lineage, `characterFunctionAssignments` y 7 escenas (shots/takes vacíos).
- Rutas acotadas por `scriptId` (encode `:`→`~`); overlay de animatic por script+versión; validación multi-script.
- ADR-0001 marcado Accepted.

## 2026-08-25 — Fases 2–6: shell, documentos, entidades, guion, animatic y player

- Tokens legacy (cian/oro) en `src/app.css`; `AppShell`, navegación y documentos genéricos.
- Rutas: `/`, `/documents/[slug]`, `/script`, `/animatic`, `/animatic/player`, `/art`, `/entities/[kind]`, `/entities/[kind]/[id]`, `/assets/[id]`.
- Copia (no movimiento) de `legacy-site/assets/{characters,locations,props,vehicles,art-bible,animatic}` → `static/assets/` (LFS verificado).
- Editor con overlay de duraciones en `localStorage`; player con play/pausa/stop, scrubber, subtítulos derivados del diálogo y retorno con `?shot=`.
- Stubs de documentos ampliados; e2e de inicio/guion/animatic; changelog y estado actualizados.

## 2026-08-25 — Fase 1 tipos, validación y extracción JSON

- Tipos en `src/lib/types/` según `JSON_FORMAT.md` + addendum i18n (`DialogueCue.content` como `LocalizedValue`, `ProjectLanguages`).
- Validadores a mano (sin Zod), repositorios, selectores y tests.
- `scripts/extract-legacy.mjs` genera `data/*.json` (100 shots, diálogo ES source); `validate:data` en verde.
- Actualizado `docs/SCRIPT_ANIMATIC_SYNC.md` (98/98 placements; títulos de escena siguen divergiendo en redacción).

## 2026-08-25 — Fase 0 inventario de migración

- Inventario verificado: 17 escenas, 100 tomas, 100 PNG (1:1). Véase `docs/MIGRATION_INVENTORY.md`, `docs/ASSET_PATH_MAP.md`, `docs/SCRIPT_ANIMATIC_SYNC.md`.

## 2026-08-25 — Migración de imágenes a `static/`

- `docs/MIGRATION_PLAN.md` incluye el traslado de assets de imagen desde `legacy-site/assets/` hacia `static/assets/` (URLs `/assets/...`), con inventario, mapeo, validación LFS y limpieza de duplicados.

## 2026-08-25 — Diálogo español como fuente de verdad (i18n)

- `docs/JSON_FORMAT_I18N_ADDENDUM.md` aclara que el diálogo en español es la fuente de verdad frente a otras traducciones; editar español primero y no inventar inglés en la extracción mecánica.
- Se añadió `docs/MIGRATION_PLAN.md`; ambos docs nuevos se guardaron en UTF-8 (sin BOM) y se corrigió mojibake de árboles/guiones en el plan.

## 2026-08-25 — Bootstrap SvelteKit 2 / Svelte 5

- Se creó la aplicación mínima en la raíz con TypeScript, ESLint, Prettier, Vitest y Playwright.
- Se añadieron layout/página de aterrizaje, prueba unitaria y smoke e2e de `/`.
- `legacy-site/`, `docs/` y `data/` permanecen intactos; no se migraron assets a `static/assets/`.
- Validación: format, lint, check, unit, e2e, build y preview.

## 2026-08-25 — Política de idioma y carga de AGENTS.md

- Se definió el español como fuente de verdad documental; el inglés es secundario si no hay copia española.
- Se exige sincronizar traducciones (o marcar el desfase) en la misma tarea.
- Se añadió `.cursor/rules/load-agents.mdc` (`alwaysApply`) para cargar `AGENTS.md` en cada sesión de Cursor.

## 2026-08-25 — Documentación SvelteKit y árboles ASCII

- Se restauró `docs/SVELTEKIT_SETUP.md` (estaba vacío en disco) y se reemplazó el árbol mojibake por ASCII.
- Se unificaron los diagramas de directorio en `README.md` y `docs/JSON_FORMAT.md` a ASCII para evitar re-corrupción por encoding en Windows.

## 2026-08-25 — Paquete inicial para Git

- Se preservó el sitio estático completo en `legacy-site/`.
- Se incorporaron 100 fotogramas del animatic y 23 hojas de referencia visual.
- Se añadió documentación de canon, estado, producción y procedencia.
- Se reservó `data/` para la futura fuente JSON canónica.
- Se añadieron instrucciones para la migración a SvelteKit y Git LFS.
