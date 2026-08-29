# Edición: escena del cálculo del láser y reparto de diálogo (29/08/2026)

Este documento resume una pasada editorial sobre `data/scripts/light-delay-main-short.json`: (1) se marcaron los assets Velari como diferidos, (2) se añadió la toma en la que la consola ayuda a Zao a calcular el blanco del láser, con los trayectos en pantalla, y (3) se repartieron varias tomas cuyo diálogo no encajaba en el montaje asignado. Todos los cambios pasan `npm run validate:data` y se verificaron con `report:dialogue-timing` y `report:shot-completeness`.

## 1. Assets Velari: diferidos

La boca Velari, la estación Velari y la nave emisaria son orgánicas y quedan fuera del bloqueo 3D en Blender; se dejan en manos del pase de generación de video por IA. Ver `docs/technical/PRODUCTION_ROADMAP.md` (paso 5) y `docs/technical/EXTERNAL_SCENES_AND_ANIMATION.md` (§1 y §3), actualizados con esta decisión. No es una tarea pendiente: es una decisión de alcance.

## 2. Escena 6 — la consola ayuda a Zao a calcular el blanco

Fuente narrativa: `docs/SIGNAL_BEAM_REQUIREMENTS.md` §3, que pide "una trayectoria prevista, una intercepción por tiempo lumínico, una elipse de incertidumbre, la huella divergente, el raster residual y un porcentaje de finalización visible", y advierte explícitamente: *"No conviertan estos controles en exposición hablada."* Por eso todo el contenido nuevo es texto en pantalla (`presentation: "interface"`), sin diálogo añadido — siguiendo la convención ya usada en `light-delay-trailer.json` (strings cortos, en mayúsculas, en español).

- `main:shot-06-03` se recortó a 7000 ms y quedó centrada solo en la acción física de Zao (superponer el plan de vuelo), sin la huella divergente.
- Se creó `main:shot-06-09` (INSERT, cámara fija, 10000 ms): la pantalla del `object:optical-contingency-transmitter` calculando en vivo. Cue placements:
  - `main:cue-06-17` "PLAN DE VUELO — CARGADO" @0
  - `main:cue-06-18` "INTERCEPCIÓN POR TIEMPO LUMÍNICO — CALCULANDO" @1800
  - `main:cue-06-19` "ELIPSE DE INCERTIDUMBRE — LISTA" @3600
  - `main:cue-06-05` (existente, movida aquí) "la huella divergente cubre parte de la elipse..." @5400
  - `main:cue-06-20` "HUELLA DIVERGENTE — COBERTURA PARCIAL" @5400
  - `main:cue-06-21` "RASTER RESIDUAL — AJUSTE MANUAL" @7600
- `main:shot-06-09` lleva una nota `todo` recordando que longitud de onda, apertura, energía de pulso y ganancia siguen sin decidirse (por diseño, según el mismo documento) y que las etiquetas de interfaz no deben leerse como especificación técnica cerrada.
- `scene-06.targetDurationMs`: 90000 → 95000 ms (la escena tenía holgura de montaje; el informe de ritmo la señalaba con ~1:06 de margen visual antes de este cambio).

No se creó ningún personaje "computadora" que hable: no existe una IA nombrada en `characters.json`, y el pedido original pide que la máquina razone en pantalla, no en voz alta — coherente con la prohibición explícita del documento fuente.

## 3. Reparto de diálogo — tomas que no encajaban o debían dividirse por cobertura

Se usó `node scripts/report-dialogue-timing.mjs --all --format both` como criterio objetivo (no subjetivo) para decidir qué tomas tocar. El informe base señalaba 2 tomas con diálogo de sobra y 4 tomas con más de dos hablantes en una sola toma (lo que además impide dar cobertura de plano/contraplano). Después de esta pasada, "tomas con más de dos hablantes" bajó a **0**, y las 2 tomas con sobra de diálogo original quedan dentro del margen de redondeo del estimador (~0–1 s).

### Escena 1 — muelle de Proxima

- **`main:shot-01-03`** tenía 4 cues de hablantes distintos (periodista, manifestante, joven de contacto, Harlan) apilados en `atMs: 0`, leídos como simultáneos. Se dividió en:
  - `shot-01-03` (queda solo con el VO de la periodista, ahora repartido en dos mitades — ver abajo)
  - `shot-01-09` (manifestante-acheron)
  - `shot-01-10` (joven-contacto)
  - `shot-01-11` (Harlan) — toma separada explícitamente para que su línea no compita con el mosaico de protesta.
  - El propio VO de la periodista (`cue-01-01`) seguía sin encajar tras la primera división (montaje 0:08 vs. ~0:18 de diálogo estimado). Se partió el texto en dos oraciones/cues (`cue-01-01` + `main:cue-01-31`, nueva) repartidas en `shot-01-03` (8500 ms) y una nueva toma de mosaico, `shot-01-18` (9500 ms).
- **`main:shot-01-04`**: **se encontró un error de contenido** — la descripción original ("Celebración optimista en otra ciudad; réplica luminosa de la puerta") no correspondía a los cues que llevaba (`cue-01-05/06/07`, diálogo en vivo de Voss/Harlan/Cael en el muelle, no metraje de archivo). Se corrigió la descripción/propósito de `shot-01-04` para que coincida con el diálogo real ("Voss se dirige a Harlan en el muelle y pregunta por el núcleo"), y se documentó el hallazgo en una nota editorial (`resolved: true`) en el propio shot. El resto de los cues de ese grupo se repartió en `shot-01-12` (Harlan) y `shot-01-13` (Cael).
- **`main:shot-01-05`**: tenía cues de Sorell y Cael apilados; se repartió en `shot-01-14` y `shot-01-15`.
- **`main:shot-01-08`**: tenía la línea del técnico y una línea de Voss fuera de cámara apiladas; se repartió en `shot-01-16` y `shot-01-17`. El id `shot-01-08` se conservó porque `light-delay-trailer.json` lo referencia por `sourceRefs`.
- `scene-01.targetDurationMs`: 180000 → 204000 ms.

### Escena 12 — puente de mando, minutos después

- **`main:shot-12-01`** llevaba la línea de autenticación de Cael y, apilado en el mismo `atMs: 0`, el mensaje grabado de Zao (idéntico texto a `cue-06-09`) — eran momentos narrativamente distintos (una cosa es la autenticación, otra la reproducción del mensaje). Se dividió: `shot-12-01` conserva solo la línea de Cael (8000 ms); se creó `shot-12-09` (INSERT, 12000 ms) para la reproducción del mensaje de Zao, y se corrigió su duración interna (8000 → 11000 ms, insuficiente para el texto).
- `scene-12.targetDurationMs`: 120000 → 126000 ms.

## 4. Tomas nuevas y su estado editorial

Todas las tomas nuevas (`shot-01-09` a `01-18`, `shot-06-09`, `shot-12-09` — 12 en total) tienen su `Take` correspondiente con `status: "selected"`, `imageAssetId: asset:animatic-placeholder-missing-frame` e `imageStatus.reasons: ["placeholder"]` + `sourceShotId` apuntando a su propia toma, siguiendo el patrón de `scripts/lib/editorial-readiness-core.mjs`. Ninguna quedó marcada incompleta por `report:shot-completeness` (todas tienen `purpose`, `camera`, `description` ≥20 caracteres y `composition.framing`).

## 5. Verificación

- `npm run validate:data` → **OK** (17 escenas, 124 tomas en el corto canónico, 132 assets). Se actualizó el conteo esperado de tomas en `scripts/validate-data.mjs` (112 → 123 → 124) y se corrigió un requisito de esquema que las tomas nuevas no cumplían (`imageStatus.sourceShotId` obligatorio cuando `reasons` incluye `"placeholder"`).
- `report:dialogue-timing --all`: en `light-delay-main-short` bajó de 4 a 0 tomas con más de dos hablantes; las 2 tomas originales con sobra de diálogo pasaron de +10 s / +6 s a ≤1 s (dentro del margen de redondeo del estimador). Se detectó y corrigió además que `data.scenes` (escenas 1, 6 y 12) no tenía `shotIds` actualizado con las tomas nuevas — un `Scene.shotIds` desincronizado que `validate:data` no comprueba hoy, así que se corrigió a mano; convendría añadir esa comprobación al validador en algún momento.
- `report:shot-completeness --all`: ninguna de las tomas nuevas aparece en la lista de incompletas.

## 6. Pendiente / fuera de alcance de esta pasada

- `light-delay-long.json` tiene `long:scene-08` (equivalente narrativo de esta escena) sin cues ni tomas (`cueIds: [], shotIds: []`), con `sourceRefs` hacia `main:scene-06`. Por el modelo de continuidades independientes (`docs/ADR-0001-MULTI-SCRIPT-CONTINUITIES.md`), esto no se hereda automáticamente — habría que decidir si se construye una versión ampliada de la escena de cálculo (con más presupuesto de tiempo: `targetDurationMs: 214286`) o si se deja así a propósito.
- `light-delay-festival.json` y `light-delay-long.json` mencionan el láser en su propio texto, pero no se tocaron en esta pasada — sus propios informes de ritmo (`dialogue-timing`) no marcan problemas (0 tomas con sobra, 0 con más de dos hablantes).
- `light-delay-trailer.json` mantiene 5 tomas con diálogo de sobra y 5 fuera de cámara según el informe actual; son preexistentes y no relacionadas con esta pasada — quedan para una revisión aparte si se decide tocar el tráiler.
