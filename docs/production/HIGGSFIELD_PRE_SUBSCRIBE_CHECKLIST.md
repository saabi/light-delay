# Checklist pre-suscripción Higgsfield (Ultra × 1 mes)

Documento generado desde los guiones vigentes. Regenerar tras cambios materiales en `light-delay-trailer.json` o `light-delay-festival.json`:

```bash
node scripts/generate-higgsfield-pre-subscribe-checklist.mjs
```

**Estrategia:** congelar outline, guion, animatic y prompts **antes** de pagar Ultra (~3 000 cr/mes). Día de suscripción = día de generación. Referencia MCP: [`docs/technical/HIGGSFIELD_MCP.md`](../technical/HIGGSFIELD_MCP.md).

**Generado:** 2026-09-01T21:53:30.171Z

---

## Resumen de conteos

| Concepto | Cantidad |
| --- | ---: |
| Tomas tráiler (total) | 33 |
| Tomas tráiler — **video HF** | **28** |
| Tomas tráiler — **PNG estático** (no gastar crédito) | 5 |
| Tomas festival (total) | 71 |
| Festival — reutilizar clip del tráiler (mismo `main:shot-*`) | 21 |
| Festival — **generar nuevo** tras tráiler | **46** |
| Festival — PNG estático (título/créditos) | 4 |

### Presupuesto de créditos (orientativo @ 480p, 4 s mínimo)

| Fase | Tomas | Créditos ~ |
| --- | ---: | ---: |
| Pasada tráiler | 28 | 336 |
| Festival incremental | 46 | 552 |
| **Total 1× sin reintentos** | 74 | **888** |
| Ultra mensual | — | ~3000 |

Margen para reintentos @ 480p: ~2112 cr (si no hay deriva de duración/resolución).

---

## Puertas pre-suscripción (cerrar antes de pagar)

| ID | Recurso | Estado |
| --- | --- | --- |
| gate-outline-festival | `data/outlines/light-delay-festival.json` | review |
| gate-script-festival | `data/scripts/light-delay-festival.json` | review — Diálogo Zao/Elin pendiente (informe gap A/B/E/F) |
| gate-script-trailer | `data/scripts/light-delay-trailer.json` | draft_ok |
| gate-animatic-refs | `static/assets/animatic/` | partial |
| gate-hf-uploads | `higgsfield-uploads/` | staging |
| gate-production-plans | `data/production/plans/` | blocked — compiledPrompt null en todas las tomas |
| gate-festival-project | `higgsfield.ai Cinema Studio` | external — Proyecto público sin generaciones aún |

### Checklist editorial (manual)

- [ ] Outline festival causalmente cerrado (`data/outlines/light-delay-festival.json`)
- [ ] Pasada de diálogo Zao/Elin (sec. A, B, E, F) aplicada al guion festival
- [ ] Tráiler: omisiones deliberadas verificadas (sin culpable, sin envío/muerte confirmados)
- [ ] Animatic: duraciones y `imageAssetId` validados (`npm run validate`)
- [ ] Referencias en `higgsfield-uploads/` completas por personaje/escena
- [ ] `compiledPrompt` aprobado por toma en planes de producción
- [ ] Proyecto festival Cinema Studio: brief, póster, slot WIP listo
- [ ] Runbook: gens **dentro** del proyecto festival (auditoría + grants)

---

## Tráiler — matriz por toma (33)

| Toma | Escena | Main | ms | Modo | Festival paralelo |
| --- | --- | --- | ---: | --- | --- |
| `trailer:shot-a-01` | a | main:shot-01-01 | 3500 | **reuse_candidate** | `festival:shot-a-01` |
| `trailer:shot-a-02` | a | main:shot-01-08 | 4500 | **trailer_only** | — |
| `trailer:shot-b-01` | b | main:shot-02-04 | 3000 | **reuse_candidate** | `festival:shot-c-09` |
| `trailer:shot-b-02` | b | main:shot-04-01 | 3500 | **reuse_candidate** | `festival:shot-a-02` |
| `trailer:shot-b-03` | b | main:shot-14-05 | 3600 | **reuse_candidate** | `festival:shot-f-06` |
| `trailer:shot-c-01` | c | main:shot-04-02 | 4000 | **reuse_candidate** | `festival:shot-a-03` |
| `trailer:shot-c-02` | c | main:shot-04-03 | 4500 | **trailer_only** | — |
| `trailer:shot-c-03` | c | main:shot-05-01 | 4500 | **reuse_candidate** | `festival:shot-b-01` |
| `trailer:shot-d-01` | d | main:shot-05-04 | 3600 | **trailer_only** | — |
| `trailer:shot-d-02` | d | main:shot-05-06 | 3500 | **trailer_only** | — |
| `trailer:shot-d-03` | d | main:shot-06-01 | 3500 | **reuse_candidate** | `festival:shot-b-04` |
| `trailer:shot-d-04` | d | main:shot-06-03 | 3000 | **reuse_candidate** | `festival:shot-b-05`, `festival:shot-b-04c` |
| `trailer:shot-e-01` | e | main:shot-06-09 | 4500 | **trailer_only** | — |
| `trailer:shot-e-02` | e | main:shot-07-02 | 2500 | **reuse_candidate** | `festival:shot-c-02` |
| `trailer:shot-f-01` | f | main:shot-07-08 | 3000 | **trailer_only** | — |
| `trailer:shot-f-02` | f | main:shot-07-10 | 3000 | **trailer_only** | — |
| `trailer:shot-f-03` | f | main:shot-08-02 | 2000 | **trailer_only** | — |
| `trailer:shot-f-04` | f | main:shot-10-01 | 3200 | **reuse_candidate** | `festival:shot-d-01`, `festival:shot-d-00` |
| `trailer:shot-g-01` | g | main:shot-10-02 | 2800 | **reuse_candidate** | `festival:shot-d-04` |
| `trailer:shot-g-02` | g | main:shot-10-03 | 3000 | **reuse_candidate** | `festival:shot-d-02` |
| `trailer:shot-g-03` | g | main:shot-10-04 | 2800 | **reuse_candidate** | `festival:shot-d-03` |
| `trailer:shot-g-04` | g | main:shot-10-05 | 3000 | **reuse_candidate** | `festival:shot-d-04b` |
| `trailer:shot-h-01` | h | main:shot-14-02 | 2000 | **reuse_candidate** | `festival:shot-f-01`, `festival:shot-g-01` |
| `trailer:shot-h-02` | h | main:shot-14-04 | 2500 | **reuse_candidate** | `festival:shot-f-05` |
| `trailer:shot-h-03` | h | main:shot-14-06 | 1500 | **trailer_only** | — |
| `trailer:shot-h-04` | h | main:shot-14-05 | 1500 | **reuse_candidate** | `festival:shot-f-06` |
| `trailer:shot-h-05` | h | main:shot-16-01 | 2500 | **reuse_candidate** | `festival:shot-g-05` |
| `trailer:shot-i-01` | i | main:shot-16-03 | 4000 | **reuse_candidate** | `festival:shot-g-07` |
| `trailer:shot-i-02` | i | — | 4000 | **png_skip** | — |
| `trailer:shot-i-03` | i | — | 2500 | **png_skip** | — |
| `trailer:shot-i-04` | i | — | 2500 | **png_skip** | — |
| `trailer:shot-i-05` | i | — | 2500 | **png_skip** | — |
| `trailer:shot-i-06` | i | — | 2500 | **png_skip** | — |

**Modos:** `png_skip` = montar desde PNG en repo; `reuse_candidate` = gen HF en tráiler reutilizable en festival; `trailer_only` = solo tráiler (p. ej. montaje comprimido).

### Tráiler — PNG skip (no video HF)

- `trailer:shot-i-02` — title_credits_segment_i (`asset:animatic-title-trailer-brand`)
- `trailer:shot-i-03` — title_credits_segment_i (`asset:animatic-title-trailer-tagline`)
- `trailer:shot-i-04` — title_credits_segment_i (`asset:animatic-placeholder-missing-frame`)
- `trailer:shot-i-05` — title_credits_segment_i (`asset:animatic-placeholder-missing-frame`)
- `trailer:shot-i-06` — title_credits_segment_i (`asset:animatic-placeholder-missing-frame`)

---

## Festival — reutilizar desde tráiler (21)

| Toma festival | Main | Origen tráiler |
| --- | --- | --- |
| `festival:shot-a-01` | main:shot-01-01 | `trailer:shot-a-01` |
| `festival:shot-a-02` | main:shot-04-01 | `trailer:shot-b-02` |
| `festival:shot-a-03` | main:shot-04-02 | `trailer:shot-c-01` |
| `festival:shot-b-01` | main:shot-05-01 | `trailer:shot-c-03` |
| `festival:shot-b-04` | main:shot-06-01 | `trailer:shot-d-03` |
| `festival:shot-b-05` | main:shot-06-03 | `trailer:shot-d-04` |
| `festival:shot-c-02` | main:shot-07-02 | `trailer:shot-e-02` |
| `festival:shot-c-09` | main:shot-02-04 | `trailer:shot-b-01` |
| `festival:shot-d-01` | main:shot-10-01 | `trailer:shot-f-04` |
| `festival:shot-d-02` | main:shot-10-03 | `trailer:shot-g-02` |
| `festival:shot-d-03` | main:shot-10-04 | `trailer:shot-g-03` |
| `festival:shot-d-04` | main:shot-10-02 | `trailer:shot-g-01` |
| `festival:shot-b-04c` | main:shot-06-03 | `trailer:shot-d-04` |
| `festival:shot-d-00` | main:shot-10-01 | `trailer:shot-f-04` |
| `festival:shot-d-04b` | main:shot-10-05 | `trailer:shot-g-04` |
| `festival:shot-f-01` | main:shot-14-02 | `trailer:shot-h-01` |
| `festival:shot-f-05` | main:shot-14-04 | `trailer:shot-h-02` |
| `festival:shot-f-06` | main:shot-14-05 | `trailer:shot-b-03` |
| `festival:shot-g-01` | main:shot-14-02 | `trailer:shot-h-01` |
| `festival:shot-g-05` | main:shot-16-01 | `trailer:shot-h-05` |
| `festival:shot-g-07` | main:shot-16-03 | `trailer:shot-i-01` |

---

## Festival — generar nuevo tras tráiler (46)

Prioridad sugerida: **E → F → G** (auditoría, cuarentena, contacto), luego huecos en **D**, luego refinados en **A–C**.

| Toma | Escena | Main | ms |
| --- | --- | --- | ---: |
| `festival:shot-a-04` | a | main:shot-03-04 | 6500 |
| `festival:shot-b-02` | b | main:shot-05-03 | 7000 |
| `festival:shot-b-03` | b | main:shot-05-07 | 6000 |
| `festival:shot-b-06` | b | main:shot-06-06 | 11500 |
| `festival:shot-b-07` | b | main:shot-06-07 | 7500 |
| `festival:shot-c-01` | c | main:shot-07-01 | 3000 |
| `festival:shot-c-03` | c | main:shot-07-03 | 2500 |
| `festival:shot-c-04` | c | main:shot-06-05 | 2500 |
| `festival:shot-c-05` | c | main:shot-07-05 | 2500 |
| `festival:shot-c-06` | c | main:shot-07-04 | 2000 |
| `festival:shot-c-07` | c | main:shot-08-03 | 5000 |
| `festival:shot-c-08` | c | main:shot-08-04 | 4000 |
| `festival:shot-c-10` | c | main:shot-07-01 | 7600 |
| `festival:shot-d-05` | d | main:shot-09-02 | 3500 |
| `festival:shot-d-06` | d | main:shot-10-07 | 5500 |
| `festival:shot-d-07` | d | main:shot-11-01 | 7900 |
| `festival:shot-d-08` | d | main:shot-11-05 | 5000 |
| `festival:shot-d-09` | d | main:shot-11-02 | 3600 |
| `festival:shot-b-04a` | b | main:shot-06-02 | 12500 |
| `festival:shot-b-04b` | b | main:shot-06-02 | 5000 |
| `festival:shot-b-08` | b | main:shot-05-08 | 9000 |
| `festival:shot-b-09` | b | main:shot-06-04 | 6500 |
| `festival:shot-b-10` | b | main:shot-06-05 | 6500 |
| `festival:shot-e-01` | e | main:shot-11-05 | 4000 |
| `festival:shot-e-02` | e | main:shot-12-01 | 4000 |
| `festival:shot-e-03` | e | main:shot-06-06 | 11000 |
| `festival:shot-e-04` | e | main:shot-12-02 | 2500 |
| `festival:shot-e-05` | e | main:shot-12-03 | 4000 |
| `festival:shot-e-06` | e | main:shot-12-04 | 4000 |
| `festival:shot-e-07` | e | main:shot-12-05 | 7000 |
| `festival:shot-e-08` | e | main:shot-12-06 | 3000 |
| `festival:shot-e-09` | e | main:shot-12-08 | 5500 |
| `festival:shot-e-10` | e | main:shot-12-07 | 4500 |
| `festival:shot-f-02` | f | main:shot-13-02 | 6000 |
| `festival:shot-f-03` | f | main:shot-13-04 | 6000 |
| `festival:shot-f-04` | f | main:shot-14-08 | 6000 |
| `festival:shot-f-07` | f | main:shot-14-10 | 7000 |
| `festival:shot-f-08` | f | main:shot-15-02 | 5000 |
| `festival:shot-g-02` | g | main:shot-15-04 | 3000 |
| `festival:shot-g-03` | g | main:shot-15-05 | 4000 |
| `festival:shot-g-04` | g | main:shot-15-06 | 4500 |
| `festival:shot-g-06` | g | main:shot-16-02 | 4000 |
| `festival:shot-g-08` | g | main:shot-17-02 | 7000 |
| `festival:shot-g-09` | g | main:shot-17-05 | 6000 |
| `festival:shot-g-10` | g | main:shot-17-02 | 4000 |
| `festival:shot-g-11` | g | main:shot-17-06 | 5000 |

### Festival — PNG skip

- `festival:shot-title-01` — film_title_card
- `festival:shot-h-01` — credits_cards
- `festival:shot-h-02` — credits_cards
- `festival:shot-h-03` — credits_cards

---

## Orden de ejecución post-suscripción

1. **Día 0:** Conectar MCP; prueba de saldo; primera gen de humo en proyecto festival.
2. **Fase A — Tráiler:** 28 gens @ 480p; montar ~1:42; publicar WIP.
3. **Fase B — Festival:** 46 gens nuevos; reutilizar 21 clips del tráiler; audio IA en proyecto.
4. **Fase C — Cierre:** extender a ≥3:00; watermark; submit final + post social antes del **14 sep 2026**.

---

## JSON machine-readable

Snapshot: `data/production/checklists/higgsfield-pre-subscribe.json`
