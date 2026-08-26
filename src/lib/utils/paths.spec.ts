import { describe, expect, it, vi } from 'vitest';

vi.mock('$app/paths', () => ({ base: '/light-delay' }));

import { withBase, withoutBase } from './paths';

describe('base-path helpers', () => {
	it('prefixes local routes and media paths exactly once', () => {
		expect(withBase('/')).toBe('/light-delay');
		expect(withBase('/script/script~light-delay-main-short')).toBe(
			'/light-delay/script/script~light-delay-main-short'
		);
		expect(withBase('/assets/animatic/frame-001.png')).toBe(
			'/light-delay/assets/animatic/frame-001.png'
		);
		expect(withBase('/light-delay/art')).toBe('/light-delay/art');
	});

	it('leaves external and document-local targets unchanged', () => {
		expect(withBase('https://example.com/image.png')).toBe('https://example.com/image.png');
		expect(withBase('#scene')).toBe('#scene');
		expect(withBase('?shot=main%3A001')).toBe('?shot=main%3A001');
	});

	it('removes only the configured base before route matching', () => {
		expect(withoutBase('/light-delay')).toBe('/');
		expect(withoutBase('/light-delay/animatic/script~main')).toBe('/animatic/script~main');
		expect(withoutBase('/other/path')).toBe('/other/path');
	});
});
