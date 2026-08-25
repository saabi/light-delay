# Procedencia de assets

## Inventario actual

- 10 hojas de personajes.
- 7 hojas de localizaciones.
- 2 hojas de vehículos.
- 4 hojas de objetos clave.
- 100 fotogramas del animatic en 17 escenas.

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

