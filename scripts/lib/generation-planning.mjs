import { createHash } from 'node:crypto';

/** @param {string | object} value */
export function sha256(value) {
	return createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
}

/**
 * @param {{ id: string, durationMs: number, cuePlacements?: Array<{ atMs: number }> }} shot
 * @param {number} maxSegmentMs
 */
export function planSegments(shot, maxSegmentMs) {
	if (!Number.isInteger(maxSegmentMs) || maxSegmentMs <= 0) throw new Error('maxSegmentMs must be positive');
	const duration = shot.durationMs;
	const candidates = [...new Set((shot.cuePlacements ?? []).map((p) => p.atMs).filter((ms) => ms > 0 && ms < duration))].sort((a, b) => a - b);
	const boundaries = [0];
	while ((boundaries.at(-1) ?? 0) + maxSegmentMs < duration) {
		const start = boundaries.at(-1) ?? 0;
		const ceiling = start + maxSegmentMs;
		const semantic = candidates.filter((ms) => ms > start && ms <= ceiling).at(-1);
		boundaries.push(semantic && semantic - start >= Math.min(1000, maxSegmentMs / 4) ? semantic : ceiling);
	}
	boundaries.push(duration);
	return boundaries.slice(0, -1).map((startMs, index) => ({
		id: `${shot.id}:segment-${String(index + 1).padStart(2, '0')}`,
		startMs,
		endMs: boundaries[index + 1],
		continuation: index === 0 ? 'none' : 'accepted_video_and_last_frame',
		promptStatus: 'blocked',
		compiledPrompt: null
	}));
}

/**
 * @param {Array<{ kind: 'image' | 'video' | 'audio', id?: string }>} references
 * @param {{ maxImages?: number | null, maxVideos?: number | null, maxAudios?: number | null, maxTotalReferences?: number | null }} limits
 */
export function checkReferenceBudget(references, limits) {
	const counts = { image: 0, video: 0, audio: 0 };
	for (const reference of references) counts[reference.kind] += 1;
	const violations = [];
	if (limits.maxImages != null && counts.image > limits.maxImages) violations.push(`images:${counts.image}>${limits.maxImages}`);
	if (limits.maxVideos != null && counts.video > limits.maxVideos) violations.push(`videos:${counts.video}>${limits.maxVideos}`);
	if (limits.maxAudios != null && counts.audio > limits.maxAudios) violations.push(`audios:${counts.audio}>${limits.maxAudios}`);
	const total = counts.image + counts.video + counts.audio;
	if (limits.maxTotalReferences != null && total > limits.maxTotalReferences) violations.push(`total:${total}>${limits.maxTotalReferences}`);
	return { counts, total, violations, ok: violations.length === 0 };
}

/**
 * @param {Record<string, string>} sections
 * @param {string[]} blockers
 */
export function compilePrompt(sections, blockers = []) {
	if (blockers.length) throw new Error(`Prompt is blocked: ${blockers.join(', ')}`);
	const order = ['style', 'actionTiming', 'subjects', 'location', 'camera', 'lighting', 'physics', 'interfaceVfx', 'continuity', 'audio', 'negative'];
	const missing = order.filter((key) => !sections[key]?.trim());
	if (missing.length) throw new Error(`Prompt sections missing: ${missing.join(', ')}`);
	return order.map((key) => `${key}: ${sections[key].trim()}`).join('\n');
}
