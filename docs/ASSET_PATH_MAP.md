# Mapa de assets: legacy → static

Patrón canónico:

| Origen | Disco destino | URL pública |
| --- | --- | --- |
| `legacy-site/assets/<tree>/...` | `static/assets/<tree>/...` | `/assets/<tree>/...` |

Ejemplos:

- `legacy-site/assets/animatic/frames/scene-01/shot-01.png` → `static/assets/animatic/frames/scene-01/shot-01.png` → `/assets/animatic/frames/scene-01/shot-01.png`
- `legacy-site/assets/characters/.../model-sheet.png` → `static/assets/characters/.../model-sheet.png` → `/assets/characters/.../model-sheet.png`
- `legacy-site/assets/locations/...` → `static/assets/locations/...` → `/assets/locations/...`
- `legacy-site/assets/props/...` → `static/assets/props/...` → `/assets/props/...`
- `legacy-site/assets/vehicles/...` → `static/assets/vehicles/...` → `/assets/vehicles/...`
- `legacy-site/assets/art-bible/...` → `static/assets/art-bible/...` → `/assets/art-bible/...`

### Hojas canónicas vs referencias de escala

| Ámbito | Disco | Nombre típico |
| --- | --- | --- |
| Localización (estilo) | `static/assets/locations/<slug>/` | `concept-sheet.png` |
| Vehículo (estilo) | `static/assets/vehicles/<slug>/` | `model-sheet.png` |
| Proporciones por entidad | misma carpeta de entidad | `proportional-reference.svg` (+ `.png` raster) |
| Comparativa multi-entidad | `static/assets/art-bible/scale-references/` | p. ej. `proxima-ardor-common-scale-reference.{svg,png}` |

Las hojas proporcionales **no sustituyen** concept/model sheets. Las comparativas de escala común (estación + nave, etc.) viven en `art-bible/scale-references/` porque no pertenecen a una sola entidad.

Durante las fases 3 y 5 se **copia** (no se mueve) para conservar `legacy-site/` como regresión. Los JSON `Asset.path` usan la URL pública `/assets/...`.

Git LFS sigue aplicando a PNG/JPEG/WebP/video vía `.gitattributes`.
