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

Durante las fases 3 y 5 se **copia** (no se mueve) para conservar `legacy-site/` como regresión. Los JSON `Asset.path` usan la URL pública `/assets/...`.

Git LFS sigue aplicando a PNG/JPEG/WebP/video vía `.gitattributes`.
