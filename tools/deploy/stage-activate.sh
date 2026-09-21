#!/usr/bin/env bash
set -Eeuo pipefail

if [[ ${EUID:-$(id -u)} -ne 0 ]]; then
	printf 'stage-activate must run as root\n' >&2
	exit 1
fi

if [[ $# -ne 2 ]]; then
	printf 'usage: %s <release-directory> <git-sha>\n' "$0" >&2
	exit 2
fi

release_dir=$1
sha=$2
studio_root=/srv/studio
release_root=$studio_root/releases
current_link=$studio_root/current
env_file=$studio_root/shared/studio-stage.env

if [[ ! "$sha" =~ ^[0-9a-f]{40}$ ]]; then
	printf 'invalid Git SHA: %s\n' "$sha" >&2
	exit 2
fi

case "$release_dir" in
	"$release_root/$sha") ;;
	*) printf 'release must be exactly under %s/<sha>\n' "$release_root" >&2; exit 1 ;;
esac

[[ -f "$release_dir/apps/studio/build/index.js" ]] || { printf 'missing Studio build in %s\n' "$release_dir" >&2; exit 1; }
[[ -f "$release_dir/release.json" ]] || { printf 'missing release metadata in %s\n' "$release_dir" >&2; exit 1; }
grep -Fq "\"revision\":\"$sha\"" "$release_dir/release.json" || {
	printf 'release metadata does not match %s\n' "$sha" >&2
	exit 1
}

if node -e "const p=require(process.argv[1]); process.exit(p.scripts?.['db:migrate:stage'] ? 0 : 1)" "$release_dir/package.json"; then
	[[ -r "$env_file" ]] || { printf 'migration hook exists but %s is not readable\n' "$env_file" >&2; exit 1; }
	printf 'running staging database migrations from %s\n' "$release_dir"
	set -a
	# The environment file is root-controlled on the VM and is never copied from GitHub.
	. "$env_file"
	set +a
	cd "$release_dir"
	runuser -u studio -- env NODE_ENV=production npm run db:migrate:stage
else
	printf 'no db:migrate:stage script; no database migrations run\n'
fi

chown -R studio:studio "$release_dir"
temporary_link="$studio_root/.current-$sha-$$"
rm -f "$temporary_link"
ln -s "$release_dir" "$temporary_link"
mv -Tf "$temporary_link" "$current_link"

systemctl restart studio-stage.service
systemctl is-active --quiet studio-stage.service
printf 'activated %s\n' "$sha"
