# ADR-0002: Autoridad de la narrativa maestra y retiro de la continuidad anterior

- **Estado:** Aceptado
- **Fecha:** 2026-09-05
- **Responsables:** responsables editoriales de Light Delay
- **Reemplaza parcialmente:** `docs/ADR-0001-MULTI-SCRIPT-CONTINUITIES.md` en la elección de autoridad narrativa y rutas por defecto

## Contexto

El repositorio acumuló cuatro productos completos o parciales —corto principal, Festival Cut, tráiler y tratamiento largo— derivados de una continuidad COM/láser anterior. La narrativa maestra sin límite de duración comenzó como una rama WIP, pero ahora contiene la versión de historia que debe terminarse antes de volver a derivar cortes.

Mantener el corto anterior como autoridad haría posible que validadores, rutas, informes o planes de generación siguieran presentando como vigente material incompatible. Borrar ese material ahora también sería incorrecto: todavía puede contener diálogo, puesta, recursos visuales o procedencia recuperables.

## Decisión

1. `data/outlines/light-delay-master-narrative.json` es la fuente narrativa vigente. Su estado es **WIP autoritativo**: ser WIP describe su grado de cierre, no una autoridad inferior.
2. `project.narrativeAuthority` registra explícitamente el outline, la continuidad y el `ScriptFile` stub correspondientes. `canonicalScriptId` apunta al stub maestro para que las rutas abreviadas abran la autoridad actual.
3. El stub no inventa implementación: actos, escenas, beats de guion, cues, shots y takes permanecen vacíos hasta completar la escaleta y autorizar derivados.
4. Los Markdown `docs/wip/general-narrative-outline.es.md` y `.en.md` son exports generados desde el JSON. La importación Markdown→JSON sólo puede producir un candidato revisable y nunca sobrescribe la autoridad.
5. Los outlines y guiones `main-short`, `festival`, `trailer` y `long` quedan `deprecated`. Sus animatics, planes de generación y ledgers causales son implementaciones `obsolete` retenidas para rescate.
6. La arquitectura multi-script de ADR-0001 sigue vigente para los futuros derivados, pero ya no lo está su selección del corto de ~30 minutos como autoridad actual.
7. `data/editorial-lifecycle.json` es el ledger de clasificación. Toda dependencia se clasifica como autoritativa/requerida, compatible, obsoleta/no relacionada o incierta. La ausencia de una entidad en el master no basta para declararla obsoleta.
8. Los elementos inciertos quedan `review_required` y se retienen. Sólo los elementos explícitamente obsoletos pueden ser candidatos a eliminación.

## Compuertas de eliminación

No se elimina ningún material hasta que se cumplan simultáneamente estas condiciones:

- la escaleta maestra está completa;
- terminó la revisión de rescate;
- los nuevos derivados de reemplazo fueron aprobados;
- no quedan dependientes activos.

Mientras una compuerta permanezca abierta, incluso los candidatos `delete_after_gates` continúan en el repositorio.

## Estado de implementación (nota 2026-09)

La decisión de este ADR sigue vigente: el **producto** maestro (guion/animatic en `script:light-delay-master-narrative`) permanece vacío a propósito. Eso no niega los **derivados WIP ya autorizados** en `data/editorial-lifecycle.json`: `outline`/`script:light-delay-festival-master` y `script:light-delay-trailer-master` son producción activa bajo el master. Day-one map: `docs/AGENT_ONBOARDING.md`. No confundir el Festival-master con el `light-delay-festival` deprecado.

## Experiencia de aplicación

- `/outline` abre la escaleta maestra.
- Las rutas abreviadas `/script` y `/animatic` siguen el stub maestro vacío; los derivados autorizados se abren por `scriptId` explícito (Festival-master / trailer-master).
- El selector agrupa el master como autoridad narrativa actual, los derivados WIP autorizados como producción en curso, y los productos anteriores bajo archivo deprecado.
- Las rutas explícitas del archivo siguen disponibles con advertencia visible y `noindex`; el sitemap sólo publica productos actuales.
- Entidades y assets muestran su estado de ciclo de vida cuando se consultan individualmente.

## Informes y producción

- Los informes sin `--script` usan el master.
- `--all` procesa sólo productos no deprecados; `--include-deprecated` habilita una auditoría archivística explícita.
- Los planes de generación de la continuidad anterior se conservan con estado `obsolete`. No autorizan prompts ni medios nuevos.
- La producción visual del Festival-master es WIP autorizado; no regenerar imágenes sin instrucción explícita. Nuevos cuts adicionales siguen requiriendo cierre del master o autorización editorial + escaleta derivada.

## Consecuencias

- El sitio puede mostrar temporalmente un guion y animatic maestros vacíos; esto es más preciso que servir una implementación anterior como vigente.
- Comparar el master stub con cortes archivados tendrá utilidad limitada hasta que existan derivados nuevos.
- Documentos técnicos, entidades y assets no se borran por heurística. El informe generado `docs/MASTER_RELEVANCE_REPORT.md` hace visible la cola de revisión.
- Las pruebas de 17 escenas y 128 tomas continúan como garantías de integridad del archivo anterior, no como requisitos narrativos del master.

## No decidido aquí

- La duración, reparto final y estructura de los nuevos cortes.
- Qué diálogo, staging o referencias visuales se rescatarán.
- El momento exacto en que el master deja de ser WIP.
- La eliminación física de archivos, que requiere las cuatro compuertas y una tarea explícita posterior.
