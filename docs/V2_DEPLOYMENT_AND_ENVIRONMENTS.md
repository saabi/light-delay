# Deployment and Environments

Status: **target deployment design; implement after Milestone 0 / repository CI cleanup**.

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

## Commit-triggered staging deployment

Support an explicit commit-message directive:

```text
[deploy:stage]
```

Example:

```text
Implement ChangeSet revision projection [deploy:stage]
```

For convenience, CI may additionally recognize the exact phrase:

```text
deploy to stage
```

Prefer the bracketed directive in documentation and automation because it is unambiguous and searchable.

The directive means:

> If this commit reaches the configured staging branch and required staging checks pass, deploy that exact revision to the Linode staging environment.

It must not mean "deploy whatever happens to be latest when the job runs."

## Branch policy

Initially, staging should deploy only from an explicitly allowed development branch, likely:

```text
architecture/v2-domain-model
```

or, once V2 work stabilizes, a dedicated integration branch such as:

```text
develop
```

Do not allow a commit directive on arbitrary PR/fork branches to gain access to staging secrets.

Manual `workflow_dispatch` should also be supported so staging can be redeployed without creating a meaningless commit.

## Proposed GitHub Actions split

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

## Suggested staging workflow trigger

GitHub Actions can run on pushes to the allowed branch, then gate the deployment job by commit-message directive.

Conceptually:

```yaml
on:
  push:
    branches:
      - architecture/v2-domain-model
  workflow_dispatch:

jobs:
  deploy-stage:
    if: >
      github.event_name == 'workflow_dispatch' ||
      contains(github.event.head_commit.message, '[deploy:stage]')
```

When implementing, also decide whether the compatibility phrase `deploy to stage` is accepted.

A multi-commit push only exposes the head commit through `head_commit`; the intended convention should therefore be **the directive belongs on the pushed HEAD commit**. This avoids surprising deployments because an older commit in a batch contained the phrase.

## Deployment strategy

Prefer an artifact/release deployment over "SSH in and git pull whatever is current."

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

If initial simplicity matters, an SSH-based deployment script is acceptable, but it should still check out/deploy the exact `GITHUB_SHA`, not branch HEAD.

## Linode host layout

Keep deployment mechanics behind one repository script, for example:

```text
tools/deploy/stage.sh
```

GitHub Actions should orchestrate rather than contain a large shell program.

Possible VM layout:

```text
/srv/studio/
├── releases/
│   ├── <commit-sha>/
│   └── ...
├── current -> releases/<commit-sha>
├── shared/
│   └── environment/secrets outside repository
└── logs/
```

or use a container runtime if that becomes the preferred deployment model.

The architecture does not require Docker merely for staging.

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
- optional `STAGING_SSH_PORT`.

Application secrets should preferably already exist on the Linode VM or be supplied by a dedicated secret mechanism; avoid copying a complete production-like `.env` from GitHub on every deployment.

Use a dedicated unprivileged deployment account. Grant only the permissions required to install/switch/restart Studio.

## Host authenticity

Pin/verify the staging host key rather than disabling SSH host verification.

Store known-host material/fingerprint as staging configuration and fail on unexpected host identity changes.

## Database migrations

Once Studio has PostgreSQL, deployment must distinguish application deployment from schema migration.

Rules:
- migrations are versioned in repository;
- staging migration runs against staging DB only;
- migration failure stops deployment;
- application changes should prefer backward-compatible expand/migrate/contract changes when zero/low downtime matters;
- never point staging automatically at festival/production data;
- backups/restore procedure must exist before destructive migrations are introduced.

## Concurrency

Only one staging deployment should mutate the environment at a time.

Use an Actions concurrency group such as:

```text
studio-staging
```

A newer deployment may cancel a queued/obsolete deployment, but avoid interrupting a migration in an unsafe state. The final policy should match the deployment script's atomicity.

## Health verification

A successful SSH/script exit is not enough.

After deployment verify at minimum:
- process/service is running;
- HTTP health endpoint responds;
- deployed revision matches requested commit SHA.

Later add:
- database connectivity;
- migration/schema compatibility;
- worker health;
- queue/outbox health.

Expose the deployed revision somewhere non-sensitive, e.g. a health/build-info endpoint or footer in staging.

## Rollback

Keep enough previous releases/artifacts to roll back quickly.

Manual rollback should select a known commit/release rather than rebuilding source under potentially changed dependencies.

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

Before enabling automatic staging deployment:

1. Studio CI is green independently of legacy CI.
2. Legacy festival deployment remains unchanged/protected.
3. Staging workflow only receives secrets on trusted branch/event types.
4. `[deploy:stage]` deploys the exact triggering SHA.
5. No directive means no automatic staging deployment.
6. Manual staging deployment is possible.
7. Host key verification is enabled.
8. deployment user is unprivileged/minimally privileged.
9. concurrent deployments cannot corrupt the environment.
10. deployment performs a health check and records the deployed SHA.
11. rollback to a prior application release is documented/testable.
12. staging and festival/production data/secrets are isolated.
