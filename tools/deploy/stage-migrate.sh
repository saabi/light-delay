#!/bin/bash -p
# Administrator-installed as /usr/local/libexec/studio-stage-migrate (root:root, 0755). It is run only
# by `studio-stage-activate --migrate`, after that helper has finalized and validated the release, and
# never by activation or rollback.
#
# Release code runs only as `studio`, the identity that already runs it as the service, never as root.
# Database credentials reach it through systemd's EnvironmentFile, never by sourcing a shell file. The
# entry points are fixed paths inside the read-only finalized release, not package scripts.
set -Eeuo pipefail
export PATH=/usr/sbin:/usr/bin:/sbin:/bin
unset NODE_OPTIONS PYTHONPATH PYTHONHOME
[[ ${EUID:-$(id -u)} -eq 0 ]] || { echo 'studio-stage-migrate must run as root' >&2; exit 1; }
[[ $# -eq 1 && "$1" =~ ^/srv/studio/releases/[0-9a-f]{40}$ ]] || {
	echo 'usage: studio-stage-migrate /srv/studio/releases/<40-char-sha>' >&2
	exit 2
}
release=$1
env_file=/srv/studio/shared/studio-stage.env
backups=/srv/studio/backups
[[ -f "$env_file" ]] || { echo "missing $env_file" >&2; exit 1; }
install -d -o studio -g studio -m 0700 "$backups"

as_studio() {
	local workdir=$1
	shift
	systemd-run --quiet --uid=studio --gid=studio --pipe --wait --collect \
		--property=EnvironmentFile="$env_file" \
		--property=WorkingDirectory="$workdir" \
		--property=NoNewPrivileges=yes --property=PrivateTmp=yes \
		--property=ProtectSystem=strict --property=ProtectHome=yes \
		--property=ReadWritePaths="$backups" \
		--setenv=PATH=/usr/bin:/bin \
		"$@"
}

# 1. Back up before the schema changes. The running release's tools read the database as it is now;
#    the first time there is none with tools, so the new release's are used. A failed backup stops
#    the deployment. An empty database (first deployment) has nothing to back up.
current=$(readlink /srv/studio/current || true)
backup_release=$release
if [[ "$current" =~ ^/srv/studio/releases/[0-9a-f]{40}$ && -f "$current/tools/db/studio_db.py" ]]; then
	backup_release=$current
fi
printf 'backing up the authoring database (tools from %s)\n' "${backup_release##*/}"
as_studio "$backup_release" /usr/bin/python3 -I tools/db/studio_db.py backup --out "$backups"

# 2. Apply this release's migrations through its fixed entry point (transactional, idempotent).
printf 'migrating the authoring database for %s\n' "${release##*/}"
as_studio "$release" /usr/bin/node packages/v2-core/dist/migrate-postgres.js

# 3. The database must now serve this release: schema current (or ahead), history reconstructs.
as_studio "$release" /usr/bin/node packages/v2-core/dist/verify-authoring-database.js --out /dev/null
printf 'authoring database ready for %s\n' "${release##*/}"
