#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $# -ne 2 ]]; then
	printf 'usage: %s <git-sha> <output-archive>\n' "$0" >&2
	exit 2
fi

sha=$1
output=$2
root_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
stage_dir=$(mktemp -d "${TMPDIR:-/tmp}/studio-stage-package.XXXXXX")
trap 'rm -rf "$stage_dir"' EXIT

if [[ ! "$sha" =~ ^[0-9a-f]{40}$ ]]; then
	printf 'invalid Git SHA: %s\n' "$sha" >&2
	exit 2
fi

mkdir -p "$stage_dir/apps/light-delay" "$stage_dir/apps/studio" "$stage_dir/packages/v2-core"
cp -a "$root_dir/apps/studio/build" "$stage_dir/apps/studio/build"
cp "$root_dir/apps/light-delay/package.json" "$stage_dir/apps/light-delay/package.json"
cp "$root_dir/apps/studio/package.json" "$stage_dir/apps/studio/package.json"
cp -a "$root_dir/packages/v2-core/dist" "$stage_dir/packages/v2-core/dist"
cp "$root_dir/packages/v2-core/package.json" "$stage_dir/packages/v2-core/package.json"
cp "$root_dir/package.json" "$root_dir/package-lock.json" "$stage_dir/"

node - "$stage_dir/release.json" "$sha" <<'NODE'
const fs = require('node:fs');
const [output, revision] = process.argv.slice(2);
fs.writeFileSync(
  output,
  `${JSON.stringify({
    service: 'studio',
    revision,
    builtAt: new Date().toISOString()
  })}\n`
);
NODE

mkdir -p "$(dirname "$output")"
tar -C "$stage_dir" -czf "$output" .
printf 'created %s\n' "$output"
