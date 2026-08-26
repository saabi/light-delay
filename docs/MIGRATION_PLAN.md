# Migration plan: legacy HTML to SvelteKit

Status: initial architecture proposal. This document defines migration boundaries, routes and reusable components. It does not yet schedule the complete content rewrite or resolve outstanding story issues.

## 1. Outcomes

The SvelteKit application must:

- use structured JSON as the canonical content source;
- render the screenplay and animatic from the same acts, scenes, beats and cues;
- distinguish editorial shots from alternative production takes;
- support dialogue audio and subtitles in multiple languages;
- centralize characters, locations, objects, vehicles, factions and assets;
- serve migrated image (and later audio/video) files from `static/assets/` rather than from `legacy-site/`;
- share layouts, document primitives, entity components and media components across routes;
- preserve all useful behavior from `legacy-site/`;
- allow content to be expanded without embedding new data in Svelte components;
- remain usable as a read-only static project even before editing/storage features are added.

## 2. Architectural rules

### One content graph, several projections

The screenplay, shot breakdown, animatic editor and movie player are different projections of one graph:

```text
Act -> Scene -> Beat -> Cue
              \-> Shot -> Take -> Asset
```

- Beats and cues describe narrative order and meaning.
- Shots describe editorial coverage and timing.
- Takes describe candidate generated, filmed or rendered realizations of a shot.
- Assets describe files and provenance.
- Entity records describe characters, locations, objects, vehicles and factions.

Dialogue must not be duplicated independently in the screenplay and animatic. Shots reference dialogue cues through cue placements.

### IDs are durable

Every act, scene, beat, cue, shot, take, entity and asset has a stable string ID. Array position controls display order but is never identity.

### Migration before redesign

The first goal is behavioral and content parity with `legacy-site/`, not a visual redesign. Style unification can happen while components are extracted, but narrative editing and schema migration should remain distinguishable in Git history.

### Derived values are not duplicated

The following should be computed:

- total duration from shot durations;
- scene duration from its shots;
- dialogue density from dialogue cue placements;
- character presence from scene/shot references;
- subtitle tracks from localized dialogue cues;
- asset usage from take and entity references.

Target durations may remain authored metadata, but effective durations must be derived.

### Public media files live under `static/`

Image assets currently under `legacy-site/assets/` must be migrated into `static/assets/` so SvelteKit can serve them as ordinary public files.

- Canonical on-disk root: `static/assets/`.
- Public URL root: `/assets/` (SvelteKit serves `static/` at the site root).
- Preserve a readable mirror of the legacy layout unless a documented mapping requires renaming:

```text
static/assets/
|-- animatic/frames/...
|-- art-bible/...
|-- characters/...
|-- locations/...
|-- props/...
|-- vehicles/...
`-- (future audio/video as needed)
```

- JSON `Asset.path` values must point at the public URL path (for example `/assets/animatic/frames/scene-01/shot-01.png`), not at `legacy-site/...`.
- Do not leave the application depending on `legacy-site/assets/` once migration of a given asset class is complete.
- Avoid long-lived duplication: after paths and references validate, prefer a move (or a short-lived copy with an explicit cleanup step) so Git LFS storage does not permanently double.
- Keep Git LFS tracking for PNG/JPEG/WebP/video as already defined in `.gitattributes`.
- Do not regenerate images during the move. Binary content must stay byte-identical unless an explicit production task says otherwise.
- `legacy-site/` may retain copies only as a temporary regression reference until parity review; removing those duplicates is a separate, documented cleanup step.

This aligns with `AGENTS.md`: assets move to `static/` only after references are updated and verified.

## 3. Route plan

### Public/project routes

| Route | Purpose | Primary reusable view |
| --- | --- | --- |
| `/` | Project dashboard and document index | `ProjectHome` |
| `/documents/[slug]` | Canon reports, production bible, technical notes, key moments and derived documents | `DocumentViewer` |
| `/script` | Canonical screenplay reader | `ScriptViewer` |
| `/script/[scriptId]` | Explicit script/version reader | `ScriptViewer` |
| `/animatic` | Shot breakdown and duration editor | `AnimaticEditor` |
| `/animatic/player` | Distraction-free/fullscreen movie playback | `AnimaticPlayer` |
| `/art` | Combined visual/art bible | `EntityGallery` + `AssetGallery` |
| `/entities/[kind]` | Filtered character/location/object/vehicle/faction index | `EntityGallery` |
| `/entities/[kind]/[id]` | Entity detail and referenced assets | `EntityDetail` |
| `/assets/[id]` | Asset preview, metadata and provenance | `AssetDetail` |

### Route decisions

- Use one generic `/documents/[slug]` route rather than a route/component per prose document.
- Keep `/script` specialized because screenplay semantics are structured, not generic rich text.
- Keep `/animatic/player` separate from the editor so it can have a clean URL, independent layout and fullscreen lifecycle.
- Use generic entity routes keyed by `kind` rather than parallel character/location/vehicle implementations.
- Language selection should use application state plus an optional URL parameter such as `?lang=es&sub=en`, not duplicated language-specific routes.
- Do not create routes for implementation concepts such as acts, beats or cues unless a later editing workflow demonstrates a need.

## 4. Suggested SvelteKit source structure

```text
src/
|-- lib/
|   |-- components/
|   |   |-- app/
|   |   |-- document/
|   |   |-- entities/
|   |   |-- script/
|   |   |-- animatic/
|   |   |-- media/
|   |   |-- controls/
|   |   `-- primitives/
|   |-- data/
|   |   |-- repositories/
|   |   |-- selectors/
|   |   |-- validation/
|   |   `-- loaders/
|   |-- state/
|   |-- types/
|   |-- utils/
|   `-- server/
|-- routes/
|   |-- +layout.svelte
|   |-- +page.svelte
|   |-- documents/[slug]/
|   |-- script/[[scriptId]]/
|   |-- animatic/
|   |   `-- player/
|   |-- art/
|   |-- entities/[kind]/[[id]]/
|   `-- assets/[id]/
`-- app.css

static/
|-- assets/
|   |-- animatic/
|   |-- art-bible/
|   |-- characters/
|   |-- locations/
|   |-- props/
|   `-- vehicles/
`-- robots.txt
```

The exact optional-parameter route syntax should be validated during implementation. Separate `[kind]` and `[kind]/[id]` directories are acceptable if clearer.

## 5. Component inventory

### Application shell

| Component | Responsibility | Reused by |
| --- | --- | --- |
| `AppShell` | Compact desktop header and persistent rail; mobile bottom bar and modal sheet; content frame and responsive offsets | All non-player routes |
| `ProjectNav` | Primary route navigation and script selector in the desktop rail or mobile sheet | All non-player routes |
| `DocumentRail` | Sticky title, metadata and generated table of contents | Documents, script, entity detail |
| `Breadcrumbs` | Hierarchical navigation | Documents, entities, assets |
| `PageHeader` | Eyebrow, title, lede and metadata pills | All content routes |
| `LanguageControls` | Audio language, subtitle language and fallback status | Script, animatic, player |
| `MetadataPills` | Compact metadata presentation | Headers, cards, assets |

`AppShell` should use slots/snippets for responsive navigation and main content instead of branching internally for every route. Its shell switches with a calibrated `em/ch` capacity query, while the immersive player remains outside all global chrome.

### Generic document primitives

| Component | Responsibility |
| --- | --- |
| `DocumentViewer` | Render a document from ordered block data |
| `DocumentSection` | Heading, anchor and nested blocks |
| `RichTextBlock` | Controlled paragraphs and inline emphasis |
| `Callout` | Note, warning, datum or canonical rule |
| `DataTable` | Accessible data table with overflow behavior |
| `TimelineBlock` | Chronology or ordered phases |
| `CardGrid` | Project index and document cards |
| `DefinitionList` | Technical/entity properties |
| `TableOfContents` | Derived from section IDs |

Do not create one-off components for each current HTML class. Consolidate them into a small semantic block vocabulary.

### Entity and art components

| Component | Responsibility |
| --- | --- |
| `EntityRef` | Linked compact reference to any entity kind |
| `EntityRefList` | Characters, locations, props or vehicles associated with content |
| `EntityCard` | Generic summary card |
| `EntityGallery` | Filtered list/grid by kind |
| `EntityDetail` | Shared detail layout with kind-specific property sections |
| `AssetThumbnail` | Image/audio/video preview with status |
| `AssetGallery` | Grouped visual assets |
| `AssetViewer` | Full image/video/audio inspection |
| `AssetMetadata` | Provenance, dimensions, model/provider and usage |

Prefer configuration or small kind-specific snippets over separate complete components such as `CharacterCard`, `LocationCard` and `VehicleCard` when their structure is the same.

### Script components

| Component | Responsibility | Also reused by |
| --- | --- | --- |
| `ScriptViewer` | Assemble acts and scenes | Script route |
| `ActSection` | Act boundary and summary | Animatic navigation |
| `SceneSection` | Scene heading, setting, cast and beats | Animatic editor |
| `BeatBlock` | Dramatic beat and ordered cues | Shot details |
| `CueRenderer` | Dispatch cue union by type | Script, animatic, player details |
| `ActionCueView` | Action description | Script, shot details |
| `DialogueCueView` | Speaker, localized line and delivery | Script, subtitles, shot details |
| `SoundCueView` | Diegetic/non-diegetic sound direction | Script, shot details |
| `MusicCueView` | Music operation and track reference | Script, shot details |
| `TransitionCueView` | Editorial transition | Script, animatic |
| `SceneHeading` | INT/EXT, location, time and story time | Script, animatic |
| `ScreenplayLegend` | Shot/cue abbreviations | Script, animatic |

`CueRenderer` is the main reuse boundary: adding a cue type should require one renderer and one registered case, not changes across every route.

### Animatic editor components

| Component | Responsibility |
| --- | --- |
| `AnimaticEditor` | Editor orchestration and totals |
| `AnimaticDashboard` | Effective duration, target duration and progress |
| `SceneShotList` | Group shots under scene/beat headings |
| `ShotCard` | Selected take, framing, cues, audio and duration |
| `ShotMedia` | Resolve and render selected take asset |
| `ShotComposition` | Frame size, angle, lens and movement |
| `CuePlacementList` | Cues covered by a shot and their offsets |
| `DurationInput` | Accessible duration editing |
| `TakeSelector` | Candidate/selected take switching |
| `ContinuityWarnings` | Missing entities/assets, timing overlap and untranslated cues |

### Player components

| Component | Responsibility | Shared with editor |
| --- | --- | --- |
| `AnimaticPlayer` | Playback state and shot advancement | No |
| `PlayerStage` | Selected take image/video and overlays | `ShotMedia` |
| `SubtitleOverlay` | Resolve subtitle language and cue placement | `DialogueCueView` selectors |
| `PlayerControls` | Play/pause/stop, previous/next and fullscreen | Generic control primitives |
| `TimelineScrubber` | Seek across derived total duration | `AnimaticDashboard` timing utilities |
| `ShotDetailsDrawer` | Current beat, shot, camera, cues and audio | `ShotCard` subcomponents |
| `PlaybackClock` | Absolute/total time formatting | Duration utilities |

The player must preserve current legacy behavior: play/pause, stop, previous/next, scrubber, subtitles, shot counter, elapsed/total time, collapsible details, fullscreen and returning to the editor at the same shot/time.

### Shared control primitives

- `Button`
- `IconButton`
- `Select`
- `Range`
- `NumberField`
- `Disclosure`
- `Tabs`
- `Dialog`
- `Tooltip`
- `StatusBadge`

Build only those needed by migrated routes. They should be accessible semantic wrappers, not an internal design-system project.

## 6. Data layer

### Repositories

Use small read-only repositories initially:

```ts
interface ProjectRepository {
  getProject(): Project;
  getScript(id: string): ScriptFile;
  getDocument(slug: string): ProjectDocument;
  getEntity(ref: EntityRef): Entity | undefined;
  getAsset(id: AssetId): Asset | undefined;
}
```

Suggested modules:

```text
src/lib/data/repositories/project.ts
src/lib/data/repositories/script.ts
src/lib/data/repositories/entities.ts
src/lib/data/repositories/assets.ts
```

The UI should not search raw arrays or construct asset paths directly. Route loads call repositories; components receive resolved models or IDs plus resolver functions.

### Asset file migration

Treat binary migration as an explicit workstream, not an incidental copy:

1. Inventory every file under `legacy-site/assets/` (animatic frames, character/location/vehicle/prop sheets, art-bible assets, manifests that only describe files).
2. Assign stable `AssetId` values and map each legacy path to a `static/assets/...` destination and `/assets/...` public URL.
3. Write or update `data/assets.json` (and related manifests) so every image reference uses the new public path.
4. Copy or move files into `static/assets/`, confirming Git LFS still attributes them as `filter: lfs`.
5. Validate that every JSON path exists on disk and that every legacy HTML image URL has a corresponding migrated asset (or an explicit exception).
6. Point Svelte routes and repositories only at `/assets/...`.
7. After parity, remove duplicate binaries from `legacy-site/assets/` only when the regression reference no longer needs them -- or keep `legacy-site/` fully intact until final retirement, accepting temporary duplication until that cleanup.

Never hard-code `legacy-site/assets/` inside Svelte components or loaders after the asset phase for that tree is marked complete.

### Selectors

Pure selectors should handle graph traversal and derived values:

- `getActScenes(actId)`
- `getSceneBeats(sceneId)`
- `getSceneShots(sceneId)`
- `getShotSelectedTake(shotId)`
- `getShotCues(shotId)`
- `getEffectiveDuration(scope)`
- `getDialogueVariant(cueId, language)`
- `getSubtitleSegments(shotId, language)`
- `getEntityAssets(entityRef)`
- `getAssetUsage(assetId)`
- `getDialogueDensity(sceneId)`

Selectors must be framework-independent and unit tested.

### Validation

Validate all JSON at application startup in development and during CI/build. Required checks include:

- unique IDs;
- valid foreign keys;
- valid ordering within parents;
- exactly one selected take where required;
- existing asset paths;
- non-negative durations and cue offsets;
- cue placements that do not exceed shot duration unless explicitly allowed;
- supported language tags;
- source-language dialogue variant present;
- no missing subtitle/audio references marked as approved.

TypeScript types alone do not validate JSON at runtime. The migration plan should later choose one schema authority -- JSON Schema or a runtime TypeScript schema library -- rather than maintaining several independent definitions manually.

## 7. State and persistence

### State modules

Use focused Svelte 5 state modules, for example:

```text
src/lib/state/language.svelte.ts
src/lib/state/animatic-editor.svelte.ts
src/lib/state/player.svelte.ts
src/lib/state/preferences.svelte.ts
```

Keep canonical loaded data immutable in the first migration. Store edits as an overlay keyed by ID:

```ts
interface AnimaticEdits {
  shotDurations: Record<ShotId, number>;
  selectedTakes: Record<ShotId, TakeId>;
}
```

This preserves the legacy `localStorage` behavior without mutating imported JSON. Add import/export or server persistence later behind an interface.

### Language state

Maintain separate settings:

- `interfaceLanguage`
- `dialogueLanguage`
- `subtitleLanguage | null`
- fallback language from project metadata

Changing subtitle language must not change selected dialogue audio unless explicitly linked by the user.

## 8. Styling reuse

Create global tokens once in `src/app.css`:

- background/panel/text/muted/line colors;
- cyan/gold/red/green semantic accents;
- content widths;
- typography families and scales;
- spacing, radius and shadow scales;
- responsive breakpoints;

Components own their structural styles, while tokens and document typography remain shared. Avoid copying the entire legacy `<style>` block into every route.

Preserve:

- a compact sticky desktop header with persistent rail, plus a thumb-reachable mobile bottom bar and keyboard-accessible modal sheet;
- typography-relative `em/ch` shell thresholds instead of a fixed pixel breakpoint;
- responsive single-column layouts without horizontal page overflow;
- an immersive landscape player and a portrait flow ordered frame, shot details, then persistent controls;
- print-friendly screenplay/document views;
- strong focus states and keyboard controls;
- reduced-motion behavior for player transitions.

## 9. Migration phases

### Phase 0 -- Baseline and inventory

- Keep `legacy-site/` intact.
- Capture route screenshots and behavior checks.
- Inventory all pages, sections, entities, assets and embedded animatic data.
- Inventory every binary under `legacy-site/assets/` and draft the `legacy path -> static/assets/...` / `/assets/...` map.
- Record current counts: 17 scenes, 100 shots and 100 animatic frames.

### Phase 1 -- Types, multilingual extension and validation

- Incorporate `docs/JSON_FORMAT.md` and the multilingual addendum.
- Select schema authority and runtime validation.
- Create minimal fixture JSON that already uses `/assets/...` paths.
- Implement repositories and selectors with tests.

### Phase 2 -- Application shell and generic documents

- Implement tokens, `AppShell`, navigation, page header and TOC.
- Define the generic document block schema.
- Migrate one prose document as a vertical slice.
- Migrate the remaining prose documents only after the block vocabulary proves sufficient.

### Phase 3 -- Entities, art and assets

- Convert characters, locations, objects, vehicles, factions and manifests.
- Move entity/art reference images from `legacy-site/assets/{characters,locations,props,vehicles,art-bible}/` into the matching `static/assets/` trees.
- Update asset records and entity `referenceAssetIds` to public `/assets/...` paths.
- Implement generic entity routes and asset viewers that resolve only through the asset repository.
- Verify every reference image and asset backlink exists under `static/assets/`.

### Phase 4 -- Screenplay

- Convert acts, scenes, beats and cues.
- Render the screenplay from JSON.
- Add language selection and missing-translation indicators.
- Compare dialogue/action order against the legacy script.

### Phase 5 -- Shots, takes and animatic editor

- Convert the 100 legacy shots and images.
- Move all animatic frames from `legacy-site/assets/animatic/frames/` into `static/assets/animatic/frames/`.
- Distinguish existing shot images as selected takes whose `imageAssetId` resolves under `/assets/animatic/...`.
- Implement duration editing and derived totals.
- Add cue coverage and warnings for shots that should be split.
- Confirm the editor no longer loads frames from `legacy-site/`.

### Phase 6 -- Animatic player

- Implement playback from shot timing.
- Render localized subtitles from dialogue cues.
- Support independent dialogue and subtitle languages.
- Match all legacy player controls and restoration behavior.
- Confirm player media also resolves exclusively from `static/assets/`.

### Phase 7 -- Content development and editorial tools

- Expand underdeveloped dialogue and explanatory beats.
- Split compound legacy shots.
- Add missing reaction shots and cue coverage.
- Add dialogue-density, silence and pacing reports.
- Add JSON export/import and provenance editing.
- After parity review, optionally delete duplicate migrated binaries from `legacy-site/assets/` (or retire `legacy-site/` entirely) without regenerating images.

Story development begins here, after the data model and baseline renderers can expose changes consistently.

## 10. Reuse rules

- Routes compose domain components; they do not contain bespoke render logic.
- Entity kinds share cards, galleries and detail shells.
- All cue display passes through `CueRenderer`.
- Script and animatic share `SceneHeading`, `BeatBlock`, cue renderers and entity references.
- Editor and player share media resolution, timing utilities, subtitles and shot-detail components.
- Prose documents share a block renderer rather than generated HTML strings.
- Asset paths resolve through the asset repository to `/assets/...` under `static/assets/`, never string concatenation in components and never `legacy-site/assets/` after migration of that tree.
- Language fallback resolves through one localization module.

## 11. Initial acceptance criteria

The initial migration is successful when:

- every current index destination has an equivalent Svelte route;
- the canonical screenplay is rendered solely from structured data;
- the editor and player use the same shots, cues and takes;
- all 100 existing frames and entity/art reference images live under `static/assets/` and resolve through asset IDs and `/assets/...` URLs;
- no migrated route depends on `legacy-site/assets/` for media;
- dialogue/subtitle languages can be chosen independently;
- existing playback and duration-editing behavior is preserved;
- the application reports missing references and translations;
- no narrative fact exists only inside a Svelte component;
- `legacy-site/` can remain as a read-only regression reference until final parity review.
