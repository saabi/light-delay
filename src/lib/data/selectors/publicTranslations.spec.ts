import { describe, expect, it } from 'vitest';
import { getScript } from '$lib/data/repositories';
import { localizeScript, translatePublicText } from './publicTranslations';

describe('public structured translations (inline LocalizedString)', () => {
	it('resolves screenplay prose and keeps co-located English dialogue variants', () => {
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
		expect(typeof source.script.title).toBe('object');
		expect(dialogue?.type).toBe('dialogue');
		if (dialogue?.type !== 'dialogue') throw new Error('dialogue fixture not found');
		expect(dialogue.content.variants.en?.spokenText).toBe(
			'The signature looks forged. The real signature points to—'
		);
		expect(dialogue.content.variants.en?.status).toBe('draft');
		expect(dialogue.content.variants.en?.audioAssetId).toBeUndefined();
		expect(sourceDialogue?.type).toBe('dialogue');
		if (sourceDialogue?.type !== 'dialogue') throw new Error('source dialogue fixture not found');
		expect(sourceDialogue.content.variants.en?.spokenText).toBe(
			'The signature looks forged. The real signature points to—'
		);
	});

	it('resolves Spanish LocalizedString maps to flat strings for presentation', () => {
		const source = getScript('script:light-delay-main-short');
		const localized = localizeScript(source, 'es');

		expect(localized).not.toBe(source);
		expect(typeof localized.script.title).toBe('string');
		expect(localized.script.title).toContain('Light Delay');
		expect(
			translatePublicText({ es: 'Hola', en: 'Hello' }, 'en')
		).toBe('Hello');
		expect(translatePublicText({ es: 'Solo español' }, 'en')).toBe('Solo español');
	});
});
