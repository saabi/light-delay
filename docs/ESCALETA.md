# Escaleta por guion

La escaleta es la fuente autoral de la **historia y su cadena causal** para cada cut. Debe permitir comprender qué ocurre, por qué una decisión o consecuencia se vuelve posible y cómo se resuelve el conflicto sin depender de leer escenas, diálogos o tomas. El `ScriptFile` implementa esa intención; no debe usarse para regenerarla de forma circular.

## Espina narrativa y detalle

- `story`: hitos legibles de principio a fin. Tienen título y una descripción principal que puede ser `summary` para texto compacto o `body` para prosa estructurada extensa; ambos son mutuamente excluyentes. Cuando dependen directamente de otro hito, usan `causalLinks` con relación y explicación.
- `detail`: desglose editorial dentro de un hito mediante `parentStepId`. Conserva los IDs históricos de escaleta y registra evidencia de implementación.

`outline.synopsis` resume conflicto, cadena principal y resolución. `order` se controla por nivel, no por posición en el array.

Una escaleta puede ser deliberadamente **story-only** antes de que exista implementación. No debe inventar `detail`, escenas o cobertura para aparentar avance. `storySections` agrupa la espina en prólogo, secuencias u otras unidades sin convertir sus encabezados en falsos acontecimientos.

## Contexto y prosa estructurada

`framing` conserva material necesario que no es un beat: propósito, terminología, ambientación, física, reparto, motivaciones, riesgos, líneas estructurales y decisiones de producción. Cada sección declara `before_story` o `after_story`, y la UI la presenta fuera de la cadena causal.

Tanto `framing.blocks` como `story.body` usan bloques semánticos `paragraph`, `heading`, `list` y `blockquote`, con español e inglés inline. `outline.source` puede registrar ruta, revisión, idioma y SHA-256 de una fuente; `editorialNotice` muestra advertencias de procedencia o estado sin convertirlas en canon.

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

Los archivos de escaleta registrados viven en `data/outlines/<script-slug>.json`; español e inglés están juntos como `LocalizedString`. La ruta `/outline/[scriptId]` presenta aviso editorial y procedencia, framing anterior, historia agrupada, framing posterior y, cuando existe, detalle desplegable con evidencia y cobertura.

```bash
npm run report:outline-missing
npm run report:outline-gaps -- --target treatment
npm run report:outline-gaps -- --target script
npm run report:outline-gaps -- --target animatic
npm run report:outline-readability
npm run report:outline-story
npm run check:trailer-spoilers
```

`report:outline-story` exporta synopsis, framing y los hitos `story`, pero excluye `detail`: es la lectura narrativa que debe funcionar sin abrir implementación. `check:trailer-spoilers` falla si el guion o la escaleta del avance identifican al culpable, confirman el envío/recepción o asientan positivamente la muerte de Zao.

La narrativa maestra WIP posee además `npm run build:master-outline:check`, que comprueba que su capa inglesa siga correspondiendo exactamente —salvo delimitadores estructurales de Markdown— a la revisión fuente registrada.

`npm run seed:outline -- --script <slug> --output <ruta-de-borrador>` sólo crea una plantilla fuera de `data/outlines/`, nunca sobrescribe una escaleta canónica y deja marcadores explícitos para autoría humana.

Tipos: `src/lib/types/outline.ts`. Esquema: `data/schemas/outline.schema.json`. Procedimiento: [`GUIA_ESCALETA.md`](GUIA_ESCALETA.md).
