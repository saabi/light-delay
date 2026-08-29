# Escaleta (outline) por guion

La escaleta es la **espina narrativa ordenada** de cada cut: qué eventos deben hacerse visibles o comprensibles al escribir el guion o montar el animatic. No sustituye el `ScriptFile` (beats/cues/shots) ni la matriz de comparación.

**Procedimiento para agentes:** [`docs/GUIA_ESCALETA.md`](GUIA_ESCALETA.md).

## Relación con otros artefactos

| Artefacto | Rol |
| --- | --- |
| `comparison-taxonomy.json` `majorEvents` | Taxonomía compartida de eventos mayores |
| `comparisonProfile.eventCoverage` | Declaración presente/reworked/omitted por cut |
| `ScriptFile.beats` | Beats del guion escrito |
| **Outline / escaleta** | Checklist ordenada de generación por `scriptId` |

Los pasos pueden referenciar `majorEventId` de la taxonomía y, cuando ya hay cobertura, `sceneIds` / `beatIds`. Opcionalmente `dependsOnStepIds` declara dependencias causales entre pasos del mismo archivo.

## Archivos

Convención (opcional al inicio; **obligatoria antes de ampliar** guion/animatic — ver guía):

```text
data/outlines/<script-slug>.json
```

Ejemplo: `script:light-delay-main-short` → `data/outlines/light-delay-main-short.json`.

Los archivos **pueden faltar** en validación/UI vacía. Cuando existen, se validan forma y FKs. Textos como `LocalizedString` (`es` + `en` en el mismo JSON); ver `docs/JSON_FORMAT_I18N_ADDENDUM.md`.

Tipos: `src/lib/types/outline.ts`. Contrato: `docs/JSON_FORMAT.md`.

## UI

- `/outline` redirige al outline del `canonicalScriptId`
- `/outline/[scriptId]` lista pasos agrupados por escena (idioma de diálogo) o empty state
- Destaca visualmente pasos `required` + `missing`
- Enlace «Escaleta» / «Outline» en la navegación del proyecto

## Informes offline

```bash
npm run report:outline-missing   # scripts sin archivo de escaleta
npm run report:outline-gaps      # required missing/deferred + deps incumplidas
```

Salidas bajo `reports/outline-missing/` y `reports/outline-gaps/` (ignoradas en git). Ambos se ejecutan en `npm run report:all`.

## Criterio de cierre (cuando existan pasos)

Antes de producción visual de un cut: todos los pasos `required` deberían estar en `covered` (con escenas/tomas enlazadas), salvo `deferred` documentado.
