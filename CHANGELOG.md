# Changelog

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
