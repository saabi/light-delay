# Auditoría temporal de referencias de imagen

**Fecha:** 2026-09-05
**Estado:** informe temporal; no sustituye `data/assets.json` ni los informes generados.

## Referencias rotas

No hay assets registrados cuya ruta apunte a un archivo inexistente.

- Assets registrados: **143**
- Archivos ausentes: **0**
- Referencias desconocidas: **0**
- Miniaturas faltantes: **0**
- `npm run validate:data`: correcto

## Entidades sin imagen

Estas entidades no tienen una referencia raster asignada:

- `character:keene` — Marcus Keene
- `location:celestial-ardor-command-vestibule`
- `location:celestial-ardor-central-access`
- `location:celestial-ardor-service-cylinder`

Son huecos de referencia de entidad, no rutas rotas.

## Archivos presentes pero no registrados

Se encontraron **22** imágenes en `static/assets/` sin entrada correspondiente en `data/assets.json`.

### Posiblemente obsoletos o sustituidos

- `static/assets/characters/harlan/model-sheet.png` — sustituido por la hoja registrada `model-sheet-v2.png`.
- `static/assets/animatic/frames/scene-03/d0c33674-2e10-4dc7-a4d2-13731f2f16cd.png` — frame generado sin procedencia/registro actual.
- `static/assets/locations/proxima-station/blender-proxima-with-ardor-berthed.png` — render de staging de Blender.
- `static/assets/vehicles/celestial-ardor/celestial-ardor-berthed-pov-behindish.png`
- `static/assets/vehicles/celestial-ardor/celestial-ardor-berthed-pov-behindish-illum2.png` — renders auxiliares sin entrada actual.

### Material de marketing fuera del catálogo de assets

- `static/assets/marketing/light-delay-cover-v1.png`
- Los 16 carteles localizados en `static/assets/marketing/posters/v1/`

Estos archivos parecen entregables de marketing, no referencias narrativas. Debe decidirse si se registran en un manifiesto específico de marketing o si se documentan explícitamente como material fuera de `data/assets.json`.

## Interpretación

- **Referencias rotas:** ninguna.
- **Entidades sin imagen:** cuatro.
- **Imágenes generadas no referenciadas:** 22.
- **Assets registrados físicamente disponibles:** los 143 tienen archivo existente; esto no implica que todos estén aprobados para producción ni que no exista deuda editorial/visual. Okoye ya cuenta con una hoja propia; la hoja genérica de seguridad permanece disponible para extras.

## Próximas decisiones

1. Crear referencias para Keene y las tres ubicaciones interiores si se necesitan en prompts.
2. Resolver la procedencia o retiro del frame huérfano y de los renders auxiliares.
3. Registrar o excluir explícitamente los materiales de marketing.
4. Retirar la hoja antigua de Harlan sólo cuando se confirme que la procedencia histórica queda preservada.
