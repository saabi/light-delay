# Estado del proyecto

Fecha de corte: 2026-08-26.

## Completado

- **Comparación entre guiones (V1):** taxonomía versionada de 10 dimensiones de canon y 11 eventos, perfiles declarativos en los cuatro scripts y ruta `/compare/[scriptId]?against=<ScriptId>` para canon, eventos, reparto, variantes y funciones. La herramienta no infiere herencia de diálogo ni fusiones/divisiones.
- **Largometraje recuperado:** `script:light-delay-long` registrado como tratamiento de 100 min, 4 actos, 28 escenas y 28 beats, sin cues/shots/takes inventados. Incorpora el canon vigente y conserva procedencia hacia documentos o escenas del corto.
- **Reparto largo:** catorce nombres recuperados y catalogados: Zao, Voss, Harlan, Sorell, Rao, Cael, Keene, Vega, Wei, Hassan, Carvalho, Okoye, Volkov y Tanaka. La revisión autorizada está en `docs/REVISION_LARGOMETRAJE_RECUPERADO.md`.
- **Multi-script / Festival Cut (ADR-0001 Accepted):** registro en `project.json`, IDs `character:…` / `main:…` / `festival:…`, scripts en `data/scripts/`, funciones narrativas, borrador festival (7 escenas, shots vacíos), rutas `/script/[scriptId]` y `/animatic/[scriptId]`, overlay de animatic acotado por script+versión.
- **Selector de guion en el rail:** `ScriptSwitcher` en `ProjectNav`; Guion/Animatic respetan el cut activo (sessionStorage + URL).
- **Tráiler (~1:30):** `data/scripts/light-delay-trailer.json` — 9 secuencias del brief, 29 tomas reutilizando frames del main short; regenerable con `npm run build:trailer`.
- **Modo película:** chrome alineado al legacy (`AnimaticPlayer` fullscreen con meta, detalles flotantes y barra inferior).
- **Higgsfield (staging):** `higgsfield-uploads/` con hojas renombradas de personajes (sin Harlan/Rao), localizaciones y props; ver `higgsfield-uploads/TODO.md`.
- **Referencias de escala:** `proportional-reference` por entidad (Proxima, Celestial Ardor) y comparativa común en `art-bible/scale-references/`.
- **Retorno de Modo película:** el enlace a edición restaura la toma activa mediante `?shot=` y centra/enfoca su tarjeta; hay control visible de pantalla completa.
- Guion corto revisado de 17 escenas con objetivo de 30 minutos.
- Lista de momentos clave y versión acotada sincronizadas.
- Biblia de producción y reporte comprensivo actualizados al canon reciente.
- Notas técnicas de continuidad revisadas.
- Biblia visual con personajes, localizaciones, naves y objetos clave.
- Animatic textual de 100 tomas.
- 100 imágenes 1536 × 864 asociadas a las tomas.
- Modo Película con subtítulos, controles, timeline y panel de detalles.
- Edición de duraciones con persistencia local y recálculo del total.
- Bootstrap SvelteKit 2 / Svelte 5 en la raíz (TypeScript, lint, Vitest, Playwright, `adapter-auto`).
- Fase 0 de migración: inventario HTML/assets; 17 escenas / 100 tomas / 100 frames verificados; mapa `static/assets`; stub de sync guion↔animatic.
- Fase 1 (+ extracción inicial): tipos TypeScript, validadores a mano, loaders/repositorios/selectores, JSON en `data/` (17 escenas / 100 tomas / 98 diálogos ES), `npm run extract:legacy` y `npm run validate:data`.
- Fases 2–6 (aplicación): shell + documentos; copia de assets a `static/assets/`; rutas de arte/entidades/assets; lector de guion; editor de animatic; player a pantalla completa. Medios solo vía `/assets/...`.

## Decisiones abiertas

1. **Cronología T+24 h / T+26,5 h.** Las fuentes anteriores no quedaron completamente unificadas. Debe fijarse una cronología maestra y propagarse al guion, animatic y notas técnicas.
2. **Corrección de rumbo — Opción B.** Falta desarrollar y aplicar de forma consistente la solución de navegación/propulsión elegida.
3. **Terminología del sistema.** Unificar `IA`, `mediación`, `núcleo diplomático`, `núcleo cuántico` y `envoltura` según función dramática y técnica.
4. **Duración real.** Los 30:00 son un objetivo de montaje. Debe validarse mediante lectura cronometrada y luego con animación/video.
5. **Festival Cut.** Hay borrador de datos (`data/scripts/light-delay-festival.json`) con 7 secuencias y diálogo citado; faltan shot list, takes e imágenes canónicas de esa versión.
6. **Tráiler.** Versión animatic operativa reutilizando frames del main; falta afinado editorial de ritmo, posibles stills exclusivos de título y audio.
7. **Procedencia completa.** Los prompts exactos, parámetros y referencias de varias imágenes no quedaron incluidos en los manifests actuales.
8. **Especialidades de Volkov y Tanaka.** La fuente recuperada sólo respalda parcialmente la vinculación de Volkov con controles manuales y no define una función estable para Tanaka. No deben completarse por invención.
9. **Retropropagación al corto.** Vega como pista falsa acotada, mayor textura de especialistas y una preparación más legible del relé son candidatos; requieren decisión narrativa independiente antes de modificar versiones cortas.

## Notas técnicas recientes

- Inventario: `docs/MIGRATION_INVENTORY.md`. Sync: `docs/SCRIPT_ANIMATIC_SYNC.md`. Rutas: `docs/ASSET_PATH_MAP.md`.
- Bootstrap SvelteKit validado. Node pin en `.nvmrc` (`25`).
- Autoridad de esquema: tipos TypeScript de `JSON_FORMAT.md` + addendum i18n (sin Zod).
- Política de idioma: español = fuente de verdad. Detalle en `AGENTS.md`.
- Política narrativa: evitar exposición forzada; revelar por pensamiento/decisión del personaje (véase `AGENTS.md`).
- Assets: copia en `static/assets/` (characters 12, locations 8+proportional, props 5, vehicles 3+proportional, art-bible 2+scale-references, animatic 101). `legacy-site/assets/` intacto como referencia.
- Documentos prose: `notas-tecnicas` extraído; resto stubs navegables pendientes de extracción editorial.

## Próxima fase técnica

- Fase 7: desarrollar el tratamiento largo sólo tras revisión editorial; completar documentos y beats, y limpiar duplicados binarios tras revisar paridad.
- Revisar los tres candidatos de retropropagación sin sincronizarlos automáticamente entre scripts.
- Refinar títulos de escena animatic vs encabezados de guion (véase `SCRIPT_ANIMATIC_SYNC.md`).
- Pruebas de regresión ampliadas del modo Película (fullscreen, subtítulos, restauración de toma).

## Criterio de migración terminada

La migración no está completa hasta que todo contenido accesible desde `legacy-site/index.html`, todas las imágenes y todas las funciones del animatic estén disponibles en la aplicación Svelte sin depender de datos incrustados en HTML.
