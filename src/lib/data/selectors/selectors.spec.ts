import { describe, it, expect } from 'vitest';
import {
	getDialogueVariant,
	getEffectiveDuration,
	getShotSelectedTake,
	getSubtitleSegments,
	resolveLocalized
} from './index.ts';
import type { ScriptFile } from '$lib/types/script';

const fixtureScript: ScriptFile = {
	schemaVersion: '1.0.0',
	script: {
		id: 'script:test',
		projectId: 'project:light-delay',
		continuityId: 'continuity:test',
		title: 'Test',
		version: '0',
		status: 'draft',
		kind: 'proof_of_concept',
		actIds: ['test:act-1']
	},
	acts: [{ id: 'test:act-1', number: 1, sceneIds: ['test:scene-01'] }],
	sequences: [],
	scenes: [
		{
			id: 'test:scene-01',
			actId: 'test:act-1',
			number: 1,
			order: 1,
			title: 'Test',
			locationId: 'location:x',
			setting: {},
			summary: 's',
			characterIds: ['character:zao'],
			beatIds: ['test:beat-01-01'],
			shotIds: ['test:shot-01-01', 'test:shot-01-02']
		}
	],
	beats: [
		{
			id: 'test:beat-01-01',
			sceneId: 'test:scene-01',
			order: 1,
			purpose: 'p',
			summary: 's',
			cueIds: ['test:cue-01-01']
		}
	],
	cues: [
		{
			id: 'test:cue-01-01',
			beatId: 'test:beat-01-01',
			order: 1,
			type: 'dialogue',
			speakerId: 'character:zao',
			presentation: 'on_screen',
			content: {
				sourceLanguage: 'es',
				variants: {
					es: { spokenText: 'Tenemos una ventana.', status: 'source' }
				}
			}
		}
	],
	shots: [
		{
			id: 'test:shot-01-01',
			sceneId: 'test:scene-01',
			beatIds: ['test:beat-01-01'],
			number: 1,
			order: 1,
			description: 'A',
			composition: { size: 'MS' },
			durationMs: 2000,
			cuePlacements: [{ cueId: 'test:cue-01-01', atMs: 0, durationMs: 2000 }],
			takeIds: ['test:take-01-01-01'],
			selectedTakeId: 'test:take-01-01-01'
		},
		{
			id: 'test:shot-01-02',
			sceneId: 'test:scene-01',
			beatIds: ['test:beat-01-01'],
			number: 2,
			order: 2,
			description: 'B',
			composition: { size: 'CU' },
			durationMs: 3000,
			cuePlacements: [],
			takeIds: ['test:take-01-02-01'],
			selectedTakeId: 'test:take-01-02-01'
		}
	],
	takes: [
		{
			id: 'test:take-01-01-01',
			shotId: 'test:shot-01-01',
			number: 1,
			status: 'selected',
			imageAssetId: 'asset:a'
		},
		{
			id: 'test:take-01-02-01',
			shotId: 'test:shot-01-02',
			number: 1,
			status: 'selected',
			imageAssetId: 'asset:b'
		}
	]
};

describe('selectors', () => {
	it('getEffectiveDuration sums shot durations', () => {
		expect(getEffectiveDuration(fixtureScript)).toBe(5000);
		expect(getEffectiveDuration(fixtureScript, 'test:scene-01')).toBe(5000);
	});

	it('getShotSelectedTake returns the selected take', () => {
		const take = getShotSelectedTake(fixtureScript, fixtureScript.shots[0]);
		expect(take?.id).toBe('test:take-01-01-01');
	});

	it('getDialogueVariant resolves Spanish source', () => {
		const resolved = getDialogueVariant(fixtureScript, 'test:cue-01-01', 'es');
		expect(resolved?.value.spokenText).toBe('Tenemos una ventana.');
		expect(resolved?.usedFallback).toBe(false);
	});

	it('getSubtitleSegments derives text from dialogue cues', () => {
		const segments = getSubtitleSegments(fixtureScript, { subtitleLanguage: 'es' });
		expect(segments).toHaveLength(1);
		expect(segments[0].text).toBe('Tenemos una ventana.');
		expect(segments[0].shotId).toBe('test:shot-01-01');
	});

	it('resolveLocalized falls back to source language', () => {
		const cue = fixtureScript.cues[0];
		if (cue.type !== 'dialogue') throw new Error('expected dialogue');
		const resolved = resolveLocalized(cue.content, 'en', 'es');
		expect(resolved?.resolvedLanguage).toBe('es');
		expect(resolved?.usedFallback).toBe(true);
	});
});
