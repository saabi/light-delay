import { describe, expect, it } from 'vitest';
import { sameScreenplayText } from './screenplay-text';

describe('sameScreenplayText', () => {
	const base = [
		{ kind: 'action' as const, text: 'Rain.' },
		{ kind: 'dialogue' as const, text: 'Leave the channel open.' }
	];
	it('ignores element identity', () => {
		expect(
			sameScreenplayText(
				base,
				base.map((element) => ({ ...element }))
			)
		).toBe(true);
	});
	it('detects changed text, kind, order and length', () => {
		expect(sameScreenplayText(base, [base[0], { ...base[1], text: 'Close it.' }])).toBe(false);
		expect(sameScreenplayText(base, [base[0], { ...base[1], kind: 'action' }])).toBe(false);
		expect(sameScreenplayText(base, [base[1], base[0]])).toBe(false);
		expect(sameScreenplayText(base, [base[0]])).toBe(false);
	});
});
