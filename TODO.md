# Deuda editorial y técnica pendiente

Este archivo es el registro canónico de deuda editorial y técnica accionable que todavía no se resolvió. El español es la fuente de verdad. Las tareas resueltas deben eliminarse o trasladarse al historial correspondiente; `docs/PROJECT_STATUS.md` resume el estado y `CHANGELOG.md` conserva los cierres.

## Prioridad alta

### Cierre causal y de cobertura antes de producir imágenes

- **Fuente:** `docs/CONTINUIDAD_CAUSAL_GUIONES.md` y los informes `report:*`.
- **Problema vigente:** los 57 cues de acción duplicados ya fueron archivados fuera del guion y el informe quedó en cero. El corto aún tiene 124/124 tomas sin binding explícito, 68 sin propósito y 12 sin framing; Festival tiene 35 tomas A–D pero E–G siguen sin construir; el largo sigue sin shot list.
- **Orden:** cerrar por guion texto y causalidad → placements/cobertura → bindings/performance necesarios → bloqueo de tomas → habilitación visual. No rellenar campos por volumen si no mejoran continuidad o producción.
- **Compuerta:** corto, festival, tráiler y largo se habilitan de forma independiente. Un recurso compartido espera a todos sus consumidores o recibe una variante explícita.
- **Cierre:** cada acción depende de información disponible para el personaje; los beats imprescindibles tienen cobertura; los informes distinguen `complete`, deuda y `not_applicable`; ninguna regeneración empieza antes del cierre del guion correspondiente.

### Autoridad de datos y extractor legacy seguro

- **Archivos afectados:** `package.json`, `scripts/extract-legacy.mjs`, `scripts/migrate-multi-script.mjs`, `README.md` y documentación de migración.
- **Problema:** `npm run extract:legacy` todavía escribe directamente sobre `data/project.json`, catálogos, assets, documentos y `docs/SCRIPT_ANIMATIC_SYNC.md` con el modelo anterior a multi-script. El propio extractor advierte que no debe ejecutarse sobre el árbol migrado, pero el comando continúa expuesto como si fuera de uso rutinario.
- **Riesgo:** una ejecución accidental puede reemplazar datos canónicos actuales y exigir una migración destructiva posterior.
- **Trabajo:** convertirlo en una herramienta archivística no destructiva que escriba en un directorio temporal, o retirarlo de los comandos públicos. Documentar con precisión qué generadores siguen siendo autoridad y cuáles sólo reconstruyen una fuente histórica.
- **Cierre:** ningún comando presentado como seguro puede sobrescribir datos canónicos actuales sin destino explícito, comprobación previa y diff revisable.

### Esquema único y validación efectiva

- **Archivos afectados:** `docs/JSON_FORMAT*.md`, `src/lib/types/`, `src/lib/data/validation/`, `scripts/validate-data.mjs` y repositorios de datos.
- **Estado parcial:** JSON Schema 2020-12 ya es autoridad ejecutable para outlines, archivo histórico, contextos de producción, snapshots de proveedor, planes de generación y ledgers causales. `validate:schemas` corre dentro de `validate:data`, y los tipos de producción se generan con `schema:types`. `Note` ya incluye tipos editoriales/técnicos/visuales y flujo de estado.
- **Trabajo restante:** extender la misma autoridad a los roots centrales de scripts, proyecto, entidades, assets y documentos; eliminar casts y validación manual duplicada; cubrir todas las foreign keys, relaciones padre/hijo, orden, pertenencia de takes, límites de placements y existencia física bajo `static/`.
- **Cierre:** datos inválidos fallan en desarrollo y CI sin depender de casts; los validadores duplicados dejan de divergir.

### Gate de CI, formato y runtime soportado

- **Archivos afectados:** `.nvmrc`, `.github/workflows/pages.yml`, configuración de Playwright/Prettier y los archivos señalados por `npm run lint`.
- **Estado parcial:** `.nvmrc` fija Node 24 LTS; CI valida esquemas, artefactos generados y ledger causal, además de los gates existentes.
- **Trabajo restante:** normalizar formato, ejecutar lint estricto y Playwright en PR/push, y conservar descarga LFS + build con `BASE_PATH`.
- **Cierre:** instalación limpia, validación, check, lint, unit, E2E y build Pages pasan en CI sobre Node LTS.

### Notas editoriales estructuradas en JSON

- **Archivos afectados:** `src/lib/types/`, `data/`, `scripts/`, `package.json`.
- **Estado parcial:** `Note` admite identidad, estado, prioridad, acción, criterio de aceptación, rutas, autor y fechas; `npm run notes:build` genera `docs/PENDING_AUTHOR_NOTES.md` y `notes:check` detecta deriva en CI.
- **Fuente:** separación obligatoria entre narrativa, presentación y estado editorial en `AGENTS.md`.
- **Trabajo restante:** habilitar y validar arrays `notes` en todos los roots donde aporten valor, migrar notas legacy gradualmente y exponer una vista editorial si se decide necesaria.
- **Compatibilidad:** migrar gradualmente `resolved?: boolean`; las notas sin estado siguen siendo informativas.
- **Informe:** añadir `npm run notes:build` para generar de forma determinista `docs/PENDING_AUTHOR_NOTES.md`, agrupado por prioridad y entidad, con archivo y JSON path exactos. Excluir notas resueltas y advertir que el archivo generado no se edita directamente.
- **Cierre:** tipos, validador, migración, pruebas y script funcionan; una nota eliminada del JSON desaparece del informe al regenerarlo.

### Cierre editorial y freeze de prompts por cut

- **Estado:** `data/production/plans/` contiene planes provider-neutral bloqueados, segmentados a un máximo de 8 s para la campaña de prueba. No contienen prompts compilados ni autorizan generaciones. Cada toma exige un still representativo; first/last frame son artefactos separados y el audio final queda bajo control editorial.
- **Bloqueos medidos:** `npm run report:prompt-readiness` enumera propósito, framing, bindings, referencias, presupuesto de adjuntos y aprobación de freeze. El largo produce cero tomas, no un falso verde; Festival conserva el bloqueo E–G en escaleta/ledger.
- **Trabajo:** cerrar cada guion y su ledger causal; aprobar brief ES por toma; resolver referencias visuales y muestras de voz; congelar un digest por cut; recién entonces compilar el prompt EN y habilitar un adapter de proveedor.
- **Proveedor:** los límites documentales están versionados en `data/production/provider-capabilities.json`. Seedance 2.5 permanece provisional y no ejecutable hasta aparecer en el catálogo operativo. Antes de usar la cuenta de prueba se debe verificar entitlement, costo/créditos, concurrencia y límites vivos mediante preflight.
- **Cierre:** no existen bloqueos editoriales, cada segmento respeta duración y adjuntos, el digest coincide con el guion aprobado, costo y destino fueron autorizados y la ejecución puede auditarse sin leer Markdown en runtime.

## Prioridad media

### Regeneración y reemplazo de stills del animatic (deferida)

- **Inventario provisional:** 141 candidatos `needs_regeneration` (112 reutilizaciones del corto + 29 del tráiler) y 12 placeholders `needs_replacement` exclusivos del corto. El corto tiene 124 tomas en total; no son 124 regeneraciones existentes.
- **Problema:** los stills del animatic —interiores y exteriores— no reflejan la orientación actual de la Ardor (cubiertas perpendiculares al progrado) ni la revisión visual de exteriores.
- **Estado:** los estados actuales son candidatos editoriales, no una cola de producción autorizada. Las 12 tomas sin imagen propia conservan placeholder y requieren reemplazo, no «regeneración».
- **Informes:** `npm run report:editorial` (cola, completitud, arte faltante, briefs de regeneración).
- **Bloqueo:** deferir hasta que el guion consumidor supere el cierre causal y de cobertura. No generar imágenes sin autorización expresa.
- **Cierre:** cada take realmente marcado se sustituye por un still coherente sin cambiar su `shotId`; placeholders y reutilizaciones quedan identificados por separado.

### Presupuesto físico del enlace láser

- **Archivos afectados:** `docs/SIGNAL_BEAM_REQUIREMENTS.md`, futuras interfaces y notas de producción.
- **Problema:** la estimación heredada de 0,043° provenía de supuestos de radio y «salida FTL» ya descartados.
- **Trabajo:** fijar incertidumbre de trayectoria, longitud de onda, apertura, energía por pulso, codificación y sensibilidad del receptor; comprobar que divergencia + raster cubran la elipse sin volver estos números exposición hablada.
- **Cierre:** cálculo reproducible revisado por física/telecomunicaciones y UI consistente con sus órdenes de magnitud.

### Geometría visual antigua de Celestial Ardor

- **Archivos afectados:** hojas del puente/nave, frames con ventanal frontal, cubiertas longitudinales o núcleo axial, biblia visual y metadatos asociados.
- **Problema:** parte del arte antecede a las cubiertas transversales, los tres troncos y el núcleo excéntrico.
- **Cierre:** arte y metadatos respetan la referencia técnica sin regenerar imágenes hasta recibir autorización expresa.

### Atraque y escala de Proxima

- **Archivos afectados:** guiones, animatics, biblia y documentos que muestren rampas, hangares internos o escalas antiguas.
- **Problema:** Ardor debe atracar exteriormente por la proa mediante collar presurizado y conservar escala de trabajo de 90 m frente a Proxima.
- **Fuente:** `docs/technical/CELESTIAL_ARDOR.md` y `docs/technical/PROXIMA_STATION.md`.
- **Cierre:** no quedan descripciones activas de la nave dentro de un hangar gigante.

### Madurez editorial de documentos, scripts y medios

- **Estado medido:** los cuatro scripts están en `draft`; las traducciones inglesas de los nueve documentos públicos y el catálogo estructurado de guiones/assets/comparación están en `draft`, ninguna en `reviewed`; el documento de canon sigue como `stub`.
- **Medios:** los 132 assets registrados son imágenes. No hay audio ni video; los diez perfiles de voz no tienen muestras.
- **Cobertura visual:** 10 de los 21 personajes catalogados no tienen asset de referencia. No todos necesitan model sheet; priorizar según el cut que entre en producción y no generar arte sin autorización.
- **Trabajo:** definir qué estados deben alcanzar antes de una publicación/festival, revisar las traducciones prose y narrativas —incluido el borrador asistido que cubre 1031 cadenas—, completar la proyección estructurada del canon y planificar audio/video sin confundir material de referencia con producción final.
- **Cierre:** los estados editoriales describen una revisión real, el sitio no presenta borradores como aprobados y cada medio final tiene procedencia y elegibilidad verificadas.

### Cobertura de regresión del modo Película

- **Problema:** las regresiones browser actuales cubren navegación, responsive básico, detalle de toma y retorno al editor, pero no ejercitan fullscreen real, play/pausa/stop, subtítulos, controles de teclado, conservación de estado al rotar ni varios motores de navegador.
- **Trabajo:** ampliar Playwright y ejecutar la suite en CI; añadir una comprobación visual/accesible proporcionada al riesgo de los layouts responsive.
- **Cierre:** las funciones obligatorias de `AGENTS.md` cuentan con pruebas estables y ejecutadas en el gate de publicación.

## Prioridad baja

### Carga diferida del catálogo inglés

- **Problema medido:** el overlay completo se importa hoy junto con los repositorios; Vite informa un chunk cliente minificado de ~551 kB y un chunk SSR de repositorios de ~681 kB.
- **Trabajo:** dividir el catálogo por dominio o script y cargar sólo el idioma/cut solicitado, sin introducir recursos remotos obligatorios ni perder prerender.
- **Cierre:** el build deja de superar el umbral de 500 kB por esta causa y las rutas ES no descargan traducciones inglesas que no utilizan.

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
