/**
 * Re-export visual-stretch candidate helpers for Vitest.
 * @see scripts/lib/visual-stretch-candidates.mjs
 */
export {
	shotTimelineKey,
	compareShotsByTimeline,
	adjacencyRejection,
	findVisualStretchCandidates,
	formatVisualStretchCandidate
} from '$project-tools/lib/visual-stretch-candidates.mjs';
