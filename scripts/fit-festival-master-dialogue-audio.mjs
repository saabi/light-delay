/**
 * Measure Festival-master EN dialogue WAVs, sync durations, and retiming placements.
 *
 * Usage:
 *   node scripts/fit-festival-master-dialogue-audio.mjs --check
 *   node scripts/fit-festival-master-dialogue-audio.mjs --write
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { measureWavDurationMs } from './lib/wav-duration.mjs';
import {
	CONVERSATIONAL_GAP_MS,
	chooseShotDurationMs,
	englishOf,
	fillContiguousSpan,
	isSuspenseContext,
	isTitleOrCreditsShot,
	packShotPlacements,
	resolvePlacementDurationMs
} from './lib/festival-master-dialogue-fit.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT_ID = 'script:light-delay-festival-master';
const SCRIPT_PATH = join(ROOT, 'data/scripts/light-delay-festival-master.json');
const ASSETS_PATH = join(ROOT, 'data/assets.json');
const PROJECT_PATH = join(ROOT, 'data/project.json');
const REPORT_DIR = join(ROOT, 'reports/dialogue-audio-fit');

function loadJson(path) {
	return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, data) {
	writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function staticPathFromAsset(asset) {
	const rel = String(asset.path || '').replace(/^\//, '');
	return join(ROOT, 'static', rel);
}

/**
 * Mutates script + assetsById map values. Returns report.
 */
export function fitFestivalMasterDialogue(script, assetsById) {
	const cueById = new Map((script.cues || []).map((c) => [c.id, c]));
	const sceneById = new Map((script.scenes || []).map((s) => [s.id, s]));
	const measured = new Map();
	const drift = [];
	const missingAudio = [];

	for (const cue of script.cues || []) {
		if (cue.type !== 'dialogue') continue;
		const variant = cue.content?.variants?.en;
		const assetId = variant?.audioAssetId;
		const asset = assetId ? assetsById.get(assetId) : null;
		const filePath = asset ? staticPathFromAsset(asset) : null;
		if (!assetId || !asset || !filePath || !existsSync(filePath)) {
			missingAudio.push(cue.id);
			continue;
		}
		const ms = measureWavDurationMs(filePath);
		measured.set(cue.id, ms);
		const catalog = variant.estimatedDurationMs ?? asset.durationMs;
		if (catalog != null && Math.abs(catalog - ms) > 1) {
			drift.push({ cueId: cue.id, catalog, measured: ms, delta: ms - catalog });
		}
		variant.estimatedDurationMs = ms;
		asset.durationMs = ms;
	}

	const beforeTotal = (script.shots || []).reduce((s, sh) => s + (sh.durationMs || 0), 0);
	const spillsBefore = [];
	const overlapsBefore = [];
	const shotReports = [];
	const compressEvents = [];

	for (const shot of script.shots || []) {
		const scene = sceneById.get(shot.sceneId);
		const sceneBlob = [
			shot.id,
			shot.sceneId,
			englishOf(shot.description),
			englishOf(scene?.title),
			englishOf(scene?.summary)
		].join(' ');

		const rows = [];
		for (const placement of shot.cuePlacements || []) {
			const cue = cueById.get(placement.cueId);
			const wavMs = cue?.type === 'dialogue' ? measured.get(cue.id) : undefined;
			const durationMs = resolvePlacementDurationMs(placement, cue, wavMs);
			rows.push({
				placement: { ...placement },
				cue,
				durationMs,
				originalAtMs: placement.atMs
			});
			if (cue?.type === 'dialogue' && typeof wavMs === 'number') {
				const end = placement.atMs + wavMs;
				if (end > shot.durationMs) {
					spillsBefore.push({
						shotId: shot.id,
						cueId: cue.id,
						overMs: end - shot.durationMs,
						atMs: placement.atMs,
						wavMs,
						shotMs: shot.durationMs
					});
				}
			}
		}

		const dialogueRows = rows
			.filter((r) => r.cue?.type === 'dialogue')
			.sort((a, b) => a.originalAtMs - b.originalAtMs);
		for (let i = 1; i < dialogueRows.length; i += 1) {
			const prev = dialogueRows[i - 1];
			const cur = dialogueRows[i];
			const prevEnd = prev.originalAtMs + prev.durationMs;
			if (cur.originalAtMs < prevEnd) {
				overlapsBefore.push({
					shotId: shot.id,
					a: prev.placement.cueId,
					b: cur.placement.cueId,
					overlapMs: prevEnd - cur.originalAtMs
				});
			}
		}

		const suspenseKeep = isSuspenseContext(
			sceneBlob +
				' ' +
				rows
					.map(
						(r) =>
							englishOf(r.cue?.text) +
							englishOf(r.cue?.purpose) +
							englishOf(r.cue?.description)
					)
					.join(' ')
		);

		const packed = packShotPlacements(rows, {
			shotId: shot.id,
			sceneId: shot.sceneId,
			suspenseKeep
		});
		compressEvents.push(...packed.events.map((e) => ({ shotId: shot.id, ...e })));

		const title = isTitleOrCreditsShot(shot.id, shot.sceneId);
		const hasTerminalSilence =
			packed.rows.length > 0 && packed.rows[packed.rows.length - 1].cue?.type === 'silence';
		const lastDialogue = [...packed.rows].reverse().find((r) => r.cue?.type === 'dialogue');
		const lastDialogueEnd = lastDialogue
			? lastDialogue.placement.atMs + lastDialogue.durationMs
			: null;

		let nextDuration = chooseShotDurationMs({
			contentEnd: packed.contentEnd,
			previousDurationMs: shot.durationMs,
			title,
			hasTerminalSilence,
			lastDialogueEnd
		});

		let nextPlacements = packed.rows.map((r) => ({
			...r.placement,
			atMs: r.placement.atMs,
			durationMs: r.durationMs
		}));
		const lastRow = packed.rows[packed.rows.length - 1];
		const lastIsDialogue = lastRow?.cue?.type === 'dialogue';
		if (title || hasTerminalSilence || !lastIsDialogue) {
			nextPlacements = fillContiguousSpan(nextPlacements, nextDuration);
		} else {
			// Keep dialogue durationMs === WAV; shot ends when audio ends (plus any prior holds).
			nextDuration = packed.contentEnd;
		}
		nextDuration = nextPlacements.reduce(
			(max, p) => Math.max(max, p.atMs + (p.durationMs ?? 0)),
			0
		);

		shotReports.push({
			shotId: shot.id,
			beforeMs: shot.durationMs,
			afterMs: nextDuration,
			deltaMs: nextDuration - shot.durationMs,
			events: packed.events
		});

		shot.durationMs = nextDuration;
		shot.cuePlacements = nextPlacements;
	}

	for (const scene of script.scenes || []) {
		scene.targetDurationMs = (script.shots || [])
			.filter((sh) => sh.sceneId === scene.id)
			.reduce((s, sh) => s + (sh.durationMs || 0), 0);
	}
	if (script.script) {
		script.script.targetDurationMs = (script.shots || []).reduce(
			(s, sh) => s + (sh.durationMs || 0),
			0
		);
	}

	const afterTotal = (script.shots || []).reduce((s, sh) => s + (sh.durationMs || 0), 0);
	const spillsAfter = [];
	const overlapsAfter = [];
	for (const shot of script.shots || []) {
		const dig = [];
		for (const placement of shot.cuePlacements || []) {
			const cue = cueById.get(placement.cueId);
			if (cue?.type !== 'dialogue') continue;
			const wavMs = measured.get(cue.id) ?? placement.durationMs ?? 0;
			dig.push({ id: cue.id, at: placement.atMs, end: placement.atMs + wavMs });
			if (placement.atMs + wavMs > shot.durationMs + 0.5) {
				spillsAfter.push({
					shotId: shot.id,
					cueId: cue.id,
					overMs: placement.atMs + wavMs - shot.durationMs
				});
			}
		}
		dig.sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));
		for (let i = 1; i < dig.length; i += 1) {
			if (dig[i].at < dig[i - 1].end) {
				overlapsAfter.push({
					shotId: shot.id,
					a: dig[i - 1].id,
					b: dig[i].id,
					overlapMs: dig[i - 1].end - dig[i].at
				});
			}
		}
	}

	return {
		scriptId: SCRIPT_ID,
		lang: 'en',
		conversationalGapMs: CONVERSATIONAL_GAP_MS,
		dialogueMeasured: measured.size,
		missingAudio,
		drift,
		spillsBefore,
		overlapsBefore,
		spillsAfter,
		overlapsAfter,
		beforeTotalMs: beforeTotal,
		afterTotalMs: afterTotal,
		shotReports,
		compressEvents: compressEvents.filter((e) => e.kind === 'compress-gap').length,
		preserveEvents: compressEvents.filter((e) => String(e.kind).startsWith('preserve')).length,
		pushEvents: compressEvents.filter((e) => e.kind === 'push-overlap').length,
		ok:
			missingAudio.length === 0 &&
			spillsAfter.length === 0 &&
			overlapsAfter.length === 0
	};
}

function writeReport(report) {
	mkdirSync(REPORT_DIR, { recursive: true });
	const base = join(REPORT_DIR, 'light-delay-festival-master.en');
	writeJson(`${base}.json`, report);
	const lines = [
		'# Festival-master dialogue audio fit (EN)',
		'',
		`- Dialogue measured: **${report.dialogueMeasured}**`,
		`- Missing audio: **${report.missingAudio.length}**`,
		`- Duration drift entries: **${report.drift.length}**`,
		`- Spills before → after: **${report.spillsBefore.length}** → **${report.spillsAfter.length}**`,
		`- Overlaps before → after: **${report.overlapsBefore.length}** → **${report.overlapsAfter.length}**`,
		`- Montage: **${report.beforeTotalMs}** → **${report.afterTotalMs}** ms (Δ ${report.afterTotalMs - report.beforeTotalMs})`,
		`- Compress / preserve / push events: **${report.compressEvents}** / **${report.preserveEvents}** / **${report.pushEvents}**`,
		`- Check OK: **${report.ok}**`,
		''
	];
	if (report.spillsBefore[0]) {
		lines.push('## Worst spills (before)');
		for (const s of [...report.spillsBefore].sort((a, b) => b.overMs - a.overMs).slice(0, 12)) {
			lines.push(
				`- ${s.shotId} ${s.cueId}: +${s.overMs} ms (at ${s.atMs}, wav ${s.wavMs}, shot ${s.shotMs})`
			);
		}
		lines.push('');
	}
	writeFileSync(`${base}.md`, lines.join('\n') + '\n', 'utf8');
	return base;
}

function updateProjectTarget(totalMs) {
	const project = loadJson(PROJECT_PATH);
	const scripts = project.project?.scripts || project.scripts || [];
	const entry = scripts.find((s) => s.id === SCRIPT_ID);
	if (entry) {
		entry.targetDurationMs = totalMs;
		const minutes = Math.floor(totalMs / 60000);
		const seconds = Math.round((totalMs % 60000) / 1000);
		const clock = `${minutes}:${String(seconds).padStart(2, '0')}`;
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
}

function main() {
	const args = process.argv.slice(2);
	const doWrite = args.includes('--write');
	const doCheck = args.includes('--check') || !doWrite;

	const scriptDisk = loadJson(SCRIPT_PATH);
	const assetsDisk = loadJson(ASSETS_PATH);
	const script = structuredClone(scriptDisk);
	const assetsById = new Map((structuredClone(assetsDisk).assets || []).map((a) => [a.id, a]));

	const report = fitFestivalMasterDialogue(script, assetsById);
	const base = writeReport(report);
	console.log(`Report: ${base}.json`);

	if (doWrite) {
		writeJson(SCRIPT_PATH, script);
		const mergedAssets = loadJson(ASSETS_PATH);
		const byId = new Map((mergedAssets.assets || []).map((a) => [a.id, a]));
		for (const [id, asset] of assetsById) {
			const target = byId.get(id);
			if (target && typeof asset.durationMs === 'number') {
				target.durationMs = asset.durationMs;
			}
		}
		writeJson(ASSETS_PATH, mergedAssets);
		updateProjectTarget(report.afterTotalMs);
		console.log('Wrote script, assets durationMs, and project targetDurationMs');
	}

	console.log(
		JSON.stringify(
			{
				ok: report.ok,
				missingAudio: report.missingAudio.length,
				spillsBefore: report.spillsBefore.length,
				spillsAfter: report.spillsAfter.length,
				overlapsBefore: report.overlapsBefore.length,
				overlapsAfter: report.overlapsAfter.length,
				beforeTotalMs: report.beforeTotalMs,
				afterTotalMs: report.afterTotalMs,
				wrote: doWrite
			},
			null,
			2
		)
	);

	if ((doCheck || doWrite) && !report.ok) process.exit(1);
}

main();
