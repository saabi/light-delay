import { describe, expect, it } from 'vitest';
import { layoutFor } from './layout';

const at = (maxChars: number, maxLines: number, pixelLandscape = true) =>
	layoutFor({ maxChars, maxLines, pixelLandscape });

describe('layoutFor', () => {
	it('maps character capacity to layouts at the documented thresholds', () => {
		expect(at(44, 60, false)).toBe('phone');
		expect(at(45, 60, false)).toBe('narrow');
		expect(at(89, 60)).toBe('narrow');
		expect(at(90, 60)).toBe('regular');
		expect(at(179, 60)).toBe('regular');
		expect(at(180, 60)).toBe('wide');
	});

	it('uses compact only for short landscape screens', () => {
		expect(at(74, 32, true)).toBe('compact');
		expect(at(40, 20, true)).toBe('compact');
		expect(at(74, 33, true)).toBe('narrow');
		expect(at(75, 20, true)).toBe('narrow');
		expect(at(74, 20, false)).toBe('narrow');
		expect(at(40, 20, false)).toBe('phone');
	});

	it('steps down as text scale lowers capacity', () => {
		const chars = 134;
		const layouts = [1, 1.25, 1.5, 1.75, 2].map((scale) =>
			at(Math.floor(chars / scale), Math.floor(40 / scale), false)
		);
		expect(layouts).toEqual(['regular', 'regular', 'narrow', 'narrow', 'narrow']);
		expect(at(Math.floor(60 / 1.75), 30, false)).toBe('phone');
	});
});
