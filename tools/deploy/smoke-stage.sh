#!/usr/bin/env bash
set -Eeuo pipefail
[[ $# -eq 2 && "$2" =~ ^[0-9a-f]{40}$ ]] || exit 2
archive=$1
sha=$2
stage_dir=$(mktemp -d)
server_pid=''
cleanup() {
  if [[ -n "$server_pid" ]]; then kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true; fi
  rm -rf "$stage_dir"
}
trap cleanup EXIT
tar -xzf "$archive" -C "$stage_dir"
cd "$stage_dir"
npm ci --omit=dev --ignore-scripts --audit=false --fund=false
HOST=127.0.0.1 PORT=5119 node apps/studio/build/index.js >server.log 2>&1 &
server_pid=$!
body=$(curl --fail --silent --show-error --retry 15 --retry-delay 1 --retry-connrefused http://127.0.0.1:5119/health)
node - "$sha" "$body" <<'NODE'
const [revision, body] = process.argv.slice(2);
const health = JSON.parse(body);
if (!health.ok || health.service !== 'studio' || health.revision !== revision) throw new Error('Packaged release health mismatch');
NODE
curl --fail --silent http://127.0.0.1:5119/ > /dev/null
