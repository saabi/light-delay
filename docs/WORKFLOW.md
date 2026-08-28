# Flujo de trabajo documental y de datos

## Principio

El español es la fuente editorial. Cada guion o cut tiene un único `ScriptFile`; lector, animatic, player y subtítulos se proyectan desde ese archivo. Las traducciones y el estado editorial no crean una segunda continuidad ni sustituyen los IDs estables.

## Fuentes vigentes

- `AGENTS.md`: reglas de trabajo y autoridad de idioma.
- `docs/CANON_DECISIONS.md`: decisiones de canon transversales.
- `data/project.json`: idiomas, continuidades y registro de scripts.
- `data/scripts/*.json`: actos, escenas, beats, cues, shots y takes de cada producto.
- `data/characters.json`, `locations.json`, `objects.json`, `vehicles.json` y `factions.json`: entidades compartidas.
- `data/assets.json`: medios, rutas públicas, procedencia y estado visual.
- `data/documents.json`: documentos estructurados que renderiza el sitio.
- `data/comparison-taxonomy.json`, `narrative-functions.json` y `entity-variants.json`: comparación declarativa entre scripts.

`legacy-site/` y los planes de migración históricos se conservan para regresión y procedencia; no son destinos de autoría.

## Cambio narrativo

1. Leer las autoridades indicadas en `AGENTS.md`.
2. Editar primero el español del `ScriptFile` correspondiente sin reutilizar IDs de otro cut.
3. Actualizar o marcar obsoletas sus traducciones en la misma tarea.
4. Derivar subtítulos desde los cues de diálogo; no mantener una copia independiente.
5. Actualizar canon, estado y changelog cuando corresponda.
6. Ejecutar `npm run validate:data`, `npm run validate:docs`, checks y regresiones relevantes.

Los cuts derivados tienen `lineage`, no herencia en vivo: un cambio del corto no modifica silenciosamente Festival Cut, tráiler o largometraje.

## Cambio de animatic o medios

- La duración efectiva pertenece a cada shot y el total se deriva.
- Cada take pertenece a un shot y referencia assets por ID.
- No regenerar imágenes existentes sin autorización explícita.
- Marcar imágenes provisionales, faltantes o incompatibles mediante el estado editorial estructurado.
- La edición guardada en `localStorage` es un borrador del navegador, no la autoridad del JSON.

## Cambio documental

- Corregir primero la fuente española y sincronizar otras lenguas.
- Distinguir estado vigente, baseline histórico y fuente no canónica.
- Eliminar tareas o snapshots consumidos cuando su resultado ya esté en `PROJECT_STATUS.md`, `TODO.md` o `CHANGELOG.md`; Git conserva su historia.
- No copiar cifras derivables sin validarlas contra los JSON. `npm run validate:docs` comprueba los inventarios activos y los enlaces Markdown locales.
