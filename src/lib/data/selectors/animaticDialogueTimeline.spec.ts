import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScriptFile } from '$lib/types/script';

vi.mock('$lib/data/repositories/lookups', () => ({
	getAssetById: vi.fn((id: string) =>
		id === 'asset:zao-line'
			? { id, kind: 'audio', role: 'voice_sample', path: '/assets/audio/dialogue/zao.wav' }
			: undefined
	)
}));

vi.mock('$lib/utils/paths', () => ({
	withBase: (path: string) => path
}));

import { buildShotDialogueTimeline } from './animaticDialogueTimeline';

const fixture = {
	schemaVersion: '1.0.0',
	script: { id: 'script:test', title: { en: 't' }, version: '1' },
	scenes: [],
	beats: [],
	cues: [
		{
			id: 'cue:a',
			beatId: 'beat:1',
			order: 1,
			type: 'dialogue',
			speakerId: 'character:zao',
			content: {
				sourceLanguage: 'en',
				variants: {
					en: {
						spokenText: 'Hello.',
						status: 'source',
						audioAssetId: 'asset:zao-line',
						estimatedDurationMs: 900
					}
				}
			}
		},
		{
			id: 'cue:b',
			beatId: 'beat:1',
			order: 2,
			type: 'dialogue',
			speakerId: 'character:voss',
			content: {
				sourceLanguage: 'en',
				variants: {
					en: {
						spokenText: 'No audio.',
						status: 'source'
					}
				}
			}
		}
	],
	shots: [
		{
			id: 'shot:1',
			sceneId: 'scene:1',
			number: 1,
			durationMs: 5000,
			cuePlacements: [
				{ cueId: 'cue:a', atMs: 500, durationMs: 900 },
				{ cueId: 'cue:b', atMs: 2000 }
			],
			takes: []
		},
		{
			id: 'shot:2',
			sceneId: 'scene:1',
			number: 2,
			durationMs: 4000,
			cuePlacements: [
				{
					cueId: 'cue:a',
					atMs: 100,
					timingByLanguage: { en: { atMs: 250, durationMs: 800 } }
				}
			],
			takes: []
		}
	]
} as unknown as ScriptFile;

describe('buildShotDialogueTimeline', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('maps relative placements to absolute startMs and skips missing audio', () => {
		const timeline = buildShotDialogueTimeline(fixture, [5000, 4000], 'en');
		expect(timeline).toHaveLength(2);
		expect(timeline[0]).toMatchObject({
			cueId: 'cue:a',
			shotId: 'shot:1',
			startMs: 500,
			relativeAtMs: 500,
			url: '/assets/audio/dialogue/zao.wav'
		});
		expect(timeline[1]).toMatchObject({
			cueId: 'cue:a',
			shotId: 'shot:2',
			startMs: 5250,
			relativeAtMs: 250,
			durationMs: 800
		});
	});

	it('falls back to EN audio when the active dialogue language has no audioAssetId', () => {
		const withEsTextOnly = {
			...fixture,
			cues: [
				{
					...fixture.cues[0],
					content: {
						sourceLanguage: 'en',
						variants: {
							en: {
								spokenText: 'Hello.',
								status: 'source',
								audioAssetId: 'asset:zao-line',
								estimatedDurationMs: 900
							},
							es: {
								spokenText: 'Hola.',
								status: 'approved'
							}
						}
					}
				}
			],
			shots: [fixture.shots[0]]
		} as unknown as ScriptFile;

		const timeline = buildShotDialogueTimeline(withEsTextOnly, [5000], 'es');
		expect(timeline).toHaveLength(1);
		expect(timeline[0].url).toBe('/assets/audio/dialogue/zao.wav');
	});
});
