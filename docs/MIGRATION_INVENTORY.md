# Inventario de migración (Fase 0)

Fecha: 2026-08-25. Fuente: `legacy-site/` sin modificar. Estado actualizado: 2026-08-26.

## Estado de portado textual

Todas las páginas enlazadas por el índice legacy tienen un destino actual. El detalle legible por herramientas está en `data/legacy-text-migration.json` y se valida con `npm run validate:data`.

| Fuente legacy | Destino actual | Estado de idioma |
| --- | --- | --- |
| `index.html` | `/` y `/project` | ES/EN completo |
| `notas-tecnicas-continuidad.html` | `/documents/notas-tecnicas-continuidad` | ES reconciliado + EN draft |
| `biblia-produccion.html` | `/documents/biblia-de-produccion` | ES reconciliado + EN draft |
| `reporte-comprensivo.html` | `/documents/reporte-comprensivo` | ES reconciliado + EN draft |
| `momentos-clave.html` | `/documents/momentos-clave` | ES reconciliado + EN draft |
| `version-acotada-30-min.html` | `/documents/estructura-30-minutos` | ES reconciliado + EN draft |
| `guion-30-minutos.html` | `/script/[scriptId]` | estructura portada; ES fuente + EN draft |
| `animatic-textual.html` | `/animatic/[scriptId]` | estructura portada; ES fuente + EN draft |
| índices de arte/personajes | `/art` y `/entities/*` | ES/EN completo |

`npm run port:legacy-text` vuelve a extraer los cinco documentos prose de forma determinista. No modifica `legacy-site/`: aplica reconciliaciones explícitas de canon a la copia española estructurada y exige que la traducción inglesa conserve la misma topología de bloques.

El guion y animatic actuales ya no se traducen desde HTML: comparten `ScriptFile` por cut con copy bilingüe inline (`LocalizedString` / `variants.en`), cuya cobertura se controla con `npm run validate:translations`.

## Páginas HTML

| Archivo | Enlazado desde index |
| --- | --- |
| `index.html` | (raíz) |
| `reporte-comprensivo.html` | sí |
| `biblia-produccion.html` | sí |
| `guion-30-minutos.html` | sí |
| `notas-tecnicas-continuidad.html` | sí |
| `animatic-textual.html` | sí |
| `momentos-clave.html` | sí |
| `version-acotada-30-min.html` | sí |
| `assets/art-bible/index.html` | sí |
| `assets/characters/index.html` | sí |

## Conteos verificados

| Fuente | Escenas | Tomas/shots | Notas |
| --- | ---: | ---: | --- |
| Animatic `DATA` | 17 | 100 | Suma de `target` = 1800 s (30:00) |
| Guion `ESC. N` h2 | 17 | (n/a) | `ESC. 1` … `ESC. 17` |
| PNG `assets/animatic/frames/` | 17 carpetas | 100 | 1:1 con shots por escena |

### Tomas por escena (animatic)

| Escena | Título | Shots | Target (s) | PNGs |
| ---: | --- | ---: | ---: | ---: |
| 1 | Estación Proxima — embarque | 8 | 180 | 8 |
| 2 | Salida de Proxima | 4 | 60 | 4 |
| 3 | Arco de Júpiter e indicio | 4 | 60 | 4 |
| 4 | Envoltura no declarada | 5 | 90 | 5 |
| 5 | Confirmación y partición | 6 | 120 | 6 |
| 6 | Mensaje hacia el futuro | 6 | 90 | 6 |
| 7 | Asesinato y cruce | 5 | 60 | 5 |
| 8 | El cuerpo | 4 | 60 | 4 |
| 9 | Investigación y sospecha | 6 | 120 | 6 |
| 10 | La mitad técnica del misterio | 7 | 180 | 7 |
| 11 | Harlan intenta cegar la nave | 6 | 90 | 6 |
| 12 | La doble llave | 8 | 120 | 8 |
| 13 | Última ventana del override | 5 | 60 | 5 |
| 14 | Cuarentena antes del contacto | 10 | 210 | 10 |
| 15 | Saludo limpio | 7 | 120 | 7 |
| 16 | Región de encuentro | 3 | 30 | 3 |
| 17 | La verdad llega | 6 | 150 | 6 |
| **Total** | | **100** | **1800** | **100** |

## Assets (archivos bajo `legacy-site/assets/`)

| Carpeta | Archivos |
| --- | ---: |
| animatic | 101 (100 png + manifest) |
| art-bible | 2 |
| characters | 12 |
| locations | 8 |
| props | 5 |
| vehicles | 3 |
| **Total** | **131** |

## Mapa de rutas propuesto

Ver `docs/ASSET_PATH_MAP.md`.

## Checklist de comportamiento (parity)

- Editor: duraciones editables, totales derivados, saltar a película desde toma.
- Película: play/pausa/stop, anterior/siguiente, scrubber, subtítulos, contador, reloj, detalles, fullscreen, retorno al editor conservando posición.
