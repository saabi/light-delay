# Revisión del trabajo de otro agente (29/08/2026)

Revisión de los commits más recientes en el repositorio (`cd50d01`, `e305369`, `48fc044`, `98bfad4`, `7b49646`, `b3aaaf7`, `2fe9baa`, `f5bfeec`), sin modificar nada — solo lectura, `validate:data`, `validate:docs`, `validate:translations` y los `report:*` para verificar. Resultado general: **trabajo sólido y en su mayoría bien dirigido, con una regresión real que vale la pena corregir.**

## Lo que funciona bien

### 1. La broma del nombre de la nave — implementada con fidelidad a la propuesta
Está en `main:cue-01-32` (Cael, `main:shot-01-01`, con la descripción de la toma ajustada para que el nombre y la silueta de la nave sean legibles en pantalla) con la reacción de Voss como cue de acción en `main:shot-01-13` ("Voss responde a la broma sólo con una mirada"). Coincide casi palabra por palabra con la línea 2 propuesta en `docs/PROPUESTA_BROMA_NOMBRE_NAVE.md`, con el reactor (Voss) que recomendé para el corto. En el largometraje aparece correctamente como intención documentada en `summary`/`dramaticPurpose` de `long:scene-01` (con Harlan "apenas registra el intercambio", combinando mis dos sugerencias de reactor) — no como cue real, porque esa escena todavía no tiene shot list, lo cual es honesto. Festival y tráiler la omiten explícitamente ("Sin broma"), exactamente como recomendé. Además quedó canonizada en `docs/CANON_DECISIONS.md` §"Broma sobre el nombre de la nave". Ninguna de las dos tomas quedó marcada por `report:dialogue-timing` (ni sobra de diálogo ni toma larga sin diálogo).

### 2. `main:shot-01-06` — corregido el desajuste de contenido que señalé
La descripción ahora coincide con los cues reales (Zao instruyendo a Elin sobre la cuarentena), y los 3 cues que estaban apilados en `atMs: 0` ahora están secuenciados (`0 / 8000 / 16000`) con la duración de la toma ajustada en consecuencia. Exactamente el hallazgo que dejé anotado en la propuesta de la broma, resuelto correctamente.

### 3. Clasificación de estado en los informes editoriales (`complete` / `debt` / `not_applicable`)
Esto responde directamente a lo que señalé en `docs/HALLAZGOS_INFORMES_EDITORIALES.md`: varios informes marcaban como "debt" cosas que en realidad eran N/A (guiones vacíos) o ruido estructural. Ahora cada informe declara un **Estado** explícito:
- `dialogue-i18n`: pasó de "98/98 sin variante" (falso positivo — comparaba solo contra variantes embebidas) a **0/0 en los 4 scripts**, porque ahora también reconoce el overlay de traducción en `messages/en.json`. Corrección legítima, no un maquillaje del número.
- `visual-art`: pasó de "17 entidades sin raster" idéntico en los 4 scripts (evidentemente mal alcanzado) a un conteo **por script** (7 en el corto, 0 en festival, 2 en tráiler, 7 en largo) — ahora solo cuenta entidades que ese script realmente referencia.
- `take-workflow`: correctamente marca festival/long como `not_applicable` (no tienen tomas que generar) en vez de mezclarlos con el debt real del corto/tráiler.

### 4. Renombre de Rao → Elin
Bien ejecutado: `character:rao` conserva su ID, `name` pasa a "Elin Rao", `shortName: "Elin"`, y `aliases` incluye "RAO" — no rompe referencias existentes. El motivo documentado en `CANON_DECISIONS.md` (confusión sonora entre "Rao" y "Zao" en diálogo hablado) es razonable y no lo había considerado.

### 5. Documentos nuevos
`docs/DESCRIPCION_DE_VOCES_DE_PERSONAJES.md` (biblia de voces bilingüe EN/ES, con metodología de timbre/acento clara y notas de continuidad por personaje) y `docs/GUIA_BANDA_SONORA.md` (registros sonoros por tipo de escena, motivo central, e incluso una idea de usar el retraso lumínico como dispositivo de mezcla/composición) son sustanciosos y coherentes con el tono ya establecido del proyecto — no los revisé línea por línea pero el muestreo que hice es de buena calidad.

### 6. `docs/CONTINUIDAD_CAUSAL_GUIONES.md` (nuevo)
Tabla causal explícita de qué sabe cada personaje y cuándo, con una tabla de "requisitos por versión" que marca honestamente qué guiones están bloqueados y por qué (festival y tráiler sin shot list, largo sin cues). Buena disciplina — no infla el estado de avance de festival/long.

## Regresión real encontrada

**`light-delay-trailer.json` volvió a tener las 5 tomas con sobra de diálogo que yo había corregido esta sesión — incluidas las 2 que tenían cues de diálogo apiladas en `atMs: 0` como si fueran simultáneas.**

Causa raíz identificada: `data/scripts/light-delay-trailer.json` **no es un archivo editado a mano — es generado** por `scripts/build-trailer-script.mjs` a partir de `light-delay-main-short.json`. El commit `b3aaaf7` ("restore trailer regen flags in build:trailer") volvió a ejecutar el generador como parte de la sincronización de continuidad causal, lo que sobrescribió mis correcciones directas al JSON (que nunca se propagaron al generador). El propio generador tiene el bug de origen: su función `addCue()` (línea ~269-279) siempre coloca `atMs: 0` sin importar cuántos cues se adjunten al mismo `shotRef`, y las duraciones de toma están escritas como literales en un arreglo (`seg.shots`, líneas 76+) sin verificarlas contra el estimador de diálogo.

**Esto no es exactamente un error de "el otro agente" tanto como un problema de proceso que yo mismo debí anticipar**: edité `light-delay-trailer.json` directamente sin notar que tenía un generador aguas arriba, así que el arreglo nunca fue durable. Ahora que se sabe, la corrección correcta es en el generador, no en el JSON de salida.

Verificado con `report:dialogue-timing --all` tras los últimos commits: `light-delay-trailer` vuelve a mostrar **5 tomas con sobra de diálogo** (los mismos IDs de antes: `shot-h-02`, `shot-d-01`, `shot-g-01`, `shot-f-04`, `shot-b-03`), mientras que `main-short`, `festival` y `long` siguen en 0.

## Recomendaciones

1. **Corregir `scripts/build-trailer-script.mjs`, no el JSON generado**: en `addCue()`, llevar un offset acumulado por `shotRef` en vez de `atMs: 0` fijo para cada cue adjuntada; y calibrar `durationMs` de cada `seg.shots[]` contra una estimación de diálogo (o simplemente correr `report:dialogue-timing` después de regenerar y ajustar los literales que queden marcados). Así el arreglo sobrevive a la próxima regeneración.
2. Después de cualquier `node scripts/build-trailer-script.mjs`, correr `report:dialogue-timing --all` como paso de verificación — igual que ya se hace para `validate:data`. Vale la pena anotarlo en el encabezado del propio script generador como recordatorio.
3. El resto del trabajo (broma, `shot-01-06`, clasificación de informes, renombre de Elin) no necesita cambios — está bien resuelto.
4. Sigue pendiente, sin tocar por este agente (correcto, ya que esperaba mi aprobación): el plan de ritmo escena por escena (`docs/PLAN_ESCENA_POR_ESCENA.md`, escenas 4/9/14/17) y el backlog de `cue-placement` (33 placements sin `durationMs` explícito, 57 cues de acción sin colocar) y `entity-binding` (121/124 tomas sin binding) de `docs/HALLAZGOS_INFORMES_EDITORIALES.md` — ninguno cambió de número.

## No se modificó nada

Esta revisión fue de solo lectura: se ejecutaron `validate:data`, `validate:docs`, `validate:translations` y los `report:*` para verificar, pero no se tocó ningún archivo de datos ni de código.
