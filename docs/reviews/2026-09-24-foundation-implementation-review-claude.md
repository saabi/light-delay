# Studio foundation implementation review (`implementation/foundation-r1-r2`)

**Repository:** `saabi/light-delay`
**Review date:** 24 September 2026
**Reviewed range:** `5a5c22f..0de28dd` (8 commits) on `implementation/foundation-r1-r2`
**Compared against:** `architecture/v2-domain-model` @ `5a5c22f`, `master` @ `c2105fc`
**Scope:** read-only. Nothing was pushed, committed or deployed. All execution ran in a disposable clone or worktree, which was left clean. I didn't touch any server.

Evidence labels: **[verified]** executed and observed · **[read]** established from code or docs at the cited location · **[inferred]** reasoned, not observed.

Classification (per finding): **A** foundation blocker · **B** fix before M2 · **C** address during M2 · **D** legitimate deferred work · **E** no issue / satisfied / superseded.

---

## 1. Executive assessment

**Is the foundation implementation sound?** Yes. This is a disciplined, well-bounded correction. The strongest evidence:

- **The relocated legacy app builds byte-for-byte equivalent output** to the pre-relocation baseline [verified]. I built `5a5c22f` with only the `/v2` route removed, then built `0de28dd`, both with `BASE_PATH=/light-delay`. Both produce 3,926 files. After normalizing hashed chunk names, all 1,516 prerendered HTML/JSON/XML files are identical. Of 2,409 bundle files, only 2 differ, and only by SvelteKit's per-build random global name.
- `v2-core` is now importable from plain Node.
- The root-code-execution path in the privileged helper is gone.
- Restore now handles absence.

**Is M1 valid within its stated bounded scope?** Yes, for state reconstruction: every revision stores a frozen full snapshot, and restore reproduces the supported state domain. Four residual defects are real, but none invalidates the proof. Each tells M2 something it must do differently, so they are **C**, not blockers:

1. The trusted principal is fixed per history *instance*, not per command.
2. A legitimately accepted history can't be replayed through the "replay oracle" (an empty-op restore checkpoint is rejected on replay).
3. A hostile in-process `Proxy` can make the recorded ChangeSet disagree with the applied state.
4. Restore's "equivalent" projection can differ in occupancy order, and the navigation explanation text changes as a result.

**Are R1/R2 complete enough?** Yes. The aliases in `apps/light-delay/project-paths.mjs` are an honest single seam for R3/R4, not hidden coupling. Git rename tracking is preserved (230 `R` entries; `git log --follow` works).

**Is the deployment repository boundary safe?** Yes, as far as I can find adversarially. I ran the unpatched finalizer as real root against a deployment-user-owned upload. It produced root-owned 0444/0555 fresh inodes, revalidated them on reactivation, and rejected a tampered finalized release. **The only remaining deployment requirement is host installation** of the protocol-2 helpers (plus two small hardening notes in §5). Until that happens, the old root-`require()` helper is still installed and sudo-able on Linode. The new scripts correctly fail closed against it.

**Is Studio ready to begin M2?** **Yes, after three small, cheap corrections (B)** in §9. None requires redesign. The C items should shape M2's first commit rather than delay it.

On the central question: this implementation did **not** prematurely commit the architecture to the wrong persistence, temporal, concurrency or migration model. The one thing that could still leak into M2 by inertia is reusing `InMemoryRevisionHistory` (a `WorldSnapshot`-specific, synchronous, single-principal class) as the M2 store. It must be treated as a fixture proof, not extended.

---

## 2. Verified repository state

### Branches and ancestry [verified]

| Ref | Head | Relationship |
|---|---|---|
| `implementation/foundation-r1-r2` | `0de28dd` | Exactly 8 commits on top of `5a5c22f` (0 behind). Still 2 behind `master`. |
| `architecture/v2-domain-model` | `5a5c22f` | Fast-forward from my previous snapshot `97bd77f` (+12 doc commits, including both reviews and ADR-0004). No history rewritten. |
| `master` | `c2105fc` | Unchanged since the previous review. Common ancestor with both branches is `d797d9c`. |
| `refactor/move-legacy-app` | `72728fb` | Stale ancestor; no unique work (as the index says). |

**Test-merge with `master`** (`git merge-tree`): only `CHANGELOG.md` and `docs/PROJECT_STATUS.md` conflict. `master`'s edit to `src/lib/.../festivalMasterScript.spec.ts` auto-merges through the rename into `apps/light-delay/...`. Integration is cheap *today*.

### The eight commits

| Commit | Content | Assessment |
|---|---|---|
| `3dcffe8` | M1 rewrite (`history.ts`, new `history-contracts.ts`), Studio page honesty, `/v2` route + layout branch removed, v2-core `tsconfig` + own Vitest config | Coherent. Mixes UI and core changes, but they share one intent. |
| `e05035f` | `stage-finalize.py`, protocol-2 `stage-activate.sh`, remote/package changes, 10 filesystem tests, doc | Coherent and well scoped |
| `9b3d9ba` | Restore checkpoints + `WorldStateAbsent` precondition | Small, focused |
| `447195d` | R1/R2 move (230 renames), TypeBox proofs → `packages/v2-core/src/contracts`, pinned inlang plugins, path adapter, script JSDoc paths | Large but reviewable. It silently includes a toolchain bump (`@inlang/sdk` 3.0.2→3.0.6, `@lix-js/sdk` 0.12→0.17). Harmless here because the build output is identical, but that change doesn't belong in a "move" commit. |
| `8690330` | Three workflows, smoke test | Coherent |
| `737a648` | Docs checkpoint | Some claims need correction (§7) |
| `86ae8ef` | Lockfile: optional Linux deps, `peer` flags | Legitimate (native optional bindings) |
| `0de28dd` | `networkidle` waits in e2e; Okoye test moved to the data audit | Legitimate: static prerendered pages show buttons before hydration. It doesn't mask a regression, because the build output is identical to baseline. |

No data, media, `blender/` or `higgsfield-uploads/` content changed in the range [verified by name-status]. No generated output is committed, no secrets are present, and ignores were generalized to `**/src/lib/paraglide/`.

### Tests and CI [verified]

| Check | Result |
|---|---|
| `npm ci` (with lifecycle scripts) | OK |
| `check:v2-core`, `build` v2-core | OK. `dist/` emitted with `.js` extensions (`rewriteRelativeImportExtensions`). |
| `test:v2-core` (own config, no paraglide or CDN) | 4 files, **45 passed** |
| Plain-Node consumer (`import('@light-delay/v2-core')`, `/contracts`) | Works after build. Commits a revision. |
| `check:studio` / `build:studio` | 0 errors / OK |
| `package-stage.sh` + `smoke-stage.sh` | OK; `/health` returns the exact SHA |
| `test:deploy` | 10 passed (run as root here) |
| Legacy `test:compat` | 15 files, **47 passed** |
| Full legacy unit suite | **310/311**. Only `extracted-data.spec.ts` (94 vs 90) fails. |
| Legacy `build:legacy` with `BASE_PATH` | OK; output equivalent to baseline (above) |
| Actions `studio-ci` run 35968795015 (`0de28dd`) | Success |
| Actions Pages run 35968795026 (`0de28dd`) | Success (build job; deploy correctly gated to `master`) |
| Actions `project-data` run 35968795059 (`0de28dd`) | Failure in exactly three steps: `generated:check`, full legacy suite (94 vs 90, `extracted-data.spec.ts#L37`), Okoye e2e |

The implementation report's numbers (45 / 47 / 15 / 10; Studio green, compat green, data red) are **accurate**.

---

## 3. Foundation findings (ordered A → E)

### A. Foundation blockers

**None.**

### B. Fix before M2 (all cheap)

**B1. The compatibility gate is narrower than necessary. Real application tests only run in a permanently red job.**
*Evidence:* `apps/light-delay/package.json` `test:compat` is an allowlist of 13 paths (15 files, 47 tests) out of 52 files (311 tests). Eight excluded files are pure application logic that passes in a sparse checkout [verified: 8 files, 45 tests pass]: `generationFilter`, `generationExpand`, `referenceBudget`, `visualStretch`, `greet`, `image-status`, `selectors`, `generationPresentation`. The full suite passes 310/311.
*Problem:* a regression in these modules would only surface in `project-data`, which is red by design, so it's invisible.
*Consequence if ignored:* M2 will change shared dependencies (TypeBox, lockfile, Vite and Svelte versions). The protection for the judged app then rests on 15% of its unit tests.
*Direction:* run the **whole** unit suite in the compatibility job and quarantine exactly the known data assertion by name (`--exclude` or `test.skipIf` with a tracked reason). Adding new data-dependent tests to the quarantine is then a visible, reviewable act. This is honest classification by exception rather than by allowlist.

**B2. The red data job reports V2-caused staleness as legacy data damage.**
*Evidence:* regenerating `docs/MASTER_RELEVANCE_REPORT.md` shows 24 new rows. **20 are V2 documents** added by the architecture branch (`docs/V2_*.md`, `ADR-0003/0004`, `STUDIO_DESIGN_SYSTEM.md`, both reviews). Only 4 are assets pre-dating the branch [verified]. The index says the failure was "reproduced on unchanged architecture HEAD". That's true, but only because the architecture branch *is* where those docs were added.
*Problem:* this is exactly the misclassification `V2_LIGHT_DELAY_RECONSTRUCTION.md` warns against: a Studio-caused failure filed under "known project-data failure".
*Direction:* exclude Studio/V2 documentation from the Light Delay relevance inventory (it's a *project* inventory), or regenerate the report. This isn't narrative evidence, so regenerating doesn't violate the forensic policy. Correct the index wording.

**B3. Integrate `master` into the implementation line now.**
*Evidence:* the test-merge shows two doc conflicts only. `master`'s 2 commits carry the `inputDigest` schema failure that the index says "does not reproduce". It doesn't reproduce on the branch *only* because the branch predates those commits [verified on `c2105fc` in the previous review].
*Consequence if ignored:* M2 adds more divergence. The eventual merge brings a surprise data failure and larger conflicts across a moved tree.
*Direction:* merge `master` → implementation branch (not the reverse; this doesn't touch the festival deploy). Record `inputDigest` as a known data-job failure.

### C. Address during M2 (should shape the first M2 commits)

| # | Finding | Evidence | M2 direction |
|---|---|---|---|
| C1 | **Attribution is per history instance, not per command** | `RevisionHistoryOptions.trustedPrincipal` (`history.ts` L84, L227–229); `commit(input)` takes no context | Forgery through command content is correctly impossible. But one store can't attribute a human acceptance of an agent- or importer-originated proposal. M2 command handlers must take `(command, trustedContext{principal, onBehalfOf?, requestId})` from the application layer. |
| C2 | **"Accept a command" and "rehydrate an accepted ChangeSet" are the same path** | [verified P1] `restore(1,{baseRevision:1})` appends a legitimate ChangeSet with `operations: []` (L412–414). Replaying that history through `commit()` returns `INVALID_CHANGE_SET` (`minItems: 1`). Replay also re-attributes to the replaying instance's principal and re-timestamps. | The replay oracle isn't total over accepted histories. HistoryStore needs `load(acceptedChangeSets)` that applies stored operations without re-running command validation, attribution or ID assignment. PostgreSQL needs this anyway. **This is the concrete version of your Decision A: no event-sourcing commitment was created, but reconstruction-by-replay must not go through command acceptance.** |
| C3 | **Validate a private copy, not the caller's object** | [verified P4] A `Proxy` whose `key` getter changes after 3 reads is accepted. The projection applied `gravity`, but the stored ChangeSet records `key: 'newKey'`. The audit record disagrees with the state it produced. | Only hostile *in-process* callers can do this; JSON request bodies can't. The fix is one line at the M2 boundary: deep-copy through `JSON.parse(JSON.stringify(x))` or `structuredClone`, then validate and use only the copy. |
| C4 | **Canonical projection form is undefined for set-valued state** | [verified P5] Restoring r3 reports success with 0 ops ("equivalent"), but occupancy order becomes `SORELL,HARLAN` vs. `HARLAN,SORELL`. `findRoute` reports the *first* blocker, so the explanation text changes. `applyOperation` appends (L164–167); equality sorts per entity (L147–153). | Define canonical order when *applying*, not only when comparing (or make consumers order-independent). M2's document projections have the same issue: equality must match what users observe. Use code-point comparison, not `localeCompare` (L139, L148), so stored ops are identical across locales. |
| C5 | **Restore mutates the accepted record after acceptance** | L415–421 replace the stored ChangeSet and revision to add `restoresRevision` | Build the complete ChangeSet (including provenance and restore target) before the atomic append. It's contained in memory, but wrong for an outbox or PostgreSQL. |
| C6 | **The core API is synchronous and fixture-typed** | `commit(): CommitResult`, `ProjectRevision.state: WorldSnapshot` | Design M2 ports as `Promise`-returning from day one, even in memory, so PostgreSQL doesn't force an API rewrite. Make history generic over operation and projection types. **Don't extend `InMemoryRevisionHistory` with document operations.** |
| C7 | **Small parallel source of truth** | `OccupancySchema` (`history-contracts.ts` L17) duplicates `OccupancyBlocker` (`world.ts` L7) | For M2 types, derive TypeScript types from TypeBox (`Static<>`) and don't hand-write interfaces. |
| C8 | **Version semantics to decide inside M2** | Roadmap M2 requires inherited / absent / deliberately-removed | Decide explicitly: (a) **entity identity is project-global; values may be version-scoped**; (b) whether restore scope is (document × version); (c) pin granularity when a derived version records its source. Pinning to a project-global revision makes every unrelated commit look like upstream drift, which legacy avoided with per-outline `sourceOutlineRevision`. M2 doesn't need derivation pins to prove isolation, but it must not assume "one canon" so that continuity can be added later. |
| C9 | **Dead "Ask" button; dist-only exports** | `+page.svelte` L20; `exports` → `dist/` only | "Ask" will become the proposal trigger in M2; until then, remove it. Consider a `source` export condition or `tsc --watch` so Studio dev picks up core edits without a manual rebuild. |

### D. Legitimate deferred work

- The story-time engine (`StateChange`, `stateAt`), which the roadmap places at M3. Removing the coupling is sufficient for now (§8).
- PostgreSQL, idempotency (a retry after success returns `STALE_BASE_REVISION` [verified P8]), and authentication: roadmap M2.5.
- Per-key value typing: `gravity = 42` is accepted [verified P6]. The fixture domain only; it disappears with M3.
- Trusted-clock sanity: a non-monotonic or `'not-a-date'` `now()` is accepted [verified P11/P12]. Ordering is by revision number, so this is metadata only.
- The two Context contract shapes (`contracts/context` vs. `context.ts`): roadmap M4.
- The microgravity tie. Both edges cost 1, so the route is identical in 1g and microgravity [re-verified], and the "Try a temporary scenario → Microgravity" control visibly changes nothing but the label. The fixture is superseded in M3. But **the index still claims "test cases for… microgravity direct crossing"**, and the test accepts either edge. Correct the claim.
- Other e2e files (`generation.e2e.ts` with 11 tests, `reports`, `studio`) run in no workflow. That was also true before.
- `pages.yml` and `project-data.yml` both run on every push to every branch with `lfs: true`, doubling LFS bandwidth per push.
- Deployment: the SHA is a *label* chosen by the deploy identity; the host can't bind content to the Git SHA. Accumulating `.incoming/<sha>` directories. See §5.

### E. Satisfied, or no issue

- Absence and removal restore, including the previously reported added-key defect [verified; §4].
- Runtime command validation: unknown discriminants, extra fields (`principal`, `timestamp`), `NaN`/`Infinity`/`undefined`/`BigInt`/functions, cyclic structures, accessors and `__proto__` own keys are all rejected cleanly [verified P3 + tests].
- Reference integrity for supported fixture operations (mismatched blocker entity, unknown node, unknown entity, duplicate node).
- Revisions are immutable (deep-frozen); caller aliasing after commit has no effect [verified P13].
- Exploratory controls no longer create revisions. "Prototype · not saved" is shown. The lens list is reduced to Write.
- `v2-core` is independent of legacy Vite and paraglide, and Node-consumable.
- The i18n plugins are pinned as npm dependencies, and **the compile step now fails if messages go missing**, so a zero-message compile can no longer pass silently.
- Legacy build compatibility: equivalent output [verified].
- Repository-level privilege boundary (§5).

---

## 4. Milestone 1 review

**Previously reported defect: fixed. [verified]** The test at `history.test.ts` L125–157 adds `newKey`, unsets `gravity` and sets occupancy, then restores r1 and asserts **full-projection** equality (`toEqual(before)` excluding `revision`). It then restores r2 and asserts equality again. That covers both directions: add → remove and remove → re-add. `diffSnapshots` now emits `UnsetWorldState` for keys absent in the target (L191–197).

**Does restore reproduce the historical projection or just claim to?** For the supported domain (declared scalar keys + per-entity occupancy, with fixed topology and locations), it reproduces it, with one exception: set-order (C4). Restore returns `UNSUPPORTED_RESTORE` rather than a false success if topology or locations differ (L174–185). That is the right failure mode.

**Reconstruction.** Each `ProjectRevision` carries a frozen full snapshot, so historical state is reconstructed by lookup. Replay is a test oracle. That matches ADR-0004's hybrid invariant and creates no event-sourcing commitment. The gap is C2: the oracle uses command acceptance and so can't replay every accepted history.

**Validation boundary.** It goes `isJsonData` (L56–77: plain prototypes only, data descriptors only, finite numbers, dense arrays, acyclic) → TypeBox with `additionalProperties: false` at every object level → reference checks (L294–314) → base revision → preconditions → apply. Unknown operation types can no longer crash the engine, and a batch containing one invalid operation is rejected whole (tested, L185–195).

**Attribution.** Principal, timestamp and ChangeSet ID come only from constructor options (`trustedPrincipal`, `now`, `idFactory`). Extra command fields are rejected, not ignored (tested, L201–202). Attribution "survives replay" only in the trivial sense that the test compares stored JSON; a replay re-attributes (C2). For M2, move attribution to a per-command trusted context (C1). The core doesn't need rewriting for that: only the call signature changes.

**Preconditions and conflicts.** The global `baseRevision` check still runs *before* preconditions (L327–337), so today every precondition is additional to a global lock. The contract already carries semantic preconditions (`WorldStateEquals`, `WorldStateAbsent`, `OccupancyEquals` with set semantics, tested at L279–311). Making `baseRevision` informational later is a local change to one schema field and one `if`. **The path to read-set conflicts is open (your Decision B holds).**

**Equality.** Canonical JSON with sorted keys (L133–145) is deterministic within one runtime. `localeCompare` should become code-point comparison (C4). `-0` and `0` compare equal both in the diff (`!==`) and in the canonicalization. Fine.

**What the tests prove and don't prove.** They prove the bounded invariant: faithful restore, rejection of malformed input, immutability, and state equality under JSON round-trip. They don't cover: replay of an empty-op checkpoint (C2), multi-entity occupancy order (C4), hostile in-process objects (C3), or restore → restore → commit chains across *both* state and occupancy. Add the first two when you do C2 and C4.

---

## 5. Deployment and security review

### Repository implementation: the previous RCE is closed

- Root never loads release JavaScript. Manifests are parsed with `json.loads` inside a **root-owned copy** (`stage-finalize.py` L77–83). `stage-activate.sh` runs as `bash -p` with a fixed `PATH`, unsets `NODE_OPTIONS`/`PYTHONPATH`/`PYTHONHOME`, and calls `python3 -I` (isolated). sudo's `env_reset` covers the rest.
- **Fresh trusted inodes [verified as root].** `copy_tree` opens every component via `dir_fd` with `O_NOFOLLOW` (`O_DIRECTORY` for directories, `O_NONBLOCK` for files), `fstat`s the opened descriptor, and writes to `target.open('xb')` (O_EXCL) inside a root-only `mkdtemp`. Resulting files are root-owned `0444`, directories `0555`. A writer holding an open descriptor on the upload can't alter the copy (tested). Stat-then-open swaps fail closed: a symlink gives `ELOOP`, a FIFO fails the `S_ISREG` check after the non-blocking open.
- **Hardlinks** (`st_nlink != 1`), **special files**, **absolute symlinks** and **escaping relative symlinks** (`resolve(strict=True).relative_to(root)`) are rejected. Symlinks are allowed only under `node_modules`. The manifests and entrypoint may have no symlink component. Symlink loops raise `RuntimeError`, which is caught, so the helper fails closed.
- **Repeat activation revalidates** ownership, permissions and `nlink` without recopying. I made one file `0644` as root, and revalidation rejected it ("Release is not immutable") [verified].
- **Path and SHA:** the requested path must equal exactly `releases/.incoming/<sha>` or `releases/<sha>`, and `release.json.revision` must equal the SHA. `secure_directory` requires every ancestor of `releases` to be root-owned and not group- or world-writable.
- **Old host protocol:** `stage-remote.sh` L31 requires `--protocol-version` = `2`. The v1 helper prints usage and exits 2, so deploys **fail closed** without ever reaching the vulnerable path.
- **Rollback** never runs migrations or package scripts. The activation helper rolls back on immediate restart failure (L18–27), and the deploy script rolls back on health failure (L49–63). Both revalidate the previous release before relinking.
- **Migrations:** removed from activation. The documented future path is a fixed, admin-installed entry point with a separately authorized SHA. That's a safe design and needs no code now.

### Residual notes (none blocks M2)

1. **Host installation is the only remaining deployment requirement.** Until it happens, `/usr/local/sbin/studio-stage-activate` on Linode is still the v1 helper, and `studio-deploy` can still sudo it. **The root-RCE exposure exists on the host today**, reachable by anyone holding the staging SSH key. Staging deploys currently fail closed, so no *new* deploy will use it, but the sudo rule should be switched now. Classification: **B for staging use**, independent of M2 code.
2. **Lock file location.** `exec 9>/run/lock/studio-stage-activate.lock` runs as root in a world-writable sticky directory. With the standard `fs.protected_symlinks` and `fs.protected_regular` protections enabled (I didn't verify the host's sysctls), a pre-planted link or file results in a denied open (a denial of service), not a clobber. Still, put the lock in a root-owned directory such as `/run/studio-stage/` created by the admin, so safety doesn't depend on sysctl defaults. Do this at host install.
3. **Tests patch out the privileged checks.** `test_stage_finalize.py` L30–40 replaces `secure_directory` and runs `validate(..., finalized=False)` even for finalized releases. The root-ownership, write-bit and `nlink` checks, and reactivation revalidation, are therefore never exercised in CI. I exercised them manually as root, and they behave correctly. GitHub runners have passwordless sudo, so add one CI step that runs a real finalize under `sudo` against a `/srv`-like root-owned directory. (D, but do it before trusting future edits to the helper.)
4. **Health-based rollback is driven by the deploy identity.** That's acceptable: it can only request activation of an already-finalized, revalidated release.
5. **The SHA is attestation by the deploy key**, not content binding. Acceptable for staging (D).

Adversarial items with no issue found: tar contents (extracted unprivileged; only the post-copy tree matters), environment injection, command substitution (only the finalizer's printed path is used), and privilege confusion. `studio` can read but never write releases or `current`; `studio-deploy` can write only `.incoming`; root never executes release content.

---

## 6. Repository and workspace review

### R1/R2

- **The application boundary is real.** `apps/light-delay` owns its `package.json`, `vite.config.ts`, `tsconfig`, Playwright config, `messages/`, `project.inlang/`, paraglide config and compile guard. Root scripts delegate through `--workspace @light-delay/legacy`. The root is now monorepo control plus deliberately unmoved project evidence (`data/`, `scripts/`, `static/`, `blender/`, `higgsfield-uploads/`), which is correct under the reconstruction policy.
- **The path seam is honest.** `project-paths.mjs` defines `$project-data`, `$project-tools`, `$project-static` and `$legacy-project`, used in 89 places. `files.assets = mediaRoot` keeps `static/` as the asset root, which is why the output is identical. The app's runtime dependence on root `scripts/lib/*.mjs` (10 non-test imports, such as `dialogue-timing.mjs` and `report-runner.mjs`) **predates** R1. The alias now makes that coupling visible and changeable in one file instead of hiding it in `../../../../` paths. Only one deep relative path remains: a fixture string in `legacyMediaPaths.spec.ts`. That's a good R3/R4 seam.
- **Remaining reverse coupling:** root scripts reference app types in JSDoc (`import('../../apps/light-delay/src/lib/types/script.ts')`). These are types only, so harmless. Note them for R4.
- **Pages base path:** verified through the `BASE_PATH=/light-delay` build and the Pages CI run.

### `v2-core`

- **Independent: yes [verified].** `NodeNext` + `rewriteRelativeImportExtensions` emits `.js`-suffixed ESM. `exports` has `types`/`default` for `.`, `./contracts` and `./context-contracts`. It has its own `vitest.config.ts`, and its only runtime dependency is TypeBox. No Svelte or Vite imports.
- **Build lifecycle:** there's no `prepare`, so a fresh `npm ci` leaves `dist/` absent until something builds it. Studio's `pre*` hooks do this; a Node tool or worker added in M2 must too (C9).
- **Schema authority:** a single TypeBox family inside `v2-core` (`history-contracts.ts` for M1 commands; `contracts/schema` for the ontology proof). No legacy `src/lib/v2` copy remains. The serialized-schema caveat is documented rather than hidden. The residual duplication is `OccupancySchema` vs. `OccupancyBlocker` (C7) and the two Context shapes (D).

---

## 7. CI and legacy-data separation

**The three-way separation is genuine:**

| Workflow | Role | Status |
|---|---|---|
| `studio-ci.yml` | core, Studio, deploy helpers, packaged smoke | Green |
| `pages.yml` | legacy check, compat unit tests, 15 e2e, `BASE_PATH` build; deploys only from `master` | Green |
| `project-data.yml` | data validators, generated artifacts, full suite, Okoye audit | Red |

The staging workflow no longer runs `check:legacy`, so Studio deploys don't depend on the legacy toolchain. Nothing was deleted: the 94-vs-90 assertion and the Okoye test still run, just in the audit job. Both are honestly test/data disagreements that predate the implementation. `CHANGELOG` records the 94 → 90 joins, and the Okoye wording is absent from unchanged `data/voice-profiles.json`.

**Where the separation is weaker than it looks:**

1. **Allowlist rather than quarantine** (B1). 45 passing application tests are excluded from the green job.
2. **A Studio-caused failure sits in the red job** (B2): the relevance-report staleness.
3. **A permanently red job carries no signal.** Once B1 and B2 are done, turn `project-data` into "fail on *new* failures". Keep a checked-in list of known failures (test name or validator plus reason), and fail on anything else. That keeps the forensic posture (known damage is recorded, not repaired) while making new damage visible.
4. **Festival deploy posture changed without being called a decision.** Once this lands on `master`, the Pages job that deploys the **judged** site no longer runs `validate:data`, `generated:check`, the causal validators, `validate:docs` or `validate:translations`. Previously, a data failure *blocked* updating the judged site; now a damaged data commit on `master` could deploy. Given the reconstruction reality, that may well be the right call. But it's a festival-protection decision, and it sits alongside the still-open freeze question (§8, "Legacy build compatibility"). Record it before merging to `master`.
5. **Doc accuracy (fix with B2):**
   - "Older review's missing-inputDigest failure does not reproduce": true only on this branch (B3).
   - "`generated:check`… reproduced on unchanged architecture HEAD": the cause is V2 docs (B2).
   - "Test cases for… microgravity direct crossing": the test doesn't distinguish the two routes (D).

---

## 8. Reconciliation with my previous review

| Previous recommendation | Implementation response | Current assessment | Class |
|---|---|---|---|
| **Project revision ≠ story-time state**; M1 conflated them | ADR-0004 separates four tiers. Studio controls are now local, labelled temporary and non-authoritative. `stateAt` deferred to M3. | **Sufficient for this milestone.** My proposal to build the story-state primitive before M2 was stronger than needed: M2 (documents, drafts, versions) doesn't read story-time state. One caution: M1's tests still revision a key called `gravity`. That's fine as a fixture, as long as M2 doesn't adopt `WorldSnapshot` as project state (C6). | **E** |
| **Durable provisional tier** (Draft/Proposal/Scenario) | ADR-0004 tier + M2 scope | Nothing in the code obstructs it. Studio no longer implies persistence. | **E** (built in M2) |
| **Restore correctness** | `UnsetWorldState`, full-projection tests, checkpoint restore | Fixed within the bounded domain. Residuals C2, C4, C5. | **E** / C |
| **Read-set concurrency** | Deliberately deferred; preconditions retained | The path is open (§4). I agree with letting M2's real workflow choose the granularity. My earlier "design it now" was premature **provided** M2 commands carry preconditions and treat `baseRevision` as informational wherever they can. | **E** |
| **Versioned aggregates instead of replay/upcasting** | Hybrid invariant: snapshots/checkpoints for reconstruction, replay as verification | **Adequately superseded.** My concrete worry was replay-with-upcasters becoming the correctness path. The implementation stores snapshots and uses replay only as an oracle, so that worry doesn't apply. The real residual is narrower and different: rehydration must not go through command acceptance (C2). Aggregate versions stay an M2.5 storage option, not a requirement. | **E** |
| **Cut / continuity / pin semantics** | M2 to prove two-version isolation first | A safe incremental strategy. One invariant must be decided *during* M2 rather than imported from legacy: project-global identity with version-scoped values, and the scope of restore and pins (C8). Continuity can wait, as long as M2 doesn't hard-code "single canon" into value resolution. | **C** |
| **Legacy build compatibility**; festival freeze | `/v2` removed; build gate added; output proven equivalent; **no freeze adopted and none recorded** | Build compatibility: fully satisfied. **The freeze recommendation was neither adopted nor recorded as declined.** It doesn't block M2 work on the branch, but decide it before the implementation line merges to `master`: `master` still auto-deploys the judged site, and that job now skips data validation (§7.4). | Build: **E**; freeze: **D**, triggered by the merge to `master` |
| **v2-core independence** | Built package, `.js` imports, own config | Satisfied [verified]. | **E** |
| **Staging privilege boundary** | Protocol-2 finalize/activate; no migrations in activation | Satisfied in the repository [verified as root]. Host install pending (§5.1). | Repo **E**; host **B** for staging |
| **PostgreSQL timing** (minimal PG before Context) | M2.5, before M3/M4 | Adopted. Watch the sync API (C6). | **E** |
| **ResolvedEdit** (I suggested doing it in legacy now) | Studio M6 | Acceptable. My suggestion was an optional legacy fix, not a Studio dependency. Nothing in this foundation needs it earlier. | **D** |
| **Context Engine scope** (revision + cut + story point + perspective) | Adopted in roadmap M4 exit criteria | Satisfied as architecture. The code is still the fixture resolver. | **D** |
| **Agent Runtime after Drafts and durable records** | Roadmap M5 | Adopted. | **E** |
| **Media Plane** (N:M binding; register LFS rather than move) | Roadmap M6 includes the binding; media relocation deferred | Adopted in direction. | **D** |
| **Repository R1/R2 on the integrated line, R3/R4 later** | Done; R3/R4 explicitly deferred for forensic reasons | Satisfied, and better justified than in my review. The forensic argument is stronger than my integration argument. Integration still matters (B3). | **E** |
| **First real product proof = authoring** | M2 authoring slice | Adopted. | **E** |
| **Pinned i18n plugins; fail on empty compile** | Done | Satisfied [read + verified build]. | **E** |

Where I remain convinced that part of the trade-off needs attention, it's only C1/C2/C6. The concrete failure mode: if M2 extends the current class, the first cross-principal acceptance (an agent or fake proposer's suggestion accepted by a human) either can't be attributed correctly or forces a store-per-principal workaround. The first PostgreSQL load path would also have to re-run command validation against historical state, which fails for checkpoints and will fail for any operation whose validation rules change.

---

## 9. M2 readiness

**Ready, with these prerequisites (all B, total well under a day):**

1. **B1:** run the full legacy unit suite in the compat job and quarantine exactly the known data assertion by name.
2. **B2:** scope the master-relevance inventory away from Studio docs (or regenerate it), and correct the three inaccurate index claims.
3. **B3:** merge `master` into the implementation line. Record `inputDigest` as a known data-job failure.

**Deployment (parallel, not an M2 code prerequisite):** install the protocol-2 helpers on Linode, **remove the v1 sudo target**, and move the lock to a root-owned directory. After that, run `sudo -u studio-deploy sudo -n /usr/local/sbin/studio-stage-activate --protocol-version` and require `2`. Only then deploy an M2 build to staging.

**First commits of M2 (C, not prerequisites):** C1 per-command trusted context, C2 separate rehydration from acceptance, C6 async and generic ports, C3 copy-then-validate. These are cheapest while the code is small, and every later M2 test depends on them.

---

## 10. Recommended next implementation boundary

The smallest coherent M2 session, in commit order:

1. **Application ports.** Types derived from TypeBox, all methods `Promise`-returning:
   - `ProjectStore.forProject(id)` → `{ history, documents, drafts }`;
   - `HistoryStore.append(changeSet)` / `load()` / `at(revision)`;
   - `DraftStore.save/get/list/discard`;
   - a `UnitOfWork` in which accepting a proposal appends the ChangeSet and updates the projection atomically.

   The in-memory adapter goes behind them. `InMemoryRevisionHistory` stays as the M1 fixture proof and isn't extended.
2. **Command handling.** `handle(command, trustedContext)`: deep-copy → TypeBox → authorization stub → semantic and read-set preconditions → build the *complete* ChangeSet (provenance, `proposalId`, `restoresRevision`) → append. Plus a separate `rehydrate(changeSets)` path. Add a replay-oracle test that includes an empty-op checkpoint.
3. **Document model (minimal).** A screenplay document made of ordered elements with stable IDs (scene heading, action, character, dialogue). Operations: `InsertElement`, `UpdateElementText`, `RemoveElement` (tombstone), `MoveElement`. Canonical ordering by explicit order keys, not array position.
4. **Draft.** Durable within the store: `{id, projectId, principal, baseRevision, documentId, versionId, content}`. The UI's "Saved" means the Draft is persisted in the store. Editing never creates revisions.
5. **Proposal.** A deterministic fake proposer derives semantic operations from a Draft diff (for example, a changed dialogue line → `UpdateElementText`). Accept → ChangeSet attributed to the accepting human, `onBehalfOf` the proposer. Reject → the Proposal is marked rejected, and history and projection are unchanged (test this).
6. **Two versions.** A festival cut and a trailer share entity IDs. Values are resolved as *explicit | inherited | tombstoned*. Test that a deliberate trailer-only line change doesn't leak into the festival cut, and that removing a line in one version is distinguishable from never having it.
7. **Scoped restore.** Restore one document in one version to revision N, as a new ChangeSet. Other documents and versions stay untouched. Full-projection equality, including element order, within scope.
8. **Studio Write surface bound to queries and commands.** Remove "Ask" until step 5 drives it. No other lenses.

Out of scope for this session: PostgreSQL, authentication beyond a local trusted principal, story-time state, Context, agents, media, R3/R4, Light Delay import (use a small hand-authored non-Light-Delay screenplay plus one Light Delay scene as fixtures), and continuity lines.

---

### Appendix: probes run (disposable test file, then deleted)

| Probe | Observation |
|---|---|
| P1 | `restore(1,{baseRevision:1})` → ok, 0 ops. Replaying the JSON history via `commit()` → `INVALID_CHANGE_SET`. |
| P3 | `JSON.parse` command containing an own `"__proto__"` key inside an operation → rejected. |
| P4 | `Proxy` with a mutating `key` getter → accepted. State changed `gravity`; the stored op says `newKey`. |
| P5 | Occupancy for two entities at the same node; clear and re-add one; restore r3 → ok with 0 ops; order flips; route explanation changes from HARLAN to SORELL. |
| P6 | `SetWorldState(gravity, 42)` accepted. |
| P8 | Identical command retried after success → `STALE_BASE_REVISION` (no idempotency). |
| P9 | Initial snapshot with duplicate blockers for the same entity and node → accepted by the constructor. |
| P11/P12 | Non-monotonic and non-ISO trusted clock values accepted. |
| P13 | Mutating the caller's command after commit → no effect on the stored ChangeSet or projection. |
| P15 | `WorldStateEquals(expected:false)` on an absent key → correctly fails. |
| Build equivalence | `5a5c22f` (with `/v2` removed) vs `0de28dd`, `BASE_PATH=/light-delay`: same 3,926 files; 1,516 non-bundle files identical after normalizing hashed names; 2 of 2,409 bundle files differ, only by the random `__sveltekit_*` global. |
| Finalizer as root | Real `/srv/studio` layout; upload owned by an unprivileged user; finalize → root 0444/0555, contained symlinks preserved; reactivation revalidated; a chmod-tampered finalized release rejected. |
