import { describe, it, expect } from 'vitest';
import {
	getCanonicalBundle,
	getCanonicalScript,
	getScript,
	listScripts
} from '../repositories/index.ts';
import { getEffectiveDuration, getSubtitleSegments } from './index.ts';
import { validateAll } from '../validation/index.ts';

describe('extracted canonical data', () => {
	it('has 17 scenes and 100 shots on the main short', () => {
		const script = getCanonicalScript();
		expect(script.scenes).toHaveLength(17);
		expect(script.shots).toHaveLength(100);
		expect(script.takes).toHaveLength(100);
		expect(script.script.id).toBe('script:light-delay-main-short');
		expect(script.scenes[0]?.id).toMatch(/^main:/);
	});

	it('registers festival cut as a second script', () => {
		const ids = listScripts().map((s) => s.id);
		expect(ids).toContain('script:light-delay-main-short');
		expect(ids).toContain('script:light-delay-festival');
		const festival = getScript('script:light-delay-festival');
		expect(festival.script.kind).toBe('festival_cut');
		expect(festival.scenes).toHaveLength(7);
		expect(festival.shots).toHaveLength(0);
		expect(festival.script.lineage?.sourceScriptId).toBe('script:light-delay-main-short');
	});

	it('registers trailer with reused animatic frames', () => {
		expect(listScripts().map((s) => s.id)).toContain('script:light-delay-trailer');
		const trailer = getScript('script:light-delay-trailer');
		expect(trailer.script.kind).toBe('trailer');
		expect(trailer.scenes).toHaveLength(9);
		expect(trailer.shots).toHaveLength(29);
		expect(trailer.takes.every((t) => Boolean(t.imageAssetId))).toBe(true);
		expect(getEffectiveDuration(trailer)).toBe(90_000);
	});

	it('sums animatic duration to 30 minutes', () => {
		expect(getEffectiveDuration(getCanonicalScript())).toBe(30 * 60 * 1000);
	});

	it('derives subtitle segments from cue placements', () => {
		const segments = getSubtitleSegments(getCanonicalScript(), { subtitleLanguage: 'es' });
		expect(segments.length).toBeGreaterThan(90);
	});

	it('passes hand-written validators', () => {
		const result = validateAll(getCanonicalBundle());
		expect(result.ok).toBe(true);
		expect(result.errors).toEqual([]);
	});

	it('getScript without id throws', () => {
		expect(() => getScript('' as never)).toThrow(/scriptId is required/);
	});
});
