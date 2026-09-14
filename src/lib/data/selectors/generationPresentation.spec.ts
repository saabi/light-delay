import { describe, expect, it } from 'vitest';
import {
	generationBlockerLabel,
	generationPromptBadgeLabel,
	generationRefsBadgeLabel,
	generationRefsBadgeTone,
	generationSourceLabel,
	packageDomId
} from './generationPresentation';
import type { GenerationPackage } from './generationPackages';
import * as m from '$lib/paraglide/messages.js';

describe('generation presentation labels', () => {
	it('maps source and blocker codes to localized copy', () => {
		expect(generationSourceLabel('shot_still')).not.toBe('shot_still');
		expect(generationBlockerLabel('missing_voice_sample')).not.toBe('missing_voice_sample');
		expect(generationBlockerLabel('custom_code')).toContain('custom_code');
		expect(packageDomId('cue:foo:en')).toBe('generation-package-cue-foo-en');
	});

	it('labels audio text readiness separately from compiled-prompt readiness', () => {
		const audio: GenerationPackage = {
			id: 'cue:x:en',
			title: 'cue',
			medium: 'audio',
			source: 'dialogue_cue',
			promptReady: true,
			promptPreview: 'Hello',
			blockers: [],
			refs: [],
			outputs: [],
			runnable: false,
			groupId: 'g',
			groupLabel: 'g'
		};
		expect(generationPromptBadgeLabel(audio)).toBe(m.generation_text_ready());
		expect(generationPromptBadgeLabel({ ...audio, source: 'shot_still' })).toBe(
			m.generation_prompt_ready()
		);
		expect(generationPromptBadgeLabel(audio)).not.toBe(
			generationPromptBadgeLabel({ ...audio, source: 'shot_still' })
		);
	});

	it('warns when refs are present but stale', () => {
		const pkg: GenerationPackage = {
			id: 'pkg',
			title: 'pkg',
			medium: 'image',
			source: 'stretch_still',
			promptReady: true,
			promptPreview: 'prompt',
			blockers: [],
			refs: [
				{
					assetId: 'asset:stale',
					role: 'still_reference',
					category: 'visual',
					present: true,
					path: '/assets/x.png',
					kind: 'image',
					status: 'needs_review',
					required: true
				}
			],
			outputs: [],
			runnable: false,
			groupId: 'g',
			groupLabel: 'g'
		};
		expect(generationRefsBadgeTone(pkg)).toBe('warn');
		expect(generationRefsBadgeLabel(pkg)).toBe(m.generation_refs_present());
	});
});
