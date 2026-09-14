/**
 * Inherit `implementsFactIds` onto trailer-master cues from the Festival-master cues
 * they're sourced from (see `scripts/lib/trailer-master-facts.mjs`).
 *
 * Usage:
 *   node scripts/link-trailer-master-facts.mjs --check
 *   node scripts/link-trailer-master-facts.mjs --write
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { linkTrailerMasterFacts } from './lib/trailer-master-facts.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TRAILER_PATH = join(ROOT, 'data/scripts/light-delay-trailer-master.json');
const FESTIVAL_PATH = join(ROOT, 'data/scripts/light-delay-festival-master.json');
const REPORT_DIR = join(ROOT, 'reports/trailer-master-facts');

function loadJson(path) {
	return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, data) {
	writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function writeReport(link) {
	mkdirSync(REPORT_DIR, { recursive: true });
	const base = join(REPORT_DIR, 'light-delay-trailer-master');
	writeJson(`${base}.json`, link);
	const lines = [
		'# Trailer-master fact inheritance',
		'',
		`- Cues with an inherited fact binding applied: **${link.linked.filter((row) => row.applied.length).length}**`,
		`- Facts flagged as omitted-list candidates (not applied, needs review): **${link.needsReview.length}**`,
		''
	];
	for (const row of link.needsReview) {
		lines.push(
			`- \`${row.trailerCueId}\` (from \`${row.festivalCueId}\`) candidate fact \`${row.factId}\` is on the trailer's omitted-facts list — verify the trailer cue's own text doesn't depict it, then either reword it or add a content-verified override in \`scripts/lib/trailer-master-facts.mjs\`.`
		);
	}
	writeFileSync(`${base}.md`, lines.join('\n') + '\n', 'utf8');
	return base;
}

function main() {
	const args = process.argv.slice(2);
	const doWrite = args.includes('--write');
	const doCheck = args.includes('--check') || !doWrite;

	const trailerDisk = loadJson(TRAILER_PATH);
	const festival = loadJson(FESTIVAL_PATH);
	const trailer = structuredClone(trailerDisk);

	const link = linkTrailerMasterFacts(trailer, festival);
	const base = writeReport(link);
	console.log(`Report: ${base}.json`);

	const ok = link.needsReview.length === 0;
	if (doWrite) {
		writeJson(TRAILER_PATH, trailer);
		console.log('Wrote trailer script implementsFactIds');
	}

	console.log(
		JSON.stringify(
			{
				ok,
				linked: link.linked.length,
				needsReview: link.needsReview.length,
				wrote: doWrite
			},
			null,
			2
		)
	);

	if ((doCheck || doWrite) && !ok) process.exit(1);
}

main();
