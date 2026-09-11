# Instrucciones para agentes

## Objetivo

Transformar gradualmente el paquete estático de Light Delay en una aplicación SvelteKit basada en datos, sin perder canon, contenido, imágenes ni comportamiento.

## Idioma y autoridad documental

El inglés es la fuente de verdad de la documentación y de la autoría narrativa vigente del repositorio. El español es una traducción que puede completarse en un pase posterior.

La fuente de verdad **narrativa** vigente es `data/outlines/light-delay-master-narrative.json`. Es una autoridad WIP: puede seguir cambiando, pero prevalece desde ahora sobre los outlines, guiones, animatics y documentos de canon anteriores. Sus exports Markdown ES/EN son derivados generados y no se editan a mano.

- Si un documento existe en varios idiomas, **editar primero la copia en inglés**. Las demás lenguas son traducciones o adaptaciones, no fuentes paralelas de autoría.
- Si **no hay copia en inglés**, el documento existente conserva su función y procedencia hasta que se cree una fuente inglesa explícita; no traducirlo ni reemplazarlo de forma mecánica.
- Tras cualquier cambio material en inglés, actualizar las traducciones en un pase posterior o marcar de forma visible su revisión y estado. Una traducción desactualizada no bloquea la autoría inglesa.
- Ante conflicto entre variantes equivalentes y vigentes, prevalece el inglés. La autoridad narrativa y el estado de ciclo de vida prevalecen sobre el idioma: un documento inglés obsoleto o deprecado no sustituye al master.
- El copy de historia en JSON vive **en el mismo archivo** como mapas por idioma o, en diálogo/texto, como `content.variants.<lang>`. Editar primero `en`; `es` puede quedar marcado `needs_revision`. La UI chrome sigue en Paraglide (`messages/*.json`). No reintroducir overlays.
- Convención de nombres cuando haya pares: `nombre.md` o `nombre.en.md` para inglés; `nombre.es.md` para español. Los archivos históricos sin par no se renombran sólo para imponer la convención.
- `AGENTS.md` es el único lugar canónico de instrucciones para agentes (cualquier modelo o plataforma). Otras guías de herramienta deben **referenciar** este archivo, no duplicar reglas.

## Reglas obligatorias

- Leer este archivo completo al inicio de cada sesión de trabajo en el repositorio.
- Leer `README.md`, `data/outlines/light-delay-master-narrative.json`, `data/editorial-lifecycle.json`, `docs/ADR-0002-MASTER-NARRATIVE-AUTHORITY.md` y `docs/PROJECT_STATUS.md` antes de modificar narrativa o estructura. `docs/CANON_DECISIONS.md` es una referencia de la continuidad anterior, no autoridad vigente. Si el trabajo toca guion o animatic de un cut, leer también `docs/GUIA_ESCALETA.md` (contrato en `docs/ESCALETA.md`).
- No crear ni ampliar un guion/animatic/cut derivado mientras la escaleta maestra siga incompleta, salvo autorización editorial explícita. Tras completarla, crear primero una escaleta derivada en `data/outlines/`, declarar su procedencia y verificar que el guion/animatic la respeta; procedimiento en `docs/GUIA_ESCALETA.md`.
- Tratar `legacy-site/` como archivo obsoleto retenido sólo para rescate y procedencia. No usarlo como autoridad ni como baseline de regresión vigente.
- No reescribir el canon para resolver una dificultad de implementación.
- No inventar datos ausentes. Marcar incertidumbres y decisiones pendientes.
- Evitar la exposición forzada: no tratar al público como incapaz de inferir. La información se revela de forma natural (pensamiento en acción, decisión bajo presión, consecuencia visible), no con diálogos o monólogos que explican el mundo «para el espectador». Ejemplo: cuando Zao decide dónde apuntar el láser y por qué elige la posición futura de la nave, son su propio razonamiento y la elección lo que exponen el porqué; no hace falta que alguien se lo diga a la audiencia.
- Al escribir o traducir diálogo del elenco maestro, consultar la variante del idioma en `data/voice-profiles.json`: la prosodia de origen se combina con la variedad aprendida, el registro, la relación y la presión dramática. Mantener estas diferencias sutiles y naturales; no representar acentos mediante ortografía fonética, errores gramaticales ni localismos mecánicos. Editar primero el inglés y traducir el español en un pase posterior.
- La capa `story` de cada escaleta debe contar una historia continua y causalmente completa con los detalles cerrados. Los pasos `detail`, notas o conocimiento externo no pueden reparar una causa, sujeto o consecuencia ausente del resumen principal.
- Preservar las omisiones deliberadas de cada cut en todo dato público, incluidas traducciones, metadatos, IDs, referencias y descripciones heredadas. En particular, el tráiler no identifica al culpable ni confirma el envío, la recepción o la muerte de Zao; sólo puede insinuar que ella descubrió a una persona responsable y que quedó en peligro.
- No confundir exposición forzada con razonamiento dramático: la escaleta debe conservar causas, alternativas descartadas, motivaciones, suposiciones (incluso erróneas) y consecuencias cruciales. Un personaje puede pensar en acción o hablar para sí cuando eso revela una decisión o profundidad propia, no para impartir una lección al público.
- No reemplazar una versión narrativa más reciente por otra anterior sin verificar procedencia y pedir confirmación ante la duda. Si falta una causa necesaria, detener el trabajo narrativo bloqueado y consultar. Sólo con autorización explícita se puede avanzar dejando una nota/TODO de causa no resuelta o propuestas alternativas.
- Mantener IDs estables para escenas y tomas; no usar el índice del array como identidad persistente. Los IDs de unidades de guion van namespaced por script (`main:…`, `festival:…`); las entidades de proyecto usan ids globales (`character:voss`).
- Separar datos narrativos, presentación y estado editorial.
- El guion textual y el animatic deben renderizarse desde una única fuente de datos **por script/cut** (`ScriptFile`); varios cuts se registran en `project.scripts` (véase `docs/ADR-0001-MULTI-SCRIPT-CONTINUITIES.md`).
- `project.narrativeAuthority` identifica la escaleta maestra WIP y su `ScriptFile` stub. `canonicalScriptId` apunta temporalmente a ese stub para resolver las rutas principales; no implica que exista todavía un guion derivado.
- Los guiones, outlines y animatics de main-short, festival, trailer y long pertenecen a la continuidad anterior: están deprecados/obsoletos y sólo se conservan para rescatar diálogo, puesta, procedencia o recursos compatibles. No actualizarlos como si fueran productos vigentes ni derivar canon nuevo de ellos.
- Toda clasificación de dependencias y candidatos a borrado se registra en `data/editorial-lifecycle.json`. Una ausencia en la escaleta maestra no prueba obsolescencia: lo incierto queda `review_required`, y nada se borra hasta cumplir todas las compuertas declaradas.
- Animatic, overlay de edición y rutas se acotan por `scriptId`.
- Los subtítulos deben derivarse del diálogo de cada toma, no mantenerse como una copia independiente sin validación.
- Preservar la reproducción a pantalla completa, play/pausa/stop, navegación, timeline, panel de detalles y retorno a edición conservando posición.
- No regenerar imágenes existentes salvo instrucción explícita.
- Actualizar `CHANGELOG.md` y `docs/PROJECT_STATUS.md` después de cambios materiales.
- Respetar la sección **Idioma y autoridad documental** al editar o crear documentación.

## Arquitectura prevista

- SvelteKit + TypeScript en la raíz.
- `src/lib/components/`: componentes documentales y del animatic.
- `src/lib/data/`: carga y validación de JSON.
- `src/lib/types/`: contratos TypeScript derivados o sincronizados con esquemas.
- `data/`: JSON canónicos y esquemas legibles por otras herramientas.
- `static/assets/`: destino futuro de imágenes una vez migradas desde `legacy-site/assets/`.

No mover los assets a `static/` hasta actualizar y verificar todas las referencias.

## Validación mínima futura

- El guion corto archivado debe conservar 17 escenas de historia más cartelas de título/créditos, y su animatic deprecado **128** tomas (124 de historia + título diferido + 3 créditos). Este conteo es una prueba de integridad del archivo, no una exigencia para los futuros derivados del master. Los 100 PNG legacy son recursos retenidos, no el recuento de tomas de la autoridad vigente.
- Todas las rutas de imágenes deben existir.
- La duración total debe recalcularse desde las tomas.
- El sitio debe funcionar sin JavaScript externo ni recursos remotos obligatorios.
- Las páginas principales y el modo Película deben tener pruebas de regresión.
