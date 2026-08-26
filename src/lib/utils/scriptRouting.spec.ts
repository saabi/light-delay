import { describe, expect, it } from 'vitest';
import {
	hrefAfterScriptSwitch,
	resolveActiveScriptId,
	scriptSectionHref
} from './scriptRouting.ts';

const main = 'script:light-delay-main-short';
const festival = 'script:light-delay-festival';
const registered = [main, festival];

describe('resolveActiveScriptId', () => {
	it('prefers URL param when registered', () => {
		expect(
			resolveActiveScriptId({
				paramEncoded: 'script~light-delay-festival',
				storedId: main,
				canonicalId: main,
				registeredIds: registered
			})
		).toBe(festival);
	});

	it('falls back to stored then canonical', () => {
		expect(
			resolveActiveScriptId({
				paramEncoded: null,
				storedId: festival,
				canonicalId: main,
				registeredIds: registered
			})
		).toBe(festival);
		expect(
			resolveActiveScriptId({
				paramEncoded: null,
				storedId: 'script:unknown',
				canonicalId: main,
				registeredIds: registered
			})
		).toBe(main);
	});
});

describe('hrefAfterScriptSwitch', () => {
	it('keeps script / animatic / player section', () => {
		expect(
			hrefAfterScriptSwitch('/script/script~light-delay-main-short', festival, { locale: 'en' })
		).toBe('/script/script~light-delay-festival/');
		expect(
			hrefAfterScriptSwitch('/animatic/script~light-delay-main-short', festival, { locale: 'en' })
		).toBe('/animatic/script~light-delay-festival/');
		expect(
			hrefAfterScriptSwitch('/animatic/script~light-delay-main-short/player', festival, {
				locale: 'en'
			})
		).toBe('/animatic/script~light-delay-festival/player/');
	});

	it('defaults to script page on other routes', () => {
		expect(hrefAfterScriptSwitch('/', festival, { locale: 'en' })).toBe(
			'/script/script~light-delay-festival/'
		);
		expect(hrefAfterScriptSwitch('/art', festival, { locale: 'en' })).toBe(
			'/script/script~light-delay-festival/'
		);
	});
});

describe('scriptSectionHref', () => {
	it('builds scoped section links', () => {
		expect(scriptSectionHref('script', main, 'en')).toBe('/script/script~light-delay-main-short/');
		expect(scriptSectionHref('animatic', festival, 'en')).toBe(
			'/animatic/script~light-delay-festival/'
		);
	});
});
