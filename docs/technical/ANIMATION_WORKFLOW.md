# Flujo de trabajo de animación en Blender

> Estado: documento de planificación de flujo de trabajo, sin tomas producidas todavía — el guion aún no está cerrado. No implica animación ni render inmediatos. Complementa a `EXTERNAL_SCENES_AND_ANIMATION.md` (qué falta modelar/animar) y a `PRODUCTION_ROADMAP.md` (orden de trabajo); este documento responde una pregunta distinta: **cómo organizar los archivos y el proceso** una vez que empecemos a producir tomas animadas. Idioma fuente: español.

## 0. Por qué hace falta decidir esto ahora, aunque el guion no esté listo

`data/scripts/*.json` ya define la unidad de trabajo real: cada guion tiene `scenes` → `shots` → `takes`, con un `selectedTakeId` por toma. Esa estructura no va a cambiar aunque el contenido de los guiones sí — así que el flujo de archivos se puede diseñar ya, y aplicarlo shot por shot a medida que cada uno se cierre narrativamente, sin tener que re-decidir la organización cada vez.

Objetivo declarado de esta fase (Sebastián, 29/08/2026): las renderizaciones de Blender son **base/referencia para un render de video por IA posterior**, no el entregable final por sí mismas. Eso cambia qué hay que hacer con precisión (la cámara, siempre) y qué se puede resolver con un placeholder barato (los cuerpos de la tripulación en tomas de interior).

## 1. Principio general: geometría maestra única, animación separada por toma

**Un solo archivo maestro de geometría** (`blender/light-delay-blockout.blend`, el que ya existe) sigue siendo la única fuente de verdad para todo lo que es estructura: casco de la Ardor, Proxima, interiores bloqueados, entorno. No se debe duplicar geometría copiándola a otros archivos — eso multiplica el trabajo cada vez que se corrige algo (como ya pasó dos veces esta semana con el pasamanos de atraque y la orientación de gravedad).

**Cada toma que se anima vive en su propio archivo**, que **vincula (`Link`, no `Append`) las colecciones que necesita** del archivo maestro y añade encima, localmente a ese archivo:
- la cámara y su animación,
- las proxies/placeholders de tripulación y su animación,
- cualquier objeto exclusivo de esa toma (p. ej. un estado de material alternativo para una toma puntual, como la esfera roja corrupta del núcleo diplomático).

Por qué vincular en vez de copiar:
- Una corrección en el archivo maestro (una consola movida, un pasillo corregido) se propaga a todas las tomas que vinculan esa colección, sin tener que retocar cada archivo de toma a mano.
- El archivo maestro no acumula decenas de cámaras y variantes de blocking que no le corresponden — sigue siendo el "set", no el "storyboard".
- Cada archivo de toma es liviano (solo su cámara + placeholders + un enlace), lo que hace viable tener uno por toma sin que el repositorio explote en tamaño.

Contraparte a tener en cuenta: un archivo con datos vinculados no puede editarse "a través del link" — si una toma necesita mover un objeto del set (una silla corrida de sitio, una puerta abierta para esa toma en particular), eso requiere o bien un *override* de biblioteca de Blender sobre el objeto vinculado, o bien decidir que ese cambio en realidad pertenece al archivo maestro (p. ej. si una puerta siempre debe verse abierta en esa ubicación). Cuando surja el primer caso real, documentarlo aquí como precedente en vez de improvisar una solución por toma.

## 2. Estructura de archivos y convención de nombres

```
blender/
  light-delay-blockout.blend        # maestro — geometría, ya existe
  shots/
    _shot_template.blend            # plantilla vacía: vincula el maestro, cámara con lente/organización estándar, sin animar
    bridge-05-01-harlan-jammer.blend
    diplomatic-core-06-02-zao-death.blend
    ...
  shots/shots_index.json            # manifiesto — ver §5
```

- **Un archivo por toma (`take`), no por escena.** Una escena (`scene`) puede tener varias tomas con cámaras y tiempos completamente distintos (p. ej. la escena del payload/relé físico ya tiene al menos 3 tomas: puente frontal de Voss, detalle de la mano de Harlan, plano de Zao sin respuesta) — meterlas en el mismo archivo/línea de tiempo obliga a compartir un rango de frames arbitrario entre cámaras que en realidad son independientes. Un archivo por toma evita eso y además es la unidad que después se manda a render.
- **Nombre de archivo = ubicación canónica + identificador de beat/shot + slug corto legible**, no el id crudo del JSON (que cambia de prefijo por guion: `main:shot-05-03` en un guion, `festival:cue-00-01` en otro, para la misma toma real). Formato: `<location-slug>-<beat>-<shot>-<slug-corto>.blend`, p. ej. `bridge-05-01-harlan-jammer.blend`.
- **Una toma que se reutiliza entre guiones (festival/long/main-short/trailer) es UN solo archivo**, no uno por guion. El manifiesto (§5) es el que mapea qué id de qué guion apunta a qué archivo — evita animar la misma toma cuatro veces porque cada guion la referencia con su propio id.
- `_shot_template.blend`: archivo de partida para cualquier toma nueva — ya trae el link al maestro, una cámara con el `sensor`/lente por defecto y los ajustes de render acordados (§4), para no tener que reconfigurar eso cada vez ni arriesgar que diverjan entre tomas.

## 3. Qué debe ser preciso siempre: la cámara

Independientemente de si la toma es interior o exterior, o de si lleva placeholders o personajes detallados, **la cámara se anima con la misma exigencia de precisión en todos los casos** — es la referencia de movimiento/composición que el render de IA va a seguir después, así que un error de cámara se propaga directamente al resultado final.

Para cada toma, tomar del campo `camera` de la toma en el JSON del guion (`movement`, `movementDescription`) y de `composition` (`size`, `framing`, `aspectRatio`) los datos ya decididos:
- **Lente real**: cuando el guion especifica una focal (p. ej. "24 mm"), usar esa focal en los datos de la cámara de Blender, no una aproximada a ojo.
- **Tipo de movimiento** (`locked`, `dolly`, `tracking`, `handheld`, …) determina qué animar: `locked` = sin keyframes de posición/rotación de la cámara (trípode fijo); `dolly`/`tracking` = curva de traslación explícita, preferentemente con una trayectoria (`Follow Path` o keyframes con interpolación *ease*, no lineal) en vez de una línea recta a mano; `handheld` = una capa de ruido/temblor sutil superpuesta sobre el movimiento base (Blender: modificador de ruido en los canales de rotación de la cámara), no una animación completamente estática etiquetada como handheld.
- **Encuadre y composición** (`size`/`framing` — plano general, medio, detalle, etc.) se verifica renderizando al menos un frame de control antes de dar la toma por lista, igual que se hizo para verificar el blocking del puente (vista aislada + captura), no asumiendo que la posición numérica calculada da el encuadre correcto.
- Guardar el frame range / duración de la toma (`durationMs` del JSON, convertido a frames según el frame rate acordado en §4) en la propia escena de Blender del archivo de la toma, no solo en el JSON — así el archivo es autocontenido si se abre sin el guion a mano.

## 4. Qué puede ser un placeholder: la tripulación en tomas de interior

Dado que el destino es servir de base para un render de video por IA, **los personajes en tomas de interior no necesitan geometría ni rigging de calidad final** — el video-IA va a reinterpretar la superficie. Lo que sí tiene que ser correcto es lo que define blocking y tiempos, porque eso es lo que la IA va a seguir/mantener:

Usar como placeholder:
- Una proxy humanoide de baja resolución por personaje — cápsulas/cilindros simples (torso, cabeza, extremidades) o, mejor, un mismo rig genérico de baja poligonización reutilizado para todos los personajes (constrúyelo una vez, sé permite duplicar/reasignar por escena) en vez de modelar cada actor.
- Sin materiales/texturas detallados — un color plano por personaje alcanza para distinguirlos en el encuadre y facilita revisar el blocking de un vistazo (p. ej. Voss en un tono, Harlan en otro).

Lo que sigue siendo obligatorio, aunque el cuerpo sea un placeholder:
- **Posición y orientación correctas** en cada momento clave de la toma — dónde está parado/asegurado cada personaje, hacia dónde mira, en qué instante entra o sale de cuadro. Esto es lo que ya reconstruimos para la escena de Harlan en el puente (Voss en el pedestal, tripulación en el anillo de consolas, Harlan en la boca del vestíbulo) — esa clase de nota de blocking en `CELESTIAL_ARDOR.md` es exactamente el insumo que define las posiciones clave de la proxy, y debe existir para cualquier toma con personajes antes de animar la proxy.
- **Sincronía con el diálogo/las cues del guion** — si una acción del guion (`cues[].type: "action"`) dice que un personaje activa algo o se mueve en un momento preciso, la proxy debe llegar a esa posición en el frame correspondiente, no en un tiempo aproximado. El guion ya trae el texto/orden de las cues; falta solo mapear cada cue relevante a un frame una vez que el guion esté cerrado.
- **Gravedad/microgravedad correctas** para la ubicación y el momento de la historia (p. ej. la escena de Harlan es explícitamente en microgravedad — la proxy debe leerse "asegurada"/flotando, no de pie con los pies en el suelo). Esto ya está resuelto como convención general en el archivo maestro (eje Y = arriba/abajo bajo empuje); en microgravedad simplemente no aplica esa convención de apoyo en el piso y hay que posar/animar la proxy en consecuencia.

En resumen: **cuerpo = barato y reemplazable después; posición, tiempo y cámara = definitivos**, porque son los que no se pueden re-derivar del video-IA hacia atrás si están mal.

## 5. Manifiesto de tomas (`shots_index.json`)

Un archivo índice, separado de los 4 guiones, que mapea:

```json
{
  "shots": [
    {
      "canonicalId": "bridge-jammer-cue",
      "file": "shots/bridge-05-01-harlan-jammer.blend",
      "status": "not_started",
      "scriptRefs": {
        "main-short": ["main:shot-05-03"],
        "trailer": ["trailer:shot-a-something"]
      },
      "locationId": "location:celestial-ardor-bridge",
      "notes": ""
    }
  ]
}
```

- `status`: `not_started` / `blocked_ready` (nota de blocking escrita en el doc técnico, sin animar) / `camera_animated` / `placeholder_crew_animated` / `preview_rendered` / `final_for_ai_pass`. Permite ver de un vistazo qué falta sin abrir cada `.blend`.
- `scriptRefs`: todos los ids, de los 4 guiones, que corresponden a esta misma toma real — así una toma no se anima cuatro veces solo porque cuatro guiones la referencian con ids distintos.
- Este archivo se actualiza a mano por ahora (pocas tomas); si la cantidad crece, generar/verificar por script contra los 4 JSON de guion, igual que ya se hace para el recuento de `locationId` en `CELESTIAL_ARDOR.md` §12.

## 6. Ajustes de render compartidos

Definidos una vez en `_shot_template.blend`, no por archivo:
- Frame rate y resolución de trabajo (a definir con dirección — ninguno fijado todavía; usar un valor bajo/rápido para previews mientras el guion no cierre, ya que el destino final es un pase de IA y no hace falta resolución de render final desde ahora).
- Motor de render para las previews de blocking/cámara: preferir Eevee/viewport (rápido) sobre Cycles mientras se está iterando cámara y blocking — Cycles solo si en algún punto hace falta un frame de referencia con iluminación/sombras más fieles para el pase de IA.

## 7. Qué hacer cuando el guion cambie

Como el guion no está cerrado, cualquier toma que se anime ahora puede necesitar ajuste después. Reglas:
- No animar una toma en `not_started`/`blocked_ready` sin que su beat/cue esté razonablemente estable — priorizar tomas de ubicaciones y momentos que ya se ven consistentes entre los 4 guiones (como el beat de Harlan/el jammer, presente en los 4).
- Si un beat cambia después de animado, el archivo de la toma no se re-crea desde cero — se edita el mismo archivo (mismo nombre, mismo link al maestro) y se actualiza su `status` en el manifiesto. El link al maestro no se ve afectado por cambios de guion, solo por cambios de geometría.
- Cualquier nota de blocking nueva (como la del puente) se escribe primero en el documento técnico correspondiente (`CELESTIAL_ARDOR.md`/`PROXIMA_STATION.md`), igual que se hizo para Harlan/Voss — el archivo de Blender de la toma es la ejecución de esa nota, no el lugar donde se decide el blocking por primera vez.

## 8. Ejemplo de referencia

La toma `main:shot-05-03` ("Frontal de Voss; tripulación en segundo término y umbral axial profundo con Harlan al fondo", `celestial-ardor-bridge`) ya tiene su nota de blocking escrita en `CELESTIAL_ARDOR.md` (bajo "Cubierta de mando"). Cuando se anime, sería:
- Archivo: `blender/shots/bridge-05-01-harlan-jammer.blend`, vinculando la colección `Celestial_Ardor` del maestro.
- Cámara: fija (`locked`), posicionada junto al pedestal de mando dentro del anillo de consolas, apuntando hacia el vestíbulo — sin keyframes de movimiento, solo el encuadre verificado por render de control.
- Placeholders: proxy de Voss asegurada en el pedestal, 5-6 proxies de tripulación/Sorell en las consolas, proxy de Harlan en la boca del vestíbulo — posiciones tomadas directamente de la nota de blocking, sin necesidad de geometría de personaje detallada.
- `status` inicial en el manifiesto: `blocked_ready` (ya tiene nota de blocking, todavía sin archivo de Blender creado).
