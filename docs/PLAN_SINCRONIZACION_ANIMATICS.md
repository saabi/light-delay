# Plan: sincronizar guiones con sus animatics (29/08/2026)

**Estado:** diagnóstico vigente; el Festival Cut ya tiene shot list parcial (secuencias A–D: 35 tomas). E–G y la limpieza de cues huérfanos del corto siguen pendientes.

## Resumen del diagnóstico

El animatic (`/animatic/[scriptId]`) sólo muestra diálogo que está *colocado* en la línea de tiempo de una toma (`shot.cuePlacements`). El guion (`/script/[scriptId]`) muestra **todos** los cues del script, estén o no colocados en una toma. Cuando un cue existe pero ningún `shot.cuePlacements` lo referencia, aparece en el guion y desaparece en el animatic. Verificado en el código: `AnimaticEditor.svelte` deriva `cues` exclusivamente de `shot.cuePlacements.map(...)`; `+page.svelte` de la ruta de guion arma `cuesByBeatId` directamente desde `script.cues`, sin ese filtro.

Medido por script, el problema tiene **dos causas completamente distintas** disfrazadas del mismo síntoma:

## 1. `light-delay-festival` — shot list parcial (A–D hechas; E–G pendientes)

- 7 escenas, **35 tomas / 35 takes** en secuencias A–D; cues ampliados respecto al borrador inicial.
- Secuencias E–G siguen sin tomas (plan en la escaleta / adaptación).
- Guía de construcción: `docs/light-delay-festival-cut-adaptation.md` + `data/outlines/light-delay-festival.json` (escaleta estructurada, checklist autoritativa; el Markdown compañero `docs/ESCALETA_FESTIVAL.md` se retiró el 29/08/2026 tras la migración completa). Cuidados al escribir: `docs/CUIDADOS_NARRATIVOS.md`.

**Propuesta restante:** cerrar E–G secuencia por secuencia con la misma rigurosidad; verificar con `validate:data`, `report:dialogue-timing` / `report:cue-coverage` y `report:outline-gaps` al cerrar cada una.

## 2. `light-delay-main-short` — los 57 cues de acción "sin colocar" son prosa heredada/duplicada, no cobertura faltante

Revisé el contenido de estos cues contra las tomas ya existentes en las **13 escenas afectadas** (01, 02, 03, 04, 09, 10, 11, 12, 13, 14, 15, 16, 17 — es decir, prácticamente todo el corto). En cada caso el cue de acción "sin colocar" es un párrafo largo que describe en prosa el mismo contenido que ya está desglosado toma por toma en la misma escena. Ejemplos verificados línea por línea:

- `main:cue-01-20` ("Proxima parece observatorio, refinería y astillero a la vez...") duplica el contenido combinado de las tomas 01-01 a 01-18.
- `main:cue-12-13` ("En pantalla: 'COINCIDENCIA TRIPLE...'") es casi idéntico a la descripción de `main:shot-12-06`.
- `main:cue-14-13/14/15` parafrasean de cerca `main:shot 3/4/5` de la escena 14.
- El patrón se repite en las 13 escenas muestreadas — títulos como "Overlay: T+40H..." o "El reloj llega a cero..." que ya están, casi palabra por palabra, en la descripción de una toma real.

Mi lectura: son borradores previos al desglose toma-por-toma que quedaron huérfanos en el arreglo `cues` en vez de limpiarse cuando se escribieron las tomas definitivas. No representan diálogo o acción que falte en el animatic — el contenido *ya está* ahí, sólo que como texto de toma en vez de como cue independiente.

**Esto no es un fix mecánico de "colocar el cue que falta"** — sería duplicar contenido, no sincronizar. Necesita una decisión de limpieza de datos:

- **Opción A (recomendada): eliminar estos 57 cues.** Su contenido ya vive en las descripciones de toma; no aportan nada nuevo al guion ni al animatic, y dejan ruido en `report:cue-placement`/`entity-binding`.
- **Opción B: archivarlos** (mover a un campo tipo `legacyNotes` fuera de `cues[]`) por si sirven de referencia histórica del proceso de escritura.
- **Opción C: dejarlos y no tocarlos** — están fuera del animatic pero visibles en el guion; si eso ya no molesta, no hay urgencia real.

No voy a borrar contenido creativo sin tu aprobación explícita — decime cuál opción preferís (o si querés revisar caso por caso antes) y sigo desde ahí.

## `light-delay-trailer` y `light-delay-long` — no requieren acción para este objetivo

- **Tráiler:** 0 cues sin colocar — ya está sincronizado con su animatic. (Nota aparte, ya reportada en `docs/REVISION_TRABAJO_OTRO_AGENTE.md`: volvió a tener 5 tomas con sobra de diálogo por una regresión del generador `build-trailer-script.mjs`; eso es un problema distinto de sincronización de sobra de tiempo, no de cues invisibles. Sigue sin corregir, a la espera de que confirmes si lo arreglo.)
- **Largo:** 0 cues sin colocar, pero es un poco engañoso — casi no tiene tomas todavía en general (la broma de la nave, por ejemplo, sólo existe como prosa en `summary`/`dramaticPurpose`, no como cues reales). No hay nada que sincronizar porque casi no hay nada construido aún; es guionizado pendiente, no un bug de animatic.

## Resumen de lo que pediría aprobar

| Script | Diagnóstico | Acción propuesta | ¿Necesita tu aprobación de enfoque? |
|---|---|---|---|
| festival | Sin shot list real | Construir tomas/cues secuencia por secuencia según la guía de adaptación, mostrando cada secuencia antes de seguir | Sí — confirmar que empiece por la Secuencia A |
| main-short | 57 cues de acción huérfanos/duplicados | Eliminar (o archivar) tras tu decisión | Sí — elegir opción A/B/C arriba |
| trailer | Sincronizado; regresión de sobra de diálogo aparte | Arreglar el generador (`addCue()` + duraciones) si querés que lo retome | Sí — confirmar si procedo |
| long | Sin suficientes tomas aún para evaluar | Ninguna acción por ahora | No |

Quedo a la espera de tu feedback antes de tocar cualquier archivo de datos.
