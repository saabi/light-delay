# Estado del proyecto

Fecha de corte: 2026-08-26.

## Completado

- **Sitio público bilingüe y presentación:** inglés por defecto en `/`, español en `/es/`, landing pública, archivo editorial en `/project`, selector de idioma con rutas recargables, Paraglide JS, SEO canónico con `hreflang`, Open Graph, sitemap, manifest, favicon y marca propia. Las rutas EN/ES se prerenderizan también con `BASE_PATH=/light-delay`.
- **Copy de portada revisado:** la landing identifica la obra como ciencia ficción dura, simplifica la premisa de Zao sin cambiar el canon, usa inglés estadounidense coherente con `en_US` y alinea numerales, nombre del corto y CTA del archivo en EN/ES.
- **Generación i18n reproducible:** `npm run check` genera los módulos tipados de Paraglide antes de `svelte-check`; el compilador directo y el plugin de Vite comparten opciones, incluido el base path de Pages. Una instalación limpia ya no depende de artefactos ignorados del entorno local.
- **Texto legacy portado y traducido:** las cinco páginas prose, los índices de arte/personajes y la portada legacy tienen equivalentes basados en datos. Notas, biblia, reporte, momentos y estructura de 30 minutos se migraron con jerarquía, listas, tablas y beats; la copia española se reconcilió con el canon vigente y la inglesa conserva la misma topología. `data/legacy-text-migration.json` funciona como ledger verificable.
- **Galerías bilingües:** nombres y descripciones de personajes, lugares, objetos, vehículos y facciones tienen overlay inglés; la interfaz completa del lector, animatic, panel técnico y comparador responde al locale. El contenido narrativo del guion, diálogos y descripciones de toma sigue en español y se señala como alcance diferido.
- **Navegación responsive:** todas las rutas salvo Modo película usan header global compacto + rail persistente en escritorio y barra inferior + hoja modal en móvil. El umbral `calc(26.88em + 52.8ch)` responde a capacidad tipográfica; ambos modos enlazan el repositorio de GitHub.
- **Player adaptable:** landscape conserva la composición inmersiva; portrait ordena frame, detalles desplegables y controles persistentes, con continuidad de toma, progreso y panel al cambiar orientación.
- **Auditoría móvil:** inicio, guion, animatic, arte, comparación, documentos, entidades y assets adaptan grillas, tablas, metadatos y controles sin desborde horizontal a 320 px.
- **Deuda visual del animatic estructurada:** las 33 tomas provisionales de escenas 5–8 se marcan en `Take.imageStatus` con toma de origen; los assets originales siguen vigentes y el tráiler no recibe marcas por su montaje intencional.
- **Fallback y detalle de toma:** claqueta técnica neutral registrada para imágenes faltantes/fallidas; editor y player señalizan placeholders. «Detalles de la toma» funciona por clic/tecla `D` y presenta contexto, cámara, cues, takes, revisión y procedencia.
- **GitHub Pages:** repositorio público y Pages habilitado para `https://saabi.github.io/light-delay/`; build con `@sveltejs/adapter-static`, prerender global, fallback `404.html`, `BASE_PATH=/light-delay` y workflow que descarga Git LFS y valida datos, tipos y pruebas antes de publicar pushes a `master`.
- **Secuencia Zao/Harlan antes del cruce:** escenas 5–8 reescritas con cámara y diálogo coherentes: aviso parcial, jammer visible, corte físico de COM A/B, puntería del láser exterior al corredor futuro, rutas distintas en microgravedad, asesinato/limpieza, hallazgo de Sorell y coartada de Harlan. Sorell queda establecida como testigo con credencial comprometida, no como sospechosa.
- **Animatic principal revisado:** 17 escenas, 112 tomas y 30:00. Las 33 tomas afectadas en escenas 5–8 reutilizan 21 frames heredados; 12 tomas son nuevas. No se regeneraron imágenes.
- **Arquitectura mínima de Celestial Ardor:** vestíbulo axial encuadrable desde el puente, acceso de servicio oculto, cilindros central/servicio, distribuidor COM A/B y control físico dedicado del láser incorporados a canon, datos y notas técnicas.
- **Deuda diferida:** `TODO.md` concentra el registro vigente de deuda narrativa, visual y técnica: extractor legacy inseguro, autoridad/validación de esquema, Node/CI, stale docs/arte, cálculo del enlace láser, traducción narrativa y futuro sistema general de notas editoriales. El estado estructurado de imágenes ya está implementado.
- **Comparación entre guiones (V1):** taxonomía versionada de 11 dimensiones de canon y 11 eventos, perfiles declarativos en los cuatro scripts y ruta `/compare/[scriptId]?against=<ScriptId>` para canon, eventos, reparto, variantes y funciones. La herramienta no infiere herencia de diálogo ni fusiones/divisiones.
- **Largometraje recuperado:** `script:light-delay-long` registrado como tratamiento de 100 min, 4 actos, 28 escenas y 28 beats, sin cues/shots/takes inventados. Incorpora el canon vigente y conserva procedencia hacia documentos o escenas del corto.
- **Reparto largo:** catorce nombres recuperados y catalogados: Zao, Voss, Harlan, Sorell, Rao, Cael, Keene, Vega, Wei, Hassan, Carvalho, Okoye, Volkov y Tanaka. La revisión autorizada está en `docs/REVISION_LARGOMETRAJE_RECUPERADO.md`.
- **Multi-script / Festival Cut (ADR-0001 Accepted):** registro en `project.json`, IDs `character:…` / `main:…` / `festival:…`, scripts en `data/scripts/`, funciones narrativas, borrador festival (7 escenas, shots vacíos), rutas `/script/[scriptId]` y `/animatic/[scriptId]`, overlay de animatic acotado por script+versión.
- **Selector de guion adaptable:** `ScriptSwitcher` permanece visible en el rail de escritorio y dentro de la hoja móvil de `ProjectNav`; Guion/Animatic respetan el cut activo (sessionStorage + URL).
- **Tráiler (~1:30):** `data/scripts/light-delay-trailer.json` — 9 secuencias del brief, 29 tomas reutilizando frames del main short; regenerable con `npm run build:trailer`.
- **Modo película:** chrome alineado al legacy en landscape (`AnimaticPlayer` fullscreen con meta, detalles flotantes y barra inferior) y flujo frame → detalles → controles en portrait.
- **Higgsfield (staging):** `higgsfield-uploads/` con hojas renombradas de personajes (sin Harlan/Rao), localizaciones y props; ver `higgsfield-uploads/TODO.md`.
- **Referencias de escala:** `proportional-reference` por entidad (Proxima, Celestial Ardor) y comparativa común en `art-bible/scale-references/`.
- **Retorno de Modo película:** el enlace a edición restaura la toma activa mediante `?shot=` y centra/enfoca su tarjeta; hay control visible de pantalla completa.
- Guion corto revisado de 17 escenas con objetivo de 30 minutos.
- Lista de momentos clave y versión acotada sincronizadas.
- Biblia de producción y reporte comprensivo actualizados al canon reciente.
- Notas técnicas de continuidad revisadas.
- Biblia visual con personajes, localizaciones, naves y objetos clave.
- Animatic textual de 112 tomas.
- 100 imágenes 1536 × 864 reutilizadas por 112 takes; los reemplazos pendientes están registrados en `TODO.md` y en notas de toma.
- Modo Película con subtítulos, controles, timeline y panel de detalles.
- Edición de duraciones con persistencia local y recálculo del total.
- Bootstrap SvelteKit 2 / Svelte 5 en la raíz (TypeScript, lint, Vitest, Playwright).
- Fase 0 de migración: inventario HTML/assets; 17 escenas / 100 tomas / 100 frames verificados; mapa `static/assets`; stub de sync guion↔animatic.
- Fase 1 (+ extracción inicial): tipos TypeScript, validadores a mano, loaders/repositorios/selectores, JSON en `data/` (17 escenas / 100 tomas / 98 diálogos ES), `npm run extract:legacy` y `npm run validate:data`.
- Fases 2–6 (aplicación): shell + documentos; copia de assets a `static/assets/`; rutas de arte/entidades/assets; lector de guion; editor de animatic; player a pantalla completa. Medios solo vía `/assets/...`.

## Decisiones abiertas

1. **Cronología T+24 h / T+26,5 h.** Las fuentes anteriores no quedaron completamente unificadas. Debe fijarse una cronología maestra y propagarse al guion, animatic y notas técnicas.
2. **Corrección de rumbo — Opción B.** Falta desarrollar y aplicar de forma consistente la solución de navegación/propulsión elegida.
3. **Terminología del sistema.** Unificar `IA`, `mediación`, `núcleo diplomático`, `núcleo cuántico` y `envoltura` según función dramática y técnica.
4. **Duración real.** Los 30:00 son un objetivo de montaje. Debe validarse mediante lectura cronometrada y luego con animación/video.
5. **Festival Cut.** Hay borrador de datos (`data/scripts/light-delay-festival.json`) con 7 escenas y causalidad de la transmisión sincronizada; faltan shot list, takes e imágenes canónicas de esa versión. El array `sequences` está vacío.
6. **Tráiler.** Versión animatic operativa reutilizando frames del main; falta afinado editorial de ritmo, posibles stills exclusivos de título y audio.
7. **Procedencia completa.** Los prompts exactos, parámetros y referencias de varias imágenes no quedaron incluidos en los manifests actuales.
8. **Especialidades de Volkov y Tanaka.** La fuente recuperada sólo respalda parcialmente la vinculación de Volkov con controles manuales y no define una función estable para Tanaka. No deben completarse por invención.
9. **Retropropagación al corto.** Vega como pista falsa acotada, mayor textura de especialistas y una preparación más legible del relé son candidatos; requieren decisión narrativa independiente antes de modificar versiones cortas.

## Notas técnicas recientes

- GitHub Pages: build estático con `adapter-static`; `BASE_PATH` permite desarrollo local en `/` y publicación estándar en `/light-delay/`; rutas y medios públicos pasan por helpers de base path. La concurrencia del workflow se separa por referencia.
- Inventario: `docs/MIGRATION_INVENTORY.md`. Sync: `docs/SCRIPT_ANIMATIC_SYNC.md`. Rutas: `docs/ASSET_PATH_MAP.md`.
- Bootstrap SvelteKit validado. `.nvmrc` aún fija Node 25, ya fuera de soporte; migrar a una línea LTS forma parte de la deuda prioritaria.
- Autoridad de esquema documentada actualmente: tipos TypeScript de `JSON_FORMAT.md` + addendum i18n (sin Zod). Falta convertirla en autoridad runtime única y eliminar la deriva con el validador JavaScript.
- Política de idioma: español = fuente de verdad. Detalle en `AGENTS.md`.
- Política narrativa: evitar exposición forzada; revelar por pensamiento/decisión del personaje (véase `AGENTS.md`).
- Haz de Zao: `docs/SIGNAL_BEAM_REQUIREMENTS.md` conserva sólo una aproximación visual; el presupuesto óptico exacto permanece en `TODO.md`.
- Assets: copia en `static/assets/` (characters 12, locations 8+proportional, props 5, vehicles 3+proportional, art-bible 2+scale-references; animatic con 100 frames legacy, manifest y 1 placeholder técnico). `legacy-site/assets/` intacto como referencia.
- Documentos prose: cinco páginas legacy extraídas y traducidas en `data/documents.json`; validación exige paridad de bloques ES/EN y cobertura del ledger de migración.
- Estado editorial: las cinco traducciones prose permanecen en `draft`; el canon estructurado es todavía un `stub`; los cuatro scripts registrados continúan en `draft`.
- Calidad: `validate:data`, ESLint y 12 pruebas E2E pasan localmente; `npm run lint` falla por formato en 16 archivos. El workflow de Pages todavía no ejecuta lint ni E2E.
- Validación pendiente: los 130 assets registrados existen y el grafo actual no mostró referencias rotas en la auditoría puntual, pero el validador de CI no comprueba todavía paths físicos ni toda la integridad padre/hijo.

## Próxima fase técnica

- Retirar o aislar `npm run extract:legacy` antes de volver a presentarlo como comando seguro y resolver la autoridad ejecutable del esquema.
- Migrar CI a Node LTS, normalizar formato y añadir lint + Playwright al gate de Pages.
- Separar en el futuro el motor genérico de autoría/consulta y el paquete de contenido de Light Delay antes de ofrecer una plataforma reutilizable con licencia propia.
- Fase 7: desarrollar el tratamiento largo sólo tras revisión editorial y limpiar duplicados binarios tras revisar paridad.
- Revisar los tres candidatos de retropropagación sin sincronizarlos automáticamente entre scripts.
- Refinar títulos de escena animatic vs encabezados de guion (véase `SCRIPT_ANIMATIC_SYNC.md`).
- Pruebas de regresión ampliadas del modo Película (fullscreen, subtítulos, restauración de toma y controles por teclado).

## Criterio de migración terminada

La migración no está completa hasta que todo contenido accesible desde `legacy-site/index.html`, todas las imágenes y todas las funciones del animatic estén disponibles en la aplicación Svelte sin depender de datos incrustados en HTML.
