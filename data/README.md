# Datos estructurados

JSON canónicos extraídos del sitio legacy (`npm run extract:legacy`) y validados con `npm run validate:data`.

| Archivo | Contenido |
| --- | --- |
| `project.json` | Metadatos del proyecto e idiomas (`sourceLanguage: es`) |
| `script.json` | Actos, escenas, beats, cues, shots, takes |
| `characters.json` / `locations.json` / `objects.json` / `vehicles.json` / `factions.json` | Entidades |
| `assets.json` | Rutas públicas `/assets/...` (binarios aún en `legacy-site/`) |
| `voice-profiles.json` | Perfiles de voz por idioma |
| `documents.json` | Bloques de prosa (notas técnicas extraídas; resto stubs) |

Autoridad de esquema: `docs/JSON_FORMAT.md` + `docs/JSON_FORMAT_I18N_ADDENDUM.md`. El guion es la fuente narrativa; ver `docs/SCRIPT_ANIMATIC_SYNC.md`.
