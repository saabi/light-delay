#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $# -ne 4 ]]; then
	printf 'usage: %s --archive <path> --sha <git-sha>\n' "$0" >&2
	exit 2
fi

archive=''
sha=''
while [[ $# -gt 0 ]]; do
	case "$1" in
		--archive) archive=$2; shift 2 ;;
		--sha) sha=$2; shift 2 ;;
		*) printf 'unknown argument: %s\n' "$1" >&2; exit 2 ;;
	esac
done

if [[ ! "$sha" =~ ^[0-9a-f]{40}$ ]]; then
	printf 'invalid Git SHA: %s\n' "$sha" >&2
	exit 2
fi
[[ -f "$archive" ]] || { printf 'archive not found: %s\n' "$archive" >&2; exit 1; }

studio_root=/srv/studio
release_root=$studio_root/releases
release_dir=$release_root/$sha
temporary_dir=$release_root/.${sha}.install.$$
trap 'rm -rf "$temporary_dir"' EXIT

[[ ! -e "$release_dir" ]] || { printf 'release already exists: %s\n' "$release_dir" >&2; exit 1; }
mkdir -p "$temporary_dir"
tar --extract --gzip --file="$archive" --directory="$temporary_dir" --no-same-owner
[[ -f "$temporary_dir/release.json" ]] || { printf 'archive has no release metadata\n' >&2; exit 1; }
[[ -f "$temporary_dir/apps/studio/package.json" ]] || { printf 'archive has no Studio package manifest\n' >&2; exit 1; }
[[ -f "$temporary_dir/apps/studio/build/index.js" ]] || { printf 'archive has no Node build entrypoint\n' >&2; exit 1; }

printf 'installing production runtime dependencies\n'
npm ci --omit=dev --ignore-scripts --audit=false --fund=false --prefix "$temporary_dir"
mv "$temporary_dir" "$release_dir"
sudo -n /usr/local/sbin/studio-stage-activate "$release_dir" "$sha"

health=$(/usr/bin/curl --fail --silent --show-error --retry 15 --retry-delay 1 --retry-connrefused http://127.0.0.1:5100/health)
node - "$sha" "$health" <<'NODE'
const [expected, body] = process.argv.slice(2);
const payload = JSON.parse(body);
if (payload.ok !== true || payload.service !== 'studio' || payload.revision !== expected) {
  throw new Error(`unexpected health response: ${body}`);
}
NODE

rm -f "$archive"
printf 'staging service is healthy at revision %s\n' "$sha"
