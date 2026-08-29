import { describe, it, expect } from 'vitest';
import {
	getCanonicalBundle,
	getCanonicalScript,
	getScript,
	listScripts
} from '../repositories/index.ts';
import { getEffectiveDuration, getSubtitleSegments } from './index.ts';
import { validateAll } from '../validation/index.ts';
import { getShotMedia } from '../repositories/lookups.ts';
import { getAssets } from '../repositories/index.ts';

describe('extracted canonical data', () => {
	it('has 17 scenes and 124 shots on the main short', () => {
		const script = getCanonicalScript();
		expect(script.scenes).toHaveLength(17);
		expect(script.shots).toHaveLength(124);
		expect(script.takes).toHaveLength(124);
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
		expect(festival.shots).toHaveLength(35);
		expect(festival.takes).toHaveLength(35);
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
		expect(trailer.takes.every((t) => t.imageStatus?.status === 'needs_regeneration')).toBe(true);
	});

	it('separates main regeneration candidates from placeholder replacements', () => {
		const script = getCanonicalScript();
		const regen = script.takes.filter((take) => take.imageStatus?.status === 'needs_regeneration');
		expect(regen).toHaveLength(112);
		expect(regen.every((take) => take.imageStatus?.reasons.includes('canon_mismatch'))).toBe(true);
		const replacements = script.takes.filter(
			(take) => take.imageStatus?.status === 'needs_replacement'
		);
		expect(replacements).toHaveLength(12);
		expect(replacements.every((take) => take.imageStatus?.reasons.includes('placeholder'))).toBe(
			true
		);
		expect(
			getAssets().assets.filter((asset) => asset.imageStatus?.reasons.includes('placeholder'))
		).toHaveLength(0);
	});

	it('resolves editorial image state and a generic fallback', () => {
		const script = getCanonicalScript();
		const regenShot = script.shots.find((shot) => shot.id === 'main:shot-05-07')!;
		const media = getShotMedia(script, regenShot);
		expect(media.state).toBe('provisional');
		expect(media.imagePath).toBe('/assets/animatic/frames/scene-12/shot-08.png');
		expect(media.take?.imageStatus?.status).toBe('needs_regeneration');

		const missing = getShotMedia(script, { ...regenShot, selectedTakeId: undefined });
		expect(missing.state).toBe('missing');
		expect(missing.displayPath).toBe('/assets/animatic/placeholder-missing-frame.png');
	});

	it('registers the reviewed long treatment without invented production units', () => {
		const long = getScript('script:light-delay-long');
		expect(long.script.kind).toBe('long_version');
		expect(long.script.targetDurationMs).toBe(100 * 60 * 1000);
		expect(long.scenes).toHaveLength(28);
		expect(long.beats).toHaveLength(28);
		expect(long.cues).toHaveLength(0);
		expect(long.shots).toHaveLength(0);
		expect(long.script.declaredEntityRefs).toHaveLength(14);
	});

	it('sums the current animatic duration independently from the 30-minute target', () => {
		expect(getCanonicalScript().script.targetDurationMs).toBe(30 * 60 * 1000);
		expect(getEffectiveDuration(getCanonicalScript())).toBe(1_839_500);
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
