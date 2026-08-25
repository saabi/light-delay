import { describe, expect, it } from 'vitest';
import {
	animaticStorageKey,
	loadAnimaticEdits,
	persistAnimaticEdits,
	withShotDuration
} from '$lib/state/animatic-overlay';

describe('animatic overlay isolation', () => {
	it('uses distinct storage keys per script and version', () => {
		expect(animaticStorageKey('script:a', '1')).not.toBe(animaticStorageKey('script:b', '1'));
		expect(animaticStorageKey('script:a', '1')).not.toBe(animaticStorageKey('script:a', '2'));
	});

	it('does not leak durations across scripts', () => {
		const memory = new Map<string, string>();
		const original = globalThis.localStorage;
		globalThis.localStorage = {
			getItem: (k: string) => memory.get(k) ?? null,
			setItem: (k: string, v: string) => {
				memory.set(k, v);
			},
			removeItem: (k: string) => {
				memory.delete(k);
			},
			clear: () => memory.clear(),
			key: () => null,
			length: 0
		} as Storage;

		try {
			let main = loadAnimaticEdits('script:light-delay-main-short', '1.0.0');
			main = withShotDuration(main, 'main:shot-01-01', 1234);
			persistAnimaticEdits(main);

			const festival = loadAnimaticEdits('script:light-delay-festival', '0.1.0-draft');
			expect(festival.shotDurations['main:shot-01-01']).toBeUndefined();
			expect(Object.keys(festival.shotDurations)).toHaveLength(0);

			const reloaded = loadAnimaticEdits('script:light-delay-main-short', '1.0.0');
			expect(reloaded.shotDurations['main:shot-01-01']).toBe(1234);
		} finally {
			globalThis.localStorage = original;
		}
	});
});
