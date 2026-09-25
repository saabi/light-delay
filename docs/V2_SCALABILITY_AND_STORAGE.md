# V2 scalability, persistence and tenant security

Status: **architecture direction; deploy simply first**.

## Goal

Design for horizontal application scaling and future database sharding without paying the operational cost of a distributed system before measurements require it.

Core rule:

> Build shardability now; build shards when needed.

## Boundaries

- **Workspace** is the commercial, collaboration and authorization boundary.
- **Project** is the primary authoritative data-locality and future sharding boundary.
- **User/principal identity** is global.
- A project belongs to exactly one authoritative project-data shard at a time.
- Cross-project operations are application workflows, not distributed SQL transactions.

A workspace may eventually have projects on several shards. Therefore workspace is not itself the mandatory physical shard key.

## Initial deployment

Start with:
- stateless SvelteKit/Node web/API instances;
- PostgreSQL + pgvector;
- object/blob storage;
- one background worker process/service as soon as expensive asynchronous work exists.

The same logical architecture can later run many web/realtime/worker instances.

## Application workloads

Keep conceptual separation even if initially co-deployed:

```text
WEB/API       short interactive SvelteKit requests
REALTIME      collaboration/presence/SSE/WebSocket
WORKERS       imports, validation, embeddings, generation, media/agent jobs
SCHEDULERS    indexing, staleness, maintenance
```

Do not perform expensive AI/video/import/full-project jobs inside normal HTTP request lifetimes.

## Project-scoped persistence boundary

Application/domain code must not depend on one global database connection.

Prefer an abstraction such as:

```ts
const store = await projectStores.forProject(projectId);
```

The resolver uses the project directory to select the current authoritative shard.

Most project-owned records carry `project_id`. Include `workspace_id` where it materially improves local authorization, auditing, partition pruning or integrity, but do not rely on a remote workspace join for row security.

## Control plane and project data plane

At scale, separate:

### Control database
- global principals/users;
- workspaces;
- workspace membership and role source of truth;
- projects;
- project -> shard assignment;
- subscription/billing;
- global policy/configuration.

### Project-data shards
- semantic domain;
- documents;
- ChangeSets/revisions/snapshots;
- relationships and projections;
- findings;
- production metadata;
- embeddings for project-local retrieval;
- **local authorization projection** sufficient to enforce shard RLS.

## Row-level security across databases

PostgreSQL RLS evaluates policies inside the database executing the query. Do **not** make project-shard policies synchronously query the control database.

Instead, replicate/project the minimum authorization facts needed by each shard.

A project shard may contain:

```text
auth_principal
  principal_id
  status/version

auth_project_grant
  project_id
  principal_id
  role/capabilities
  membership_version
  revoked_at

project
  project_id
  workspace_id
  auth_epoch
```

These are authorization projections, not the global membership source of truth.

### Request flow

```text
authenticated request
  -> application verifies identity/token
  -> control-plane/project directory resolves project -> shard
  -> acquire shard transaction
  -> SET LOCAL app.principal_id
  -> SET LOCAL app.project_id
  -> optional SET LOCAL app.auth_epoch / request metadata
  -> queries execute under local RLS
```

Example conceptual policy:

```sql
USING (
  project_id = current_setting('app.project_id', true)::uuid
  AND EXISTS (
    SELECT 1
    FROM auth_project_grant g
    WHERE g.project_id = project_table.project_id
      AND g.principal_id = current_setting('app.principal_id', true)::uuid
      AND g.revoked_at IS NULL
      AND g.capabilities @> ARRAY['read']
  )
)
```

Write policies use `WITH CHECK` and capability-specific tests.

The exact schema/policy implementation must be security reviewed before production.

### Why not postgres_fdw for authorization?

`postgres_fdw` can access another PostgreSQL server, but remote membership lookup in the hot authorization path would couple every project query to:
- control-database availability;
- network latency;
- cross-database credentials/mappings;
- more complex failure semantics;
- difficult transactional/revocation reasoning.

FDW may be useful for administration/reporting/migration, but is not the primary RLS authorization mechanism.

## Authorization projection synchronization

Control-plane membership changes publish durable authorization-change events, preferably through a transactional outbox.

Consumers update affected shard-local authorization projections idempotently.

Every authorization event carries a monotonic membership/auth version or epoch.

The system must define revocation semantics explicitly:
- ordinary role/membership changes propagate asynchronously with a small bounded target latency;
- security-critical revocation can also mark the principal/project grant invalid at the request-routing/control layer immediately;
- privileged/high-risk commands may require a fresh control-plane authorization check;
- shard grants reject stale epochs where the selected policy requires freshness.

This gives defense in depth without making ordinary data queries depend synchronously on the control DB.

## RLS is defense in depth, not the whole authorization system

Application authorization still decides whether a command/tool/action is allowed. RLS protects rows if application filtering is missing or incorrect.

Use:
1. authenticated principal;
2. application command authorization;
3. project-scoped repository/store;
4. database RLS;
5. audit/ChangeSet principal attribution.

Database application roles must not own protected tables or have `BYPASSRLS`. Table owners normally bypass RLS unless forced, so production ownership/runtime roles must be separated and `FORCE ROW LEVEL SECURITY` considered for protected tables.

Workers/agents use explicit service principals/capabilities rather than an unrestricted application superuser whenever practical.

## Connection pooling and session context

Because pooled connections are reused, authorization context must be transaction-local.

Set request identity with `SET LOCAL` / transaction-local configuration after beginning the transaction and before protected queries. Do not leave tenant/principal context as durable session state.

Repository helpers should make it difficult to execute project queries outside a correctly initialized transaction.

## Sharding progression

1. one PostgreSQL primary + pgvector;
2. connection pooling/read replicas where useful;
3. partition large tables where measurements justify it;
4. introduce control DB + multiple project shards;
5. move specialized derived indexes/services only when needed.

A project can be migrated between shards by controlled copy/catch-up/cutover while its directory entry remains the routing authority.

Do not split one project's authoritative mutation transaction across shards.

## Cross-project operations

Copy/import instead of distributed mutation:

```text
read Project A
 -> create proposal/export
 -> accepted ChangeSet in Project B
```

No two-phase commit is required.

Cross-project/workspace search may use an authorized derived search/vector index. Search results carry project/source/revision/provenance and authoritative content is re-read from its owning shard before consequential use.

## ChangeSets and asynchronous derived work

Authoritative mutation transaction writes:
- the complete ChangeSet and metadata-only ProjectRevision;
- affected document × version checkpoints/current projection and document version;
- the project head;
- the transactional outbox record.

Proposal acceptance must additionally lock/verify that the Proposal is still pending and that its scoped document-version precondition still holds, then atomically append the complete accepted record, update affected authority/head state, and transition the Proposal to accepted. Any failure rolls back the entire transaction. Proposal rejection is a conditional pending-to-rejected transition. The in-memory M2 adapter implements the same externally observable all-or-nothing contract; M2.5 must implement it with PostgreSQL transactions rather than split writes.

Canonical persistence rules are explicit: opaque IDs use the supported ASCII alphabet and byte-reproducible ordering, authored Unicode text rejects NUL and malformed surrogate values without locale normalization, and stored timestamps are valid canonical UTC instants. Database collations must not be treated as semantic ordering authority.

Workers consume outbox events for:
- validation;
- embeddings;
- search indexing;
- cache/materialized-view invalidation;
- staleness/dependency work;
- notifications.

Consumers are idempotent. Derived indexes are rebuildable.

## Vector and full-text scaling

Begin with PostgreSQL full-text + pgvector.

Vector embeddings are derived projections, never authority. The Context Engine talks through retrieval interfaces rather than pgvector directly.

If scale later warrants a dedicated vector/search cluster, project-local authoritative storage remains unchanged.

## Media

Large image/video/audio bytes live in object storage/CDN, not PostgreSQL.

PostgreSQL stores Studio `MediaAsset` identity, `AssetBlob` checksum/metadata, provenance, authorization relationship and `StorageLocation` records. Provider IDs/URLs and object-store keys identify provenance or availability, never the canonical creative asset.

Prefer direct/presigned transfers so large media need not transit Node instances.

Linked and portable editing exports are distinct packaging operations. Portable exports resolve required blobs asynchronously into object storage and expose a time-limited signed download rather than proxying large payloads through the web process. See `V2_MEDIA_AND_AGENT_RUNTIME.md` for the full M0.5 contract.

## Availability implications

A project shard should be able to continue enforcing already-projected authorization if the control DB is briefly unavailable. New sessions/project routing may require cached directory information according to deployment policy.

Conversely, the architecture must not pretend asynchronous projection gives instantaneous global revocation. Critical revocation paths need explicit freshness/routing controls.

## Invariants

1. Workspace is the tenancy/collaboration boundary; project is the primary data-locality/sharding unit.
2. One project has one authoritative shard at a time.
3. Global identity IDs remain stable across shards.
4. Shard RLS depends only on locally available authorization facts plus transaction-local request identity.
5. Control-plane membership remains the source of truth; shard authorization tables are projections.
6. No normal RLS policy makes a synchronous cross-database membership query.
7. Application servers are stateless with respect to authoritative project state.
8. Heavy work is asynchronous.
9. No distributed transaction is required for normal project mutation.
10. Search/vector/cache projections are rebuildable.
11. Media bytes scale independently in object storage.
12. Authorization projection lag and revocation behavior are explicit and testable.
