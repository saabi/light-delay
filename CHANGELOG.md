# Changelog

## 2026-09-01 — Checklist pre-suscripción Higgsfield

- Añadido `docs/production/HIGGSFIELD_PRE_SUBSCRIBE_CHECKLIST.md` y snapshot JSON (`data/production/checklists/higgsfield-pre-subscribe.json`): matriz tráiler↔festival, PNG skip, ~28 gens de tráiler + ~46 festival incremental (~888 cr @ 480p), puertas editoriales antes de Ultra.
- Script `scripts/generate-higgsfield-pre-subscribe-checklist.mjs` (`npm run production:checklist:higgsfield`).

## 2026-08-31 — Referencia Higgsfield MCP

- Añadido `docs/technical/HIGGSFIELD_MCP.md`: conexión MCP oficial, créditos vs Unlimited 24 h, referencias, flujo de dos agentes y esquema JSON propuesto para corridas.

## 2026-08-31 — Referencias terrestres separadas

- Añadidas hojas independientes para el manifestante Aqueronte, la partidaria del contacto y la periodista terrestre.
- Las entidades de cada voz ahora apuntan a su referencia propia; `earth-protesters` se conserva para planos de multitud.
- Higgsfield staging y el catálogo de assets se actualizaron (142 assets registrados).

## 2026-08-31 — Hoja de referencia de Harlan regenerada

- Reescrita la descripción canónica bilingüe de Rylen Harlan para fijar rasgos, porte y diferencia visual respecto de Voss.
- Regenerada `static/assets/characters/harlan/model-sheet-v2.png` en el formato neutral del resto del elenco; la hoja anterior queda como procedencia histórica.
- Harlan vuelve al staging de Higgsfield con su referencia versionada; queda pendiente sólo la verificación externa de similitud.
- `npm run prepare:higgsfield` refresca copias de Zao, Harlan y briefs de escena 5 para subida externa.

## 2026-08-31 — Harlan desenchufa COM A/B (escena 5, toma 7)

- Registrado `asset:animatic-05-07` (`scene-05/shot-07.png`) y enlazado en `main:take-05-07-01` y `festival:shot-b-03-take-01`; deja de reutilizar erróneamente `asset:animatic-12-08`.

## 2026-08-31 — Cartelas de título en el animatic

- Registrados tres assets en `data/assets.json` y enlazados en las tomas: `film-title.png` (main y Festival), `trailer-brand.png` y `trailer-tagline.png` (tráiler). Las tres tarjetas de créditos siguen con placeholder.

## 2026-08-31 — Referencia del acceso oculto al puente

- Añadida una vista realista para montar la entrada de Harlan desde el cilindro de servicio oculto por las escaleras.
- Conservados cámara, escaleras, barandas y arco de consolas del blockout; la silla de capitán recibe mayor jerarquía visual sin convertirse en un elemento ornamental.

## 2026-08-31 — Referencia cercana de los puestos del puente

- Añadida una segunda referencia realista del puente desde la cámara cercana a los seis puestos y la silla de capitán.
- Conservada la geometría de cilindros, escaleras y barandas del nuevo blockout, aplicando los materiales, iluminación y ventanas reforzadas de la referencia general.

## 2026-08-31 — Barandas completas y ventanas perimetrales del puente

- Rehecha la referencia realista conservando la planta y cámara del blockout autoritativo.
- Añadidas barandas exteriores paralelas a las interiores en todos los tramos de escalera; las interiores continúan sin interrupción sobre los descansos horizontales.
- Distribuidas ventanas pequeñas y reforzadas por todas las paredes visibles del casco, manteniendo las aberturas de acceso junto a los cilindros de servicio y ascensor.

## 2026-08-31 — Título de una línea y lema restaurado

- Título de obra: un solo cue (`LUZ TARDÍA` en español / `LIGHT DELAY` en inglés); eliminado `LATE LIGHT` como segunda línea errónea.
- Tráiler: restaurada la cartela de lema (`SOMETIMES, ARRIVING LATE IS ARRIVING ON TIME.`) tras la marca; **33** tomas (1:42,5). Prompt C de nuevo en `docs/TITLE_AND_CREDITS.md`.

## 2026-08-30 — Títulos y créditos en main, Festival y tráiler

- Main y Festival añaden título diferido tras el cold open (`LIGHT DELAY` / `LUZ TARDÍA`) y tres tarjetas de créditos finales; el tráiler conserva marca al cierre y añade las mismas tarjetas de créditos.
- Animatic: main **128** tomas (~30:50,5), Festival **71** (~6:14,2), tráiler **33** (1:42,5). Stills de cartela usan placeholder hasta generación autorizada; prompts EN en `docs/TITLE_AND_CREDITS.md` y notas de toma.
- `TextCue.presentation` admite `credits`. Autor legal pendiente: `AUTHOR_NAME_PLACEHOLDER`.

## 2026-08-30 — Completitud de propósitos y encuadres

- Main completa propósitos bilingües en sus 68 tomas pendientes y encuadres en las 12 tomas que carecían de `composition.framing`, conservando descripciones, movimientos, IDs y duración.
- El generador del tráiler añade propósitos por toma desde la intención segura de cada segmento, sin heredar metadatos que puedan revelar culpable o desenlace; sus 29 tomas quedan completas en propósito y encuadre.
- Festival fue auditado y permanece sin faltantes de estos campos. No se generaron imágenes, video ni prompts; bindings, placements y performance siguen siendo deuda separada.

## 2026-08-30 — Clímax físico/digital y omisiones del tráiler

- Main y Festival aclaran que la cámara descarta a Sorell como autora, aunque Voss suspende su credencial comprometida y exige escolta; Harlan usa el procedimiento para preservar el canal automático, no para apagarlo.
- El token de Zao autentica mensaje y snapshot, la auditoría de Elin completa la atribución y Voss ejerce la revocación. Elin todavía necesita cinco segundos de intervención física; Sorell valida fuera de línea el saludo y Voss lo preautoriza antes de T=0.
- La aproximación remota termina bajo 1 g: Harlan bloquea el accionamiento principal, el corte programado a T−12 s inicia microgravedad y su apelación al pasado compartido provoca una vacilación breve de Okoye antes de que ella lo redirija con pasamanos y tether.
- El protocolo libera automáticamente sólo el saludo ya autorizado cuando abre el canal. La escala diferenciada de Ardor, emisaria y estación sostiene la dimensión cósmica sin sustituir la decisión humana.
- El tráiler mantiene anónima la amenaza y deja sin resolver envío, recepción, destino de Zao, contención y resultado del saludo; el guard de spoilers cubre ahora también estas dos últimas categorías.
- El largometraje sólo adopta esta lógica en su escaleta. Su tratamiento, generador, ledger, comparación y producción quedan como deuda explícita para una revisión posterior; no se generaron imágenes, video ni prompts.

## 2026-08-31 — Habitabilidad y seguridad del puente

- Revisada la referencia realista para reducir el aspecto enteramente metálico mediante paneles compuestos claros, acentos apagados azul pizarra/verde azulado, tapicería y luz de trabajo más cálida.
- Añadidas barandas exteriores continuas a todas las caras expuestas de escaleras y descansos, conservando también las interiores y las aberturas funcionales.
- Eliminado un objeto suelto introducido durante la revisión para mantener seguridad en microgravedad.

## 2026-08-31 — Casco y referencia realista del puente

- Aclarado que la pared curva gris del puente es casco presurizado, no ventanal panorámico ni pantalla; sólo los displays de los seis puestos son azules.
- Añadidas pocas ventanas pequeñas, profundas, reforzadas y obturables a lo largo del cilindro, destinadas a orientación e inspección, no al pilotaje.
- Generada y registrada una referencia interior realista de 1536 × 864 a partir de los blockouts en perspectiva y planta.

## 2026-08-31 — Geometría del puente y ruta de Harlan

- Corregida la descripción del puente de la Celestial Ardor según el bloqueo tridimensional: seis puestos en arco, silla de capitán, mesa para seis y aberturas de escalera junto al cilindro de servicio y el ascensor.
- La escotilla oscura del cilindro de servicio y la bandeja abatible COM A/B contigua quedan fuera de la línea visual de los puestos.
- Sincronizada la secuencia en main, Festival y largo: Harlan asciende por servicio, abre la escotilla durante la llamada de Zao, corta primero wireless y luego desenchufa COM A/B, vuelve a entrar, cierra y desciende hacia ella.

## 2026-08-31 — Cartelas inglesas de título y tráiler

- Regeneradas tres cartelas opacas de 1536 × 864 bajo `static/assets/animatic/titles/`: título principal/festival, marca final del tráiler y eslogan independiente.
- El título visual queda reducido a `LIGHT DELAY`, sin subtítulo ni eslogan; la marca del tráiler añade únicamente un pulso Velari cian muy tenue.
- El eslogan propuesto `THE MESSAGE ARRIVED BEFORE THEY DID.` queda como asset independiente y no se incorpora al montaje, preservando la decisión posterior de eliminar la cartela de lema del tráiler.

## 2026-08-30 — Campaña de afiches V1

- Añadidos ocho afiches de `Luz Tardía`: cuatro conceptos en formatos apaisado y retrato, bajo `static/assets/marketing/posters/v1/`.
- Añadidas sus ocho versiones inglesas `Light Delay`, localizando únicamente título y eslogan y conservando el arte y la composición.
- Las piezas narrativas usan las referencias canónicas de Zao, Proxima, Celestial Ardor, la Estación Velari y el reparto principal; el teaser minimalista deriva de la marca oficial.
- `static/assets/marketing/posters/manifest.json` registra copy, dimensiones, orientación, referencias visuales y estado de elegibilidad todavía no verificado.

## 2026-08-30 — Metadatos de producción Festival A–D

- Las 38 tomas A–D del Festival Cut ahora declaran propósito bilingüe, personajes/objetos visibles u off-screen y contextos físicos verificables; no cambiaron diálogo, duración, orden ni imágenes.
- Añadido el contexto de la Ardor atracada en Proxima y aplicados a A–D los contextos vigentes de microgravedad, empuje, transmisión óptica y displays operativos únicamente en inglés.
- Los planes de generación del Festival ya no informan faltantes de propósito, binding o contexto. Continúan bloqueados correctamente por el freeze editorial de 67 tomas y por las muestras de voz todavía ausentes.

## 2026-08-30 — Reproductor: sidebar derecho unificado

- En modo película, el selector de idioma, el contador de tomas y el panel de detalles comparten una columna derecha que fluye verticalmente, sin solaparse.

## 2026-08-30 — Festival Cut completo A–G y displays ingleses

- Festival incorpora 29 tomas/takes para E–G y alcanza 67 tomas, 6:03,2 de primera asamblea y cobertura causal/animatic completa; los siete parlamentos existentes se colocaron sin reescritura ni sobra de diálogo.
- Cada toma nueva reutiliza un still del corto como placeholder explícito `needs_regeneration/canon_mismatch`; no se generaron imágenes ni video.
- Los planes de producción declaran `diegeticTextLanguage: en` y extraen sólo `variants.en` para texto integrado en displays. El master visual nunca combina idiomas; una eventual versión española será un derivado de edición.
- Añadidos reloj único, saludo pasivo verificado, bindings, propósitos, cámara, sonido, procedencia y contextos de gravedad/vacío para E–G.

## 2026-08-29 — Carrera al núcleo, evidencia convergente y Festival A–G

- Main, Festival y largo sincronizan la llegada casual de Harlan tras una tarea legítima, su microreacción ante «la verdadera firma apunta a—», la deliberación de Voss y la segunda orden que demora a Sorell.
- Festival suma tres tomas A–D —38 en total— para la orden de Voss y las rutas contrastadas en microgravedad; no se generaron medios. E–G quedan escritos en cues y cubiertos a nivel de guion, pero continúan sin shot list.
- Zao preserva el manifiesto del relé mediante snapshot firmado por hardware y firma mensaje/adjunto con su token personal. Elin verifica autora e integridad además de dispositivo/hora, y su auditoría independiente produce atribución convergente a Harlan.
- Voss permanece en el puente durante el clímax; Okoye intercepta a Harlan sin combate armado. El cierre incorpora cuarentena/canal limpio/mediación activa, reconocimiento Velari limitado e informe terrestre con evidencia y legajo de Zao, enviado sin respuesta.
- Los ledgers de main y Festival validan 13 pasos y 12 acciones; tráiler preserva identidad, envío, recepción y destino de Zao como incógnitas. El largo continúa como tratamiento y el generador durable fue actualizado.

## 2026-08-29 — Columna vertebral causal y suspenso del tráiler

- Reescritas las capas `story` de main y festival para que cuenten causa, decisión y consecuencia sin abrir detalles; Festival establece desde su tercer hito quién advierte al puente, qué alcanza a decir y por qué Harlan actúa.
- Main, festival y largo asientan la muerte fuera de campo mediante impacto diegético, cese del forcejeo/respiración y negro sostenido. El tráiler corta antes del ataque pero mantiene música y negro breve, sin confirmar fatalidad.
- El tráiler ya no nombra ni encuadra a Harlan, no llega a 100 % de transmisión y sustituye la recepción por la auditoría de la carga y un override anónimo; escaleta, metadatos y traducciones respetan la misma omisión.
- Añadidos `report:outline-story` para leer las escaletas sin implementación y `check:trailer-spoilers` con prueba unitaria; la ausencia de enlace causal en un hito `story` pasa a ser error.

## 2026-08-29 — Escaleta en `/project/`

- Tarjeta Outline (01) antes que Guion en la cuadrícula del archivo, y enlace Escaleta junto a Animatic en la lista por cut.

## 2026-08-29 — Escaletas jerárquicas y causalidad legible

- Reautorizadas las cuatro escaletas con sinopsis y dos niveles: hitos `story` legibles de principio a fin y pasos `detail` que conservan los IDs históricos.
- Las dependencias significativas usan relación y explicación bilingüe; la cobertura opcional se separa por tratamiento, guion y animatic con evidencia concreta.
- La UI muestra primero la historia, permite desplegar detalle y señala por qué ocurre cada consecuencia; los gaps se consultan por destino y un informe adicional detecta problemas de legibilidad.
- Retirado el generador circular basado en resúmenes de escena. `seed:outline` sólo crea borradores fuera del directorio canónico y se niega a sobrescribirlos.
- Restaurado en main, Festival y largo el razonamiento completo de Zao (doble retardo terrestre, oclusión de Proxima y corredor futuro) y el beat de Harlan que supone Tierra, se tranquiliza, lamenta la suerte de Zao y suspira antes del asesinato. Las reglas de agente ahora prohíben sustituir versiones recientes o diferir causas faltantes sin autorización explícita.

## 2026-08-29 — Escaleta antes que guion en la navegación

- En el rail y el menú móvil, Outline aparece encima de Script: el guion depende de la escaleta.

## 2026-08-29 — Gates editoriales, causalidad y arquitectura de prompts

- Corregido de forma durable el generador del tráiler: 29 tomas, 92,5 s y cero sobras de diálogo; `--check` evita que el JSON derivado vuelva a divergir.
- Archivados 57 cues de acción duplicados del corto con contenido y cobertura completos en `data/archive/`; el guion activo conserva 17 escenas / 124 tomas.
- Añadidos outlines reproducibles para main, tráiler y largo; los cuatro cuts tienen escaleta y Festival informa 14 pasos `required` aún no cubiertos.
- Entidades migradas a i18n inline; `entities.en.json` queda retirado/vacío y los selectores/validadores ya no dependen del overlay.
- JSON Schema 2020-12 + tipos generados para archivo, outlines, contextos, proveedor, planes y ledgers. Notas humanas ampliadas y `PENDING_AUTHOR_NOTES.md` reproducible.
- Ledger ejecutable de 11 pasos y 13 acciones para el corto: el gate comprueba hechos previos y que cada actor conozca aquello en lo que basa su acción. Festival, tráiler y largo declaran `incomplete` sin falso verde.
- Arquitectura provider-neutral de producción: planes bloqueados por toma, still representativo, first/last frame, audio final, segmentación semántica a ≤8 s, presupuesto de adjuntos y snapshots Seedance/Higgsfield. No se compilaron prompts reales ni se generaron medios.
- CI migra a Node 24 LTS y comprueba esquemas, causalidad y artefactos generados.

## 2026-08-29 — Traducciones de historia inline (LocalizedString)

- El copy de guiones, outlines, assets, taxonomía, funciones, variantes y etiquetas de `project.scripts` pasa de overlay `public.en.json` (clave = texto ES) a mapas co-localizados `{ "es", "en" }` y diálogo/texto en `content.variants.en`.
- Tipos `LocalizedString` / `StoryText`, resolvers en selectores y CLI; `validate:translations` comprueba cobertura inline; `public.en.json` queda vacío (retirado para historia). Galería de entidades sigue en `entities.en.json` (deuda).
- Migrador idempotente: `node scripts/migrate-inline-i18n.mjs` (`--apply`, `--prune-overlay`). Schema de scripts/outlines en `1.1.0`.

## 2026-08-29 — Escaleta festival migrada a JSON; Markdown jubilado

- `data/outlines/light-delay-festival.json`: 44 pasos completos (A–D `covered`, E–G `planned`, dos beats de Secuencia D `missing`), `dependsOnStepIds` rellenado en 30 pasos con dependencias causales reales (no mera adyacencia de escena). Reordenado `festival:outline-24` ("se nombra el riesgo real") para que siga a los overlays del payload que necesita, en vez de precederlos.
- `npm run report:outline-gaps` confirma automáticamente el hallazgo central de la auditoría causal: `festival:outline-25` (ya `covered`) depende de `festival:outline-23` (todavía `missing`) — la Secuencia D construida se apoya en un beat de conexión que aún no existe en el guion/animatic.
- Auditoría de migración: el contrato `OutlineFile`/`OutlineStep` (con `dependsOnStepIds`, `notes` tipadas y `majorEventId`) resultó suficiente para representar toda la escaleta narrativa — no se necesitaron cambios de esquema adicionales a los ya incorporados (ver entrada "Guía de escaleta, i18n y gaps"). El único contenido de `docs/ESCALETA_FESTIVAL.md` sin equivalente estructurado era meta-comentario sobre el propio esquema (evaluación de suficiencia + 4 mejoras sugeridas, ya implementadas), que no le corresponde a un `OutlineStep` — queda archivado aquí en vez de en la escaleta.
- `docs/ESCALETA_FESTIVAL.md` retirado (contenido narrativo íntegramente migrado a `data/outlines/light-delay-festival.json`; `docs/GUIA_ESCALETA.md` ya establece el JSON como checklist autoritativa).

## 2026-08-29 — Festival Cut: shot list A–D

- `light-delay-festival`: 33 tomas/takes para secuencias A–D (E–G siguen planificadas). Docs de cuidados narrativos y plan de sync actualizados.

## 2026-08-29 — Guía de escaleta, i18n y gaps

- Guía operativa `docs/GUIA_ESCALETA.md` y regla en `AGENTS.md`: crear/auditar escaleta antes de ampliar guion o animatic.
- `dependsOnStepIds` en pasos; UI agrupada por escena con destaque de `required`+`missing`; `report:outline-gaps`.
- Escaletas en el overlay `public.en.json`; traducción EN de la escaleta festival (1311 cadenas públicas).

## 2026-08-29 — Escaleta opcional por guion

- Contrato `OutlineFile` / `data/outlines/` (archivos opcionales), ruta `/outline/[scriptId]` con empty state si falta el JSON, enlace en la navegación y sitemap.
- Informe offline `npm run report:outline-missing` (también en `report:all`) lista scripts del registry sin escaleta. Documentado en `docs/ESCALETA.md`.

## 2026-08-29 — Controles de idioma en la navegación del proyecto

- Selectores de diálogo y subtítulos en el rail (`ProjectNav`, bajo el switcher de guion) y siempre visibles en el chrome del player a pantalla completa; eliminados duplicados de la página de guion y del panel de detalles.
- El animatic deja de leer `url.searchParams` durante el prerender (sólo en cliente), para que el build estático no falle.

## 2026-08-29 — Detalles colapsables en el editor de animatic

- Panel de detalles de toma (mismo `ShotDetailsPanel` que el player) como barra lateral sticky a la derecha en escritorio y hoja inferior en móvil; selección por tarjeta, `?shot=` y tecla `D`.

## 2026-08-29 — Diálogo en tarjetas del editor de animatic

- Las tarjetas de toma en `/animatic/[scriptId]` muestran el diálogo localizado (hablante + texto) derivado de los cues colocados; el player no cambia.

## 2026-08-29 — Sincronización causal y canon multi-script

- Fijadas la cronología maestra (57 h 48 min local, ~23 h 15 min de señal, encuentro remoto T+24 h), la terminología del sistema diplomático y la matriz de conocimiento/causa-efecto en `docs/CONTINUIDAD_CAUSAL_GUIONES.md`.
- El corto declara su tripulación completa de ocho; festival conserva seis, tráiler seis y largo catorce. `character:rao` y los paths siguen estables, pero el nombre operativo pasa a **Elin** para evitar confusión con Zao.
- Integrada en corto y largo la broma seca de Cael sobre el nombre/forma de la Ardor, reutilizando cobertura en el corto sin alterar los 124 IDs de toma; festival y tráiler la omiten.
- Corregida la continuidad bajo 1 g del clímax mediante cubierta de mando, ascensor central y ramal del núcleo; festival deja preparada la cuarentena antes de autenticar el mensaje.
- Taxonomía de comparación ampliada de 11 a 13 dimensiones. Informes i18n alineados con el overlay real, arte acotado a entidades del guion y estados `complete` / `debt` / `not_applicable` en resúmenes.
- Reparado `build:trailer` para preservar 29 estados `needs_regeneration`; inventario visual aclarado como 141 candidatos de regeneración + 12 placeholders de reemplazo, todos deferidos hasta el cierre causal y de cobertura por guion.
- Documentación y validadores sincronizados a 17 escenas, 124 tomas/takes, 30:39,5 de montaje derivado y 1070 cadenas inglesas. No se regeneraron imágenes.

## 2026-08-29 — Ritmo de diálogo y escena del láser (124 tomas)

- `light-delay-main-short`: 112→**124** tomas — reparto de diálogo en escena 1 (0 multi-speaker), INSERT de consola en escena 6 (`shot-06-09`), división de `shot-12-01`/`shot-12-09`; montaje derivado 30:39,5. Documentado en `docs/EDICION_ESCENA_LASER_Y_RITMO_DIALOGO.md`.
- `validate:data` espera 124 tomas canónicas; assets Velari diferidos; bloqueo Blender y briefs Higgsfield Proxima/Ardor acoplados.

## 2026-08-28 — Rutas de informes editoriales

- Informes dinámicos en `/reports/` (mismo pipeline que CLI): 12 tipos × todos los guiones registrados; `scripts/lib/report-registry.mjs` + `report-runner.mjs` compartidos entre web y `npm run report:*`.
- Atajo `npm run report:all` exporta diálogo + suite editorial para los cuatro guiones (`--all`).

## 2026-08-28 — Deuda visual y informes editoriales

- Las 141 tomas del corto principal y del tráiler quedan marcadas en `Take.imageStatus` como `needs_regeneration` / `canon_mismatch` (orientación de cubiertas y revisión visual).
- Suite de informes editoriales: `report:visual-art`, `report:image-debt`, `report:shot-completeness`, `report:cue-placement`, `report:dialogue-performance`, `report:entity-binding`, `report:scene-polish`, `report:cue-coverage`, `report:take-workflow`, `report:dialogue-i18n`, `report:regen-briefs`; atajo `report:editorial`.
- Chips de preparación editorial en tarjetas de toma y panel de detalles (regenerar, propósito, cámara).

## 2026-08-28 — Estimación de diálogo hablado

- Nuevo modelo WPM (ES 150 / EN 160) con multiplicadores de ritmo, suelo de 400 ms y preferencia por `estimatedDurationMs` cuando existe.
- Selectores de montaje vs diálogo hablado en guion, animatic, player y panel de detalles (`DurationPair`); badges de más de dos hablantes y diálogo fuera de cámara en tarjetas de toma.
- Informe editorial regenerable: `npm run report:dialogue-timing` → `reports/dialogue-timing/{scriptId}.{lang}.md|json` (ignorado en git).

## 2026-08-28 — Traducción estructurada de contenido público

- Añadido `data/translations/public.en.json` como overlay inglés `draft` para los cuatro scripts, diálogo, subtítulos derivados, escenas, beats, tomas, assets y datos del comparador; el español permanece intacto y autoritativo.
- Las rutas inglesas eligen contenido/subtítulos EN en la primera visita y las españolas ES; las selecciones manuales se conservan. El lector, animatic, player, selector y comparador consumen datos localizados sin duplicar `ScriptFile`.
- Traducidas las cuatro referencias documentales públicas que sólo tenían español y actualizado el ledger legacy; los nueve documentos registrados ofrecen ahora variantes ES/EN.
- Incorporado `npm run validate:translations` al gate de Pages: exige cobertura exacta de 1031 cadenas y detecta fuentes nuevas/cambiadas y claves huérfanas. Añadidas pruebas unitarias y regresiones browser para idioma por defecto, persistencia y documentos.
- Corregido el prerender multilingüe para no confundir el `localStorage` experimental de Node con un navegador: `/es/` conserva relato ES y las rutas sin prefijo relato EN también en el HTML estático.

## 2026-08-28 — Saneamiento y validación documental

- Reconciliados los documentos activos con el estado estructurado vigente: 17 escenas, 112 tomas/takes, 100 frames legacy y 132 imágenes registradas.
- Actualizados el flujo de trabajo, el ADR multi-script, la procedencia de assets y el mapa de animación exterior; las cifras de 100 tomas se conservan únicamente como baseline histórico explícito.
- Añadido `npm run validate:docs` al gate de Pages para comprobar cifras derivadas, enlaces locales y avisos históricos; retirados el snapshot temporal de deuda y el brief ya ejecutado de portada.

## 2026-08-28 — Carrusel automático en tarjetas

- Las tarjetas de arte/entidades con varias miniaturas usan `ImageCarousel` en modo `auto` (sin controles, rotación periódica, pausa al hover y con `prefers-reduced-motion`).
- El detalle de entidad conserva el carrusel manual con controles.

## 2026-08-28 — Miniaturas de assets

- Pipeline Sharp: `npm run thumbs:generate` / `thumbs:sync` escribe WebP (máx. 480 px) en `static/assets/_thumbs/` con manifiesto de procedencia.
- Helper `thumbnailPathForAsset`; galerías de arte y listados de entidad cargan miniaturas; detalle de entidad y asset siguen a resolución completa.

## 2026-08-28 — Carrusel de imágenes en entidades

- Nuevo `ImageCarousel` en detalle de entidad: navega hojas, diagramas y renders vinculados vía `referenceAssetIds`.
- Proxima Station y Celestial Ardor enlazan sheet, proportional PNG, stills de bloqueo (atraque / Júpiter) y la comparativa de escala común.
- Cadenas Paraglide ES/EN para controles y etiquetas del carrusel.

## 2026-08-28 — Bloqueo 3D y plan de exteriores

- Añadidos checklists de modelado Blender a `CELESTIAL_ARDOR.md` y `PROXIMA_STATION.md` (hábitats como rueda radial, espina estratificada, casco/motor/radiadores de la Ardor).
- Nuevos documentos de planificación: `EXTERNAL_SCENES_AND_ANIMATION.md` y `PRODUCTION_ROADMAP.md`.
- Archivo de bloqueo `blender/light-delay-blockout.blend` y still de referencia `proxima-with-ardor-berthed.png`.

## 2026-08-26 — Ajustes de copy de portada

- Revisados en español e inglés el eyebrow, la síntesis de la historia, el conteo/nombre del corto y el CTA del archivo; el inglés adopta además `traveling` según el locale `en_US`.
- Conservados sin cambios los enlaces, metadatos, imágenes, markup y el resto del contenido de la landing; ampliadas las regresiones E2E para verificar los textos equivalentes de ambos idiomas.

## 2026-08-26 — Auditoría y consolidación de deuda

- Ampliado `TODO.md` con deuda antes no registrada: extractor legacy destructivo, deriva entre contrato y JSON, validación incompleta, Node 25 fuera de soporte, lint/E2E ausentes del gate, madurez editorial, medios, regresiones y duplicados binarios.
- Corregida la autoridad documental: `data/scripts/light-delay-main-short.json` es la fuente estructurada vigente; los HTML legacy quedan como procedencia y regresión, no como autoridad paralela.
- Actualizados conteos y estado del Festival Cut en el plan de producción y `PROJECT_STATUS.md`; documentados los estados `draft` de scripts/traducciones y las limitaciones actuales de CI.
- Marcados `SVELTEKIT_SETUP.md` y `MIGRATION_PLAN.md` como referencias históricas, y añadidas advertencias explícitas a las dos fuentes antiguas de largometraje para impedir que sus mecánicas FTL vuelvan al canon.
- Actualizado el inventario de procedencia a 130 imágenes y cuantificado el faltante de metadatos; sincronizado el brief del tráiler con el láser exterior estándar de la Ardor.

## 2026-08-26 — Sitio bilingüe, landing pública y migración prose completa

- Incorporado Paraglide JS con inglés por defecto y rutas españolas bajo `/es/`; navegación, lector de guion, animatic, detalle técnico, comparador, documentos, arte y entidades responden al locale sin cambiar el español como autoridad editorial.
- Reemplazado el dashboard inicial por una landing pública sin spoilers y trasladado el archivo editorial a `/project`; añadidos logotipo, isotipo, favicon, manifest, tarjeta social, metadatos canónicos, `hreflang`, Open Graph y sitemap bilingüe.
- Portadas y traducidas las cinco páginas prose del legacy —notas, biblia, reporte, momentos y estructura— preservando headings, listas, tablas y beats. La versión española fue reconciliada con el canon actual y el inglés se registra como traducción en revisión.
- Añadidos overlays ingleses completos para las galerías de personajes, lugares, objetos, vehículos y facciones, más un ledger de migración que permite validar que toda página enlazada desde el índice legacy tenga destino actual.
- Ampliados los contratos de documentos con `LocalizedValue`, procedencia y estado de traducción; `npm run port:legacy-text` recompone la migración y `validate:data` comprueba paridad ES/EN.
- El build de marca genera PNG derivados desde SVG con Sharp; el build estático se verificó con `BASE_PATH=/light-delay`, incluidas rutas profundas bajo `/es/`.
- Corregida la instalación limpia de CI: `npm run check` compila primero los módulos generados de Paraglide y comparte su configuración con Vite, sin depender de archivos residuales de un build local anterior.
- El guion, diálogo, subtítulos derivados y descripciones narrativas de toma permanecen en español y quedan explícitamente diferidos a una fase editorial posterior.

## 2026-08-26 — Navegación y diseño responsive

- Corregido el shell responsive: escritorio recupera header global compacto + rail persistente, mientras móvil usa una barra inferior con marca, GitHub y hamburguesa que abre una hoja modal desde abajo.
- El cambio de layout se decide por capacidad tipográfica mediante `calc(26.88em + 52.8ch)`; el cuerpo usa `1rem` para respetar tamaño de texto, zoom y preferencias de accesibilidad sin incorporar un sensor JavaScript.
- El player conserva su presentación inmersiva en landscape; en portrait ordena frame, detalles de toma desplegables y controles persistentes, sin perder transporte, timeline ni retorno a edición.
- Auditadas las rutas de inicio, guion, animatic, arte, comparación, documentos, entidades y assets para evitar desborde horizontal y adaptar grillas, tablas, metadatos y controles a pantallas estrechas.
- Ampliadas las regresiones E2E para rail de escritorio, hoja inferior móvil, breakpoint tipográfico, viewport de 320 px, composición portrait del player y cambios de orientación sin perder toma, progreso ni estado del panel.

## 2026-08-26 — Placeholder y detalles editoriales del animatic

- Generada y registrada una claqueta técnica neutral 16:9 para referencias de imagen ausentes o fallos de carga, sin reemplazar ningún frame existente.
- Añadido estado editorial estructurado a `Asset` y `Take`; las 33 tomas provisionales de escenas 5–8 indican motivo, explicación, brief y toma de origen. Los reusos intencionales del tráiler permanecen sin marca.
- Editor y Modo película comparten resolución de medios: los frames reutilizados muestran «PLACEHOLDER» y los faltantes usan «IMAGEN PENDIENTE» sobre la claqueta.
- Reparado «Detalles de la toma» mediante un panel controlado y accesible, accionable por clic o con `D`, con información narrativa, técnica, temporal, editorial y de procedencia.
- Ampliadas validaciones y regresiones unitarias/E2E para estados visuales, fallback, navegación y panel móvil.

## 2026-08-26 — Preparación para despliegue estático en GitHub Pages

- Añadido `@sveltejs/adapter-static`, prerender global y fallback `404.html` para generar un sitio completamente estático.
- La configuración acepta `BASE_PATH`; el workflow de Pages compila con `/light-delay` mientras el desarrollo local permanece en `/`.
- Navegación, selector de scripts, comparación editorial prerenderizada, índices de entidades, páginas de assets y las 112 tomas/100 frames del animatic resuelven enlaces y medios mediante la base de SvelteKit; los IDs namespaced usan segmentos portables `:` → `~`.
- Nuevo workflow `.github/workflows/pages.yml`: instala con `npm ci`, valida datos, ejecuta `svelte-check` y Vitest, compila, sube `build/` y despliega a Pages en pushes a `master`; los pull requests sólo validan el build.
- La concurrencia del workflow queda aislada por referencia para que un PR no cancele un despliegue de `master`.
- El checkout de Pages descarga Git LFS para publicar las imágenes reales en lugar de sus archivos puntero.
- Eliminada la dependencia ya innecesaria `@sveltejs/adapter-auto`; `BASE_PATH` rechaza valores ambiguos con barra final.
- README y avisos de derechos actualizados para el sitio público `https://saabi.github.io/light-delay/`: la publicación no concede derechos sobre historia, canon o assets, y la plataforma reutilizable se mantiene como objetivo futuro aún no licenciado.

## 2026-08-26 — Advertencia de Zao, comunicaciones y arquitectura de Ardor

- Reescritas las escenas 5–8 del corto: Harlan activa el jammer al oír que la firma de Sorell parece falsa, corta COM A/B desde servicio y usa los dos recorridos axiales para construir su coartada.
- Zao comprueba wireless y cable, descarta Tierra/Proxima y apunta el láser exterior estándar a la posición futura de la nave mediante divergencia + raster; la decisión se cuenta en acción e interfaz, sin exposición forzada.
- Sorell presencia el aviso desde el puente, encuentra a Zao sola y queda como testigo con credencial comprometida, no como sospechosa; Okoye acompaña a Harlan por orden de Voss.
- Animatic principal ampliado de 100 a 112 tomas manteniendo 30:00 y reutilizando los 100 frames existentes; no se generaron imágenes. Las 33 tomas afectadas llevan notas de reemplazo provisional.
- Sincronizados guion/animatic heredados, Festival Cut, tráiler y tratamiento largo; nueva dimensión comparativa `canon:zao-transmission-mechanics`.
- Actualizados canon, Ardor, entidades, notas técnicas y requisitos de haz. `TODO.md` registra deuda de stills, documentos, cálculo óptico y futuro flujo JSON de notas de autor/estado visual.

## 2026-08-26 — Referencias de escala Proxima / Celestial Ardor

- Reubicadas hojas ortográficas: Proxima en `locations/proxima-station/proportional-reference.{svg,png}`, Ardor en `vehicles/celestial-ardor/proportional-reference.{svg,png}`.
- Comparativa multi-entidad en `art-bible/scale-references/proxima-ardor-common-scale-reference.{svg,png}`.
- Documentado el patrón en `docs/ASSET_PATH_MAP.md`; sección «Escala» en la biblia visual; assets registrados en `data/assets.json`.

## 2026-08-25 — Paquete higgsfield-uploads

- Staging en `higgsfield-uploads/` con hojas de personaje, localización y props renombradas (`light-delay-{kind}-{slug}.png`) para subir a Higgsfield.
- Excluidos Harlan y Rao (TODO de redesign); regenerable con `npm run prepare:higgsfield`.

## 2026-08-25 — Política narrativa: sin exposición forzada

- En `AGENTS.md`: regla obligatoria de evitar exposición forzada; revelar información por pensamiento en acción y decisión del personaje (p. ej. el cálculo de Zao al apuntar el láser), no con explicaciones dirigidas al público.

## 2026-08-25 — Comparación de canon y tratamiento largo recuperado

- Nueva taxonomía versionada y ruta `/compare/[scriptId]?against=<ScriptId>` para comparar canon declarado, eventos principales, reparto, variantes y funciones narrativas sin inferencias editoriales.
- Contratos y validación ampliados para variaciones de canon por script y procedencia desde scripts o documentos registrados.
- Registrados los dos documentos históricos y su revisión autorizada en español; recuperado el reparto completo de catorce nombres.
- Nuevo `script:light-delay-long`: tratamiento regenerable de 100 minutos, 4 actos, 28 escenas y 28 beats; adopta el canon vigente y no inventa diálogo, tomas ni assets.
- Documentados por separado los candidatos de retropropagación a las versiones cortas y las especialidades aún no resueltas de Volkov y Tanaka.

## 2026-08-25 — Retorno y fullscreen del modo película

- El retorno desde Modo película centra y enfoca la toma activa en el editor mediante su ID estable.
- Se añadió un control visible de «Pantalla completa» como alternativa fiable al intento automático que los navegadores pueden rechazar.
- `data/README.md` se sincronizó con el registro multi-script y los assets servidos desde `static/assets/`.

## 2026-08-25 — Paridad visual del modo película

- `AnimaticPlayer` rediseñado al chrome legacy: stage a pantalla completa, viñeta, meta ESCENA/TOMA, panel «Detalles de la toma», barra glass con controles icono + scrubber + «Editar tiempos».

## 2026-08-25 — Tráiler (~1:30) desde brief

- Nuevo `script:light-delay-trailer` (9 bloques del brief, 29 tomas, 90 s).
- Frames reutilizados del animatic de 30 min vía `imageAssetId` compartido; `sourceRefs` a shots del main.
- Generador `npm run build:trailer` (`scripts/build-trailer-script.mjs`).

## 2026-08-25 — Selector de guion en navegación

- `ScriptSwitcher` en el rail (`ProjectNav`): elegir cut desde cualquier ruta del AppShell.
- Enlaces Guion/Animatic usan el script activo; al cambiar cut se conserva la sección (guion/animatic/player) o se abre el guion elegido.
- Persistencia del script activo en `sessionStorage`.

## 2026-08-25 — Multi-script / Festival Cut (ADR-0001)

- Migración de IDs a forma `kind:slug` y unidades de guion namespaced (`main:…`, `festival:…`).
- Scripts en `data/scripts/`; registro y continuidades en `project.json`; `narrative-functions.json` y `entity-variants.json`.
- Borrador Festival Cut con lineage, `characterFunctionAssignments` y 7 escenas (shots/takes vacíos).
- Rutas acotadas por `scriptId` (encode `:`→`~`); overlay de animatic por script+versión; validación multi-script.
- ADR-0001 marcado Accepted.

## 2026-08-25 — Fases 2–6: shell, documentos, entidades, guion, animatic y player

- Tokens legacy (cian/oro) en `src/app.css`; `AppShell`, navegación y documentos genéricos.
- Rutas: `/`, `/documents/[slug]`, `/script`, `/animatic`, `/animatic/player`, `/art`, `/entities/[kind]`, `/entities/[kind]/[id]`, `/assets/[id]`.
- Copia (no movimiento) de `legacy-site/assets/{characters,locations,props,vehicles,art-bible,animatic}` → `static/assets/` (LFS verificado).
- Editor con overlay de duraciones en `localStorage`; player con play/pausa/stop, scrubber, subtítulos derivados del diálogo y retorno con `?shot=`.
- Stubs de documentos ampliados; e2e de inicio/guion/animatic; changelog y estado actualizados.

## 2026-08-25 — Fase 1 tipos, validación y extracción JSON

- Tipos en `src/lib/types/` según `JSON_FORMAT.md` + addendum i18n (`DialogueCue.content` como `LocalizedValue`, `ProjectLanguages`).
- Validadores a mano (sin Zod), repositorios, selectores y tests.
- `scripts/extract-legacy.mjs` genera `data/*.json` (100 shots, diálogo ES source); `validate:data` en verde.
- Actualizado `docs/SCRIPT_ANIMATIC_SYNC.md` (98/98 placements; títulos de escena siguen divergiendo en redacción).

## 2026-08-25 — Fase 0 inventario de migración

- Inventario verificado: 17 escenas, 100 tomas, 100 PNG (1:1). Véase `docs/MIGRATION_INVENTORY.md`, `docs/ASSET_PATH_MAP.md`, `docs/SCRIPT_ANIMATIC_SYNC.md`.

## 2026-08-25 — Migración de imágenes a `static/`

- `docs/MIGRATION_PLAN.md` incluye el traslado de assets de imagen desde `legacy-site/assets/` hacia `static/assets/` (URLs `/assets/...`), con inventario, mapeo, validación LFS y limpieza de duplicados.

## 2026-08-25 — Diálogo español como fuente de verdad (i18n)

- `docs/JSON_FORMAT_I18N_ADDENDUM.md` aclara que el diálogo en español es la fuente de verdad frente a otras traducciones; editar español primero y no inventar inglés en la extracción mecánica.
- Se añadió `docs/MIGRATION_PLAN.md`; ambos docs nuevos se guardaron en UTF-8 (sin BOM) y se corrigió mojibake de árboles/guiones en el plan.

## 2026-08-25 — Bootstrap SvelteKit 2 / Svelte 5

- Se creó la aplicación mínima en la raíz con TypeScript, ESLint, Prettier, Vitest y Playwright.
- Se añadieron layout/página de aterrizaje, prueba unitaria y smoke e2e de `/`.
- `legacy-site/`, `docs/` y `data/` permanecen intactos; no se migraron assets a `static/assets/`.
- Validación: format, lint, check, unit, e2e, build y preview.

## 2026-08-25 — Política de idioma y carga de AGENTS.md

- Se definió el español como fuente de verdad documental; el inglés es secundario si no hay copia española.
- Se exige sincronizar traducciones (o marcar el desfase) en la misma tarea.
- Se añadió `.cursor/rules/load-agents.mdc` (`alwaysApply`) para cargar `AGENTS.md` en cada sesión de Cursor.

## 2026-08-25 — Documentación SvelteKit y árboles ASCII

- Se restauró `docs/SVELTEKIT_SETUP.md` (estaba vacío en disco) y se reemplazó el árbol mojibake por ASCII.
- Se unificaron los diagramas de directorio en `README.md` y `docs/JSON_FORMAT.md` a ASCII para evitar re-corrupción por encoding en Windows.

## 2026-08-25 — Paquete inicial para Git

- Se preservó el sitio estático completo en `legacy-site/`.
- Se incorporaron 100 fotogramas del animatic y 23 hojas de referencia visual.
- Se añadió documentación de canon, estado, producción y procedencia.
- Se reservó `data/` para la futura fuente JSON canónica.
- Se añadieron instrucciones para la migración a SvelteKit y Git LFS.
