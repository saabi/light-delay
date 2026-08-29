# TODO — Higgsfield uploads

## Excluidos de este lote

- **Harlan** no se copia a `higgsfield-uploads/` ni debe subirse todavía.

## Pendiente de redesign

1. **Harlan** se parece demasiado al capitán (**Voss**). Hace falta un rediseño visual (silueta, rasgos, vestuario) que los separe con claridad en model sheets y frames.

## Nombre de Elin resuelto

- Se conservan el nombre legal **Elin Rao**, el ID `character:rao`, el slug `rao` y los paths existentes.
- En diálogo, cartelas y texto operativo se usa **Elin**, por lo que ya no se confunde auditivamente con Zao.
- Su sheet existente puede copiarse como referencia; esto no habilita regeneración de tomas ni producción visual.

## Cuando estén listos

1. Resolver el rediseño visual de Harlan.
2. Añadir el slug `harlan` al mapa en `scripts/prepare-higgsfield-uploads.mjs`.
3. Quitar `harlan` de `SKIP_CHARACTER_SLUGS`.
4. Ejecutar `npm run prepare:higgsfield` sólo cuando se quiera refrescar el staging y actualizar este TODO.
