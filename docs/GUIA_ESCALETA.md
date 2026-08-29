# Guía de escaleta para agentes

Procedimiento obligatorio al crear o ampliar guion, diálogo, beats/cues, shots/takes o montaje de animatic de un `scriptId`. Contrato de datos: `docs/ESCALETA.md`. Cuidados narrativos: `docs/CUIDADOS_NARRATIVOS.md`. Causalidad entre cuts: `docs/CONTINUIDAD_CAUSAL_GUIONES.md`.

## 1. Cuándo aplica

Cualquier tarea que:

- cree o modifique un `ScriptFile` (escenas, beats, cues, shots, takes);
- monte o revise el animatic de un cut registrado;
- declare cobertura de eventos o reescriba continuidad de un cut.

No aplica a cambios puramente de UI/chrome, assets visuales sin texto narrativo, o docs sin tocar datos de guion.

## 2. Puerta de entrada

Antes de continuar:

1. Comprobar `data/outlines/<slug>.json` (slug = id del script sin `script:`), o `getOutline(scriptId)`, o `npm run report:outline-missing`.
2. **Si falta el archivo:** crear la escaleta JSON **antes** de seguir ampliando guion/animatic de ese cut.
3. **Si existe:** leerla y auditar (sección 8) antes de editar.

La UI tolera outlines ausentes; eso **no** autoriza a saltarse la escaleta al trabajar narrativa.

## 3. Cómo construirla (causalidad, sin inventar)

Orden de fuentes:

1. `docs/CONTINUIDAD_CAUSAL_GUIONES.md` — cadena y obligaciones por versión.
2. `comparisonProfile.eventCoverage` + `majorEvents` de `comparison-taxonomy.json`.
3. Docs del cut (p. ej. adaptación festival). Una prosa compañera opcional puede auxiliar el análisis mientras se construye, pero una vez migrado el contenido narrativo al JSON se retira (ver `docs/ESCALETA_FESTIVAL.md` retirado en CHANGELOG, 29/08/2026) — el JSON es la checklist autoritativa, no un espejo temporal.

Reglas:

- Preferir `majorEventId` de la taxonomía frente a numeraciones ad hoc.
- `required` = irreductible para ese cut; `optional` / `deferred` explícitos y justificados.
- `order` = secuencia causal, no el índice de escena.
- Grano: evento mayor **o** beat/toma cuando el cut lo necesite (el festival tiene ~1 paso por toma clave).
- Declarar `dependsOnStepIds` cuando un cierre (doble llave, etc.) dependa de pasos previos del mismo archivo.

## 4. Estados

| Status | Uso |
| --- | --- |
| `covered` | Hay evidencia en el `ScriptFile` / animatic (escenas, cues, tomas). Enlazar `sceneIds` / `beatIds`. |
| `missing` | Beat identificado y aún no escrito (p. ej. d-00). |
| `planned` | Plan de secuencia sin construir (p. ej. E–G del festival). |
| `deferred` | Omitido a propósito en este cut, documentado. |

No marcar `covered` sin evidencia en datos.

## 5. Notas vs Markdown compañero

- Hallazgos de integridad a nivel de paso → `notes` (`type: continuity`, `resolved`).
- Análisis largo en prosa → MD compañero opcional; no sustituye al JSON.
- Tras un pase material en ES, actualizar el overlay EN en el mismo pase (sección 6).

## 6. Idiomas

- Español autoritativo en `data/outlines/*.json`.
- Inglés vía `data/translations/public.en.json` (clave = texto ES exacto), igual que guiones.
- Tras cambiar `title` / `summary` / `notes[].text` en ES: actualizar o marcar stale las claves EN; `npm run validate:translations` debe pasar.
- La UI `/outline/[scriptId]` usa el idioma de diálogo (`dialogueLanguage`).

## 7. Dependencias

`dependsOnStepIds` referencia otros `OutlineStep.id` del mismo archivo. Validado por `validate:data`. Útil para que `report:outline-gaps` avise si un paso `covered` depende de otro aún no cubierto.

## 8. Auditoría contra guion y animatic

Checklist:

1. Cada `required` está `covered`, o queda `missing`/`deferred` consciente.
2. `sceneIds` / `beatIds` resuelven cuando se declaran.
3. Tras cambios materiales, reauditar (también hacia atrás: `CUIDADOS_NARRATIVOS` §5).
4. Correr `npm run report:outline-missing` y `npm run report:outline-gaps`.

## 9. Cierre

- `npm run validate:data` (y `validate:translations` si hubo strings nuevas).
- Revisar `/outline/[scriptId]` (agrupa por escena; destaca `required`+`missing`).
- No regenerar imágenes salvo instrucción explícita.
- Actualizar `CHANGELOG.md` / `docs/PROJECT_STATUS.md` si el cambio es material.
