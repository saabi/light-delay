import { describe, expect, it } from 'vitest';
import { formatClock, secondsToMs } from './duration.ts';

describe('formatClock', () => {
	it('formats minutes and seconds', () => {
		expect(formatClock(90_000)).toBe('1:30');
	});

	it('formats hours', () => {
		expect(formatClock(3_661_000)).toBe('1:01:01');
	});
});

describe('secondsToMs', () => {
	it('rounds to nearest millisecond', () => {
		expect(secondsToMs(1.5)).toBe(1500);
	});
});
