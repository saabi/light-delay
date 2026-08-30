# Plan de producción

## Versiones previstas

### Cortometraje completo

- Duración objetivo: 30:00; montaje de datos vigente: 30:39,5.
- Base: guion canónico de 17 escenas y animatic de 124 tomas que reutiliza 100 frames; 112 reutilizaciones son candidatas a regeneración y 12 tomas nuevas usan placeholder.
- El objetivo de duración debe validarse con lectura y montaje reales.
- La producción visual está bloqueada por guion hasta cerrar continuidad causal, placements y cobertura. No se regeneran imágenes como parte de la sincronización narrativa.

### Festival Cut

- Primera asamblea completa: 6:03,2. Cinco minutos funciona como orden de magnitud, no como límite estricto; el corte puede extenderse si la claridad causal lo requiere.
- Núcleo narrativo previsto: sabotaje de Zao → mensaje tardío → revelación sobre Harlan → Elin evita la transmisión → contacto Velari.
- Existe un guion estructurado de siete escenas y un animatic A–G de 67 tomas/takes. Las 29 tomas E–G colocan el diálogo ya aprobado y completan revelación, cuarentena, contacto y cierre. Todos los stills son reutilizaciones provisionales marcadas para regeneración; no debe confundirse con un simple recorte automático.
- El master de generación usa displays diegéticos únicamente en inglés. Las traducciones editoriales permanecen en los JSON, pero nunca se combinan dentro del frame; una edición española futura será una variante derivada.

## Higgsfield

- La estrategia discutida parte de que las generaciones presentadas al festival deben realizarse con herramientas de Higgsfield.
- Las imágenes y animatics externos pueden servir para diseño, referencia, encuadre y planificación, pero debe verificarse su admisibilidad antes de presentar material final.
- Prioridad: minimizar generaciones desperdiciadas mediante prompts cerrados, referencias visuales y aprobación previa de cada toma.

## Producción local y alternativas

Equipo disponible: GeForce RTX 3090 de 24 GB.

Alternativas consideradas para producción fuera del concurso:

- LTX, incluida la rama 2.5 y aceleración con SageAttention.
- MiniMax H3 local, sujeto a disponibilidad real de pesos, VRAM y soporte.
- Servicios externos como Atlas Cloud cuando ofrezcan API, documentación y costos por segundo adecuados.

Estas opciones fueron investigación comparativa, no una selección final. Antes de incorporarlas al pipeline hay que volver a verificar versiones, licencias, requisitos y calidad.

## Estimación energética preliminar

- Consumo total estimado bajo carga: 0,50–0,60 kW.
- Tiempo exploratorio de GPU para el proyecto completo: 150–350 horas.
- Estimación conversada para Santiago del Estero: aproximadamente ARS 15.000–35.000 con tarifa subsidiada o ARS 25.000–60.000 sin subsidio, incluyendo aire acondicionado.
- El cargo fijo y la estructura tarifaria de EDESE pueden dominar o alterar el resultado.

Estas cifras son orientativas y deben recalcularse con factura vigente, consumo medido en pared y tiempos reales por toma.

## Pipeline recomendado

1. Bloquear canon y shot list.
2. Validar encuadres con el animatic existente.
3. Preparar prompt, referencias y restricciones por toma.
4. Generar pruebas económicas o locales cuando sean admisibles.
5. Generar la toma final en la plataforma requerida por el destino.
6. Registrar procedencia y parámetros.
7. Montar, revisar continuidad y decidir regeneraciones.
