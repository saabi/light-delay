# Repository Structure Target

Status: **accepted target design; execute after Milestone 0 baseline verification**.

This document defines the desired repository layout after the current branch has a verified build/test baseline. It is intentionally more ambitious than the first safe move of the legacy SvelteKit application: the repository root should become a **monorepo control surface**, not an implicit application directory or a storage area for one film project.

## Design goals

1. Root contains only repository-wide configuration, workspace orchestration, governance and top-level documentation.
2. Deployable applications live under `apps/`.
3. Reusable application/domain code lives under `packages/`.
4. Light Delay-specific creative data, production tooling and media are visibly separated from reusable Studio platform code.
5. Large media does not dictate the shape of the application source tree.
6. Existing paths are migrated deliberately, with compatibility adapters where required.
7. No cleanup changes semantic authority merely because a file moved.
8. The layout remains viable if Studio later becomes a multi-project commercial application and Light Delay becomes only one imported/example project.

## Target tree

```text
light-delay/
├── apps/
│   ├── studio/                     # New Studio product
│   │   ├── src/
│   │   ├── static/                 # Studio-only public assets
│   │   ├── package.json
│   │   ├── svelte.config.js
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   │
│   └── light-delay/                # Legacy Light Delay SvelteKit application
│       ├── src/
│       ├── messages/               # Legacy application chrome translations
│       ├── project.inlang/
│       ├── package.json
│       ├── playwright.config.ts
│       ├── paraglide.config.mjs
│       ├── svelte.config.js / config equivalent
│       ├── vite.config.ts
│       └── tsconfig.json
│
├── packages/
│   ├── v2-core/                    # Current shared vertical-slice core
│   └── ...                         # Extract only when reuse/boundaries are proven
│
├── projects/
│   └── light-delay/                # Creative/project workspace, not application code
│       ├── data/                    # Canon, scripts, outlines, production metadata
│       ├── media/                   # Canonical project media tree (see media policy)
│       ├── tools/                   # Light Delay-specific production/editorial tools
│       ├── blender/                 # Project-specific 3D/source work
│       ├── exports/                 # Generated handoff/export products where tracked
│       └── README.md                # Project authority/path conventions
│
├── tools/
│   ├── repo/                        # Repository-wide validation/migration/build tools
│   └── ...                          # Cross-project tools only
│
├── docs/
│   ├── architecture/                # Eventually group v2 architecture docs here
│   ├── development/
│   └── ...
│
├── .github/
├── package.json                     # Workspace orchestrator only
├── package-lock.json
├── eslint.config.js
├── prettier.config.js
├── tsconfig.base.json               # Shared TS defaults when useful
├── .npmrc
├── .nvmrc
├── .gitignore
├── AGENTS.md
├── README.md
├── LICENSE / RIGHTS files
└── CHANGELOG.md
```

The exact grouping of documentation can remain conservative; moving docs is lower priority than establishing application/project/package boundaries.

## Root contract

After cleanup, a new contributor should be able to infer the architecture from the first directory listing.

The root SHOULD contain:
- workspace/package manager files;
- shared lint/format/TypeScript configuration;
- CI configuration;
- repository governance/instructions;
- top-level README/changelog/rights;
- `apps/`, `packages/`, `projects/`, `tools/`, `docs/`.

The root SHOULD NOT contain:
- a SvelteKit `src/`;
- an app-level `static/`;
- app-level i18n sources;
- app-level Vite/Svelte/Playwright configuration;
- one project's canonical `data/`;
- one project's Blender files;
- one project's generation/export staging directories;
- dozens of project-specific Node/Python scripts.

The root `package.json` remains intentionally useful, but becomes an **orchestrator**, not the manifest of the legacy app.

## Application boundary

### `apps/studio`

Studio is the forward product. It owns only product-shell concerns:
- SvelteKit routes/layouts;
- product styling;
- UI composition;
- web/session integration;
- adapters needed specifically at the web boundary.

It must not become the home of semantic story/world logic.

### `apps/light-delay`

This is the existing Light Delay browser application preserved as a legacy/compatibility application.

It owns:
- current Svelte routes/components;
- its Paraglide application chrome;
- app-local browser tests/configuration;
- its app build configuration.

It consumes Light Delay project data through an explicit adapter/path contract during migration. Moving it does **not** make its current data model the Studio model.

Long term this application may be retired. Its directory boundary should make retirement straightforward.

## Project boundary

### `projects/light-delay`

Light Delay is both:
1. the creative work we need to preserve; and
2. the principal real-world migration/acceptance fixture for Studio.

Its project material should therefore not remain mixed with repository/platform infrastructure.

Candidate mapping:

```text
data/                 -> projects/light-delay/data/
blender/              -> projects/light-delay/blender/
higgsfield-uploads/   -> projects/light-delay/exports/higgsfield/  (after provenance review)
static/assets/        -> projects/light-delay/media/                (only after media-path migration)
scripts/<project-specific> -> projects/light-delay/tools/
```

These are **target mappings**, not authorization to move all paths mechanically. Some current scripts are cross-cutting and some generated/export directories may have external workflow assumptions.

### Project paths are configuration, not hidden cwd assumptions

Code should converge on an explicit project-root abstraction, for example:

```text
Repository root
  -> project registry/config
  -> projectRoot(projectId)
  -> dataRoot / mediaRoot / exportRoot
```

Avoid replacing today's `../../../../data` assumptions with tomorrow's `../../../../projects/light-delay/data` assumptions everywhere.

The legacy adapter may temporarily bind:

```text
project:light-delay
  dataRoot  = projects/light-delay/data
  mediaRoot = projects/light-delay/media
```

Studio's future ProjectStore must not depend on these filesystem paths.

## Media policy

The current `static/assets/` tree has two responsibilities mixed together:
- canonical/production media storage;
- SvelteKit public serving.

Those should eventually separate.

Target concept:

```text
projects/light-delay/media/       # canonical project media/source tree
          |
          +--> manifest/catalog
          |
          +--> app build/publication step
                    |
                    +--> apps/light-delay/static/assets/ or build artifact
```

Do not duplicate hundreds of MiB merely to achieve a pretty directory tree.

During transition, root `static/` may remain as a compatibility media root until:
- asset catalog paths are migrated;
- production scripts use the project/media resolver;
- GitHub Pages publication is adapted;
- Resolve/OTIO and other external paths are verified;
- duplication/LFS implications are understood.

Therefore **moving `static/assets` is a later root-cleanup stage, not part of the first app move**.

## Tooling boundary

Today's root `scripts/` mixes repository automation with Light Delay-specific production/editorial operations.

Classify before moving:

### Repository/platform tools

Examples of responsibilities:
- schema generation;
- generic migrations;
- repository validation;
- workspace orchestration.

Target: `tools/repo/` or the package that owns the behavior.

### Light Delay project tools

Examples of responsibilities:
- Festival/trailer/master-specific builds;
- Higgsfield handoffs;
- Light Delay dialogue/audio generation;
- Light Delay production reports;
- Light Delay asset maintenance.

Target: `projects/light-delay/tools/`.

### Shared filmmaking tools

Only after demonstrated reuse, a tool that is genuinely project-independent may move into a package or shared `tools/` area.

Do not generalize a script merely because it is being moved.

## Package extraction policy

The clean root must not tempt us into creating a package for every noun.

Near-term:

```text
packages/
  v2-core/
```

Potential later packages such as schema, context, persistence, validation, generation or UI are extracted only when their boundaries have been proven by the vertical slices.

A clean directory tree is not evidence that a runtime package boundary is useful.

## Workspace scripts

Root commands should become explicit dispatchers:

```json
{
  "scripts": {
    "dev:studio": "npm run dev --workspace @light-delay/studio",
    "build:studio": "npm run build --workspace @light-delay/studio",
    "check:studio": "npm run check --workspace @light-delay/studio",

    "dev:legacy": "npm run dev --workspace @light-delay/legacy",
    "build:legacy": "npm run build --workspace @light-delay/legacy",
    "check:legacy": "npm run check --workspace @light-delay/legacy",

    "test:v2-core": "...",
    "validate:project:light-delay": "..."
  }
}
```

For compatibility, bare `npm run build` / `check` may temporarily delegate to the legacy app while GitHub Pages and contributor workflows are migrated. Eventually ambiguous bare commands should either run the whole workspace or be removed.

## CI/deployment implications

The existing GitHub Pages workflow currently assumes:
- legacy app at root;
- root build command builds that app;
- output at root `build/`.

After the app move it should explicitly build `apps/light-delay` and upload that workspace's output.

Studio should have a distinct CI/build job even before it has a production deployment.

Target CI shape:

```text
validate repository/project data
          |
          +--> test shared packages
          |
          +--> check/build legacy app
          |
          +--> check/build Studio
          |
          +--> deploy selected app(s)
```

Project production validations should not be accidentally coupled to whether either web UI builds.

## Cleanup stages after Milestone 0

### Stage R1 — Move legacy application source

Move:
- `src/` -> `apps/light-delay/src/`;
- app config -> `apps/light-delay/`;
- legacy app dependencies/scripts -> workspace manifest.

Correct relative imports to root project data/scripts through a temporary explicit legacy-project adapter.

Keep canonical `data/`, `static/`, and project production scripts at root for this stage.

**Gate:** legacy check, unit tests, build and representative Pages build remain equivalent.

### Stage R2 — Move app-local i18n and browser configuration

Move:
- `messages/`;
- `project.inlang/`;
- Paraglide config;
- Playwright config.

Update compile commands and generated-output ignores.

**Gate:** language routing/chrome and e2e configuration work from workspace context.

R1 and R2 may be implemented together if verification remains straightforward.

### Stage R3 — Establish `projects/light-delay`

Move canonical creative structured data first:

```text
data/ -> projects/light-delay/data/
```

Introduce a project-root resolver before changing consumers. Update Node tools and legacy adapter systematically.

**Gate:** all data validation/reporting tests pass and no direct old `data/` references remain outside migration compatibility code/docs.

### Stage R4 — Classify and move tooling

Split `scripts/` by responsibility. Move project-specific tools under the project; retain truly repository-wide tooling separately.

**Gate:** all documented npm workflows still have stable root aliases where useful.

### Stage R5 — Decouple canonical media from web static serving

Introduce explicit media root/catalog/publication behavior, then move the canonical asset tree.

This is intentionally later because it touches production tooling, LFS/media volume, external editing workflows and deployed URLs.

**Gate:** asset validation, animatic, generation plans, thumbnails, OTIO/Resolve export, and deployed legacy URLs remain correct.

### Stage R6 — Clean secondary project/export directories

Review and relocate:
- Blender work;
- Higgsfield upload staging;
- temporary/generated outputs;
- any remaining project-specific root directories.

Do not move provenance-sensitive outputs until their references are understood.

### Stage R7 — Documentation cleanup

Execute the taxonomy and move plan in `V2_DOCUMENTATION_STRUCTURE.md`. V2 documentation can be grouped earlier once Milestone 0 is green; active Light Delay documentation should move in coordination with `projects/light-delay/` so it moves directly to its final project-owned location.

Once paths are stable:
- update `README.md`, `AGENTS.md`, setup docs and production docs;
- remove transitional path aliases;
- document final root contract.

## What Milestone 0 means for this cleanup

Milestone 0 does **not** require the clean-root migration itself.

It establishes the verified baseline that makes structural cleanup safe:

```text
current branch
  -> install
  -> tests/check/build
  -> known baseline
  -> root cleanup stages
  -> same tests/check/build
  -> structural change proven behavior-preserving
```

The `refactor/move-legacy-app` branch should remain based on that baseline and be rebased/updated if Milestone 0 fixes alter the architecture branch.

## Relationship to Studio migration

Root cleanup and Studio architecture are related but not the same migration.

- Root cleanup changes **where repository material lives**.
- V2 migration changes **what the authoritative semantic model is**.
- Light Delay import changes **how legacy project semantics enter the new model**.
- Database migration changes **where Studio authoritative state persists**.

Keeping those distinctions explicit lets us clean aggressively without accidentally declaring legacy filesystem layout to be the future product architecture.

## Desired post-cleanup first impression

A repository newcomer should see:

```text
apps       things we deploy
packages   reusable code
projects   creative works / migration fixtures
tools      repository/shared tooling
docs       decisions and operating knowledge
```

Everything else at root should answer the question: **how is this monorepo governed, built, tested or configured?**
