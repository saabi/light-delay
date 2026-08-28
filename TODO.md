# Deuda editorial y técnica pendiente

Este archivo es el registro canónico de deuda editorial y técnica accionable que todavía no se resolvió. El español es la fuente de verdad. Las tareas resueltas deben eliminarse o trasladarse al historial correspondiente; `docs/PROJECT_STATUS.md` resume el estado y `CHANGELOG.md` conserva los cierres.

## Prioridad alta

### Autoridad de datos y extractor legacy seguro

- **Archivos afectados:** `package.json`, `scripts/extract-legacy.mjs`, `scripts/migrate-multi-script.mjs`, `README.md` y documentación de migración.
- **Problema:** `npm run extract:legacy` todavía escribe directamente sobre `data/project.json`, catálogos, assets, documentos y `docs/SCRIPT_ANIMATIC_SYNC.md` con el modelo anterior a multi-script. El propio extractor advierte que no debe ejecutarse sobre el árbol migrado, pero el comando continúa expuesto como si fuera de uso rutinario.
- **Riesgo:** una ejecución accidental puede reemplazar datos canónicos actuales y exigir una migración destructiva posterior.
- **Trabajo:** convertirlo en una herramienta archivística no destructiva que escriba en un directorio temporal, o retirarlo de los comandos públicos. Documentar con precisión qué generadores siguen siendo autoridad y cuáles sólo reconstruyen una fuente histórica.
- **Cierre:** ningún comando presentado como seguro puede sobrescribir datos canónicos actuales sin destino explícito, comprobación previa y diff revisable.

### Esquema único y validación efectiva

- **Archivos afectados:** `docs/JSON_FORMAT*.md`, `src/lib/types/`, `src/lib/data/validation/`, `scripts/validate-data.mjs` y repositorios de datos.
- **Problema:** los contratos se mantienen en Markdown, TypeScript y un validador JavaScript separado; los JSON se fuerzan mediante casts y `assertJsonModule` sólo comprueba que exista un objeto. Ya hay deriva observable: el tráiler contiene 29 notas `type: "editorial"`, valor ausente del contrato `Note`.
- **Trabajo:** elegir una autoridad ejecutable —JSON Schema o esquema runtime TypeScript— y derivar o sincronizar tipos y validación. Cubrir tipos de nota, foreign keys, relaciones padre/hijo, orden, pertenencia de takes, límites de cue placements y existencia real de archivos bajo `static/`.
- **Estado comprobado:** el grafo y los 132 paths actuales pasaron una auditoría puntual; la deuda es que el gate automático no evita futuras regresiones.
- **Cierre:** datos inválidos fallan en desarrollo y CI sin depender de casts; los validadores duplicados dejan de divergir.

### Gate de CI, formato y runtime soportado

- **Archivos afectados:** `.nvmrc`, `.github/workflows/pages.yml`, configuración de Playwright/Prettier y los 16 archivos señalados por `npm run lint`.
- **Problema:** Node 25 está fuera de soporte; CI no ejecuta lint ni E2E; `npm run lint` falla actualmente en Prettier aunque ESLint por separado pasa. Las 12 pruebas browser pasan localmente, pero no protegen el despliegue.
- **Trabajo:** migrar a una línea LTS soportada, formatear el árbol, ejecutar lint y Playwright en PR/push, y conservar descarga LFS + build con `BASE_PATH`.
- **Cierre:** instalación limpia, validación, check, lint, unit, E2E y build Pages pasan en CI sobre Node LTS.

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

### Traducción narrativa al inglés

- **Archivos afectados:** cues de diálogo, subtítulos derivados, texto de escenas/beats/tomas en `data/scripts/*.json` y contratos i18n.
- **Estado ya resuelto:** interfaz, landing, documentos prose y galerías tienen versiones inglesas; no deben volver a incluirse en esta deuda.
- **Problema pendiente:** el guion, el diálogo, los subtítulos y las descripciones narrativas de toma permanecen en español.
- **Trabajo:** añadir variantes inglesas desde la fuente española, con estado editorial revisable y sin convertir el inglés en autoría paralela del canon. Los subtítulos deben seguir derivándose del diálogo.
- **Cierre:** un visitante puede leer o reproducir cada script en ES/EN; la validación detecta variantes ausentes o desactualizadas y ante conflicto prevalece el español (`AGENTS.md`).

### Madurez editorial de documentos, scripts y medios

- **Estado medido:** los cuatro scripts están en `draft`; las cinco traducciones inglesas de documentos prose están en `draft` y ninguna en `reviewed`; el documento de canon sigue como `stub` y tres documentos históricos/revisión sólo tienen un bloque español de referencia.
- **Medios:** los 132 assets registrados son imágenes. No hay audio ni video; los diez perfiles de voz no tienen muestras.
- **Cobertura visual:** 10 de los 21 personajes catalogados no tienen asset de referencia. No todos necesitan model sheet; priorizar según el cut que entre en producción y no generar arte sin autorización.
- **Trabajo:** definir qué estados deben alcanzar antes de una publicación/festival, revisar las traducciones prose, completar la proyección estructurada del canon y planificar audio/video sin confundir material de referencia con producción final.
- **Cierre:** los estados editoriales describen una revisión real, el sitio no presenta borradores como aprobados y cada medio final tiene procedencia y elegibilidad verificadas.

### Cobertura de regresión del modo Película

- **Problema:** las regresiones browser actuales cubren navegación, responsive básico, detalle de toma y retorno al editor, pero no ejercitan fullscreen real, play/pausa/stop, subtítulos, controles de teclado, conservación de estado al rotar ni varios motores de navegador.
- **Trabajo:** ampliar Playwright y ejecutar la suite en CI; añadir una comprobación visual/accesible proporcionada al riesgo de los layouts responsive.
- **Cierre:** las funciones obligatorias de `AGENTS.md` cuentan con pruebas estables y ejecutadas en el gate de publicación.

## Prioridad baja

### Limpieza de duplicados binarios tras paridad

- **Estado medido:** `legacy-site/assets/` y `static/assets/` comparten 129 archivos byte-idénticos, aproximadamente 216 MiB duplicados. Dos archivos de índice/manifest difieren legítimamente.
- **Restricción:** `legacy-site/` sigue siendo referencia de regresión hasta el cierre formal de migración; no borrar antes de esa aprobación.
- **Cierre:** registrar la revisión de paridad y después retirar copias redundantes o archivar todo el paquete legacy de manera recuperable.

### Separación del motor reutilizable

- **Problema:** aplicación, contratos y contenido de Light Delay siguen acoplados; no existe todavía una licencia de software separada para una plataforma genérica.
- **Cierre:** extraer límites claros entre motor y paquete narrativo, probarlos con otro contenido y publicar una licencia explícita sólo entonces.

### Advisories de dependencias de desarrollo

- **Estado medido:** `npm audit` informa tres hallazgos de severidad baja en la cadena de desarrollo de SvelteKit/cookie; `npm audit --omit=dev` informa cero vulnerabilidades de producción.
- **Restricción:** no aplicar automáticamente la sugerencia de downgrade mayor que devuelve npm; revisar actualización u override compatible y repetir check/tests/build.
- **Cierre:** audit completo sin hallazgos conocidos o excepción documentada con alcance y versión de remediación.
