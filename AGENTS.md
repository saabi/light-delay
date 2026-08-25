# Instrucciones para agentes

## Objetivo

Transformar gradualmente el paquete estático de Light Delay en una aplicación SvelteKit basada en datos, sin perder canon, contenido, imágenes ni comportamiento.

## Reglas obligatorias

- Leer `README.md`, `docs/CANON_DECISIONS.md` y `docs/PROJECT_STATUS.md` antes de modificar narrativa o estructura.
- Tratar `legacy-site/` como referencia de regresión hasta completar la migración.
- No reescribir el canon para resolver una dificultad de implementación.
- No inventar datos ausentes. Marcar incertidumbres y decisiones pendientes.
- Mantener IDs estables para escenas y tomas; no usar el índice del array como identidad persistente.
- Separar datos narrativos, presentación y estado editorial.
- El guion textual y el animatic deben renderizarse desde una única fuente de datos.
- Los subtítulos deben derivarse del diálogo de cada toma, no mantenerse como una copia independiente sin validación.
- Preservar la reproducción a pantalla completa, play/pausa/stop, navegación, timeline, panel de detalles y retorno a edición conservando posición.
- No regenerar imágenes existentes salvo instrucción explícita.
- Actualizar `CHANGELOG.md` y `docs/PROJECT_STATUS.md` después de cambios materiales.

## Arquitectura prevista

- SvelteKit + TypeScript en la raíz.
- `src/lib/components/`: componentes documentales y del animatic.
- `src/lib/data/`: carga y validación de JSON.
- `src/lib/types/`: contratos TypeScript derivados o sincronizados con esquemas.
- `data/`: JSON canónicos y esquemas legibles por otras herramientas.
- `static/assets/`: destino futuro de imágenes una vez migradas desde `legacy-site/assets/`.

No mover los assets a `static/` hasta actualizar y verificar todas las referencias.

## Validación mínima futura

- El total de escenas debe ser 17 y el de tomas 100, salvo cambio narrativo documentado.
- Todas las rutas de imágenes deben existir.
- La duración total debe recalcularse desde las tomas.
- El sitio debe funcionar sin JavaScript externo ni recursos remotos obligatorios.
- Las páginas principales y el modo Película deben tener pruebas de regresión.

