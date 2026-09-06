import { describe, expect, it } from 'vitest';
import { shouldShowStudioNav, studioUnavailable } from './gating';

describe('studio gating', () => {
	it('shows the nav only in the Vite dev server', () => {
		expect(shouldShowStudioNav(true)).toBe(true);
		expect(shouldShowStudioNav(false)).toBe(false);
		expect(studioUnavailable()).toBe(!import.meta.env.DEV);
	});
});
