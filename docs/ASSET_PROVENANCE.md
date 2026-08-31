# Procedencia de assets

## Inventario actual

- **139 imágenes registradas** en `data/assets.json`.
- 100 fotogramas legacy del animatic en 17 escenas.
- 1 fotograma nuevo de escena 5 toma 7 (Harlan / COM A/B) en `static/assets/animatic/frames/scene-05/shot-07.png`.
- 3 cartelas de título (main/Festival, marca y lema del tráiler) en `static/assets/animatic/titles/`.
- 34 imágenes de referencia para personajes, localizaciones, vehículos, objetos, escala, presentación y bloqueo 3D.
- 1 placeholder técnico para frames faltantes o fallidos.
- No hay todavía assets de audio ni video registrados.
- Las tres referencias realistas del puente están registradas como assets independientes; conservan proveedor, fecha, referencias de entrada y elegibilidad no verificada.
- La campaña de afiches V1 añade 16 imágenes de marketing —ocho piezas en español y sus ocho versiones inglesas— bajo `static/assets/marketing/posters/v1/`. Su manifiesto específico registra orientación, dimensiones, copy, pares localizados y referencias canónicas; todavía no forman parte de los 139 assets del grafo narrativo.

Los manifests existentes se encuentran bajo `legacy-site/assets/` y documentan nombres, rutas, categorías y descripciones visuales.

## Estado de procedencia

Los assets fueron generados con herramientas de generación de imágenes asistidas por IA durante el desarrollo del proyecto. Sin embargo, el paquete actual no conserva de forma completa y verificable para cada archivo:

- prompt exacto;
- prompt negativo;
- modelo y versión exacta;
- seed;
- parámetros de tamaño/calidad;
- imágenes de referencia utilizadas;
- historial de ediciones;
- identificador de generación o comprobante de plataforma.

Auditoría de corte 2026-08-28:

- 135 de 139 assets no tienen objeto `source`;
- los 139 carecen de modelo/versionado exacto verificable;
- el placeholder técnico y las tres referencias realistas del puente registran proveedor y fecha de generación;
- ningún asset registra todavía elegibilidad verificada para concurso.

No debe inventarse esa información. Cuando no pueda recuperarse, registrar el campo como `unknown`.

## Registro futuro mínimo

Cada asset nuevo debería registrar:

```json
{
  "id": "scene-01-shot-01",
  "path": "static/assets/animatic/frames/scene-01/shot-01.png",
  "kind": "animatic-frame",
  "createdAt": "2026-08-25",
  "provider": "unknown",
  "model": "unknown",
  "prompt": "unknown",
  "negativePrompt": null,
  "seed": null,
  "references": [],
  "edits": [],
  "competitionEligible": "unverified"
}
```

## Cumplimiento

- No asumir que una imagen de planificación es admisible en un concurso.
- Conservar comprobantes de generación cuando una plataforma exija que el contenido final haya sido producido dentro de su servicio.
- Revisar términos de uso, derechos comerciales y requisitos de atribución antes de publicación o distribución.
- Mantener separados los assets de referencia y los assets finales de producción.
