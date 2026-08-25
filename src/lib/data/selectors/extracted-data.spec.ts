import { describe, it, expect } from 'vitest';
import { getCanonicalBundle, getScript } from '../repositories/index.ts';
import { getEffectiveDuration, getSubtitleSegments } from './index.ts';
import { validateAll } from '../validation/index.ts';

describe('extracted canonical data', () => {
	it('has 17 scenes and 100 shots', () => {
		const script = getScript();
		expect(script.scenes).toHaveLength(17);
		expect(script.shots).toHaveLength(100);
		expect(script.takes).toHaveLength(100);
	});

	it('sums animatic duration to 30 minutes', () => {
		expect(getEffectiveDuration(getScript())).toBe(30 * 60 * 1000);
	});

	it('derives subtitle segments from cue placements', () => {
		const segments = getSubtitleSegments(getScript(), { subtitleLanguage: 'es' });
		expect(segments.length).toBeGreaterThan(90);
	});

	it('passes hand-written validators', () => {
		const result = validateAll(getCanonicalBundle());
		expect(result.ok).toBe(true);
		expect(result.errors).toEqual([]);
	});
});
