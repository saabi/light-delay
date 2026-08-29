# Escenas exteriores y necesidades de animación

> Estado: documento de planificación de producción, derivado de `data/scripts/*.json` y `data/locations.json`. No reemplaza a `CELESTIAL_ARDOR.md` ni a `PROXIMA_STATION.md` — los complementa con la vista "qué se ve desde afuera y qué se mueve". Idioma fuente: español. Ver también `ANIMATION_WORKFLOW.md` — este documento dice *qué* hace falta animar; ese dice *cómo* organizar los archivos y el proceso para hacerlo.

Este documento no implica trabajo de modelado o animación inmediato. Es un mapa de lo que hará falta cuando se aborde la fase de tomas exteriores y animación, para no tener que rederivarlo del guion cada vez.

## 1. Objetos del sistema solar y entorno necesarios

| Objeto | ¿Ya existe? | Por qué hace falta | Notas |
|---|---|---|---|
| Celestial Ardor | ✅ modelo 3D (bloqueo + detalle exterior) | Protagonista de toda toma exterior | — |
| Estación Proxima | ✅ modelo 3D (bloqueo + detalle exterior) | Ubicación de partida | — |
| Júpiter | ✅ bloqueo 3D | Fondo explícito en `main:shot-01-01`/`trailer:shot-a-01` ("Júpiter pequeño al fondo") y en el sobrevuelo de `main:scene-03` ("La nave bordea Júpiter con amplio desplazamiento lateral") | `Env_Jupiter` usa escala física de referencia; las tomas finales pueden requerir una ampliación artística documentada para leer el disco. |
| Sol | ✅ luz de entorno | Fuente de luz principal de toda la secuencia; nunca se menciona en cuadro pero condiciona todas las sombras/exposición | `Env_Sun`; no incluye disco solar visible. |
| Campo de estrellas | ✅ shader de mundo | Fondo de cualquier toma exterior fuera de la silueta de Júpiter/Proxima (`celestial-ardor-bridge` shot "rack focus archivo/estrellas", tomas de crucero) | Fondo procedural estático; verificar en modo Material/Rendered. |
| Boca Velari (campo de nodos) | 🟡 diferido | `location:velari-wormhole-mouth` — `main:shot-07-08`, `main:shot-07-10`, `trailer:shot-f-01/02` | **Decisión (29/08/2026): no se modela en Blender.** Es orgánica — campo distribuido de nodos negros separados por kilómetros, apertura de 150–200 m solo durante el pulso — y se deja en manos del pase de generación de video por IA en vez de bloqueo 3D. Ver `PRODUCTION_ROADMAP.md` paso 5. |
| Estación Velari | 🟡 diferido | `location:velari-station` — escenas de reconocimiento/contacto (`long:scene-26/27`, `festival:scene-07`, `trailer:scene-09`) | **Decisión (29/08/2026): no se modela en Blender.** Hábitat orgánico continuo de varios km, piel viva — mismo criterio que la boca Velari, mejor resuelto por el pase de IA que por geometría explícita. |
| Nave emisaria Velari | 🟡 diferido | `long:scene-27` ("Una nave emisaria distinta de la estación se aproxima") | **Decisión (29/08/2026): no se modela en Blender.** Mismo criterio — orgánica/no humana, se deja al pase de IA. |

## 2. Jerarquía de animación necesaria (rig)

La jerarquía básica ya está construida: los dos hábitats tienen pivotes propios y toda la Ardor depende de `Ardor_Root`. Esto habilita las animaciones, pero no significa que sus curvas, cámaras o renders finales estén producidos.

| Elemento | Comportamiento requerido | Notas de implementación |
|---|---|---|
| Hábitats de Proxima (rueda A y B) | Rotación continua independiente, sentidos opuestos, ~1,73 rpm nominal (§3 de `PROXIMA_STATION.md`) | `Proxima_Habitat_A_Pivot` y `Proxima_Habitat_B_Pivot` ya agrupan cada hábitat conservando su posición mundial. Falta autorar la rotación final. La espina no rota. |
| Estación Proxima (conjunto) | Permanece fija/no rotante como referencia de cámara | Ya es coherente con el modelo actual (espina como raíz implícita). |
| Celestial Ardor — desatraque | Traslación de separación del muelle 1 + retracción de brazos de servicio/umbilicales | Hoy la nave está estáticamente "ya atracada"; falta una animación de separación (posición inicial atracada → posición final alejándose) y, opcionalmente, apertura del collar de captura de Proxima. |
| Celestial Ardor (conjunto completo) | Traslación y rotación de toda la nave como unidad | `Ardor_Root` ya agrupa el conjunto sin desplazar las piezas. Falta autorar movimientos y cámaras de cada toma. |
| Maniobra de inversión de mitad de trayecto | Rotación de ~180° de toda la nave en microgravedad, luego reanudación del empuje (§3 de `CELESTIAL_ARDOR.md`; confirmado en guion, `main:scene-XX` ingeniería: "Zao asegurada en caída libre mientras la nave rota; 1 g retorna hacia el mismo piso al reanudar el frenado") | Requiere el mismo empty raíz de arriba. Es una rotación de la nave completa, no solo de cámara — el guion es explícito en que los objetos sueltos flotan y se re-asientan cuando el empuje regresa. |
| Radiadores de la Ardor | Plegado/repliegue antes de maniobras (guion: "radiadores recogidos antes del giro", sobrevuelo de Júpiter) | Hoy las 6 aletas son mallas estáticas fijas al casco — hace falta articularlas (bisagra/pivote por aleta) si se quiere animar el repliegue. |
| Sobrevuelo de Júpiter | Desplazamiento lateral amplio de cámara/nave, planeta fuera del eje de trayectoria (`main:scene-03`, cámara "24 mm exterior · planeta fuera del eje de trayectoria") | Depende de tener a Júpiter modelado (§1) y de la posición Proxima/Júpiter/L1 acordada (§4). |
| Boca Velari — apertura | Campo de nodos que se activa y forma una región navegable durante una ventana limitada; el hueco de 150–200 m solo existe durante el pulso | Animación de aparición/pulso de los nodos + una "ventana" que se abre y se colapsa detrás de la nave al cruzar (`main:shot-07-10`: "distorsión total y colapso detrás"). |
| Posición orbital Proxima @ L1 Sol–Júpiter | Actualmente una posición fija en la escena; el movimiento orbital real (Proxima/Júpiter alrededor del Sol) probablemente no sea necesario para tomas puntuales de duración corta | Marcar como **a confirmar con dirección** antes de invertir tiempo en un rig orbital completo — es plausible que baste con una posición congelada por toma. |

## 3. Tomas y escenas exteriores identificadas en el guion

Extraído de `scenes`/`shots` en los 4 archivos de `data/scripts/` cuyo `locationId` es una ubicación exterior (`proxima-dock`, `proxima-station`, `velari-wormhole-mouth`, `velari-station`), más las referencias a Júpiter/maniobras de vuelo encontradas en descripciones y notas de cámara aunque su `locationId` sea una ubicación interior (la cámara mira hacia afuera o el guion describe la nave desde fuera).

| Guion | Escena/toma | Ubicación | Qué se ve | Elementos exteriores requeridos |
|---|---|---|---|---|
| main-short | `shot-01-01` / trailer `shot-a-01` | `proxima-dock` | Exterior de Proxima, eje 500–800 m, hábitats contrarrotando, Ardor atracada, Júpiter pequeño al fondo | Proxima ✅, Ardor ✅, Júpiter ✅, pivotes ✅; falta animación/render final de rotación. |
| main-short | `shot-01-02` a `shot-01-08` | `proxima-dock` | Preparativos de embarque (mayormente interior/pantallas, con Proxima de fondo) | Sin requisitos exteriores nuevos más allá de lo anterior |
| main-short | escena de puente, "Mano de Cael confirma separación y empuje" | `celestial-ardor-bridge` (interior, implica exterior) | Momento de desatraque/separación de Proxima | `Ardor_Root` ✅; falta animación de desatraque y umbilicales. |
| main-short | `scene-03` / sobrevuelo | `celestial-ardor-engineering` (interior, referencia exterior) | "La nave bordea Júpiter con amplio desplazamiento lateral; radiadores recogidos antes del giro" | Júpiter ❌, radiadores articulados ❌ (rig), maniobra de giro/inversión ❌ (rig) |
| main-short | toma de inversión de mitad de trayecto | `celestial-ardor-engineering` | "Zao asegurada en caída libre mientras la nave rota; 1 g retorna... al reanudar el frenado" | Maniobra de inversión ❌ (rig) — ver §2 |
| main-short | `shot-07-08` | `velari-wormhole-mouth` | "Los nodos forman la garganta" — campo instrumental de nodos separados por km | Boca Velari — diferido, ver §1 |
| main-short | `shot-07-10` | `velari-wormhole-mouth` | "Cruce por inercia y colapso" — la Ardor cruza, distorsión total, colapso detrás | Boca Velari — diferido, ver §1; animación de apertura/colapso ❌ (rig, sigue haciendo falta si se anima el cruce) |
| trailer | `shot-f-01` / `shot-f-02` | `velari-wormhole-mouth` | Mismas tomas que `main-short` `shot-07-08`/`07-10`, versión trailer | Igual que arriba |
| long | `scene-10` "Expansión y cruce" | `velari-wormhole-mouth` | Cruce sin poder cancelar la expansión con seguridad | Igual que arriba |
| long | `scene-26` "Reconocimiento limitado" | `velari-station` | La estación Velari responde con un patrón que autoriza aproximación | Estación Velari — diferido, ver §1 |
| long | `scene-27` "Emisaria" | `velari-station` | Una nave emisaria se aproxima; escala humana subordinada al encuentro | Estación Velari — diferido, ver §1; nave emisaria Velari — diferido, ver §1 |
| festival | `scene-07` "Contacto / cierre" | `velari-station` | Envío, contacto y «Llegaste a tiempo» | Estación Velari — diferido, ver §1 |
| trailer | `scene-09` "Título" | `velari-station` | Tarjeta de título; pulso Velari | Estación Velari — diferido, ver §1; pulso/apertura ❌ (rig, si se reutiliza el de la boca) |

## 4. Notas de escala y posición (para verificar, no canónico todavía)

- **Proxima en L1 Sol–Júpiter** (§2 de `PROXIMA_STATION.md`): la distancia del punto L1 a Júpiter es aproximadamente `d_Júpiter × (m_Júpiter / 3·m_Sol)^(1/3)`. Con `d_Júpiter–Sol ≈ 778,5 millones de km` y la relación de masas Júpiter/Sol ≈ 1/1047, da **L1 a ≈ 52,7 millones de km de Júpiter** (del lado del Sol). Es una cifra derivada de mecánica orbital estándar, no un valor fijado en los documentos existentes — verificar antes de usarla como canon.
- **Tamaño angular de Júpiter visto desde Proxima**, con esa distancia y el radio real de Júpiter (~69.911 km): diámetro angular ≈ **9 minutos de arco** — unas 13 veces más grande que el Júpiter visto desde la Tierra (~40 segundos de arco), pero aun así un disco pequeño en el encuadre, consistente con la acotación del guion "Júpiter pequeño al fondo".
- Ninguna de estas cifras está en `PROXIMA_STATION.md` ni en `CELESTIAL_ARDOR.md` todavía — si se confirman, deberían promoverse a esos documentos (o a uno nuevo de referencia astronómica) en vez de vivir solo aquí.
