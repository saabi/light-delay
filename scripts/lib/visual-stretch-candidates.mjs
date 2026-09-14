/**
 * Advisory visual-stretch candidate detection.
 * Never writes ScriptFile.visualStretches or any other JSON.
 */

import {
	collectOnScreenCharacterIds,
	locationAncestryRoot,
	locationsShareAncestry
} from './reference-budget.mjs';

/**
 * @typedef {'location_mismatch' | 'no_cast_overlap' | 'environment_unknown' | 'environment_mismatch' | 'continuity_break' | 'sequence_mismatch' | 'timeline_gap'} CandidateRejectionCode
 * @typedef {{
 *   code: 'visual_stretch_candidate',
 *   shotIds: string[],
 *   shotLabels: string[],
 *   locationId: string,
 *   ancestryRoot: string,
 *   reason: string,
 *   confidence: 'high' | 'medium',
 *   status: 'suggested' | 'already_authored',
 *   alreadyCoveredByStretchId?: string,
 *   notAutoCreatedReason: string,
 *   castOverlap: string[]
 * }} VisualStretchCandidate
 * @typedef {{ shotA: string, shotB: string, reason: CandidateRejectionCode }} SuppressedAdjacency
 */

const NOT_AUTO_CREATED =
	'advisory only; requires editorial approval before adding visualStretch';

/**
 * Composite timeline key: (scene.order, shot.order, shot.id).
 * @param {any} shot
 * @param {Map<string, any>} scenesById
 * @returns {[number, number, string]}
 */
export function shotTimelineKey(shot, scenesById) {
	const scene = scenesById.get(shot.sceneId);
	const sceneOrder = Number.isFinite(scene?.order) ? scene.order : Number.MAX_SAFE_INTEGER;
	const shotOrder = Number.isFinite(shot?.order) ? shot.order : Number.MAX_SAFE_INTEGER;
	return [sceneOrder, shotOrder, String(shot.id || '')];
}

/**
 * @param {any} a
 * @param {any} b
 * @param {Map<string, any>} scenesById
 */
export function compareShotsByTimeline(a, b, scenesById) {
	const ka = shotTimelineKey(a, scenesById);
	const kb = shotTimelineKey(b, scenesById);
	if (ka[0] !== kb[0]) return ka[0] - kb[0];
	if (ka[1] !== kb[1]) return ka[1] - kb[1];
	return ka[2].localeCompare(kb[2]);
}

/**
 * @param {any} transition
 * @returns {boolean}
 */
function isContinuityBreakTransition(transition) {
	if (!transition?.transition) return false;
	const t = transition.transition;
	if (t === 'cut' || t === 'match_cut') return false;
	return (
		t === 'crossfade' ||
		t === 'fade_in' ||
		t === 'fade_out' ||
		t === 'cut_to_black' ||
		Boolean(t)
	);
}

/**
 * @param {any} shotA
 * @param {any} shotB
 * @returns {boolean}
 */
function adjacentHasContinuityBreak(shotA, shotB) {
	return (
		isContinuityBreakTransition(shotA.transitionOut) ||
		isContinuityBreakTransition(shotB.transitionIn)
	);
}

/**
 * @param {any} sceneA
 * @param {any} sceneB
 * @returns {CandidateRejectionCode | null}
 */
function environmentCompatibility(sceneA, sceneB) {
	const a = sceneA?.setting?.interiorExterior;
	const b = sceneB?.setting?.interiorExterior;
	if (!a || !b) return 'environment_unknown';
	if (a !== b) return 'environment_mismatch';
	return null;
}

/**
 * @param {any} shotA
 * @param {any} shotB
 * @param {Map<string, any>} scenesById
 * @param {Map<string, any>} locationsById
 * @returns {CandidateRejectionCode | null}
 */
export function adjacencyRejection(shotA, shotB, scenesById, locationsById) {
	const sceneA = scenesById.get(shotA.sceneId);
	const sceneB = scenesById.get(shotB.sceneId);
	if (!shotA.locationId || !shotB.locationId) return 'location_mismatch';
	if (!locationsShareAncestry(shotA.locationId, shotB.locationId, locationsById)) {
		return 'location_mismatch';
	}
	if (adjacentHasContinuityBreak(shotA, shotB)) return 'continuity_break';

	const sameScene = shotA.sceneId && shotA.sceneId === shotB.sceneId;
	if (!sameScene) {
		const seqA = sceneA?.sequenceId;
		const seqB = sceneB?.sequenceId;
		if (!seqA || !seqB || seqA !== seqB) return 'sequence_mismatch';
		const env = environmentCompatibility(sceneA, sceneB);
		if (env) return env;
	} else {
		const env = environmentCompatibility(sceneA, sceneB);
		if (env === 'environment_unknown' || env === 'environment_mismatch') return env;
	}

	const castA = new Set(collectOnScreenCharacterIds(shotA));
	const castB = collectOnScreenCharacterIds(shotB);
	const hasOverlap = castB.some((id) => castA.has(id));
	// Same scene is a strong signal: CU cutaways need not share faces with the prior shot.
	// Cross-scene runs still require on-screen cast overlap.
	if (!sameScene && !hasOverlap) return 'no_cast_overlap';
	return null;
}

/**
 * Soft heuristic moved to visual-stretch.mjs (browser-safe). Re-export not needed here.
 */

/**
 * @param {string} shotId
 * @returns {string}
 */
function shotLabel(shotId) {
	const m = /shot-plan-(\d+[a-z]?)$/i.exec(shotId);
	return m ? m[1] : shotId;
}

/**
 * Advisory candidates — never mutates script.
 * @param {{ visualStretches?: any[], shots?: any[], scenes?: any[] }} script
 * @param {{ locationsById: Map<string, any> }} opts
 * @returns {{ candidates: VisualStretchCandidate[], suppressedAdjacencies: SuppressedAdjacency[] }}
 */
export function findVisualStretchCandidates(script, opts) {
	const locationsById = opts.locationsById;
	const scenesById = new Map((script.scenes || []).map((s) => [s.id, s]));
	const shots = [...(script.shots ?? [])].sort((a, b) =>
		compareShotsByTimeline(a, b, scenesById)
	);
	/** @type {Map<string, string>} */
	const stretchByShot = new Map();
	for (const stretch of script.visualStretches ?? []) {
		for (const member of stretch.members ?? []) {
			stretchByShot.set(member.shotId, stretch.id);
		}
	}

	/** @type {SuppressedAdjacency[]} */
	const suppressedAdjacencies = [];
	/** @type {VisualStretchCandidate[]} */
	const candidates = [];

	let runStart = 0;
	while (runStart < shots.length) {
		let runEnd = runStart;
		while (runEnd + 1 < shots.length) {
			const a = shots[runEnd];
			const b = shots[runEnd + 1];
			const rejection = adjacencyRejection(a, b, scenesById, locationsById);
			if (rejection) {
				suppressedAdjacencies.push({ shotA: a.id, shotB: b.id, reason: rejection });
				break;
			}
			// Cross-scene extension still requires a non-empty cumulative on-screen cast intersection.
			const prospective = shots.slice(runStart, runEnd + 2);
			const crossesScene = prospective.some((s) => s.sceneId !== prospective[0].sceneId);
			if (crossesScene) {
				/** @type {Set<string>} */
				let inter = new Set(collectOnScreenCharacterIds(prospective[0]));
				for (const shot of prospective.slice(1)) {
					const next = new Set(collectOnScreenCharacterIds(shot));
					inter = new Set([...inter].filter((id) => next.has(id)));
				}
				if (!inter.size) {
					suppressedAdjacencies.push({
						shotA: a.id,
						shotB: b.id,
						reason: 'no_cast_overlap'
					});
					break;
				}
			}
			runEnd += 1;
		}
		const run = shots.slice(runStart, runEnd + 1);
		if (run.length >= 2) {
			const sameSceneRun = run.every((s) => s.sceneId && s.sceneId === run[0].sceneId);
			/** @type {Set<string>} */
			let overlap = new Set(collectOnScreenCharacterIds(run[0]));
			for (let i = 1; i < run.length; i += 1) {
				const next = new Set(collectOnScreenCharacterIds(run[i]));
				overlap = new Set([...overlap].filter((id) => next.has(id)));
			}
			/** @type {Set<string>} */
			const castUnion = new Set();
			for (const shot of run) {
				for (const id of collectOnScreenCharacterIds(shot)) castUnion.add(id);
			}
			const castOverlap = sameSceneRun
				? [...(overlap.size ? overlap : castUnion)].sort()
				: [...overlap].sort();
			if (castOverlap.length) {
				const locationId = run[0].locationId;
				const ancestryRoot = locationAncestryRoot(locationId, locationsById);
				const conf =
					overlap.size >= 2 || (sameSceneRun && castUnion.size >= 2)
						? /** @type {'high'} */ ('high')
						: /** @type {'medium'} */ ('medium');
				const shotIds = run.map((s) => s.id);
				const coveringStretchIds = [
					...new Set(shotIds.map((id) => stretchByShot.get(id)).filter(Boolean))
				];
				const fullyCovered =
					coveringStretchIds.length === 1 &&
					shotIds.every((id) => stretchByShot.get(id) === coveringStretchIds[0]);
				candidates.push({
					code: 'visual_stretch_candidate',
					shotIds,
					shotLabels: shotIds.map(shotLabel),
					locationId,
					ancestryRoot,
					reason: 'same location, cast overlap, continuous time',
					confidence: conf,
					status: fullyCovered ? 'already_authored' : 'suggested',
					...(fullyCovered
						? { alreadyCoveredByStretchId: /** @type {string} */ (coveringStretchIds[0]) }
						: {}),
					notAutoCreatedReason: NOT_AUTO_CREATED,
					castOverlap
				});
			} else if (run.length >= 2) {
				suppressedAdjacencies.push({
					shotA: run[0].id,
					shotB: run[1].id,
					reason: 'no_cast_overlap'
				});
			}
		}
		runStart = runEnd + 1;
	}

	return { candidates, suppressedAdjacencies };
}

/**
 * Human-readable candidate block for reports.
 * @param {VisualStretchCandidate} candidate
 */
export function formatVisualStretchCandidate(candidate) {
	const lines = [
		'visual_stretch_candidate',
		`shots: ${candidate.shotLabels.join(', ')}`,
		`reason: ${candidate.reason}`,
		`confidence: ${candidate.confidence}`,
		`status: ${candidate.status}`,
		`not_auto_created: ${candidate.notAutoCreatedReason}`
	];
	if (candidate.alreadyCoveredByStretchId) {
		lines.push(`already_authored: ${candidate.alreadyCoveredByStretchId}`);
	}
	return lines.join('\n');
}
