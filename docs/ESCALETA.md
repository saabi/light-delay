# Escaleta (outline) por guion

La escaleta es la **espina narrativa ordenada** de cada cut: qué eventos deben hacerse visibles o comprensibles al escribir el guion o montar el animatic. No sustituye el `ScriptFile` (beats/cues/shots) ni la matriz de comparación.

## Relación con otros artefactos

| Artefacto | Rol |
| --- | --- |
| `comparison-taxonomy.json` `majorEvents` | Taxonomía compartida de eventos mayores |
| `comparisonProfile.eventCoverage` | Declaración presente/reworked/omitted por cut |
| `ScriptFile.beats` | Beats del guion escrito |
| **Outline / escaleta** | Checklist ordenada de generación por `scriptId` |

Los pasos pueden referenciar `majorEventId` de la taxonomía y, cuando ya hay cobertura, `sceneIds` / `beatIds`.

## Archivos

Convención (opcional):

```text
data/outlines/<script-slug>.json
```

Ejemplo: `script:light-delay-main-short` → `data/outlines/light-delay-main-short.json`.

Los archivos **pueden faltar**. La UI (`/outline/[scriptId]`) muestra un estado vacío; `validate:data` no exige outlines. Cuando existen, se validan forma y FKs.

Tipos: `src/lib/types/outline.ts`. Contrato: `docs/JSON_FORMAT.md`.

## UI

- `/outline` redirige al outline del `canonicalScriptId`
- `/outline/[scriptId]` lista pasos o empty state
- Enlace «Escaleta» / «Outline» en la navegación del proyecto

## Informe offline

```bash
npm run report:outline-missing
```

Escribe `reports/outline-missing/project.md` y `.json` (ignorados en git) con los scripts del registry que aún no tienen archivo de escaleta. También se ejecuta como parte de `npm run report:all`.

## Criterio de cierre (cuando existan pasos)

Antes de producción visual de un cut: todos los pasos `required` deberían estar en `covered` (con escenas/tomas enlazadas), salvo `deferred` documentado.
