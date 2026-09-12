# Hoja de ruta de producción 3D (Blender)

> Estado: plan de trabajo acordado con Sebastián el 28/08/2026, para no tener que re-derivarlo de la conversación. Se actualiza al cerrar cada paso o si el orden cambia. Ver también `EXTERNAL_SCENES_AND_ANIMATION.md` (qué falta y por qué), `ANIMATION_WORKFLOW.md` (cómo organizar archivos/proceso de animación una vez que el guion cierre) y las checklists de `CELESTIAL_ARDOR.md` §12 / `PROXIMA_STATION.md` §14 (qué está construido).

## Orden acordado

1. **Rig de animación (fundacional, antes de más detalle)**
   - Empty pivote centrado en el cubo de cada hábitat de Proxima (A y B), con el aro/rayos/costillas/banda de ventanas parentados a ese empty — hoy son mallas sueltas sin punto de rotación común.
   - Empty raíz único para toda la colección de la Celestial Ardor — hoy la nave se reposiciona moviendo `.location` de cada objeto por separado, lo cual sirve para bloqueo estático pero no es animable.
   - Razón de prioridad: nada es animable todavía (ni siquiera un giro de prueba) sin esto, y es mucho más barato hacerlo ahora que después de agregar más geometría para reparentar.

2. **Júpiter + campo de estrellas (barato, desbloquea la toma más reutilizada)**
   - Esfera con textura razonable para Júpiter; starfield/skybox procedural de fondo.
   - Razón de prioridad: `shot-01-01` (establishing de Proxima) se reutiliza tanto en `main-short` como en el `trailer` — es probablemente la primera toma que se querrá ver renderizada, y depende de tener Júpiter y los hábitats girando en cuadro.

3. **Detalle exterior de la Ardor, a la par de Proxima**
   - Paneles de casco, líneas de mantenimiento, marcas de identificación, desgaste técnico visible (§8 de `CELESTIAL_ARDOR.md`, y §12 "detalle añadido" para lo ya hecho en Proxima como referencia de nivel).
   - Razón de prioridad: no desbloquea nada nuevo por sí solo, es pulido sobre una nave ya presentable — va después del rig/Júpiter.

4. **Bloqueo de interiores vigentes: puente y conjunto de servicio del reactor**
   - Mantener el puente (`location:celestial-ardor-bridge`) y diseñar por separado el compartimiento exterior de servicio del reactor (`location:celestial-ardor-reactor-service-bay`) y la bóveda interior de blindaje (`location:celestial-ardor-inner-shielding-vault`).
   - Los recuentos históricos de 114 apariciones del puente y 47 de la sala del núcleo diplomático proceden de los cuatro guiones deprecados; no son métricas de prioridad del master. `location:diplomatic-core-room` es obsoleta y su hoja o geometría no debe sustituir ninguno de los dos espacios vigentes.
   - Razón de prioridad/orden: el nuevo derivado Festival concentra investigación, transmisión, asesinato, descubrimiento y resolución física en este conjunto. Sigue siendo trabajo de geometría interior real y debe esperar el cierre editorial y visual correspondiente antes de producción.

5. **Boca Velari, Estación Velari, nave emisaria**
   - Assets de la parte final de la historia; la boca Velari es barata una vez que se aborde (campo de nodos dispersos + animación de pulso, no un modelo hero).
   - Razón de prioridad: última fase de la historia, menor urgencia.

## Estado de cada paso

- [x] Paso 1 — rig de animación: `Proxima_Habitat_A_Pivot` / `Proxima_Habitat_B_Pivot` (empties en el centro de cada cubo, con todo lo demás de cada hábitat parentado) y `Ardor_Root` (empty raíz para toda la colección de la Ardor, ubicado en el puerto de atraque de proa). **Bug encontrado y corregido**: el primer intento de emparentar "preservando la transformada mundial" (copiar `matrix_world`, asignar `.parent`, reasignar `matrix_world`) no funcionó como se esperaba — Blender no recalculó `matrix_parent_inverse`, así que la posición local original se sumó a la del nuevo padre, duplicando el desplazamiento desde el origen (la espina/eje de la Ardor y ambos hábitats de Proxima aparecían desplazados, Sebastián lo notó como "el eje descentrado"). Corregido dejando `.location` intacto y en cambio fijando `object.matrix_parent_inverse = padre.matrix_world.inverted()` en cada hijo — el patrón correcto para "parentar conservando la posición" cuando se hace por script en vez de con el operador de Blender (`Ctrl+P` → *Keep Transform*). Verificado numéricamente (posiciones mundiales vueltas a sus valores originales) y con una rotación de prueba (el hub se queda quieto en su lugar mientras el aro gira alrededor).
- [x] Paso 2 — Júpiter + starfield: nueva colección `Environment`. `Env_Jupiter` (esfera con shader de bandas procedural) colocado a 20.000 m de Proxima a lo largo del eje de muelle, dimensionado para el tamaño angular aproximado de §4 de `EXTERNAL_SCENES_AND_ANIMATION.md` (~9' de arco) — a esa distancia y con lente de 24 mm se ve como un punto de 2–3 px; para que se lea como disco en cuadro, cualquier toma real probablemente necesite agrandarlo artísticamente (práctica común de VFX), anotado como decisión pendiente de dirección, no un error de escala. `Env_Sun` (luz tipo Sol) y un shader de mundo con estrellas dispersas (Noise Texture + Color Ramp) para el fondo. Sin estos, el viewport en modo Solid no mostraba nada de esto — verificar siempre en shading MATERIAL/RENDERED con `use_scene_world`/`use_scene_lights` activados.
- [x] Paso 3 — detalle exterior de la Ardor: costuras de panel (12 anillos + 4 líneas longitudinales), 22 paneles de mantenimiento, marca de identificación de casco ("CA-07"), estrobos de navegación babor/estribor, detalle industrial extra hacia popa (radiadores/tuberías), 10 manchas de desgaste. Ver el checklist actualizado en `CELESTIAL_ARDOR.md` §12.
- [~] Paso 4 — interiores: el puente, la ingeniería general, el vestíbulo y los troncos axiales tienen bloqueo histórico reutilizable. La sala del núcleo diplomático también está modelada, pero es obsoleta y sólo conserva procedencia. El compartimiento exterior de servicio del reactor y la bóveda interior de blindaje requeridos por el master rev. 19 aún no tienen diseño visual ni bloqueo aprobados. Ver `CELESTIAL_ARDOR.md` §12.
- [~] Paso 5 — assets Velari: **diferido a propósito** (29/08/2026, decisión de Sebastián). La boca Velari, la estación Velari y la nave emisaria son orgánicas — se van a dejar en manos de los modelos de generación de video por IA en el pase posterior, en vez de modelarse en Blender. No forman parte del bloqueo 3D salvo que esa decisión cambie más adelante.
