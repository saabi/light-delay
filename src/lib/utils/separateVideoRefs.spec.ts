import { describe, expect, it } from 'vitest';
import { buildStretchDigestPayload } from '../../../scripts/lib/visual-stretch.mjs';
import {
	assertSharedReferenceAlias,
	assetReferenceQualityBlockers,
	buildVisualStretchJobs,
	collectVideoStretchReferences,
	dedupeReferencesByAssetId,
	resolveVideoReferencePolicy
} from '../../../scripts/lib/visual-stretch-jobs.mjs';
import {
	buildEffectiveReferences,
	orderedStretchStagingAssetIds
} from '../../../scripts/lib/visual-stretch-handoff.mjs';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const stillProviderFixture = {
	id: 'provider:openai:gpt-image-2:test',
	supportsCombinedStoryboardSheet: true,
	limits: { maxImages: 8, maxVideos: 0, maxAudios: 0, maxTotalReferences: 8 },
	minPanelResolution: { width: 512, height: 288 },
	supportedStoryboardLayouts: [
		{ rows: 2, columns: 2, aspectRatio: '16:9' },
		{ rows: 3, columns: 3, aspectRatio: '16:9' }
	],
	outputSizes: [
		{ width: 1536, height: 1024, aspectRatio: '3:2' },
		{ width: 1024, height: 1024, aspectRatio: '1:1' }
	]
};

const videoProviderFixture = {
	id: 'provider:higgsfield:seedance-2.5:test',
	limits: {
		maxImages: null,
		maxVideos: null,
		maxAudios: 8,
		maxTotalReferences: 50,
		maxDurationMs: 30000
	}
};

type StretchFixture = {
	id: string;
	revision: number;
	status: string;
	locationId: string;
	presentCharacterIds: string[];
	absentCharacterIds: string[];
	sharedDescription: { en: string };
	physics: { en: string };
	lighting: { en: string };
	blocking: unknown[];
	members: Array<{ order: number; shotId: string; takeScope: string }>;
	generationProfile: {
		stillMode: string;
		videoMode: string;
		gridLayout: {
			rows: number;
			cols: number;
			gutterFraction: number;
			panelAspect: string;
			blankCells: number[];
		};
	};
	referenceAssetIds: string[];
	videoReferenceAssetIds?: string[];
};

function baseStretch(overrides: Partial<StretchFixture> = {}): StretchFixture {
	return {
		id: 'stretch:test',
		revision: 1,
		status: 'draft',
		locationId: 'location:bridge',
		presentCharacterIds: ['character:a', 'character:b'],
		absentCharacterIds: [],
		sharedDescription: { en: 'shared' },
		physics: { en: '1g' },
		lighting: { en: 'soft' },
		blocking: [],
		members: [
			{ order: 1, shotId: 'shot:a', takeScope: 'selected' },
			{ order: 2, shotId: 'shot:b', takeScope: 'selected' }
		],
		generationProfile: {
			stillMode: 'combined_storyboard_sheet',
			videoMode: 'grouped_seedance',
			gridLayout: { rows: 2, cols: 2, gutterFraction: 0.02, panelAspect: '16:9', blankCells: [3, 4] }
		},
		referenceAssetIds: ['asset:sheet-a', 'asset:sheet-b', 'asset:loc'],
		...overrides
	};
}

const shotsById = new Map([
	[
		'shot:a',
		{
			id: 'shot:a',
			locationId: 'location:bridge',
			visibleRefs: [{ kind: 'character', id: 'character:a' }],
			durationMs: 2000,
			cuePlacements: [],
			selectedTakeId: 'take:a'
		}
	],
	[
		'shot:b',
		{
			id: 'shot:b',
			locationId: 'location:bridge',
			visibleRefs: [{ kind: 'character', id: 'character:b' }],
			durationMs: 2000,
			cuePlacements: [],
			selectedTakeId: 'take:b'
		}
	]
]);

const entityReferenceIds = new Map([
	['character:a', ['asset:sheet-a']],
	['character:b', ['asset:sheet-b']],
	['location:bridge', ['asset:loc']]
]);

describe('separate still/video reference sets', () => {
	it('resolves tri-state videoReferencePolicy', () => {
		expect(resolveVideoReferencePolicy({})).toBe('fallback');
		expect(resolveVideoReferencePolicy({ videoReferenceAssetIds: [] })).toBe('explicit');
		expect(resolveVideoReferencePolicy({ videoReferenceAssetIds: ['asset:x'] })).toBe('explicit');
	});

	it('changes digest when absent becomes explicit empty', () => {
		const shots = shotsById;
		const fallback = buildStretchDigestPayload({ stretch: baseStretch(), shotsById: shots });
		const explicitEmpty = buildStretchDigestPayload({
			stretch: baseStretch({ videoReferenceAssetIds: [] }),
			shotsById: shots
		});
		expect(fallback.videoReferencePolicy).toBe('fallback');
		expect(explicitEmpty.videoReferencePolicy).toBe('explicit');
		expect(explicitEmpty.videoReferenceAssetIds).toEqual([]);
		expect(JSON.stringify(fallback)).not.toEqual(JSON.stringify(explicitEmpty));
	});

	it('keeps still refs complete and independent of explicit video list', () => {
		const stretch = baseStretch({
			referenceAssetIds: ['asset:sheet-a', 'asset:sheet-b', 'asset:loc'],
			videoReferenceAssetIds: ['asset:custom-extra']
		});
		const file = {
			script: { id: 'script:t' },
			shots: [...shotsById.values()],
			takes: [
				{ id: 'take:a', shotId: 'shot:a' },
				{ id: 'take:b', shotId: 'shot:b' }
			],
			cues: [],
			visualStretches: [stretch]
		};
		const jobs = buildVisualStretchJobs(file, {
			maxSegmentMs: 30000,
			stillProvider: stillProviderFixture,
			videoProvider: videoProviderFixture,
			entityReferenceIds
		});
		const still = jobs.find((j) => j.medium === 'still');
		expect(still?.stillReferenceAssetIds).toEqual([
			'asset:sheet-a',
			'asset:sheet-b',
			'asset:loc'
		]);
		expect(still?.sharedReferenceAssetIds).toEqual(still?.stillReferenceAssetIds);
		expect(still?.videoReferencePolicy).toBeUndefined();
		const video = jobs.find((j) => j.medium === 'video');
		expect(video?.videoReferencePolicy).toBe('explicit');
		expect(video?.videoReferenceAssetIds).toEqual(['asset:custom-extra']);
		expect(video?.stillReferenceAssetIds).toEqual(still?.stillReferenceAssetIds);
		// Explicit extras attach only when they cover uncovered entities or speakers on this job.
		expect(video?.effectiveVideoReferenceAssetIds ?? []).not.toContain('asset:custom-extra');
		expect(video?.sharedReferenceAssetIds).toEqual(video?.effectiveVideoReferenceAssetIds);
	});

	it('uses fallback extras when video list absent; explicit [] yields no extras', () => {
		const fallback = collectVideoStretchReferences({
			stretch: baseStretch(),
			members: baseStretch().members,
			shotsById,
			keyframeByShotId: new Map(),
			entityReferenceIds
		});
		expect(fallback.videoReferencePolicy).toBe('fallback');
		expect(fallback.effectiveVideoReferenceAssetIds).toEqual([
			'asset:sheet-a',
			'asset:sheet-b',
			'asset:loc'
		]);

		const explicitEmpty = collectVideoStretchReferences({
			stretch: baseStretch({ videoReferenceAssetIds: [] }),
			members: baseStretch().members,
			shotsById,
			keyframeByShotId: new Map(),
			entityReferenceIds
		});
		expect(explicitEmpty.videoReferencePolicy).toBe('explicit');
		expect(explicitEmpty.effectiveVideoReferenceAssetIds).toEqual([]);
	});

	it('dedupes keyframe overlap and duplicate ids before budgeting', () => {
		const refs = dedupeReferencesByAssetId([
			{ kind: 'image', id: 'asset:a', role: 'keyframe' },
			{ kind: 'image', id: 'asset:a', role: 'visual_reference' },
			{ kind: 'audio', id: 'asset:v', role: 'voice_sample' },
			{ kind: 'audio', id: 'asset:v', role: 'voice_sample' }
		]);
		expect(refs.map((r) => r.id)).toEqual(['asset:a', 'asset:v']);

		const collected = collectVideoStretchReferences({
			stretch: baseStretch({
				videoReferenceAssetIds: ['asset:sheet-a', 'asset:sheet-a', 'asset:custom']
			}),
			members: baseStretch().members,
			shotsById,
			keyframeByShotId: new Map([['shot:a', 'asset:sheet-a']]),
			entityReferenceIds
		});
		expect(collected.references.filter((r) => r.id === 'asset:sheet-a')).toHaveLength(1);
		expect(collected.effectiveVideoReferenceAssetIds).not.toContain('asset:sheet-a');
		expect(collected.effectiveVideoReferenceAssetIds).not.toContain('asset:custom');
	});

	it('partial keyframes only cover that shot entities; sibling stays required', () => {
		const collected = collectVideoStretchReferences({
			stretch: baseStretch({ videoReferenceAssetIds: ['asset:custom-only'] }),
			members: baseStretch().members,
			shotsById,
			keyframeByShotId: new Map([['shot:a', 'asset:kf-a']]),
			entityReferenceIds
		});
		expect(collected.blockers).toEqual(
			expect.arrayContaining(['uncovered_video_entity:character:b'])
		);
		expect(collected.blockers).not.toContain('uncovered_video_entity:character:a');
		expect(collected.blockers).not.toContain('uncovered_video_entity:location:bridge');
	});

	it('custom non-sheet asset does not clear entity completeness', () => {
		const collected = collectVideoStretchReferences({
			stretch: baseStretch({ videoReferenceAssetIds: ['asset:orphan-custom'] }),
			members: baseStretch().members,
			shotsById,
			keyframeByShotId: new Map(),
			entityReferenceIds
		});
		expect(collected.effectiveVideoReferenceAssetIds).toEqual([]);
		expect(collected.blockers).toEqual(
			expect.arrayContaining([
				'uncovered_video_entity:character:a',
				'uncovered_video_entity:character:b',
				'uncovered_video_entity:location:bridge'
			])
		);
	});

	it('missing keyframes make video job non-runnable', () => {
		const file = {
			script: { id: 'script:t' },
			shots: [...shotsById.values()],
			takes: [
				{ id: 'take:a', shotId: 'shot:a' },
				{ id: 'take:b', shotId: 'shot:b' }
			],
			cues: [],
			visualStretches: [baseStretch()]
		};
		const jobs = buildVisualStretchJobs(file, {
			maxSegmentMs: 30000,
			stillProvider: stillProviderFixture,
			videoProvider: videoProviderFixture,
			entityReferenceIds
		});
		const video = jobs.find((j) => j.medium === 'video');
		expect(video?.blockers).toEqual(
			expect.arrayContaining(['missing_keyframe:shot:a', 'missing_keyframe:shot:b'])
		);
		expect(video?.runnable).toBe(false);
	});

	it('alias mismatch throws', () => {
		expect(() =>
			assertSharedReferenceAlias({
				id: 'j',
				medium: 'still',
				stillReferenceAssetIds: ['a'],
				sharedReferenceAssetIds: ['b']
			})
		).toThrow(/stillReferenceAssetIds/);
		expect(() =>
			assertSharedReferenceAlias({
				id: 'j',
				medium: 'video',
				effectiveVideoReferenceAssetIds: ['a'],
				sharedReferenceAssetIds: ['b']
			})
		).toThrow(/effectiveVideoReferenceAssetIds/);
	});

	it('staging order matches keyframe → visual → voice', () => {
		const job = {
			medium: 'video',
			memberInputs: [
				{ order: 1, shotId: 'shot:a', keyframeAssetId: 'asset:kf1' },
				{ order: 2, shotId: 'shot:b', keyframeAssetId: undefined }
			],
			effectiveVideoReferenceAssetIds: ['asset:vis1', 'asset:vis2'],
			voiceSampleAssetIds: ['asset:voice1'],
			sharedReferenceAssetIds: ['asset:vis1', 'asset:vis2']
		};
		expect(orderedStretchStagingAssetIds(job)).toEqual([
			'asset:kf1',
			'asset:vis1',
			'asset:vis2',
			'asset:voice1'
		]);
	});

	it('handoff effective visuals match plan stored list', () => {
		const stretch = baseStretch({ videoReferenceAssetIds: ['asset:custom'] });
		const job = {
			memberInputs: [
				{ order: 1, shotId: 'shot:a', keyframeAssetId: null },
				{ order: 2, shotId: 'shot:b', keyframeAssetId: null }
			],
			effectiveVideoReferenceAssetIds: ['asset:custom'],
			voiceSampleAssetIds: [],
			videoReferencePolicy: 'explicit',
			videoReferenceAssetIds: ['asset:custom']
		};
		const assetsById = new Map([
			[
				'asset:custom',
				{
					id: 'asset:custom',
					path: '/assets/custom.png',
					metadata: { entityIds: ['character:a'] }
				}
			]
		]);
		const { references, recomputedEffectiveVideoReferenceAssetIds } = buildEffectiveReferences(
			job,
			stretch,
			{ shots: [...shotsById.values()], cues: [] },
			assetsById,
			{ root: ROOT, entityReferenceIds }
		);
		expect(recomputedEffectiveVideoReferenceAssetIds).toEqual(['asset:custom']);
		expect(
			references.filter((r) => r.role === 'visual_reference').map((r) => r.assetId)
		).toEqual(['asset:custom']);
	});

	it('no-op migration: festival-master stretch without videoReferenceAssetIds is fallback', () => {
		const script = JSON.parse(
			readFileSync(join(ROOT, 'data/scripts/light-delay-festival-master.json'), 'utf8')
		);
		const plan = JSON.parse(
			readFileSync(join(ROOT, 'data/production/plans/light-delay-festival-master.json'), 'utf8')
		);
		const stretch = (script.visualStretches || []).find(
			(item: { id?: string; videoReferenceAssetIds?: string[] }) =>
				item.id === 'festival-master:stretch-bridge-greeting-prep-083-085'
		);
		expect(stretch).toBeTruthy();
		expect(Object.prototype.hasOwnProperty.call(stretch, 'videoReferenceAssetIds')).toBe(false);
		const video = (plan.visualStretchJobs || []).find(
			(j: { medium?: string; stretchId?: string }) =>
				j.medium === 'video' && j.stretchId === stretch.id
		);
		expect(video?.videoReferencePolicy).toBe('fallback');
		expect(video?.videoReferenceAssetIds).toBeUndefined();
		expect(video?.stillReferenceAssetIds).toEqual(stretch.referenceAssetIds);
		expect(video?.sharedReferenceAssetIds).toEqual(video?.effectiveVideoReferenceAssetIds);
		expect(video?.stillReferenceAssetIds).toEqual(
			expect.arrayContaining(video?.effectiveVideoReferenceAssetIds || [])
		);
		expect(
			(video?.blockers || []).some((b: string) => b.startsWith('reference_pack_required'))
		).toBe(false);
		expect(video?.referenceBudget?.keyframeCoveredEntityIds?.length).toBeGreaterThan(0);
		expect(video?.referenceBudget?.uncoveredVideoEntityIds || []).toEqual([]);
	});

	it('voice sample quality gates when assetsById is provided', () => {
		const assetsById = new Map([
			['asset:voice-ok', { id: 'asset:voice-ok', path: '/assets/voice.wav' }],
			['asset:voice-stale', { id: 'asset:voice-stale', path: '/assets/stale.wav', imageStatus: { status: 'needs_review' } }],
			['asset:voice-nopath', { id: 'asset:voice-nopath' }]
		]);
		expect(assetReferenceQualityBlockers('asset:voice-ok', assetsById, 'audio')).toEqual([]);
		expect(assetReferenceQualityBlockers('asset:voice-stale', assetsById, 'audio')).toEqual([
			'stale_audio_asset:asset:voice-stale'
		]);
		expect(assetReferenceQualityBlockers('asset:voice-nopath', assetsById, 'audio')).toEqual([
			'missing_audio_path:asset:voice-nopath'
		]);
		expect(assetReferenceQualityBlockers('asset:missing', assetsById, 'audio')).toEqual([
			'missing_audio_asset:asset:missing'
		]);
	});
});

describe('generation-plan visualStretchJob medium schema rules', () => {
	const schema = JSON.parse(
		readFileSync(join(ROOT, 'data/schemas/generation-plan.schema.json'), 'utf8')
	);
	const ajv = new Ajv2020({ allErrors: true, strict: true, validateFormats: false });
	ajv.addSchema(schema);
	const validateJob = ajv.getSchema(
		'https://light-delay.local/schemas/generation-plan.schema.json#/$defs/visualStretchJob'
	);
	if (!validateJob) throw new Error('missing visualStretchJob schema');

	function baseStill(overrides = {}) {
		return {
			id: 'still-1',
			stretchId: 'stretch:x',
			revision: 1,
			medium: 'still',
			mode: 'combined_storyboard_sheet',
			providerSnapshotId: 'provider:test',
			outputTakePolicy: 'new_candidate',
			memberInputs: [{ order: 1, shotId: 'shot:a', sourceTakeIds: ['take:a'] }],
			stillReferenceAssetIds: ['a'],
			sharedReferenceAssetIds: ['a'],
			gridLayout: {
				rows: 2,
				cols: 2,
				gutterFraction: 0.02,
				panelAspect: '16:9',
				blankCells: [3, 4]
			},
			compiledPrompt: null,
			outputs: [{ order: 1, artifact: 'combinedStoryboard' }],
			blockers: [],
			coherenceException: false,
			...overrides
		};
	}

	function baseVideo(overrides = {}) {
		return {
			id: 'video-1',
			stretchId: 'stretch:x',
			revision: 1,
			medium: 'video',
			mode: 'grouped_seedance',
			providerSnapshotId: 'provider:test',
			outputTakePolicy: 'new_candidate',
			dependsOnStillJobId: 'still-1',
			memberInputs: [{ order: 1, shotId: 'shot:a', sourceTakeIds: ['take:a'] }],
			stillReferenceAssetIds: ['a'],
			videoReferencePolicy: 'fallback',
			effectiveVideoReferenceAssetIds: ['a'],
			sharedReferenceAssetIds: ['a'],
			compiledPrompt: null,
			outputs: [{ order: 1, artifact: 'video' }],
			blockers: [],
			coherenceException: false,
			...overrides
		};
	}

	it('fallback video jobs omit authored videoReferenceAssetIds', () => {
		expect(validateJob(baseVideo())).toBe(true);
		expect(
			validateJob(baseVideo({ videoReferencePolicy: 'fallback', videoReferenceAssetIds: [] }))
		).toBe(false);
	});

	it('explicit video jobs may contain empty videoReferenceAssetIds', () => {
		expect(
			validateJob(
				baseVideo({
					videoReferencePolicy: 'explicit',
					videoReferenceAssetIds: [],
					effectiveVideoReferenceAssetIds: [],
					sharedReferenceAssetIds: []
				})
			)
		).toBe(true);
	});

	it('video jobs require videoReferencePolicy and effectiveVideoReferenceAssetIds', () => {
		const { videoReferencePolicy: _p, ...noPolicy } = baseVideo();
		expect(validateJob(noPolicy)).toBe(false);
		const { effectiveVideoReferenceAssetIds: _e, ...noEffective } = baseVideo();
		expect(validateJob(noEffective)).toBe(false);
	});

	it('still jobs cannot contain videoReferencePolicy or authored videoReferenceAssetIds', () => {
		expect(validateJob(baseStill())).toBe(true);
		expect(validateJob(baseStill({ videoReferencePolicy: 'fallback' }))).toBe(false);
		expect(validateJob(baseStill({ videoReferenceAssetIds: [] }))).toBe(false);
	});
});
