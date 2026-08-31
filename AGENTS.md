# Instrucciones para agentes

## Objetivo

Transformar gradualmente el paquete estático de Light Delay en una aplicación SvelteKit basada en datos, sin perder canon, contenido, imágenes ni comportamiento.

## Idioma y autoridad documental

El español es la fuente de verdad de la documentación del repositorio.

- Si un documento existe en varios idiomas, **editar primero la copia en español**. Las demás lenguas son traducciones o adaptaciones, no fuentes paralelas de autoría.
- Si **no hay copia en español**, el inglés es el idioma secundario de trabajo hasta que exista versión española (o se decida explícitamente dejarlo solo en inglés).
- Tras cualquier cambio material, **actualizar las copias en otros idiomas en la misma tarea** (o dejar marcado y visible el desfase en `docs/PROJECT_STATUS.md` si la sincronización debe posponerse).
- No introducir divergencias de canon, procedimiento o estado entre idiomas. Ante conflicto, prevalece la versión española.
- El copy de historia en JSON (guiones, outlines, assets, entidades, taxonomía, funciones, variantes, etiquetas de script) vive **en el mismo archivo** como mapas por idioma (`{ "es": "…", "en": "…" }`) o, en diálogo/texto, como `content.variants.<lang>`. Tras editar el español, actualizar el inglés hermano en el mismo pase. La UI chrome sigue en Paraglide (`messages/*.json`). No reintroducir overlays de traducción por texto o por id.
- Convención de nombres cuando haya pares: `nombre.md` o `nombre.es.md` para español; `nombre.en.md` (u otro sufijo de idioma) para el resto. Si solo hay un archivo sin sufijo, su idioma debe inferirse del contenido; al crear la segunda lengua, renombrar o añadir sufijos de forma explícita.
- `AGENTS.md` es el único lugar canónico de instrucciones para agentes (cualquier modelo o plataforma). Otras guías de herramienta deben **referenciar** este archivo, no duplicar reglas.

## Reglas obligatorias

- Leer este archivo completo al inicio de cada sesión de trabajo en el repositorio.
- Leer `README.md`, `docs/CANON_DECISIONS.md` y `docs/PROJECT_STATUS.md` antes de modificar narrativa o estructura. Si el trabajo toca guion o animatic de un cut, leer también `docs/GUIA_ESCALETA.md` (contrato en `docs/ESCALETA.md`).
- Antes de crear o ampliar guion/animatic de un cut, asegurar escaleta en `data/outlines/` (crear si falta, respetando causalidad) y verificar que el guion/animatic existentes la respetan; procedimiento en `docs/GUIA_ESCALETA.md`.
- Tratar `legacy-site/` como referencia de regresión hasta completar la migración.
- No reescribir el canon para resolver una dificultad de implementación.
- No inventar datos ausentes. Marcar incertidumbres y decisiones pendientes.
- Evitar la exposición forzada: no tratar al público como incapaz de inferir. La información se revela de forma natural (pensamiento en acción, decisión bajo presión, consecuencia visible), no con diálogos o monólogos que explican el mundo «para el espectador». Ejemplo: cuando Zao decide dónde apuntar el láser y por qué elige la posición futura de la nave, son su propio razonamiento y la elección lo que exponen el porqué; no hace falta que alguien se lo diga a la audiencia.
- La capa `story` de cada escaleta debe contar una historia continua y causalmente completa con los detalles cerrados. Los pasos `detail`, notas o conocimiento externo no pueden reparar una causa, sujeto o consecuencia ausente del resumen principal.
- Preservar las omisiones deliberadas de cada cut en todo dato público, incluidas traducciones, metadatos, IDs, referencias y descripciones heredadas. En particular, el tráiler no identifica al culpable ni confirma el envío, la recepción o la muerte de Zao; sólo puede insinuar que ella descubrió a una persona responsable y que quedó en peligro.
- No confundir exposición forzada con razonamiento dramático: la escaleta debe conservar causas, alternativas descartadas, motivaciones, suposiciones (incluso erróneas) y consecuencias cruciales. Un personaje puede pensar en acción o hablar para sí cuando eso revela una decisión o profundidad propia, no para impartir una lección al público.
- No reemplazar una versión narrativa más reciente por otra anterior sin verificar procedencia y pedir confirmación ante la duda. Si falta una causa necesaria, detener el trabajo narrativo bloqueado y consultar. Sólo con autorización explícita se puede avanzar dejando una nota/TODO de causa no resuelta o propuestas alternativas.
- Mantener IDs estables para escenas y tomas; no usar el índice del array como identidad persistente. Los IDs de unidades de guion van namespaced por script (`main:…`, `festival:…`); las entidades de proyecto usan ids globales (`character:voss`).
- Separar datos narrativos, presentación y estado editorial.
- El guion textual y el animatic deben renderizarse desde una única fuente de datos **por script/cut** (`ScriptFile`); varios cuts se registran en `project.scripts` (véase `docs/ADR-0001-MULTI-SCRIPT-CONTINUITIES.md`).
- El guion canónico de ~30 min (`canonicalScriptId`) es la fuente de verdad narrativa del cortometraje principal. Cuts derivados (festival, trailer) no reescriben ese guion; se modelan como scripts independientes con `lineage`.
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

- El guion corto canónico debe conservar 17 escenas de historia más cartelas de título/créditos, y el animatic principal **128** tomas (124 de historia + título diferido + 3 créditos; pasada editorial de ritmo/diálogo de agosto 2026 más títulos/créditos), salvo cambio narrativo documentado. Los 100 PNG legacy son recursos reutilizados, no el recuento vigente de tomas.
- Todas las rutas de imágenes deben existir.
- La duración total debe recalcularse desde las tomas.
- El sitio debe funcionar sin JavaScript externo ni recursos remotos obligatorios.
- Las páginas principales y el modo Película deben tener pruebas de regresión.
