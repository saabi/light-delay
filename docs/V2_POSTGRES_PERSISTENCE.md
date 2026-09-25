# Studio M2.5 PostgreSQL persistence

M2.5 stores the accepted M2 authoring contract through `PostgresProjectStoreResolver`. The
application still accepts TypeBox-validated commands and a separate trusted execution context.
`InMemoryProjectStoreResolver` remains available for bounded tests. Importing `v2-core` does not
open a database connection; Studio's server creates one only when PostgreSQL mode is selected.

## Storage model

The first migration is `packages/v2-core/migrations/001_authoring.sql`. It stores project identity
and the initial projection once; document identities and kinds; version/cut identities; the stable
project-scoped screenplay element registry; current document × version content and its document
version; Drafts; Proposals; immutable ChangeSets; metadata-only ProjectRevisions; and checkpoints
for touched scopes only. Screenplay order is an explicit ID array in scope content. SQL collation
does not determine creative order. JSON records retain the TypeBox-authoritative M2 representation,
including provenance and canonical UTC instants. Relational keys, foreign keys, lifecycle checks,
and uniqueness reinforce storage invariants without adding another domain model.

The project row stores accepted-history contract version 1. Each ChangeSet stores its operation
schema version and complete semantic operations. Historical export validates and dispatches through
the M2 accepted-history reader and reducer; unsupported versions fail clearly. Current state reads
the scoped current rows directly. Historical reads select the latest checkpoint at or before a
requested revision for each scope, falling back to the initial projection. They do not replay the
entire history on startup. Restore checks its historical target and appends a new ChangeSet.

Draft rows retain their original project and document-version bases. The save operation is one
conditional upsert that may change content but cannot change owner, scope, or base. Pending
Proposals retain source, content authors, generator, operations, and preconditions across restart.
The server supplies the accepting principal; Proposal fields do not supply acceptance authority.

## Transaction and concurrency

Acceptance uses one PostgreSQL transaction at `READ COMMITTED`. It locks the pending Proposal,
locks touched scope rows in deterministic ID order, then briefly locks the project row to allocate
the next project revision. Within that transaction it checks the document-version precondition,
validates the complete accepted ChangeSet and historical restore target, inserts the ChangeSet and
revision, inserts touched-scope checkpoints and any new element identities, updates the current
scopes and project head, and conditionally marks the Proposal accepted. A failure rolls all of this
back. Rejection locks and conditionally updates a pending Proposal in one transaction. The Proposal
lock and unique ChangeSet/revision keys prevent duplicate terminal results and history.

The project lock is needed only for deterministic revision ordering. Distinct document rows can be
prepared concurrently. If unrelated work wins the ordering lock after an application read, the
application rebuilds the accepted record against the new head and retries up to three times. A
changed target document version remains a semantic conflict. The current-state query uses a
`REPEATABLE READ READ ONLY` transaction for a consistent project/scopes view. A retry after an
uncertain acceptance response observes an accepted Proposal and cannot append history again.

## Local setup and migrations

Use a local PostgreSQL database that you control. Set `DATABASE_URL` to its connection URL in the
environment, then run `npm run migrate:studio`. Set `STUDIO_AUTHORING_STORE=postgres` and run
`npm run dev:studio`. Development defaults to the in-memory store unless PostgreSQL is selected;
production defaults to PostgreSQL and reports a missing `DATABASE_URL` clearly in Studio Write.
No connection URL or password is committed or logged. The server seeds only the controlled Harbor
Light M2 fixture when the project is absent; it does not import Light Delay production data.

The migration runner applies numbered SQL files in lexical order under a transaction and advisory
lock. `authoring_schema_migrations` records each filename, SHA-256 and application time. Rerunning
is safe; changing an applied migration fails. Add future changes as a new numbered SQL file and
review their compatibility with existing data. Schema version is inspectable with:

```sql
SELECT version, applied_at FROM authoring_schema_migrations ORDER BY version;
```

Set `TEST_DATABASE_URL` to a disposable PostgreSQL database and run `npm run test:postgres` for
real transaction tests. The suite creates a random isolated schema, migrates it from zero, uses
separate pool connections for concurrent calls, and drops the schema afterward. CI provisions a
PostgreSQL 16 service and runs migrations and the integration suite alongside core and Studio
checks. It does not contact Linode or any staging database.

## Later rollout

This milestone does not run staging migrations or deploy Studio. Before a host rollout, review the
exact migration and release SHA, take and exercise a database backup/restore, and install a fixed
administrator-controlled migration entry point before activation. The existing activation helper
must not discover or execute a release-controlled migration hook. Authentication, an outbox and
workers remain separate work. Document `kind` is stored without assuming all future authored
documents are screenplays; only screenplay behavior exists in the current M2 domain contract.
