# Studio backup and restore

Status: tooling implemented and exercised locally (Oct 2, 2026). The roadmap gate before staging holds real writing is an exercise on staging itself (§4); that has not been run yet.

## What is backed up

The Studio authoring database is PostgreSQL. It holds:

- accepted history: ChangeSets, revisions, checkpoints and the current projections;
- Drafts and Proposals;
- the migration ledger.

A backup is the whole database, taken by `pg_dump` in custom format.

Two things are **not** in it:

- **Text kept in a browser.** That copy lives in the browser until the server confirms it, and it is per device.
- **Repository data.** `data/outlines` and the rest stay in Git, which is their authority (ADR-0002).

## Tools

| Tool | Does |
| --- | --- |
| `tools/db/studio_db.py backup --out DIR` | Dumps the `DATABASE_URL` database and writes the dump, a manifest (with SHA-256) and a summary |
| `tools/db/studio_db.py restore --manifest M --target-url URL` | Restores into a new, empty database, then verifies it against the summary |
| `tools/db/studio_db.py verify --manifest M --target-url URL` | Compares any database with a backup's summary |
| `packages/v2-core/dist/verify-authoring-database.js` | The summary itself, read through Studio's own application code |

**The summary is the proof.** It reads the database the way Studio does and records:

- schema status;
- each project's head revision and number of ChangeSets;
- digests of the accepted history and the current projection;
- whether the head rebuilt from history alone equals the stored head;
- every screenplay view;
- the Drafts and the Proposals, by status.

A restore is good only when its summary equals the backup's. Digests are SHA-256 over canonical JSON. A difference is reported field by field, for example `summary.projects[0].drafts.count: expected 3, found 2`.

**Safety rules built into the tool:**

- Connection strings reach the PostgreSQL tools as `PG*` environment variables, never as command-line arguments.
- Files are written with mode 0600, in a 0700 directory.
- A backup summarizes the database before and after the dump. If writes landed in between, it deletes the dump and asks you to run it again, so every kept dump has a summary that describes it.
- A restore refuses the database named in `DATABASE_URL`, and any database that already has tables. It never drops anything.
- A restore checks the dump against the manifest's SHA-256 first.

**Requirements:**
- PostgreSQL client tools of the server's major version or newer;
- Node (`.nvmrc`), with `packages/v2-core` built;
- Python 3.

Automated coverage: `authoring-database-check.postgres.test.ts` (in `npm run test:postgres`, so in CI):
1. seeds a database with an accepted change carrying a note, a pending Proposal and a Draft;
2. backs it up and restores it with the tool;
3. requires the summaries to match;
4. checks both refusals;
5. checks that a restore missing one Draft is caught and named.

## 1. Back up (local)

```sh
export DATABASE_URL=postgresql://studio:studio@127.0.0.1:5432/studio_accept
npm run build --workspace @light-delay/v2-core
python3 tools/db/studio_db.py backup --out ~/studio-backups
# prints the manifest path: ~/studio-backups/studio-<db>-<UTC time>.json
```

## 2. Restore exercise (local)

```sh
createdb -h 127.0.0.1 -U studio studio_restore_check
python3 tools/db/studio_db.py restore --manifest ~/studio-backups/studio-…json \
  --target-url postgresql://studio:studio@127.0.0.1:5432/studio_restore_check
# "restored database matches the backup: …"
```

Optionally open the restored database in Studio on another port and compare what it serves:

```sh
STUDIO_AUTHORING_STORE=postgres PORT=5199 \
  DATABASE_URL=postgresql://studio:studio@127.0.0.1:5432/studio_restore_check \
  node apps/studio/build/index.js
```

Then run the `verify` command again. Opening the database must not have changed it.

## 3. Staging backup

On the Linode, an administrator runs the tools as the `studio` account. systemd reads the environment file, so nothing is sourced by a shell and no credentials appear in a process list:

```sh
sudo install -d -o studio -g studio -m 0700 /srv/studio/backups
sudo systemd-run --uid=studio --gid=studio --pipe --wait --collect \
  -p EnvironmentFile=/srv/studio/shared/studio-stage.env \
  -p WorkingDirectory=/srv/studio/current \
  /usr/bin/python3 tools/db/studio_db.py backup --out /srv/studio/backups
```

This needs `tools/db` in the release. The staging-workflow change packages it, and also runs this backup automatically before applying migrations.

**Keeping copies:**
- Keep at least the last 14 backups and every pre-migration backup.
- Copy them off the host (your choice of destination). A backup that only exists on the server it protects does not survive losing that server.

## 4. Staging restore exercise (the gate)

Never restore over the active staging database to prove recovery.

1. As the PostgreSQL administrator, create an empty database owned by the Studio role, for example `studio_stage_restore_20261003`.
2. Restore the newest backup into it with `restore --target-url` (same role, new database name). It verifies automatically.
3. Start a second Studio process on `127.0.0.1:5199` against the restored database, using `systemd-run` as above with `-p Environment=PORT=5199 -p Environment=DATABASE_URL=…`.
   - Check that `curl -s 127.0.0.1:5199/health` responds.
   - Check that `listHistory`, `listDrafts` and `listProposals` from `/api/authoring` match the active service's, for example by comparing `sha256sum` of each response.
4. Stop the second process, run `verify` once more, then drop the restore database.
5. Record the date, the backup manifest, the summary result and the comparison in `PROJECT_STATUS.md`.

## 5. Recovering for real

If the active database is lost or damaged:

1. Stop `studio-stage.service`. Keep the damaged database; do not drop it.
2. Create a new database and restore the newest good backup into it (§2 or §4). It verifies against its summary.
3. Point `DATABASE_URL` in `/srv/studio/shared/studio-stage.env` at the new database and start the service. `/health` must report `ok`.
4. Tell authors that anything typed after the backup was taken is not in the database. Text still held in their browsers is restored or offered when they open Studio again.

## Local exercise record (Oct 2, 2026)

Run against a local PostgreSQL 16, following `STUDIO_ACCEPTANCE_CHECKLIST.md` §1. The database `studio_accept` had:

- two accepted commits, one with a note;
- a pending Proposal from a two-tab conflict;
- three Drafts.

| Step | Result |
| --- | --- |
| Backup | dump of 27,690 bytes, manifest and summary written with mode 0600 |
| Restore into the new database `studio_restore_check` | restored, then verified: schema current, history, projections, views, Drafts and Proposals all match |
| Studio on port 5199 against the restore | page 200; `listHistory`, `listDrafts` and `listProposals` byte-identical to the source service |
| `verify` after Studio opened the restore | still matches; opening did not write |
| Restore into the active database | refused |
| Restore into a non-empty database | refused |
| Dump altered by one byte | refused (checksum) |
| One Draft deleted from the restore | `verify` failed and named `drafts.count` |
