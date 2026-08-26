# TODO — Higgsfield uploads

## Excluidos de este lote

- **Harlan** y **Rao** no se copian a `higgsfield-uploads/` ni deben subirse todavía.

## Pendiente de redesign

1. **Harlan** se parece demasiado al capitán (**Voss**). Hace falta un rediseño visual (silueta, rasgos, vestuario) que los separe con claridad en model sheets y frames.
2. **Rao** suena demasiado a **Zao** (nombre / fonética). Pendiente: renombre o distinción onomástica acordada en canon, y regeneración de hojas si cambia el nombre en UI.

## Cuando estén listos

1. Resolver el redesign (arte + decisión de nombre).
2. Añadir slugs `harlan` / `rao` (o el nuevo slug de Rao) al mapa en `scripts/prepare-higgsfield-uploads.mjs`.
3. Quitarlos de `SKIP_CHARACTER_SLUGS` si aplica.
4. Ejecutar `npm run prepare:higgsfield` y actualizar este TODO.
