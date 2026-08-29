# ADR-0001: Multiple scripts, continuities and character-function reassignment

- **Status:** Accepted
- **Date:** 2026-08-25
- **Decision owners:** Light Delay project maintainers
- **Related documents:**
  - `docs/JSON_FORMAT.md`
  - `docs/JSON_FORMAT_I18N_ADDENDUM.md`
  - `docs/MIGRATION_PLAN.md`
  - `docs/SVELTEKIT_SETUP.md`

## Context

Light Delay will contain more than one screenplay or editorial product:

- the approximately 30-minute canonical short;
- a longer version;
- a festival version of approximately 4:30–5:00;
- trailers and teasers;
- possible alternate versions or continuities.

These versions may:

- reorder, remove or rewrite scenes;
- contain different acts, beats, cues and shots;
- reuse or replace images, audio and other assets;
- use only a subset of the main cast;
- introduce alternate appearances or biographies;
- merge the dramatic functions of several characters into one;
- split one character's function between several characters;
- reuse dialogue or shots while changing their speaker, context or duration;
- have independent animatic timing and selected takes;
- support different dialogue and subtitle languages.

The condensed version already demonstrates this requirement. Its cast was reduced from the fourteen names recovered from the older feature documents to six principal characters: Zao, Voss, Harlan, Elin, Sorell and Cael. Wei's communications function was merged into Cael. Other long-version characters were removed, reduced to mentions or reserved for the longer version. This is not adequately described as a visual character variant or as a runtime filter over the longer script.

The data model therefore needs to represent complete independent scripts while preserving shared project entities and traceable relationships between versions.

## Decision

### 1. Treat each script or cut as an independent `ScriptFile`

Every substantially distinct screenplay, trailer, teaser or editorial cut will have its own JSON file:

```text
data/
├── project.json
├── scripts/
│   ├── light-delay-main-short.json
│   ├── light-delay-long.json
│   ├── light-delay-festival.json
│   └── light-delay-trailer.json
├── characters.json
├── locations.json
├── objects.json
├── vehicles.json
├── factions.json
├── assets.json
└── voice-profiles.json
```

Each `ScriptFile` contains its own acts, scenes, beats, cues, shots and takes.

#### Why this is needed

- A trailer is an authored editorial work, not simply the main script with hidden scenes.
- A festival version may combine or rewrite material rather than only remove it.
- Shot order, timing and selected takes must be editable without changing another version.
- Independent files are understandable, portable and easy to validate.
- Supplied alternate scripts can be imported without first expressing them as patches against the canonical script.

#### Consequence

Text shared between scripts may initially be duplicated. Cross-script provenance will record where it came from, but it will not create live inheritance.

### 2. Add a project-level script registry

`project.json` will list available scripts and identify the canonical one:

```ts
export type ScriptId = string;
export type ContinuityId = string;

export type ScriptKind =
  | "main_short"
  | "long_version"
  | "festival_cut"
  | "trailer"
  | "teaser"
  | "proof_of_concept"
  | "alternate";

export interface ScriptRegistryEntry {
  id: ScriptId;
  continuityId: ContinuityId;

  label: string;
  kind: ScriptKind;

  status: "draft" | "review" | "locked" | "deprecated";
  targetDurationMs?: number;

  lineage?: ScriptLineage;
}

export interface Project {
  id: ProjectId;

  canonicalScriptId: ScriptId;
  scripts: ScriptRegistryEntry[];
  continuities: Continuity[];

  languages: ProjectLanguages;
}
```

#### Why this is needed

- The application needs to list and resolve scripts without hard-coded imports.
- `/script` and `/animatic` need a deterministic default.
- The UI needs labels, kinds, status and target duration before loading a complete script.
- Validation must know which files are expected and which script is canonical.

### 3. Distinguish a script's identity from its revision

The script ID identifies the continuing editorial product. Its `version` identifies a revision:

```ts
export interface ScriptMetadata {
  id: ScriptId;
  projectId: ProjectId;
  continuityId: ContinuityId;

  title: string;
  version: string;
  status: "draft" | "review" | "locked" | "deprecated";
  kind: ScriptKind;

  targetDurationMs?: number;
  lineage?: ScriptLineage;

  actIds: ActId[];
}
```

#### Why this is needed

- A dialogue revision of the festival cut is still the festival cut.
- Git already records file history; a new script ID should not be created for every edit.
- Stable script IDs keep routes, editor state and references valid across revisions.

### 4. Record script lineage without live inheritance

Derived products will declare their relationship to a source script:

```ts
export interface ScriptLineage {
  sourceScriptId: ScriptId;

  relationship:
    | "cut"
    | "trailer"
    | "teaser"
    | "adaptation"
    | "rewrite"
    | "alternate_continuity";

  sourceVersion?: string;
  notes?: string;
}
```

#### Why this is needed

- It distinguishes a trailer from a rewrite or alternate continuity.
- It preserves the origin of supplied or condensed scripts.
- It supports later comparison and change reports.
- It avoids assuming that all derived scripts must remain synchronized.

#### Why lineage is not inheritance

Changing the canonical script must not silently alter a locked trailer or festival submission. A derived script is copied/adapted content with provenance, not a runtime view over mutable source arrays.

### 5. Require globally unique script-owned IDs

Acts, scenes, beats, cues, shots and takes will be prefixed or otherwise namespaced by script:

```text
main:scene-01
main:cue-12-004
festival:scene-01
festival:shot-03-02
trailer:take-04-01-a
```

Project entities and assets retain globally unique IDs independent of scripts:

```text
character:voss
location:proxima
vehicle:celestial-ardor
asset:animatic-main-01-03
```

#### Why this is needed

- Cross-script source references cannot be ambiguous.
- Comparison and merge tools can load several scripts simultaneously.
- Editor overlays, caches and route state can use one ID without requiring compound lookup conventions everywhere.
- A future relational database can use the same IDs directly.

### 6. Keep project entities and assets in shared catalogs

Characters, locations, objects, vehicles, factions, voice profiles and assets remain project-level records. Scripts reference them by ID.

#### Why this is needed

- The same Voss, Proxima or Celestial Ardor should not be duplicated for every cut.
- A festival version naturally uses a subset of the shared cast.
- Trailers can reuse existing stills, audio and takes through the same asset IDs.
- Provenance belongs to an asset regardless of which scripts use it.

#### Script-specific assets

An asset does not require a separate ownership model merely because only one script uses it. It is effectively script-specific when it is referenced only by that script.

Asset usage should normally be derived from references. An optional advisory field may be used for planning:

```ts
export interface AssetUsageHint {
  scriptIds?: ScriptId[];
  continuityIds?: ContinuityId[];
  entityVariantIds?: EntityVariantId[];
}
```

This hint must not become access control or the authoritative usage graph.

### 7. Add continuities

Scripts will identify the narrative continuity they belong to:

```ts
export interface Continuity {
  id: ContinuityId;
  name: string;
  description?: string;
  derivedFromContinuityId?: ContinuityId;
}
```

#### Why this is needed

- A longer or alternate version may change biography, chronology, technology or events rather than merely shorten them.
- Scripts in the same continuity can safely share narrative entities.
- Alternate-continuity relationships remain explicit instead of being inferred from filenames.

#### Initial use

Cuts and trailers derived from the current film should initially share its continuity. A new continuity should be introduced only when narrative facts actually diverge.

### 8. Add entity variants for alternate realizations

Visual, biographical or production variations of the same entity will use `EntityVariant`:

```ts
export type EntityVariantId = string;

export interface EntityVariant {
  id: EntityVariantId;
  entity: EntityRef;

  continuityId?: ContinuityId;
  scriptIds?: ScriptId[];

  label: string;

  roleOverride?: string;
  traitsOverride?: string[];
  biographyOverride?: string;
  descriptionOverride?: string;
  appearanceOverride?: string;
  costumeOverride?: string;

  referenceAssetIds: AssetId[];
  notes?: Note[];
}
```

A script may choose default variants:

```ts
export interface ScriptEntityVariantSelections {
  character?: Record<CharacterId, EntityVariantId>;
  location?: Record<LocationId, EntityVariantId>;
  object?: Record<ObjectId, EntityVariantId>;
  vehicle?: Record<VehicleId, EntityVariantId>;
  faction?: Record<FactionId, EntityVariantId>;
}
```

Shots, scenes or takes may override a script default when necessary.

#### Why this is needed

- A younger Voss is usually still Voss, not a wholly unrelated character.
- A festival-specific costume or redesigned Celestial Ardor should not overwrite the canonical reference assets.
- Variant selections allow one script to use different model sheets without duplicating the full entity record.

#### When to create a new entity instead

Create a new entity ID when the alternate is narratively another person, place or object. Use a variant when identity is preserved but its realization or continuity-specific details differ.

### 9. Add narrative functions and character-function assignments

Character merging is represented as reassignment of dramatic functions, not as an entity variant:

```ts
export type NarrativeFunctionId = string;

export interface NarrativeFunction {
  id: NarrativeFunctionId;
  label: string;
  description?: string;
}

export interface CharacterFunctionAssignment {
  functionId: NarrativeFunctionId;

  /** Character performing this function in this script. */
  characterId: CharacterId;

  /** Characters performing it in the source version, when applicable. */
  sourceCharacterIds?: CharacterId[];

  relationship:
    | "unchanged"
    | "merged"
    | "reassigned"
    | "split"
    | "new";

  notes?: string;
}
```

Extend script metadata:

```ts
export interface ScriptMetadata {
  // Existing fields...

  declaredEntityRefs?: EntityRef[];
  entityVariantSelections?: ScriptEntityVariantSelections;
  characterFunctionAssignments?: CharacterFunctionAssignment[];
}
```

#### Why this is needed

The condensed version merges Wei's communications role into Cael. Cael is not a visual variant of Wei, and Wei should remain available to the longer script. The shorter script needs to state that Cael performs both piloting and communications while Wei is absent.

Example:

```json
{
  "characterFunctionAssignments": [
    {
      "functionId": "function:piloting",
      "characterId": "character:cael",
      "relationship": "unchanged"
    },
    {
      "functionId": "function:communications",
      "characterId": "character:cael",
      "sourceCharacterIds": ["character:wei"],
      "relationship": "merged",
      "notes": "Wei is removed; Cael performs both piloting and communications."
    }
  ]
}
```

The same model supports:

- several long-version characters merged into one short-version character;
- one source character split into several characters;
- dialogue or investigative function reassigned to an existing character;
- a newly created function or character;
- removal of a character while preserving their plot contribution.

### 10. Add source references to adapted units

Scenes, beats, cues and shots may point to the source material from which they were adapted:

```ts
export interface ScriptSourceReference {
  kind?: "script";
  scriptId: ScriptId;
  sceneId?: SceneId;
  beatId?: BeatId;
  cueId?: CueId;
  shotId?: ShotId;
}

export interface DocumentSourceReference {
  kind: "document";
  documentId: string;
  anchor?: string;
}

export type SourceReference =
  | ScriptSourceReference
  | DocumentSourceReference;

export interface SourceTraceable {
  sourceRefs?: SourceReference[];
}
```

`Scene`, `Beat`, `CueBase` and `Shot` should extend or include `SourceTraceable`.

Example:

```json
{
  "id": "festival:cue-02-006",
  "speakerId": "character:cael",
  "sourceRefs": [
    {
      "scriptId": "script:light-delay-long",
      "cueId": "long:cue-wei-014"
    }
  ]
}
```

#### Why this is needed

- A rewritten Cael line can be traced to dialogue originally spoken by Wei.
- Editors can compare derived and source scripts.
- A festival beat may combine several source beats.
- Reused shots can retain editorial provenance even when their order changes.
- Recovered treatments can cite a registered document even when no older structured script exists.
- Provenance enables reports without imposing live synchronization.

### 11. Keep declared rosters optional and advisory

Actual entity use can be derived from scenes, cues, shots and takes. `declaredEntityRefs` is optional production metadata.

#### Why this is needed

- A production roster may contain characters planned but not yet written.
- A trailer may deliberately declare a restricted cast.
- Validation can compare declared and actual usage.

#### Why it is not the source of truth for use

Maintaining a mandatory roster alongside actual references would duplicate state and eventually drift. Actual graph references determine what the script uses.

### 12. Scope application routes by script ID

Use script IDs in route paths:

```text
/script
/script/[scriptId]
/animatic
/animatic/[scriptId]
/animatic/[scriptId]/player
/compare/[scriptId]?against=<ScriptId>
```

`/script` and `/animatic` resolve or redirect to `canonicalScriptId`.

Language and presentation choices remain query parameters:

```text
/animatic/script:light-delay-festival/player?audio=es&sub=en
```

The route-safe serialized form of an ID may use hyphens instead of colons if required. The application must provide one reversible encoding function rather than manipulating IDs ad hoc.

#### Why this is needed

- An animatic belongs to a specific script/cut.
- Links remain shareable and reloadable.
- Editor persistence can be scoped by route identity.
- Query parameters remain available for language, subtitles and view settings rather than core content identity.

### 13. Update repositories and selectors

Replace the single hard-coded script loader with:

```ts
export interface ScriptRepository {
  listScripts(): ScriptRegistryEntry[];
  getCanonicalScript(): ScriptFile;
  getScript(scriptId: ScriptId): ScriptFile;
}
```

All script-owned selectors receive a `ScriptFile` or `scriptId`:

```ts
getScene(scriptId, sceneId)
getSceneShots(scriptId, sceneId)
getDialogueVariant(scriptId, cueId, language)
getEffectiveDuration(scriptId)
```

Project entity and asset selectors remain global:

```ts
getEntity(entityRef)
getEntityVariant(entityVariantId)
getAsset(assetId)
```

#### Why this is needed

- Loading one script must not depend on global mutable "current script" state.
- Comparison tools may load two scripts at once.
- Animatic edits must not leak between cuts.

### 14. Scope editable state by script

The persistence key or stored document must include `scriptId`:

```ts
export interface ScriptEditOverlay {
  scriptId: ScriptId;
  scriptVersion: string;

  shotDurations: Record<ShotId, number>;
  selectedTakes: Record<ShotId, TakeId>;
}
```

#### Why this is needed

- Festival duration changes must not modify the canonical short.
- Selected trailer takes may differ from the main animatic.
- Version information makes stale local edits detectable.

### 15. Preserve multilingual dialogue per script

The multilingual dialogue model in `JSON_FORMAT_I18N_ADDENDUM.md` remains attached to each dialogue cue inside each script.

#### Why this is needed

- A trailer may translate or abbreviate a line differently from the film.
- Translation status and audio assets are editorial properties of that exact cue.
- The same character may use different voice assets in different continuities or cuts.

Shared voice profiles remain project-level; cue variants select the appropriate voice/audio.

### 16. Compare explicit profiles, not inferred adaptations

Each script may declare a versioned `comparisonProfile`. Its canon claims and major-event coverage use IDs from `data/comparison-taxonomy.json`. The comparison route is `/compare/[scriptId]?against=<ScriptId>`.

Version 1 compares:

- explicit canon values and their editorial status;
- declared coverage of major events, with scene links when available;
- declared and actual cast participation;
- selected entity variants and narrative-function assignments.

Missing data is reported as unspecified. Version 1 does not infer character merges/splits, dialogue inheritance or the character who inherited a removed line. Conflicting `established` values on foundational dimensions inside one continuity produce a warning rather than silently creating a new continuity.

## Validation requirements

### Project registry

- `canonicalScriptId` resolves to exactly one registered script.
- Every registry entry resolves to one script file.
- Script file ID, registry ID and filename mapping agree.
- Every script references a valid continuity.
- Lineage references an existing script and does not form a cycle.

### Script graph

- Script-owned IDs are globally unique across loaded scripts.
- All acts, scenes, beats, cues, shots and takes belong to the containing script.
- All internal foreign keys resolve.
- Script duration is derived from that script's shots only.

### Entities and variants

- Every entity reference resolves in its shared catalog.
- Every selected entity variant belongs to the referenced entity.
- Variant continuity/script restrictions are compatible with the selecting script.
- Every asset referenced by a variant exists.

### Character-function assignments

- Every narrative function resolves.
- Assigned and source characters resolve.
- A script may assign several functions to one character.
- A split relationship may produce several assignments for the same source function.
- Validation reports declared characters that never appear and used characters absent from an advisory declared roster.

### Source references

- Every referenced source script and unit resolves.
- Source references never copy content automatically.
- Deleted/deprecated source units produce warnings rather than silently removing derived content.

### Assets and animatics

- Every take asset exists.
- A selected take belongs to the same shot.
- Reused assets may be referenced from several scripts.
- Editor overlays are scoped to the correct script and version.

### Languages

- Dialogue source language exists in every localized cue.
- Requested language fallback is reported to the UI.
- Language-specific cue timing stays within the shot unless explicitly marked unresolved.
- Voice profiles and audio assets are compatible with the selected language.

## Complete representation of the condensed version

With these decisions, the data model can fully describe the previously discussed condensed version:

- a six-character principal cast: Zao, Voss, Harlan, Elin, Sorell and Cael;
- Wei's communications function merged into Cael;
- Keene, Vega, Wei, Hassan, Carvalho, Okoye, Volkov and Tanaka omitted, reduced to mentions or retained only in the long version;
- a simplified Sorell subplot;
- Sorell accused through planted evidence;
- Elin handling the digital containment from a protected terminal;
- Voss and Sorell handling the physical intervention;
- Sorell supplying the clean read-only greeting;
- its own acts, 17 scenes, beats, cues, 124 shots/takes and approximately 30-minute target;
- reused or unique images and other assets;
- continuity-specific entity variants;
- multilingual dialogue, subtitles and voice assets;
- derivation and unit-level provenance from a longer script.

No runtime filtering of the long script is required to describe this version.

## Alternatives considered

### Store all versions as acts in one script

Rejected because unrelated cuts would share ordering, timing and edit state. A trailer is not an extra act of the film.

### Implement a runtime "duration mode"

Rejected because hiding scenes cannot express rewritten dialogue, merged characters, reordered beats or independent shots.

### Duplicate all entity catalogs per script

Rejected because shared characters, locations and assets would drift. Differences are represented through continuities and variants.

### Represent merged characters as entity variants

Rejected because Cael performing Wei's communications function does not make Cael a variant of Wei. Narrative-function reassignment models the actual change.

### Use only `derivedFromScriptId`

Rejected as insufficient because it does not distinguish a trailer, cut, rewrite or alternate continuity and provides no unit-level provenance.

### Use local IDs scoped only by loaded file

Rejected because cross-script comparison, provenance and future database storage would require compound identifiers throughout the application.

### Make derived scripts inherit live source units

Deferred/rejected for the initial architecture because edits to the source could unpredictably change locked deliverables. Provenance is valuable; hidden synchronization is dangerous.

### Split screenplay, editorial cut and production plan immediately

Deferred. Keeping acts, cues, shots and takes in one `ScriptFile` is simpler for the current project. If one screenplay later needs several truly independent edits, the model can evolve into:

```text
StoryScript    → acts/scenes/beats/cues
EditorialCut   → ordered shots/cue placements
ProductionPlan → takes/assets/generation state
```

Existing stable IDs make that future split possible without adopting it prematurely.

## Consequences

### Positive

- Supports full, short, festival, trailer, teaser and alternate-continuity versions.
- Preserves shared entity and asset catalogs.
- Describes character merging without corrupting character identity.
- Allows independent timing, takes and multilingual dialogue for every cut.
- Enables comparison and provenance tooling later.
- Maps cleanly to Svelte routes and a future relational database.

### Costs

- Requires a registry and multi-file loader.
- Requires globally unique ID migration.
- Some adapted content will exist in more than one script file.
- Entity variants and character-function assignments add concepts editors must understand.
- Cross-script validation becomes necessary.

### Risks

- Scripts may drift from their source after derivation.
- Overuse of continuities or variants could make the catalog hard to understand.
- Function assignments could become unnecessary bureaucracy if added to trivial cuts.
- Registry metadata and script metadata can diverge without validation.

### Mitigations

- Treat lineage and source references as explicit provenance.
- Create a new continuity only for real narrative divergence.
- Add function assignments only when a character's responsibility changes materially.
- Validate registry/script agreement in CI.
- Provide comparison reports instead of automatic synchronization.

## Implementation plan

### Phase 1 — Types and registry

1. Add `ScriptId`, `ScriptKind`, `ScriptRegistryEntry`, `ScriptLineage` and `Continuity`.
2. Add `scripts[]`, `continuities[]` and `canonicalScriptId` to `project.json`.
3. Move the current script to `data/scripts/light-delay-main-short.json`.
4. Change the repository to `listScripts()`, `getCanonicalScript()` and `getScript(id)`.
5. Add cross-file registry validation.

### Phase 2 — IDs and routing

1. Namespace all current act, scene, beat, cue, shot and take IDs.
2. Add route-safe ID encode/decode helpers.
3. Implement `/script/[scriptId]`.
4. Implement `/animatic/[scriptId]` and `/animatic/[scriptId]/player`.
5. Redirect canonical shorthand routes.
6. Scope editor persistence by script ID and version.

### Phase 3 — Continuities and variants

1. Add the initial Light Delay continuity.
2. Add `EntityVariant` storage and selectors.
3. Add script-level default variant selections.
4. Update entity and asset views to show variant scope.
5. Add compatibility validation.

### Phase 4 — Character functions and provenance

1. Add `NarrativeFunction` catalog.
2. Add `CharacterFunctionAssignment` to script metadata.
3. Add `sourceRefs` to scenes, beats, cues and shots.
4. Encode the Cael/Wei merge in the condensed script.
5. Add source/derived comparison selectors and validation.

### Phase 5 — Additional scripts

1. Import the longer script as an independent `ScriptFile`.
2. Import or author the festival version.
3. Add trailer/teaser files only when their text or editorial structure exists.
4. Register each product and assign its lineage and continuity.
5. Validate assets, cast, dialogue languages and effective duration per script.

## Acceptance criteria

This ADR is implemented when:

- the project can register and load at least two independent scripts;
- canonical shorthand routes resolve correctly;
- script routes and edit state are scoped by `scriptId`;
- shared entities and assets resolve across scripts;
- script-specific variants and assets can be selected;
- the Cael/Wei functional merge is representable and displayed correctly;
- source references can trace a derived cue or shot;
- multilingual dialogue and subtitle selection work independently per script;
- validation catches broken registry, lineage, entity, asset and source references;
- editing the festival cut cannot modify the main short's timing or selected takes.

## Open questions

These questions do not block the initial implementation:

1. Whether narrative functions should live in `project.json` or `narrative-functions.json` after the catalog grows.
2. Whether script registry file paths should be explicit or resolved by a filename convention/build-time import map.
3. Whether entity variants should remain in their entity files or move to a shared `entity-variants.json`.
4. Whether a later editor needs first-class comparison and cherry-pick operations between scripts.
5. When a screenplay with several edits justifies separating `StoryScript`, `EditorialCut` and `ProductionPlan`.
