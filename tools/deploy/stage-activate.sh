#!/bin/bash -p
set -Eeuo pipefail
export PATH=/usr/sbin:/usr/bin:/sbin:/bin
unset NODE_OPTIONS PYTHONPATH PYTHONHOME
[[ ${EUID:-$(id -u)} -eq 0 ]] || { echo 'stage-activate must run as root' >&2; exit 1; }
if [[ $# -eq 1 && "$1" == --protocol-version ]]; then echo 2; exit 0; fi
[[ $# -eq 2 && "$2" =~ ^[0-9a-f]{40}$ ]] || { echo 'usage: stage-activate <release-directory> <git-sha>' >&2; exit 2; }
# This lock and both helpers must be installed by an administrator.
exec 9>/run/studio-stage/stage-activate.lock
flock -x 9
release_dir=$(/usr/bin/python3 -I /usr/local/libexec/studio-stage-finalize.py "$1" "$2")
current_link=/srv/studio/current
previous=$(readlink "$current_link" || true)
temporary_link=/srv/studio/.current-$$
trap 'rm -f "$temporary_link"' EXIT
ln -s "$release_dir" "$temporary_link"
mv -Tf "$temporary_link" "$current_link"
if ! systemctl restart studio-stage.service || ! systemctl is-active --quiet studio-stage.service; then
    if [[ "$previous" =~ ^/srv/studio/releases/[0-9a-f]{40}$ ]]; then
        /usr/bin/python3 -I /usr/local/libexec/studio-stage-finalize.py "$previous" "${previous##*/}" >/dev/null
        ln -s "$previous" "$temporary_link"
        mv -Tf "$temporary_link" "$current_link"
        systemctl restart studio-stage.service
    fi
    echo 'activation failed' >&2
    exit 1
fi
# Activation and rollback never execute migrations or package scripts.
printf 'activated %s\n' "$2"
