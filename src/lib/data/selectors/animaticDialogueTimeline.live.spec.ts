import { describe, expect, it } from 'vitest';
import { getScript } from '$lib/data/repositories';
import { buildShotDialogueTimeline } from './animaticDialogueTimeline';

describe('buildShotDialogueTimeline (festival-master promoted EN)', () => {
	it('resolves audio URLs for placed dialogue cues', () => {
		const script = getScript('script:light-delay-festival-master');
		const durations = script.shots.map((shot) => shot.durationMs);
		const timeline = buildShotDialogueTimeline(script, durations, 'en');
		expect(timeline.length).toBe(128);
		expect(timeline.every((cue) => cue.url.includes('/assets/audio/dialogue/'))).toBe(true);
		expect(timeline[0]!.startMs).toBeGreaterThanOrEqual(0);
		for (let i = 1; i < timeline.length; i += 1) {
			expect(timeline[i]!.startMs).toBeGreaterThanOrEqual(timeline[i - 1]!.startMs);
		}
	});
});

describe('buildShotDialogueTimeline (main-short promoted EN)', () => {
	it('resolves audio URLs for placed dialogue cues', () => {
		const script = getScript('script:light-delay-main-short');
		const durations = script.shots.map((shot) => shot.durationMs);
		const timeline = buildShotDialogueTimeline(script, durations, 'en');
		expect(timeline.length).toBeGreaterThan(90);
		expect(timeline.every((cue) => cue.url.includes('/assets/audio/dialogue/'))).toBe(true);
		expect(timeline[0]!.startMs).toBeGreaterThanOrEqual(0);
		for (let i = 1; i < timeline.length; i += 1) {
			expect(timeline[i]!.startMs).toBeGreaterThanOrEqual(timeline[i - 1]!.startMs);
		}
	});
});
