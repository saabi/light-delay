# Light Delay / Luz Tardía

Proyecto de ciencia ficción de primer contacto. La escaleta maestra bilingüe WIP es la fuente narrativa vigente; los guiones, cuts, animatics y recursos de la continuidad anterior permanecen archivados para rescate y procedencia hasta que puedan derivarse versiones nuevas del master terminado.

## Estado actual

- **Working set for agents:** read [`AGENTS.md`](AGENTS.md) and the day-one map [`docs/AGENT_ONBOARDING.md`](docs/AGENT_ONBOARDING.md). Narrative SoT = master outline (WIP). **Authorized production WIP** = `script:light-delay-festival-master` (+ outline); trailer WIP = `script:light-delay-trailer-master`. The master script is an empty route stub — not “no screenplay.”
- Sitio público bilingüe: inglés en `/` y español en `/es/`, con selector de idioma, metadatos SEO, sitemap, identidad visual y landing de presentación. El inglés es la fuente editorial vigente; el español es traducción revisionada.
- Archivo editorial trasladado a `/project`; el inicio público explica la obra sin depender de conocimiento previo del repositorio.
- Todo el texto prose enlazado desde el sitio legacy fue portado a documentos estructurados y traducido al inglés. El inventario verificable queda en `data/legacy-text-migration.json`.
- Autoridad narrativa: `data/outlines/light-delay-master-narrative.json`, todavía WIP, con exports Markdown ES/EN generados desde ese JSON.
- Productos registrados: narrativa maestra (stub de guion vacío); Corte Festival-master WIP autorizado (guion, tomas y stills de storyboard en curso) y tráiler-master derivado; más cuatro productos de la continuidad anterior —corto principal, tratamiento largo, Festival Cut y tráiler— marcados como deprecados.
- Comparador editorial entre scripts para canon explícito, eventos principales, reparto, variantes y funciones narrativas.
- Informes editoriales dinámicos en `/reports/` (deuda visual, tiempos de diálogo, colas de regen) con el mismo motor que `npm run report:*` y `npm run report:all`.
- El archivo conserva un animatic anterior de 128 tomas y los montajes Festival/tráiler deprecados como material de rescate. La producción visual del Festival-master es WIP autorizado; no regenerar imágenes sin instrucción explícita.
- Biblia visual: 13 hojas de personajes, 7 hojas de localización, 2 naves y 4 objetos clave. El catálogo suma dos localizaciones del reactor requeridas por el master que todavía no tienen hoja visual y no reutilizan la sala obsoleta del núcleo diplomático.
- Sitio estático de referencia: `legacy-site/` (HTML/CSS/JavaScript).
- Aplicación SvelteKit 2 / Svelte 5 en la raíz con rutas de documentos, guion, animatic, arte, entidades y player (Fases 2–6). Medios en `static/assets/`.

## Estructura

```text
.
|-- AGENTS.md                 # Canonical agent policy (English)
|-- CLAUDE.md                 # Thin pointer → AGENTS.md + AGENT_ONBOARDING
|-- README.md
|-- CHANGELOG.md
|-- src/                      # Aplicación SvelteKit
|-- static/                   # Assets públicos usados por la aplicación
|-- docs/                     # Canon, producción, estado y procedencia
|-- docs/AGENT_ONBOARDING.md  # Day-one agent index (layers, working set)
|-- data/                     # Autoridad narrativa y contratos JSON
`-- legacy-site/              # Archivo HTML obsoleto retenido para rescate
```

`legacy-site/` está marcado para eventual eliminación, pero se conserva hasta completar el master, revisar el material rescatable, aprobar sus reemplazos y confirmar que no quedan dependientes activos.

## Abrir la aplicación SvelteKit

```bash
npm install
npm run dev
```

Otras órdenes útiles: `npm run check`, `npm run test`, `npm run build`, `npm run preview`, `npm run port:legacy-text`, `npm run build:brand`, `npm run validate:data`, `npm run generated:check`, `npm run tts:audience:build`, `npm run tts:audience:festival:build`, `npm run tts:audience:check`, `npm run tts:imitation:check`, `npm run tts:imitation:check:local`, `npm run notes:build`, `npm run report:causal-validity`, `npm run report:outline-story`, `npm run report:dialogue-style`, `npm run check:trailer-spoilers`, `npm run report:prompt-readiness`, `npm run report:editorial` y `npm run report:all`.

> `npm run extract:legacy` es una herramienta histórica anterior a la arquitectura multi-script. No debe ejecutarse sobre el árbol canónico actual: todavía sobrescribe varios archivos de `data/` con el formato previo. Su aislamiento o retiro está registrado en [`TODO.md`](TODO.md).

## Sitio público en GitHub Pages

La aplicación se publica como sitio estático de proyecto en GitHub Pages. El workflow `.github/workflows/pages.yml` valida los JSON, ejecuta `svelte-check` y las pruebas unitarias, compila con `@sveltejs/adapter-static` y publica `build/` tras cada push a `master`.

Para el repositorio `saabi/light-delay`, el despliegue estándar usa la base `/light-delay` y está disponible en:

```text
https://saabi.github.io/light-delay/
```

La aplicación usa la base configurada de SvelteKit para navegación, imágenes, animatic y assets, de modo que el desarrollo local sigue funcionando en `/` y GitHub Pages bajo `/light-delay/`.

El idioma público por defecto es inglés. La versión española conserva rutas equivalentes bajo `/es/`; ambas se prerenderizan y se declaran entre sí mediante `hreflang`. El copy de historia lleva ambos idiomas **inline** en los JSON (`LocalizedString` / variantes), con inglés como fuente vigente y estado de sincronización explícito para la traducción española. La escaleta maestra es la autoridad narrativa WIP. Los cuatro guiones previos siguen accesibles sólo como archivo deprecado y conservan su procedencia histórica en español; no se presentan en el sitemap público.

GitHub Pages ya usa **GitHub Actions** como fuente. Los pull requests ejecutan la validación y el build sin desplegar; los pushes a `master` publican el sitio.

El editor de duración del animatic continúa siendo local al navegador: no modifica el JSON ni el repositorio público.

El Studio de imitación (`/studio`) sólo existe en `npm run dev` junto al worker local en `:8765`. El sitio de Pages no lo enlaza.

## Derechos y plataforma reutilizable

La publicación del repositorio y del sitio no concede permiso para reutilizar los guiones, el canon, la historia, el arte ni los assets de Light Delay. Véanse los términos actuales en [`RIGHTS.md`](RIGHTS.md).

El modelo de datos y la aplicación podrían convertirse en una plataforma para desarrollar otros guiones, pero todavía dependen directamente del contenido y de las reglas de Light Delay. La separación del motor genérico y una licencia específica para ese software se anunciarán cuando la extracción esté completa; por ahora no se ofrece la aplicación como plataforma reutilizable.

## Consultar el archivo legacy

Puede abrirse `legacy-site/index.html` directamente para tareas de procedencia o rescate. No representa la obra vigente ni debe usarse como baseline de canon.

## Autoridad documental

1. `AGENTS.md` fija las instrucciones para agentes y la política de idioma (inglés como fuente vigente; español como traducción). Day-one map: `docs/AGENT_ONBOARDING.md`.
2. `data/outlines/light-delay-master-narrative.json` es la fuente narrativa vigente, aunque continúa en estado WIP.
3. `data/editorial-lifecycle.json` clasifica autoridad, material compatible, archivo deprecado, elementos obsoletos y casos que requieren revisión; también define las compuertas previas a cualquier borrado. Incluye el derivado Festival-master / trailer-master como WIP autorizado.
4. `docs/ADR-0002-MASTER-NARRATIVE-AUTHORITY.md` documenta la promoción del master y el flujo de derivación.
5. `data/scripts/light-delay-master-narrative.json` es un stub para rutas y registro: no contiene todavía escenas, cues, shots ni takes y no sustituye la escaleta como autoría. La producción de pantalla vigente vive en `script:light-delay-festival-master`.
6. Los outlines/guiones `main-short`, `festival`, `trailer` y `long` son material de la continuidad anterior (rescate). No fijan canon ni producción vigente.
7. `docs/CANON_DECISIONS.md`, `docs/technical/`, documentos prose y `legacy-site/` son fuentes anteriores o complementarias sujetas a la clasificación de ciclo de vida; no pueden contradecir silenciosamente al master.

Ante una contradicción, no se debe elegir silenciosamente: registrar el conflicto en `docs/PROJECT_STATUS.md` y resolverlo explícitamente.

Cuando existan copias del mismo documento en varios idiomas, editar primero la copia en inglés. La traducción española se sincroniza después o se marca explícitamente como pendiente con su última revisión compatible. Detalle en `AGENTS.md`.

## Desarrollo editorial pendiente

Las siguientes fases deben:

- terminar y aprobar la escaleta maestra WIP;
- revisar el inventario `review_required` y rescatar del archivo sólo material compatible con el master;
- definir y aprobar nuevos cuts como derivados explícitos, comenzando por su propia escaleta;
- generar después sus guiones, animatics y planes de producción, sin revivir implícitamente los productos obsoletos;
- revisar editorialmente el inglés fuente y mantener visible el estado de la traducción española.

Los HTML existentes son referencia y material de migración, no el formato final de autoría.

## Archivos grandes

Las imágenes PNG deben almacenarse con Git LFS. Véase `.gitattributes`.
