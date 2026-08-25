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

## Decisiones abiertas

1. **Cronología T+24 h / T+26,5 h.** Las fuentes anteriores no quedaron completamente unificadas. Debe fijarse una cronología maestra y propagarse al guion, animatic y notas técnicas.
2. **Corrección de rumbo — Opción B.** Falta desarrollar y aplicar de forma consistente la solución de navegación/propulsión elegida.
3. **Terminología del sistema.** Unificar `IA`, `mediación`, `núcleo diplomático`, `núcleo cuántico` y `envoltura` según función dramática y técnica.
4. **Duración real.** Los 30:00 son un objetivo de montaje. Debe validarse mediante lectura cronometrada y luego con animación/video.
5. **Festival Cut.** Existe una estrategia de 4:30–5:00, pero todavía no un guion, shot list ni animatic canónicos de esa versión.
6. **Procedencia completa.** Los prompts exactos, parámetros y referencias de varias imágenes no quedaron incluidos en los manifests actuales.

## Notas técnicas recientes

- `docs/SVELTEKIT_SETUP.md` restaurado en disco; árboles de directorio en docs usan ASCII para evitar mojibake UTF-8/CP1252 en Windows.
- Política de idioma: español = fuente de verdad; inglés = secundario. Detalle en `AGENTS.md`. Regla Cursor `load-agents.mdc` fuerza la lectura de `AGENTS.md`.
- Varios docs técnicos (`docs/JSON_FORMAT.md`, `docs/SVELTEKIT_SETUP.md`) están solo en inglés; pendientes de versión española o de decisión explícita de dejarlos monolingües.

## Próxima fase técnica

- Crear proyecto SvelteKit en la raíz.
- Diseñar esquemas JSON antes de extraer contenido de los HTML.
- Convertir documentos y animatic a datos estructurados conservando IDs.
- Crear componentes comunes de navegación, tipografía, fichas, diálogos, tablas y galerías.
- Renderizar guion y animatic desde una única fuente de datos.
- Añadir validación de esquemas, rutas y duración.
- Comparar la nueva aplicación con `legacy-site/` antes de retirar duplicaciones.

## Criterio de migración terminada

La migración no está completa hasta que todo contenido accesible desde `legacy-site/index.html`, todas las imágenes y todas las funciones del animatic estén disponibles en la aplicación Svelte sin depender de datos incrustados en HTML.

