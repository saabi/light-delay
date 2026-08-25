# Estado del proyecto

Fecha de corte: 2026-08-25.

## Completado

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
5. **Festival Cut.** Existe una estrategia de 4:30–5:00, pero todavía no un guion, shot list ni animatic canónicos de esa versión.
6. **Procedencia completa.** Los prompts exactos, parámetros y referencias de varias imágenes no quedaron incluidos en los manifests actuales.

## Notas técnicas recientes

- Inventario: `docs/MIGRATION_INVENTORY.md`. Sync: `docs/SCRIPT_ANIMATIC_SYNC.md`. Rutas: `docs/ASSET_PATH_MAP.md`.
- Bootstrap SvelteKit validado. Node pin en `.nvmrc` (`25`).
- Autoridad de esquema: tipos TypeScript de `JSON_FORMAT.md` + addendum i18n (sin Zod).
- Política de idioma: español = fuente de verdad. Detalle en `AGENTS.md`.
- Assets: copia en `static/assets/` (characters 12, locations 8, props 5, vehicles 3, art-bible 2, animatic 101). `legacy-site/assets/` intacto como referencia.
- Documentos prose: `notas-tecnicas` extraído; resto stubs navegables pendientes de extracción editorial.

## Próxima fase técnica

- Fase 7: desarrollo de contenido y herramientas editoriales (beats más finos, extracción completa de documentos, limpieza de duplicados binarios tras revisión de paridad).
- Refinar títulos de escena animatic vs encabezados de guion (véase `SCRIPT_ANIMATIC_SYNC.md`).
- Pruebas de regresión ampliadas del modo Película (fullscreen, subtítulos, restauración de toma).

## Criterio de migración terminada

La migración no está completa hasta que todo contenido accesible desde `legacy-site/index.html`, todas las imágenes y todas las funciones del animatic estén disponibles en la aplicación Svelte sin depender de datos incrustados en HTML.
