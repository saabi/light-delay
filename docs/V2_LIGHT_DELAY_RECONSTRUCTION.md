# Light Delay legacy data loss and reconstruction policy

Status: **accepted migration/recovery policy**  
Date: 2026-09-23

## Purpose

The legacy Light Delay production repository suffered significant data loss during a period of extensive modifications that were not committed frequently enough. Many affected files became zero-filled. Reconstruction was attempted for many, most, or possibly all known zero-filled files, and those reconstruction attempts were subsequently committed.

As a result, the current repository HEAD must **not** be treated as a uniformly authoritative, internally complete Light Delay dataset.

This document records how Studio development must treat that material. It is not a request to begin full forensic recovery now.

## Immediate policy

1. **Studio V2 is not blocked on repairing the entire legacy Light Delay dataset.**
2. Legacy project-data validation failures are not automatically Studio regressions.
3. Software/build regressions introduced by Studio work remain regressions and should be separated from pre-existing data-integrity failures.
4. Studio will not initially import the entire legacy project wholesale.
5. Git history is evidentiary material and must be preserved. Do not squash/rewrite history merely to simplify repository cleanup.
6. Repository moves should preserve rename/history traceability where practical.
7. Missing or contradictory legacy information may remain explicitly **unknown**. Do not invent continuity to satisfy validators.

## Evidence classes

Future reconstruction should distinguish at least:

- **surviving original** — material with credible continuity from before the data-loss event;
- **last-known-good historical** — a prior Git revision believed to predate corruption;
- **reconstructed** — content recreated after data loss, even when currently at HEAD;
- **derived/corroborated** — content inferred or supported by higher-authority sources;
- **conflicted** — sources disagree and no authority rule resolves them safely;
- **unresolved/unknown** — trustworthy content cannot currently be established.

A reconstructed file does not automatically regain the authority of a surviving original merely because it is the current version.

Confidence and provenance may eventually be recorded per artifact and, where useful, per field/reference rather than only per file.

## Reconstruction direction

When Light Delay becomes useful as a serious Studio migration/acceptance project, begin with a **forensic inventory**, not a bulk importer.

Likely evidence order:

```text
master narrative / master outline and authority records
        |
        v
characters / locations / major objects / story facts
        |
        v
screenplay and authorized derivative products
        |
        v
storyboard / animatic / shot structures
        |
        v
production records / generation ledgers / media references
```

This is an evidence priority, not an assertion that every higher layer is intact.

The master outline and existing authority/lifecycle records are expected to provide the first reconstruction skeleton: characters, locations, important objects, story events, causal facts, knowledge transitions, and scene/sequence relationships. Surviving screenplay material can then restore authored expression. Storyboard/animatic JSON can restore presentation, shots, timing, and visual relationships where evidence supports them.

## Git-history use

Reconstruction-related commits may already identify much of the affected surface. A future forensic inventory should:

1. identify commits whose messages or diffs indicate zero-fill recovery/reconstruction;
2. enumerate affected paths;
3. locate last-known-good pre-loss revisions where possible;
4. compare reconstructed HEAD content with historical versions and higher-authority narrative sources;
5. record conflicts and unresolved gaps;
6. produce a machine-readable recovery/evidence manifest before attempting broad import.

Conceptually:

```text
current artifact
   |
   +-- credible surviving original
   |
   +-- reconstruction commit(s)
   |       |
   |       +-- compare with last-known-good history
   |       +-- compare with higher authority
   |
   +-- corrupt / missing
           |
           +-- historical evidence?
           +-- corroborating references?
           +-- otherwise UNKNOWN
```

## Relationship to CI

The protected legacy application and the damaged legacy project data are separate concerns.

CI should eventually distinguish:

- **application compatibility** — can the protected legacy application still check/build under its supported fixture/baseline?
- **project-data integrity** — what does the current Light Delay dataset validate or fail?
- **Studio correctness** — do Studio and shared packages pass their own checks?

A known data-recovery failure must not be silently reclassified as a V2 application regression. Conversely, damaged data must not be used to excuse a new application/build regression introduced by V2 changes.

## Relationship to repository reorganization

R1/R2 application-boundary work may proceed without full data reconstruction.

R3/R4 project-data/tooling relocation should be conservative because the current paths and Git history are evidence. Introduce project-root/path abstraction before broad moves. Do not perform destructive cleanup of apparently obsolete damaged/reconstructed files until their forensic value is understood.

Media relocation remains deferred to the Media Plane work.

## Relationship to Studio import architecture

Light Delay should eventually exercise Studio's provenance-aware import/reconstruction model, but it must not dictate the first implementation of that model.

The desired future flow is closer to:

```text
legacy evidence sources
  -> discovery / forensic manifest
  -> extraction
  -> interpretation
  -> ImportProposal
  -> validation / reconciliation
  -> human approval
  -> accepted ChangeSet(s)
```

rather than:

```text
current HEAD
  -> bulk import
  -> assume valid
```

The damaged project may become a valuable hard case for Studio because it contains incomplete, historically versioned, reconstructed, contradictory, and differently authoritative evidence. Solving that case is explicitly **not** a prerequisite for building Studio's initial authoring and persistence foundations.

## Deferred work

Do not begin these merely because this policy exists:

- full zero-filled-file reconstruction;
- exhaustive commit-history classification;
- a recovery database;
- bulk Light Delay import;
- repair of every legacy validator;
- media recovery beyond an immediate preservation need.

Start forensic work only when a Studio milestone or preservation requirement justifies it.
