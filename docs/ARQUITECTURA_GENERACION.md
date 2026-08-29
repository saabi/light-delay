# Arquitectura de generación audiovisual

Estado: arquitectura ejecutable inicial, sin autorización de generación. El español es la fuente editorial; los prompts destinados a modelos se compilan en inglés sólo después del cierre del cut.

## Principios

1. El compilador consume JSON estructurado, no analiza Markdown durante una corrida de producción.
2. Cada cut congela por separado guion, escaleta, ledger causal y plan mediante un digest. Un cambio de fuente invalida el freeze.
3. Un plano completo (`shotId`) puede dividirse en segmentos semánticos de video, pero conserva un único still representativo para el animatic.
4. First frame, last frame, still representativo, video y audio final son artefactos distintos. Ninguno se infiere de otro.
5. El audio final es controlado y versionado por el proyecto. La pista nativa de una generación no reemplaza diálogo, mezcla o doblaje aprobados.
6. Los límites del modelo y los límites de una campaña/cuenta son datos separados y fechados.

## Fuentes y productos

```text
ScriptFile + OutlineFile + ledger causal + contextos + entidades/assets
                              |
                              v
                    plan provider-neutral
                    /        |         \
             readiness   segmentos   referencias
                    \        |         /
                              v
                brief ES aprobado por toma
                              |
                         freeze del cut
                              |
                              v
                   prompt EN compilado
                              |
                    adapter + preflight
                              |
                              v
                  pedido auditable al proveedor
```

Los contextos físicos y visuales están normalizados en `data/production/contexts.json` y citan sus fuentes. Esto evita que el compilador tenga que interpretar `CELESTIAL_ARDOR.md` o `SIGNAL_BEAM_REQUIREMENTS.md` en cada pedido.

## Plan por toma

`data/production/plans/<script>.json` registra:

- digest y versión exactos del guion;
- campaña y estado del freeze;
- bloqueos editoriales;
- still representativo obligatorio y first/last frame opcionales;
- audio final cuando la toma lleva diálogo;
- referencias requeridas por clase (`image`, `video`, `audio`);
- segmentos con inicio/fin y estrategia de continuación.

La segmentación usa placements de cues como límites semánticos cuando resulta posible y nunca excede `campaign.maxSegmentMs`. Para un segundo pedido se prefiere adjuntar el video aceptado anterior junto con su last frame; si el proveedor o el presupuesto de adjuntos no lo admite, el fallback es usar ese last frame como first frame del segmento siguiente.

## Compilación del prompt

El compilador exige secciones completas y rechaza cualquier toma con bloqueos:

1. estilo;
2. acción y timing;
3. sujetos, blocking y performance;
4. localización;
5. cámara;
6. iluminación;
7. física;
8. interfaces y VFX;
9. continuidad;
10. audio;
11. restricciones negativas.

El brief humano se autoriza en español. La versión inglesa compilada es un producto reproducible, no una segunda fuente narrativa. Los planes reales conservan `compiledPrompt: null` hasta que el cut esté cerrado; las pruebas unitarias ejercitan el compilador con fixtures sintéticos.

## Referencias y voces

El presupuesto se valida por tipo y en total. Las imágenes de personajes, lugares, vehículos y objetos salen de `referenceAssetIds`; no se buscan por parecido visual. Las muestras de voz deben vivir como assets y ser referenciadas por `VoiceProfileVariant.sampleAssetIds`. La ausencia actual de muestras bloquea audio/doblaje, pero no autoriza a inventar voces.

La integración futura con Higgsfield debe resolver IDs remotos a partir de estos assets locales, adjuntar únicamente las referencias necesarias y registrar qué archivos fueron enviados. Si una toma excede los límites, debe dividir el pedido o reducir referencias mediante una decisión editorial visible; nunca descartar una referencia silenciosamente.

## Seedance e Higgsfield

El snapshot vigente separa:

- Seedance 2.0 documentado: hasta 9 imágenes (incluidos boundaries), 3 videos, 3 audios y 12 referencias totales;
- campaña de prueba informada: segmentos de hasta 8 s, ventana de 24 h y ejecución condicionada a preflight;
- Seedance 2.5: perfil provisional de marketing, no habilitado para ejecución hasta confirmar catálogo CLI/MCP y contrato real.

`scripts/higgsfield-preflight.mjs` es deliberadamente de sólo lectura. No envía medios. Cualquier adapter posterior debe exigir catálogo vivo, entitlement, costo/créditos y confirmación de que la corrida no consumirá recursos no autorizados.

## Compuertas

Una toma sólo puede pasar de `blocked` a `ready` si:

- su outline requerido está cubierto;
- el ledger causal no permite conocimiento o acciones prematuros;
- propósito, framing, sujetos y performance están definidos;
- el contexto físico está asignado;
- referencias y voces existen y entran en presupuesto;
- still/first/last frame están decididos;
- el brief ES fue aprobado y el digest del cut no cambió.

Órdenes principales: `npm run production:plans`, `npm run report:prompt-readiness`, `npm run report:causal-validity`, `npm run validate:schemas` y `npm run generated:check`.
