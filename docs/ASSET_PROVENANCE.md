# Procedencia de assets

## Inventario actual

- **703 assets registrados** en `data/assets.json` (incluidos 104 frames de animatic archivados, stills y clips de storyboard del Festival Master, 1 fotograma negro del tráiler-master, 62 referencias, 1 placeholder y los recursos de voz registrados).
- 100 fotogramas legacy del animatic en 17 escenas.
- 1 fotograma nuevo de escena 5 toma 7 (Harlan / COM A/B) en `static/assets/animatic/frames/scene-05/shot-07.png`.
- La hoja de referencia de Harlan fue regenerada como `static/assets/characters/harlan/model-sheet-v2.png` para separar su identidad visual de Voss; la hoja anterior permanece como procedencia histórica.
- Dara Okoye cuenta con una hoja propia en `static/assets/characters/okoye/model-sheet.png`: identidad nigeriana, traje de seguridad de a bordo y equipo de inmovilización no letal. La hoja genérica de seguridad se usó sólo como referencia de vestuario y permanece separada.
- Se separaron las referencias de `manifestante-acheron` y `joven-contacto` desde la hoja combinada de manifestantes; la hoja grupal se conserva para multitudes.
- Se añadió `periodista/model-sheet.png` como referencia neutral para posibles insertos de la transmisión terrestre; su voz en off no cambia.
- 3 cartelas de título (main/Festival, marca y lema del tráiler) en `static/assets/animatic/titles/`.
- 62 imágenes de referencia para personajes, localizaciones, vehículos, objetos, escala, presentación y bloqueo 3D.
- 1 placeholder técnico para frames faltantes o fallidos.
- No hay todavía assets de audio ni video registrados.
- Las tres referencias realistas del puente están registradas como assets independientes; conservan proveedor, fecha, referencias de entrada y elegibilidad no verificada.
- La campaña de afiches V1 añade 16 imágenes de marketing —ocho piezas en español y sus ocho versiones inglesas— bajo `static/assets/marketing/posters/v1/`. Su manifiesto específico registra orientación, dimensiones, copy, pares localizados y referencias canónicas; todavía no forman parte de los 143 assets del grafo narrativo.

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

- 360 de 480 assets no tienen objeto `source`;
- 115 assets incluyen ahora proveedor/modelo exactos por su generación GPT-Image-2;
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
