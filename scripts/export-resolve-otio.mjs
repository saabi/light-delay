/**
 * Assemble or swap a DaVinci Resolve OTIO timeline from a ScriptFile.
 * Also writes EN/ES SRT sidecars for subtitle-track import (not embedded in OTIO).
 *
 * Usage:
 *   node scripts/export-resolve-otio.mjs --script-id script:light-delay-festival-master
 *   node scripts/export-resolve-otio.mjs --all
 *   node scripts/export-resolve-otio.mjs --from-otio export.otio --swap --script-id script:light-delay-festival-master
 *   node scripts/export-resolve-otio.mjs --check
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
	BOTH_SCRIPT_IDS,
	DEFAULT_FPS,
	DEFAULT_LANG,
	FESTIVAL_SCRIPT_ID,
	TIMELINE_START_SECONDS,
	assembleSmokeTimeline,
	assembleTimeline,
	assetsByIdFromFile,
	buildSrt,
	collectSubtitleCues,
	defaultOtioPath,
	defaultSmokeOtioPath,
	defaultSrtPath,
	scriptPathForId,
	serializeOtio,
	slugFromScriptId,
	swapTakes
} from './lib/resolve-otio.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS_PATH = join(ROOT, 'data/assets.json');
const SUBTITLE_LANGS = ['en', 'es'];

function loadJson(path) {
	return JSON.parse(readFileSync(path, 'utf8'));
}

function argValue(argv, name) {
	const eq = argv.find((item) => item.startsWith(`${name}=`));
	if (eq) return eq.slice(name.length + 1);
	const idx = argv.indexOf(name);
	if (idx >= 0) return argv[idx + 1];
	return undefined;
}

function parseArgs(argv) {
	return {
		all: argv.includes('--all'),
		check: argv.includes('--check'),
		swap: argv.includes('--swap'),
		scriptId: argValue(argv, '--script-id') || FESTIVAL_SCRIPT_ID,
		lang: argValue(argv, '--lang') || DEFAULT_LANG,
		fps: Number(argValue(argv, '--fps') || DEFAULT_FPS),
		out: argValue(argv, '--out'),
		fromOtio: argValue(argv, '--from-otio')
	};
}

function loadScriptAndAssets(scriptId) {
	const path = scriptPathForId(ROOT, scriptId);
	if (!existsSync(path)) throw new Error(`Script file missing: ${path}`);
	const script = loadJson(path);
	const assetsById = assetsByIdFromFile(loadJson(ASSETS_PATH));
	return { script, assetsById, path };
}

function writeOtio(outPath, timeline) {
	mkdirSync(dirname(outPath), { recursive: true });
	writeFileSync(outPath, serializeOtio(timeline), 'utf8');
}

function writeSubtitles(script, { fps, check }) {
	const written = [];
	for (const lang of SUBTITLE_LANGS) {
		const cues = collectSubtitleCues(script, { lang, fps });
		const body = buildSrt(cues, { timelineStartSeconds: TIMELINE_START_SECONDS, fps });
		const dest = defaultSrtPath(ROOT, script.script?.id, lang);
		if (!check && body) {
			mkdirSync(dirname(dest), { recursive: true });
			writeFileSync(dest, body, 'utf8');
		}
		written.push({ lang, dest, cueCount: cues.length, wrote: !check && Boolean(body) });
	}
	return written;
}

function assembleOne(scriptId, { lang, fps, out, check }) {
	const { script, assetsById } = loadScriptAndAssets(scriptId);
	const { timeline, report } = assembleTimeline(script, assetsById, {
		root: ROOT,
		lang,
		fps
	});
	const dest = out || defaultOtioPath(ROOT, scriptId);
	if (!check) writeOtio(dest, timeline);
	const subtitles = writeSubtitles(script, { fps, check });
	report.subtitles = Object.fromEntries(
		subtitles.map((row) => [row.lang, { cueCount: row.cueCount, out: row.dest }])
	);
	return { dest, report, wrote: !check, subtitles };
}

function swapOne(scriptId, { fromOtio, fps, out, check }) {
	if (!fromOtio) throw new Error('--swap requires --from-otio <path>');
	if (!existsSync(fromOtio)) throw new Error(`OTIO missing: ${fromOtio}`);
	const { script, assetsById } = loadScriptAndAssets(scriptId);
	const timeline = loadJson(fromOtio);
	const { timeline: next, report } = swapTakes(timeline, script, assetsById, {
		root: ROOT,
		fps
	});
	const dest = out || defaultOtioPath(ROOT, `${slugFromScriptId(scriptId)}.swapped`);
	if (!check) writeOtio(dest, next);
	return { dest, report, wrote: !check, subtitles: [] };
}

export function runExport(argv = process.argv.slice(2)) {
	const args = parseArgs(argv);
	if (args.swap && args.all) {
		throw new Error('Swap is per-file; pass --from-otio and one --script-id, not --all');
	}
	const ids = args.all ? BOTH_SCRIPT_IDS : [args.scriptId];
	const results = [];
	for (const scriptId of ids) {
		const result = args.swap
			? swapOne(scriptId, args)
			: assembleOne(scriptId, { ...args, out: args.all ? undefined : args.out });
		results.push({ scriptId, ...result });
	}
	if (!args.swap && !args.check) {
		const smokeDest = defaultSmokeOtioPath(ROOT);
		writeOtio(smokeDest, assembleSmokeTimeline(ROOT));
		results.push({
			scriptId: 'smoke-one-still',
			dest: smokeDest,
			wrote: true,
			report: { pictureClips: 1, dialogueClips: 0 },
			subtitles: []
		});
	}
	return results;
}

function invokedDirectly() {
	try {
		return import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
	} catch {
		return false;
	}
}

if (invokedDirectly()) {
	try {
		const results = runExport(process.argv.slice(2));
		for (const result of results) {
			console.log(
				JSON.stringify(
					{
						scriptId: result.scriptId,
						out: result.dest,
						wrote: result.wrote,
						subtitles: result.subtitles,
						report: result.report
					},
					null,
					2
				)
			);
		}
	} catch (error) {
		console.error(error.message || error);
		process.exitCode = 1;
	}
}
