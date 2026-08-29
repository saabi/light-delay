# Escaleta por guion

La escaleta es la fuente autoral de la **historia y su cadena causal** para cada cut. Debe permitir comprender qué ocurre, por qué una decisión o consecuencia se vuelve posible y cómo se resuelve el conflicto sin depender de leer escenas, diálogos o tomas. El `ScriptFile` implementa esa intención; no debe usarse para regenerarla de forma circular.

## Dos niveles

- `story`: hitos legibles de principio a fin. Tienen título, resumen sustantivo y, cuando dependen directamente de otro hito, `causalLinks` con relación y explicación.
- `detail`: desglose editorial dentro de un hito mediante `parentStepId`. Conserva los IDs históricos de escaleta y registra evidencia de implementación.

`outline.synopsis` resume conflicto, cadena principal y resolución. `order` se controla por nivel, no por posición en el array.

## Causalidad

`causalLinks` une pasos del mismo nivel y anteriores en el tiempo:

| Relación | Sentido |
| --- | --- |
| `enables` | crea una condición necesaria |
| `motivates` | da al personaje una razón para actuar |
| `reveals` | aporta información que cambia la lectura o decisión |
| `forces` | elimina alternativas y obliga a responder |
| `prevents` | bloquea una acción o resultado |
| `pays_off` | resuelve o cobra una preparación anterior |

La explicación debe nombrar el vínculo concreto. No basta con enlazar automáticamente cada paso con el anterior.

## Cobertura independiente

`coverage` es opcional porque la escaleta puede preceder a toda implementación. Cada detalle puede declarar por separado `treatment`, `script` y `animatic`, con estados `not_started`, `partial`, `covered`, `deferred` o `not_applicable`. Un estado `covered` requiere evidencia: referencias narrativas para tratamiento/guion y `shotIds` para animatic.

Esto evita que «la historia está definida» signifique erróneamente «ya existen tomas».

## Archivos, UI e informes

Los archivos canónicos viven en `data/outlines/<script-slug>.json`; español e inglés están juntos como `LocalizedString`. La ruta `/outline/[scriptId]` muestra primero los hitos y permite desplegar detalle, evidencia y cobertura.

```bash
npm run report:outline-missing
npm run report:outline-gaps -- --target treatment
npm run report:outline-gaps -- --target script
npm run report:outline-gaps -- --target animatic
npm run report:outline-readability
```

`npm run seed:outline -- --script <slug> --output <ruta-de-borrador>` sólo crea una plantilla fuera de `data/outlines/`, nunca sobrescribe una escaleta canónica y deja marcadores explícitos para autoría humana.

Tipos: `src/lib/types/outline.ts`. Esquema: `data/schemas/outline.schema.json`. Procedimiento: [`GUIA_ESCALETA.md`](GUIA_ESCALETA.md).
