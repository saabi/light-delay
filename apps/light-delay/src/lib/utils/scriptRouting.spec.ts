import { describe, expect, it } from 'vitest';
import {
	animaticHrefForShot,
	generationHrefForShot,
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
	it('keeps script / animatic / player / outline section', () => {
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
		expect(
			hrefAfterScriptSwitch('/outline/script~light-delay-main-short', festival, { locale: 'en' })
		).toBe('/outline/script~light-delay-festival/');
	});

	it('defaults to script page on other routes', () => {
		expect(hrefAfterScriptSwitch('/', festival, { locale: 'en' })).toBe(
			'/script/script~light-delay-festival/'
		);
		expect(hrefAfterScriptSwitch('/art', festival, { locale: 'en' })).toBe(
			'/script/script~light-delay-festival/'
		);
	});

	it('keeps generation medium and filter query', () => {
		expect(
			hrefAfterScriptSwitch('/generation/video/script~light-delay-main-short', festival, {
				locale: 'en',
				search: '?filter=blocked'
			})
		).toBe('/generation/video/script~light-delay-festival/?filter=blocked');
		expect(
			hrefAfterScriptSwitch('/generation/image/script~light-delay-main-short', festival, {
				locale: 'en',
				search: '?filter=nope'
			})
		).toBe('/generation/image/script~light-delay-festival/');
		expect(
			hrefAfterScriptSwitch('/generation/audio/script~light-delay-main-short', festival, {
				locale: 'en',
				search: '?filter=blocked&shot=festival-master:shot-plan-040'
			})
		).toBe(
			'/generation/audio/script~light-delay-festival/?filter=blocked&shot=festival-master%3Ashot-plan-040'
		);
	});
});

describe('generationHrefForShot', () => {
	it('builds medium links that keep the shot query', () => {
		expect(generationHrefForShot(main, 'image', 'festival-master:shot-plan-001', 'en')).toBe(
			'/generation/image/script~light-delay-main-short/?shot=festival-master%3Ashot-plan-001'
		);
		expect(animaticHrefForShot(festival, 'festival-master:shot-plan-040b', 'en')).toBe(
			'/animatic/script~light-delay-festival/?shot=festival-master%3Ashot-plan-040b'
		);
	});
});

describe('scriptSectionHref', () => {
	it('builds scoped section links', () => {
		expect(scriptSectionHref('script', main, 'en')).toBe('/script/script~light-delay-main-short/');
		expect(scriptSectionHref('animatic', festival, 'en')).toBe(
			'/animatic/script~light-delay-festival/'
		);
		expect(scriptSectionHref('outline', main, 'en')).toBe('/outline/script~light-delay-main-short/');
	});
});
