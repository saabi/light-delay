# Plan: sincronizar guiones con sus animatics (29/08/2026)

**Estado:** ejecución completada para Festival. El cut tiene guion causal y animatic A–G con 67 tomas; los 29 shots E–G colocan todo el diálogo aprobado y cierran revelación, cuarentena, contacto y desenlace. Los 57 cues huérfanos del corto fueron retirados del grafo activo y archivados con cobertura/procedencia en `data/archive/main-short-unplaced-action-cues.json`. La regresión de diálogo del tráiler quedó corregida en su generador.

## Resumen del diagnóstico

El animatic (`/animatic/[scriptId]`) sólo muestra diálogo que está *colocado* en la línea de tiempo de una toma (`shot.cuePlacements`). El guion (`/script/[scriptId]`) muestra **todos** los cues del script, estén o no colocados en una toma. Cuando un cue existe pero ningún `shot.cuePlacements` lo referencia, aparece en el guion y desaparece en el animatic. Verificado en el código: `AnimaticEditor.svelte` deriva `cues` exclusivamente de `shot.cuePlacements.map(...)`; `+page.svelte` de la ruta de guion arma `cuesByBeatId` directamente desde `script.cues`, sin ese filtro.

Medido por script, el problema tiene **dos causas completamente distintas** disfrazadas del mismo síntoma:

## 1. `light-delay-festival` — shot list A–G completo

- 7 escenas, **67 tomas / 67 takes** en secuencias A–G. E–G agregan 29 tomas para señal/autenticación, evidencia convergente, override, contención de Okoye, cuarentena, contacto y cierre terrestre.
- Todos los cues de E–G están colocados y su cobertura de escaleta figura `animatic: covered`. La primera asamblea suma 6:03,2 sin sobra de diálogo.
- Los stills reutilizados son placeholders `needs_regeneration/canon_mismatch`; displays y controles del master visual se generan sólo en inglés.
- Guía de construcción: `docs/light-delay-festival-cut-adaptation.md` + `data/outlines/light-delay-festival.json` (escaleta estructurada, checklist autoritativa; el Markdown compañero `docs/ESCALETA_FESTIVAL.md` se retiró el 29/08/2026 tras la migración completa). Cuidados al escribir: `docs/CUIDADOS_NARRATIVOS.md`.

**Trabajo restante:** revisar ritmo, performance, bindings y encuadres antes del freeze de prompts; no habilitar producción visual por el solo hecho de que la cobertura ya esté completa.

## 2. `light-delay-main-short` — archivo completado

Revisé el contenido de estos cues contra las tomas ya existentes en las **13 escenas afectadas** (01, 02, 03, 04, 09, 10, 11, 12, 13, 14, 15, 16, 17 — es decir, prácticamente todo el corto). En cada caso el cue de acción "sin colocar" es un párrafo largo que describe en prosa el mismo contenido que ya está desglosado toma por toma en la misma escena. Ejemplos verificados línea por línea:

- `main:cue-01-20` ("Proxima parece observatorio, refinería y astillero a la vez...") duplica el contenido combinado de las tomas 01-01 a 01-18.
- `main:cue-12-13` ("En pantalla: 'COINCIDENCIA TRIPLE...'") es casi idéntico a la descripción de `main:shot-12-06`.
- `main:cue-14-13/14/15` parafrasean de cerca `main:shot 3/4/5` de la escena 14.
- El patrón se repite en las 13 escenas muestreadas — títulos como "Overlay: T+40H..." o "El reloj llega a cero..." que ya están, casi palabra por palabra, en la descripción de una toma real.

Mi lectura: son borradores previos al desglose toma-por-toma que quedaron huérfanos en el arreglo `cues` en vez de limpiarse cuando se escribieron las tomas definitivas. No representan diálogo o acción que falte en el animatic — el contenido *ya está* ahí, sólo que como texto de toma en vez de como cue independiente.

**Decisión ejecutada:** no se colocaron ni se borraron sin rastro. Se retiraron los 57 cues duplicados del guion activo y se conservaron completos en un archivo histórico validado, junto con escena y tomas que cubren su contenido. `archive:orphan-actions:check` evita que el resultado generado derive.

La deuda restante del corto es editorial/visual (bindings, propósito y framing), no esos cues históricos.

## `light-delay-trailer` y `light-delay-long` — no requieren acción para este objetivo

- **Tráiler:** 0 cues sin colocar y 0 tomas con sobra de diálogo. La corrección vive en `build-trailer-script.mjs`; el montaje reproducible dura 92,5 s.
- **Largo:** 0 cues sin colocar, pero es un poco engañoso — casi no tiene tomas todavía en general (la broma de la nave, por ejemplo, sólo existe como prosa en `summary`/`dramaticPurpose`, no como cues reales). No hay nada que sincronizar porque casi no hay nada construido aún; es guionizado pendiente, no un bug de animatic.

## Próximas acciones

| Script | Estado | Próxima acción |
|---|---|---|
| festival | Guion y animatic A–G con 67 tomas; stills provisionales | Revisar ritmo, bindings y performance; aprobar el freeze visual antes de generar medios. |
| main-short | Cues duplicados archivados; shot list completa | Resolver sólo bindings, propósito y framing con valor editorial/visual. |
| trailer | Generador durable; 29 tomas / 92,5 s | Auditoría causal y aprobación de montaje antes del freeze de prompts. |
| long | Tratamiento con outline; sin tomas | Mantener producción como N/A hasta aprobar desarrollo narrativo. |
