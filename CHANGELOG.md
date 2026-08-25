# Changelog

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
