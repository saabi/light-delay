# Documentation Structure Target

Status: **accepted target design; execute with repository cleanup after Milestone 0**.

## Principle

Documentation location should communicate **scope and authority**.

The current `docs/` mixes:
- Studio/V2 product architecture;
- legacy Light Delay application architecture;
- active Light Delay story/production documentation;
- migration history, audits and superseded material;
- temporary/WIP outputs.

Do not solve this by labeling everything that predates Studio as "legacy". Light Delay remains an active creative project and migration fixture; its current canon and production documents are project documentation, not obsolete documentation.

## Target structure

```text
docs/
├── README.md                       # Documentation map and authority guide
├── v2/                             # Studio / V2 product architecture
│   ├── README.md
│   ├── architecture/
│   │   ├── ADR-0003-...
│   │   ├── DOMAIN_MODEL.md
│   │   ├── RUNTIME_CONTRACTS.md
│   │   ├── TEMPORAL_AND_EPISTEMIC.md
│   │   ├── CONTEXT_ENGINE.md
│   │   ├── SCALABILITY_AND_STORAGE.md
│   │   └── REPOSITORY_STRUCTURE.md
│   ├── product/
│   │   ├── UI_AND_VERTICAL_SLICE.md
│   │   └── STUDIO_DESIGN_SYSTEM.md
│   ├── migration/
│   │   └── MIGRATION_PLAN.md
│   ├── roadmap/
│   │   └── IMPLEMENTATION_ROADMAP.md
│   └── acceptance/
│       └── ACCEPTANCE_SCENARIOS.md
│
├── repository/                     # Monorepo-wide contributor/engineering docs
│   ├── AGENT_ONBOARDING.md
│   └── ...                         # only genuinely cross-project material
│
└── legacy/                         # Superseded app/repository architecture/history
    ├── README.md
    ├── architecture/
    ├── migrations/
    └── historical/
```

Active Light Delay creative documentation ultimately leaves the root docs tree:

```text
projects/
└── light-delay/
    └── docs/
        ├── README.md
        ├── canon/
        ├── narrative/
        ├── production/
        ├── technical/
        ├── reports/
        ├── wip/
        └── archive/
```

## V2 / Studio documents

The following current files belong unambiguously to `docs/v2/`:

```text
ADR-0003-STORY-NARRATIVE-PRODUCTION-ARCHITECTURE.md
V2_ACCEPTANCE_SCENARIOS.md
V2_ARCHITECTURE_INDEX.md
V2_CONTEXT_ENGINE.md
V2_DOMAIN_MODEL.md
V2_IMPLEMENTATION_ROADMAP.md
V2_MIGRATION_PLAN.md
V2_REPOSITORY_STRUCTURE.md
V2_RUNTIME_CONTRACTS.md
V2_SCALABILITY_AND_STORAGE.md
V2_TEMPORAL_AND_EPISTEMIC.md
V2_UI_AND_VERTICAL_SLICE.md
STUDIO_DESIGN_SYSTEM.md
```

After the move, filenames inside `docs/v2/` need not repeat `V2_` everywhere. The directory already supplies that namespace.

Suggested mapping:

```text
docs/V2_ARCHITECTURE_INDEX.md
  -> docs/v2/README.md

docs/ADR-0003-...
  -> docs/v2/architecture/ADR-0003-...

docs/V2_DOMAIN_MODEL.md
  -> docs/v2/architecture/DOMAIN_MODEL.md

docs/V2_RUNTIME_CONTRACTS.md
  -> docs/v2/architecture/RUNTIME_CONTRACTS.md

docs/V2_TEMPORAL_AND_EPISTEMIC.md
  -> docs/v2/architecture/TEMPORAL_AND_EPISTEMIC.md

docs/V2_CONTEXT_ENGINE.md
  -> docs/v2/architecture/CONTEXT_ENGINE.md

docs/V2_SCALABILITY_AND_STORAGE.md
  -> docs/v2/architecture/SCALABILITY_AND_STORAGE.md

docs/V2_REPOSITORY_STRUCTURE.md
  -> docs/v2/architecture/REPOSITORY_STRUCTURE.md

docs/V2_UI_AND_VERTICAL_SLICE.md
  -> docs/v2/product/UI_AND_VERTICAL_SLICE.md

docs/STUDIO_DESIGN_SYSTEM.md
  -> docs/v2/product/DESIGN_SYSTEM.md

docs/V2_MIGRATION_PLAN.md
  -> docs/v2/migration/MIGRATION_PLAN.md

docs/V2_IMPLEMENTATION_ROADMAP.md
  -> docs/v2/roadmap/IMPLEMENTATION_ROADMAP.md

docs/V2_ACCEPTANCE_SCENARIOS.md
  -> docs/v2/acceptance/ACCEPTANCE_SCENARIOS.md
```

## Legacy architecture

`ADR-0001` and `ADR-0002` describe important decisions in the existing Light Delay system. They remain required migration evidence but are not Studio/V2 architecture.

Target:

```text
docs/legacy/architecture/
  ADR-0001-MULTI-SCRIPT-CONTINUITIES.md
  ADR-0002-MASTER-NARRATIVE-AUTHORITY.md
```

The V2 ADR may cite them by historical role.

Other old application-specific setup/format/migration documents should be classified individually. A document is moved to `legacy/` only when it is no longer authoritative for the active Light Delay creative project or current repository operation.

## Active Light Delay documentation

Most of today's docs are not Studio documentation at all. They describe the film itself and its production.

Examples:

### Canon / narrative

```text
CANON_DECISIONS.md
CUIDADOS_NARRATIVOS.md
ESCALETA.md
GUIA_ESCALETA.md
PENDING_AUTHOR_NOTES.md
light-delay-*.md
```

Target: `projects/light-delay/docs/canon/` or `narrative/`.

### Production

Today's `docs/production/*`, plus production plans, synchronization, title/credits, TTS/music/generation guidance.

Target: `projects/light-delay/docs/production/`.

### Technical world/film references

Today's:
- `docs/technical/CELESTIAL_ARDOR.md`;
- `docs/technical/PROXIMA_STATION.md`;
- animation/external-scene documents;
- project-specific technical constraints.

Target: `projects/light-delay/docs/technical/`.

### Reports and audits

Examples:
- relevance reports;
- gravity audit;
- fidelity audit;
- migration/reconciliation reports.

Target: `projects/light-delay/docs/reports/` while still useful, then `archive/` when historical only.

### WIP

Today's `docs/wip/` is overwhelmingly Light Delay project material.

Target: `projects/light-delay/docs/wip/`.

WIP status must not imply low authority automatically; some WIP documents are current working sources. Authority remains explicit in project metadata/docs.

## Repository-wide docs

A small set may remain outside both Studio and Light Delay.

Examples:
- contributor onboarding;
- repository-wide agent instructions beyond `AGENTS.md`;
- generic build/release conventions;
- cross-project schema/tooling operation.

These belong under `docs/repository/`.

If a document only exists because of the legacy Light Delay app, it belongs with that app or under `docs/legacy/`, not `docs/repository/`.

## Archive versus legacy

Use the terms deliberately:

- **legacy** — belongs to the previous application/architecture generation and may still be needed for compatibility/migration;
- **archive** — no longer active authority, retained for provenance/history;
- **WIP** — unfinished/current working material; not necessarily obsolete;
- **project** — belongs to Light Delay creative/production work regardless of age;
- **V2** — belongs to Studio's forward product/architecture.

A file may move from project WIP -> project current -> project archive without ever becoming "legacy".

## Documentation authority

Each major documentation root gets a README describing authority.

### `docs/README.md`

Answers:
- where Studio architecture lives;
- where repository docs live;
- where legacy architecture lives;
- where Light Delay project docs live.

### `docs/v2/README.md`

Replaces the current V2 architecture index and remains the canonical restart document.

It records:
- accepted decisions;
- implementation status;
- provisional areas;
- active milestone;
- links to architecture/product/migration/acceptance docs.

### `docs/legacy/README.md`

States explicitly that files here are retained for compatibility, provenance or migration and must not silently override V2 decisions.

### `projects/light-delay/docs/README.md`

Defines current Light Delay document authority, including which canon/narrative sources supersede which historical ones.

## Link migration

Documentation relocation must not leave a repository full of dead links.

Before moving:
1. inventory Markdown links and path strings;
2. classify source documents;
3. create target READMEs/indexes;
4. move in coherent batches;
5. update references in code, docs, AGENTS and scripts;
6. search for old paths;
7. run relevant validation.

Git history remains the provenance mechanism; duplicate compatibility copies should not be kept indefinitely merely to preserve old Markdown links.

## Execution order

Perform after Milestone 0 baseline:

### D1 — Create taxonomy and move V2 docs

This is low risk and immediately clarifies forward architecture.

### D2 — Move legacy architecture/history

Move ADR-0001/0002 and clearly superseded app/migration documents after checking references.

### D3 — Move active Light Delay docs with project-root cleanup

Coordinate with creation of `projects/light-delay/` so project docs move once, directly to their intended home.

### D4 — Classify reports/WIP/archive

Do not mass-archive merely based on filename or age. Use actual authority/current workflow.

### D5 — Remove transitional aliases and repair indexes

Search repository for old paths and update all links/references.

## Result

The intended distinction should be visually obvious:

```text
docs/v2/                       Studio: where we're going
docs/repository/               monorepo: how the repository operates
docs/legacy/                   old application: what we still need to remember

projects/light-delay/docs/     film: the creative/production project itself
```

This prevents Studio architecture, legacy implementation history and Light Delay's evolving film documentation from competing for authority in one flat directory.
