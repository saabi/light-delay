# Deployment and Environments

Status: **implemented for the first Studio staging deployment; foundation security corrections are required before the next deployment**.

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

## Implemented staging contract

The implementation is split across:

- `.github/workflows/studio-staging.yml` — trusted-branch trigger guard, checks, build, artifact upload, SSH transfer and public health verification;
- `tools/deploy/package-stage.sh` — packages the Studio Node build, workspace manifests and exact revision metadata;
- `tools/deploy/stage-remote.sh` — installs runtime dependencies and invokes the server activation helper;
- `tools/deploy/stage-activate.sh` — the root-owned Linode helper that activates an already prepared release and restarts `studio-stage.service`. **Known issue:** the current implementation inspects release `package.json` through Node `require()`, which can execute release-controlled code as root. This must be replaced with non-executing data parsing before the next staging deployment.

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
architecture/v2-domain-model
```

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
      - architecture/v2-domain-model
  workflow_dispatch:

jobs:
  deploy:
    if: >
      github.ref_name == 'architecture/v2-domain-model' &&
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

The uploaded release contains `apps/studio/build`, the Studio and shared-core manifests, the root lockfile and `release.json`. The VM runs `npm ci --omit=dev --ignore-scripts` inside the extracted release so the runtime dependencies are installed from the exact lockfile.

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

- `studio` remains the systemd service account and owns/reads application releases;
- `studio-deploy` is the SSH deployment user and writes only the staging release area;
- `studio-deploy` may run only the root-owned `/usr/local/sbin/studio-stage-activate` helper through sudo;
- `/srv/studio/shared/studio-stage.env` remains VM-local and is readable by `studio` (not copied by GitHub Actions).

Install the helper from this repository once, as root, then grant the narrow sudo rule:

```sh
id -u studio-deploy >/dev/null 2>&1 || useradd --system --home-dir /srv/studio --shell /usr/sbin/nologin studio-deploy
install -o root -g root -m 0755 tools/deploy/stage-activate.sh /usr/local/sbin/studio-stage-activate
install -d -o studio-deploy -g studio-deploy -m 0750 /srv/studio/releases/.incoming
chown studio-deploy:studio-deploy /srv/studio/releases
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

Prepared/finalized releases should become non-writable by the deployment identity before root trusts them for activation. The exact ownership model may be adjusted during the foundation correction, but "immutable release" must become an enforced property rather than a naming convention.

## Database migrations

The current Studio implementation has no PostgreSQL usage and no migrations.

Do not make the root activation helper discover and execute a migration command from release-controlled `package.json`. When migrations are introduced, use a separate explicit migration step/command with a fixed trusted entry point, run as the unprivileged Studio runtime/migration identity before activation. Activation/rollback should not implicitly rerun whichever migration hook happens to exist in the selected release.

Rules:
- migrations, when introduced, must be versioned in repository;
- staging migration runs against staging DB only;
- migration failure stops deployment;
- application changes should prefer backward-compatible expand/migrate/contract changes when zero/low downtime matters;
- never point staging automatically at festival/production data;
- backups/restore procedure must exist before destructive migrations are introduced.

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
- deployed revision matches requested commit SHA.

Later add:
- database connectivity;
- migration/schema compatibility;
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

After the one-time server setup and GitHub Environment configuration, push a commit whose HEAD message contains `[deploy:stage]` to `architecture/v2-domain-model`. A multi-commit push deploys only the push HEAD when that HEAD contains the directive; an older commit message is ignored.

For a manual deploy, open **Actions → Deploy Studio to Linode staging → Run workflow**, select `architecture/v2-domain-model`, and optionally enter a 40-character SHA already reachable from that branch in `revision`. Leave it empty to deploy the selected workflow revision.

The first deployment creates `/srv/studio/releases/<sha>`, installs production dependencies there, atomically creates `/srv/studio/current -> releases/<sha>`, restarts `studio-stage.service`, checks localhost health, then checks the public HTTPS health endpoint. A failed health or revision check fails the workflow.

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

The staging topology remains appropriate, but the current helper does **not** satisfy all acceptance conditions until the foundation security corrections above are implemented and the installed host helper is updated. Required acceptance conditions are:

1. Studio CI is green independently of legacy CI.
2. Legacy festival deployment remains unchanged/protected.
3. Staging workflow only receives secrets on trusted branch/event types.
4. `[deploy:stage]` deploys the exact triggering SHA.
5. No directive means no automatic staging deployment.
6. Manual staging deployment is possible.
7. Host key verification is enabled.
8. deployment user is unprivileged/minimally privileged and cannot cause the root helper to execute release-controlled code.
9. concurrent deployments cannot corrupt the environment.
10. deployment performs a health check and records the deployed SHA.
11. rollback to a prior application release is documented/testable.
12. staging and festival/production data/secrets are isolated.
