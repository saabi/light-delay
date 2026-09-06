# Datos estructurados

Datos estructurados del proyecto. La autoridad narrativa WIP vive en `outlines/light-delay-master-narrative.json`; los productos anteriores permanecen archivados y clasificados por `editorial-lifecycle.json`. Se validan con `npm run validate:data`; `npm run extract:legacy` ya no es un regenerador seguro del árbol actual y no debe ejecutarse sobre `data/`.

| Archivo | Contenido |
| --- | --- |
| `project.json` | Metadatos, idiomas, autoridad narrativa, continuidades y registro de scripts (`sourceLanguage: es`) |
| `editorial-lifecycle.json` | Clasificación segura de autoridad, compatibilidad, archivo, obsolescencia y compuertas de borrado |
| `outlines/light-delay-master-narrative.json` | Escaleta maestra bilingüe WIP y fuente narrativa vigente |
| `scripts/*.json` | Stub maestro vacío y productos anteriores deprecados con actos, escenas, beats, cues, shots y takes |
| `characters.json` / `locations.json` / `objects.json` / `vehicles.json` / `factions.json` | Entidades |
| `assets.json` | Rutas públicas `/assets/...` para binarios en `static/assets/` |
| `voice-profiles.json` | Timbre común y perfiles ES/EN de formación, prosodia, estilo, proveedor y muestras de voz |
| `production/audio/audience-dialogue-performance.json` | Intención dramática e indicaciones EN/ES por ID estable; referencia al outline maestro que aporta la revisión |
| `documents.json` | Cinco documentos prose ES/EN extraídos, canon estructurado aún como stub y tres referencias históricas/editoriales en revisión |
| `narrative-functions.json` / `entity-variants.json` | Funciones dramáticas compartidas y perfiles específicos por guion |
| `comparison-taxonomy.json` | Dimensiones de canon y eventos principales comparables entre scripts |
| `translations/entities.en.json` | Overlay inglés por id para galerías de entidades (deuda: migrar a inline) |
| `translations/public.en.json` | Retirado para copy de historia (mapa vacío); no reintroducir overlays por texto ES |

El copy de guiones, outlines, assets, taxonomía, funciones y variantes lleva idiomas **inline** (`LocalizedString` / `variants.en`). `npm run validate:translations` exige `es` y `en` no vacíos en esos campos. Paraglide cubre el chrome de UI.

Autoridad de esquema: `docs/JSON_FORMAT.md` + `docs/JSON_FORMAT_I18N_ADDENDUM.md`. La escaleta maestra es la fuente narrativa; el stub de guion sólo sostiene el registro y las rutas hasta que existan derivados. La comparación es declarativa: una ausencia de datos se muestra como no especificada y no activa inferencias de fusiones, divisiones o herencia de diálogo.
