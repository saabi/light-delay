/**
 * Scrub spoken dialogue / subtitle copy from storyboard still generation prompts.
 *
 *   node scripts/scrub-still-prompts-no-dialogue.mjs --check
 *   node scripts/scrub-still-prompts-no-dialogue.mjs --write
 *   node scripts/scrub-still-prompts-no-dialogue.mjs --write --script light-delay-festival-master
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	looksLikeSpokenDialogue,
	scrubStillTakeGeneration
} from './lib/still-prompt-no-dialogue.mjs';

const ROOT = join(fileURLToPath(new URL('..', import.meta.url)));
const args = process.argv.slice(2);
const write = args.includes('--write');
const check = args.includes('--check') || !write;
const scriptFilter = (() => {
	const idx = args.indexOf('--script');
	return idx >= 0 ? args[idx + 1] : null;
})();

const scriptNames = [
	'light-delay-festival-master.json',
	'light-delay-trailer-master.json'
].filter((name) => !scriptFilter || name.includes(scriptFilter));

function remainingDialogueQuotes(prompt) {
	const matches = [...(prompt.matchAll(/"([^"\n]{1,500})"/g) ?? [])].map((m) => m[1]);
	return matches.filter((q) => looksLikeSpokenDialogue(q));
}

const report = [];
for (const name of scriptNames) {
	const path = join(ROOT, 'data/scripts', name);
	const script = JSON.parse(readFileSync(path, 'utf8'));
	let changed = 0;
	const leftovers = [];
	for (const take of script.takes ?? []) {
		if (!take.generation?.prompt) continue;
		const before = take.generation.prompt;
		if (scrubStillTakeGeneration(take)) changed += 1;
		const left = remainingDialogueQuotes(take.generation.prompt);
		if (left.length) leftovers.push({ shotId: take.shotId, quotes: left });
		if (!write) take.generation.prompt = before;
	}
	report.push({ script: name, changed, leftovers });
	if (write) {
		writeFileSync(path, `${JSON.stringify(script, null, 2)}\n`, 'utf8');
	}
}

for (const row of report) {
	console.log(
		`${row.script}: ${write ? 'wrote' : 'would change'} ${row.changed} takes; leftover dialogue quotes=${row.leftovers.length}`
	);
	for (const left of row.leftovers.slice(0, 20)) {
		console.log(`  ${left.shotId}: ${left.quotes.map((q) => JSON.stringify(q)).join('; ')}`);
	}
}

if (check && !write) {
	const dirty = report.reduce((n, r) => n + r.changed + r.leftovers.length, 0);
	process.exit(dirty ? 1 : 0);
}
if (write && report.some((r) => r.leftovers.length)) {
	console.error('Scrub left residual dialogue quotes; review leftovers above.');
	process.exit(1);
}
