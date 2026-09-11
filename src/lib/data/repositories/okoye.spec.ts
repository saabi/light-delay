import { describe, expect, it } from 'vitest';
import {
	getAssets,
	getCharacters,
	getEntityVariants,
	getScript,
	getVoiceProfiles
} from '$lib/data/repositories/index';
import { storyText } from '$lib/data/selectors/localized';

describe('Dara Okoye catalog', () => {
	it('has dedicated bilingual visual and voice metadata', () => {
		const okoye = getCharacters().characters.find((character) => character.id === 'character:okoye');
		expect(okoye).toBeDefined();
		expect(okoye?.referenceAssetIds).toEqual(['asset:character-okoye-sheet']);
		expect(okoye?.defaultVoiceProfileId).toBe('voice:okoye');
		expect(storyText(okoye?.appearance, 'es')).toContain('nigeriana');
		expect(storyText(okoye?.appearance, 'en')).toContain('Nigerian');
		expect(storyText(okoye?.costume, 'es')).toContain('tether');
		expect(okoye?.traits).toHaveLength(3);

		const asset = getAssets().assets.find((item) => item.id === 'asset:character-okoye-sheet');
		expect(asset?.path).toBe('/assets/characters/okoye/model-sheet.png');
		expect(asset?.source?.originalAssetId).toBe('asset:character-security-crew-sheet');

		const voice = getVoiceProfiles().voiceProfiles.find((item) => item.id === 'voice:okoye');
		expect(storyText(voice?.description, 'es')).toContain('Contralto firme');
		expect(storyText(voice?.description, 'en')).toContain('firm contralto');
		expect(voice?.variants.map((variant) => variant.language)).toEqual(['es', 'en']);
		expect(voice?.variants.find((variant) => variant.language === 'es')?.locale).toBe('es-VE');
		expect(voice?.variants.find((variant) => variant.language === 'en')?.locale).toBe('en-NG');
		expect(voice?.variants.some((variant) => variant.sampleAssetIds?.length)).toBe(false);
	});

	it('keeps the master WIP characterization separate from primary continuity history', () => {
		const variant = getEntityVariants().variants.find(
			(item) => item.id === 'variant:okoye-master-wip'
		);
		expect(variant?.continuityId).toBe('continuity:light-delay-master-wip');
		expect(storyText(variant?.descriptionOverride, 'en')).toContain(
			'does not establish a shared operational past'
		);
		expect(
			getScript('script:light-delay-master-narrative').script.entityVariantSelections?.character?.[
				'character:okoye'
			]
		).toBe('variant:okoye-master-wip');
	});
});
