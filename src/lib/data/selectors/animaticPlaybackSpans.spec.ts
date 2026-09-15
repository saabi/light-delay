import { describe, expect, it, vi } from 'vitest';
import type { GenerationPlanFile } from '$lib/types/generated/production';
import type { Asset } from '$lib/types/assets';
import type { ScriptFile, Shot } from '$lib/types/script';
import {
	buildAnimaticPlaybackSpans,
	filterDialogueCuesOutsideStretchVideo,
	shotDurationsAlignedToSpans,
	spanIndexForShotId
} from './animaticPlaybackSpans';

const assets: Record<string, Asset> = {
	'asset:vid-a': {
		id: 'asset:vid-a',
		kind: 'video',
		role: 'production',
		path: '/assets/a.mp4',
		durationMs: 24000,
		imageStatus: { status: 'needs_review', reasons: ['quality'] }
	},
	'asset:vid-b': {
		id: 'asset:vid-b',
		kind: 'video',
		role: 'production',
		path: '/assets/b.mp4',
		durationMs: 7000,
		imageStatus: { status: 'current', reasons: [] }
	},
	'asset:vid-bad': {
		id: 'asset:vid-bad',
		kind: 'video',
		role: 'production',
		path: '/assets/bad.mp4',
		durationMs: 5000,
		imageStatus: { status: 'needs_replacement', reasons: ['quality'] }
	},
	'asset:vid-missing': {
		id: 'asset:vid-missing',
		kind: 'video',
		role: 'production',
		path: '/assets/missing.mp4',
		durationMs: 5000,
		imageStatus: { status: 'needs_review', reasons: ['quality'] }
	}
};

const existingFiles = new Set(['/assets/a.mp4', '/assets/b.mp4', '/assets/bad.mp4']);

function shot(id: string, durationMs: number, order: number): Shot {
	return {
		id,
		sceneId: 'scene:1',
		number: order,
		order,
		durationMs,
		cuePlacements: [],
		takeIds: [],
		selectedTakeId: `${id}:take-01`
	} as Shot;
}

const orderedShots = [
	shot('shot:pre', 3000, 1),
	shot('shot:033', 8000, 2),
	shot('shot:034', 9000, 3),
	shot('shot:035', 8000, 4),
	shot('shot:036', 7000, 5),
	shot('shot:post', 2000, 6)
];

const script = {
	schemaVersion: '1.0.0',
	script: { id: 'script:test', title: { en: 't' }, version: '1' },
	shots: orderedShots
} as unknown as ScriptFile;

const plan = {
	schemaVersion: '1.0.0',
	plan: { id: 'plan:test', scriptId: 'script:test', scriptVersion: '1', sourceDigest: 'x', campaignId: 'c', status: 'draft', promptLanguage: 'en', diegeticTextLanguage: 'en' },
	shots: [],
	visualStretchJobs: [
		{
			id: 'job:video-1',
			stretchId: 'stretch:record',
			revision: 1,
			medium: 'video',
			mode: 'grouped_seedance',
			providerSnapshotId: 'provider:x',
			outputTakePolicy: 'new_candidate',
			memberInputs: [
				{ order: 1, shotId: 'shot:033', sourceTakeIds: [] },
				{ order: 2, shotId: 'shot:034', sourceTakeIds: [] },
				{ order: 3, shotId: 'shot:035', sourceTakeIds: [] }
			],
			stillReferenceAssetIds: [],
			sharedReferenceAssetIds: [],
			compiledPrompt: 'p',
			outputs: [{ order: 1, artifact: 'video', assetId: 'asset:vid-a' }],
			blockers: [],
			coherenceException: false,
			durationMs: 24340
		},
		{
			id: 'job:video-2',
			stretchId: 'stretch:record',
			revision: 1,
			medium: 'video',
			mode: 'grouped_seedance',
			providerSnapshotId: 'provider:x',
			outputTakePolicy: 'new_candidate',
			memberInputs: [{ order: 1, shotId: 'shot:036', sourceTakeIds: [] }],
			stillReferenceAssetIds: [],
			sharedReferenceAssetIds: [],
			compiledPrompt: 'p',
			outputs: [{ order: 1, artifact: 'video', assetId: 'asset:vid-b' }],
			blockers: [],
			coherenceException: false,
			durationMs: 7130
		},
		{
			id: 'job:still',
			stretchId: 'stretch:other',
			revision: 1,
			medium: 'still',
			mode: 'grouped_seedance',
			providerSnapshotId: 'provider:x',
			outputTakePolicy: 'new_candidate',
			memberInputs: [],
			stillReferenceAssetIds: [],
			sharedReferenceAssetIds: [],
			compiledPrompt: null,
			outputs: [],
			blockers: [],
			coherenceException: false
		}
	]
} as unknown as GenerationPlanFile;

const opts = {
	getAsset: (id: string) => assets[id],
	fileExists: (path: string) => existingFiles.has(path)
};

describe('buildAnimaticPlaybackSpans', () => {
	it('collapses multi-part stretch videos and keeps still gaps', () => {
		const spans = buildAnimaticPlaybackSpans(script, orderedShots, plan, opts);
		expect(spans.map((s) => s.kind)).toEqual([
			'still',
			'stretchVideo',
			'stretchVideo',
			'still'
		]);
		expect(spans[0]).toMatchObject({ kind: 'still', shotId: 'shot:pre', durationMs: 3000 });
		expect(spans[1]).toMatchObject({
			kind: 'stretchVideo',
			jobId: 'job:video-1',
			assetId: 'asset:vid-a',
			durationMs: 24000,
			shotIds: ['shot:033', 'shot:034', 'shot:035'],
			primaryShotIndex: 1
		});
		expect(spans[2]).toMatchObject({
			kind: 'stretchVideo',
			jobId: 'job:video-2',
			durationMs: 7000,
			shotIds: ['shot:036']
		});
		expect(spans[3]).toMatchObject({ kind: 'still', shotId: 'shot:post' });
	});

	it('falls back to still when asset is missing on disk', () => {
		const planMissing = {
			...plan,
			visualStretchJobs: [
				{
					...plan.visualStretchJobs![0],
					outputs: [{ order: 1, artifact: 'video', assetId: 'asset:vid-missing' }],
					memberInputs: [{ order: 1, shotId: 'shot:033', sourceTakeIds: [] }]
				}
			]
		} as unknown as GenerationPlanFile;
		const shots = [shot('shot:033', 8000, 1)];
		const spans = buildAnimaticPlaybackSpans(
			{ ...script, shots } as ScriptFile,
			shots,
			planMissing,
			opts
		);
		expect(spans).toHaveLength(1);
		expect(spans[0]?.kind).toBe('still');
	});

	it('skips needs_replacement videos', () => {
		const planBad = {
			...plan,
			visualStretchJobs: [
				{
					...plan.visualStretchJobs![0],
					outputs: [{ order: 1, artifact: 'video', assetId: 'asset:vid-bad' }],
					memberInputs: [{ order: 1, shotId: 'shot:033', sourceTakeIds: [] }]
				}
			]
		} as unknown as GenerationPlanFile;
		const shots = [shot('shot:033', 8000, 1)];
		const spans = buildAnimaticPlaybackSpans(
			{ ...script, shots } as ScriptFile,
			shots,
			planBad,
			opts
		);
		expect(spans[0]?.kind).toBe('still');
	});

	it('plays a selected take video when no stretch job covers the shot', () => {
		const takeAssets: Record<string, Asset> = {
			...assets,
			'asset:title-vid': {
				id: 'asset:title-vid',
				kind: 'video',
				role: 'production',
				path: '/assets/title.mp4',
				durationMs: 15050,
				imageStatus: { status: 'needs_review', reasons: ['quality'] }
			}
		};
		const shots = [shot('shot:title', 10000, 1), shot('shot:pre', 3000, 2)];
		const scriptWithTake = {
			...script,
			shots,
			takes: [
				{
					id: 'shot:title:take-01',
					shotId: 'shot:title',
					number: 1,
					status: 'selected',
					videoAssetId: 'asset:title-vid'
				}
			]
		} as unknown as ScriptFile;
		const spans = buildAnimaticPlaybackSpans(scriptWithTake, shots, plan, {
			getAsset: (id) => takeAssets[id],
			fileExists: (path) => existingFiles.has(path) || path === '/assets/title.mp4'
		});
		expect(spans[0]).toMatchObject({
			kind: 'stretchVideo',
			jobId: 'take-video:shot:title:take-01',
			assetId: 'asset:title-vid',
			durationMs: 15050,
			shotIds: ['shot:title']
		});
		expect(spans[1]).toMatchObject({ kind: 'still', shotId: 'shot:pre' });
	});

	it('maps shot id to span index', () => {
		const spans = buildAnimaticPlaybackSpans(script, orderedShots, plan, opts);
		expect(spanIndexForShotId(spans, 'shot:pre')).toBe(0);
		expect(spanIndexForShotId(spans, 'shot:034')).toBe(1);
		expect(spanIndexForShotId(spans, 'shot:036')).toBe(2);
	});
});

describe('shotDurationsAlignedToSpans', () => {
	it('proportionally allocates video duration across members', () => {
		const spans = buildAnimaticPlaybackSpans(script, orderedShots, plan, opts);
		const aligned = shotDurationsAlignedToSpans(orderedShots, spans, (s) => s.durationMs);
		expect(aligned[0]).toBe(3000);
		expect(aligned[1]! + aligned[2]! + aligned[3]!).toBe(24000);
		expect(aligned[4]).toBe(7000);
		expect(aligned[5]).toBe(2000);
	});
});

describe('filterDialogueCuesOutsideStretchVideo', () => {
	it('suppresses cues for stretch member shots', () => {
		const spans = buildAnimaticPlaybackSpans(script, orderedShots, plan, opts);
		const cues = [
			{ id: '1', cueId: 'c1', shotId: 'shot:pre', url: '/a.wav', startMs: 0, relativeAtMs: 0 },
			{ id: '2', cueId: 'c2', shotId: 'shot:033', url: '/b.wav', startMs: 100, relativeAtMs: 100 },
			{ id: '3', cueId: 'c3', shotId: 'shot:036', url: '/c.wav', startMs: 200, relativeAtMs: 200 },
			{ id: '4', cueId: 'c4', shotId: 'shot:post', url: '/d.wav', startMs: 300, relativeAtMs: 300 }
		];
		const filtered = filterDialogueCuesOutsideStretchVideo(cues, spans);
		expect(filtered.map((c) => c.shotId)).toEqual(['shot:pre', 'shot:post']);
	});
});
