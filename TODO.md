# Deuda editorial y técnica pendiente

Este archivo registra trabajo detectado pero deliberadamente fuera del alcance de la reescritura de las escenas 5–8. El español es la fuente de verdad. Las tareas resueltas deben eliminarse o trasladarse al historial correspondiente.

## Prioridad alta

### Notas editoriales estructuradas en JSON

- **Archivos afectados:** `src/lib/types/`, `data/`, `scripts/`, `package.json`.
- **Problema:** las notas actuales no ofrecen un flujo uniforme para observaciones humanas accionables ni para deuda visual.
- **Fuente:** separación obligatoria entre narrativa, presentación y estado editorial en `AGENTS.md`.
- **Trabajo:** ampliar `Note` con `id`, tipos editoriales/técnicos/visuales, `status`, `priority`, acción sugerida, criterio de aceptación, rutas objetivo, autor y fechas opcionales. Habilitar notas en proyecto, scripts, actos, secuencias, escenas, beats, cues, tomas, takes, entidades, assets, documentos y declaraciones de canon cuando aporte valor.
- **Compatibilidad:** migrar gradualmente `resolved?: boolean`; las notas sin estado siguen siendo informativas.
- **Informe:** añadir `npm run notes:build` para generar de forma determinista `docs/PENDING_AUTHOR_NOTES.md`, agrupado por prioridad y entidad, con archivo y JSON path exactos. Excluir notas resueltas y advertir que el archivo generado no se edita directamente.
- **Cierre:** tipos, validador, migración, pruebas y script funcionan; una nota eliminada del JSON desaparece del informe al regenerarlo.

## Prioridad media

### Stills definitivos para la secuencia de Zao

- **Archivos afectados:** los 33 takes con `imageStatus.status = needs_replacement` de las escenas 5–8.
- **Problema:** las 33 tomas reescritas de las escenas 5–8 —incluidas doce tomas añadidas— reutilizan 21 frames heredados que no representan exactamente vestíbulo, cilindros, tablero cableado, microgravedad o reanimación.
- **Fuente:** `docs/technical/CELESTIAL_ARDOR.md` y guion principal revisado.
- **Cierre:** cada take provisional se reemplaza por un still coherente sin cambiar su `shotId`.

### Presupuesto físico del enlace láser

- **Archivos afectados:** `docs/SIGNAL_BEAM_REQUIREMENTS.md`, futuras interfaces y notas de producción.
- **Problema:** la estimación heredada de 0,043° provenía de supuestos de radio y «salida FTL» ya descartados.
- **Trabajo:** fijar incertidumbre de trayectoria, longitud de onda, apertura, energía por pulso, codificación y sensibilidad del receptor; comprobar que divergencia + raster cubran la elipse sin volver estos números exposición hablada.
- **Cierre:** cálculo reproducible revisado por física/telecomunicaciones y UI consistente con sus órdenes de magnitud.

### Geometría visual antigua de Celestial Ardor

- **Archivos afectados:** hojas del puente/nave, frames con ventanal frontal, cubiertas longitudinales o núcleo axial, biblia visual y metadatos asociados.
- **Problema:** parte del arte antecede a las cubiertas transversales, los tres troncos y el núcleo excéntrico.
- **Cierre:** arte y metadatos respetan la referencia técnica sin regenerar imágenes hasta recibir autorización expresa.

### Persecución posterior bajo 1 g

- **Archivos afectados:** escenas 13–14 del corto y equivalentes derivados.
- **Problema:** algunos desplazamientos se describen como carreras horizontales incompatibles con cubiertas transversales bajo desaceleración.
- **Cierre:** revisar el uso del ascensor, cilindro central y ramal del núcleo sin alterar el resultado del clímax.

### Atraque y escala de Proxima

- **Archivos afectados:** guiones, animatics, biblia y documentos que muestren rampas, hangares internos o escalas antiguas.
- **Problema:** Ardor debe atracar exteriormente por la proa mediante collar presurizado y conservar escala de trabajo de 90 m frente a Proxima.
- **Fuente:** `docs/technical/CELESTIAL_ARDOR.md` y `docs/technical/PROXIMA_STATION.md`.
- **Cierre:** no quedan descripciones activas de la nave dentro de un hangar gigante.

### Localización al inglés (sitio y diálogo)

- **Archivos afectados:** UI SvelteKit (`src/`), textos de documentos/páginas, cues de diálogo en `data/scripts/*.json`, contratos i18n en `docs/JSON_FORMAT.md` / addendum, y cualquier capa de idioma activa en la app.
- **Problema:** el producto y el diálogo viven hoy en español; hace falta una capa en inglés sin convertir el EN en fuente de autoría.
- **Trabajo:**
  - Traducir la interfaz y el copy del sitio web al inglés (navegación, labels, páginas documentales renderizadas, mensajes de UI).
  - Añadir traducciones en inglés del diálogo (y subtítulos derivados) en los scripts, manteniendo el español como fuente de verdad; el EN es traducción revisable, no reescritura paralela del canon.
- **Cierre:** un visitante puede usar el sitio en inglés; el diálogo/subtítulos EN existen y se validan frente al ES; ante conflicto prevalece el español (`AGENTS.md`).

### Texto completo del sitio legacy en la app SvelteKit

- **Archivos afectados:** `legacy-site/*.html`, `data/documents.json`, rutas `/documents/*`, extractores y páginas Svelte pendientes.
- **Problema:** parte del contenido prose del paquete estático aún no está en la aplicación basada en datos; la migración no está completa mientras falte texto accesible desde `legacy-site/index.html`.
- **Fuente:** criterio de migración en `docs/PROJECT_STATUS.md` y `legacy-site/` como referencia de regresión (`AGENTS.md`).
- **Trabajo:** inventariar todo el texto del legacy (documentos, notas, biblias, reportes, listados) e incorporarlo a la app vía JSON/documentos o páginas equivalentes, sin inventar contenido ausente.
- **Cierre:** todo el texto legible del legacy tiene equivalente navegable en el sitio nuevo; los stubs quedan eliminados o marcados explícitamente si la extracción editorial debe posponerse.

## Prioridad baja

### Sincronización de documentos heredados no esenciales

- **Archivos afectados:** reportes, inventarios, biblias y mirrors fuera de la cadena autoritativa inmediata.
- **Problema:** pueden conservar terminología o geometría anterior de nave, comunicaciones y partición.
- **Cierre:** auditoría completa, actualización desde las fuentes españolas y registro de cualquier traducción pospuesta en `docs/PROJECT_STATUS.md`.
