# Light Delay / Luz Tardía

Proyecto de cortometraje de ciencia ficción de primer contacto. El repositorio conserva el guion canónico, la biblia de producción y arte, las notas técnicas y el animatic textual de 124 tomas con imágenes de referencia reutilizadas donde aún faltan stills definitivos.

## Estado actual

- Sitio público bilingüe: inglés en `/` y español en `/es/`, con selector de idioma, metadatos SEO, sitemap, identidad visual y landing de presentación. El español continúa siendo la fuente editorial.
- Archivo editorial trasladado a `/project`; el inicio público explica la obra sin depender de conocimiento previo del repositorio.
- Todo el texto prose enlazado desde el sitio legacy fue portado a documentos estructurados y traducido al inglés. El inventario verificable queda en `data/legacy-text-migration.json`.
- Guion corto canónico: 17 escenas, objetivo inicial de 30:00 y montaje de datos actual de 30:39,5.
- Cuatro productos registrados: corto principal, tratamiento de largometraje, Festival Cut y tráiler.
- Comparador editorial entre scripts para canon explícito, eventos principales, reparto, variantes y funciones narrativas.
- Informes editoriales dinámicos en `/reports/` (deuda visual, tiempos de diálogo, colas de regen) con el mismo motor que `npm run report:*` y `npm run report:all`.
- Animatic textual de 124 tomas con image take, encuadre, audio, subtítulos y duración editable (30:39,5). En el corto hay 112 reutilizaciones candidatas a regeneración y 12 tomas nuevas que usan el placeholder técnico y necesitan reemplazo; el tráiler suma 29 candidatas. La producción visual está deferida hasta cerrar causalidad y cobertura por guion.
- Biblia visual: 10 hojas de personajes, 7 localizaciones, 2 naves y 4 objetos clave.
- Sitio estático de referencia: `legacy-site/` (HTML/CSS/JavaScript).
- Aplicación SvelteKit 2 / Svelte 5 en la raíz con rutas de documentos, guion, animatic, arte, entidades y player (Fases 2–6). Medios en `static/assets/`.

## Estructura

```text
.
|-- AGENTS.md                 # Reglas de continuidad para agentes
|-- README.md
|-- CHANGELOG.md
|-- src/                      # Aplicación SvelteKit
|-- static/                   # Assets públicos usados por la aplicación
|-- docs/                     # Canon, producción, estado y procedencia
|-- data/                     # Contratos y futuros JSON canónicos
`-- legacy-site/              # Sitio HTML actual y todos sus assets
```

No debe eliminarse `legacy-site/` hasta que la nueva aplicación reproduzca todas sus páginas y el modo Película del animatic.

## Abrir la aplicación SvelteKit

```bash
npm install
npm run dev
```

Otras órdenes útiles: `npm run check`, `npm run test`, `npm run build`, `npm run preview`, `npm run port:legacy-text`, `npm run build:brand`, `npm run validate:data`, `npm run report:editorial`, `npm run report:outline-missing`, `npm run report:all`.

> `npm run extract:legacy` es una herramienta histórica anterior a la arquitectura multi-script. No debe ejecutarse sobre el árbol canónico actual: todavía sobrescribe varios archivos de `data/` con el formato previo. Su aislamiento o retiro está registrado en [`TODO.md`](TODO.md).

## Sitio público en GitHub Pages

La aplicación se publica como sitio estático de proyecto en GitHub Pages. El workflow `.github/workflows/pages.yml` valida los JSON, ejecuta `svelte-check` y las pruebas unitarias, compila con `@sveltejs/adapter-static` y publica `build/` tras cada push a `master`.

Para el repositorio `saabi/light-delay`, el despliegue estándar usa la base `/light-delay` y está disponible en:

```text
https://saabi.github.io/light-delay/
```

La aplicación usa la base configurada de SvelteKit para navegación, imágenes, animatic y assets, de modo que el desarrollo local sigue funcionando en `/` y GitHub Pages bajo `/light-delay/`.

El idioma público por defecto es inglés. La versión española conserva rutas equivalentes bajo `/es/`; ambas se prerenderizan y se declaran entre sí mediante `hreflang`. Los cuatro scripts, sus diálogos, subtítulos derivados, escenas, beats, tomas, assets y datos de comparación cuentan con un overlay inglés en estado `draft`; el español permanece como fuente de verdad y una elección manual de idioma narrativo se conserva localmente.

GitHub Pages ya usa **GitHub Actions** como fuente. Los pull requests ejecutan la validación y el build sin desplegar; los pushes a `master` publican el sitio.

El editor de duración del animatic continúa siendo local al navegador: no modifica el JSON ni el repositorio público.

## Derechos y plataforma reutilizable

La publicación del repositorio y del sitio no concede permiso para reutilizar los guiones, el canon, la historia, el arte ni los assets de Light Delay. Véanse los términos actuales en [`RIGHTS.md`](RIGHTS.md).

El modelo de datos y la aplicación podrían convertirse en una plataforma para desarrollar otros guiones, pero todavía dependen directamente del contenido y de las reglas de Light Delay. La separación del motor genérico y una licencia específica para ese software se anunciarán cuando la extracción esté completa; por ahora no se ofrece la aplicación como plataforma reutilizable.

## Abrir la versión legacy

Puede abrirse `legacy-site/index.html` directamente. Para evitar restricciones del navegador, también puede servirse desde la raíz con cualquier servidor HTTP estático.

## Autoridad documental

1. `AGENTS.md` fija las instrucciones para agentes y la política de idioma (español como fuente de verdad; inglés como secundario).
2. `docs/CANON_DECISIONS.md` fija las decisiones de canon vigentes.
3. `data/scripts/light-delay-main-short.json` es la fuente estructurada vigente del guion corto y del animatic; diálogo, cues, shots y takes se proyectan desde ese grafo.
4. `docs/technical/` y los documentos prose reconciliados en `data/documents.json` fijan las reglas físicas y de continuidad complementarias.
5. `legacy-site/guion-30-minutos.html`, `legacy-site/animatic-textual.html` y las demás páginas HTML se conservan como referencia de regresión y procedencia, no como una segunda autoridad editable.
6. Los documentos históricos de largometraje sólo aportan procedencia; `docs/REVISION_LARGOMETRAJE_RECUPERADO.md` determina qué material fue aceptado, reescrito o rechazado.

Ante una contradicción, no se debe elegir silenciosamente: registrar el conflicto en `docs/PROJECT_STATUS.md` y resolverlo explícitamente.

Cuando existan copias del mismo documento en varios idiomas, editar primero la copia en español y sincronizar el resto en la misma tarea. Detalle en `AGENTS.md`.

## Desarrollo editorial pendiente

Las siguientes fases deben:

- completar el tratamiento largo con escenas dialogadas, tomas y recursos sólo cuando se apruebe su revisión narrativa;
- evaluar por separado los candidatos de retropropagación al corto, Festival Cut y tráiler;
- ampliar la comparación sin inferir automáticamente herencia de diálogo o fusiones de personajes;
- revisar editorialmente el borrador inglés estructurado hasta poder promover sus traducciones desde `draft`, sin alterar la autoridad del español.

Los HTML existentes son referencia y material de migración, no el formato final de autoría.

## Archivos grandes

Las imágenes PNG deben almacenarse con Git LFS. Véase `.gitattributes`.
