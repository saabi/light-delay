# Guía de escaleta para agentes

Procedimiento obligatorio antes de crear o ampliar guion, diálogo, tomas o animatic de un `scriptId`. Contrato: `docs/ESCALETA.md`. Cuidados: `docs/CUIDADOS_NARRATIVOS.md`. Continuidad: `docs/CONTINUIDAD_CAUSAL_GUIONES.md`.

## 1. Leer la historia antes de implementarla

1. Abrir `data/outlines/<slug>.json` y leer `synopsis` más todos los pasos `story` sin consultar primero el guion.
2. Comprobar que una persona puede contar premisa, conflicto, decisiones decisivas y resolución con esa capa.
3. Para cada consecuencia directa, verificar que el resumen o `causalLinks.explanation` deja claro qué hecho previo la habilita, motiva, revela, fuerza, impide o resuelve.
4. Sólo entonces desplegar los pasos `detail` y contrastarlos con canon y continuidad.

Una causa crucial no puede quedar implícita sólo porque el autor o el agente ya la conoce. Si una decisión descarta alternativas —por ejemplo, Tierra por el doble tiempo de tránsito y Proxima por oclusión geométrica— la escaleta debe registrar esas razones y por qué la opción elegida sí funciona. Lo mismo vale para motivaciones, falsas suposiciones y gestos que revelan carácter.

Si la capa principal sólo repite encabezados o resúmenes de escena, todavía no es una escaleta útil.

## 2. Autoría y grano

- Escribir primero los hitos `story`; no generarlos desde `scene.summary`.
- Cada hito debe describir un cambio narrativo, no una localización ni una toma.
- Añadir detalle sólo cuando ayude a escribir o verificar la implementación.
- Mantener los IDs existentes; nuevos IDs van namespaced por cut.
- No enlazar por mera adyacencia. Una omisión deliberada de explicación es válida cuando el vínculo ya es inequívoco en el propio resumen.
- Evitar exposición forzada: la escaleta puede declarar la lógica autoral, pero el guion debe revelarla mediante pensamiento en acción, elección y consecuencia visible.
- Preservar la versión más reciente de cada beat. Antes de «simplificar» o eliminar una motivación, contrastar guion, escaleta, canon, historial y documentos de continuidad. Si las fuentes no permiten decidir, preguntar al autor.
- No usar `notes` ni `TODO` para postergar una causa faltante salvo autorización explícita del autor. Sin esa autorización, una causa indispensable bloquea el trabajo narrativo que dependa de ella.

Fuentes, en orden: canon y continuidad vigente; perfil de eventos del cut; documentos específicos aprobados. No inventar huecos.

## 3. Cobertura posterior

La cobertura no define la historia: verifica dónde fue implementada.

1. `treatment`: escena, beat o fuente que desarrolla el detalle.
2. `script`: escenas, beats y cues que lo dramatizan.
3. `animatic`: tomas que lo hacen visible o audible.

Omitir un destino todavía no evaluado es válido. No marcar `covered` sin evidencia. Usar `partial` si una consecuencia existe pero falta su causa, claridad o remate; `deferred` sólo con una decisión editorial consciente; `not_applicable` cuando el cut no necesita ese destino.

## 4. Auditoría causal

Para cada acción, preguntar:

- ¿Qué sabe el personaje en ese momento y cómo lo aprendió?
- ¿Qué alternativa acaba de perder o descartar?
- ¿Qué hecho observable provoca la decisión?
- ¿La consecuencia usa información que aún no llegó?
- ¿Un paso posterior cobra una preparación anterior?
- ¿La escaleta explica por qué se descartaron las alternativas obvias y por qué la opción compleja restante sí puede funcionar?
- ¿Se conservaron las suposiciones erróneas y los gestos que explican tanto la acción como la profundidad del personaje?

La escaleta principal responde la cadena; el ledger causal verifica conocimiento y precondiciones finas; el guion y el animatic aportan evidencia.

## 5. Cierre

Ejecutar `validate:data`, `validate:translations`, `report:outline-readability` y `report:outline-gaps` para el destino trabajado. Revisar `/outline/[scriptId]` con detalles cerrados y abiertos. Actualizar primero el español y luego el inglés inline. No regenerar imágenes salvo instrucción explícita. Registrar cambios materiales en `CHANGELOG.md` y `docs/PROJECT_STATUS.md`.
