# Datos estructurados

JSON canónicos extraídos del sitio legacy (`npm run extract:legacy`) y validados con `npm run validate:data`.

| Archivo | Contenido |
| --- | --- |
| `project.json` | Metadatos, idiomas, continuidades y registro de scripts (`sourceLanguage: es`) |
| `scripts/*.json` | Actos, escenas, beats, cues, shots y takes de cada guion/cut; incluye corto, largometraje, festival y tráiler |
| `characters.json` / `locations.json` / `objects.json` / `vehicles.json` / `factions.json` | Entidades |
| `assets.json` | Rutas públicas `/assets/...` para binarios en `static/assets/` |
| `voice-profiles.json` | Perfiles de voz por idioma |
| `documents.json` | Bloques de prosa (notas técnicas extraídas; resto stubs) |
| `narrative-functions.json` / `entity-variants.json` | Funciones dramáticas compartidas y perfiles específicos por guion |
| `comparison-taxonomy.json` | Dimensiones de canon y eventos principales comparables entre scripts |

Autoridad de esquema: `docs/JSON_FORMAT.md` + `docs/JSON_FORMAT_I18N_ADDENDUM.md`. El guion es la fuente narrativa; ver `docs/SCRIPT_ANIMATIC_SYNC.md`. La comparación es declarativa: una ausencia de datos se muestra como no especificada y no activa inferencias de fusiones, divisiones o herencia de diálogo.
