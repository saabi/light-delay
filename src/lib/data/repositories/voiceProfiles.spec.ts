import { describe, expect, it } from 'vitest';
import { getCharacters, getVoiceProfiles } from '$lib/data/repositories/index';
import { storyText } from '$lib/data/selectors/localized';

const expectedLocales = {
	'character:zao': { es: 'es-CO', en: 'en-SG' },
	'character:rao': { es: 'es-CO', en: 'en-IN' },
	'character:harlan': { es: 'es-AR', en: 'en-GB' },
	'character:voss': { es: 'es-PE', en: 'en-CA' },
	'character:sorell': { es: 'es-AR', en: 'en-CA' },
	'character:okoye': { es: 'es-VE', en: 'en-NG' }
} as const;

describe('master-cast dialogue direction', () => {
	it('binds every master character to complete Spanish and English voice variants', () => {
		const profiles = getVoiceProfiles().voiceProfiles;
		const characters = getCharacters().characters;

		for (const [characterId, locales] of Object.entries(expectedLocales)) {
			const character = characters.find((item) => item.id === characterId);
			const profile = profiles.find((item) => item.id === character?.defaultVoiceProfileId);
			expect(profile?.characterId).toBe(characterId);

			for (const language of ['es', 'en'] as const) {
				const variant = profile?.variants.find((item) => item.language === language);
				expect(variant?.locale).toBe(locales[language]);
				expect(typeof variant?.languageFormation?.place).toBe('object');
				expect(storyText(variant?.languageFormation?.place, 'es')).toBeTruthy();
				expect(storyText(variant?.languageFormation?.place, 'en')).toBeTruthy();
				expect(storyText(variant?.languageFormation?.variety, 'es')).toBeTruthy();
				expect(storyText(variant?.languageFormation?.variety, 'en')).toBeTruthy();
				expect(storyText(variant?.prosody, 'es')).toBeTruthy();
				expect(storyText(variant?.prosody, 'en')).toBeTruthy();
				expect(storyText(variant?.dialogueStyle, 'es')).toBeTruthy();
				expect(storyText(variant?.dialogueStyle, 'en')).toBeTruthy();
			}
		}
	});

	it('keeps Sorell canonical in data and resolves a distinct spoken form per language', () => {
		const profile = getVoiceProfiles().voiceProfiles.find(
			(item) => item.characterId === 'character:sorell'
		);
		expect(profile?.name).toBe('Lian Sorell');
		expect(profile?.variants.find(({ language }) => language === 'en')?.pronunciationMap).toEqual({
			Sorell: 'Soréll'
		});
		expect(profile?.variants.find(({ language }) => language === 'es')?.pronunciationMap).toEqual({
			Sorell: 'Sorél'
		});
	});
});
