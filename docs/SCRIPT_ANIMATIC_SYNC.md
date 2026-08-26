# Sincronización guion ↔ animatic

El **guion estructurado** (`data/scripts/light-delay-main-short.json`) es la fuente de verdad narrativa vigente y alimenta también el animatic. `legacy-site/guion-30-minutos.html` documenta la procedencia y permanece como referencia de regresión; ya no debe editarse como autoridad paralela. Los desajustes se registran aquí sin duplicar diálogo ni subtítulos.

## Conteos vigentes (reescritura 2026-08-26)

| Métrica | Guion / cues | Animatic legacy | JSON |
| --- | ---: | ---: | ---: |
| Escenas | 17 | 17 | 17 escenas |
| Tomas / takes | — | 112 tomas | 112 shots / 112 takes |
| Diálogos / subtítulos | 97 cues | 97 subs | 97 placements únicos |
| Imágenes únicas disponibles | — | 100 PNG | 100 frames + 1 placeholder técnico |

Las escenas 5–8 pasaron de 21 a 33 tomas sin cambiar la duración total. Sus 33 takes conservan frames provisionales marcados en `Take.imageStatus`; hay doce reutilizaciones directas adicionales de assets. El tráiler conserva sus reusos intencionales sin marca de placeholder. No hay cue de diálogo sin placement.

## Resumen del matching automático inicial (histórico)

- Placements aceptados en la extracción de Fase 1 (similitud ≥ 0.55): **98**
- Subtítulos de animatic sin cue colocado: **0**
- Líneas de guion sin cobertura de toma: **0**
- Pares con match difuso (0.55–0.90): **0**

### Diálogo en animatic ausente o distinto en el guion

_Ninguno._

### Diálogo en el guion sin cobertura de toma / cue placement

_Ninguno._

### Matches difusos (revisión editorial)

_Ninguno._

### Títulos / orden / límites de escena

- ESC. 1: animatic «Estación Proxima — embarque» vs guion «EXT./INT. ESTACIÓN PROXIMA — MUELLE DE ATRAQUE — DÍA»
- ESC. 2: animatic «Salida de Proxima» vs guion «INT. CELESTIAL ARDOR — PUENTE DE MANDO — CONTINUO»
- ESC. 3: animatic «Arco de Júpiter e indicio» vs guion «INT. CELESTIAL ARDOR — SALA DE MÁQUINAS — TRÁNSITO, T+29H»
- ESC. 4: animatic «Envoltura no declarada» vs guion «INT. CELESTIAL ARDOR — NÚCLEO DIPLOMÁTICO — TRÁNSITO, T+40H»
- ESC. 5: animatic «Confirmación y silencio» vs guion «INT. CELESTIAL ARDOR — NÚCLEO DIPLOMÁTICO / PUENTE — T+57H43MIN»
- ESC. 6: animatic «Mensaje hacia el futuro» vs guion «INT. CELESTIAL ARDOR — NÚCLEO DIPLOMÁTICO / LÁSER EXTERIOR — CONTINUO»
- ESC. 7: animatic «Asesinato, coartada y cruce» vs guion «INT./EXT. CELESTIAL ARDOR — NÚCLEO / CILINDROS AXIALES / LA BOCA — CONTINUO»
- ESC. 8: animatic «El cuerpo» vs guion «INT. CELESTIAL ARDOR — PUENTE DE MANDO — CONTINUO»
- ESC. 9: animatic «Investigación y sospecha» vs guion «INT. CELESTIAL ARDOR — PUENTE / NÚCLEO / ENFERMERÍA — MÁS TARDE»
- ESC. 10: animatic «La mitad técnica del misterio» vs guion «INT. CELESTIAL ARDOR — PUESTO TÉCNICO DEL PUENTE — MÁS TARDE»
- ESC. 11: animatic «Harlan intenta cegar la nave» vs guion «INT. CELESTIAL ARDOR — PUENTE DE MANDO — CONTINUO»
- ESC. 12: animatic «La doble llave» vs guion «INT. CELESTIAL ARDOR — PUENTE DE MANDO — MINUTOS DESPUÉS»
- ESC. 13: animatic «Última ventana del override» vs guion «INT. CELESTIAL ARDOR — PASILLO / PUENTE — CONTINUO»
- ESC. 14: animatic «Cuarentena antes del contacto» vs guion «INT. CELESTIAL ARDOR — NÚCLEO / PUENTE — CONTINUO»
- ESC. 15: animatic «Saludo limpio» vs guion «INT. CELESTIAL ARDOR — PUENTE DE MANDO — CONTINUO»
- ESC. 16: animatic «Región de encuentro» vs guion «EXT. ESPACIO — REGIÓN DE ENCUENTRO — MINUTOS DESPUÉS»
- ESC. 17: animatic «La verdad llega» vs guion «INT. CELESTIAL ARDOR — PUENTE DE MANDO — CONTINUO»

### Duraciones / objetivos

- Animatic: suma de `target` por escena = 1800 s.
- Guion: objetivo declarado 30:00. Coherente a nivel meta.

### Limitaciones de la extracción

- Matching por similitud de texto (normalizado); no es alineación editorial humana.
- Un beat por escena (placeholder); beats más finos quedan para Fase 7.
- No se generaron traducciones; sólo variante `es` con `status: "source"`.

## Estado en la app SvelteKit (Fases 2–6)

- Guion y animatic se renderizan desde `data/scripts/*.json` (misma fuente por script/cut).
- Subtítulos del player: `getSubtitleSegments` sobre placements + diálogo localizado.
- Frames servidos desde `/assets/animatic/...` (`static/assets/`); sin dependencia de `legacy-site/` en la UI.
- Las imágenes provisionales conservan el frame y muestran su toma de origen; las referencias faltantes o fallidas usan el asset `asset:animatic-placeholder-missing-frame`.
- El panel controlado «Detalles de la toma» expone contexto narrativo, cámara, cues, takes, estado visual, revisión y procedencia; se abre por clic o con `D`.
- **Festival Cut:** scaffold sin shots (autoría pendiente).
- **Tráiler:** 29 shots / 90 s; reutiliza `imageAssetId` del main short; brief en `docs/Light Delay — Tráiler de la versión de 30 minutos.md`.
