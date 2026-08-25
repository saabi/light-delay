# Flujo de trabajo documental y de datos

## Principio

El estado final debe tener una única fuente de datos estructurada. Las vistas de guion, biblia y animatic son proyecciones de esos datos, no documentos divergentes mantenidos manualmente.

## Orden de migración

1. Inventariar el contenido embebido en cada HTML.
2. Definir esquemas e IDs antes de extraer datos.
3. Convertir primero entidades estables: personajes, lugares, vehículos y props.
4. Convertir escenas, diálogos y tomas preservando orden y referencias.
5. Validar recuentos, rutas, tiempos y subtítulos.
6. Crear componentes Svelte compartidos.
7. Reproducir las páginas existentes.
8. Añadir edición, persistencia y exportación.
9. Retirar duplicaciones sólo después de pruebas de regresión.

## Separación sugerida

- `data/project.json`: metadatos y versiones.
- `data/canon.json`: reglas y decisiones verificables por herramientas.
- `data/characters.json`: personajes y facciones.
- `data/locations.json`: localizaciones.
- `data/vehicles.json`: naves.
- `data/props.json`: objetos.
- `data/scripts/*.json`: escenas, acción y diálogo por cut (canónico: `light-delay-main-short.json`).
- `data/shots.json`: tomas, duración, cámara, audio, subtítulos y asset.
- `data/assets.json`: procedencia y rutas.

Puede cambiarse esta partición después de diseñar los esquemas, pero el guion y las tomas deben compartir IDs explícitos.

## Duraciones

- La duración efectiva pertenece a la toma.
- Los tiempos de escena y total se derivan, no se duplican.
- Los valores editados deben poder exportarse a JSON.
- `localStorage` puede usarse como borrador local, pero no como única persistencia.

## Contenido editorial

- Conservar el texto original durante la extracción.
- Separar los cambios narrativos de las transformaciones mecánicas.
- Registrar toda modificación de canon en `CANON_DECISIONS.md` y, posteriormente, en datos estructurados.

