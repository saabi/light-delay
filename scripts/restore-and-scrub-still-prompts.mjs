/**
 * Restore take.generation.prompt/negativePrompt from HEAD, then scrub dialogue.
 * Keeps all other current ScriptFile edits (e.g. cue spokenText).
 *
 *   node scripts/restore-and-scrub-still-prompts.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	looksLikeSpokenDialogue,
	scrubStillTakeGeneration
} from './lib/still-prompt-no-dialogue.mjs';

const ROOT = join(fileURLToPath(new URL('..', import.meta.url)));

function loadHead(relPath) {
	const raw = execFileSync('git', ['show', `HEAD:${relPath}`], {
		cwd: ROOT,
		encoding: 'utf8',
		maxBuffer: 64 * 1024 * 1024
	});
	return JSON.parse(raw);
}

function remainingDialogueQuotes(prompt) {
	return [...(prompt.matchAll(/"([^"\n]{1,500})"/g) ?? [])]
		.map((m) => m[1])
		.filter((q) => looksLikeSpokenDialogue(q));
}

const targets = [
	'data/scripts/light-delay-festival-master.json',
	'data/scripts/light-delay-trailer-master.json'
];

for (const rel of targets) {
	const path = join(ROOT, rel);
	const current = JSON.parse(readFileSync(path, 'utf8'));
	const head = loadHead(rel.replace(/\\/g, '/'));
	const headById = new Map((head.takes ?? []).map((t) => [t.id ?? t.shotId, t]));
	let restored = 0;
	let scrubbed = 0;
	const leftovers = [];

	for (const take of current.takes ?? []) {
		const key = take.id ?? take.shotId;
		const fromHead = headById.get(key) ?? headById.get(take.shotId);
		if (fromHead?.generation?.prompt) {
			take.generation = {
				...(take.generation ?? {}),
				prompt: fromHead.generation.prompt,
				negativePrompt: fromHead.generation.negativePrompt
			};
			restored += 1;
		}
		if (scrubStillTakeGeneration(take)) scrubbed += 1;
		const left = remainingDialogueQuotes(take.generation?.prompt ?? '');
		if (left.length) leftovers.push({ shotId: take.shotId, quotes: left });
	}

	writeFileSync(path, `${JSON.stringify(current, null, 2)}\n`, 'utf8');
	console.log(
		`${rel}: restoredPrompts=${restored} scrubbed=${scrubbed} leftovers=${leftovers.length}`
	);
	for (const row of leftovers.slice(0, 30)) {
		console.log(`  ${row.shotId}: ${row.quotes.map((q) => JSON.stringify(q)).join('; ')}`);
	}
	if (leftovers.length) process.exitCode = 1;
}
