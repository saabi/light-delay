# Escaleta — Light Delay: Festival Cut

**Estado:** el esquema JSON de escaleta (`OutlineFile`/`OutlineStep`, ver `docs/ESCALETA.md`) ya está construido por otro agente y resultó suficiente para representar esta escaleta. Los mismos 44 pasos de este documento ahora también existen como datos estructurados en `data/outlines/light-delay-festival.json`, visibles en `/outline/light-delay-festival`. Este Markdown se conserva como versión narrativa/legible y como espacio para el análisis de integridad causal en prosa, que el esquema estructurado no modela bien (ver sección "Análisis de integridad causal" al final y la sección 6 de mejoras sugeridas al esquema).

**Fuente:** `docs/light-delay-festival-cut-adaptation.md` (estructura de secuencias A–G) + el estado real de `data/scripts/light-delay-festival.json` al 29/08/2026 (secuencias A–D construidas con tomas y cues; E–G existen sólo como plan).

**Cadena causal irreductible** (de la sección 2 del documento de adaptación, numerada para referencia cruzada en esta escaleta):

1. La misión se dirige a un primer contacto con los Velari.
2. Zao descubre un payload hostil no autorizado en el sistema diplomático.
3. Zao vincula a Harlan con el sabotaje y envía un mensaje hacia la posición futura de la nave.
4. Harlan corta wireless y COM A/B; Zao transmite por el láser exterior antes de morir.
5. Horas después, Elin descubre la mitad técnica del sabotaje (payload, disparador, aislamiento) pero no quién controla el override.
6. El mensaje retrasado de Zao llega a tiempo de modificar el desenlace.
7. La investigación de Elin + el mensaje de Zao se combinan para identificar a Harlan de forma verificable (la "doble llave").
8. Harlan activa el payload antes de perder el control.
9. Elin aplica la cuarentena ya preparada.
10. Los Velari responden sin hostilidad.
11. Zao "llega a tiempo", aunque muerta muchas horas antes.

---

## Secuencia A — La misión y la anomalía (`festival:scene-a`) · CONSTRUIDA

| Toma | Beat | Función causal | Notas |
|---|---|---|---|
| a-01 | PG exterior: Proxima, Júpiter, Celestial Ardor atracada | Establece #1 | Overlay "PRIMER CONTACTO — MISIÓN VELARI" |
| a-02 | Zao y Elin verifican el sistema; Elin se retira a preparar cuarentena; Harlan sólo por pantalla desde el puente | Establece #1; siembra que Elin ya está en su puesto técnico antes del asesinato (útil para #5, aunque sin conexión causal directa todavía — ver análisis) | Fix de continuidad aplicado: Harlan nunca físicamente en la sala; Elin sale explícitamente antes de que Zao quede sola |
| a-03 | Insert: consola de diagnóstico compara procesos declarados contra manifiesto; un bloque sin entrada se resalta como "PROCESO NO DECLARADO" | Dispara #2 (legibilidad diegética del hallazgo) | |
| a-04 | PP Zao: entiende que no es ruido | Cierra #2, abre #3 | |

## Secuencia B — Zao descubre y transmite (`festival:scene-b`) · CONSTRUIDA (10 tomas)

| Toma | Beat | Función causal | Notas |
|---|---|---|---|
| b-02 | Harlan llega sin ser visto al puente mientras Zao abre canal | Prepara #4 (Harlan en posición para interrumpir) | |
| b-01 | Zao reporta en vivo: payload firmado por Sorell, firma falsa, "el relé físico apunta a—" | Avanza #3 (parcial: no llega a nombrar a Harlan en abierto) | Corte por jamming — la acusación completa sólo existe en el mensaje grabado (cue-b-01), no en el canal en vivo |
| b-03 | Harlan activa jammer y corta COM A/B en el cilindro de servicio | Ejecuta #4 | |
| b-04 | Zao prueba wireless y ambos enlaces cableados: los tres caen a la vez | Motiva #3/#4 (confirma sabotaje deliberado) | |
| b-04a | Zao descarta Tierra (demora) y Proxima (**ocluida por Júpiter, sin línea de vista**) en voz alta | Refuerza #3 (justifica por qué el láser exterior es la única salida) | **Corregido en esta sesión**: Proxima se descarta por oclusión geométrica de Júpiter (Proxima en L1, boca local en L2 — Júpiter queda literalmente entre ambos), no por una vaguedad de "adquisición óptica" |
| b-04b | Insert: TIERRA y PROXIMA marcados en rojo con su motivo (retraso / disco de Júpiter cortando la línea de vista) | Refuerzo visual de b-04a | |
| b-04c | Insert: el sistema superpone plan de vuelo, tiempo lumínico y elipse de incertidumbre sobre el corredor de intercepción | Mecanismo diegético de #3/#4 (cómo el sistema ayuda a apuntar) | |
| b-05 | Alivio breve de Zao: la solución está lista | Transición a #4 | |
| b-06 | Zao graba el mensaje completo, incluyendo "Harlan alteró el núcleo" | Completa #3 (nombra a Harlan explícitamente, pero sólo en el registro, no en vivo) | |
| b-07 | El barrido llega a 100%; Harlan entra y ve "TRANSMITIDO", no el destino | Cierra #4, abre Secuencia C | |

## Secuencia C — Harlan / muerte de Zao / salto temporal (`festival:scene-c`) · CONSTRUIDA (10 tomas)

| Toma | Beat | Función causal | Notas |
|---|---|---|---|
| c-01 | Harlan: "¿A quién enviaste eso?"; Zao no responde | Ejecuta #4→asesinato | |
| c-10 | Harlan asume que fue a la Tierra, suspira, cierra distancia | Motor dramático (ironía): la suposición incorrecta de Harlan es la que permite que #6 funcione | Beat pedido explícitamente por Sebastián en la sesión anterior |
| c-02 | Asesinato fuera de campo | | |
| c-03 | Harlan borra cámaras y archivo local | Siembra la falta de evidencia directa que obliga a #7 a depender de la doble llave, no de pruebas forenses | |
| c-04/c-05 | Sorell llega sola, encuentra a Zao, no logra comunicarse (jammer activo) | | |
| c-06 | Harlan restaura COM A/B y vuelve al puente compuesto | | |
| c-07/c-08 | Voss pregunta por Sorell; Harlan miente ("No la vi"); Voss envía a Harlan+Okoye a buscarla | Establece la coartada espacial (Harlan llega primero al puente) | |
| c-09 | Overlay "23 H DESPUÉS · CANAL VELARI EN 03:00" | Salto temporal hacia #5 | |

## Secuencia D — La mitad técnica (`festival:scene-d`) · CONSTRUIDA (9 tomas) + 2 beats pendientes (decididos, no implementados)

**Decisión 29/08/2026** (conversación con Sebastián): se mantiene la doble llave — no se elimina, no se deja que el mensaje de Zao resuelva todo por sí solo — pero la Secuencia D necesita dos beats nuevos que hoy no existen en el guion ni en el animatic. Ver análisis de integridad causal, puntos 2 y 6.

| Toma | Beat | Función causal | Notas |
|---|---|---|---|
| **d-00 (NUEVO, pendiente)** | Beat de conexión: orden/alerta de auditoría de sistemas tras "el incidente" — sin forense, sin sospechosos | Dispara #5 (causa mostrada de por qué Elin investiga) | Cierra el gap entre C y D |
| **d-00b (NUEVO, pendiente)** | Elin o Voss nombran el riesgo real en voz alta: qué pasa si el payload se dispara al abrir el canal Velari (ataque, malinterpretación por los Velari, guerra) | Establece la angustia real de #5, no sólo el procedimiento técnico | Reemplaza el tono puramente clínico actual |
| d-01 | Elin sola en el puesto técnico, trabaja contra reloj | Abre #5 | Ahora motivado por d-00 |
| d-02/d-03 | Overlays: PAYLOAD DESPLEGADO / DISPARADOR: APERTURA CANAL VELARI / OVERRIDE: FIRMA NO IDENTIFICADA / CUARENTENA PREPARADA | Construye #5 | |
| d-04 | Elin cartografía el payload, deja cuarentena limitada; no puede atribuir el override | Cierra la mitad de #7 (la mitad de Elin) | |
| d-05/d-06 | Voss: "¿Puede detenerlo?" / Elin: "Puedo aislarlo. No puedo revocar a quien lo controla." | Establece el límite exacto de lo que falta para #7 | |
| d-07/d-09 | Harlan recomienda apagar mediación; Elin lo contradice; Voss corta la discusión | Harlan intenta sabotear la investigación de Elin sin delatarse — tensión adicional, no imprescindible para la cadena pero coherente con #4/#8 | |
| d-08 | Señal entrante humana detectada, "viene exactamente por nuestro corredor de vuelo" | Cierra Secuencia D, dispara #6 | |

## Secuencia E — La señal y la doble llave (`festival:scene-e`) · PENDIENTE (0 cues)

Plan (del documento de adaptación):

1. La señal se autentica como salida del transmisor físico de Zao.
2. Se reproduce el mensaje.
3. Harlan intenta invalidarlo: una voz puede falsificarse.
4. Elin no pide que le crean; ejecuta la instrucción de Zao.
5. Overlay/montaje de tres capas: payload + relé físico + credencial de mando.
6. Resultado: `R. HARLAN — INTEGRIDAD VERIFICADA`.
7. Voss revoca su credencial.
8. Harlan activa el override antes de que la revocación se propague.

Función causal: cierra #6 y #7 (la doble llave se combina aquí). Es la secuencia más densa pendiente y necesita el mismo rigor de diálogo real/reacciones/legibilidad diegética que `docs/CUIDADOS_NARRATIVOS.md` exige — actualmente sólo existe como lista de beats, sin tomas ni diálogo escrito.

## Secuencia F — Override y cuarentena (`festival:scene-f`) · PENDIENTE (1 cue sin colocar)

Plan: Harlan accede al núcleo o activa la rama hostil; Voss lo contiene o bloquea el acceso; Elin aplica la cuarentena ya preparada (no borra el payload, lo aísla). Cierra #8 y #9.

## Secuencia G — Contacto / cierre (`festival:scene-g`) · PENDIENTE (2 cues sin colocar)

Plan: reloj llega a cero; Elin abre el canal limpio; Voss: "Envíen."; respuesta Velari; hero shot; mensaje de Zao archivado; Voss: "Llegaste a tiempo." Cierra #10 y #11.

---

## Análisis de integridad causal

### 1. Resuelto en esta sesión: oclusión de Proxima por Júpiter

`shot-b-04a/b` ya no dice simplemente "sin adquisición óptica útil" — ahora especifica que Proxima (en L1 del sistema Sol–Júpiter, según `docs/technical/PROXIMA_STATION.md`) queda ocluida por Júpiter para una nave posicionada del lado de la boca local (L2, según `docs/CANON_DECISIONS.md`), lo que hace la razón geométricamente concreta y legible. Nota aparte: esto **no** contradice la advertencia de la sección 12 del documento de adaptación ("no restaurar la oclusión de Júpiter como explicación central") — esa nota se refiere específicamente a no usar a Júpiter para explicar el silencio general de Zao hacia la Tierra (el mecanismo canónico sigue siendo el sabotaje de Harlan); aquí Júpiter sólo explica por qué Proxima en particular no es una alternativa viable, un rol causal secundario y geométricamente verificable, no el bloqueo central de la trama.

### 2. Gap abierto (con decisión tomada): no hay beat que dispare la investigación de Elin, ni que establezca el riesgo real

Entre `shot-c-09` (salto de 23 horas) y `shot-d-01` (Elin ya trabajando "contra reloj" en el payload) no existe ningún beat que muestre **por qué** Elin está investigando esto, ni **qué está en juego** si falla. La secuencia C termina con Voss enviando a Harlan y Okoye a *buscar a Sorell* — no hay ninguna toma que muestre que Sorell fue encontrada, que alguien reportó lo ocurrido, o que se emitió algún tipo de alerta. Y la Secuencia D, tal como está escrita, es puramente procedimental (payload, disparador, cuarentena, "puedo aislarlo, no revocar") sin que nadie diga en voz alta qué pasaría si esto sale mal — ataque a la nave, malinterpretación por parte de los Velari, guerra.

Es importante separar esto de lo que la sección 7.2 del documento de adaptación prohíbe explícitamente: una **investigación policial del asesinato** (forense, interrogatorios, sospechosos, búsqueda del culpable) está descartada a propósito — el misterio del Festival Cut no es "¿quién mató a Zao?" sino "¿llegará a tiempo lo que Zao descubrió?". Por eso no se agrega una investigación del homicidio en sí.

Estructuralmente, la doble llave (punto 3.3 del documento) **no depende lógicamente** de que Elin sepa que Zao murió — ella podría llegar al mismo punto por auditoría rutinaria de sistemas antes del encuentro Velari. En ese sentido, la cadena causal formal (los 11 puntos) no se rompe sin estos beats. Lo que se debilita es la motivación dramática explícita y la tensión del segundo acto: choca con el cuidado #4 de `docs/CUIDADOS_NARRATIVOS.md` (las suposiciones y motivaciones operativas deben quedar explícitas) y con la preocupación de Sebastián de que, sin angustia real sobre lo que está en juego, la Secuencia D se sienta plana hasta que llega el mensaje de Zao.

**Decisión (29/08/2026):** mantener la doble llave — no dejar que el mensaje de Zao resuelva todo por sí solo, según el principio anti–deus ex machina de la sección 3.2 — pero agregar dos beats nuevos a la Secuencia D: `d-00` (beat de conexión, causa mostrada de la investigación) y `d-00b` (el riesgo real nombrado en voz alta). Ambos quedaron registrados como pasos `missing`/`required` en la escaleta estructurada (`data/outlines/light-delay-festival.json`). Pendiente: escribir el diálogo/overlay real y aplicarlo al guion y al animatic.

### 3. Observación menor: el vínculo "relé físico → Harlan" no se dramatiza, sólo se afirma

En `shot-b-01`, Zao dice en vivo que "el relé físico apunta a—" sin completar la frase (interrumpida por el jamming). El nombre de Harlan sólo aparece más tarde, en el mensaje grabado (`cue-b-01`: "Harlan alteró el núcleo"). No hay ninguna toma que muestre *cómo* Zao llega a esa conclusión específica (por qué el relé apunta a Harlan y no a otro tripulante). Esto es defendible como compresión intencional — el documento de adaptación pide absorber exposición en overlays y limitar diálogo — pero lo señalo como punto a vigilar: si en Secuencia E la "credencial de mando" se resuelve puramente desde el lado técnico de Elin (sin depender de esta deducción de Zao), la omisión es inofensiva; si el guion en algún momento necesita que el público entienda la lógica de Zao paso a paso, faltaría un beat.

### 4. Verificación: la doble llave en la Secuencia E (planeada) no depende del gap del punto 2

Revisé el plan de Secuencia E contra lo ya construido: el "relé físico" que aporta Zao ya está en su mensaje grabado (`cue-b-01`: "Crucen la rutina con el relé físico"), y el "payload" + posible rastro de "credencial" ya están en el trabajo de Elin (Secuencia D). La superposición de tres capas (payload + relé físico + credencial de mando) puede construirse enteramente a partir de contenido ya escrito, sin necesitar el beat de conexión del punto 2. Es decir: el gap del punto 2 es un problema de motivación/claridad de apertura de escena, no una fractura de la doble llave en sí.

### 5. Pendiente de revisión cuando se construyan E–G

No hice una auditoría toma-por-toma de E/F/G porque no existen tomas todavía — sólo la lista de beats del documento de adaptación. Cuando se construyan, esta escaleta debe actualizarse y volver a auditarse (según el cuidado #5 de `docs/CUIDADOS_NARRATIVOS.md`: revisión retroactiva, no sólo hacia adelante).

### 6. Evaluación del esquema estructurado (`OutlineFile`/`OutlineStep`) y mejoras sugeridas

El esquema que el otro agente construyó (`src/lib/types/outline.ts`, `docs/ESCALETA.md`, ruta `/outline/[scriptId]`) resultó **suficiente** para representar esta escaleta casi por completo — los 44 pasos de este documento ya están migrados a `data/outlines/light-delay-festival.json` y validan contra `validate:data`. Puntos a favor:

- `status: planned/covered/missing/deferred` distingue exactamente lo que necesitaba: tomas ya construidas (`covered`) vs. beats identificados pero no escritos (`missing`, como `d-00`/`d-00b`) vs. plan futuro sin tomas todavía (`planned`, Secuencias E–G).
- `notes` (tipo `continuity`, con `resolved: boolean`) resultó ser exactamente el lugar correcto para el análisis de integridad causal a nivel de paso — el hallazgo de Proxima/Júpiter y la decisión sobre la doble llave quedaron adjuntos como notas con `resolved: true/false`, en vez de vivir sólo en este Markdown.
- `majorEventId` conecta cada paso con la taxonomía compartida (`comparison-taxonomy.json`) — permitió reemplazar mi lista ad hoc de "11 puntos causales" por los eventos ya compartidos entre los cuatro guiones (`event:investigation`, `event:harlan-exposed`, etc.), que es más reutilizable a futuro.

Limitaciones encontradas, con sugerencias concretas:

1. **No hay relación de dependencia entre pasos.** No existe un campo tipo `dependsOn`/`blocks` para expresar, por ejemplo, "el paso 34 (triple coincidencia) depende de los pasos 13 (mensaje de Zao) y 26 (cartografía del payload)". Lo resolví en prosa (punto 4 de este análisis), pero como dato estructurado sería más verificable — un script de validación podría marcar automáticamente cuando un paso `covered` depende de otro que sigue `missing`. Sugerencia: agregar `dependsOnStepIds?: string[]` opcional a `OutlineStep`.
2. **No hay un reporte que agregue los gaps.** `report:outline-missing` sólo detecta guiones *sin ningún archivo* de escaleta — no escanea, dentro de una escaleta existente, los pasos `status: "missing"` con `importance: "required"` (que son exactamente los gaps de integridad causal más urgentes). Sugerencia: extender ese reporte (o agregar `report:outline-gaps`) para listar, por guion, todo paso `required`+`missing`/`deferred` — así el hallazgo de `d-00`/`d-00b` aparecería automáticamente en `npm run report:all` en vez de depender de que alguien lo escriba a mano en un Markdown.
3. **La UI no agrupa por secuencia/acto.** `/outline/[scriptId]` renderiza los pasos como una lista plana ordenada; con 44 pasos (y más cuando se completen E–G) se vuelve difícil escanear por secuencia. Como los `sceneIds` de cada paso ya identifican la secuencia (una escena = una secuencia en el Festival Cut), alcanzaría con agrupar visualmente por el primer `sceneId` de cada paso y mostrar un encabezado de sección — sin cambiar el esquema de datos, sólo la vista.
4. **Los pasos `missing`+`required` no se destacan visualmente.** Son la señal más importante para quien revisa integridad causal, pero hoy llevan el mismo tratamiento visual (badge de texto) que cualquier otro estado. Sugerencia: un borde o color distintivo para esa combinación específica en `/outline/[scriptId]`.

Ninguna de estas cuatro limitaciones impidió representar la escaleta — son mejoras incrementales, no bloqueantes. Estado posterior: `dependsOnStepIds`, `report:outline-gaps` y UI agrupada/destacada están en el toolchain; procedimiento en `docs/GUIA_ESCALETA.md`.
