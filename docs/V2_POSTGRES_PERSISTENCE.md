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
application rebuilds the accepted record against the new head and retries up to 64 times. If the
bounded budget is exhausted, `STORE_BUSY` tells the caller to retry later and leaves the Proposal
pending. A changed target document version remains a semantic conflict and stops retries. The
current-state query uses a
`REPEATABLE READ READ ONLY` transaction for a consistent project/scopes view. A retry after an
uncertain acceptance response observes an accepted Proposal and cannot append history again.

## Connection failures

Studio survives PostgreSQL restarts and connection loss, including a checked-out transaction client
(correction verification finding V1). `inTransaction` listens for client errors until release,
discards unusable connections, and preserves the original transaction failure if rollback also
fails. It never replays a transaction. The pool handles idle-client errors separately.

The pool uses a 5 s connection/acquisition timeout, 15 s PostgreSQL statement timeout, 20 s
client-side query-read timeout, 30 s idle-in-transaction timeout, and TCP keepalive beginning
at 10 s. The query deadline also bounds a server or network that stops making progress. The HTTP boundary classifies connection refused,
reset and other transport failures; SQLSTATE class `08`; shutdown `57P01`–`57P03`;
idle-in-transaction timeout `25P03`; too many connections `53300`; PostgreSQL statement timeout `57014` with its specific
message; pg unqueryable-client connection messages; and the configured Query read timeout. Only these receive HTTP 503, `STORE_UNAVAILABLE`, and `Retry-After: 1`. Semantic,
integrity, validation and arbitrary SQL errors remain non-retryable. Browser responses contain
safe messages; server logs include the error code and request method.

The browser retries network failures, `STORE_UNAVAILABLE`, and `STORE_BUSY` three times after
the initial attempt, at 0.5, 1.5 and 4 s with ±25% jitter. A longer valid seconds or HTTP-date
`Retry-After` is honored up to 60 s.
It does not retry semantic results. After a lost accept/reject response it checks the Proposal's
terminal status and accepted history before resending. Restore checks its scoped ChangeSet,
target revision and expected document version. These terminal and scoped preconditions prevent
duplicate accepted history. An ambiguous new Draft without a stable ID is only re-read automatically; the user must
choose **Retry now** before it can be sent again. Studio supplies a stable Proposal ID for each
logical CreateProposal attempt. Reconciliation reads that exact Proposal, and the persisted
(project, Proposal ID) primary key makes a retry return the same Proposal. A new logical attempt
uses a new ID. The observed Draft update time prevents an uncommitted retry from proposing later
Draft contents under the old attempt ID. This is a narrow CreateProposal mechanism.

Studio shows a restrained reconnecting state during retries. After exhaustion it keeps the editor
contents in the current browser session and shows a persistent warning and **Retry now** action.
After a mutation is known to have committed, the manual path retries only its failed authoritative
refresh and never resends the mutation. A refresh or closed tab can
still lose unsaved browser edits. PostgreSQL remains the sole durable source of accepted history;
there is no server-side queue. IndexedDB protection and durable per-command ids remain for the
next Studio milestone, as do the transactional outbox and authorization.

Details: [correction verification §9](reviews/2026-09-26-M2.5-correction-verification-claude.md).

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

Set `TEST_DATABASE_URL` to an isolated PostgreSQL test database and run `npm run test:postgres` for
real transaction tests and the unchanged M2 authoring contract suite against PostgreSQL. The
normal `test:v2-core` run executes the same contract against the in-memory store. PostgreSQL test
files create random isolated schemas, migrate them from zero, clear project rows between tests,
and drop the schemas afterward. CI provisions one PostgreSQL 16 service for migrations, the
integration suite and contract parity alongside core and Studio checks. It does not contact
Linode or any staging database.

Local convention: `DATABASE_URL` points to `studio_dev`, the persistent interactive development
database owned by the `studio_dev` role. `TEST_DATABASE_URL` points to `studio_test`, owned by a
restricted `studio_test` role that cannot connect to `studio_dev`. Automated agents and the test
suites use only `studio_test`; randomized test schemas are removed after each run. Set both as user environment variables; never commit them. Migrate
`studio_dev` with `npm run migrate:studio` from a checkout whose `.sql` files have LF endings, so the
recorded hash matches CI (see [final verification §12 and F7](reviews/2026-09-30-M2.5-final-verification-claude.md)).

The synthetic scale check adds 250 screenplay elements to two cuts, accepts a change in one cut,
and checks that the revision metadata occupies less than one tenth of the initial project JSON.
It also checks that the acceptance wrote exactly one scoped checkpoint.

## Later rollout

This milestone does not run staging migrations or deploy Studio. Before a host rollout, review the
exact migration and release SHA, take and exercise a database backup/restore, and install a fixed
administrator-controlled migration entry point before activation. The existing activation helper
must not discover or execute a release-controlled migration hook.

The transactional outbox is a conscious deferral: M2.5 has no committed change that must atomically
publish work to an external Agent Runtime, generation/export worker or notification service. Revisit
it when reliable asynchronous side effects are required. Minimal project authorization is also
consciously deferred from M2.5. The trusted accepting-principal boundary already prevents client
data from choosing the accepter; project access control must be added before meaningful multi-user
or external Studio exposure. Neither deferral changes the current trusted-principal boundary.

The revision-0/bootstrap snapshot currently supplies the project document/cut catalog. This is
sufficient for the bounded M2/M2.5 screenplay slice, but it is not the permanent path for dynamic
StoryVersions, cuts or future document kinds such as Outline. Future Story → Version → Outline →
Screenplay work needs an authoritative mutation and persistence path for that structure. Document
`kind` is stored without assuming all future authored documents are screenplays; only screenplay
behavior exists in the current M2 domain contract.
