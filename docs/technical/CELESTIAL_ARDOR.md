# Celestial Ardor — referencia técnica y visual

> Estado: documento de diseño canónico/semicanónico para continuidad, arte conceptual, modelado y guion.  
> Idioma fuente: español.  
> Entidad estructurada relacionada: `data/vehicles.json` → `vehicle:celestial-ardor`.

## 1. Identidad y función

La **Celestial Ardor** es una nave humana de larga duración construida originalmente en la Tierra y destinada posteriormente en la Estación Proxima. Ya se encontraba en Proxima, junto con su tripulación, cuando se descubrió la garganta piloto Velari. No fue diseñada para el primer contacto: el **núcleo/complemento diplomático** y los sistemas específicos de contacto fueron instalados posteriormente mediante retrofit en Proxima.

La nave debe sentirse como una máquina humana avanzada pero mantenible: funcional, reparable, estratificada, con sistemas visibles donde conviene al mantenimiento y sin lenguaje de crucero de lujo. Su identidad visual debe comunicar autonomía, disciplina técnica y capacidad de operar durante viajes prolongados.

## 2. Dimensiones y escala

### Canon previo

- Longitud establecida: aproximadamente **80–100 m**.
- Masa de referencia previa: aproximadamente **300 t**.
- Configuración: nave **axial** de larga duración.

### Dimensión de trabajo consolidada

Para arte conceptual, diagramas y consistencia visual se adopta como referencia:

- **Longitud total:** 90 m.
- **Diámetro máximo de casco:** 18 m **(parámetro de diseño de trabajo; no provenía del canon anterior y puede revisarse si surge una necesidad técnica o narrativa)**.
- Relación de aspecto aproximada: **5:1**.

Toda referencia visual futura debería mantener estas proporciones salvo que un documento posterior las reemplace explícitamente.

## 3. Propulsión y gravedad aparente

La Ardor utiliza una **antorcha de fusión D–³He** como propulsión principal. En los tramos de crucero apropiados, la nave acelera de manera casi constante y utiliza esa aceleración para producir gravedad aparente para la tripulación.

Consecuencia arquitectónica fundamental:

- El eje longitudinal de la nave coincide con el eje principal de empuje.
- La **proa** es la dirección prograde y, durante una fase de aceleración, corresponde conceptualmente a **arriba**.
- La **popa/motor** corresponde a **abajo** bajo gravedad aparente.
- Los pisos normales son **perpendiculares al eje de aceleración**.
- La tripulación se mantiene de pie con los pies orientados hacia la popa y la cabeza hacia la proa.

Esto significa que la Ardor no debe representarse internamente como un avión o submarino con cubiertas longitudinales horizontales. En un corte longitudinal, las cubiertas aparecen como planos transversales apilados a lo largo del eje.

### Inversión de mitad de trayecto

Cuando la misión requiere invertir el empuje para desacelerar, la nave interrumpe el empuje, entra temporalmente en microgravedad, rota aproximadamente 180° y vuelve a acelerar. Las mismas superficies siguen funcionando como pisos una vez restablecido el empuje.

## 4. Arquitectura interna axial

La organización general se conserva, en lo posible, según la secuencia ya establecida:

1. proa / sensores / atraque,
2. mando,
3. misión,
4. hábitat,
5. soporte y refugio,
6. sistemas diplomáticos,
7. ingeniería,
8. carga y consumibles,
9. tanques,
10. reactor/potencia,
11. motor y tobera magnética.

No todos los sectores corresponden a una única cubierta; algunos ocupan varias cubiertas transversales o volúmenes técnicos entre ellas.

## 5. Los tres troncos axiales de circulación

La nave posee tres conducciones longitudinales paralelas al eje de empuje.

### 5.1 Cilindro central de acceso

El **cilindro central de acceso** ocupa el eje geométrico principal de la nave y es la columna vertebral de circulación humana y logística.

Funciones:

- circulación entre cubiertas,
- escaleras/pasarelas y descansos durante aceleración,
- pasamanos y desplazamiento eficiente en microgravedad,
- transferencia manual de carga,
- evacuación y acceso de emergencia,
- conexión directa con el vestíbulo de atraque de proa.

Debe ser visualmente reconocible como el gran espacio axial de circulación de la Ardor. Las compuertas de presión/incendio pueden sectorizarlo por cubiertas o grupos de cubiertas.

### 5.2 Pozo de ascensor

Un **pozo de ascensor presurizado** corre paralelo al cilindro central, ligeramente fuera del eje.

Su razón principal es hacer práctico el acceso entre cubiertas durante períodos prolongados de aceleración cercana a 1 g. Debe admitir:

- varios tripulantes,
- equipos técnicos,
- camillas,
- carga moderada.

El ascensor no reemplaza los accesos de emergencia del cilindro central.

### 5.3 Cilindro de servicio

Un **cilindro de servicio** más estrecho corre también paralelo al eje, preferentemente en el lado opuesto al ascensor respecto del cilindro central para distribuir penetraciones estructurales.

Contiene o acompaña:

- líneas eléctricas y de datos,
- refrigeración,
- soporte vital,
- conducciones de fluidos,
- bandejas técnicas,
- escalera/agarres de mantenimiento,
- ruta secundaria de emergencia.

Narrativamente, este conducto permite movimiento técnico restringido sin utilizar la circulación principal.

## 6. Cubiertas y zonas funcionales

La siguiente distribución es la referencia actual para arte y continuidad. Los nombres son funcionales, no necesariamente rótulos diegéticos visibles.

### Proa — collar de atraque y sensores

La punta de la nave contiene el **puerto principal de atraque axial**. El collar de atraque se integra con una corona anular de sensores, evitando que el puerto destruya la capacidad de observación prograde.

Elementos:

- anillo/collar de captura,
- compuerta presurizada,
- vestíbulo de atraque,
- interfaces mecánicas,
- energía/datos/fluidos mediante umbilicales externos,
- sensores ópticos y navegación dispuestos alrededor del collar.

El cilindro central de acceso termina directamente en este vestíbulo.

**Nota de coherencia añadida durante el modelado — acceso al collar de atraque desde el puente:** entre el vestíbulo axial de mando (donde convergen cilindro central, ascensor y puente) y el vestíbulo de atraque/collar propiamente dicho hay un tramo corto (del orden de 2–3 m, estrechándose desde el radio del casco en la zona de mando hasta el radio del collar) que la tripulación debe cruzar. Este tramo funciona en dos regímenes distintos y ambos deben resolverse con el mismo mecanismo:

- **En crucero, bajo empuje**: cruzar este tramo significa subir literalmente "hacia arriba" (hacia proa) en contra de la seudogravedad — no es un tramo por el que uno pueda simplemente flotar o impulsarse sin apoyo.
- **Durante maniobras de atraque/desatraque reales**: el empuje principal está apagado o es mínimo (maniobra con RCS), por lo que la tripulación (y probablemente los invitados Velari en la escena de primer contacto) cruza este tramo en microgravedad real.

Ninguna escalera convencional cubre ambos regímenes, y el tramo es corto y de sección decreciente — no es una habitación caminable. La solución coherente con el resto del diseño (el cilindro central de acceso ya usa asas/pasamanos para circulación "mano sobre mano", tanto en gravedad de empuje como en microgravedad) es extender el mismo lenguaje: una barra/escalerilla continua de asas (utilizable como peldaños bajo empuje y como agarres en microgravedad) a lo largo de este tramo, entre el vestíbulo de mando y el interior del collar/compuerta presurizada. No se requiere una escalera con peldaños planos ni una pasarela separada — el mecanismo es el mismo que ya se usó para el cilindro central de acceso, solo que a menor escala y en un tramo con radio decreciente.

**Implementado**: un pasamanos/riel continuo (`Ardor_DockAccess_Rail_1..8`, ocho segmentos cilíndricos conectados extremo a extremo) que recorre el tramo completo entre el vestíbulo de mando (Y≈-342,4, radio≈3,75 respecto al eje del casco) y la garganta del collar (Y≈-339,95, radio≈1,35), con 4 travesaños perpendiculares (`Ardor_DockAccess_Rung_1..4`) distribuidos a lo largo del riel a modo de peldaños/asas. Material propio en amarillo de seguridad (`Mat_DockAccess_Ladder`) para visibilidad frente al casco gris.

*Nota de corrección*: una primera versión (4 asas sueltas + 2 agarres en anilla) se colocó muestreando el radio del casco directamente sobre la malla de baja resolución (`hull_radius_at_y`), cuyos valores son escalonados/discontinuos a esta escala — el resultado quedó disperso e incoherente como escalerilla, y así se reportó. La versión corregida usa **interpolación lineal suave** entre los dos radios de casco conocidos (extremo del vestíbulo y garganta del collar) para trazar el riel, en vez de muestrear la malla punto a punto. Ver también la convención equivalente anotada para el resto del hardware curvo del casco.


### Cubierta de mando

Contiene:

- puente,
- comunicaciones,
- navegación,
- mando de misión,
- archivo/logs operativos.

El puente es compacto y está organizado alrededor de consolas, no alrededor de una vista frontal estilo aeronave. Debido a la orientación de la gravedad, mirar físicamente hacia proa significa **mirar hacia arriba**.

Puede existir una ventana/puerto de observación prograde en el techo/parte superior del puente. No es necesaria para pilotaje rutinario: la navegación es principalmente instrumental y el espacio por delante suele carecer de referencias visuales útiles.

La salida del cilindro central, el pozo de ascensor y el acceso al puente convergen en un **vestíbulo axial de mando**. Desde las consolas puede verse la salida del cilindro central a través del acceso abierto del puente. La entrada restringida al cilindro de servicio queda próxima, pero retranqueada hacia un lateral del vestíbulo: un tripulante puede alcanzarla sin cruzar el campo visual normal del puente.

Dentro del cilindro de servicio, junto a la cubierta de mando, se encuentra el **distribuidor cableado de comunicaciones por cubiertas**. Es un bastidor mantenible con dos troncos redundantes, `COM A` y `COM B`, y acopladores dobles rotulados por zona funcional. Permite aislar una cubierta durante diagnóstico sin cortar energía, soporte vital ni controles locales. El acoplador `SISTEMAS DIPLOMÁTICOS — COM A/B` interrumpe voz, intercomunicador y datos operativos cableados de esa zona.

El respaldo cableado es independiente de la malla inalámbrica. A su vez, la consola local de contingencia del núcleo diplomático controla el láser exterior estándar mediante una canalización física dedicada que no atraviesa este distribuidor.

**Nota de blocking añadida durante el modelado — escena de Harlan en el puente (guion, beat del payload/relé físico):** el guion pide una toma donde Zao, por radio, está a punto de nombrar a Harlan ("El relé físico apunta a—Harlan") mientras Harlan, que ha subido en silencio por el cilindro central en microgravedad, se detiene justo fuera del umbral del puente sin que la tripulación lo note, y corta la transmisión con el jammer antes de que se oiga el nombre completo. Cue de referencia: "Desde las consolas del puente, Voss queda en primer término; detrás, la tripulación sujeta a sus puestos y Sorell escuchan. Al fondo, Harlan emerge del cilindro central y se afirma fuera del umbral sin que nadie lo vea." Escena en microgravedad (crucero sin empuje) — la tripulación está sujeta a sus puestos, no de pie.

La geometría ya construida resuelve esto sin cambios estructurales, por la razón de diseño ya anotada arriba (mirar hacia proa = mirar hacia arriba): el pedestal de mando, el arco del mamparo de proa y el vestíbulo axial de mando están **coaxiales** (mismo eje X=414, Z=0), de modo que el hueco del arco (radio 2,6 m) funciona como un "pozo" visible solo para quien esté cerca del eje central — no para la tripulación, cuyas consolas (anillo de radio 4,3 m) miran hacia el pedestal en horizontal, no hacia arriba por el pozo. Blocking propuesto:

- **Voss**: en el pedestal de mando (`Ardor_Bridge_CommandPedestal`), sujeta ahí por el protocolo de microgravedad, encarada hacia la cámara/el lado de la tripulación que escucha (p. ej. Wei, quien lleva comunicaciones).
- **Cámara**: fija, a baja altura, junto al pedestal (dentro del anillo de consolas, a menos de ~3-4 m del eje central — más afuera, el mamparo macizo tapa la vista del pozo) — Voss en primer plano, las seis consolas como anillo intermedio a los lados, y el arco + pozo + vestíbulo en fondo profundo, con Harlan asomado allí. Verificado visualmente en Blender (vista aislada con rayos X): desde ese punto el arco, el pozo del cilindro y el vestíbulo se leen como anillos concéntricos que se alejan en profundidad, exactamente el encuadre "umbral axial profundo... al fondo" que pide el guion.
- **Harlan**: en la boca del vestíbulo (Y≈-342,7 a -343, donde el cilindro central Fore se abre al vestíbulo), afirmado ahí en vez de entrar del todo — "se afirma fuera del umbral". La siguiente toma del guion (`celestial-ardor-command-vestibule`, detalle de su mano activando el jammer) empuja la cámara al propio vestíbulo, con el puente ahora desenfocado detrás de él.

**Implementado**: asa de agarre en U (`Ardor_CommandVestibule_ShaftGrip_Post1/Post2/Bar`) en Y=-342,8, ligeramente descentrada del eje (X≈414,35, para no cruzar la línea de visión axial hacia el arco/pedestal) junto a la boca del cilindro central en el vestíbulo. Mismo material amarillo de seguridad (`Mat_DockAccess_Ladder`) que el resto de agarres de la nave. Verificado en Blender (vista aislada con rayos X): el asa queda a escala correcta, cerca de la boca del eje, sin obstruir la abertura central.

### Cubierta(s) de misión

- sala de reuniones/briefing,
- puestos científicos,
- comunicaciones de misión,
- análisis,
- observación cuando corresponda.

### Hábitat

- camarotes,
- comedor/cocina,
- higiene,
- recreación básica,
- ejercicio,
- zonas comunes.

La nave fue concebida para viajes prolongados, por lo que estos espacios deben ser compactos pero habitables, no simples literas de transporte corto.

### Soporte / refugio

- enfermería,
- soporte vital,
- refugio de emergencia,
- consumibles críticos,
- almacenamiento de contingencia.

### Sistemas diplomáticos

El **núcleo diplomático/cuántico** fue añadido en Proxima como retrofit y, por tanto, **no ocupa el eje central**. Está montado fuera del eje, próximo al cilindro central para acceso operativo pero físicamente separado y sectorizable.

Posee una entrada operativa desde la circulación cotidiana y un ramal técnico secundario desde el cilindro de servicio. Ambos desembocan en puntos distintos de la instalación retrofit, lo que permite mantenimiento sin convertir el núcleo en parte del tronco axial.

El área incluye:

- cámara del núcleo diplomático,
- consolas de IA/mediación,
- control de protocolos,
- interfaces de diagnóstico,
- consola local cableada para puntería y transmisión mediante el láser exterior estándar.

El carácter de retrofit debe ser visible: arquitectura y cableado ligeramente distintos del casco original.

### Ingeniería

- diagnóstico,
- fabricación/reparación,
- controles de potencia,
- acceso a subsistemas,
- mantenimiento pesado,
- espacio de trabajo asociado a Zao.

Debe sentirse denso, reparable y físicamente accesible.

### Carga y consumibles

- repuestos,
- herramientas,
- agua,
- polímeros/materiales,
- contenedores,
- provisiones de larga duración.

### Tanques y sección de potencia

Hacia popa se encuentran volúmenes menos habitables:

- reactivos/combustible,
- blindaje,
- acumuladores térmicos,
- reactor,
- acondicionamiento de potencia,
- maquinaria de radiadores.

### Motor

La popa contiene:

- cámara/antorcha de fusión,
- bobinas de confinamiento,
- direccionamiento magnético,
- tobera magnética,
- blindaje térmico y estructural.

El motor debe quedar orientado **lejos de Proxima** durante el atraque normal.

## 7. Atraque

### Puerto primario

La referencia actual fija el atraque principal en la **punta de proa**, alineado con el eje longitudinal.

Ventajas:

- conexión directa con el cilindro central,
- geometría de transferencia simple,
- mínima pérdida de volumen interno,
- motor orientado lejos de la estación,
- lectura visual clara,
- compatibilidad con muelles externos axiales de Proxima.

### Relación con Proxima

La Ardor **no entra en un hangar presurizado de escala nave completa**. Se acopla externamente, proa primero, a un cabezal de atraque presurizado de Proxima. La transferencia se realiza mediante collar/túnel presurizado, con brazos de servicio y umbilicales externos.

Las menciones de “muelle interior” en material narrativo deben entenderse como el **interior del vestíbulo/concourse del muelle del lado de la estación**, no como una nave de 90 m alojada dentro de un hangar gigante.

## 8. Apariencia exterior

La Ardor debe leerse como una nave de ingeniería humana, no como un misil limpio ni una nave de lujo.

Rasgos recomendados:

- silueta axial alargada,
- proa relativamente estrecha con collar de atraque y corona de sensores,
- casco principal de sección aproximadamente circular/ovalada,
- módulos y paneles de mantenimiento legibles,
- radiadores y sistemas térmicos integrados con lógica funcional,
- sección de tanques/potencia más industrial hacia popa,
- motor claramente diferenciado,
- superficies blanco/gris/metal con detalles de identificación y desgaste técnico moderado.

El diseño puede ser elegante por proporción y disciplina visual, pero no ornamental.

## 9. Relación con escenas clave

La arquitectura debe sostener los espacios narrativos existentes:

- puente de mando,
- ingeniería,
- sala del núcleo diplomático,
- recorridos por pasillos/circulación,
- acceso de servicio,
- persecución y bloqueo de puertas,
- acceso técnico alternativo,
- transferencia con Proxima.

La existencia simultánea de cilindro central, ascensor y cilindro de servicio permite resolver movimientos de personajes sin convertir cada bloqueo de puerta en un callejón sin salida absoluto.

## 10. Reglas para arte conceptual e imagen generativa

1. Mantener una longitud de referencia de **90 m**.
2. Mantener el casco axial; no convertirlo en un avión con cubiertas longitudinales.
3. Representar pisos perpendiculares al eje de empuje.
4. Mantener tres troncos axiales: acceso central, ascensor y servicio.
5. Mantener el núcleo diplomático fuera del eje.
6. Mantener el puerto principal en la proa.
7. No sobredimensionar ventanas.
8. No introducir hangares internos para naves grandes.
9. No convertir la Ardor en un crucero militar ni de lujo.
10. Cuando aparezca junto a Proxima, respetar la escala real: una Ardor de 90 m es pequeña frente a una espina de estación de 650 m y hábitats de 300 m de diámetro.

## 11. Parámetros pendientes / revisables

- **Diámetro máximo 18 m:** valor de trabajo adoptado para referencias proporcionales; pendiente de canonización explícita si se desea fijarlo definitivamente.
- Distribución exacta de cada sala dentro de las cubiertas.
- Número exacto de cubiertas habitables.
- Capacidad nominal del ascensor.
- Diámetros finales de los tres troncos axiales.
- Geometría fina de radiadores y tanques.

Estos parámetros pueden refinarse sin alterar el principio arquitectónico central.

## 12. Checklist de modelado 3D (bloqueo Blender)

> Ver también `EXTERNAL_SCENES_AND_ANIMATION.md` para las tomas exteriores identificadas en el guion y la jerarquía de animación (rotación de hábitats, desatraque, maniobra de inversión, etc.) que involucran a esta nave/estación.


> Registrado tras la primera pasada de bloqueo en `blender/light-delay-blockout.blend`. Se actualizará con cada pasada de detallado.

### Construido

- [x] Casco exterior con silueta exacta derivada del SVG de referencia (90 m × 18 m), con bandas de color por sector a lo largo de los 11 sectores de §6.
- [x] Collar y puerto de atraque de proa (§7, §6 "Proa").
- [x] Corona de sensores alrededor del collar de proa (§6 "Proa").
- [x] Tres troncos axiales bloqueados como volúmenes de referencia — cilindro central de acceso, pozo de ascensor, cilindro de servicio (§5) — sin detalle interior todavía.
- [x] Núcleo diplomático: volumen exterior fuera de eje + nodo de retrofit visualmente distinguible (§6 "Sistemas diplomáticos").
- [x] Conjunto de motor: tambor de reactor, 3 bobinas de confinamiento, tobera magnética (§6 "Motor").
- [x] 6 aletas radiadoras, 3 a cada banda del casco (§8).
- [x] Orientación de atraque corregida: proa hacia la estación, motor en dirección contraria (§7, §6 "Motor" — "debe quedar orientado lejos de Proxima").
- [x] Líneas de panel/costuras del casco: 12 anillos en cada límite de sector más 4 costuras longitudinales en el tramo central de radio constante — legible sin ser ornamental (§8 "módulos y paneles de mantenimiento legibles").
- [x] 22 paneles de mantenimiento rectangulares distribuidos en misión/hábitat/soporte/ingeniería/carga (§8).
- [x] Marca de identificación del casco ("CA-07 · CELESTIAL ARDOR") en ambas bandas, cubierta de misión — código de cola inventado durante el modelado, no viene del documento ni del guion.
- [x] Corrección: la marca de identificación estaba plana (una placa recta apoyada sobre el casco); se corrigió doblando la malla del texto sobre la curvatura real del cilindro (radio de casco muestreado en la posición Y de la etiqueta) para que la marca quede genuinamente envuelta alrededor del casco en vez de ser una calcomanía plana.
- [x] Luces de navegación (estrobos rojo/verde, babor/estribor) junto a la corona de sensores de proa.
- [x] Detalle industrial adicional hacia popa: 4 paneles radiadores extra y 2 líneas de tubería exterior en la zona de ingeniería/carga/tanques (§8 "sección de tanques/potencia más industrial hacia popa").
- [x] Desgaste técnico moderado: 10 manchas/parches oscuros irregulares, concentrados en ingeniería/tanques/reactor (§8 "detalles de identificación y desgaste técnico moderado").
- [x] Interior del puente: piso circular en la sección de mando, vestíbulo axial de mando con arco de acceso abierto hacia el cilindro central (bulkhead con recorte central), 6 puestos de consola en anillo alrededor de un pedestal de mando central, escotilla de servicio retranqueada hacia un lateral (acceso al cilindro de servicio), ventana/puerto de observación prograde cerca de la punta del casco, y el distribuidor cableado COM A/B como bastidor con dos troncos dentro del cilindro de servicio junto a la cubierta de mando (§6 "Cubierta de mando").
- [x] Corrección de gravedad artificial: las consolas y el pedestal de mando estaban del lado equivocado del piso (más hacia popa/abajo que el piso mismo, en vez de sobre su cara hacia proa/arriba) y su "altura" estaba construida sobre el eje Z en vez del eje Y — el eje Y es el verdadero eje vertical de la nave bajo aceleración (proa = arriba, popa/motor = abajo), no Z. Reconstruidas de pie sobre la cara hacia proa del piso, con su dimensión de altura a lo largo de Y.
- [x] Interior de la sala del núcleo diplomático: esfera cian del núcleo sobre pedestal, dos consolas de IA/mediación flanqueando la esfera, consola de control de protocolos, panel de interfaz de diagnóstico, consola local del láser en tono distinto (indicando su cableado independiente), piso propio, puerta sellable en el acceso operativo (hacia la circulación principal) y una segunda abertura hacia el ramal técnico del cilindro de servicio (§6 "Sistemas diplomáticos"). El corredor completo que conecta este ramal técnico con el cilindro de servicio en sí queda como bloqueo simplificado, no un túnel modelado en detalle.
- [x] Corrección de gravedad artificial: el piso original estaba construido perpendicular al eje Z (una placa horizontal "Z-arriba" convencional), un eje completamente equivocado para esta nave — se reconstruyó perpendicular al eje Y (el extremo hacia popa/abajo de la sala), con la esfera, el pedestal y las 4 consolas de pie sobre su cara hacia proa/arriba, y las dos puertas reconstruidas como aberturas verticales (altura a lo largo de Y) en las paredes laterales en vez de con la orientación anterior.
- [x] **Corrección de interferencia física: los tres troncos axiales (cilindro central, ascensor, servicio) estaban modelados como cilindros sólidos de bloqueo a lo largo de los 84 m completos de la nave**, sin hueco alguno. Al añadir mobiliario interior real en el eje de cada tronco, tres piezas quedaban literalmente dentro del material sólido del tronco correspondiente: el pedestal de mando del puente (dentro del cilindro central), la esfera del núcleo diplomático (dentro del pozo de ascensor — la sala del núcleo diplomático comparte el mismo offset lateral que el ascensor) y el bastidor distribuidor COM A/B (dentro del cilindro de servicio, donde el propio documento pide que esté). Solución aplicada, consistente con la propia redacción del documento ("la salida del cilindro central... converge en un vestíbulo axial de mando" — el corredor termina ahí, no lo atraviesa): cada uno de los tres troncos se dividió en un segmento de proa y uno de popa con un hueco exactamente donde está la pieza en cuestión — `Ardor_Trunk_MainAccess_Fore/Aft` (hueco Y -346.9 a -350.9, cubre el puente), `Ardor_Trunk_Elevator_Fore/Aft` (hueco Y -391.7 a -395.7, cubre el núcleo diplomático), `Ardor_Trunk_Service_Fore/Aft` (hueco Y -350.6 a -352.4, cubre el distribuidor COM). La circulación de la nave por ese tramo puntual queda cubierta por los otros dos troncos paralelos, que sí siguen corridos — de ahí la redundancia de tener tres troncos en primer lugar.

### Pendiente según el documento

- [x] ~~Cubierta de mando: puente compacto de 6 puestos, vestíbulo axial de mando, distribuidor cableado COM A/B (§6 "Cubierta de mando").~~ Hecho — ver arriba.
- [ ] Cubierta(s) de misión: briefing, puestos científicos, comunicaciones de misión (§6).
- [ ] Hábitat: camarotes, comedor/cocina, higiene, recreación, ejercicio (§6).
- [ ] Soporte/refugio: enfermería, soporte vital, refugio de emergencia, consumibles críticos (§6).
- [x] ~~Interior de la sala del núcleo diplomático: cámara del núcleo, consolas de IA/mediación, consola local del láser (§6 "Sistemas diplomáticos").~~ Hecho — ver arriba.
- [x] ~~Ingeniería como espacio habitable: estaciones de diagnóstico/fabricación, controles de potencia, puesto de trabajo de Zao (§6 "Ingeniería").~~ Hecho — ver arriba.
- [ ] Carga y consumibles (§6).
- [ ] Sección de tanques y potencia más allá del tambor del reactor: blindaje, acumuladores térmicos, acondicionamiento de potencia (§6 "Tanques y sección de potencia").
- [x] ~~Detalle interior de los tres troncos axiales: pasamanos, compuertas de sectorización, descansos (§5).~~ Hecho — ver arriba (cilindro central: anillos de pasamanos + descansos; cilindro de servicio: bandejas técnicas + agarres).
- [x] ~~Paneles de mantenimiento, marcas de identificación y desgaste técnico visible en el casco (§8).~~ Hecho — ver arriba.
- [x] ~~Puerto/ventana de observación prograde en el techo del puente (§6 "Cubierta de mando").~~ Hecho — ver arriba.
- [x] Vestíbulo axial de mando (`location:celestial-ardor-command-vestibule`): umbral del ascensor visible desde el vestíbulo, entrada al cilindro de servicio retranqueada fuera de la línea visual del puente, según lo pedido por `data/locations.json` para esta ubicación.
- [x] Ingeniería (`location:celestial-ardor-engineering`, zona de trabajo distinta del tambor del reactor en popa): pasarela/catwalk anular alrededor del cilindro central de acceso, 5 tramos de tubería expuesta con collarines de unión distribuidos alrededor, estación de diagnóstico, estación de fabricación, consola de control de potencia y el puesto de trabajo de Zao en un tono distintivo (verde) para que se lea como personalizado.
- [x] Corrección de gravedad artificial: las 4 estaciones estaban dispersas a lo largo de un rango de Y en vez de apoyadas sobre una única cara del catwalk, y su altura usaba el eje Z. Reconstruidas de pie sobre la cara hacia proa/arriba del catwalk, con altura a lo largo de Y.
- [x] Cilindro central de acceso (`location:celestial-ardor-central-access`): 6 anillos de pasamanos espaciados a lo largo de los 84 m, cada uno con una pequeña plataforma de descanso — apoya la circulación "mano sobre mano" en microgravedad que pide el documento.
- [x] Cilindro de servicio (`location:celestial-ardor-service-cylinder`): 6 bandejas técnicas periféricas con agarres de mantenimiento distribuidas a lo largo del tronco.

### Detalle añadido durante el modelado, no descrito explícitamente en el documento

- Bandas de color por sector sobre el casco — ayuda visual de producción/continuidad, no una característica narrativa del diseño.
- Código de cola "CA-07" — número de registro inventado; no aparece en ningún documento ni guion. Revisar/reemplazar si hay un identificador canónico.
- Recuento y distribución exactos de líneas de panel, paneles de mantenimiento y manchas de desgaste — el documento pide el efecto general ("legibles", "desgaste técnico moderado"), no un mapa de coordenadas.
- Constantes de acople de atraque concretas (collar: radio mayor 1.6 m; puerto: radio 1.2 m) — cifra de ingeniería fijada durante el modelado para garantizar compatibilidad geométrica con Proxima; el documento no fijaba un valor.
- Geometría específica de la tobera magnética (radios de expansión bow/stern) y disposición exacta de las 3 bobinas de confinamiento.
- Distribución exacta de los 6 puestos de consola del puente (anillo hexagonal regular) y disposición interna de la sala del núcleo diplomático (4 consolas + esfera + puerta) — el documento pide la lista de elementos funcionales pero no una disposición geométrica; se eligió una distribución compacta y legible.
- Color cian con emisión para la esfera del núcleo diplomático, siguiendo la descripción de `data/locations.json` ("la esfera cian, su estado rojo corrompido"); el estado rojo corrompido para la escena de sabotaje no está implementado todavía (requeriría un material/estado alternativo animado o intercambiable para esa toma específica).
- Pasamanos/riel continuo de acceso al collar de atraque (`Ardor_DockAccess_Rail_1..8` + `Ardor_DockAccess_Rung_1..4`) entre el vestíbulo de mando y la compuerta del collar — el documento no detalla este tramo, pero requiere algún mecanismo de tránsito válido tanto bajo empuje como en microgravedad real durante maniobras de atraque. Trazado por interpolación lineal entre los radios de casco conocidos en ambos extremos, no por muestreo directo de la malla (ver nota de corrección en la sección del vestíbulo de mando).
- Segmentación de los tres troncos axiales en tramos de proa/popa con huecos puntuales (ver corrección de interferencia física arriba) — el documento no especifica esta segmentación; es una consecuencia necesaria de que los troncos ahora comparten eje con mobiliario interior real.
- **Convención de "arriba/abajo" para todo el interior de la nave (importante para cualquier trabajo futuro)**: el eje vertical real de la Ardor bajo aceleración es el eje mundial Y (el eje de empuje), NO Z. Proa (Y menos negativo, hacia -339.7) es "arriba"; popa/motor (Y más negativo) es "abajo" — la seudogravedad durante el empuje empuja todo hacia popa. Cualquier piso es un disco perpendicular a Y, y cualquier mueble/consola que se apoye en él debe tener su dimensión de altura a lo largo de Y (no Z) y estar del lado hacia proa (menos negativo) del piso, nunca del lado hacia popa. El cilindro central de acceso y el cilindro de servicio son corredores axiales de tránsito en microgravedad, no cubiertas con piso propio, así que esta convención no les aplica igual (ver `data/locations.json`: "circulación... mano sobre mano", "tramos libres para desplazamiento por inercia").
- Asa de agarre en la boca del vestíbulo (`Ardor_CommandVestibule_ShaftGrip_Post1/Post2/Bar`, Y≈-342,8, ligeramente descentrada del eje) — necesaria para el blocking de la escena de Harlan en el puente (ver nota bajo "Cubierta de mando"); no había ningún agarre existente exactamente en ese punto (el pasamanos/plataforma de descanso más cercano del cilindro central está en Y=-348, dentro de la cámara del puente, no en el vestíbulo).

### Áreas requeridas por guion (`data/scripts/*.json`) — priorizar su detallado

Recuento de referencias a `locationId` en `scenes`/`shots` de los 4 guiones (`light-delay-festival.json`, `light-delay-long.json`, `light-delay-main-short.json`, `light-delay-trailer.json`). Estas ubicaciones aparecen efectivamente en tomas y necesitan diseño 3D más allá del bloqueo actual:

| Ubicación | `locationId` | Apariciones en escenas/tomas |
|---|---|---|
| Puente del Celestial Ardor | `location:celestial-ardor-bridge` | **114** — la ubicación más usada de toda la historia; máxima prioridad |
| Sala del núcleo diplomático | `location:diplomatic-core-room` | **47** — escenario del sabotaje; segunda prioridad |
| Ingeniería del Celestial Ardor | `location:celestial-ardor-engineering` | 8 |
| Vestíbulo axial de mando | `location:celestial-ardor-command-vestibule` | 4 |
| Cilindro de servicio | `location:celestial-ardor-service-cylinder` | 4 |
| Cilindro central de acceso | `location:celestial-ardor-central-access` | 2 |

Nota: `data/locations.json` ya trae una descripción corta por cada una de estas ubicaciones (útil como punto de partida al modelarlas). También aparecen `location:proxima-dock` (14, ya cubierto por el exterior de Proxima) y dos ubicaciones fuera del alcance de este documento — `location:velari-station` (4) y `location:velari-wormhole-mouth` (5) — que no corresponden ni a la Ardor ni a Proxima y no tienen modelo 3D todavía.
