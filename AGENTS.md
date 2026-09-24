# Instructions for agents

English is the documentation and agent-policy source of truth. A Spanish translation may follow in a later pass (`AGENTS.es.md` if present is not authoritative when it diverges).

## Objective

Gradually transform the static Light Delay package into a data-driven SvelteKit application without losing canon, content, images, or behavior.

## Working set (current)

Read this file at the start of every session. For a short day-one map, also open [`docs/AGENT_ONBOARDING.md`](docs/AGENT_ONBOARDING.md).

- **Narrative source of truth:** `data/outlines/light-delay-master-narrative.json` (WIP but authoritative). Generated Markdown under `docs/wip/` is not hand-edited SoT.
- **Production WIP:** `script:light-delay-festival-master` and its outline `outline:light-delay-festival-master` (authorized derivative; check `data/editorial-lifecycle.json`).
- **Trailer WIP:** `script:light-delay-trailer-master` (derived from Festival-master frames/audio).
- **`canonicalScriptId` / `script:light-delay-master-narrative`:** empty route stub. It does **not** mean there is no active screenplay.
- **Ignore as current product:** deprecated `main-short`, `festival`, `trailer`, and `long`. Never confuse `light-delay-festival` with `light-delay-festival-master`.
- **Incomplete master** blocks *new unauthorized* cuts. It does **not** freeze work on derivatives already authorized in `data/editorial-lifecycle.json`.
- **English authorship** for story copy and docs; edit `en` first; `es` may stay `needs_revision`. UI chrome = Paraglide (`apps/light-delay/messages/*.json`), not story overlays.
- **Causal facts SoT:** master outline `facts` / `knowledgeEvents` / `actionRequirements` (`master:fact-*`). Cut ledgers are not live authorship. Pipeline: [`docs/production/CAUSAL_AND_MEANING_PIPELINE.md`](docs/production/CAUSAL_AND_MEANING_PIPELINE.md).

Before changing narrative or structure, also read `README.md`, the master outline, `data/editorial-lifecycle.json`, `docs/ADR-0002-MASTER-NARRATIVE-AUTHORITY.md`, and `docs/PROJECT_STATUS.md`. `docs/CANON_DECISIONS.md` is previous continuity only. For cut script/animatic work, read `docs/GUIA_ESCALETA.md` (contract: `docs/ESCALETA.md`).

## Layer map (higher layers win)

```text
Master outline (canon / causal story)
  → Derived outline (cut escaleta; sourceRefs + derivation)
    → ScriptFile (acts / scenes / beats / cues)
      → Shots + Takes (storyboard: description, composition, still)
        → Take.generation.prompt (compiled / disposable)
          → assets.json + static/assets/ (+ production plans / manifest)
```

Authority flows **downward**. Do not silently “correct” a lower layer so it diverges from the outline (or master) that owns the fact. Storyboard is not a separate schema: it is `Shot` + `Take` + still asset + plan artifact. Blueprint Markdown under `docs/wip/` is staging, not SoT.

### Upward-propagation gate (two approvals)

When a needed edit at a lower layer conflicts with authoritative truth above it:

1. **Stop and notify** the author/developer: state the conflict, the lower-layer change requested, and which higher artifact(s) currently own the fact.
2. **Do not apply** the conflicting lower-layer edit until they **approve** that direction.
3. After that approval, **analyze repercussions** up the chain (outline beats, cues, shots, prompts, assets, trailer omissions, lifecycle notes) and present a concrete upward-edit proposal.
4. **Propagate upward only after a second explicit approval** of that proposal. Then edit from the highest affected authoritative layer downward so derivatives stay consistent.
5. Compatible lower-only fixes (typos, timing slack, prompt scrub that does not change story facts) do **not** need this gate.

### Durable production rules

- Edit **`Shot.description`** (EN first) before or together with `Take.generation.prompt`. Prompt-only edits get overwritten by compilers. See `docs/production/DIALOGUE_AND_PROMPT_LESSONS.md`.
- Still / image prompts are **stateless**: the model sees only prompt text + attached refs — not scene `setting.continuity` or other shots. Restate gravity and any other load-bearing visual state in each prompt (or on an attached sheet). “Cue it once” is audience-sequence craft, not a still-prompt omission. See `DIALOGUE_AND_PROMPT_LESSONS.md` §2c. For consecutive same-location coverage, prefer a `ScriptFile.visualStretches[]` combined sheet + deterministic panel split (`docs/production/VISUAL_STRETCH_PIPELINE.md`) instead of N independent gens that re-infer blocking.
- **Still reference audit** (which location/character/prop sheets to attach): `docs/production/AGENT_GENERATION_BRIEF.md` §4.1 — one load-bearing location for the camera’s space; escalate thin/ambiguous staging up the layer map; do not inherit stretch leftovers or attach sheets “just in case.” A location-hierarchy schema is planned for more deterministic spatial decisions.
- Still prompts: **no spoken dialogue**; English-only diegetic UI. Check with `npm run scrub:still-prompts:check`. Video jobs (e.g. Seedance 2.5) **may** include cue dialogue + voice-sample audio refs — do not apply the still no-dialogue scrub there — but must **never** request music/score/BGM or dramatic instrumentation (soundtrack is mixed in post). See `SEEDANCE_PROMPTING.md` §6.
- **Do not regenerate existing images** unless explicitly instructed. Mark debt with `imageStatus` (`needs_regeneration` + reason). Marking stale ≠ permission to regenerate.
- Generation scheduling holds use **`Take.productionGate`** (`deferred` / `blocked`), not `imageStatus`. Plan/stretch `generationGate` is derived only — edit the script take, then rebuild plans. Skip gated takes/jobs until the author clears the gate (`docs/JSON_FORMAT.md`, `docs/production/AGENT_GENERATION_BRIEF.md`). Holds are **medium-scoped**: `medium: "video"` (e.g. `video_deferred_external_reference`) defers only Seedance/video jobs and never makes a still/keyframe job non-runnable; absent/`all` blocks both.
- Visual stretch still refs (`referenceAssetIds`) stay complete for keyframe generation; Seedance extras use optional `videoReferenceAssetIds` (see `docs/production/VISUAL_STRETCH_PIPELINE.md`).
- After Seedance, **register the clip** or Movie mode keeps the still. Stretch jobs: `npm run register:visual-stretch-video` writes plan `outputs.assetId` (rebuilds re-apply it from `assets.json` `metadata.stretchJobId`). Singleton shot packages (not stretch jobs): land the MP4, add a `kind: video` asset, set the selected take’s `videoAssetId`. An unregistered file on disk does not play. See `docs/production/AGENT_GENERATION_BRIEF.md` §8.5.
- Generation depth: `docs/production/AGENT_GENERATION_BRIEF.md`.

## Language and documentary authority

English is the source of truth for documentation and current narrative authorship in the repository. Spanish is a translation that may be completed in a later pass.

The current **narrative** source of truth is `data/outlines/light-delay-master-narrative.json`. It is WIP authority: it may keep changing, but it already prevails over prior outlines, scripts, animatics, and canon documents. Its Markdown ES/EN exports are generated derivatives and are not hand-edited.

- When a document exists in several languages, **edit the English copy first**. Other languages are translations or adaptations, not parallel authorship sources.
- If **there is no English copy**, the existing document keeps its role and provenance until an explicit English source is created; do not translate or replace it mechanically.
- After any material English change, update translations in a later pass or mark their review status visibly. An outdated translation does not block English authorship.
- On conflict between equivalent current variants, English prevails. Narrative authority and lifecycle status prevail over language: an obsolete or deprecated English document does not replace the master.
- Story copy in JSON lives **in the same file** as per-language maps or, for dialogue/text, as `content.variants.<lang>`. Edit `en` first; `es` may be marked `needs_revision`. UI chrome stays in Paraglide (`apps/light-delay/messages/*.json`). Do not reintroduce overlays.
- Naming when pairs exist: `name.md` or `name.en.md` for English; `name.es.md` for Spanish. Historical unpaired files are not renamed only to force the convention.
- `AGENTS.md` is the only canonical place for agent instructions (any model or platform). Other tool guides must **reference** this file, not duplicate rules.

## Mandatory rules

- Read this file in full at the start of every work session in the repository.
- Do **not** create or extend a *new unauthorized* derived script/animatic/cut while the master escaleta remains incomplete. Check `data/editorial-lifecycle.json` for already-authorized WIP derivatives (Festival-master, trailer-master). After the master is complete (or with explicit editorial authorization for a new cut), create a derived escaleta in `data/outlines/` first, declare provenance, and verify that the script/animatic respects it; procedure in `docs/GUIA_ESCALETA.md`.
- Treat `legacy-site/` as obsolete archive retained only for rescue and provenance. Do not use it as authority or as a current regression baseline.
- Do not rewrite canon to solve an implementation difficulty.
- Do not invent missing data. Mark uncertainties and pending decisions.
- Avoid forced exposition: do not treat the audience as unable to infer. Information is revealed naturally (thought in action, decision under pressure, visible consequence), not with dialogue or monologue that explains the world “for the viewer.” Example: when Zao decides where to aim the laser and why she chooses the ship’s future position, her own reasoning and choice expose the why; nobody needs to tell the audience.
- When writing or translating master-cast dialogue, consult the language variant in `data/voice-profiles.json`: origin prosody combines with learned variety, register, relationship, and dramatic pressure. Keep these differences subtle and natural; do not represent accents through phonetic spelling, grammar errors, or mechanical localisms. Edit English first and translate Spanish in a later pass.
- The `story` layer of each escaleta must tell a continuous, causally complete story with closed details. `detail` steps, notes, or external knowledge cannot repair a cause, subject, or consequence missing from the main summary.
- Preserve each cut’s deliberate omissions in all public data, including translations, metadata, IDs, references, and inherited descriptions. In particular, the trailer does not identify the culprit or confirm the send, receipt, or death of Zao; it may only imply that she discovered a responsible person and was left in danger.
- Do not confuse forced exposition with dramatic reasoning: the escaleta must keep causes, discarded alternatives, motivations, assumptions (even wrong ones), and crucial consequences. A character may think in action or speak to themselves when that reveals their own decision or depth, not to lecture the audience.
- Do not replace a more recent narrative version with an earlier one without verifying provenance and asking for confirmation when unsure. If a necessary cause is missing, stop the blocked narrative work and consult. Only with explicit authorization may you proceed while leaving a note/TODO of unresolved cause or alternative proposals. Conflicting lower-layer “fixes” follow the **upward-propagation gate** above.
- Keep stable IDs for scenes and takes; do not use the array index as persistent identity. Script-unit IDs are namespaced by script (`main:…`, `festival:…`, `festival-master:…`); project entities use global ids (`character:voss`).
- Separate narrative data, presentation, and editorial state.
- Textual script and animatic must render from a single data source **per script/cut** (`ScriptFile`); multiple cuts are registered in `project.scripts` (see `docs/ADR-0001-MULTI-SCRIPT-CONTINUITIES.md`).
- `project.narrativeAuthority` identifies the WIP master escaleta and its stub `ScriptFile`. `canonicalScriptId` temporarily points at that stub for main routes; it does not imply a finished derived screenplay exists there.
- Scripts, outlines, and animatics of main-short, festival, trailer, and long belong to the previous continuity: they are deprecated/obsolete and kept only to rescue dialogue, staging, provenance, or compatible assets. Do not update them as if they were current products or derive new canon from them.
- All dependency classification and deletion candidates are recorded in `data/editorial-lifecycle.json`. Absence from the master escaleta does not prove obsolescence: the uncertain stays `review_required`, and nothing is deleted until all declared gates are met.
- Animatic, edit overlay, and routes are scoped by `scriptId`.
- Subtitles must be derived from each take’s dialogue, not kept as an unvalidated independent copy.
- Preserve fullscreen playback, play/pause/stop, navigation, timeline, detail panel, and return to edit while keeping position.
- Do not regenerate existing images unless explicitly instructed.
- Update `CHANGELOG.md` and `docs/PROJECT_STATUS.md` after material changes.
- Respect **Language and documentary authority** when editing or creating documentation.

## Planned architecture

- Workspace orchestration at root; deployable SvelteKit apps in `apps/studio` and `apps/light-delay`.
- Shared Studio domain/runtime contracts in `packages/v2-core`, independent of Svelte.
- `apps/light-delay/src/lib/components/`: documentary and animatic components.
- `apps/light-delay/src/lib/data/`: JSON load and validation.
- `apps/light-delay/src/lib/types/`: TypeScript contracts derived or synced with schemas.
- `data/`: canonical JSON and schemas readable by other tools.
- `static/assets/`: public media (migrated from `legacy-site/assets/` where applicable).

Do not move assets to `static/` without updating and verifying all references.

## Minimum validation (archive integrity + product)

- The archived short script must keep 17 story scenes plus title/credit cards, and its deprecated animatic **128** takes (124 story + deferred title + 3 credits). This count is an archive integrity check, not a requirement for future master derivatives. The 100 legacy PNGs are retained resources, not the take count of current authority.
- All image paths must exist.
- Total duration must be recalculated from takes.
- The site must work without obligatory external JavaScript or remote resources.
- Main pages and Movie mode should have regression tests.
