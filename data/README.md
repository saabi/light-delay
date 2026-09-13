# Datos estructurados

Datos estructurados del proyecto. La autoridad narrativa WIP vive en `outlines/light-delay-master-narrative.json`. La producción de pantalla WIP autorizada vive en `scripts/light-delay-festival-master.json` (y tráiler-master); los productos de la continuidad anterior permanecen archivados y clasificados por `editorial-lifecycle.json`. Agent day-one map: `docs/AGENT_ONBOARDING.md`. Se validan con `npm run validate:data`; `npm run extract:legacy` ya no es un regenerador seguro del árbol actual y no debe ejecutarse sobre `data/`.

| Archivo | Contenido |
| --- | --- |
| `project.json` | Metadatos, idiomas, autoridad narrativa, continuidades y registro de scripts (`sourceLanguage: en`) |
| `editorial-lifecycle.json` | Clasificación segura de autoridad, compatibilidad, archivo, obsolescencia y compuertas de borrado (incluye Festival-master / trailer-master como derivados WIP autorizados) |
| `outlines/light-delay-master-narrative.json` | Escaleta maestra bilingüe WIP y fuente narrativa vigente |
| `outlines/light-delay-festival-master.json` | Escaleta derivada del Corte Festival-master (producción WIP) |
| `outlines/light-delay-trailer-master.json` | Escaleta del tráiler-master |
| `scripts/light-delay-master-narrative.json` | Stub vacío de rutas/registro (no es el guion de producción) |
| `scripts/light-delay-festival-master.json` | Guion / shots / takes / prompts del Corte Festival-master (WIP autorizado) |
| `scripts/light-delay-trailer-master.json` | Tráiler-master derivado |
| `scripts/light-delay-{main-short,festival,trailer,long}.json` | Continuidad anterior deprecada (rescate) |
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

Autoridad de esquema: `docs/JSON_FORMAT.md` + `docs/JSON_FORMAT_I18N_ADDENDUM.md`. La escaleta maestra es la fuente narrativa; el stub de guion maestro sólo sostiene el registro y las rutas. Los derivados autorizados (Festival-master, trailer-master) ya tienen guion de producción. La comparación es declarativa: una ausencia de datos se muestra como no especificada y no activa inferencias de fusiones, divisiones o herencia de diálogo.
