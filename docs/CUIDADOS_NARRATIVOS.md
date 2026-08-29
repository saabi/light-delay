# Cuidados narrativos al generar guion, diálogo y animatics

**Origen: retroalimentación de Sebastián al revisar las secuencias A–C del Festival Cut (29/08/2026).** Esto no es un documento teórico — nace de errores concretos encontrados en tomas ya construidas.

## 1. Diálogo real en vez de resumen en tercera persona

Un cue de tipo `action` que resume un intercambio verbal ("Harlan niega haber visto a Sorell") no es lo mismo que ese intercambio ocurriendo en pantalla. Si el momento tiene peso dramático — una negación, una orden, una revelación — **escribir el diálogo real**, no sólo narrarlo. Reservar los cues de acción-resumen para beats puramente físicos o de tránsito (alguien cruza un pasillo, una pantalla cambia de estado).

Señal de alerta: una descripción de toma que usa un verbo de habla en tercera persona (niega, ordena, pregunta, admite) sin que exista un cue de diálogo correspondiente.

## 2. Reacciones y expresiones

Toda acción con consecuencia dramática necesita mostrar cómo reacciona cada personaje presente — no basta con narrar el hecho. Preguntarse, por cada toma: ¿qué gesto, pausa o expresión tiene el personaje que la protagoniza o la observa? Un hallazgo, una pérdida de comunicación, un enfrentamiento — todos necesitan una reacción visible, aunque sea mínima (una mano que se tensa, una mirada que no se aparta).

## 3. Legibilidad diegética

Cuando la trama depende de que el público (o un personaje) entienda un hecho técnico o abstracto — "proceso no declarado", "firma falsa", "cuarentena preparada" — la toma debe mostrar el **mecanismo concreto** por el cual eso se sabe: qué aparece en pantalla, qué compara el sistema, qué alerta se dispara. No basta con afirmar la conclusión ("aparece un proceso no declarado"); hay que mostrar cómo el sistema (y por lo tanto el público) llega a esa conclusión.

Ejemplo del error encontrado: `festival:shot-a-03` decía sólo "una envoltura/proceso no declarado aparece en el diagnóstico" sin mostrar cómo el sistema determina eso. Corrección: mostrar la consola comparando la lista de procesos declarados contra el manifiesto, y el bloque sin entrada correspondiente resaltado como alerta.

## 4. Suposiciones legibles sin exposición forzada

Cuando un personaje actúa sobre una suposición incorrecta, la puesta debe aportar evidencia suficiente para inferirla: qué vio, qué no pudo ver, qué opción descarta y cómo cambia su conducta. No es obligatorio verbalizar la suposición ni explicar el mundo al público. En el caso de Harlan, alcanza con que vea el envío pero no el punto de mira y actúe convencido de haber llegado a tiempo; el montaje posterior revela que Zao resolvió otro destino. Si se usa diálogo, debe cumplir una función inmediata del personaje, no una explicación para la audiencia.

## 5. Revisión retroactiva, no sólo hacia adelante

Al construir una secuencia nueva, revisar también las tomas ya construidas de secuencias anteriores en busca de estos mismos huecos — no asumir que quedaron bien la primera vez. Estos cuatro cuidados se suman a los dos ya establecidos en `docs/PLAN_SINCRONIZACION_ANIMATICS.md` (causalidad temporal y consistencia de ubicaciones/terminología): antes de dar por cerrada una toma, revisar diálogo real, reacciones, legibilidad diegética y motivación inferible — y releer las tomas vecinas para confirmar que la secuencia entera sostiene la misma lógica interna.
