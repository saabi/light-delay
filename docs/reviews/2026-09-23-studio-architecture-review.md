# Studio: architecture and implementation review

**Repository:** `saabi/light-delay`  
**Review date:** 23 September 2026  
**Primary snapshot:** `architecture/v2-domain-model` at `1b21883a4be20696fca8efda5261435ca4b4f454`  
**Comparison snapshot:** `master` at `c2105fcb54772f91337c2fb69c32cfc9061f9e5b`  
**Scope:** read-only architectural and implementation review. No tracked repository files, branches, issues, deployments, or remote settings were changed.

Repository citations below resolve to the inspected commit, not a moving branch. Findings distinguish observed behavior, source-level analysis, and recommendations. I inspected all five remote branches, the 76 architecture-branch commits since divergence, relevant earlier decisions and implementation changes, both workflows and recent run results, the complete new shared core and Studio application, the earlier V2 contract proof, and selected legacy production/export paths.

Local verification used Node 24.19.0 and a detached review checkout. Large `static/assets` media were deliberately excluded. This limits media-dependent tests and prevents claiming a complete festival build verification. I did not log into the Linode host, inspect its actual systemd/nginx/database configuration, or exercise live provider credentials. Successful deployment evidence comes from GitHub Actions, not an independent host audit.

## 1. Executive assessment

**Keep the architectural direction, but do not treat the foundation as ready for accelerated feature development.** The separation of world, story, narrative presentation, documents, production, media, and execution is justified by real problems already present in Light Delay. The present implementation remains a navigation demonstrator with an in-memory revision proof and a deployed UI shell. Much of the sophisticated architecture is documentation or shape-validation tests.

The next investment should be a small correctness and product-proof increment, not additional ontology or infrastructure.

The highest-priority findings are:

1. **M1 restore is incorrect for newly introduced state keys.** It can return success while leaving state absent from the requested historical revision. Runtime validation also accepts identity-inconsistent occupancy and non-serializable numeric values. These defects should be fixed before this API becomes a persistence contract. [History implementation][history]
2. **The documented deployment privilege boundary is unsafe.** The root activation helper calls Node `require()` on `package.json` in a release directory writable by the deployment account. A symlink to JavaScript causes code execution in that root process. I reproduced that Node behavior locally, without invoking the server or its root helper. Actual host exposure depends on whether the documented helper/permissions are installed. [Activation helper, L26–51][activate]
3. **The Studio editor appears to save work that it does not save.** Its `contenteditable` screenplay is not connected to commands, history, or storage; “Saved” is unconditional. Only the two context toggles use the in-memory history object. [Studio page, L1–30][studio]
4. **Version semantics are not yet strong enough to persist.** `NarrativeVersion` records presentation IDs and lineage, but does not specify how alternate endings, character merges, changed facts, and document/production variations resolve without affecting sibling versions. [Domain model §6][domain]; [ADR-0001][adr1]
5. **The new core bypasses the earlier runtime-contract direction.** TypeBox contracts remain under legacy `src/lib/v2`; the shared core defines separate TypeScript-only contracts and a smaller, incompatible Context package. There is no general replay path or versioned operation envelope. [Schema proof][schema]; [earlier Context contracts][context-old]; [shared Context implementation][context-new]
6. **Festival compatibility is not currently proven.** Studio staging passed, but the latest `master` Pages run and the architecture PR’s merge-build failed before unit tests/build. The observed merge-build failure is missing `inputDigest` in a newly added production result. It is not evidence of a Studio build regression, but it blocks a trustworthy reorganization baseline. [Pages merge run][pages-run]; [master run][master-run]

My recommended sequence is:

**M1 repair + deployment fix + CI baseline → consolidate shared core and R1/R2 app move → M2 application boundary with a real document/cut proof → M3 revision-aware context → minimal PostgreSQL + authorization + outbox → first durable agent integration → media persistence/object storage and export jobs.**

R3/R4 data/tool relocation can follow in bounded changes once a project-path adapter exists; it should not become a prerequisite for proving the application boundary. A strictly disposable, proposal-only agent experiment may precede PostgreSQL. A user-facing agent that commits work, spends money, or must recover after a restart should not.

## 2. Current-state reconstruction

### Branches and relationships

| Branch | Head | Relationship and significance |
| --- | --- | --- |
| `master` | `c2105fc` | Default branch; active Light Delay film production. Two commits newer than the shared ancestor add scene 22–26 production changes and media. No new Studio workspace implementation at this head. |
| `architecture/v2-domain-model` | `1b21883` | Main Studio/V2 work. 76 commits ahead of, and 2 behind, `master`; common ancestor `d797d9c`. Open PR #2 targets `master`. |
| `refactor/move-legacy-app` | `72728fb` | An ancestor of the architecture head, 17 commits behind it. **No committed legacy-app move.** The branch name describes intent, not implementation. |
| `deploy/github-pages-static` | `f9665a1` | Historical Pages work, ancestor of `master`; PR #1 merged. Not a current Studio deployment branch. |
| `docs/proxima-ardor-design-reference` | `82cdb09` | Historical film reference work, ancestor of `master`. Not an alternative V2 architecture. |

See [architecture comparison][compare], [PR #2][pr2], and [PR #1][pr1]. The branch API reported all five as `protected: false`; I did not audit repository rulesets or environment approval settings. “Protected festival artifact” is therefore established policy and deployment intent, not demonstrated branch-protection enforcement.

### Important architectural and implementation commits

| Commit | What actually changed |
| --- | --- |
| [`1880581`](https://github.com/saabi/light-delay/commit/1880581) | ADR-0003 establishes separation of story, narrative, cinematic language, production and history. |
| [`5dabc26`](https://github.com/saabi/light-delay/commit/5dabc26) | Initial TypeBox schema proof under `src/lib/v2`. |
| [`87ca189`](https://github.com/saabi/light-delay/commit/87ca189), [`a28c769`](https://github.com/saabi/light-delay/commit/a28c769) | Context interfaces and a fixture-resolver test. |
| [`8a345fc`](https://github.com/saabi/light-delay/commit/8a345fc), [`160e6de`](https://github.com/saabi/light-delay/commit/160e6de) | Separate world time and experienced order; add continuity/epistemic schema shapes. |
| [`747b81e`](https://github.com/saabi/light-delay/commit/747b81e) | Despite “Project epistemic state…” in its title, this commit changes the domain-model document only. It does not implement an epistemic projector. |
| `efccbd2`–`249b008` | Incremental `apps/studio` scaffold. |
| `dc81bbd`–`6fc4082`, [`955e898`](https://github.com/saabi/light-delay/commit/955e898), [`bfce78a`](https://github.com/saabi/light-delay/commit/bfce78a) | Shared navigation core, fixture, tests, and Studio integration. |
| [`07fe91d`](https://github.com/saabi/light-delay/commit/07fe91d), [`90cdabe`](https://github.com/saabi/light-delay/commit/90cdabe) | Target monorepo layout and festival compatibility policy. Design, not relocation. |
| [`f28d3c7`](https://github.com/saabi/light-delay/commit/f28d3c7), `4827144`, `acae266`, `5aa3a7e` | Staging workflow and successive deployment fixes. |
| [`dc76b26`](https://github.com/saabi/light-delay/commit/dc76b26) | **M0.5:** media/storage/export and Agent Runtime contracts. Documentation only. |
| [`1b21883`](https://github.com/saabi/light-delay/commit/1b21883) | **M1:** in-memory revision history, four tests, and local Studio toggle integration; successfully deployed to staging. |

### State by subsystem

| Subsystem | Actual state | Classification |
| --- | --- | --- |
| Separate Studio app | SvelteKit/Node shell, editable sample screenplay, context panel, two working controls, `/health` | Implemented and build/check verified; functionality provisional |
| `packages/v2-core` | Navigation graph, fixed Light Delay fixture, small Context package, view model, in-memory revision history | Implemented and narrowly tested |
| Other new packages | No separate V2 schema, persistence, media, runtime, or UI packages | Planned only |
| Runtime schemas | Entity/time/history/epistemic shapes under `src/lib/v2/schema` | Implemented proof; not integrated with M1 |
| Context Engine | Interface-only richer contract plus a separate synchronous navigation resolver | Sound concept, implementation incomplete |
| Temporal/epistemic engine | Schema shapes and acceptance documents; no knowledge projection engine | Design/proof only |
| Story/cut versions | Substantial legacy multi-script machinery; V2 `NarrativeVersion` design | Legacy active; V2 incomplete |
| Integrity Engine | Numerous specialized legacy validators; V2 common Finding design | Legacy active; new engine planned |
| Media plane | Legacy assets/catalog/files/provider ledger; M0.5 logical contract | Legacy active; V2 design only |
| Agent Runtime | Contract document; no worker, registry, provider adapters, or `agents:*` commands | Design only |
| PostgreSQL | No app DB dependency, migrations, ProjectStore, or DB health probe | Planned integration; server provisioning is outside code evidence |
| Monorepo reorganization | Workspaces, `apps/studio`, `packages/v2-core`, `tools/deploy` | Started at scaffolding level; R1–R4 not executed |
| Legacy Light Delay | Root SvelteKit application, static data/media, animatic, generation tooling, exports, local voice studio | Still actively used |

There are **three different UI contexts called or resembling Studio**: the new `apps/studio`; disposable root `/v2/write`; and the legacy `/studio` voice/imitation interface with local Python tooling. Do not treat the latter as the new Agent Runtime. [Legacy Studio API][legacy-studio]; [legacy Vite configuration][vite]

### Data and authority

The live legacy authority chain is concrete: `data/project.json`, `data/editorial-lifecycle.json`, master outline, authorized Festival-master/trailer-master derivatives, script-scoped IDs, entity catalogs, production plans/runs, and `data/assets.json`. `canonicalScriptId` points to the master screenplay route stub; it does not mean the project lacks active screenplays. The old main-short/festival/trailer/long products remain archived/deprecated resources. [Project registry][project]; [agent policy][agents]

The Studio fixture is a manual selection of that world, not an importer or live projection. Its `character:lian-sorell` and `character:rylen-harlan` IDs also differ from the legacy `character:sorell` and `character:harlan` identities. This is acceptable test data if explicit; it must not silently become imported identity. [Fixture][fixture]

### Documentation drift

Several inconsistencies need a small reconciliation pass:

- ADR-0003 is “Proposed”; the roadmap refers to accepted architecture; the repository structure is “accepted target.” Decision status is not uniform.
- The older migration plan puts history in Phase 10; the active roadmap implements history in M1. The older document should identify the active roadmap as superseding implementation order.
- Root cleanup is documented after M0, while the requested working sequence puts it after M1. No relocation has landed, so this remains a real decision.
- M0.5’s file describes M3.5 and M4.5, but the main roadmap has no corresponding full milestone sections; its queue places media before RLS.
- Runtime-contract documents require operation schema/version; the implemented ChangeSet has neither.
- The deployment service example points to `/srv/studio/current/build/index.js`, whereas the package and activation checks use `/srv/studio/current/apps/studio/build/index.js`.
- Root `AGENTS.md` remains a Light Delay production policy and describes root SvelteKit as the planned architecture. It is not yet a general Studio contribution policy.

Sources: [roadmap][roadmap], [migration plan][migration], [runtime contracts][contracts], [deployment document][deploy-doc], [AGENTS.md][agents].

## 3. What is working particularly well

**The architecture addresses existing failure modes.** A shot covering several beats, Zao’s later recording playback, generated stretch videos, delayed knowledge, and multiple film cuts already resist the old universal ScriptFile hierarchy. Separating these is practical, not speculative. [ADR-0003][adr3]

**Structural retrieval precedes model reasoning.** Navigation is actually computed without an LLM. The tiny resolver and UI demonstrate that useful assistance can be deterministic and explainable. Keep this, while improving context accuracy and scope. [World runtime][world]; [Context runtime][context-new]

**The temporal distinctions are unusually well chosen.** Calendar time, causal dependency, entity continuity, and audience presentation are genuinely different. The documents also correctly separate fictional `HistoryContext` from application history and avoid treating playback as a flashback. [Temporal architecture][temporal]

**Mutation history starts small.** Two operations, stale-base rejection, cloned/frozen snapshots, injected clock/ID generation, and restore-as-a-new-change are reasonable first proof choices. There is no need for a dedicated event-store service or CRDT at this stage. [History][history]

**Media identity is moving in the right direction.** The existing SHA-256 ledger and generation input digests already provide migration material; M0.5 avoids making a provider URL the application’s identity. Do not discard these legacy lessons during a clean implementation. [Provider ledger][ledger]; [registration validation][registration]; [media contracts][media]

**Deployment is separated from the festival path.** Exact revision selection, build artifacts, pinned SSH host verification, environment-scoped secrets, loopback health, public revision verification, and serialized deploys are good foundations. The successful latest run is meaningful evidence, despite the security and recovery issues below. [Workflow][stage-workflow]; [successful run][stage-run]

**The UX intention is coherent.** Familiar documents and optional context panels are preferable to graph authoring as a prerequisite. The missing step is to prove that actual document work survives and remains under author control.

## 4. Architectural concerns

### 4.1 The first vertical slice does not yet prove the product

**Classification: sound concept, implementation incomplete.**

The bridge slice tests a graph and two switches. It does not test the central filmmaking loop: write a scene, revise a line, preserve that expression, propose semantic implications, accept some, reject others, and continue working across cuts.

Postponing document authority and ordinary authoring until after spatial, database, and time-travel work risks producing an excellent world-consistency engine around a weak editor. Add one small document slice during M2: premise or screenplay scene → stable text elements → revisioned edit → contextual proposal → explicit acceptance → restore. Use a simple non-SF short as well as Light Delay. Do not build seven complete workspace lenses.

### 4.2 Version scope must affect world/story resolution, not only presentation order

**Classification: architecture needs a more precise contract before persistence.**

The version design lists presentations and lineage. It does not establish where an alternate ending’s changed event, a merged character’s actions, or cut-specific dialogue lives. Shared project world truth plus independently ordered presentations is insufficient when fictional facts diverge.

Adopt one user-facing version concept, with explicit internal scope for its story assertions, documents, production selections, and edit. Avoid adding `StoryVersion`, `NarrativeVersion`, and `CutVersion` as three synonymous entities. Reuse narrative identity where appropriate, while allowing a version to select a distinct story variant.

Prefer an initial **explicit derived version pinned to source revision**, with stable shared entity IDs and local overrides/copies where necessary. Do not promise continuously inherited edits until precedence and conflict behavior are proven. Define absence versus inherited value versus deliberate removal; override precedence; source-revision pins; merge/split mapping; and the scope of changes to relationships, events, dialogue, duration and endings.

A character merge is a reassignment of dramatic functions, not an assertion that two people have always been the same entity. ADR-0001 already recognizes this. Preserve it in the new design. [ADR-0001, character functions][adr1]; [V2 versions][domain]

### 4.3 Documents and semantic facts need field-level authority rules

**Classification: sound concept, unresolved application behavior.**

“Documents are first-class” and “the graph is canonical” can become competing authorities. A screenplay’s wording should be authoritative for that screenplay; a confirmed world fact can be authoritative for its declared story scope. An extraction may propose that the prose conflicts with the fact. It must not silently rewrite either.

Use stable document/element IDs and revision-bound text anchors. Raw `start/end` offsets alone become invalid after edits. Record derivation and synchronization direction per artifact; distinguish generated derivatives from independently authored prose. Preserve unknown extension data through editing, not merely through schema acceptance. [Documents §7][domain]; [Context anchors][context-old]

### 4.4 Temporal generality needs bounded implementation

**Classification: sound distinctions; broad semantics deliberately unimplemented.**

Keep the four independent orders. Do not implement a universal time-travel solver now. The first useful proof is ordinary information acquisition: someone records a warning, someone else receives and watches it, then acts. Include a false belief and a withheld audience revelation.

Before claiming general temporal support, resolve these edge cases:

- `before` may mean calendar placement or experienced sequence; specify which relation family it belongs to, especially in a loop.
- Relative offsets have numbers but no explicit units/calendar policy in the proof schema. Partial dates, intervals and unknown placements need a comparator that can return **undetermined**, not arbitrary order.
- One entity may encounter another temporal instance of itself. Entity identity plus event-to-event continuity alone needs an explicit path/instance selector when paths branch or merge.
- `learn`, `believe`, `doubt`, `forget`, and `revise` need deterministic state semantics and supporting evidence, not merely enum values. Multiple evidence sources and contradictory beliefs must not be collapsed to one global truth bit.
- Causal cycles and narrative repetition require bounded traversal; “reject all cycles” and “traverse until complete” are both wrong defaults.
- Audience information is what a particular version has presented or made available, not a guarantee of what every viewer understood.

WorldContext, fictional HistoryContext, authored version, and ProjectRevision should be separate query dimensions only where needed. An ordinary linear project should receive defaults. [Temporal document][temporal]; [schema proof][schema]

### 4.5 Spatial distinctions are right; the runtime name overpromises

`getEffectiveLocation()` currently does a direct map lookup. It does not resolve movable hosts, nested containment, or an object carried by someone aboard a vehicle. Pathfinding checks global predicates and destination-node occupancy; it does not evaluate actor capabilities, inventory, distances, or travel time. This is a navigation proof, not implementation of the full spatial model. [World runtime, L13–37][world]

Keep containment, connectivity, traversability and distance distinct. Require finite nonnegative route costs, resolvable nodes, and deterministic tie behavior. Return unknown/underspecified separately from physically impossible. Explanation should identify relevant blockers on candidate routes, not every blocked edge anywhere in the graph. Implement host resolution when the Ardor importer needs it; defer coordinate systems and physical simulation.

### 4.6 Integrity should constrain acceptance and publication differently

A hard boundary must reject malformed payloads, unauthorized writes, corrupt references where the operation requires a resolved identity, and broken history. Creative incompleteness belongs in Findings or explicit unresolved references.

The proposed Finding severity enum mixes severity (`ERROR`) with condition (`STALE`, `MISSING`) and category (`STYLE`). Separate severity, category, resolution status, and action-specific blocking policy before this becomes persisted UI/API vocabulary. Allow suppression with rationale and evidence revision. A stale generated result may remain a valid historical artifact; staleness is not permission to regenerate or delete it. [Finding design §13][domain]

### 4.7 The three planes are useful responsibilities, not three services

Keep Semantic/Data, Media, and Execution as conceptual boundaries. There is no reason to deploy three independent services now. Media metadata and execution records can live in the same PostgreSQL database and use shared project authorization.

Clarify the mutation boundary: a worker acquiring a lease, refreshing a provider location, or reporting progress is not necessarily a creative ProjectRevision. Semantic changes—registering an approved asset, changing a selected take, accepting a rewrite—do create authoritative project history. Execution and availability need attributable operational records with their own sequence and lifecycle.

Otherwise every heartbeat and expiring URL refresh will increment the project revision, invalidate context, and cause author conflicts. This distinction is missing from the broad “every authoritative mutation” language and should be settled at M2. [Media planes][media]; [history model][domain]

## 5. Implementation/code concerns

### F1 — Restore can falsely claim success

**Priority: critical before M2 persistence contracts. Confirmed by execution.**

`diffSnapshots()` only emits `SetWorldState` if the target value is defined. Introduce `newKey`, also change gravity, then restore revision 1: restore returns `ok: true`, gravity resets, but `newKey` remains. If the only difference is the added key, restore reports the target is already current even though it is not. [history.ts, L205–229][history]

Add a semantic unset/remove operation, or explicitly reject unsupported removal. Assert restored projection equality excluding revision metadata. Do not substitute `null` for absent unless the domain declares those equivalent. Construct restore provenance before accepting the ChangeSet; the current restore method replaces an already stored ChangeSet after `commit()` returns internally. That is contained today, but would become unsafe around outbox listeners or durable append semantics.

### F2 — TypeScript is being treated as runtime validation

**Priority: critical before external inputs. Confirmed by execution.**

Observed:

- `SetOccupancy(entityId=Harlan)` accepts a blocker belonging to Sorell at a nonexistent node.
- `SetWorldState(value=NaN)` is accepted; JSON serialization changes the value to `null`.
- An unknown operation discriminant throws a TypeError rather than returning a structured validation result.

The implementation assumes any operation other than `SetWorldState` is occupancy. Preconditions have a similar fallback. Validation does not prove referenced identities, operation correspondence, finite values, or valid timestamps. [history.ts, L170–203, L269–313][history]

Use one discriminated runtime contract, then semantic validation against the scoped current state. Server attribution and accepted timestamps must come from trusted application context; retain any claimed client/agent metadata separately. These are not presently remotely exploitable Studio endpoints—the app has no mutation API—but they are unsafe foundations for one.

### F3 — Snapshot retention is not replay verification

**Priority: before first durable history.**

Every commit clones the complete WorldSnapshot, and `getRevision()` returns a retained snapshot. There is no history import/replay API, reducer version/upcaster, schema-version envelope, or reconstruction test after serialization and process restart. The test named “deterministic projection” checks a single commit and stored snapshots. [history.ts][history]; [history tests][history-tests]

Extract a pure, versioned operation reducer. Replay a serialized genesis snapshot plus accepted events into a fresh instance. Compare results with current projection and historical checkpoints. Keep periodic snapshots later; do not store a full production project per keystroke by default. Full copies are fine for this tiny proof.

### F4 — Two contract families are drifting

**Priority: before M2/M3, during core consolidation.**

The original ContextPackage has task, budget, authority, retrieval method, omissions and provenance. The shared StudioContextPackage omits most of those and embeds hardcoded source strings. `ProjectRevision` is a number in the older Context file and a record in history.ts. TypeBox lives under the legacy app; M1 is manually typed. [Earlier context][context-old]; [new context][context-new]; [schema][schema]

Consolidate into `packages/v2-core` internal modules now; do not create many packages. Keep a single revision-number type distinct from the revision record. Represent navigation context as a task-specific use of one contract, without requiring every future field immediately.

### F5 — Schema serialization proof does not meet its stated gate

**Priority: before accepting transported/profile schemas. Confirmed by execution.**

The test verifies JSON annotations survive serialization. It does not validate data against the round-tripped schema. Calling the provided `check()` with `JSON.parse(JSON.stringify(EntitySchema))` throws `Unknown type`. This is the exact caveat already identified in the architecture document. [Schema tests, L68–74][schema-tests]; [runtime contract gate][contracts]

Choose the narrow strategy now: trusted factory-built TypeBox schemas in process, plus a tested JSON Schema validator for transported schemas if needed. Do not add user-defined executable schema/profile code. There is no need to solve arbitrary schema plugins before the first document workflow.

### F6 — Context provenance currently describes an illustration, not actual retrieval

The resolver returns the entire fixture state and cites `data/locations.json`; it never reads that file. Actor location cites a fixed Light Delay fixture. `from` can disagree with the actor’s actual location. The view model also hardcodes `project:light-delay` and named characters. [context.ts][context-new]; [studio.ts][view-model]

Move sample configuration into a fixture/adapter. Resolve from a typed, revisioned query scope. Cite exact imported source identities/revisions and actual derivation rules. Differentiate “source used when authoring this fixture” from “source queried for this answer.” Freeze/copy context where necessary: the current public resolver returns a state reference supplied by its caller.

### F7 — Navigation tests give false confidence about gravity

Both the safe around-rail edge and microgravity crossing have cost 1. The test labeled “allows the direct shaft crossing” accepts either edge. Removing the crossing could leave the test green. The end-to-end visible route can therefore remain unchanged when gravity changes. [world.test.ts][world-tests]; [fixture][fixture]

Test a topology/query where the gravity predicate is actually decisive. Add unknown nodes, self-route, unrelated blockers, parallel edges and invalid costs. Do not benchmark sophisticated pathfinding until a real project needs it.

### F8 — Source readability is below the architectural ambition

Several core files and most Studio markup are compressed into very long lines; route values are cast through `any`. This makes invariants, branches and UI state harder to review. Normal formatting and typed view-model results are a useful cleanup alongside core consolidation, not a separate modernization project. [world.ts][world]; [studio.ts][view-model]

## 6. Media/storage/export assessment

### The identity model is sound, with one important correction

`MediaAsset` as creative identity, `AssetBlob` as exact bytes, and `StorageLocation` as availability is the right foundation. An archival copy of identical bytes is **another location of the same blob**, not a new representation. A transcode, proxy, thumbnail or extraction is a new blob. [M0.5][media]

However, M0.5 assigns representation role to `AssetBlob`. If byte identity is deduplicated, the same blob can be “original” for one asset and an approved delivery for another. **Role, selection/approval, and creative use should usually belong to the asset-to-blob binding or a representation record.** Physical properties and cryptographic digest belong to the blob. Do not require a heavyweight new aggregate; a small binding record is enough.

A provider-only asset may exist before Studio has the bytes or a trustworthy checksum. Represent that as an unresolved external representation with provider version/receipt and integrity status. Do not invent a content hash or claim verified immutability from a mutable URL. Establish or reconcile the blob identity on materialization.

### Missing or underspecified concerns

| Concern | Recommended direction and timing |
| --- | --- |
| Immutable identity | Use a full-byte cryptographic digest plus algorithm and size; verify on ingest. Immutable bytes do not require immutable availability metadata. Define before media persistence. |
| Checksums | Store provider ETag separately from Studio’s verified checksum. Multipart S3 ETags are not whole-file MD5 checksums. Keep full-object and multipart/composite checksums distinguishable. |
| Deduplication | Deduplicate verified bytes within an authorization domain initially. Never merge creative asset identity or rights merely because hashes match. Avoid global dedup side channels and cross-tenant deletion coupling. |
| Provider retention | Store provider account/workspace scope, stable remote IDs, last verification, retention/expiry knowledge and materialization failures. Regeneration is not backup and should require separate authorization. |
| Provenance | Preserve exact input blobs, prompt/spec revision, model/version if available, adapter version, parameters/seed, job/run IDs, initiator and worker identities, approval, and result receipts. Mark unavailable provider details unknown. |
| Rights/licensing | Keep source and representation-specific evidence, permitted uses and review status. Unknown is neither automatically cleared nor necessarily blocked for drafting. Publication/export policy decides requirements; avoid claiming automated legal certainty. |
| Derivatives | Record source blob(s), tool/version, transform configuration and output verification. A reproducible recipe does not guarantee an external model will reproduce bytes. |
| Proxy/master | Store exact source/master mapping, timebase, source timecode, trim/time mapping, dimensions, audio channels and color metadata. Resolution alone is insufficient for reliable reconform. |
| Deletion/retention | Separate asset tombstone, removal of one location, retention expiry, and final blob garbage collection. Historical revisions, pinned exports and active jobs can retain references. Record intentionally unavailable historical bytes. |
| Portability | Distinguish a portable editing export from a full project archive. The latter also needs documents, selected history policy, extensions, profiles, relations, rights evidence and version manifests. |
| Very large media | Stream hashing and transfers; use multipart/resumable upload, byte limits, cancellation and cleanup. Do not copy current `readFileSync()` whole-file hashing into the media worker. |
| Costs | Estimate stored bytes, derivative growth, egress, retrieval, transcodes and repeated exports. Set quotas and explicit paid-job budgets before automatic materialization. No separate billing service required initially. |
| Isolation | Project/workspace-authorized signing; scoped worker credentials; no public canonical bucket by default. A hash or object key is not authorization. |
| Backup/DR | Define metadata DB backups, independent media protection, manifests and tested restore together. Object-store durability or mirroring alone is not protection against deletion or account compromise. |

AWS documents the ETag distinction explicitly: [S3 Object API](https://docs.aws.amazon.com/AmazonS3/latest/API/API_Object.html). The other entries above are architectural recommendations, not claims of implemented support.

### Preserve useful legacy controls

The existing provider ledger keys by asset ID and SHA-256, retains superseded remote IDs, and avoids repeated uploads. Registration checks job/snapshot/input-digest correspondence and output hashes. These are useful controls to preserve. Its hardcoded provider workspace, mutable JSON saves, synchronous whole-file reads, and local paths are appropriate migration boundaries—not reusable commercial service contracts. [Ledger][ledger]; [registration][registration]

Legacy `Asset` combines identity, one path, physical metadata and provenance. Media migration should preserve those IDs where creative identity is unchanged, create blob/location records from verified bytes, and retain a mapping for paths and old provider handles. Do not rename all assets to hashes. [Asset type][asset-type]

### Existing export is useful but already diverges from playback

The exporter implements linked, local-filesystem OTIO plus subtitle sidecars, and take replacement against an externally edited OTIO. It has deliberate Resolve-specific naming and metadata behavior. It does **not** implement portable OTIOZ, FCPXML, AAF, cloud media resolution, asynchronous packaging, or a general Studio edit model. [Export CLI][export-cli]; [export library][export-lib]; [export documentation][export-doc]

The most immediate gap is **selection and timing parity**:

- Movie mode consumes registered `visualStretchJobs` and collapses member shots into a clip with the media duration.
- OTIO assembly iterates `script.shots`, uses each selected take’s `videoAssetId`, and otherwise falls back to its still. It never receives a generation plan.
- At the reviewed architecture snapshot there are 90 Festival-master shots, 16 takes with `videoAssetId`, and 32 registered video stretch jobs. A registered stretch is not automatically included in OTIO through that registration alone.

Consequently an export can assemble stills/dialogue where Movie mode plays generated video/audio, with a different total duration. This is visible in the code, not merely a hypothetical future format issue. [Playback spans][playback]; [export assembly, L409–572][export-lib]

Introduce a shared **resolved edit/assembly representation**: ordered clip occurrences, selected blob/representation, source range, timeline range, tracks and audio policy. Browser playback and format exporters should consume that representation. A clip occurrence ID must be distinct from shot, take, asset, and blob identity: the same shot or media can appear more than once or be split.

Other export concerns to address when expanding the adapter:

- Picture durations are rounded per shot while cue starts derive from cumulative milliseconds; repeated rounding can drift. Use one rational timeline timebase and boundary policy.
- Overlapping dialogue is serialized by pushing a cue’s start to the previous cursor; intentional overlaps need tracks or explicit rejection/reporting.
- Video duration/available range is not verified; selecting a file does not prove it covers the requested range.
- Swap reads raw duration values and has a CLI default of 24 fps; mixed or changed timeline rates need conversion or explicit rejection, not silent interpretation at 24.
- Replacing `:` with `__` is a legacy matching convention, not globally collision-free identity.
- Existing path joining and filename-based matching are trusted-local-tool behavior. Do not expose them unchanged to arbitrary uploaded projects or paths.

### Linked versus portable export

Keep both. “Linked” should mean resolvable by the intended editing application, not merely reachable by Studio. A short-lived provider URL is usually a fragile interchange dependency. Offer stable authorized media mapping or a relink/materialization manifest; never bake credentials or expiring signed downloads into archival identity.

Portable export should snapshot revision, version, edit, export profile and selected blob bindings **at job creation**. Resolve rights, materialize/verify media, then package it with deterministic relative names, checksums and sidecars. Fail or explicitly mark missing dependencies; never silently declare an incomplete package portable.

OTIO’s own bundle specification uses relative references into its media directory and distinguishes directory bundles from ZIP bundles. That is a useful existing format to adopt where compatible, not a reason to invent a proprietary archive. [Official bundle specification](https://opentimelineio.readthedocs.io/en/latest/tutorials/otio-filebundles.html)

Large packaging jobs belong in a worker. Allow bounded temporary scratch space or streaming multipart output; “object-storage-backed” does not imply no local disk is ever useful. Publish only completed exports, support resumable downloads, retain a manifest independently, and expire temporary export blobs without deleting original media. A PostgreSQL-backed job table/outbox and one worker can be sufficient initially.

## 7. Agent Runtime assessment

**Classification: sound architecture, no implementation yet.**

The proposed `Studio → AgentTask → Runtime/Worker → Adapter` boundary is correct. There are no external agent CLI installation commands or silent CLI installs in the reviewed app manifests. The root `prepare` script runs Svelte synchronization; it is not an agent installer. [Media/agent contracts][media]; [package manifest][package]

Keep installation and authentication separate. Pin adapter and CLI versions explicitly, capture detected versions in runs, and validate compatibility with the expected result format. Start with one adapter and a fake adapter for tests. There is no reason to implement Codex, Claude and Gemini simultaneously to prove the boundary.

A separate Unix account is useful but not sufficient isolation. A coding CLI can read files, execute subprocesses and follow instructions from retrieved material. It should receive a per-task workspace containing only authorized inputs, narrowly scoped tool capabilities, controlled egress and resource/time limits. It should not see other project workspaces, deployment credentials, the canonical project database, or the public web process’s environment.

Before the first meaningful integration, define:

- Task ID, authorized project/version/base revision, requester, executing service principal, approval policy, result schema and context-package identity.
- Execution attempt IDs, retry/idempotency behavior, lease/heartbeat, cancellation, timeout and uncertain-provider-outcome recovery.
- Separate **initiator**, **executor**, **proposer** and **approver** attribution. One `principal` alone cannot explain all of these.
- Proposal validation and preview/diff at the application boundary. Execution success never implies acceptance into canon.
- Authorization recheck at acceptance and artifact download, because grants may change during a long task.
- Provider job receipts, usage/cost, tool calls and sanitized logs; prevent credentials from entering durable context or export manifests.
- Stale-result handling: an output based on r10 may be retained as an artifact after the project reaches r12, but applying its proposal requires current authorization and conflict/precondition checks.
- Input trust labels: a screenplay, research file or provider output can contain instruction-like text. It remains task data, not an authority to change the worker’s permissions.

Personal subscription authentication can be an explicit single-operator development mode. Keep commercial identity, quotas and credential routing behind the adapter boundary. Provider commercial terms and supported authentication should be checked when selecting an actual integration; this review does not assert that any personal subscription permits shared commercial use.

**Roadmap change:** a disposable, non-authoritative CLI proof can run before PostgreSQL. Durable or paid agent work should follow minimal persistent task records, authorization and outbox support. Otherwise a process crash can lose an accepted proposal or cause duplicate paid calls, and there is no reliable application record to recover from.

## 8. Revision/versioning assessment

Use distinct terms consistently:

| Concept | Meaning | Must not stand in for |
| --- | --- | --- |
| ProjectRevision | Ordered accepted application state at a project commit | A festival cut or fictional alternate history |
| Story/NarrativeVersion | Authored product with its own content and selections | An application rollback or Git branch |
| HistoryContext | Fictional temporal history, when needed | Project mutation history |
| WorldContext | Fictional ontological context, such as dream or simulation | Tenant/project authorization scope |
| Entity identity | Continuing semantic person, object or place | Document element, visual variant, actor performer or asset file |
| Diegetic Artifact/Representation | Something in the fictional world, such as Zao’s recording | The real generated MP4 used to depict it |
| MediaAsset / blob | Creative media identity / exact bytes | Shot identity or an occurrence in an edit |

The architecture mostly distinguishes these in prose. The actual command/query contracts do not yet carry enough scope to enforce them. A persisted query needs, as applicable, project revision, authored version, story point/context, perspective and audience presentation position. These should form a small typed scope, not dozens of mandatory UI fields.

For M1/M2 retain conservative project-wide optimistic concurrency. Two writers against the same head should yield one acceptance and one conflict. Do not implement generic auto-rebase now. Later, operation-specific commutativity and preconditions can permit safe rebasing.

Before durable adoption, add:

- Versioned operation envelopes and deterministic replay/upcasting.
- Trusted server-side attribution, request/command identity and accepted ordering.
- An explicit idempotency policy: a retry with the same key and same payload can return the previous result; a different payload with that key must conflict. Current duplicate-ID rejection detects duplication but does not recover a lost success response.
- Atomic history, head/projection and outbox update. Two separate ProjectStore and HistoryStore calls must not leave half a commit.
- Restore semantics by scope, including missing/deleted fields and retained media availability. A semantic restore cannot resurrect provider-deleted bytes.
- Explicit checkpoint/genesis provenance when beginning from a nonzero imported revision. The current constructor allows this but has no historical chain before it.

Keep semantic operations, but recognize that `SetWorldState(key, scalar)` is still a generic dictionary setter. It only becomes meaningfully semantic when keys, scope and rules have declared behavior. Add domain-specific commands as workflows require them, not a universal command vocabulary in advance.

## 9. Repository/monorepo assessment

**The target layout is sensible. The full relocation is not a dependency of M2.**

Today the root is still the legacy application: root `src`, app/test/i18n configuration, creative `data`, production `scripts`, and public `static`. The root unit-test configuration also governs `packages`, so the new core’s test command loads legacy Vite/Svelte configuration. [Root package][package]; [Vite tests][vite]

Recommended order:

1. Establish the exact festival baseline and separate always-on Studio/core CI from film data validation.
2. Consolidate `src/lib/v2` and `packages/v2-core` deliberately. Do not mechanically move reusable V2 contracts into `apps/light-delay` just because they currently live under `src`.
3. Do R1/R2 together if convenient: legacy application, its config, i18n and browser tests become a workspace; root aliases remain stable. Keep a temporary explicit adapter for root data/media paths.
4. Begin M2 against project-scoped interfaces. They must not know whether legacy data lives at `data/` or `projects/light-delay/data/`.
5. Introduce a project-path resolver, then execute R3/R4 in separate bounded commits when the full production tool validation is available.
6. Leave canonical media migration to the Media Plane work. Preserve deployed URLs and export paths through an explicit publication adapter.

This is close to “after M1, before M2” for the **app boundary**, but not for every cleanup stage. The broad R3/R4 move touches many film-specific scripts without directly improving the in-memory store proof. It should not delay a useful product slice or be combined with semantic migration.

During judging, every shared dependency/path change needs an independently built festival artifact and representative playback/routing checks. Preserve a known deployed release and rollback route. Moving files is reversible in Git, but breaking external media paths or the judged site is still operationally consequential.

Keep one shared core package for now. Internal modules are enough for contracts, history, context and application services. Move Light Delay fixtures out of the generic package’s primary API or expose them through an explicit testing/example entry point. Do not generalize every old production script simply because it is relocated. [Repository plan][repo-plan]

## 10. Staging/deployment assessment

### Verified strengths and limits

The latest reviewed [staging run][stage-run] passed Studio check, the seven core tests, legacy type-check, Studio build, release packaging, transfer/activation and public revision verification. Earlier failures led to SCP-port, release-layout and startup-health retry fixes. This is a real staging deployment, not design-only.

The code does not use PostgreSQL yet. The specified Debian/PostgreSQL versions, database name, nginx configuration and actual service-unit hardening cannot be verified from this repository alone. `/health` always reports `ok: true` and does not test a database; that is a liveness endpoint for the current shell, not future application readiness. [Health endpoint][health]

### D1 — Root helper trusts executable resolution in a writable release

**Critical, conditional on deployed host configuration matching the repository.**

The setup gives `studio-deploy` control of the release area and sudo access to a root-owned helper. The helper validates the textual release path, then does:

```js
const p = require(process.argv[1]);
```

against `<release>/package.json` as root. `require()` resolves symlinks; a manifest symlink to a `.cjs` file executes JavaScript. I verified that behavior with a harmless temporary local file printing a marker. No server attack or root-helper invocation was performed. [Activation L26–46][activate]; [deployment permissions][deploy-doc]

Replace module loading with non-executing JSON parsing, ensure runtime environment/module-loader options are controlled, reject unexpected symlink/path traversal in release inputs, and avoid trusting caller-writable paths between validation and privileged operations. Prefer an activation helper whose privileged responsibility is only a tightly validated link switch/service restart. Run migrations under a separately bounded non-root mechanism.

### D2 — “Immutable release” is currently a convention, not filesystem enforcement

`chown -R studio:studio` makes installed release files writable by the application service owner; the releases parent remains deployment-user-owned under the documented setup. A compromised service can alter its own release, and the deploy user can manipulate children of the release root. [Activation L51][activate]

Use read-only/root-owned finalized releases for the runtime account, a separate writable install area, and a constrained finalization step. Record artifact checksum and relevant build/runtime versions. Git SHA metadata alone identifies declared source, not verified runtime bytes. No container platform is necessary to improve this.

### D3 — Recovery and retry are incomplete

The remote script refuses an already existing SHA directory. A failed health check after activation therefore leaves that release present; rerunning the same workflow fails before activation. There is no automatic restoration of the previous symlink on failed health. “Manual redeploy” and “retry exact release” are not equivalent in the current scripts. [Remote script][remote]; [activation][activate]

Allow verified reuse/reactivation of an already installed artifact, retain the previous target, and define rollback on failed activation/readiness. Add tests for failure before switch, after switch, and duplicate activation. Avoid automatic application rollback after an irreversible database migration; expand/migrate/contract policy remains necessary.

### D4 — Deployment documentation and migration packaging need correction

The service example has the wrong build entrypoint. The package script only includes Studio build, manifests, lockfile and release metadata. Adding `db:migrate:stage` to the root manifest later will not package its script or migration files automatically. The activation helper also attempts migrations before changing release ownership; verify that the migration identity can traverse/read all parent directories. [Package script][packaging]; [deployment document][deploy-doc]

The root-owned installed helper is copied once and is not upgraded by ordinary deploys. Record its version/hash and provide an explicit operator update procedure; changing the repository copy alone does not fix the live helper.

### D5 — CI and deployment are too closely gated

The staging workflow’s build job runs only for `[deploy:stage]` or manual dispatch. The Pages job is the general PR check, but its film-data failure prevents later test/build steps. Thus a non-deploy Studio change can lack an independent Studio build signal. [Staging workflow][stage-workflow]; [Pages workflow][pages-workflow]

Separate always-on checks into jobs: shared core/contracts, Studio check/build, legacy check/build, project-data validation, and selected media regression tests. Deploy only from successful exact-SHA artifacts. This is CI restructuring, not a need for more servers.

## 11. Test/validation gaps

### What I ran

| Verification | Result and interpretation |
| --- | --- |
| Dependency installation | `npm ci --ignore-scripts --no-audit --no-fund` succeeded in the review checkout. Lifecycle preparation was subsequently exercised by app checks. This is not an exact replay of CI’s plain `npm ci`. |
| `npm run test:v2-core` | 2 files, 7 tests passed. |
| `npm run check:studio` | 0 errors, 0 warnings. |
| `npm run build:studio` | Successful Node-adapter production build. |
| `npm run check:legacy` | 0 errors, 5 accessibility warnings in disposable `/v2/write`. |
| `node scripts/validate-schemas.mjs` | Passed, 75 files on the architecture head. |
| Selected schema/context/export/playback/ledger tests | 28 passed, 2 failed. The two live OTIO tests require omitted static media; these failures are checkout limitations, not established repository regressions. |
| Standalone read-only core probes | Confirmed incorrect restore, mismatched occupancy acceptance, NaN serialization loss, unknown-operation exception. |
| Round-tripped schema probe | Confirmed `Unknown type` with the existing live TypeBox checker. |
| Local module-resolution probe | Confirmed symlinked `package.json` can execute `.cjs` under `require()`. Not tested on the server. |
| Final tracked-file status | Clean after checks/builds. |

The architecture snapshot’s schema validation passes while the PR merge’s validation fails because it includes newer `master` production data. The GitHub merge log identifies `data/production/runs/run-festival-master-shot-plan-077-rev-1-video-1-ready-results.json` missing `inputDigest`. Fix or explicitly reconcile that source record before declaring the integrated baseline green; do not weaken validation to get a deployment. [Failed run][pages-run]

### Highest-value missing tests

**M1 and application boundary:** restore added/deleted fields; full restore equality; runtime malformed inputs; finite scalar constraints; unknown discriminants; occupancy identity/reference invariants; input alias isolation; atomic rejection; duplicate request semantics; serialize/replay into a fresh store; two concurrent clients; failed persistence/outbox write. Ensure test descriptions match assertions—the occupancy test currently does not assert route behavior despite its name.

**Version/document proof:** same entity with different facts in two cuts; merged-character function mapping; alternate ending isolation; source edit without silent propagation; explicit deletion versus inheritance; stable document anchors after edits; refresh/reopen and restore of actual authored text; pending AI proposal cannot silently alter canon.

**Context:** same project/version/revision/task yields equivalent structural evidence; unsupported source is not cited as fact; stale-cache rejection; cross-project denial; restricted audience/character perspective; budget omissions; harmless instruction-like text remains data.

**Navigation/epistemic:** gravity-dependent route genuinely changes; unknown versus blocked; mobile host location; relevant blocker explanations; Zao capture/receipt/playback separation; character learns only after acquisition; audience sees information independently; explicit false belief and forgotten/revised information.

**Media/export:** selected stretch parity between playback and export; missing/corrupt media and proxy/master choice; provider expiration; checksum mismatch; basename collisions; duplicate clip occurrences; frame-rate conversion/drift; overlapping dialogue; source-range bounds; portable package with all required blobs; reference-only export to unavailable media yields a clear report.

**Deployment/security:** malicious symlink/path inputs; no root module execution; service cannot modify releases; health failure and rollback; duplicate SHA reactivation; migration failure; packaged migration availability; non-deploy commits still receive Studio CI; project isolation before any public persistent write endpoint.

Full media tests, a real Resolve import/export round trip, live server permission inspection, and a restore drill remain unverified. These are specific release gates, not reasons to rerun every test indefinitely.

## 12. Prioritized recommendations

### Critical before proceeding

| Recommendation | Evidence/problem | Why and recommended direction | When |
| --- | --- | --- | --- |
| C1. Close deployment privilege gap | Root `require()` on deploy-writable manifest; ownership/symlink assumptions | Protect the server boundary; parse data without module execution, finalize trusted read-only releases, constrain privileged activation | Before next staging deployment using this helper; verify installed helper separately |
| C2. Finish M1 correctness | Restore success mismatch; weak runtime validation; no replay/version envelope | Prevent durable history from encoding unsafe semantics; add unset, runtime schema/semantic checks, versioned reducer and serialization/replay tests | Before M2 contracts are treated as stable and before persistence |
| C3. Stop false save feedback | Unbound editable screenplay plus “Saved” | Avoid loss of authored work; label prototype accurately now, then prove persisted document edits | Before inviting substantive writing in staging |
| C4. Specify version and authority scope | NarrativeVersion only describes ordering/lineage | Avoid contaminating sibling cuts and confusing graph/prose authority; choose pinned derivation and explicit scoped resolution | During M2 design, before durable schemas |
| C5. Establish independent CI and integrated baseline | Pages failure blocks later checks; Studio CI requires deploy directive | Make festival preservation demonstrable; reconcile newer film data and run separate exact-revision gates | Before R1/R2 and before merging PR #2 |

These are a bounded stabilization increment. They do not justify implementing the complete ontology, a distributed event platform, or every planned engine.

### Next implementation steps

1. **Consolidate contracts and perform R1/R2.** Unify old/new Context and revision terminology, move reusable schemas into shared core, remove sample-film assumptions from generic APIs, then move the legacy app/config with compatibility adapters. Evidence: duplicated contracts and root-owned build/test assumptions. Benefit: M2 is built on a real package/application boundary.
2. **Make M2 one atomic application boundary.** Project resolver + command/query service + transaction/unit-of-work semantics; in-memory implementation first. Add two isolated projects and two authored versions. Principal authorization must be part of this boundary even if the first identity is local development only.
3. **Add the smallest real authoring/import slice.** Revisioned scene text with stable element IDs; small deterministic import from Light Delay source records with explicit provenance; human acceptance of a proposed semantic extraction. Evidence: current UI and fixture are disconnected. Benefit: tests the product and identity mapping before database commitments.
4. **Implement M3 conservatively.** Resolve context from accepted revisions; start with revision-keyed cache/recompute or coarse dependency tracking. Add fine-grained invalidation only where measured work warrants it. Include task/version/perspective/policy in context identity, not just project revision.
5. **Bring minimal PostgreSQL, authorization and outbox together.** One database, one schema migration mechanism, one runtime role, project scoping and initial RLS tests. Avoid delaying authorization until after media or exposing persistent endpoints without it. No control-database replication or shards yet.
6. **Implement one durable agent and one media/export path.** One provider adapter, explicit task/attempt identity, proposal acceptance, and bounded costs. Then asset/blob/location persistence, object storage, verified materialization and a shared resolved edit representation feeding existing OTIO. Preserve legacy IDs/digests and test actual film data.

### Defer deliberately

- Shards, separate control database, replicated grant projections, dedicated vector services and a message broker. Interfaces and project locality are sufficient now.
- A general profile/plugin engine, arbitrary user validators, universal temporal solver, automatic paradox resolution, and physical navigation simulation.
- CRDT collaboration and general automatic semantic merging. Conservative optimistic concurrency is acceptable until real editing conflicts demonstrate the need.
- Full Codex/Claude/Gemini adapter parity. Prove one contract with one real adapter plus a deterministic fake.
- AAF/FCPXML implementation unless an actual handoff requirement or verified OTIO gap demands it. Preserve the export adapter seam.
- Global cross-tenant deduplication, archive-tier orchestration and multiple storage vendors.
- Moving the entire canonical `static/assets` tree merely to satisfy the target diagram.
- Schema-generated default editing UI. Use it for advanced inspectors only.

### Reconsider later, with explicit triggers

| Presently acceptable choice | Review trigger |
| --- | --- |
| Whole-project head and coarse conflicts | Real concurrent writers repeatedly conflict on unrelated edits |
| Full snapshots in the tiny in-memory proof | Documents/media metadata make per-command copying expensive; before durable history growth |
| One shared core package | Dependencies or release cadence create an actual independent boundary |
| One web process plus one worker and PostgreSQL jobs | Queue latency, workload isolation or throughput measurements require separation |
| Simple revision-keyed context recomputation | Interactive latency/cost shows broad invalidation is harmful |
| Pinned derived cuts with explicit updates | Authors demonstrably need live inheritance and have a clear conflict-resolution workflow |
| Resolve-specific OTIO adapter | Another editor or round-trip requirement fails compatibility tests |
| Single-operator CLI credentials | Any multi-user/commercial deployment; revisit provider terms, credential ownership and billing |
| Current retention policy | First paid production media or any deletion automation; define recoverability before enabling it |

## 13. Revised near-term roadmap

| Stage | Concrete exit gate |
| --- | --- |
| **A. Repair current foundation (M1a/R0)** | M1 probes become regression tests and pass; operation serialization/replay works; root-helper issue corrected and live installed version checked by operator; honest editor save state; independent CI; integrated film data baseline green |
| **B. Shared-core consolidation + R1/R2** | One contract family; legacy app independently checkable/buildable with its original routes/assets; Studio/core tests no longer depend on legacy app configuration; root commands explicit |
| **C. M2 plus narrow document/version/import proof** | Two projects isolated; application commands own acceptance; one actual screenplay/premise edit revisions correctly; two cuts do not leak overrides; a small Light Delay import preserves identity/provenance |
| **D. M3 context loop and early knowledge proof** | Revision/version/perspective-correct packages; stale output cannot masquerade as current; Zao record→receive→playback acquisition and audience distinction demonstrated without a universal temporal solver |
| **E. Minimal M4 + initial M5 security** | PostgreSQL adapter matches in-memory behavior; history/head/projection/outbox atomic; request identity scoped transactionally; authorization/RLS tests; restart/recovery and backup basics work |
| **F. First durable Agent Runtime** | One pinned adapter executes under isolated identity; task attempts survive failures; results stay proposals until validated acceptance; stale/retried results cannot double-commit or silently spend again |
| **G. M4.5 Media Plane and first portable export** | Verified blob/location ingestion; private object storage; selected representations and resolved edit feed OTIO; large export runs asynchronously with manifest, rights state, download and retention policy |
| **H. Continue bounded R3/R4 and production migration** | Project-path abstraction supports relocation; production aliases and festival artifact remain valid; broaden workflows from actual usage; media relocation only when materialization/publication adapters are ready |

R3/R4 may run between B and E if the compatibility gates are inexpensive and green; their exact placement is not an architectural dependency. Broad tooling relocation should not interrupt a useful M2 proof. A disposable read-only/proposal-only agent experiment may fit after D, but is explicitly not Stage F’s production integration.

Compared with the proposed `M0/M0.5 → M1 → reorg → M2 → M3 → agents → PostgreSQL → media` sequence, the important changes are:

- M0/M0.5 are substantially present, but the integrated legacy baseline and M1 correctness still need closure.
- Split reorganization into the early app/package boundary and later project/tool/media relocation.
- Move ordinary authoring and version isolation forward so they inform persistence.
- Move minimal authorization and durable execution records ahead of meaningful agent/media work.
- Keep object-storage implementation after the database foundation, while refining identity/representation contracts now.

## 14. Questions or decisions requiring human judgment

These decisions affect product behavior; they should not be guessed from infrastructure preferences.

1. **What is the first useful Studio outcome?** I recommend “write and revise one scene with explicit contextual proposals,” with navigation as supporting evidence. If immediate production-media orchestration matters more, move resolved-edit/materialization work ahead of the first reasoning agent.
2. **How should derived cuts receive later master changes?** Recommended default: pinned derivation plus explicit reviewed updates. Continuous inheritance needs a much stronger conflict UX.
3. **Where is authority intentionally independent?** Can a treatment or screenplay deliberately diverge from approved world facts while remaining a valid authored product? The system needs a visible divergence status and a deliberate promotion path.
4. **What does “Saved” promise?** Local session, durable personal project, shared server revision, or explicitly accepted canon? These are different states and should have different UI feedback.
5. **Who may approve agent-originated changes?** Suggested default: the author approves semantic proposals; narrowly scoped automated housekeeping may use explicit policy. Decide separately whether paid generation is preapproved within a budget.
6. **Which media must survive provider deletion?** Recommended minimum: selected/approved production representations are archived before delivery or publication. Draft provider-only media may remain ephemeral if that is explicit.
7. **What is the retention promise for old revisions and media?** Unlimited binary retention is expensive; deleting bytes changes what historical restoration can deliver. Choose a policy and communicate it.
8. **Which export workflow is authoritative after external editing?** The legacy tool intentionally treats Resolve-exported OTIO as the edit spine. Decide whether Studio will eventually reimport that edit, track it as an independent versioned artifact, or remain an upstream assembly tool.
9. **When does festival protection end, and which deployed revision is the protected artifact?** Record the exact baseline before merging or moving paths. The current failed `master` workflow does not identify what judges are actually viewing.
10. **Is staging exclusively an operator demo or soon a place for real writing?** This determines the urgency of durable saves, access control and backup; the present shell should not be treated as a reliable authoring store.

The architecture is worth continuing. Its next proof should demonstrate that an ordinary filmmaker can safely create, revise, version and recover work while the semantic model assists underneath. That is the strongest test of whether Studio’s rigor is serving the application.

---

## Evidence index

All repository links below are pinned to `1b21883a4be20696fca8efda5261435ca4b4f454` unless labeled otherwise. Workflow links identify the actual reviewed run.

[history]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/packages/v2-core/src/history.ts
[history-tests]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/packages/v2-core/src/history.test.ts
[world]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/packages/v2-core/src/world.ts
[world-tests]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/packages/v2-core/src/world.test.ts
[fixture]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/packages/v2-core/src/light-delay-fixture.ts
[view-model]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/packages/v2-core/src/studio.ts
[context-new]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/packages/v2-core/src/context.ts
[context-old]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/src/lib/v2/context/context.ts
[schema]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/src/lib/v2/schema/schema.ts
[schema-tests]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/src/lib/v2/schema/schema.test.ts
[studio]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/apps/studio/src/routes/%2Bpage.svelte
[health]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/apps/studio/src/routes/health/%2Bserver.ts
[adr1]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/docs/ADR-0001-MULTI-SCRIPT-CONTINUITIES.md
[adr3]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/docs/ADR-0003-STORY-NARRATIVE-PRODUCTION-ARCHITECTURE.md
[domain]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/docs/V2_DOMAIN_MODEL.md
[temporal]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/docs/V2_TEMPORAL_AND_EPISTEMIC.md
[contracts]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/docs/V2_RUNTIME_CONTRACTS.md
[roadmap]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/docs/V2_IMPLEMENTATION_ROADMAP.md
[migration]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/docs/V2_MIGRATION_PLAN.md
[media]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/docs/V2_MEDIA_AND_AGENT_RUNTIME.md
[repo-plan]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/docs/V2_REPOSITORY_STRUCTURE.md
[deploy-doc]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/docs/V2_DEPLOYMENT_AND_ENVIRONMENTS.md
[activate]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/tools/deploy/stage-activate.sh#L26-L51
[remote]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/tools/deploy/stage-remote.sh
[packaging]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/tools/deploy/package-stage.sh
[stage-workflow]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/.github/workflows/studio-staging.yml
[pages-workflow]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/.github/workflows/pages.yml
[stage-run]: https://github.com/saabi/light-delay/actions/runs/35559656972
[pages-run]: https://github.com/saabi/light-delay/actions/runs/35559660827
[master-run]: https://github.com/saabi/light-delay/actions/runs/35546460907
[package]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/package.json
[vite]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/vite.config.ts
[agents]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/AGENTS.md
[project]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/data/project.json
[asset-type]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/src/lib/types/assets.ts
[ledger]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/scripts/lib/higgsfield-media-ledger.mjs
[registration]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/scripts/lib/visual-stretch-result-register.mjs
[export-cli]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/scripts/export-resolve-otio.mjs
[export-lib]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/scripts/lib/resolve-otio.mjs
[export-doc]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/docs/production/RESOLVE_OTIO_EXPORT.md
[playback]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/src/lib/data/selectors/animaticPlaybackSpans.ts
[legacy-studio]: https://github.com/saabi/light-delay/blob/1b21883a4be20696fca8efda5261435ca4b4f454/src/lib/studio/api.ts
[compare]: https://github.com/saabi/light-delay/compare/c2105fcb54772f91337c2fb69c32cfc9061f9e5b...1b21883a4be20696fca8efda5261435ca4b4f454
[pr2]: https://github.com/saabi/light-delay/pull/2
[pr1]: https://github.com/saabi/light-delay/pull/1
