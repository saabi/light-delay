import { describe, expect, it } from 'vitest';
import { decodeRouteId, encodeRouteId } from './routeId';

describe('portable route IDs', () => {
	it('replaces namespaced separators with filesystem-safe characters', () => {
		expect(encodeRouteId('character:zao')).toBe('character~zao');
		expect(encodeRouteId('asset:character-zao-sheet')).toBe('asset~character-zao-sheet');
	});

	it('round-trips canonical IDs', () => {
		const id = 'asset:animatic-05-02';
		expect(decodeRouteId(encodeRouteId(id))).toBe(id);
	});
});
