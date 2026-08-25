# Instrucciones para agentes

## Objetivo

Transformar gradualmente el paquete estático de Light Delay en una aplicación SvelteKit basada en datos, sin perder canon, contenido, imágenes ni comportamiento.

## Idioma y autoridad documental

El español es la fuente de verdad de la documentación del repositorio.

- Si un documento existe en varios idiomas, **editar primero la copia en español**. Las demás lenguas son traducciones o adaptaciones, no fuentes paralelas de autoría.
- Si **no hay copia en español**, el inglés es el idioma secundario de trabajo hasta que exista versión española (o se decida explícitamente dejarlo solo en inglés).
- Tras cualquier cambio material, **actualizar las copias en otros idiomas en la misma tarea** (o dejar marcado y visible el desfase en `docs/PROJECT_STATUS.md` si la sincronización debe posponerse).
- No introducir divergencias de canon, procedimiento o estado entre idiomas. Ante conflicto, prevalece la versión española.
- Convención de nombres cuando haya pares: `nombre.md` o `nombre.es.md` para español; `nombre.en.md` (u otro sufijo de idioma) para el resto. Si solo hay un archivo sin sufijo, su idioma debe inferirse del contenido; al crear la segunda lengua, renombrar o añadir sufijos de forma explícita.
- `AGENTS.md` es el único lugar canónico de instrucciones para agentes (cualquier modelo o plataforma). Otras guías de herramienta deben **referenciar** este archivo, no duplicar reglas.

## Reglas obligatorias

- Leer este archivo completo al inicio de cada sesión de trabajo en el repositorio.
- Leer `README.md`, `docs/CANON_DECISIONS.md` y `docs/PROJECT_STATUS.md` antes de modificar narrativa o estructura.
- Tratar `legacy-site/` como referencia de regresión hasta completar la migración.
- No reescribir el canon para resolver una dificultad de implementación.
- No inventar datos ausentes. Marcar incertidumbres y decisiones pendientes.
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

- El total de escenas debe ser 17 y el de tomas 100, salvo cambio narrativo documentado.
- Todas las rutas de imágenes deben existir.
- La duración total debe recalcularse desde las tomas.
- El sitio debe funcionar sin JavaScript externo ni recursos remotos obligatorios.
- Las páginas principales y el modo Película deben tener pruebas de regresión.
