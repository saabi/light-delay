#!/usr/bin/env node
/**
 * Scrub restated character appearance from Festival-master still prompts.
 *
 * Attached reference sheets are the authority for static appearance
 * (docs/production/DIALOGUE_AND_PROMPT_LESSONS.md §6). Legacy prompts carried a
 * `Cast: Name (appearance…); Name (…).` sentence that re-described referenced
 * characters. This tool replaces it with an on-frame cast line derived from
 * `Shot.visibleRefs` minus `offScreenCharacterIds`, and strips the legacy
 * "secondary: the ship's dense engineering deck" clause where the engineering
 * deck is not a shot location.
 *
 *   node scripts/scrub-still-prompt-cast.mjs --check   # exit 1 if any prompt still restates appearance
 *   node scripts/scrub-still-prompt-cast.mjs --write   # rewrite prompts in place
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT_PATH = join(ROOT, 'data', 'scripts', 'light-delay-festival-master.json');
const CAST_SENTENCE = / Cast: [^.]*\. /;
const ENGINEERING_CLAUSE = /; secondary: the ship's dense engineering deck[^.]*\./;

/** @param {any} c */
function displayName(c) {
	if (c.id === 'character:rao') return 'Elin Rao';
	if (c.id === 'character:periodista') return 'the Earth reporter';
	return c.shortName || c.name?.en || c.id;
}

/**
 * @param {any} script
 * @param {Map<string, any>} charactersById
 * @returns {{ changed: Array<{ takeId: string, before: string, after: string }>, remaining: string[] }}
 */
export function scrubStillPromptCast(script, charactersById) {
	const shotsById = new Map((script.shots || []).map((s) => [s.id, s]));
	const changed = [];
	const remaining = [];
	for (const take of script.takes || []) {
		const prompt = take.generation?.prompt;
		if (typeof prompt !== 'string') continue;
		const shot = shotsById.get(take.shotId);
		let next = prompt;
		const match = next.match(CAST_SENTENCE);
		if (match) {
			const off = new Set(shot?.offScreenCharacterIds || []);
			const names = (shot?.visibleRefs || [])
				.filter((v) => v.kind === 'character' && !off.has(v.id))
				.map((v) => displayName(charactersById.get(v.id) || { id: v.id }));
			const replacement = names.length
				? ` On frame: ${names.join(', ')}; static appearance per the attached reference sheets. `
				: ' ';
			next = next.replace(CAST_SENTENCE, replacement);
		}
		const engineeringShot =
			shot?.locationId === 'location:celestial-ardor-engineering' ||
			(shot?.secondaryLocationIds || []).includes('location:celestial-ardor-engineering');
		if (!engineeringShot && ENGINEERING_CLAUSE.test(next)) next = next.replace(ENGINEERING_CLAUSE, '.');
		if (next !== prompt) {
			changed.push({ takeId: take.id, before: prompt, after: next });
			take.generation.prompt = next;
		}
		if (CAST_SENTENCE.test(next)) remaining.push(take.id);
	}
	return { changed, remaining };
}

const args = process.argv.slice(2);
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
	const write = args.includes('--write');
	const check = args.includes('--check') || !write;
	const script = JSON.parse(readFileSync(SCRIPT_PATH, 'utf8'));
	const characters = JSON.parse(readFileSync(join(ROOT, 'data', 'characters.json'), 'utf8')).characters;
	const charactersById = new Map(characters.map((c) => [c.id, c]));
	const { changed, remaining } = scrubStillPromptCast(script, charactersById);
	if (write) {
		writeFileSync(SCRIPT_PATH, `${JSON.stringify(script, null, 2)}\n`, 'utf8');
		console.log(`scrub:still-prompt-cast wrote ${changed.length} prompt(s)`);
		for (const c of changed) console.log(`- ${c.takeId}`);
	} else if (check) {
		if (changed.length) {
			console.error(`scrub:still-prompt-cast:check FAILED — ${changed.length} prompt(s) still restate reference appearance:`);
			for (const c of changed) console.error(`- ${c.takeId}`);
			process.exitCode = 1;
		} else {
			console.log('scrub:still-prompt-cast:check OK');
		}
	}
	if (remaining.length) {
		console.error(`unresolved Cast sentences after scrub: ${remaining.join(', ')}`);
		process.exitCode = 1;
	}
}
