/**
 * Point trailer-master dialogue at Festival-master EN WAVs and refit shot timings.
 *
 * Usage:
 *   node scripts/link-trailer-master-festival-dialogue-audio.mjs --check
 *   node scripts/link-trailer-master-festival-dialogue-audio.mjs --write
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fitFestivalMasterDialogue } from './fit-festival-master-dialogue-audio.mjs';
import { linkTrailerMasterFestivalDialogue } from './lib/trailer-master-festival-dialogue-audio.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TRAILER_ID = 'script:light-delay-trailer-master';
const TRAILER_PATH = join(ROOT, 'data/scripts/light-delay-trailer-master.json');
const FESTIVAL_PATH = join(ROOT, 'data/scripts/light-delay-festival-master.json');
const ASSETS_PATH = join(ROOT, 'data/assets.json');
const PROJECT_PATH = join(ROOT, 'data/project.json');
const REPORT_DIR = join(ROOT, 'reports/dialogue-audio-fit');

function loadJson(path) {
	return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, data) {
	writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function formatClock(totalMs) {
	const minutes = Math.floor(totalMs / 60000);
	const seconds = Math.round((totalMs % 60000) / 1000);
	return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function updateProjectTarget(totalMs) {
	const project = loadJson(PROJECT_PATH);
	const scripts = project.project?.scripts || project.scripts || [];
	const entry = scripts.find((s) => s.id === TRAILER_ID);
	if (!entry) return;
	entry.targetDurationMs = totalMs;
	const clock = formatClock(totalMs);
	if (entry.label && typeof entry.label === 'object') {
		if (typeof entry.label.en === 'string') {
			entry.label.en = entry.label.en.replace(/~\d+:\d+/, `~${clock}`);
		}
		if (typeof entry.label.es === 'string') {
			entry.label.es = entry.label.es.replace(/~\d+:\d+/, `~${clock}`);
		}
	}
	writeJson(PROJECT_PATH, project);
}

function updateTrailerTitleClock(script, totalMs) {
	const clockSeconds = Math.round(totalMs / 1000);
	const title = script.script?.title;
	if (!title || typeof title !== 'object') return;
	if (typeof title.en === 'string') {
		title.en = title.en.replace(/~\d+s/, `~${clockSeconds}s`);
	}
	if (typeof title.es === 'string') {
		title.es = title.es.replace(/~\d+s/, `~${clockSeconds}s`);
	}
}

function writeReport(link, fit) {
	mkdirSync(REPORT_DIR, { recursive: true });
	const base = join(REPORT_DIR, 'light-delay-trailer-master.en');
	const report = {
		scriptId: TRAILER_ID,
		lang: 'en',
		linked: link.linked,
		missing: link.missing,
		fit
	};
	writeJson(`${base}.json`, report);
	const lines = [
		'# Trailer-master dialogue audio (reused Festival EN)',
		'',
		`- Linked cues: **${link.linked.length}**`,
		`- Missing: **${link.missing.length}**`,
		`- Condensed copy still using a longer source WAV: **${link.linked.filter((row) => row.condensed).length}**`,
		`- Dialogue measured: **${fit.dialogueMeasured}**`,
		`- Spills before → after: **${fit.spillsBefore.length}** → **${fit.spillsAfter.length}**`,
		`- Overlaps before → after: **${fit.overlapsBefore.length}** → **${fit.overlapsAfter.length}**`,
		`- Montage: **${fit.beforeTotalMs}** → **${fit.afterTotalMs}** ms (${formatClock(fit.afterTotalMs)})`,
		`- Check OK: **${Boolean(fit.ok && link.missing.length === 0)}**`,
		''
	];
	writeFileSync(`${base}.md`, lines.join('\n') + '\n', 'utf8');
	return base;
}

function main() {
	const args = process.argv.slice(2);
	const doWrite = args.includes('--write');
	const doCheck = args.includes('--check') || !doWrite;

	const trailerDisk = loadJson(TRAILER_PATH);
	const festival = loadJson(FESTIVAL_PATH);
	const assetsDisk = loadJson(ASSETS_PATH);
	const trailer = structuredClone(trailerDisk);
	const assetsById = new Map((structuredClone(assetsDisk).assets || []).map((a) => [a.id, a]));

	const link = linkTrailerMasterFestivalDialogue(trailer, festival);
	const fit = fitFestivalMasterDialogue(trailer, assetsById);
	fit.scriptId = TRAILER_ID;
	updateTrailerTitleClock(trailer, fit.afterTotalMs);
	const base = writeReport(link, fit);
	console.log(`Report: ${base}.json`);

	const ok = fit.ok && link.missing.length === 0;
	if (doWrite) {
		writeJson(TRAILER_PATH, trailer);
		updateProjectTarget(fit.afterTotalMs);
		console.log('Wrote trailer script and project targetDurationMs');
	}

	console.log(
		JSON.stringify(
			{
				ok,
				linked: link.linked.length,
				missing: link.missing.length,
				condensed: link.linked.filter((row) => row.condensed).length,
				beforeTotalMs: fit.beforeTotalMs,
				afterTotalMs: fit.afterTotalMs,
				wrote: doWrite
			},
			null,
			2
		)
	);

	if ((doCheck || doWrite) && !ok) process.exit(1);
}

main();
