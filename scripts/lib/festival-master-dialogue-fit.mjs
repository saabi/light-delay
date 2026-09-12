/**
 * Pack Festival-master (or similar) shot cue placements to measured dialogue lengths.
 * Compresses idle gaps; preserves silence cues, timed actions, and suspense holds.
 */

export const CONVERSATIONAL_GAP_MS = 100;
export const COMPRESS_THRESHOLD_MS = 200;
export const TRAIL_TAIL_MS = 200;
export const ACTION_HOLD_FLOOR_MS = 400;

/** @typedef {{ cueId: string, atMs: number, durationMs?: number }} Placement */
/** @typedef {{ id: string, type: string, estimatedDurationMs?: number, text?: any, purpose?: any, description?: any }} Cue */

/**
 * @param {unknown} value
 * @returns {string}
 */
export function englishOf(value) {
	if (typeof value === 'string') return value;
	if (value && typeof value === 'object' && typeof value.en === 'string') return value.en;
	return '';
}

/**
 * @param {string} shotId
 * @param {string} [sceneId]
 */
export function isTitleOrCreditsShot(shotId, sceneId = '') {
	const blob = `${shotId} ${sceneId}`.toLowerCase();
	return /title|credit|cartela/.test(blob);
}

/**
 * Beats where long pauses are presumed intentional (reveal / murder / contact).
 * @param {string} blob
 */
export function isSuspenseContext(blob) {
	return /murder|impact|bodily|recording|inaudible|withheld|velari|contact|sabotage|neutron|hatch|transmit|greeting|silence/i.test(
		blob
	);
}

/**
 * @param {Placement} placement
 * @param {Cue | undefined} cue
 * @param {number | undefined} wavMs dialogue measured duration
 */
export function resolvePlacementDurationMs(placement, cue, wavMs) {
	if (cue?.type === 'dialogue') {
		if (typeof wavMs === 'number' && wavMs > 0) return wavMs;
		if (typeof cue.estimatedDurationMs === 'number') return cue.estimatedDurationMs;
		return Math.max(0, placement.durationMs ?? 0);
	}
	if (cue?.type === 'silence') {
		return Math.max(
			placement.durationMs ?? 0,
			cue.estimatedDurationMs ?? 0,
			ACTION_HOLD_FLOOR_MS
		);
	}
	return Math.max(0, placement.durationMs ?? 0);
}

/**
 * @param {Array<{ placement: Placement, cue?: Cue, durationMs: number, originalAtMs: number }>} rows
 * @param {{ shotId: string, sceneId?: string, suspenseKeep?: boolean }} ctx
 */
export function packShotPlacements(rows, ctx) {
	const sorted = [...rows].sort(
		(a, b) =>
			a.originalAtMs - b.originalAtMs ||
			a.placement.cueId.localeCompare(b.placement.cueId)
	);
	if (sorted.length === 0) {
		return { rows: [], shotDurationMs: 0, events: [] };
	}

	const title = isTitleOrCreditsShot(ctx.shotId, ctx.sceneId);
	const events = [];
	/** @type {typeof sorted} */
	const out = [];

	for (let i = 0; i < sorted.length; i += 1) {
		const row = sorted[i];
		const dur = row.durationMs;
		if (i === 0) {
			const atMs = title ? Math.max(0, row.originalAtMs) : Math.max(0, row.originalAtMs);
			out.push({ ...row, placement: { ...row.placement, atMs, durationMs: dur } });
			continue;
		}

		const prev = out[i - 1];
		const prevEnd = prev.placement.atMs + prev.durationMs;
		const hardMin = prevEnd + (prev.cue?.type === 'dialogue' && row.cue?.type === 'dialogue'
			? CONVERSATIONAL_GAP_MS
			: prev.cue?.type === 'dialogue' || row.cue?.type === 'dialogue'
				? CONVERSATIONAL_GAP_MS
				: 0);

		const originalGap = row.originalAtMs - (prev.originalAtMs + prev.durationMs);
		const protectedBySilence = prev.cue?.type === 'silence' || row.cue?.type === 'silence';
		const protectedByAction =
			(prev.cue?.type === 'action' || prev.cue?.type === 'sound') &&
			prev.durationMs >= ACTION_HOLD_FLOOR_MS;
		const protectedSuspense =
			Boolean(ctx.suspenseKeep) &&
			prev.cue?.type === 'dialogue' &&
			row.cue?.type === 'dialogue' &&
			originalGap >= 800;

		let nextAt;
		if (protectedBySilence || protectedByAction) {
			// Sequential: previous already consumed its hold; start ASAP after hardMin
			nextAt = Math.max(hardMin, row.originalAtMs);
			if (nextAt > hardMin + COMPRESS_THRESHOLD_MS && !protectedBySilence) {
				// action already occupied time via prev.durationMs; don't re-add original slack
				nextAt = hardMin;
			}
			if (protectedBySilence) {
				nextAt = hardMin;
				events.push({ kind: 'preserve-silence', cueId: row.placement.cueId });
			} else {
				events.push({ kind: 'preserve-action-hold', cueId: row.placement.cueId });
			}
		} else if (protectedSuspense) {
			nextAt = Math.max(hardMin, row.originalAtMs);
			events.push({
				kind: 'preserve-suspense-gap',
				cueId: row.placement.cueId,
				gapMs: originalGap
			});
		} else if (
			prev.cue?.type === 'dialogue' &&
			row.cue?.type === 'dialogue' &&
			row.originalAtMs > prevEnd + COMPRESS_THRESHOLD_MS
		) {
			nextAt = hardMin;
			events.push({
				kind: 'compress-gap',
				cueId: row.placement.cueId,
				fromGapMs: row.originalAtMs - prevEnd,
				toGapMs: CONVERSATIONAL_GAP_MS
			});
		} else {
			nextAt = Math.max(hardMin, row.originalAtMs);
			if (nextAt > row.originalAtMs) {
				events.push({
					kind: 'push-overlap',
					cueId: row.placement.cueId,
					deltaMs: nextAt - row.originalAtMs
				});
			}
		}

		out.push({
			...row,
			placement: { ...row.placement, atMs: nextAt, durationMs: dur }
		});
	}

	const contentEnd = out.reduce(
		(max, row) => Math.max(max, row.placement.atMs + row.durationMs),
		0
	);

	return { rows: out, contentEnd, events };
}

/**
 * Choose final shot duration after packing.
 * @param {{ contentEnd: number, previousDurationMs: number, title: boolean, hasTerminalSilence: boolean, lastDialogueEnd: number | null }} args
 */
export function chooseShotDurationMs(args) {
	const { contentEnd, previousDurationMs, title, hasTerminalSilence, lastDialogueEnd } = args;
	let duration = Math.max(contentEnd, 0);

	if (title || hasTerminalSilence) {
		duration = Math.max(duration, previousDurationMs, contentEnd);
		return duration;
	}

	if (lastDialogueEnd != null) {
		const trail = previousDurationMs - lastDialogueEnd;
		if (trail > TRAIL_TAIL_MS + COMPRESS_THRESHOLD_MS && contentEnd <= lastDialogueEnd + TRAIL_TAIL_MS) {
			duration = Math.max(contentEnd, lastDialogueEnd + TRAIL_TAIL_MS);
			return duration;
		}
	}

	// Extend if audio needs more than previous picture; otherwise match packed content
	duration = Math.max(contentEnd, Math.min(previousDurationMs, contentEnd));
	if (contentEnd > previousDurationMs) duration = contentEnd;
	else duration = contentEnd;
	return duration;
}

/**
 * Extend last placement so max(at+dur) === shotDurationMs (contiguous fill invariant).
 * @param {Placement[]} placements
 * @param {number} shotDurationMs
 */
export function fillContiguousSpan(placements, shotDurationMs) {
	if (!placements.length) return placements;
	const out = placements.map((p) => ({ ...p }));
	const span = out.reduce((max, p) => Math.max(max, p.atMs + (p.durationMs ?? 0)), 0);
	if (span < shotDurationMs) {
		const last = out[out.length - 1];
		last.durationMs = shotDurationMs - last.atMs;
	}
	return out;
}
