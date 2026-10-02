# V2 media and Agent Runtime contracts

Status: **M0.5 architecture contract; infrastructure is intentionally deferred**.

This document records the boundaries needed before Studio grows beyond the navigation proof. It does not select a storage vendor, install external AI CLIs, provision workers or introduce PostgreSQL persistence.

## Architectural planes

Studio separates three responsibilities:

```text
Semantic/Data Plane
  projects, revisions, ChangeSets, provenance, context and integrity

Media Plane
  logical assets, immutable blobs, provider locations, derivatives and exports

Execution Plane
  Agent Runtime, provider adapters, generation/transcode/render/export jobs and queues
```

The planes may initially be co-deployed, but their contracts must not collapse into one filesystem or one web request lifecycle.

## Media identity and storage

The identity invariant is:

> Provider is provenance; storage location is availability; `MediaAsset` is creative identity; `AssetBlob` is byte identity.

### Logical model

```ts
MediaAsset       // the logical creative/production asset
AssetBlob        // one immutable byte representation of that asset
StorageLocation  // one place where a blob is currently available
GenerationRecord // provider/model/job/input/output provenance
AssetRelation    // input/output, derivative/proxy or replacement relationship
RightsRecord     // licensing, ownership, territory, expiry and usage constraints
```

`MediaAsset.id` is Studio-owned and remains stable across providers and representations. A provider asset ID, provider URL or object-store key is never the canonical Studio asset ID.

An `AssetBlob` owns byte identity and integrity data such as:

- content checksum and algorithm;
- byte size;
- MIME type, codec and container metadata;
- dimensions, frame rate, sample rate and duration where applicable;
- representation role, such as original, archive, proxy, thumbnail, extraction or master.

An `AssetBlob` may have multiple `StorageLocation` records. A location identifies availability, not creative identity. Locations may point to provider storage, Studio-managed object storage, local development storage or archive storage. Provider URLs are treated as expiring/external references rather than permanent identities.

Generation and provenance records connect assets to provider, model, adapter version, provider job, prompt/specification, input assets, output assets, operator/agent principal, timestamps and source revision. Provenance must remain queryable after a blob is mirrored.

Asset relations are semantic rather than path conventions:

```text
source asset -> generated output
source blob  -> proxy/thumbnail/transcode
audio/video  -> extracted representation
draft        -> approved/master representation
```

Rights metadata travels with the logical asset and relevant representations. Missing rights information is explicit; it is not inferred from a provider URL.

### Materialization lifecycle

Availability is modeled independently from identity. A useful initial vocabulary is:

```text
provider-only       // usable through a provider location while retained there
mirrored            // Studio has copied one or more immutable blobs
studio-managed      // required approved representations are in managed storage
unavailable         // no currently usable location
```

The names are contract vocabulary, not a requirement that one enum be persisted forever. Transitions are recorded as provenance/materialization events and are idempotent. Approved assets must eventually be preservable without depending on provider retention policies.

### Managed storage abstraction

Long-term Studio-managed bytes use an S3-compatible object-storage abstraction. The first implementation may target Linode Object Storage, S3, R2, Backblaze or another compatible provider, but the choice must not leak into creative/domain contracts.

The abstraction should support:

- immutable upload and checksum verification;
- ranged reads and resumable transfers;
- metadata/head operations;
- lifecycle and retention policy hooks;
- signed, time-limited access;
- location health and re-materialization checks.

The database owns identity, relationships, metadata, provenance, authorization and the logical Studio asset URI/identifier namespace. Object storage owns large immutable bytes. A physical key is stored as one `StorageLocation`, never substituted for `MediaAsset.id`.

## Export and materialization

Timeline/interchange export is a packaging operation integrated with provenance, dependency and staleness tracking. Formats may include OTIO, FCPXML, AAF or formats already supported by repository tooling.

### Linked export

Linked export contains timeline/interchange metadata and references existing media locations where the receiving tool can use them. It is small and may remain provider-linked when policy permits. The manifest records the exact project revision, asset/blob IDs, locations and rights assumptions.

### Portable export

Portable export resolves and materializes every required representation into a self-contained package. It can be many gigabytes or larger and must not be proxied through a normal SvelteKit request.

Future flow:

```text
export request
  -> durable ExportJob
  -> dependency/revision snapshot
  -> resolve blobs and rights
  -> package in object storage
  -> signed, expiring download
```

Large export jobs belong on the Execution Plane. The package manifest remains inspectable and reproducible from the source revision; a failed or stale job is not silently presented as current.

## Agent Runtime contract

The Studio web process does not own authenticated coding/reasoning CLI environments. The provider-neutral flow is:

```text
Studio -> AgentTask -> Agent Runtime/Worker -> Provider Adapter
                                           -> CLI, direct API, service credential or local model
```

An `AgentTask` contains typed task intent, project/revision context, authorized inputs, requested result contract, principal and policy. It does not hand an agent arbitrary access to project JSON or the server filesystem.

Typed runtime results include:

```text
proposed ChangeSet(s)
artifacts and artifact references
diagnostics/findings
usage/cost information when available
execution and provider provenance
```

Agents propose or submit semantic operations through the same validation/history boundary as humans and importers. They do not directly mutate arbitrary project JSON. Context packages are revisioned and provenance-bearing so an execution can identify what it saw.

### Runtime isolation

The eventual staging deployment should have a distinct runtime identity, for example:

```text
Unix account: studio-agent
Service:      studio-agent-stage.service
```

The exact service topology is deferred. CLI credentials, configuration, caches and provider authentication live outside immutable application releases and outside the public Studio web process. The runtime uses explicit service principals/capabilities and least-privilege filesystem/network access.

Personal interactive CLI subscription authentication must not be treated as the commercial multi-user product's only credential model. Provider adapters remain able to use CLIs, direct APIs, service credentials, local models or later execution mechanisms.

## Agent CLI registry

The repository owns a registry/contract for external agent tools without installing them during ordinary dependency installation.

The eventual interface is explicit:

```text
npm run agents:install
npm run agents:update
npm run agents:check
npm run agents:versions
```

The registry records at least:

- provider/adapter ID;
- executable name;
- intentionally pinned version;
- installation strategy;
- detected installed version;
- compatibility/readiness;
- detectable authentication status;
- enabled/disabled state.

`agents:install` installs declared versions. `agents:update` deliberately changes pinned versions; it never means “whatever is latest today.” Installation and authentication are separate operations. Authentication is operator/runtime configuration and is not performed by GitHub Actions.

There must be no generic `postinstall` that installs, upgrades or authenticates external AI tools. Normal `npm install` and `npm ci` remain deterministic application dependency operations.

## Sequencing

M0.5 establishes these contracts. First implementation follows the roadmap:

1. M1 semantic ChangeSets and immutable revisions;
2. M2 in-memory ProjectStore/application boundary;
3. M3 invalidation and Context Engine re-resolution;
4. M3.5 first isolated Agent Runtime integration;
5. M4 PostgreSQL foundation;
6. M4.5 media/blob/location persistence, object storage, materialization, derivatives and export packaging.

No external AI CLI is installed or authenticated as part of M0.5 or M1.
