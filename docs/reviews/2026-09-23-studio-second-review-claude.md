# Studio: independent second review (and review of the Astra review)

**Repository:** `saabi/light-delay`
**Review date:** 23 September 2026
**Primary snapshot:** `architecture/v2-domain-model` at `97bd77f` (the Astra report commit; code identical to `1b21883`)
**Comparison snapshot:** `master` at `c2105fc`
**Reviewed report:** `docs/reviews/2026-09-23-studio-architecture-review.md` (Astra, 616 lines)
**Scope:** read-only. Nothing was pushed, committed, or changed in the repository or on any server. All execution happened in a disposable clone. A temporary local edit to `project.inlang/settings.json` in that clone (explained in §2.4) was reverted, and the clone's working tree was left clean.

Evidence labels used below:

- **[verified]**: I executed it and observed the result.
- **[read]**: established by reading code or documents at the cited location.
- **[inferred]**: a reasoned consequence, not observed.

---

## 1. Executive assessment

The direction is sound. The implementation is a thin proof. And two things matter more than anything in Astra's top-six list:

1. **The branch currently breaks the protected festival build. [verified]** On `architecture/v2-domain-model`, `vite build` of the legacy app fails during prerender, both with and without the Pages `BASE_PATH`. The cause is the disposable `/v2/write` prototype (`ff24788`), which links to six routes that don't exist. `master` builds cleanly in the same environment. No CI job has caught this. The Studio staging workflow runs `check:legacy` (type-check) but never `build:legacy`. The Pages PR job fails earlier, at data validation. Astra treated festival compatibility as *unproven*. It is actually *broken*, and merging PR #2 as-is would take down the next festival deploy once the unrelated data failure is fixed.

2. **M1 applies revision history to the wrong kind of state. [read + verified]** The domain design asks for `getWorldState(at)` and `findRoute(actor, from, to, at)` (`docs/V2_UI_AND_VERTICAL_SLICE.md` L247–249), and Light Delay's real gravity problem is per-scene (`docs/production/GRAVITY_AUDIT_FESTIVAL_MASTER.md` §1). Despite that, M1 models gravity as one timeless, project-global key and records each flip as an authoritative project revision. The UI calls these controls "Explore state", and the architecture index says they are "intentionally transient and must not become direct persistence writes" (`docs/V2_ARCHITECTURE_INDEX.md` L128). If this becomes the persistence contract, it merges three concepts: authoring changes, what-if exploration, and story-time state. The primitive the whole design depends on, *state that changes along story time*, is referenced (`stateTransitionIds`, `StateRef`) but defined nowhere.

Astra's report is careful and mostly accurate. I verified every execution-backed claim it makes. Where I differ:

- On **priority**: festival freeze and CI truth come first.
- On **mechanism**: for reconstructing history I prefer versioned aggregates to replay/upcasting, which is simpler and fixes the restore bug structurally.
- On **scope**: Astra reviewed each subsystem well, but missed several composition problems: the missing provisional tier (drafts, proposals, scenarios), project-global revisions used as pins and conflict scope, the unmapped legacy "continuity" concept, the long-lived branch against a very active `master`, and a festival build that depends on remote code.

Overall, the architecture is not over-engineered in its *documents*, since most of the heavy parts are explicitly deferred. The risk is **sequencing**: the next milestones as written harden M1's semantics (replay, persistence, context invalidation keyed to a global state map) before the document and story-time primitives exist. Fix the foundation's *concepts*, not just its bugs, before M2.

---

## 2. Repository and current-state reconstruction

### 2.1 Branches and ancestry [verified]

| Branch | Head | Relationship |
|---|---|---|
| `master` | `c2105fc` | Default. The festival Pages deploy source. **Very active: 330 commits in the last 30 days**, touching `static/assets` (1,940 file-changes), `src/lib` (598), `data/production` (230), `src/routes` (180), `package.json` (44). |
| `architecture/v2-domain-model` | `97bd77f` | 77 commits ahead of and 2 behind `master` (merge-base `d797d9c`). PR #2. It currently merges cleanly with `master` (`git merge-tree`). |
| `refactor/move-legacy-app` | `72728fb` | Strict ancestor of the architecture branch (18 behind, 0 ahead). **No relocation was ever committed.** |
| `deploy/github-pages-static`, `docs/proxima-ardor-design-reference` | — | Historical, merged into `master`. |

I agree with Astra's branch table.

### 2.2 What exists, classified

| Area | Evidence | Classification |
|---|---|---|
| `apps/studio` | 1 page (`+page.svelte`, 34 dense lines), `/health`, adapter-node | Implemented. The editor is decorative: `contenteditable` with no binding. "Saved" is static text (L20). Seven lens buttons and "Ask" do nothing. |
| `packages/v2-core` | `world.ts` (37 lines), `context.ts` (11), `studio.ts` (12), fixture (15), `history.ts` (343), 2 test files, 7 tests | Implemented, narrowly exercised. Source is TypeScript exported as `./src/index.ts` with extensionless imports. **It cannot be imported by plain Node [verified: `ERR_MODULE_NOT_FOUND ... src/world`]**, so importers, workers, and migration CLIs cannot reuse it today. |
| M1 revision engine | `history.ts` | Implemented but provisional. Semantic bugs confirmed below. |
| TypeBox contracts | `src/lib/v2/schema/schema.ts` (legacy app tree) | Proof only. Shape tests with names that promise semantics ("allows experienced order to run backward through world time" only runs `Value.Check` on two objects). |
| Context Engine | `src/lib/v2/context/context.ts` (interfaces) + `packages/v2-core/src/context.ts` (resolver) | Two diverging contracts. The resolver's provenance is illustrative, not real. |
| Temporal/epistemic | Docs + TypeBox shapes | Documented contract only. No projector. `StateTransition` undefined. |
| Media Plane / Agent Runtime | `docs/V2_MEDIA_AND_AGENT_RUNTIME.md` (`dc76b26`) | Documented contract only. |
| PostgreSQL | None in code | Planned. Staging DB provisioning cannot be verified from the repo. |
| Staging deploy | `.github/workflows/studio-staging.yml`, `tools/deploy/*` | Implemented and exercised. Live `/health` reports `1b21883` [verified]. |
| Legacy production system | ~116 scripts, ~40 `report:*` validators, OTIO exporter, playback selectors, provider ledgers, 696-asset catalog, **1,276 Git LFS media objects** | Active and load-bearing. This is where Light Delay's real workflow value lives. |

### 2.3 Where the design rationale lives in history

- **ADR-0001** (multi-script continuities) and the live `data/project.json` already implement three versioning concepts that V2 has not carried forward:
  - *continuities*, which are separate canon lines (`continuity:light-delay-primary` deprecated vs. `continuity:light-delay-master-wip`);
  - *derived cuts with lineage*, including a cut of a cut (`trailer-master` ← `festival-master` ← master narrative);
  - *per-document revision pins*: `festival-master` pins the master outline at `sourceOutlineRevision: 19` (`data/project.json` L150) while the outline is now at r24, and `validate-data.mjs` L1028–1039 warns about exactly that drift.

  This is the most important historical evidence for the version-model discussion (§5, §6).
- The gravity audit (`docs/production/GRAVITY_AUDIT_FESTIVAL_MASTER.md`) documents the concrete failure that story-time state is meant to solve. Gravity lives in scene-scoped `data/production/contexts.json` plus boilerplate prompt prose. There were 2 wrong-gravity shots and 33 prompts with no gravity at all.
- `1271f3c` ("Give v2 routes an independent application shell") and `ff24788` ("Prototype low-intrusion v2 Write workspace") put V2 UI into the festival app. That is the origin of the build break.

### 2.4 Verification I ran

| Check | Result |
|---|---|
| `npm ci --ignore-scripts` | OK |
| `npm run test:v2-core` | 2 files, 7 tests pass. **The root Vite config loads paraglide, which tries to fetch plugins from jsdelivr.** |
| `npm run check:studio` / `build:studio` | 0 errors / success |
| `npm run check:legacy` without CDN access | **756 errors.** Paraglide compiled *zero messages* with only a warning [verified: `messages/_index.js` = 95 bytes]. |
| Legacy **build** on architecture branch (i18n plugins supplied locally from npm, same versions the CDN range resolves to) | **Fails:** `Error: 404 /v2/story (linked from /v2/write/)`. With `BASE_PATH=/light-delay`: `404 /v2/write does not begin with base`. |
| Legacy build on `master`, same environment, `BASE_PATH=/light-delay` | **Succeeds** (exit 0) |
| `node scripts/validate-schemas.mjs` on `master` | Fails: `run-festival-master-shot-plan-077-rev-1-video-1-ready-results.json must have required property 'inputDigest'` (matches Astra) |
| GitHub run pages 35559660827 (PR) and 35546460907 (`master` push) | Both "Failure". The PR run failed at step 5, consistent with data validation. |
| Core probes (restore, validation, routing, context) | See §3. All of Astra's code claims reproduce. Some are worse than stated. |
| Root `require()` of a symlinked `package.json` → `.cjs` | Executes the code [verified locally] |
| TypeBox `check()` on a JSON round-tripped schema | `Error: Unknown type` [verified] |

To get past the CDN restriction I temporarily pointed `project.inlang/settings.json` at npm-fetched copies of the same plugins, only in my clone, then restored it. The build-break conclusion does not depend on that substitution: the failure is in SvelteKit's prerender crawl, not in i18n.

---

## 3. Review of Astra's findings

Verdict key: **SS** strongly supported · **DC** directionally correct, overstated or understated · **MP** correct but mis-prioritized · **Q** questionable · **INC** incomplete; a deeper issue exists.

| # | Astra finding | Verdict | Evidence and my position |
|---|---|---|---|
| A1 | Restore can falsely claim success for newly added keys (§5 F1) | **SS / INC** | [verified] Restoring r1 after adding `newKey` + a gravity change returns `ok:true` with `newKey:"x"` still present. Restoring when only `newKey` differs returns "already the current projection". Agreed, it's a real bug. **But the root cause is the design: restore goes through a diff into an operation vocabulary that has no deletes.** Adding `UnsetWorldState` patches this instance; the next aggregate type hits the same class of bug. See §6 for a structural fix (restore = re-point to prior aggregate versions). |
| A2 | Root activation helper executes code via `require()` (D1) | **SS** | [read `tools/deploy/stage-activate.sh` L38; verified the Node behavior locally]. Critical, cheap to fix, and dependent on host configuration. Agreed without reservation. |
| A3 | Studio editor shows "Saved" for work it never saves (C3) | **SS** | [read `+page.svelte` L20]. Trivial to fix now. It becomes a trust problem the moment anyone types into staging. |
| A4 | Version semantics too weak to persist (§4.2) | **DC / INC** | Right direction, and "one user-facing version concept, pinned derivation" is a sensible default. **Astra missed that the legacy system already has this, with three orthogonal parts** (continuity, cut lineage, per-document pins; §2.3), and that the V2 docs dropped "continuity" entirely (`grep` across V2 docs: the word appears only as *entity continuity*). Also missed: pinning to a **project-global** revision gives false staleness (§6.3). |
| A5 | Two contract families are drifting (F4) | **SS**, and I would add one | Agreed. Add: v2-core is not importable from Node (§2.2). Fix both when consolidating. |
| A6 | Festival compatibility is not proven | **DC (understated)** | It isn't merely unproven. **It is broken on the branch** [verified]. Astra's "not evidence of a Studio build regression" is literally true (Studio builds), but the branch *does* contain a legacy build regression that neither Astra's checks nor CI exercised. This is the single most time-sensitive finding. |
| A7 | The vertical slice doesn't prove the product (§4.1) | **SS** | The roadmap reaches writing at M8 (`V2_IMPLEMENTATION_ROADMAP.md` L409–432), after RLS, importer, and Zao. Strongly agree that it has to move forward. |
| A8 | Document/semantic authority needs field-level rules (§4.3) | **SS / INC** | Agreed. What's missing is *where drafts and proposals live* (§4.1 below). |
| A9 | Temporal generality should be bounded (§4.4) | **SS / INC** | Agreed on bounding. Missed: M1's world state has **no temporal index at all**, and the state-over-story-time primitive is undefined (§4.2). |
| A10 | Spatial runtime name overpromises (§4.5) | **SS** | [read `world.ts` L37: `getEffectiveLocation` is a map lookup]. Agreed. |
| A11 | Finding severity mixes axes; acceptance and publication need different gates (§4.6) | **SS** | Strong live evidence: a ledger record missing `inputDigest` currently blocks deploying the *festival site* from `master`. That is a publication gate enforced by a data-completeness rule. |
| A12 | Three planes are responsibilities, not services; operational vs. creative mutations (§4.7) | **SS** | The best architectural point in the report. I'd generalize it into *authority tiers* (§4.1). |
| A13 | TypeScript treated as runtime validation (F2) | **SS (understated)** | [verified] A mismatched blocker is accepted, **and it survives clearing Harlan's occupancy**, leaving an orphaned Sorell blocker at a nonexistent node. So this is state corruption, not just weak validation. `NaN` persists as `null`. An unknown op throws `TypeError`. A client-supplied `principal:{kind:'system'}` and `timestamp:'1970…'` are accepted as-is (`history.ts` L302–303). |
| A14 | Snapshot retention is not replay verification; needs versioned reducer + upcasting (F3) | **Q (mechanism)** | The need is real: serialized history must survive a restart and a schema change. I disagree that **op replay with upcasters** should be the reconstruction mechanism. It carries the highest long-term cost of any option (§6.2). Keep replay as a *test oracle*, not the source of truth. |
| A15 | Schema round-trip fails (F5) | **SS** | [verified `Unknown type`]. The narrow strategy (trusted factories in-process, Ajv for anything transported) is right. |
| A16 | Context provenance is illustrative (F6) | **SS** | [read `context.ts` L6–8: cites `data/locations.json`, never reads it]. |
| A17 | Gravity test gives false confidence (F7) | **SS (understated)** | [verified] Worse than "could remain unchanged": both edges cost 1, Dijkstra keeps the first strictly-better candidate, and the around-rail edge is listed first, so **the route is identical in 1g and microgravity, every time.** The one control on staging that demonstrates M1 changes nothing visible except `r2`. |
| A18 | Source readability (F8) | **SS, low priority** | Core files are minifier-dense. Agreed: normal formatting during consolidation. |
| A19 | Media: role on binding, not blob; provider-only as unresolved representation (§6) | **SS** | Also: the doc defines `AssetBlob` as "one immutable byte representation **of that asset**" (`V2_MEDIA_AND_AGENT_RUNTIME.md` L34), which is 1:N and contradicts deduplication. It should be N:M through a binding. |
| A20 | Media risk table (checksums, dedup, DR, costs…) | **SS, mostly MP** | Correct content, but most of it is M4.5-time work. Astra missed the most useful migration fact: **Git LFS already stores Light Delay media content-addressed by SHA-256** (§9.2). |
| A21 | Export diverges from playback (§6) | **SS** | [read] `resolve-otio.mjs` never references stretch jobs; `animaticPlaybackSpans.ts` L63–72 plays them; per-shot snapping at L440–441. Agreed, and I'd move the "resolved edit" abstraction *earlier* than Astra does (§9.3). |
| A22 | Agent Runtime: boundary right; needs task/attempt identity, proposal acceptance, attribution split (§7) | **SS**, with one simplification | Agreed. I'd shrink four-way attribution to `principal` + `onBehalfOf` + `executionId` + `approvedBy`: the same information, fewer concepts. |
| A23 | Idempotency, atomic history+head+outbox, trusted attribution (§8) | **SS** | Agreed. Belongs to the M2 contract. |
| A24 | Keep project-wide optimistic concurrency until conflicts are observed (§8) | **Q** | The conflicts are predictable, not speculative: background agents, importers, and media registrations will advance the head while an author edits, so every autosave will conflict. Cheaper to design **read-set preconditions** now (§6.3) than to retrofit them. |
| A25 | R1/R2 early, R3/R4 later, project-path resolver (§9) | **SS / INC** | Agreed on the split. Missed: the *binding constraint* on reorganization is branch integration against a `master` with 598 `src/lib` file-changes in 30 days, plus the fact that `master` *is* the festival deploy source (§4.5). |
| A26 | Immutable-by-convention releases, missing rollback, service doc path, migrations packaging (D2–D4) | **SS** | Confirmed [read]. Add: rollback re-runs the old release's migration hook, and staging environment and branch trust (§12). |
| A27 | CI too tightly coupled to deploy (D5) | **SS / INC** | Add: **no job runs the legacy build on the branch** (that's how A6 got through), and the legacy build fetches floating remote code (§4.6). |
| A28 | Revised sequence: repair → consolidate+R1/R2 → M2+doc proof → M3 → PG+auth+outbox → agent → media | **DC** | Close to mine. Three differences, each justified in §18: (a) a festival freeze step before everything; (b) replace M1's global world state with a story-state primitive *before* context work; (c) minimal PostgreSQL immediately after the M2 contract, before M3, because the document slice needs durable drafts. |

Already resolved by newer work: nothing. `97bd77f` only adds the report, and every item above was reproduced at that head.

---

## 4. What Astra missed

These are mostly second-order problems: each subsystem looks reasonable alone, but they compose poorly.

### 4.1 There is no durable, non-authoritative tier

The architecture has two kinds of state:

- **authoritative**: ChangeSet → ProjectRevision;
- **derived**: projections, context, findings, indexes.

A filmmaking tool mostly deals in a third kind:

- **provisional but durable**: typed text not yet checkpointed, AI proposals awaiting review, `ImportProposal`s, what-if scenarios ("what if the ship were in microgravity here?"), rejected alternatives worth keeping, and generation jobs whose output isn't selected yet.

`ImportProposal` and "proposals" are named in eight places, but no document gives them storage, identity, lifecycle, or a relationship to revisions (grep over `docs/V2_*`). Without this tier, every provisional thing gets forced into one of the two existing boxes:

- It becomes a revision. Keystrokes, "Explore state" toggles, and agent drafts pile up as noise in canon history; staleness and context invalidation fire constantly; restore turns meaningless.
- It becomes transient. Work is lost on reload, and "Saved" is a lie.

M1 already shows the first failure mode: an explicitly exploratory control writes authoritative revisions.

**Direction:** define one small concept before M2, for example `Draft`/`Workspace` records. They are durable, attributable, and scoped (per user, per task, per scenario); they carry a `baseRevision`; they are *not* part of `ProjectRevision`; and a single *promote* command turns them into a ChangeSet. Proposals, import staging, agent output, text checkpoints, and scenarios are all instances. The UX falls out of this: "Saved" means the draft is durable, and "Committed/Accepted" means it's in canon. Most users only ever see "Saved".

### 4.2 Story-time state is the missing core primitive, and M1 contradicts it

Almost everything dynamic in the design varies along story time: gravity (thrust, coast, cutoff per scene), doors, occupancy, *aboard/hosted-by*, capabilities (a character who turns into a vehicle), wardrobe and injuries (`wardrobeStateRefs`), and knowledge. But every implemented or specified representation is timeless:

- `WorldSnapshot.state: Record<string, WorldValue>` (`world.ts` L2)
- `entityLocations: Record<string,string>`
- `Entity.capabilityIds: string[]` (`schema.ts` L35)

`StoryEvent.stateTransitionIds` refers to a `core:state-transition` that no schema or document defines. The domain model even lists `World → WorldState` and `Story → StateTransitions` as siblings (`V2_DOMAIN_MODEL.md` L18–24) without saying how they relate.

**Consequences if ignored:**

- M3 builds context invalidation around a global key map.
- M6's importer maps `contexts.json` (scene-scoped gravity) into a global value and loses information.
- Transformation and vehicle cases can only be expressed as edits to canon.
- The Context Engine can't answer its own acceptance question, "At this point in the story…".

**Direction (small):** `StateChange { subject, property, value, atEvent }`, resolved by `stateAt(storyPoint)` as "latest change at or before the point in fabula order, within the default history". Scenes and presentations map to story points. Do only that now. Loops, branches, and per-entity continuity ordering are later extensions of the *ordering* function, not new state machinery. This one primitive replaces `SetWorldState` as M1's demo, and it pays off immediately in production: a shot's generation context gets its gravity from story state instead of boilerplate prose. That fixes the documented audit failure.

### 4.3 Project-global revisions are being asked to do three jobs

A single ordered revision stream per project is a good **audit and order** mechanism. The design also uses it as:

- **concurrency scope**: stale `baseRevision` = conflict (`history.ts` L281–283); and
- **pin and staleness anchor**: derived versions and context keyed by project revision.

Both break at scale in ways the legacy repo already avoided. Legacy pins derived cuts to *per-document* revisions (r19 of the master outline). Under a project-global scheme, registering a thumbnail advances the head, and the festival cut shows as stale, and the author's autosave conflicts. See §6.3.

### 4.4 The legacy "continuity" concept has no V2 home

V2 has `WorldContext` (dream/simulation), `HistoryContext` (in-fiction timelines), and `NarrativeVersion` (cuts). Light Delay actually runs on **continuities**: alternative *authorial canons*. `data/project.json` keeps `continuity:light-delay-primary` ("predating the current master… retained for salvage and provenance") beside the authoritative `continuity:light-delay-master-wip`, each with its own scripts, and ADR-0001 is built around them. A continuity is neither an in-fiction timeline nor a cut. Without a mapping, M6's importer has to either flatten two canons into one world (corrupting facts) or abuse `HistoryContext` (which then makes the epistemic machinery think characters can cross between them). Decide this before the importer exists. See §19.

### 4.5 The festival protection policy guards the wrong door

`pages.yml` deploys on every push to `master`, and `master` receives production commits almost daily (330 in 30 days; 34 on 15 September alone). The judged site is whatever the last *successful* master run deployed. The latest master run failed, so nobody currently knows which revision judges see, as Astra noted in its Q9. The policy therefore constrains V2 work heavily (reorganization postponed, compatibility gates) while ordinary production work changes the protected artifact freely.

**Direction:** freeze the judged artifact. Tag the deployed revision, deploy Pages from that tag or a `festival` branch, and let `master` move. This one change:

- makes the protection real;
- lets production and V2 proceed;
- makes R1 safe to do on `master`; and
- turns "festival compatibility" into an easy check (the tag still builds) instead of a gate on every change.

### 4.6 The protected artifact is not reproducible: it runs floating remote code at build time

`project.inlang/settings.json` loads `https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@4/...` and `...m-function-matcher@2/...`. Those are major-version ranges, fetched and *executed* at every build. If they fail to load, paraglide silently compiles zero messages [verified]. Consequences:

- Rebuilding the festival tag later may produce a different site.
- A CDN outage or a compromised package changes or breaks the judged artifact.
- **Studio deploys are gated on this**, because the staging workflow runs `check:legacy`, and so is `test:v2-core`, because it runs under the root Vite config.

**Direction:** pin the plugins as npm devDependencies (or vendor them) and use local module paths. It takes minutes.

### 4.7 A long-lived branch against a very active `master`

The branch has 77 commits, rewrote `package.json` from tabs to 2-space indentation (`69e659c`) against a Prettier config with `useTabs: true`, and depends on paths `master` changes daily. It merges cleanly *today* only because `master`'s two newest commits don't touch those files. Reorganization done on the branch (moving `src/`) will conflict with `master`'s `src/lib` churn. **Reorganization timing is set by integration, not by M1/M2.** Integrate early (§18, Stage 0–1).

### 4.8 The first agent integration has nowhere to put its output

The roadmap's queue places the first Agent Runtime integration (M3.5) *before* PostgreSQL (M4) and the Media Plane (M4.5). A real agent produces proposals (the provisional tier from §4.1, which doesn't exist), consumes context tied to story points (§4.2, which doesn't exist), and for generation, produces media (M4.5). Astra correctly limits pre-PG agents to "disposable". I'd go further: **the first agent integration should be scoped explicitly as "text proposals into Drafts"**, and scheduled after Drafts exist.

### 4.9 Git is the current revision system, and a second one is coming without a cutover rule

Light Delay's authority today is Git-tracked JSON, edited by humans and coding agents under `AGENTS.md`, with Git as history. V2 introduces ChangeSet history. Once M6 imports Light Delay into Studio while `master` keeps changing the same JSON daily, there are two authorities. **Direction:** one-way projection (Git → Studio, Studio read-only for Light Delay) until an explicit, dated cutover. That's a human decision (§19).

### 4.10 Smaller composition issues

- **Staging trust.** Deploys trigger on the commit-message directive `[deploy:stage]` from the branch. Once coding agents push to that branch, they can deploy. Confirm that the GitHub `staging` environment restricts deployment branches and requires review. I could not verify environment rules.
- **Rollback path.** Rollback uses the activation helper (`V2_DEPLOYMENT_AND_ENVIRONMENTS.md` L304–310), and the helper runs *the older release's* `db:migrate:stage` (L38–46) before switching. Rollback shouldn't run migrations.
- **Pages PR checks pull all LFS media** (`pages.yml`: `lfs: true` on `pull_request`). With 1,276 LFS objects, every architecture push consumes LFS bandwidth. The V2 docs never mention this cost.

---

## 5. Domain-model assessment

**Layers (Canon/World → Fabula → Narrative → Cinematic → Production → Media).** Sound, and justified by real Light Delay failures (ADR-0003). The Story-vs-Production split is right: a shot must not be a beat's child, and legacy data (shots spanning beats, stretch videos spanning shots) proves it.

Where the implementation diverges:

1. **The implemented "World" is a navigation fixture with a global state map.** Nothing yet connects World to Fabula, so the layering is unexercised. The first connection should be `stateAt(storyPoint)` (§4.2), not more World features.
2. **Production is not version-scoped in the aggregate map** (`V2_DOMAIN_MODEL.md` L26–36 places `Production` beside `NarrativeVersions`). In legacy data, shots and takes are per-script (`script.shots`), and the trailer reuses frames from the festival cut. Production units need an owning version *or* an explicit sharing rule. Otherwise every production query needs a version filter that the model doesn't require.
3. **Roles vs. capabilities.** The dragon example has role `vehicle` and capabilities `carrier`, `rideable`. The role duplicates the capability. **Recommendation:** capabilities are the only behavioral primitive; roles are author-facing labels (suggested from capabilities, never consulted by rules). Both have to be *story-time state* (§4.2), or transformation and "ship becomes derelict habitat" require editing canon. With that, the unusual entities need no new machinery:
   - sentient ship = `agent` + `spatial-host` + `mobile`;
   - vehicle-as-location = `spatial-host` + `mobile`;
   - transforming character = a `StateChange` on its capability set.
4. **`components: Record<string, unknown>`** (`schema.ts` L36) is where the unstructured dumping ground starts. Accept only namespaced components with a registered schema; keep unknown ones as opaque, round-tripped blobs, but never *interpret* them. Don't add a component or profile registry UI.
5. **Identity.** The fixture uses `character:lian-sorell`, while the catalog has `character:sorell` (verified). As Astra says, don't let fixture IDs leak. The rule should be that **import preserves legacy IDs**.

**Duplication check:** `WorldContext`, `HistoryContext`, `NarrativeVersion`, and "continuity" are four scoping dimensions. Three are designed and one is missing (§4.4). None is redundant, but only *NarrativeVersion + continuity* are needed for Light Delay now. `WorldContext` and `HistoryContext` should stay schema-only (optional, defaulted) until a project needs them.

---

## 6. ChangeSet and revision assessment

### 6.1 What's right

Semantic operations instead of JSON Patch, restore-as-new-history, injected clock and IDs, frozen revisions, project-scoped optimistic concurrency as the *starting* model, and "a stale base or failed precondition appends nothing". Keep all of that.

### 6.2 Is event sourcing paying for itself? Not in its current form

The doc's reconstruction contract is "ops + deterministic projection", with snapshots only as acceleration (`V2_DOMAIN_MODEL.md` L487). Astra doubles down: versioned reducer, upcasters, replay tests. For a creative tool whose schema will change constantly over the next year, that means **every historical operation must stay executable forever**, through a growing chain of upcasters. That is the most expensive form of schema evolution there is, and nothing in Studio's requirements needs it:

- no temporal queries over op semantics;
- no need to re-derive state under changed business rules;
- audit needs *what changed and why*, not re-execution.

**A simpler architecture that preserves the invariant** ("attributable, ordered, immutable, reconstructible"):

```text
ChangeSet (immutable, ordered)          # who, why, when, ops (for intent/audit/merge)
  └─ writes AggregateVersion rows       # immutable copy-on-write of each touched aggregate
                                        # (aggregate = scene, entity, shot, state track, asset…)
Head = latest version per aggregate     # current state; indexes/projections derived
Reconstruct revision N = latest version of each aggregate with revision ≤ N
Restore(scope, N)      = new ChangeSet writing copies of those versions
```

- **Attributable / ordered / immutable:** unchanged.
- **Reconstructible:** by lookup, not replay. This is a well-known relational pattern and cheap in PostgreSQL.
- **Restore is correct by construction.** It copies versions, including absences (tombstone versions), so the F1 class of bug disappears. It is also naturally *scoped*: "restore this scene", which is what users mean.
- **Schema evolution** migrates stored aggregate versions, or upgrades them lazily on read, like ordinary DB migrations. Old ops only need to stay *displayable*.
- **Ops remain first-class** for intent, rebase/commutation checks, and agent proposals.
- **Replay becomes a test oracle.** In CI, replay ops over the prior versions and assert equality with the stored versions. Divergence means an op or reducer bug. You get the verification value without making replay load-bearing.

Cost: storage per touched aggregate per commit. Picking aggregates at the right granularity (a scene or document block, not "the screenplay") keeps it small. Documents coalesce through Drafts (§4.1), so keystrokes never reach history.

### 6.3 Scope of concurrency and pins

- **Keep the global sequence for ordering.** Also record `lastModifiedRevision` per aggregate (free under §6.2).
- **Conflict rule:** a command declares its read-set as `expectedVersions: {aggregateId: revision}`. It conflicts only if one of those moved. `baseRevision` stays informational. The machinery for this already half-exists as `preconditions`. It removes the predictable author/agent/importer conflicts (A24) without CRDTs or auto-rebase.
- **Pins:** derived versions pin *source aggregates' versions*, as legacy does with `sourceOutlineRevision: 19`, not the project head. Staleness means one of the pinned aggregates moved, which is exactly what `validate-data.mjs` L1028–1039 computes today.

### 6.4 Other points in the contract

| Topic | Assessment |
|---|---|
| Revision identity | `WorldSnapshot.revision` (a domain object) *and* `ProjectRevision.number` (store metadata) both exist and must be kept equal by `commit()` (L295). The fixture helper `withHarlanBlocking` bumps the snapshot revision *outside* history (`light-delay-fixture.ts`). Domain state must not carry store revision numbers. Remove `revision` from `WorldSnapshot`. |
| Principal and timestamp | Caller-supplied and trusted [verified spoof]. Server-assigned; claimed values stored separately (Astra agrees). |
| Atomicity | In-memory commit is atomic by construction. Restore mutates two stored records after `commit()` returns (L333–339). With PG, one transaction must write the ChangeSet, versions, head, and outbox. |
| Validation timing | Structural (TypeBox) → authorization → semantic against the read-set → apply. Today, semantic validation is absent, and unknown ops crash. |
| Idempotency | Duplicate ID is rejected, but a retry can't recover the original result. Store `commandId → result`. |
| Partial failure | Not addressed. With §6.2 plus one transaction it's a non-issue for semantic data. Operational records (§8) are separate. |
| Naming: StoryVersion vs. application revision | Types don't collide yet (`ProjectRevision`, `ChangeSet` vs. docs-only `NarrativeVersion`). **Protect this with vocabulary rules:** never use "version" for application history in code or UI ("revision"/"history" only), and never use "revision" for cuts. UI terms: *Cut* (or *Version*) for products, *History* for revisions. |

**Verdict on M1:** a useful proof. Don't invest further in `SetWorldState` semantics (replay, upcasting, unset). Its operation vocabulary is superseded by §4.2. Keep its tests as regression checks on the conflict and immutability mechanics.

---

## 7. Temporal and epistemic assessment

The four-order separation (world time, causal, entity continuity, narrative) is correct and not speculative; Light Delay's recording and relay plot needs at least three of them. Whether it's genuinely composable is **unproven**, because nothing composes yet: the only code is shapes.

| Build now (next 2–3 milestones) | Build at the Zao slice | Defer until a project needs it |
|---|---|---|
| StoryEvent with a default fabula order key; scene/presentation → story-point mapping; `StateChange` + `stateAt(point)`; narrative order as presentation ordering | Artifact capture/playback; `learn`/`observe` epistemic events; audience-revealed set per version; "why does X know Y" explanations | `HistoryContext` semantics, fixed loops, cycle policies, belief revision (`doubt/reject/forget/revise`), confidence, unreliable memory, per-entity continuity ordering for time travel |

Two cautions:

- **A comparator must be able to say "undetermined".** Partial ordering is normal in authored stories (Astra §4.4 agrees). Don't force a total order onto events whose order the author hasn't decided.
- **"Epistemic operations" as a 10-value enum is the part closest to building a theorem prover.** Ship `learn` and `observe` with provenance. That covers mystery and revelation, which is what dialogue review needs. Add the rest only when a validator needs them.

---

## 8. Context and Integrity assessment

**Context Engine.** "Structural when we can, semantic when we must" is the right principle, and the scope in `V2_CONTEXT_ENGINE.md` is appropriate. Problems:

1. **Package identity is incomplete.** `ContextRequest` has `projectRevision` + anchor + task (`src/lib/v2/context/context.ts` L59–65), but no **version (cut), story point, perspective (character), or continuity**. Without those, "character-appropriate knowledge" (a roadmap M7 exit criterion) can't be expressed, and caches will serve one cut's context to another. Add a `ContextScope {revision, versionId, storyPoint, perspective?}` now, with defaults.
2. **Don't build invalidation first.** For M3, recompute on demand, keyed by `(scope, task, policy)`. Structural queries on one project are cheap. Add dependency tracking only after measuring. Here I'm more conservative than the roadmap's M3 ("invalidate/recompute only relevant projections").
3. **Persist packages only when they feed an agent task** (content-hashed), for reproducibility and debugging. Interactive UI context doesn't need persisting.
4. Provenance has to be real (Astra F6).

**Integrity Engine.** The risk of building a theorem prover before a screenplay app is real in the *docs*, but the practical guide already exists: ~40 legacy `report:*`/`check:*` scripts show which checks had value. Port the high-value few as `Finding`s early:

- gravity/state consistency per shot (from §4.2);
- trailer spoiler checks (`check:trailer-spoilers`);
- dialogue timing fit;
- reference/asset completeness;
- stale derived cut (pin drift).

Adopt Astra's severity/category/status/blocking split, and make **blocking policy per action** (accept vs. publish vs. export), which fixes the live problem of a ledger field blocking the festival deploy. Keep causal, epistemic, and cinematic-grammar validators aspirational.

---

## 9. Media, storage and export assessment

### 9.1 The M0.5 identity invariant

*Provider is provenance; location is availability; `MediaAsset` is creative identity; `AssetBlob` is byte identity* is correct and important. Corrections, most already raised by Astra:

- Blob ↔ asset is **N:M through a binding** that carries role (original/proxy/master/thumbnail/audio-extract), approval, and selection. Physical metadata stays on the blob. Fix `V2_MEDIA_AND_AGENT_RUNTIME.md` L34 and L49.
- **Provider-only assets have no verified blob yet.** Model them as an *unresolved representation* (provider receipt, remote ID, expiry knowledge), and create or merge the blob on materialization. Never fabricate a hash.
- **Mutable provider assets:** if a provider can change bytes behind an ID, that's a new blob. Each `StorageLocation` records `verifiedDigest` + `verifiedAt`, and a mismatch on re-verify is a Finding, not a silent update.
- **Media ↔ domain:** a Take or clip selects an *asset*, and a *representation policy* (proxy for editing, master for delivery) resolves to a blob at use time. Don't let domain objects point at blobs directly.

### 9.2 What Astra missed: Git LFS is today's Studio-grade blob store

All 1,276 Light Delay media files are Git LFS objects (`.gitattributes`), and an LFS OID *is* the SHA-256 of the full content. So:

- Migration can create `AssetBlob{sha256, size}` from LFS pointers **without downloading or re-hashing anything**.
- A `StorageLocation{kind:'git-lfs', repo, oid}` makes the existing tree immediately usable as a location. "Canonical media migration deferred" is fully compatible with the model: register, don't move.
- The 696-entry `data/assets.json` holds path-based identities with no checksums. Keep `asset:*` IDs as `MediaAsset` IDs, and derive blobs by path → LFS pointer.
- Object storage becomes a *second location* when materialization or backup is needed. That's where DR comes in: LFS on GitHub alone is not a backup.

### 9.3 Checksums, dedup, lifecycle (for M4.5; don't build earlier)

- SHA-256 over full bytes, streamed. Keep S3 ETags and provider hashes as separate fields.
- Dedup only within a workspace. Hash matches never merge creative identity or rights.
- Deletion is four separate operations: asset tombstone → binding removal → location removal → blob GC. Blob GC requires zero bindings *and* no references from retained revisions or pinned exports. Reference counting via query, not counters.
- Resumable multipart upload and ranged reads are needed from day one for video.
- Encryption: the provider default at rest; access only through short-lived signed URLs issued after a project authorization check.

### 9.4 Export and interchange

What exists [read]: a linked, local-filesystem OTIO exporter tuned for DaVinci Resolve, with dialogue/subtitle sidecars and take replacement from a Resolve-exported OTIO (`scripts/lib/resolve-otio.mjs`, 809 lines). No OTIOZ, FCPXML, AAF, or asynchronous packaging exists.

**The most valuable export abstraction already exists twice, and they disagree:** browser playback spans (`animaticPlaybackSpans.ts`) and OTIO assembly. Astra identified the parity bug. I'd act on it **now, in legacy**: extract one `ResolvedEdit` (clip occurrences with their own IDs, rational timeline rate, tracks, source ranges, representation choice) that both playback and OTIO consume. It:

- fixes a real, current bug in the festival pipeline;
- is independent of V2 persistence; and
- becomes Studio's export seam unchanged.

**Studio owns:** `ResolvedEdit`, the export manifest (revision, version, blob bindings, rights state, missing items), and the linked vs. portable policy.

**Exporter-specific:** OTIO schema details, Resolve naming/metadata quirks, sidecar formats, and later FCPXML/AAF (via OTIO adapters first). Note that generated-media provenance mostly *does not survive* NLE round-trips. Keep it in Studio's manifest, keyed by clip occurrence and media reference, and don't rely on OTIO metadata being preserved.

Specific exporter risks to fix when touching it:

- A numeric `fps` (default 24) with float ms → frame math has no rational-rate type, so 23.976 (24000/1001) timelines drift. Use rational rates.
- Per-shot rounding (L440–441) drifts against cumulative dialogue cue times.
- Overlapping cues get serialized instead of placed on separate tracks.
- There are no handles for generated clips.

Portable export as an asynchronous worker job with a manifest (Astra's design) is right, but it's **M4.5+**. Nothing current needs a 100 GB package.

---

## 10. Agent Runtime and security assessment

The boundary `Studio → AgentTask → Runtime/Worker → Provider Adapter` is sufficient. It doesn't depend on CLI authentication, and the registry plan (explicit `agents:*`, no `postinstall`, no CI auth) is correct. I found no agent installation hooks in any manifest [read `package.json` scripts].

What the first integration needs, beyond Astra's list:

1. **Output goes to Drafts** (§4.1). The task records `baseRevision` and read-set. Promotion re-checks authorization and the read-set (§6.3). An execution succeeding never means acceptance.
2. **Isolation without a platform.** A dedicated uid, a per-task directory with only authorized inputs (the context package + inputs as files), and `systemd-run` with `ProtectSystem=strict`, `ReadWritePaths=<task dir>`, `PrivateTmp`, `NoNewPrivileges`, CPU/memory/time limits, and network restricted to the provider host (nftables owner match or an egress proxy). No containers or Kubernetes are required.
3. **Secrets:** provider credentials live in the runtime user's home or config, never in the task directory, never in context packages, never in logs. The web process has no provider credentials at all.
4. **Budgets:** a per-task spend cap and a per-project daily cap, enforced *before* dispatch. Paid generation needs explicit approval unless policy pre-approves it (§19).
5. **Malformed or malicious output:** results are parsed against a TypeBox result contract, and anything outside it is rejected as a Finding. Text from retrieved documents is labeled as data in the prompt envelope. Command execution rights inside CLI tools are disabled or allow-listed per adapter.
6. **Concurrency across users:** one worker process with a PG-backed job table (`SELECT … FOR UPDATE SKIP LOCKED`), leases, and attempt records. Nothing more until measured.

Start with **one** adapter plus a deterministic fake. The *first* adapter should be whichever one you can run under service credentials (a direct API) rather than a personal CLI subscription. That avoids building the credential-routing path around a mode that can't ship commercially (§19).

---

## 11. Repository organization assessment

The target shape (`apps/studio`, `apps/light-delay`, `packages/v2-core`, `projects/light-delay`, `tools`, `docs`) is right, and "root = monorepo control" is right.

**Should reorganization happen immediately after M1 and before M2?**

- **R1/R2 (move the legacy app + its i18n/config into `apps/light-delay`): yes, but after Stage 0 (§18), and on `master`, as one mechanical commit in a quiet production window.** Why before M2: M2 introduces the project-store and path abstractions. Writing the legacy adapter against final paths avoids doing it twice, and test configuration stops coupling v2-core to legacy Vite/paraglide. Only 3 files in `src/` import `data/` relatively [verified], so R1 is small.
- **Not on the long-lived branch.** `master` changed `src/lib` 598 times in 30 days. A move on the branch guarantees rename conflicts.
- **R3/R4 (`data/` → `projects/light-delay`, script split): after the project-path resolver exists *and* after the Git↔Studio authority decision (§4.9).** 46 scripts hardcode `data/` or `static/`. Moving them doesn't advance any Studio milestone.
- **R5 (media): never as a file move.** Register LFS objects as locations (§9.2).
- Also: remove `src/routes/v2/*` from the festival app. It was a prototype, it now breaks the build, and `apps/studio` supersedes it.
- Keep one `packages/v2-core` with internal modules, as Astra recommends. Make it Node-importable (emit JS or use `.ts` import extensions with `rewriteRelativeImportExtensions`). Move the TypeBox contracts into it. Move the Light Delay fixture to a `testing` subpath export.

---

## 12. Deployment and operational assessment

Confirmed, in agreement with Astra:

- the root `require()` (D1);
- mutable releases (D2);
- a failed health check leaves an un-rerunnable SHA with no auto-rollback (D3; `stage-remote.sh` L31, L41–43);
- the wrong `ExecStart` path in the docs (`V2_DEPLOYMENT_AND_ENVIRONMENTS.md` L218 vs. the real `apps/studio/build/index.js`);
- migrations not packaged (D4);
- CI coupled to the deploy directive (D5).

Additional:

- **Rollback runs migrations** (§4.10). Split activation into `activate` (switch + restart, no migrations) and a separate `migrate` step run once, forward-only, before activation.
- **Releases aren't self-contained:** `npm ci --omit=dev` runs on the VM at deploy (`stage-remote.sh` L39). Lockfile integrity pins the bytes, so it's reproducible, but deploy and *rollback* depend on registry availability. Prefer shipping `node_modules` in the CI artifact (for Linux x64 it's the same platform).
- **The runtime relies on Vite bundling the linked workspace package.** The release contains `packages/v2-core/package.json` without `src/` [read `package-stage.sh` L20–23]. This works because Vite doesn't externalize linked packages. It's fragile: if v2-core ever becomes a published or built package, the release breaks silently. Add a smoke test that starts the packaged artifact from a clean directory in CI.
- **Staging has no access control.** Fine for a static demo. Before any persistent writes or agent spend, put at least a single-user gate (nginx auth or a session login) in front of it.
- **Staging environment trust** (§4.10): verify deployment-branch rules on the `staging` environment. Consider requiring `workflow_dispatch` by a human rather than a commit directive once agents commit.
- PostgreSQL 15 on the VM can't be verified from the repo. Before M4, document backups: nightly `pg_dump` to object storage plus one restore drill. That's cheap, and it's the first DR requirement.

The topology (nginx → loopback → systemd, immutable release directories, an env file outside releases, exact-SHA deploys) is appropriately simple. Don't add containers, orchestration, or blue/green.

---

## 13. UX implications

*Would this architecture help build a better filmmaking application?* Yes, **if** three leaks are closed:

1. **Revision noise leaks into the UI** today: the footer shows `r{n}`, "N context sources", and raw error kinds ("Change rejected: conflict"). Revisions should surface only in a History panel. Conflicts should read as "Someone (or the assistant) changed this scene. Review changes."
2. **Exploration vs. authoring.** Without a scenario/draft tier (§4.1), every "what if" is a canon edit, and users will quickly stop exploring. With it, "try microgravity here" is a scratch scenario that can be discarded or promoted.
3. **Restore scope.** Users mean "restore this scene/shot", not "restore the project to Tuesday". Scoped restore comes naturally from §6.2. A project-wide restore silently reverting the agent's and collaborators' work would be a trust-destroying default.

Other points:

- Seven dead lens buttons on staging present an application that doesn't exist. Show only Write (and Context) until a lens works.
- The *Cut* selector (festival/trailer) is the one version concept users need to see. Continuity and HistoryContext are advanced settings.
- Capabilities, story points, and `StateChange` should appear as plain statements in the context panel ("From scene 12 the ship is coasting: microgravity"), never as editable schema.
- "Content first, model second" needs one mechanism above all: extraction *proposals* shown in the margin, accepted with one click. That needs the Draft/proposal tier.

---

## 14. Testing and validation gaps

Highest value first:

1. **A CI job that builds the legacy app** (`build:legacy` with and without `BASE_PATH`) on every PR. This is the gap that let the festival break through.
2. **A pinned, offline i18n compile** that fails when zero messages compile.
3. Split CI: core tests (with their own Vitest config, not the root one), Studio check/build + a packaged-artifact smoke start, legacy check/build, and data validation. The first three must not wait on the fourth.
4. M1/M2 contract tests:
   - restore equality including removed state;
   - malformed and unknown ops;
   - finite values;
   - reference integrity;
   - no orphaned state after a sequence;
   - server attribution;
   - `commandId` idempotency;
   - read-set conflicts vs. unrelated-aggregate commits;
   - serialize → new process → reconstruct → equal;
   - replay-oracle equality (§6.2).
5. A navigation test where gravity *decides* the route (distinct costs or topology), plus "undetermined" state, an unknown node, and relevant-only blockers.
6. Version/document slice tests:
   - two cuts share an entity with different facts, without leaking;
   - pin drift is detected per aggregate;
   - a draft survives a restart;
   - promoting a draft against a moved read-set conflicts;
   - scoped restore of one scene leaves others untouched.
7. Story-state tests: `stateAt` per scene matches legacy `contexts.json` gravity for every festival-master scene. That's an import fidelity check with real data.
8. `ResolvedEdit` parity: playback duration == OTIO duration for festival-master; stretch clips appear in OTIO.
9. Deployment: symlinked manifest can't execute as root; duplicate-SHA reactivation; health failure → previous release restored; rollback runs no migrations.

---

## 15. Critical before proceeding

Kept deliberately small. Each item is cheap. Together they cost days, not weeks.

| # | Recommendation | Evidence | Problem → consequence if ignored | Direction | Timing |
|---|---|---|---|---|---|
| C1 | **Freeze the festival artifact and restore a buildable baseline** | `pages.yml` deploys every `master` push; `master` run 35546460907 failed; `validate-schemas` fails on `inputDigest`; branch build fails on `/v2/write` [verified] | The "protected" site is neither protected nor currently reproducible. Merging PR #2 would break it. → A lost or broken judged site, and paralysis of both V2 and production work. | Identify the currently deployed revision; tag it; deploy Pages from the tag or a `festival` branch. Fix `inputDigest`. Delete `src/routes/v2/*` and the root layout's V2 branch (`1271f3c`). Pin the inlang plugins locally. Add a legacy-build CI job. | Now, before anything else |
| C2 | **Fix the root activation helper** | `stage-activate.sh` L38 | Deploy account → root code execution | Parse JSON with `jq`/`node -e 'JSON.parse(fs.readFileSync(…))'` on a regular-file check (`[[ -f && ! -L ]]`). Root-own finalized releases. Take migrations out of activation. Verify the *installed* helper on the host. | Before the next staging deploy |
| C3 | **Decide the state tiers and story-time state before M2's contracts** | §4.1, §4.2; `V2_UI_AND_VERTICAL_SLICE.md` L247–249 vs. `world.ts`; `V2_ARCHITECTURE_INDEX.md` L128 | M2 will otherwise freeze a store contract with no Drafts, a timeless state map, and project-global conflict scope. → Rework of persistence, context and UI later, when history is already durable. | A short design note (an ADR) covering: authoritative / provisional (Draft) / operational / derived tiers; `StateChange` + `stateAt`; aggregate versions + read-set preconditions (§6.2–6.3); continuity vs. cut. No code beyond types. | Before M2 starts |
| C4 | **Stop false "Saved"** | `+page.svelte` L20 | Trust erosion; lost text once anyone writes on staging | Replace with "Prototype, not saved" until Drafts persist | With C1 |

I've deliberately left off this list: M1 bug fixes (superseded by C3), replay/upcasting, the media identity corrections, and agent contracts. They matter, but ignoring them for two weeks costs nothing.

---

## 16. Near-term implementation recommendations (next few milestones)

1. **Integrate the branch** after C1: merge into `master` (Studio code is inert for the festival app once `/v2` routes are gone and the tag deploys the festival). Then R1/R2 as a single mechanical commit on `master`. *Evidence:* §4.7, §11. *Benefit:* ends divergence and lets M2 target final paths.
2. **Make v2-core a real package:** Node-importable, its own Vitest config, TypeBox contracts moved in, the fixture moved to `testing`. Define **command and operation contracts in TypeBox first**; don't port the ontology. *Evidence:* §2.2, A5, A15.
3. **M2 (in-memory, 1–2 weeks):** the application service with commands and queries; the aggregate-version store interface (§6.2); Drafts; read-set preconditions; server attribution; `commandId` idempotency; and one **document slice**:
   - a scene with stable element IDs;
   - edits go to a Draft;
   - checkpoint/promote → ChangeSet;
   - scoped restore;
   - two cuts (festival/trailer) sharing entities.
4. **M2.5 minimal PostgreSQL** (moved earlier; see §18): one DB, migrations, the tables for ChangeSets, aggregate versions, head, drafts and outbox; a simple `project_grants` table with RLS on `project_id`; server-assigned principals; a single-user login on staging; `pg_dump` backups. No control plane, no grant projections, no pgvector.
5. **Story-state slice (replaces M1's demo):** StoryEvents + fabula order + `StateChange` + `stateAt`. Import gravity from `contexts.json` for the festival master, provenance intact and legacy IDs preserved. Navigation takes `at`, and the Context panel answers "at this point…" for the scene under the cursor.
6. **M3 Context:** `ContextScope` (revision, cut, story point, perspective); recompute-on-demand; real provenance.
7. **In legacy, in parallel (independent of V2):** `ResolvedEdit` shared by playback and OTIO (§9.4).

---

## 17. Deliberate deferrals

Explicitly *not* during the next 2–3 milestones:

- The control-plane DB, shard-local grant projections, auth epochs, and replicated authorization (`V2_SCALABILITY_AND_STORAGE.md`). A single `project_grants` table with RLS is enough.
- pgvector and semantic retrieval; any vector service.
- `HistoryContext` behavior, time-travel ordering, causal-cycle policy, belief revision, confidence.
- Profiles, plugin/validator engines, capability definitions with schemas and UI hints, schema-driven editors.
- The CLI registry for three providers; `agents:*` scripts beyond one adapter.
- Object storage, materialization, portable export, FCPXML/AAF, transcoding workers.
- R3–R7 moves; any `static/assets` relocation.
- The six non-Write lenses; the full spatial model (segmented traversal, proximity, portals, mobile-host resolution) until an importer needs it.
- Replay/upcaster infrastructure for M1 ops.
- Multi-user collaboration, presence, CRDTs.

---

## 18. Revised roadmap

**Evaluation of `M0/M0.5 → M1 → reorg → M2 → M3 → Agent Runtime → M4 PG → Media Plane`.**
It's close, but three dependencies are ordered wrongly:

- **Reorg depends on integration, which depends on the festival freeze. It does not depend on M1.** Doing the reorg right after M1 on the branch would maximize conflicts.
- **M3 (context) depends on the state and scope model** (story point, cut, perspective). That model doesn't exist yet, and M1's global map is the wrong input.
- **The Agent Runtime depends on Drafts (to hold its output) and on durable task records.** Both come from a store, so the agent comes after minimal PG, not before.
- **Minimal PG moves ahead of M3** because the document slice needs durable Drafts to be tested honestly on staging, and because atomic version+head+outbox semantics can't be validated in memory. Staging already has PostgreSQL. Keep it minimal. This is where I differ from both the current roadmap and Astra.

**Proposed sequence from today's state:**

| Stage | Content | Exit gate |
|---|---|---|
| **0. Freeze & truth** (days) | C1, C2, C4; split CI | The festival tag builds reproducibly offline; the branch's legacy build passes; the root helper can't execute code |
| **1. Design note** (days) | C3 ADR: tiers, `StateChange`, aggregate versions + read-sets, continuity/cut, vocabulary rules | Reviewed; the M2 contracts derive from it |
| **2. Integrate + R1/R2 + package v2-core** | Merge into `master`; mechanical move; v2-core packaging; TypeBox command contracts | Legacy build/check identical to the festival tag's output (diff the `build/` trees); core tests run without the legacy config |
| **3. M2 in-memory + document slice** | §16.3 | Two cuts isolated; draft → promote → scoped restore; read-set conflicts behave as specified |
| **4. M2.5 minimal PostgreSQL** | §16.4 | The same contract tests pass on memory and PG; restart survives; atomic commit; backup restore drill done |
| **5. Story-state slice** | §16.5 (subsumes M1's toggles and M6's gravity import) | `stateAt` matches `contexts.json` for all festival-master scenes; navigation "at this point" works |
| **6. M3 context** | §16.6 | Scope-correct, reproducible packages with real provenance |
| **7. First agent** | One adapter + fake; text proposals into Drafts; task/attempt records; budget; sandboxed uid | A crash doesn't lose or duplicate; a stale proposal can't be promoted unchecked |
| **8. Zao slice** (`learn`/`observe`, audience reveal) | As in roadmap M7, reduced | "Why does X know Y" answered for Zao |
| **9. Media Plane** | LFS-registered blobs/locations; bindings; object storage as a second location; `ResolvedEdit`-driven export jobs | Portable export of festival master with manifest; generation provenance retained |
| **10. Authorization hardening, broader lenses, R3/R4** | As needed | Before any second user |

**What not to work on during the next two or three stages:** everything in §17, plus further polish of `SetWorldState`/`SetOccupancy`, more architecture documents beyond the one C3 note, and the V2 documentation taxonomy reorganization (`V2_DOCUMENTATION_STRUCTURE.md`).

---

## 19. Decisions requiring human judgment

1. **Festival freeze.** Which exact revision are judges viewing, and may Pages deploy from a tag or branch until judging ends? (This unblocks everything else.)
2. **Product scope horizon.** Is Studio a single-author tool for the next 6–12 months, or a multi-tenant product? The scalability, RLS, and credential designs are sized for the latter. The next milestones should be sized for the former unless you decide otherwise.
3. **Authority cutover for Light Delay.** Git JSON stays authoritative and Studio projects read-only until a dated cutover (recommended), or Studio becomes authoritative for some slice sooner.
4. **Continuity vs. cut.** Keep ADR-0001's "continuity" as a first-class canon line in V2 (recommended), or collapse it into versions with story-scoped overrides (Astra's direction, which also works but loses the explicit "different canon" signal).
5. **Derived-cut updates.** Pinned derivation with reviewed updates (recommended, and what legacy already does) vs. live inheritance.
6. **Reconstruction mechanism.** Versioned aggregates with ops for intent and a replay oracle (recommended) vs. op-sourcing with upcasters (Astra and the current docs).
7. **What "Saved" promises.** Durable draft (recommended default) vs. committed revision.
8. **First Studio outcome.** Write and revise a scene with contextual proposals (Astra's pick and mine), or production assembly (shots → generated media → edit), which is where Light Delay's current daily work actually is. If production matters more right now, do `ResolvedEdit` and the Media Plane before the agent stage.
9. **Agent credentials.** Is the first adapter allowed to use a personal CLI subscription on the staging VM, or must it use API service credentials? Check provider terms either way.
10. **Paid generation approval.** Per-task human approval, or pre-approved within a budget?
11. **Media survival policy.** Which representations must be archived before delivery (recommended: selected/approved), and how long are superseded blobs retained?
12. **Post-Resolve authority.** Does an externally edited OTIO become an imported version, a tracked artifact, or out of scope?

---

### Appendix: verification probes (for reproduction)

- Restore probe: commit `SetWorldState(newKey)`, then `SetWorldState(gravity=microgravity)`, then `restore(1)` → `ok:true`, state still contains `newKey`.
- Validation probe: `SetOccupancy(entityId=Harlan, [blocker entityId=Sorell, nodeId='nowhere'])` accepted; after `SetOccupancy(Harlan, [])` the Sorell blocker remains. `SetWorldState(value=NaN)` persists as `null`. `{type:'Bogus'}` → `TypeError`. Principal `system` and timestamp `1970-01-01` accepted verbatim.
- Routing probe: identical edge list for 1g and microgravity. `gravity='0.3g'` → whole route unreachable, with failures listing reverse edges. Unknown `from` returns unrelated failures.
- Build probe: architecture branch `vite build` → `Error: 404 /v2/story (linked from /v2/write/)`; with `BASE_PATH=/light-delay` → `404 /v2/write does not begin with base`. `master` same environment → success.
- Packaging probe: `import('@light-delay/v2-core')` from Node → `ERR_MODULE_NOT_FOUND …/src/world`.
