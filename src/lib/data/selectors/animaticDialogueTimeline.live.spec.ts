import { describe, expect, it } from 'vitest';
import { getScript } from '$lib/data/repositories';
import { buildShotDialogueTimeline } from './animaticDialogueTimeline';

describe('buildShotDialogueTimeline (festival-master promoted EN)', () => {
	it('resolves audio URLs for placed dialogue cues', () => {
		const script = getScript('script:light-delay-festival-master');
		const durations = script.shots.map((shot) => shot.durationMs);
		const timeline = buildShotDialogueTimeline(script, durations, 'en');
		// A concurrent TTS pass had generated audio for all 8 of the cues changed/added in the
		// prior gravity/dialogue-clarity pass (128 original + 3 brand-new dialogue cues = 131).
		// A later clarity pass rewrote 4 more cues (0024, 0062, 0133, 0140) for audience legibility,
		// invalidating their now-stale recorded audio: their audioAssetId was deleted pending
		// re-synthesis, so 131 - 4 = 127 resolve to a URL again.
		expect(timeline.length).toBe(127);
		expect(timeline.every((cue) => cue.url.includes('/assets/audio/dialogue/'))).toBe(true);
		expect(timeline[0]!.startMs).toBeGreaterThanOrEqual(0);
		for (let i = 1; i < timeline.length; i += 1) {
			expect(timeline[i]!.startMs).toBeGreaterThanOrEqual(timeline[i - 1]!.startMs);
		}
	});
});

describe('buildShotDialogueTimeline (trailer-master reused Festival EN)', () => {
	it('resolves audio URLs for placed dialogue cues', () => {
		const script = getScript('script:light-delay-trailer-master');
		const durations = script.shots.map((shot) => shot.durationMs);
		const timeline = buildShotDialogueTimeline(script, durations, 'en');
		// trailer-master:cue-a-04 reuses festival-master:cue-0024's audio directly; the clarity
		// pass that rewrote cue-0024 invalidated that shared audioAssetId (deleted pending
		// re-synthesis), so one fewer trailer cue resolves to a URL until it's re-linked.
		expect(timeline.length).toBe(15);
		expect(
			timeline.every((cue) =>
				cue.url.includes('/assets/audio/dialogue/light-delay-festival-master/')
			)
		).toBe(true);
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
