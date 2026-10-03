# Deployment and Environments

Status: **protocol 3 in the repository (Oct 2, 2026): staging deploys from `master`, with an explicit backup-and-migrate step before activation and schema-aware health. Protocol-3 host installation and verification are still required before deployment.**

## Environments

Studio development uses three conceptually distinct environments:

```text
LOCAL
  developer machine
  fast iteration / local tests

STAGING
  Linode VM
  explicit opt-in deployments from selected commits
  integration and realistic deployment testing

FESTIVAL / LEGACY PRODUCTION
  existing judged Light Delay application
  protected deployment path
  independent from Studio staging
```

A future Studio production environment is intentionally not defined by the staging mechanism.

## Core rule

> Staging deployment is explicit and disposable; festival production is protected and independent.

A Studio staging failure must not affect the legacy festival site. A legacy/festival deployment must not require Studio to build or deploy.
## Legacy Pages promotion

master is an integration branch, not by itself a legacy-production deployment trigger. Public Light Delay Pages deployment requires explicit [deploy:pages] authorization on the pushed HEAD commit or explicit manual promotion.

The Pages workflow validates pushes and pull requests. Promotion depends on checkout, legacy type-check, complete application compatibility tests, browser compatibility tests, normal production build, and base-path build. It deploys the artifact built by that validated run. A push deploys only when github.event.head_commit.message contains [deploy:pages]; phrases such as deploy pages do not authorize it, and messages from earlier commits in a multi-commit push are ignored. Manual dispatch is restricted to master; an optional revision must be reachable from master and is the exact revision built and promoted.

Pull requests, fork commits, feature-branch pushes, and ordinary master pushes cannot reach the production Pages job. Studio integration therefore cannot silently replace the public historical/festival application.

## Implemented staging contract

The implementation is split across:

- `.github/workflows/studio-staging.yml` — trusted-branch trigger guard, checks, build, artifact upload, SSH transfer and public health verification;
- `tools/deploy/package-stage.sh` — packages the Studio Node build, workspace manifests and exact revision metadata;
- `tools/deploy/stage-remote.sh` — installs runtime dependencies and invokes the server activation helper;
- `tools/deploy/stage-activate.sh` — administrator-installed activation/rollback helper. Protocol 3 adds one explicit verb, `--migrate`, which finalizes a release and hands it to the migration helper. Activation and rollback never migrate and never run package scripts.
- `tools/deploy/stage-migrate.sh` — administrator-installed as `/usr/local/libexec/studio-stage-migrate`. It runs three fixed entry points inside the finalized release, as `studio` (never root): backup, migrate, verify.
- `tools/db/studio_db.py` — backup/restore/verify tooling, packaged into every release ([`STUDIO_BACKUP_AND_RESTORE.md`](STUDIO_BACKUP_AND_RESTORE.md)).
- `tools/deploy/stage-finalize.py` — administrator-installed, isolated Python helper that copies untrusted bytes into fresh root-owned inodes, validates JSON as data, and finalizes read-only releases.

Studio uses `@sveltejs/adapter-node`. Its production entry point is `apps/studio/build/index.js`, and the service listens only on `127.0.0.1:5100`. The `/health` endpoint returns `ok`, `service`, `revision` and `builtAt`; the revision comes from the release's `release.json`.

## Commit-triggered staging deployment

Support an explicit commit-message directive:

```text
[deploy:stage]
```

Example:

```text
Implement ChangeSet revision projection [deploy:stage]
```

The workflow recognizes only the bracketed directive. The phrase `deploy to stage` is not a trigger.

The directive means:

> If this commit reaches the configured staging branch and required staging checks pass, deploy that exact revision to the Linode staging environment.

It must not mean "deploy whatever happens to be latest when the job runs."

## Branch policy

The configured trusted staging branch is:

```text
master
```

Until Oct 2, 2026 this was `architecture/v2-domain-model`. It moved to `master` with the integration of Studio V2, so staging only ever runs a commit that has been reviewed and merged into the main line.

Do not allow a commit directive on arbitrary PR/fork branches to gain access to staging secrets. The workflow has no `pull_request` trigger; only pushes to this branch and manual dispatches from this branch can reach the deploy job/environment.

Manual `workflow_dispatch` should also be supported so staging can be redeployed without creating a meaningless commit.

## GitHub Actions split

```text
CI
├── repository-validation
├── legacy-compatibility
│   ├── check
│   ├── tests
│   └── build
├── studio
│   ├── check
│   ├── tests
│   └── build
└── project/shared tests

DEPLOYMENTS
├── festival-pages
│   └── protected legacy artifact
└── studio-staging
    ├── trigger guard
    ├── required Studio/shared checks
    ├── build/package exact commit
    └── deploy to Linode
```

Prefer separate workflow files for festival production and Studio staging so permissions, secrets, concurrency and failure behavior remain isolated.

## Staging workflow trigger

GitHub Actions can run on pushes to the allowed branch, then gate the deployment job by commit-message directive.

The implemented workflow uses:

```yaml
on:
  push:
    branches:
      - master
  workflow_dispatch:

jobs:
  deploy:
    if: >
      github.ref_name == 'master' &&
      (github.event_name == 'workflow_dispatch' ||
      contains(github.event.head_commit.message, '[deploy:stage]')
      )
```

For `push`, `TARGET_SHA` is `github.sha`, which is the head commit of that push. For `workflow_dispatch`, `TARGET_SHA` is the optional `revision` input or the workflow revision when omitted; the workflow verifies that it is an ancestor of the trusted branch.

A multi-commit push only exposes the head commit through `head_commit`; the intended convention should therefore be **the directive belongs on the pushed HEAD commit**. This avoids surprising deployments because an older commit in a batch contained the phrase.

## Deployment strategy

The workflow builds an artifact/release; it never runs `git pull` on the VM.

Recommended flow:

```text
GitHub commit SHA
   |
   +--> CI/check/test
   |
   +--> build Studio
   |
   +--> immutable artifact/container tagged with SHA
   |
   +--> authenticate to staging
   |
   +--> deploy that exact artifact
   |
   +--> health check
   |
   +--> record deployed SHA
```

This makes staging reproducible and rollbackable.

The uploaded release contains `apps/studio/build`, the Studio and shared-core manifests, the root lockfile and `release.json`. The package includes the compiled core and all workspace manifests. The VM runs `npm ci --omit=dev --ignore-scripts` inside the extracted release so the runtime dependencies are installed from the exact lockfile.

## Linode host layout

Keep deployment mechanics behind the repository scripts:

```text
tools/deploy/package-stage.sh
tools/deploy/stage-remote.sh
tools/deploy/stage-activate.sh
```

GitHub Actions should orchestrate rather than contain a large shell program.

Possible VM layout:

```text
/srv/studio/
├── releases/
│   ├── <commit-sha>/
│   └── ...
├── current -> releases/<commit-sha>
├── releases/.incoming/       # deployment-user upload area
├── shared/
│   └── environment/secrets outside repository
└── logs/
```

The architecture does not require Docker merely for staging.

## One-time Linode setup

The intended permission model does not touch the existing `node` user or PM2 installation:

- `studio` remains the systemd service account and can read, but cannot write, finalized releases;
- `studio-deploy` is the SSH deployment user and writes only `releases/.incoming`; `releases` and finalized SHA directories are root-owned;
- `studio-deploy` may run only the root-owned `/usr/local/sbin/studio-stage-activate` helper through sudo;
- `/srv/studio/shared/studio-stage.env` remains VM-local and is readable by `studio` (not copied by GitHub Actions).

An administrator must update BOTH helpers from a reviewed commit. This session has not installed or audited anything on Linode. Pause staging deployments during the host update. Python 3, util-linux (`flock`), systemd (≥ 235, for `systemd-run --pipe`), Node at `/usr/bin/node` and the PostgreSQL client tools (`pg_dump`, `pg_restore`, `psql`, of the server's major version or newer) are prerequisites. Preserve unrelated PM2/nginx applications. Install as root, then grant the narrow sudo rule:

```sh
id -u studio-deploy >/dev/null 2>&1 || useradd --system --home-dir /srv/studio --shell /bin/bash studio-deploy
install -d -o root -g root -m 0755 /usr/local/libexec
install -d -o root -g root -m 0755 /run/studio-stage
install -o root -g root -m 0644 tools/deploy/studio-stage-tmpfiles.conf /etc/tmpfiles.d/studio-stage.conf
systemd-tmpfiles --create /etc/tmpfiles.d/studio-stage.conf
install -o root -g root -m 0644 tools/deploy/stage-finalize.py /usr/local/libexec/studio-stage-finalize.py
install -o root -g root -m 0755 tools/deploy/stage-migrate.sh /usr/local/libexec/studio-stage-migrate
install -o root -g root -m 0755 tools/deploy/stage-activate.sh /usr/local/sbin/studio-stage-activate
install -d -o studio -g studio -m 0700 /srv/studio/backups
chown root:root /srv/studio /srv/studio/releases
chmod 0755 /srv/studio /srv/studio/releases
install -d -o studio-deploy -g studio-deploy -m 0750 /srv/studio/releases/.incoming
printf '%s\n' 'studio-deploy ALL=(root) NOPASSWD: /usr/local/sbin/studio-stage-activate' >/etc/sudoers.d/studio-stage
chmod 0440 /etc/sudoers.d/studio-stage
visudo -cf /etc/sudoers.d/studio-stage
```

The existing `studio-stage.service` must use the release symlink (preserve any existing hardening directives):

```ini
[Service]
User=studio
WorkingDirectory=/srv/studio/current
EnvironmentFile=/srv/studio/shared/studio-stage.env
Environment=NODE_ENV=production
Environment=HOST=127.0.0.1
Environment=PORT=5100
ExecStart=/usr/bin/node /srv/studio/current/apps/studio/build/index.js
Restart=on-failure
```

After confirming the unit configuration, reload and enable it once:

```sh
systemctl daemon-reload
systemctl enable studio-stage.service
```

## Secrets

Do not commit:
- SSH private keys;
- database credentials;
- API/provider keys;
- session/auth secrets;
- Linode tokens;
- production/staging environment files.

Use a GitHub **Environment** named `staging` and environment-scoped Actions secrets/variables.

Likely secrets:
- `STAGING_HOST`;
- `STAGING_USER`;
- `STAGING_SSH_KEY`;
- optional `STAGING_SSH_PORT` (defaults to `22`);
- `STAGING_KNOWN_HOSTS`, containing the pre-verified `known_hosts` line(s) for the staging host and port.

Application secrets should preferably already exist on the Linode VM or be supplied by a dedicated secret mechanism; avoid copying a complete production-like `.env` from GitHub on every deployment.

Use the `studio-deploy` account described above. The GitHub Environment is attached only to the deploy job, after the check/build job succeeds.

## Host authenticity

Pin/verify the staging host key rather than disabling SSH host verification.

Store known-host material/fingerprint in `STAGING_KNOWN_HOSTS`; the workflow uses `StrictHostKeyChecking=yes` and fails on unexpected host identity changes. Do not replace this with `ssh-keyscan` at deploy time.

## Privileged activation boundary

The root helper is a security boundary, not a general deployment script.

It must:

- validate that the requested release path is exactly the expected SHA directory;
- validate release metadata as **data**, never by importing/requiring/executing release-controlled JavaScript;
- reject symlink tricks for security-sensitive manifest checks;
- avoid executing arbitrary commands selected by release-controlled package scripts;
- perform only the minimal ownership/finalization/symlink/service actions that actually require privilege.

Finalization copies through directory descriptors with O_NOFOLLOW into fresh root-owned inodes; it never chowns a deployment-owned tree in place. This protects against open writable descriptors and source-path swaps. Special files and hardlinks are rejected. Only contained relative npm links under node_modules are permitted; manifests and the entrypoint cannot have symlink components. JSON validation happens in the protected copy. Files become 0444 and directories 0555 before publication. Repeat activation revalidates ownership and permissions and does not recopy the upload. Root activation is serialized with flock at /run/studio-stage/stage-activate.lock. The directory is root-owned and recreated after boot by systemd-tmpfiles; the repository includes tools/deploy/studio-stage-tmpfiles.conf. Protocol 3 (Oct 2, 2026) adds the migration helper. Its host installation remains pending.

After host installation, run `sudo -u studio-deploy sudo -n /usr/local/sbin/studio-stage-activate --protocol-version` and require exactly `3`. Protocol 2 required `2`. Review the installed helper checksums against the reviewed repository files. The remote workflow fails closed against an old helper. Existing mutable releases are NOT grandfathered in for rollback: an administrator must separately verify and finalize a fresh copy before it is eligible. Do not blindly chown existing releases and call them immutable. No staging deployment was performed in this implementation session.

## Database migrations

M2.5 adds the PostgreSQL adapter and committed authoring migrations for local development and CI.
See [`V2_POSTGRES_PERSISTENCE.md`](V2_POSTGRES_PERSISTENCE.md). No host rollout has occurred.

Migrations run in an explicit step before activation, as the earlier design required. That design called for:

- a fixed, reviewed entry point;
- a separately authorized finalized SHA;
- release code running as `studio`;
- no discovered npm hooks and no sourced shell files;
- no implicit migrations on activation or rollback.

`stage-remote.sh` calls `sudo studio-stage-activate --migrate <release> <sha>`. The root helper finalizes and validates the release exactly as for activation, then runs `/usr/local/libexec/studio-stage-migrate <finalized release>`.

That helper runs three fixed paths inside the read-only release. Each runs through `systemd-run` as `studio`, with:

- `EnvironmentFile=/srv/studio/shared/studio-stage.env`, so credentials are never on a command line and the file is never sourced;
- `NoNewPrivileges`, `ProtectSystem=strict`, `PrivateTmp` and `ProtectHome`;
- write access only to `/srv/studio/backups`.

The three steps:

1. **Back up.** `tools/db/studio_db.py backup --out /srv/studio/backups`, using the tools of the release that is running now, since it reads the database as it is. The new release's tools are used only when none is running yet. An empty database has nothing to back up. A failed backup stops the deployment.
2. **Migrate.** `packages/v2-core/dist/migrate-postgres.js` applies the release's migrations in one transaction, under an advisory lock. It refuses changed or unknown migration files.
3. **Verify.** `packages/v2-core/dist/verify-authoring-database.js` checks that the schema is current (or ahead) and that accepted history reconstructs every project's head.

Only after all three succeed does `stage-remote.sh` activate. Rollback activates an older release without migrating. That is safe because migrations are additive (expand/migrate/contract), and an older release reports a newer schema as `ahead`, which is compatible.

Simulated Oct 2, 2026 on a container standing in for the host. A test shim stood in for `systemd-run` (no systemd init) and used `runuser` with the same environment file. Results:

- first deployment against an empty database: nothing to back up, migrated, verified;
- redeployment with data and a current release: backup files owned by `studio` with mode 0600, migrate is a no-op, verified;
- an unreachable database: stopped at the backup, exit 1;
- a malformed release path: refused.

The real host still has to be installed and verified.

Rules:
- migrations, when introduced, must be versioned in repository;
- staging migration runs against staging DB only;
- migration failure stops deployment;
- application changes should prefer backward-compatible expand/migrate/contract changes when zero/low downtime matters;
- never point staging automatically at festival/production data;
- backups/restore procedure must exist before destructive migrations are introduced (procedure and tooling: [`STUDIO_BACKUP_AND_RESTORE.md`](STUDIO_BACKUP_AND_RESTORE.md); the staging exercise in its §4 is still to be run).

## Concurrency

Only one staging deployment should mutate the environment at a time.

The workflow uses this Actions concurrency group:

```text
studio-staging
```

`cancel-in-progress: false` is intentional: a queued deployment is not allowed to interrupt a migration or an activation already in progress.

## Health verification

A successful SSH/script exit is not enough.

The workflow and remote script verify:
- process/service is running;
- `http://127.0.0.1:5100/health` responds;
- `https://studio.ferreyrapons.com/health` responds;
- deployed revision matches requested commit SHA;
- the store is PostgreSQL (never the in-memory store) and the schema is `current` or `ahead`.

`/health` reports `store` and, for PostgreSQL, `schema` (`current`, `ahead`, `behind`, `changed`, `uninitialized` or `unavailable`) with the migration names that differ. It answers **503** whenever this release cannot serve authoring:
- the database cannot be reached;
- a migration is missing or changed.

So the deploy check fails closed, and `stage-remote.sh` reactivates the previous release. The expected migrations are a manifest generated into core at build time (`src/generated/migration-manifest.ts`, kept current by a unit test), because code bundled into Studio cannot read the migrations directory.

Later add:
- worker health;
- queue/outbox health.

The `/health` response exposes the deployed revision from `release.json`; it contains no application/database secrets.

## Rollback

Keep enough previous releases/artifacts to roll back quickly.

Manual rollback selects an already-installed, finalized release and does not rebuild source or implicitly run migrations:

```sh
sudo /usr/local/sbin/studio-stage-activate /srv/studio/releases/<40-char-sha> <40-char-sha>
```

Run this on the Linode as `studio-deploy` (or an administrator). The helper rechecks release metadata as non-executable data, atomically switches `/srv/studio/current`, restarts the service and verifies it is active.

Database rollback is a separate concern; application rollback is safe only when schema compatibility permits it.

## Auditability

Each staging deployment should make it easy to answer:
- who authored/triggered it;
- which commit SHA is deployed;
- when it deployed;
- which workflow run performed it;
- whether migrations ran;
- whether the health check passed.

GitHub deployment/environment history can provide much of this.

## First deployment and manual redeploy

After the one-time server setup and GitHub Environment configuration, push a commit whose HEAD message contains `[deploy:stage]` to `master` (for a merged PR, put the directive in the merge commit message). A multi-commit push deploys only the push HEAD when that HEAD contains the directive; an older commit message is ignored.

For a manual deploy, open **Actions → Deploy Studio to Linode staging → Run workflow**, select `master`, and optionally enter a 40-character SHA already reachable from that branch in `revision`. Leave it empty to deploy the selected workflow revision.

The first deployment prepares `/srv/studio/releases/.incoming/<sha>`, installs production dependencies there without lifecycle scripts, finalizes a fresh read-only `/srv/studio/releases/<sha>`, backs up and migrates the database (§ Database migrations; any failure stops here, before activation), atomically creates `/srv/studio/current -> releases/<sha>`, restarts `studio-stage.service`, checks localhost health, then checks the public HTTPS health endpoint. A failed health or revision check fails the workflow.

## Future path

The commit directive is a developer convenience, not the core deployment architecture.

Later triggers may include:
- manual promotion;
- merge to an integration branch;
- tagged release;
- environment approval;
- automatic preview environments.

All should invoke the same underlying build/deploy contract.

## Acceptance criteria

The repository helper is corrected and has Linux filesystem tests. Host acceptance remains pending until BOTH installed helpers and directory permissions are updated and verified. Required acceptance conditions are:

1. Studio CI is green independently of legacy CI.
2. Legacy festival deployment remains unchanged/protected.
3. Staging workflow only receives secrets on trusted branch/event types.
4. `[deploy:stage]` deploys the exact triggering SHA.
5. No directive means no automatic staging deployment.
6. Manual staging deployment is possible.
7. Host key verification is enabled.
8. deployment user is unprivileged/minimally privileged and cannot cause the root helper to execute release-controlled code as root. The migration step runs release code only as `studio`, through fixed entry points in a finalized read-only release, which is the privilege the service already runs it with.
9. concurrent deployments cannot corrupt the environment.
10. deployment performs a health check and records the deployed SHA.
11. rollback to a prior application release is documented/testable.
12. staging and festival/production data/secrets are isolated.
