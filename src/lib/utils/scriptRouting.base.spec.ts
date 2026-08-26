import { describe, expect, it, vi } from 'vitest';

vi.mock('$app/paths', () => ({ base: '/light-delay' }));

import { hrefAfterScriptSwitch, scriptSectionHref } from './scriptRouting';

const main = 'script:light-delay-main-short';
const festival = 'script:light-delay-festival';

describe('script routing under a project base path', () => {
	it('preserves the current section without duplicating the base', () => {
		expect(
			hrefAfterScriptSwitch('/light-delay/animatic/script~light-delay-main-short', festival)
		).toBe('/light-delay/animatic/script~light-delay-festival');
		expect(
			hrefAfterScriptSwitch('/light-delay/compare/script~light-delay-main-short', festival, {
				againstId: main,
				registeredIds: [main, festival]
			})
		).toBe(
			'/light-delay/compare/script~light-delay-festival?against=script%3Alight-delay-main-short'
		);
	});

	it('builds section links under the configured base', () => {
		expect(scriptSectionHref('script', main)).toBe(
			'/light-delay/script/script~light-delay-main-short'
		);
	});
});
