/**
 * Dialogue timing rollups, shot flags, and report data.
 * Operates on plain script JSON objects (no TypeScript).
 */
// @ts-nocheck
import {
	estimateDialogueVariantMs,
	isOffCameraPresentation,
	MONTAGE_SURPLUS_SPOKEN_RATIO,
	MONTAGE_SURPLUS_THRESHOLD_MS,
	SILENT_LONG_SHOT_MS
} from './spoken-duration-core.mjs';

/**
 * @param {string} language
 * @returns {string}
 */
function baseLanguage(language) {
	const idx = language.indexOf('-');
	return idx === -1 ? language : language.slice(0, idx);
}

/**
 * @param {{ sourceLanguage: string; variants: Record<string, unknown> }} content
 * @param {string} requestedLanguage
 * @param {string} projectFallback
 * @returns {{ value: Record<string, unknown>; resolvedLanguage: string; usedFallback: boolean } | undefined}
 */
export function resolveLocalized(content, requestedLanguage, projectFallback = 'es') {
	const order = [
		requestedLanguage,
		baseLanguage(requestedLanguage),
		content.sourceLanguage,
		projectFallback
	];
	const seen = new Set();
	for (const lang of order) {
		if (!lang || seen.has(lang)) continue;
		seen.add(lang);
		const value = content.variants[lang];
		if (value) {
			return {
				value: /** @type {Record<string, unknown>} */ (value),
				resolvedLanguage: lang,
				usedFallback: lang !== requestedLanguage
			};
		}
	}
	return undefined;
}

/**
 * Dialogue variants are co-located on disk; reports no longer inject from overlay.
 * @param {import('../../src/lib/types/script.ts').ScriptFile} source
 * @param {string} _language
 */
export function localizeScriptDialogue(source, _language) {
	const language = _language || 'es';
	const visit = (value) => {
		if (Array.isArray(value)) return value.map(visit);
		if (!value || typeof value !== 'object') return value;
		if (typeof value.es === 'string') {
			return (
				value[language] ??
				value[baseLanguage(language)] ??
				value.es
			);
		}
		return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, visit(child)]));
	};
	return visit(source);
}

/**
 * @param {import('../../src/lib/types/script.ts').Cue} cue
 * @param {string} language
 * @param {string} [projectFallback='es']
 * @returns {number}
 */
export function estimateCueSpokenMs(cue, language, projectFallback = 'es') {
	if (cue.type === 'dialogue') {
		const resolved = resolveLocalized(cue.content, language, projectFallback);
		if (!resolved) return 0;
		return estimateDialogueVariantMs(resolved.value, language, cue.performance);
	}
	if (cue.type === 'silence') {
		return cue.estimatedDurationMs !== undefined ? Math.max(0, cue.estimatedDurationMs) : 0;
	}
	return 0;
}

/**
 * @param {import('../../src/lib/types/script.ts').ScriptFile} script
 * @returns {Map<string, import('../../src/lib/types/script.ts').Cue>}
 */
function cueById(script) {
	return new Map(script.cues.map((cue) => [cue.id, cue]));
}

/**
 * @param {import('../../src/lib/types/script.ts').ScriptFile} script
 * @returns {Map<string, string>}
 */
function beatSceneId(script) {
	return new Map(script.beats.map((beat) => [beat.id, beat.sceneId]));
}

/**
 * @param {import('../../src/lib/types/script.ts').CuePlacement | undefined} placement
 * @param {import('../../src/lib/types/script.ts').DialogueCue} cue
 */
function effectivePresentation(placement, cue) {
	return placement?.presentationOverride ?? cue.presentation;
}

/**
 * @param {import('../../src/lib/types/script.ts').Shot} shot
 * @param {Record<string, number> | undefined} [shotDurations]
 * @returns {number}
 */
export function montageShotMs(shot, shotDurations = undefined) {
	const overlay = shotDurations?.[shot.id];
	return overlay !== undefined ? overlay : shot.durationMs || 0;
}

/**
 * @param {import('../../src/lib/types/script.ts').ScriptFile} script
 * @param {string} sceneId
 * @param {Record<string, number> | undefined} shotDurations
 */
export function montageSceneMs(script, sceneId, shotDurations) {
	return script.shots
		.filter((shot) => shot.sceneId === sceneId)
		.reduce((sum, shot) => sum + montageShotMs(shot, shotDurations), 0);
}

/**
 * @param {import('../../src/lib/types/script.ts').ScriptFile} script
 * @param {Record<string, number> | undefined} shotDurations
 */
export function montageScriptMs(script, shotDurations) {
	return script.shots.reduce((sum, shot) => sum + montageShotMs(shot, shotDurations), 0);
}

/**
 * @param {import('../../src/lib/types/script.ts').ScriptFile} script
 * @param {import('../../src/lib/types/script.ts').Shot} shot
 * @param {string} language
 * @param {string} [projectFallback='es']
 */
export function estimateShotSpokenMs(script, shot, language, projectFallback = 'es') {
	const cues = cueById(script);
	let total = 0;
	for (const placement of shot.cuePlacements) {
		const cue = cues.get(placement.cueId);
		if (!cue || cue.type !== 'dialogue') continue;
		total += estimateCueSpokenMs(cue, language, projectFallback);
	}
	return total;
}

/**
 * @param {import('../../src/lib/types/script.ts').ScriptFile} script
 * @param {string} sceneId
 * @param {string} language
 * @param {string} [projectFallback='es']
 */
export function estimateSceneSpokenMs(script, sceneId, language, projectFallback = 'es') {
	const sceneByBeat = beatSceneId(script);
	let total = 0;
	for (const cue of script.cues) {
		if (cue.type !== 'dialogue') continue;
		if (sceneByBeat.get(cue.beatId) !== sceneId) continue;
		total += estimateCueSpokenMs(cue, language, projectFallback);
	}
	return total;
}

/**
 * @param {import('../../src/lib/types/script.ts').ScriptFile} script
 * @param {string} language
 * @param {string} [projectFallback='es']
 */
export function estimateScriptSpokenMs(script, language, projectFallback = 'es') {
	let total = 0;
	for (const cue of script.cues) {
		if (cue.type !== 'dialogue') continue;
		total += estimateCueSpokenMs(cue, language, projectFallback);
	}
	return total;
}

/**
 * @param {import('../../src/lib/types/script.ts').ScriptFile} script
 * @param {import('../../src/lib/types/script.ts').Shot} shot
 * @param {string} language
 * @param {string} [projectFallback='es']
 */
export function analyzeShotDialogue(script, shot, language, projectFallback = 'es') {
	const cues = cueById(script);
	const speakerIds = [];
	const speakerSeen = new Set();
	let offCameraCueCount = 0;
	let onScreenCueCount = 0;
	const offCameraPresentations = /** @type {string[]} */ ([]);

	for (const placement of shot.cuePlacements) {
		const cue = cues.get(placement.cueId);
		if (!cue || cue.type !== 'dialogue') continue;
		if (!speakerSeen.has(cue.speakerId)) {
			speakerSeen.add(cue.speakerId);
			speakerIds.push(cue.speakerId);
		}
		const presentation = effectivePresentation(placement, cue);
		if (isOffCameraPresentation(presentation)) {
			offCameraCueCount += 1;
			if (!offCameraPresentations.includes(presentation)) {
				offCameraPresentations.push(presentation);
			}
		} else {
			onScreenCueCount += 1;
		}
	}

	const speakerCount = speakerIds.length;
	return {
		speakerIds,
		speakerCount,
		multiSpeaker: speakerCount > 2,
		offCameraDialogue: offCameraCueCount > 0,
		offCameraCueCount,
		onScreenCueCount,
		offCameraPresentations,
		spokenMs: estimateShotSpokenMs(script, shot, language, projectFallback),
		montageMs: montageShotMs(shot)
	};
}

/**
 * @param {number} ms
 */
export function formatClock(ms) {
	const totalSec = Math.max(0, Math.floor(ms / 1000));
	const h = Math.floor(totalSec / 3600);
	const m = Math.floor((totalSec % 3600) / 60);
	const s = totalSec % 60;
	if (h > 0) {
		return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
	}
	return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * @param {import('../../src/lib/types/script.ts').ScriptFile} script
 * @param {string} language
 * @param {{ shotDurations?: Record<string, number>; projectFallback?: string }} [options]
 */
export function buildDialogueTimingReport(script, language, options = {}) {
	const { shotDurations, projectFallback = 'es' } = options;
	const scriptId = script.script.id;
	const montageMs = montageScriptMs(script, shotDurations);
	const spokenMs = estimateScriptSpokenMs(script, language, projectFallback);
	const deltaMs = spokenMs - montageMs;

	const scenes = [...script.scenes].sort((a, b) => a.order - b.order);
	const sceneReports = [];
	const spokenSurplusShots = /** @type {Array<Record<string, unknown>>} */ ([]);
	const multiSpeakerShots = /** @type {Array<Record<string, unknown>>} */ ([]);
	const offCameraShots = /** @type {Array<Record<string, unknown>>} */ ([]);
	const montageSurplusScenes = /** @type {Array<Record<string, unknown>>} */ ([]);
	const silentLongShots = /** @type {Array<Record<string, unknown>>} */ ([]);

	for (const scene of scenes) {
		const sceneMontageMs = montageSceneMs(script, scene.id, shotDurations);
		const sceneSpokenMs = estimateSceneSpokenMs(script, scene.id, language, projectFallback);
		const sceneDeltaMs = sceneSpokenMs - sceneMontageMs;
		const sceneShots = script.shots
			.filter((shot) => shot.sceneId === scene.id)
			.sort((a, b) => a.order - b.order);

		const shotReports = sceneShots.map((shot) => {
			const analysis = analyzeShotDialogue(script, shot, language, projectFallback);
			const shotMontageMs = montageShotMs(shot, shotDurations);
			const shotSpokenMs = analysis.spokenMs;
			const shotDeltaMs = shotSpokenMs - shotMontageMs;
			const entry = {
				shotId: shot.id,
				shotNumber: shot.number,
				sceneId: scene.id,
				sceneNumber: scene.number,
				montageMs: shotMontageMs,
				spokenMs: shotSpokenMs,
				deltaMs: shotDeltaMs,
				speakerIds: analysis.speakerIds,
				speakerCount: analysis.speakerCount,
				multiSpeaker: analysis.multiSpeaker,
				offCameraDialogue: analysis.offCameraDialogue,
				offCameraCueCount: analysis.offCameraCueCount,
				onScreenCueCount: analysis.onScreenCueCount,
				offCameraPresentations: analysis.offCameraPresentations
			};

			if (shotSpokenMs > shotMontageMs) {
				spokenSurplusShots.push(entry);
			}
			if (analysis.multiSpeaker) {
				multiSpeakerShots.push(entry);
			}
			if (analysis.offCameraDialogue) {
				offCameraShots.push(entry);
			}
			if (shotMontageMs >= SILENT_LONG_SHOT_MS && shotSpokenMs === 0) {
				silentLongShots.push(entry);
			}
			return entry;
		});

		const visualSurplus = sceneMontageMs - sceneSpokenMs;
		const spokenShare = sceneMontageMs > 0 ? sceneSpokenMs / sceneMontageMs : 0;
		if (
			visualSurplus >= MONTAGE_SURPLUS_THRESHOLD_MS &&
			spokenShare < MONTAGE_SURPLUS_SPOKEN_RATIO
		) {
			montageSurplusScenes.push({
				sceneId: scene.id,
				sceneNumber: scene.number,
				sceneTitle: scene.title,
				montageMs: sceneMontageMs,
				spokenMs: sceneSpokenMs,
				deltaMs: sceneDeltaMs,
				visualSurplusMs: visualSurplus,
				spokenShare
			});
		}

		sceneReports.push({
			sceneId: scene.id,
			sceneNumber: scene.number,
			sceneTitle: scene.title,
			montageMs: sceneMontageMs,
			spokenMs: sceneSpokenMs,
			deltaMs: sceneDeltaMs,
			shots: shotReports
		});
	}

	spokenSurplusShots.sort((a, b) => b.deltaMs - a.deltaMs);
	montageSurplusScenes.sort((a, b) => b.visualSurplusMs - a.visualSurplusMs);
	silentLongShots.sort((a, b) => b.montageMs - a.montageMs);

	return {
		scriptId,
		language,
		generatedAt: new Date().toISOString(),
		summary: {
			montageMs,
			spokenMs,
			deltaMs,
			multiSpeakerShotCount: multiSpeakerShots.length,
			offCameraShotCount: offCameraShots.length,
			spokenSurplusShotCount: spokenSurplusShots.length,
			montageSurplusSceneCount: montageSurplusScenes.length,
			silentLongShotCount: silentLongShots.length,
			consoleLine: `surplus shots: ${spokenSurplusShots.length}, multi-speaker: ${multiSpeakerShots.length}, off-camera: ${offCameraShots.length}, loose scenes: ${montageSurplusScenes.length}, silent long: ${silentLongShots.length}`
		},
		scenes: sceneReports,
		flags: {
			spokenSurplusShots,
			multiSpeakerShots,
			offCameraShots,
			montageSurplusScenes,
			silentLongShots
		}
	};
}

/**
 * @param {ReturnType<typeof buildDialogueTimingReport>} report
 */
export function formatDialogueTimingMarkdown(report) {
	const lines = [];
	const { summary } = report;
	lines.push(`# Informe de tiempos de diálogo — ${report.scriptId}`);
	lines.push('');
	lines.push(`Idioma: **${report.language}** · Generado: ${report.generatedAt}`);
	lines.push('');
	lines.push('## Resumen del guion');
	lines.push('');
	lines.push(
		`| Montaje | Diálogo estimado | Delta |`,
		`| --- | --- | --- |`,
		`| ${formatClock(summary.montageMs)} | ~${formatClock(summary.spokenMs)} | ${summary.deltaMs >= 0 ? '+' : ''}${formatClock(Math.abs(summary.deltaMs))}${summary.deltaMs < 0 ? ' (montaje holgado)' : ''} |`
	);
	lines.push('');
	if (summary.deltaMs > 0) {
		lines.push(
			'> El diálogo estimado supera la duración de montaje: conviene alargar tomas o repartir líneas.'
		);
	} else if (summary.deltaMs < 0) {
		lines.push('> El montaje supera el diálogo hablado: hay margen visual o silencios intencionales.');
	}
	lines.push('');
	lines.push(
		`- Tomas con diálogo de sobra: **${summary.spokenSurplusShotCount}**`,
		`- Tomas con más de dos hablantes: **${summary.multiSpeakerShotCount}**`,
		`- Tomas con diálogo fuera de cámara: **${summary.offCameraShotCount}**`,
		`- Escenas con montaje holgado: **${summary.montageSurplusSceneCount}**`,
		`- Tomas largas sin diálogo: **${summary.silentLongShotCount}**`
	);
	lines.push('');

	appendShotSection(lines, 'Tomas con diálogo de sobra', report.flags.spokenSurplusShots, (shot) => {
		const delta = /** @type {number} */ (shot.deltaMs);
		return delta > 0
			? `*alargar toma / repartir en más tomas* — surplus ${formatClock(delta)}`
			: '';
	});
	appendShotSection(
		lines,
		'Tomas con más de dos hablantes',
		report.flags.multiSpeakerShots,
		(shot) =>
			`*partir cobertura* — ${shot.speakerCount} hablantes: ${/** @type {string[]} */ (shot.speakerIds).join(', ')}`
	);
	appendShotSection(
		lines,
		'Tomas con diálogo fuera de cámara',
		report.flags.offCameraShots,
		(shot) =>
			`*cobertura o corte* — ${/** @type {string[]} */ (shot.offCameraPresentations).join(', ')} (${shot.offCameraCueCount} cues)`
	);

	lines.push('## Escenas con montaje holgado');
	lines.push('');
	if (report.flags.montageSurplusScenes.length === 0) {
		lines.push('_Ninguna escena supera el umbral._');
	} else {
		for (const scene of report.flags.montageSurplusScenes) {
			lines.push(
				`- **Escena ${scene.sceneNumber}** (${scene.sceneId}): montaje ${formatClock(scene.montageMs)}, diálogo ~${formatClock(scene.spokenMs)}, holgura visual ${formatClock(scene.visualSurplusMs)} — *¿falta diálogo o es intencionalmente visual?*`
			);
		}
	}
	lines.push('');

	lines.push('## Tomas largas sin diálogo');
	lines.push('');
	if (report.flags.silentLongShots.length === 0) {
		lines.push('_Ninguna._');
	} else {
		for (const shot of report.flags.silentLongShots) {
			lines.push(
				`- **Toma ${shot.shotNumber}** (${shot.shotId}) — escena ${shot.sceneNumber}: ${formatClock(shot.montageMs)} sin diálogo`
			);
		}
	}
	lines.push('');

	lines.push('## Detalle por escena');
	lines.push('');
	for (const scene of report.scenes) {
		lines.push(`### Escena ${scene.sceneNumber}: ${scene.sceneTitle}`);
		lines.push(
			`Montaje ${formatClock(scene.montageMs)} · Diálogo ~${formatClock(scene.spokenMs)} · Delta ${scene.deltaMs >= 0 ? '+' : '-'}${formatClock(Math.abs(scene.deltaMs))}`
		);
		lines.push('');
		lines.push('| Toma | Montaje | Diálogo | Delta | Hablantes | Flags |');
		lines.push('| --- | --- | --- | --- | --- | --- |');
		for (const shot of scene.shots) {
			const flags = [];
			if (shot.multiSpeaker) flags.push('multi');
			if (shot.offCameraDialogue) flags.push('off-cam');
			if (shot.spokenMs > shot.montageMs) flags.push('surplus');
			lines.push(
				`| ${shot.shotNumber} \`${shot.shotId}\` | ${formatClock(shot.montageMs)} | ~${formatClock(shot.spokenMs)} | ${shot.deltaMs >= 0 ? '+' : '-'}${formatClock(Math.abs(shot.deltaMs))} | ${shot.speakerCount} | ${flags.join(', ') || '—'} |`
			);
		}
		lines.push('');
	}

	return lines.join('\n');
}

/**
 * @param {string[]} lines
 * @param {string} title
 * @param {Array<Record<string, unknown>>} shots
 * @param {(shot: Record<string, unknown>) => string} hint
 */
function appendShotSection(lines, title, shots, hint) {
	lines.push(`## ${title}`);
	lines.push('');
	if (shots.length === 0) {
		lines.push('_Ninguna._');
	} else {
		for (const shot of shots) {
			lines.push(
				`- **Toma ${shot.shotNumber}** (\`${shot.shotId}\`) — escena ${shot.sceneNumber}: montaje ${formatClock(/** @type {number} */ (shot.montageMs))}, diálogo ~${formatClock(/** @type {number} */ (shot.spokenMs))}. ${hint(shot)}`
			);
		}
	}
	lines.push('');
}
