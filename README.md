# Light Delay / Luz Tardía

Proyecto de cortometraje de ciencia ficción de primer contacto. El repositorio conserva el guion canónico, la biblia de producción y arte, las notas técnicas y el animatic textual de 112 tomas con imágenes de referencia reutilizadas donde aún faltan stills definitivos.

## Estado actual

- Guion corto canónico: 17 escenas, objetivo inicial de 30:00.
- Cuatro productos registrados: corto principal, tratamiento de largometraje, Festival Cut y tráiler.
- Comparador editorial entre scripts para canon explícito, eventos principales, reparto, variantes y funciones narrativas.
- Animatic: 112 tomas con image take, encuadre, audio, subtítulos y duración editable; las 33 tomas reescritas de las escenas 5–8 reutilizan frames provisionales y 12 son unidades narrativas nuevas.
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

Otras órdenes útiles: `npm run check`, `npm run test`, `npm run build`, `npm run preview`, `npm run extract:legacy`, `npm run validate:data`.

## Abrir la versión legacy

Puede abrirse `legacy-site/index.html` directamente. Para evitar restricciones del navegador, también puede servirse desde la raíz con cualquier servidor HTTP estático.

## Autoridad documental

1. `AGENTS.md` fija las instrucciones para agentes y la política de idioma (español como fuente de verdad; inglés como secundario).
2. `docs/CANON_DECISIONS.md` fija las decisiones de canon vigentes.
3. `legacy-site/guion-30-minutos.html` es el guion corto canónico actual.
4. `legacy-site/notas-tecnicas-continuidad.html` fija las reglas físicas y de continuidad.
5. `legacy-site/animatic-textual.html` fija la descomposición actual en tomas.
6. `legacy-site/reporte-comprensivo.html` y la biblia de producción aportan contexto ampliado.

Ante una contradicción, no se debe elegir silenciosamente: registrar el conflicto en `docs/PROJECT_STATUS.md` y resolverlo explícitamente.

Cuando existan copias del mismo documento en varios idiomas, editar primero el español y sincronizar el resto en la misma tarea. Detalle en `AGENTS.md`.

## Desarrollo editorial pendiente

Las siguientes fases deben:

- completar el tratamiento largo con escenas dialogadas, tomas y recursos sólo cuando se apruebe su revisión narrativa;
- evaluar por separado los candidatos de retropropagación al corto, Festival Cut y tráiler;
- ampliar la comparación sin inferir automáticamente herencia de diálogo o fusiones de personajes;
- completar la extracción editorial de documentos que aún son stubs.

Los HTML existentes son referencia y material de migración, no el formato final de autoría.

## Archivos grandes

Las imágenes PNG deben almacenarse con Git LFS. Véase `.gitattributes`.
