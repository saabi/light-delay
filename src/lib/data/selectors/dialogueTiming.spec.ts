import { describe, expect, it } from 'vitest';
import {
	analyzeShotDialogue,
	estimateCueSpokenMs,
	estimateSceneSpokenMs,
	estimateScriptSpokenMs,
	estimateShotSpokenMs,
	montageSceneMs,
	montageScriptMs,
	montageShotMs
} from './dialogueTiming.ts';
import {
	buildDialogueTimingReport,
	formatDialogueTimingMarkdown
} from '../../../../scripts/lib/dialogue-timing.mjs';
import {
	estimateSpokenMsFromText,
	paceMultiplier,
	wordCount
} from '$lib/utils/spokenDuration';
import type { ScriptFile } from '$lib/types/script';

const timingFixture: ScriptFile = {
	schemaVersion: '1.0.0',
	script: {
		id: 'script:timing-test',
		projectId: 'project:light-delay',
		continuityId: 'continuity:test',
		title: 'Timing',
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
			title: 'Bridge',
			locationId: 'location:x',
			setting: {},
			summary: 's',
			characterIds: ['character:a', 'character:b', 'character:c'],
			beatIds: ['test:beat-01'],
			shotIds: ['test:shot-01', 'test:shot-02']
		}
	],
	beats: [
		{
			id: 'test:beat-01',
			sceneId: 'test:scene-01',
			order: 1,
			purpose: 'p',
			summary: 's',
			cueIds: ['test:cue-01', 'test:cue-02', 'test:cue-03', 'test:cue-04']
		}
	],
	cues: [
		{
			id: 'test:cue-01',
			beatId: 'test:beat-01',
			order: 1,
			type: 'dialogue',
			speakerId: 'character:a',
			presentation: 'on_screen',
			content: {
				sourceLanguage: 'es',
				variants: {
					es: { spokenText: 'Uno dos tres cuatro.', status: 'source' }
				}
			}
		},
		{
			id: 'test:cue-02',
			beatId: 'test:beat-01',
			order: 2,
			type: 'dialogue',
			speakerId: 'character:b',
			presentation: 'off_screen',
			content: {
				sourceLanguage: 'es',
				variants: {
					es: { spokenText: 'Respuesta breve.', status: 'source' }
				}
			}
		},
		{
			id: 'test:cue-03',
			beatId: 'test:beat-01',
			order: 3,
			type: 'dialogue',
			speakerId: 'character:c',
			presentation: 'radio',
			content: {
				sourceLanguage: 'es',
				variants: {
					es: { spokenText: 'Tercera voz.', status: 'source' }
				}
			}
		},
		{
			id: 'test:cue-04',
			beatId: 'test:beat-01',
			order: 4,
			type: 'dialogue',
			speakerId: 'character:a',
			presentation: 'on_screen',
			performance: { pace: 'slow' },
			content: {
				sourceLanguage: 'es',
				variants: {
					es: {
						spokenText: 'Línea con duración fija.',
						estimatedDurationMs: 2500,
						status: 'source'
					}
				}
			}
		}
	],
	shots: [
		{
			id: 'test:shot-01',
			sceneId: 'test:scene-01',
			beatIds: ['test:beat-01'],
			number: 1,
			order: 1,
			description: 'Multi-speaker',
			composition: { size: 'LS' },
			durationMs: 3000,
			cuePlacements: [
				{ cueId: 'test:cue-01', atMs: 0 },
				{ cueId: 'test:cue-02', atMs: 500 },
				{ cueId: 'test:cue-03', atMs: 1000 }
			],
			takeIds: [],
			selectedTakeId: undefined
		},
		{
			id: 'test:shot-02',
			sceneId: 'test:scene-01',
			beatIds: ['test:beat-01'],
			number: 2,
			order: 2,
			description: 'Silent long',
			composition: { size: 'ECU' },
			durationMs: 9000,
			cuePlacements: [],
			takeIds: [],
			selectedTakeId: undefined
		}
	],
	takes: []
};

describe('spokenDuration core', () => {
	it('counts unicode words', () => {
		expect(wordCount('Hola, mundo — ¿listo?')).toBe(3);
		expect(wordCount('')).toBe(0);
	});

	it('applies WPM and floor', () => {
		expect(estimateSpokenMsFromText('uno', 'es')).toBe(400);
		expect(estimateSpokenMsFromText('uno dos tres cuatro cinco seis', 'en')).toBeGreaterThan(400);
	});

	it('applies pace multipliers', () => {
		const base = estimateSpokenMsFromText('uno dos tres cuatro cinco seis siete', 'es', 1);
		const slow = estimateSpokenMsFromText('uno dos tres cuatro cinco seis siete', 'es', paceMultiplier('slow'));
		expect(slow).toBeGreaterThan(base);
	});
});

describe('dialogueTiming selectors', () => {
	it('prefers authored estimatedDurationMs', () => {
		const cue = timingFixture.cues[3];
		expect(estimateCueSpokenMs(cue, 'es')).toBe(2500);
	});

	it('rolls up montage and spoken at shot/scene/script', () => {
		const shot = timingFixture.shots[0];
		expect(montageShotMs(shot)).toBe(3000);
		expect(estimateShotSpokenMs(timingFixture, shot, 'es')).toBeGreaterThan(0);
		expect(montageSceneMs(timingFixture, 'test:scene-01')).toBe(12_000);
		expect(estimateSceneSpokenMs(timingFixture, 'test:scene-01', 'es')).toBeGreaterThan(
			estimateShotSpokenMs(timingFixture, shot, 'es')
		);
		expect(montageScriptMs(timingFixture)).toBe(12_000);
		expect(estimateScriptSpokenMs(timingFixture, 'es')).toBeGreaterThan(0);
	});

	it('flags multi-speaker and off-camera dialogue', () => {
		const analysis = analyzeShotDialogue(timingFixture, timingFixture.shots[0], 'es');
		expect(analysis.speakerCount).toBe(3);
		expect(analysis.multiSpeaker).toBe(true);
		expect(analysis.offCameraDialogue).toBe(true);
		expect(analysis.offCameraPresentations).toContain('off_screen');
		expect(analysis.offCameraPresentations).toContain('radio');
	});

	it('builds report JSON shape with flag buckets', () => {
		const report = buildDialogueTimingReport(timingFixture, 'es');
		expect(report.scriptId).toBe('script:timing-test');
		expect(report.summary.montageMs).toBe(12_000);
		expect(report.scenes).toHaveLength(1);
		expect(report.flags.multiSpeakerShots).toHaveLength(1);
		expect(report.flags.offCameraShots).toHaveLength(1);
		expect(report.flags.silentLongShots).toHaveLength(1);
		expect(formatDialogueTimingMarkdown(report)).toContain('Resumen del guion');
	});
});
