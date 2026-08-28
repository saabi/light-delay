import { describe, expect, it } from 'vitest';
import { getScript } from '$lib/data/repositories';
import { localizeScript, translatePublicText } from './publicTranslations';

describe('public structured translations', () => {
	it('translates screenplay structure and injects draft English dialogue variants', () => {
		const source = getScript('script:light-delay-main-short');
		const localized = localizeScript(source, 'en');
		const sourceDialogue = source.cues.find(
			(cue) => cue.type === 'dialogue' && cue.id === 'main:cue-05-06'
		);
		const dialogue = localized.cues.find(
			(cue) => cue.type === 'dialogue' && cue.id === 'main:cue-05-06'
		);

		expect(localized).not.toBe(source);
		expect(localized.script.title).toBe('Light Delay — Short Film Screenplay');
		expect(dialogue?.type).toBe('dialogue');
		if (dialogue?.type !== 'dialogue') throw new Error('dialogue fixture not found');
		expect(dialogue.content.variants.en?.spokenText).toBe(
			'The signature looks forged. The physical relay points to—'
		);
		expect(dialogue.content.variants.en?.status).toBe('draft');
		expect(dialogue.content.variants.en?.audioAssetId).toBeUndefined();
		expect(sourceDialogue?.type).toBe('dialogue');
		if (sourceDialogue?.type !== 'dialogue') throw new Error('source dialogue fixture not found');
		expect(sourceDialogue.content.variants.en).toBeUndefined();
	});

	it('leaves Spanish source data untouched and falls back for unknown text', () => {
		const source = getScript('script:light-delay-main-short');

		expect(localizeScript(source, 'es')).toBe(source);
		expect(translatePublicText('Texto nuevo sin catálogo', 'en')).toBe('Texto nuevo sin catálogo');
	});
});
