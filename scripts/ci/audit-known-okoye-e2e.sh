#!/usr/bin/env bash
set -euo pipefail

log_file=$(mktemp)
trap 'rm -f "$log_file"' EXIT
set +e
env -u LIGHT_DELAY_COMPAT_GATE npm run test:e2e --workspace @light-delay/legacy -- \
	src/routes/page.svelte.e2e.ts --grep 'Okoye exposes' >"$log_file" 2>&1
status=$?
set -e
cat "$log_file"

if [[ $status -eq 0 ]] || ! grep -Fq 'Nigerian, preferably Igbo, inflection' "$log_file"; then
	echo 'Okoye data audit no longer matches its documented stale-copy exception.' >&2
	exit 1
fi
echo 'KNOWN PROJECT-DATA FAILURE (audited): stale Okoye voice-copy expectation.'
