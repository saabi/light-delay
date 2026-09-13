import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { checkReferenceBudget } from '../../../scripts/lib/generation-planning.mjs';
import { computeStretchDigest } from '../../../scripts/lib/visual-stretch-digest.mjs';
import { buildVisualStretchesReport } from '../../../scripts/lib/visual-stretches-report.mjs';
import {
	buildVisualStretchJobs,
	collectStillStretchReferences,
	collectVideoStretchReferences,
	isStretchJobRunnable,
	partitionStretchVideoJobs,
	referenceBudgetBlockers
} from '../../../scripts/lib/visual-stretch-jobs.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');

/** Provider/model hard ceiling (Seedance 2.5 on Higgsfield). */
const SEEDANCE_PROVIDER_CEILING_MS = 30000;
/** Campaign operational ceiling (may be ≤ provider). */
const CAMPAIGN_CEILING_MS = 30000;
const EFFECTIVE_CEILING_MS = Math.min(CAMPAIGN_CEILING_MS, SEEDANCE_PROVIDER_CEILING_MS);

const gptImageLimits = {
	maxImages: 8,
	maxVideos: 0,
	maxAudios: 0,
	maxTotalReferences: 8
} as const;

const stillProviderFixture = {
	id: 'provider:openai:gpt-image-2:test',
	supportsCombinedStoryboardSheet: true,
	limits: gptImageLimits,
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
		maxDurationMs: SEEDANCE_PROVIDER_CEILING_MS
	}
};

describe('visual stretch reference budgets', () => {
	it('accepts 8 still references and blocks 9', () => {
		/** @type {Array<{ kind: 'image', id: string }>} */
		const eight = Array.from({ length: 8 }, (_, i) => ({
			kind: 'image' as const,
			id: `asset:ref-${i}`
		}));
		const nine = [...eight, { kind: 'image' as const, id: 'asset:ref-8' }];
		expect(checkReferenceBudget(eight, gptImageLimits).ok).toBe(true);
		expect(referenceBudgetBlockers(eight, gptImageLimits)).toEqual([]);
		expect(referenceBudgetBlockers(nine, gptImageLimits).some((b) => b.includes('images:9>8'))).toBe(
			true
		);
	});

	it('counts authored still refs without keyframe deduction', () => {
		const stretch = {
			referenceAssetIds: Array.from({ length: 7 }, (_, i) => `asset:c-${i}`)
		};
		expect(collectStillStretchReferences(stretch)).toHaveLength(7);
	});

	it('omits character/location sheets already covered by keyframes', () => {
		const stretch = {
			locationId: 'location:bridge',
			presentCharacterIds: ['character:voss', 'character:zao'],
			referenceAssetIds: [
				'asset:character-voss-sheet',
				'asset:character-zao-sheet',
				'asset:location-bridge',
				'asset:prop-extra'
			]
		};
		const members = [
			{ shotId: 'shot-a', order: 1 },
			{ shotId: 'shot-b', order: 2 }
		];
		const shotsById = new Map([
			[
				'shot-a',
				{
					id: 'shot-a',
					locationId: 'location:bridge',
					visibleRefs: [
						{ kind: 'character', id: 'character:voss' },
						{ kind: 'character', id: 'character:zao' }
					]
				}
			],
			[
				'shot-b',
				{
					id: 'shot-b',
					locationId: 'location:bridge',
					visibleRefs: [
						{ kind: 'character', id: 'character:voss' },
						{ kind: 'character', id: 'character:zao' }
					]
				}
			]
		]);
		const keyframeByShotId = new Map([
			['shot-a', 'asset:panel-a'],
			['shot-b', 'asset:panel-b']
		]);
		const entityReferenceIds = new Map([
			['character:voss', ['asset:character-voss-sheet']],
			['character:zao', ['asset:character-zao-sheet']],
			['location:bridge', ['asset:location-bridge']]
		]);
		const { references: refs } = collectVideoStretchReferences({
			stretch,
			members,
			shotsById,
			keyframeByShotId,
			entityReferenceIds
		});
		expect(refs.filter((r) => r.role === 'keyframe').map((r) => r.id)).toEqual([
			'asset:panel-a',
			'asset:panel-b'
		]);
		expect(refs.filter((r) => r.role === 'visual_reference').map((r) => r.id)).toEqual([
			'asset:prop-extra'
		]);
	});

	it('omits vehicle/prop sheets already covered by keyframe visibleRefs', () => {
		const stretch = {
			locationId: 'location:bay',
			presentCharacterIds: [],
			referenceAssetIds: [
				'asset:vehicle-ardor',
				'asset:object-tablet',
				'asset:location-bay',
				'asset:unrelated-extra'
			]
		};
		const members = [{ shotId: 'shot-a', order: 1 }];
		const shotsById = new Map([
			[
				'shot-a',
				{
					id: 'shot-a',
					locationId: 'location:bay',
					visibleRefs: [
						{ kind: 'vehicle', id: 'vehicle:ardor' },
						{ kind: 'object', id: 'object:tablet' }
					]
				}
			]
		]);
		const { references: refs } = collectVideoStretchReferences({
			stretch,
			members,
			shotsById,
			keyframeByShotId: new Map([['shot-a', 'asset:panel-a']]),
			entityReferenceIds: new Map([
				['vehicle:ardor', ['asset:vehicle-ardor']],
				['object:tablet', ['asset:object-tablet']],
				['location:bay', ['asset:location-bay']]
			])
		});
		expect(refs.filter((r) => r.role === 'visual_reference').map((r) => r.id)).toEqual([
			'asset:unrelated-extra'
		]);
	});

	it('budgets one voice sample per speaker for the job language', () => {
		const stretch = { referenceAssetIds: [] };
		const members = [{ shotId: 'shot-a', order: 1 }];
		const shotsById = new Map([
			[
				'shot-a',
				{
					id: 'shot-a',
					cuePlacements: [{ cueId: 'cue-a' }, { cueId: 'cue-b' }]
				}
			]
		]);
		const cuesById = new Map([
			['cue-a', { id: 'cue-a', type: 'dialogue', speakerId: 'character:zao' }],
			['cue-b', { id: 'cue-b', type: 'dialogue', speakerId: 'character:voss' }]
		]);
		const voiceProfiles = [
			{
				id: 'voice:zao',
				characterId: 'character:zao',
				variants: [
					{ language: 'es', sampleAssetIds: ['asset:voice-zao-es', 'asset:voice-zao-es-2'] },
					{ language: 'en', sampleAssetIds: ['asset:voice-zao-en', 'asset:voice-zao-en-2'] }
				]
			},
			{
				id: 'voice:voss',
				characterId: 'character:voss',
				variants: [
					{ language: 'en', sampleAssetIds: ['asset:voice-voss-en'] },
					{ language: 'es', sampleAssetIds: ['asset:voice-voss-es'] }
				]
			}
		];
		const { references, blockers } = collectVideoStretchReferences({
			stretch,
			members,
			shotsById,
			cuesById,
			voiceProfiles,
			language: 'en'
		});
		expect(blockers).toEqual([]);
		expect(references.filter((r) => r.role === 'voice_sample').map((r) => r.id)).toEqual([
			'asset:voice-voss-en',
			'asset:voice-zao-en'
		]);
		expect(
			referenceBudgetBlockers(references, {
				maxImages: 9,
				maxAudios: 1,
				maxTotalReferences: 50
			}).some((b) => b.includes('audios:2>1'))
		).toBe(true);
	});

	it('emits missing_voice_sample when a speaker has no sampleAssetIds', () => {
		const { blockers } = collectVideoStretchReferences({
			stretch: { referenceAssetIds: [] },
			members: [{ shotId: 'shot-a', order: 1 }],
			shotsById: new Map([
				['shot-a', { id: 'shot-a', cuePlacements: [{ cueId: 'cue-a' }] }]
			]),
			cuesById: new Map([
				['cue-a', { id: 'cue-a', type: 'dialogue', speakerId: 'character:zao' }]
			]),
			voiceProfiles: [{ id: 'voice:zao', characterId: 'character:zao', variants: [{}] }]
		});
		expect(blockers).toContain('missing_voice_sample:character:zao');
	});
});

describe('visual stretch Seedance partition', () => {
	const stretch = { id: 'stretch:x', revision: 1, referenceAssetIds: [] };

	it('keeps a 29s stretch under the 30s Seedance ceiling as one job', () => {
		const members = [
			{ shotId: 'a', order: 1 },
			{ shotId: 'b', order: 2 }
		];
		const shotsById = new Map([
			['a', { id: 'a', durationMs: 15000 }],
			['b', { id: 'b', durationMs: 14000 }]
		]);
		const jobs = partitionStretchVideoJobs(
			stretch,
			members,
			shotsById,
			EFFECTIVE_CEILING_MS,
			'still:1'
		);
		expect(jobs).toHaveLength(1);
		expect(jobs[0].durationMs ?? 0).toBe(29000);
		expect(jobs[0].durationMs ?? 0).toBeLessThanOrEqual(EFFECTIVE_CEILING_MS);
		expect(jobs[0].blockers).not.toContain('member_exceeds_max_duration');
	});

	it('splits a 31s stretch into multiple jobs under the 30s ceiling', () => {
		const members = [
			{ shotId: 'a', order: 1 },
			{ shotId: 'b', order: 2 }
		];
		const shotsById = new Map([
			['a', { id: 'a', durationMs: 15000 }],
			['b', { id: 'b', durationMs: 16000 }]
		]);
		const jobs = partitionStretchVideoJobs(
			stretch,
			members,
			shotsById,
			EFFECTIVE_CEILING_MS,
			'still:1'
		);
		expect(jobs).toHaveLength(2);
		expect(jobs.every((job) => (job.durationMs ?? 0) <= EFFECTIVE_CEILING_MS)).toBe(true);
	});

	it('marks a single 45s over-limit member non-runnable', () => {
		const members = [{ shotId: 'a', order: 1 }];
		const shotsById = new Map([['a', { id: 'a', durationMs: 45000 }]]);
		const jobs = partitionStretchVideoJobs(
			stretch,
			members,
			shotsById,
			EFFECTIVE_CEILING_MS,
			'still:1'
		);
		expect(jobs).toHaveLength(1);
		expect(jobs[0].durationMs ?? 0).toBe(45000);
		expect(jobs[0].blockers).toContain('member_exceeds_max_duration');
		expect(jobs[0].runnable).toBe(false);
		expect(isStretchJobRunnable(jobs[0])).toBe(false);
	});
});

describe('buildVisualStretchJobs integration', () => {
	function makeStretchScript(overrides: {
		referenceCount?: number;
		withKeyframes?: boolean;
		memberDurationsMs?: number[];
	}) {
		const referenceCount = overrides.referenceCount ?? 7;
		const durations = overrides.memberDurationsMs ?? [10000, 8000];
		const members = durations.map((durationMs, index) => ({
			shotId: `shot-${index + 1}`,
			order: index + 1,
			takeScope: 'selected' as const,
			durationMs
		}));
		const shots = members.map((member) => ({
			id: member.shotId,
			durationMs: member.durationMs,
			selectedTakeId: `${member.shotId}:take-01`,
			locationId: 'location:bridge',
			visibleRefs: [
				{ kind: 'character', id: 'character:voss' },
				{ kind: 'vehicle', id: 'vehicle:ardor' }
			],
			cuePlacements: []
		}));
		const takes = shots.map((shot) => ({
			id: shot.selectedTakeId,
			shotId: shot.id,
			number: 1,
			status: 'candidate',
			...(overrides.withKeyframes
				? {
						imageAssetId: `asset:panel-${shot.id}`,
						generation: {
							visualStretchId: 'stretch:test',
							stretchJobId: 'stretch:test:rev-1'
						}
					}
				: {})
		}));
		return {
			script: { id: 'script:test' },
			shots,
			takes,
			cues: [],
			visualStretches: [
				{
					id: 'stretch:test',
					revision: 1,
					status: 'draft',
					locationId: 'location:bridge',
					presentCharacterIds: ['character:voss'],
					absentCharacterIds: [],
					blocking: [],
					sharedDescription: { en: 'test', es: 'test' },
					referenceAssetIds: Array.from(
						{ length: referenceCount },
						(_, i) => `asset:ref-${i}`
					).concat(overrides.withKeyframes ? ['asset:character-voss-sheet', 'asset:vehicle-ardor'] : []),
					members: members.map(({ shotId, order, takeScope }) => ({
						shotId,
						order,
						takeScope
					})),
					generationProfile: {
						stillMode: 'combined_storyboard_sheet',
						videoMode: 'grouped_seedance',
						gridLayout: {
							rows: 2,
							cols: 2,
							gutterFraction: 0.02,
							panelAspect: '16:9',
							blankCells: members.length === 2 ? [3, 4] : [4]
						}
					}
				}
			]
		};
	}

	it('builds an eight-reference still job without a budget blocker', () => {
		const jobs = buildVisualStretchJobs(makeStretchScript({ referenceCount: 8 }), {
			maxSegmentMs: EFFECTIVE_CEILING_MS,
			stillProvider: stillProviderFixture,
			videoProvider: videoProviderFixture,
			entityReferenceIds: new Map()
		});
		const still = jobs.find((j) => j.medium === 'still');
		expect(still?.sharedReferenceAssetIds).toHaveLength(8);
		expect(still?.blockers.some((b: string) => b.startsWith('reference_budget:'))).toBe(false);
	});

	it('builds a nine-reference still job with a budget blocker', () => {
		const jobs = buildVisualStretchJobs(makeStretchScript({ referenceCount: 9 }), {
			maxSegmentMs: EFFECTIVE_CEILING_MS,
			stillProvider: stillProviderFixture,
			videoProvider: videoProviderFixture,
			entityReferenceIds: new Map()
		});
		const still = jobs.find((j) => j.medium === 'still');
		expect(still?.blockers.some((b: string) => b.includes('images:9>8'))).toBe(true);
		expect(isStretchJobRunnable(still)).toBe(false);
	});

	it('removes keyframe-covered character/vehicle sheets from Seedance additional refs', () => {
		const jobs = buildVisualStretchJobs(
			makeStretchScript({ referenceCount: 0, withKeyframes: true }),
			{
				maxSegmentMs: EFFECTIVE_CEILING_MS,
				stillProvider: stillProviderFixture,
				videoProvider: videoProviderFixture,
				entityReferenceIds: new Map([
					['character:voss', ['asset:character-voss-sheet']],
					['vehicle:ardor', ['asset:vehicle-ardor']],
					['location:bridge', ['asset:location-bridge']]
				])
			}
		);
		const video = jobs.find((j) => j.medium === 'video');
		expect(video?.memberInputs.every((m: { keyframeAssetId?: string }) => m.keyframeAssetId)).toBe(
			true
		);
		expect(video?.sharedReferenceAssetIds).toEqual([]);
		expect(video?.durationMs ?? 0).toBeLessThanOrEqual(EFFECTIVE_CEILING_MS);
	});

	it('uses the effective campaign/provider ceiling for every Seedance job', () => {
		const jobs = buildVisualStretchJobs(
			makeStretchScript({ memberDurationsMs: [20000, 15000] }),
			{
				maxSegmentMs: EFFECTIVE_CEILING_MS,
				stillProvider: stillProviderFixture,
				videoProvider: videoProviderFixture,
				entityReferenceIds: new Map()
			}
		);
		const videoJobs = jobs.filter((j) => j.medium === 'video');
		expect(videoJobs.length).toBeGreaterThan(1);
		expect(
			videoJobs.every((j) => (j.durationMs ?? 0) <= EFFECTIVE_CEILING_MS || !j.runnable)
		).toBe(true);
		expect(
			videoJobs
				.filter((j) => (j.durationMs ?? 0) <= EFFECTIVE_CEILING_MS)
				.every((j) => (j.durationMs ?? 0) <= EFFECTIVE_CEILING_MS)
		).toBe(true);
	});
});

describe('visual stretch digest agreement', () => {
	it('stays fresh after selecting the derived candidate take', () => {
		const script = JSON.parse(
			readFileSync(join(ROOT, 'data/scripts/light-delay-festival-master.json'), 'utf8')
		);
		const stretch = (script.visualStretches || []).find((s: { id: string }) =>
			String(s.id).includes('bridge-meal-010-012')
		);
		expect(stretch).toBeTruthy();
		const digest = computeStretchDigest(stretch, script);
		const clone = structuredClone(script);
		const shotId = stretch.members[0].shotId;
		const derivedTakeId = `${shotId}:take-99`;
		clone.takes.push({
			id: derivedTakeId,
			shotId,
			number: 99,
			status: 'candidate',
			generation: {
				visualStretchId: stretch.id,
				stretchJobId: `${stretch.id}:rev-${stretch.revision}`,
				stretchDigest: digest,
				prompt: 'derived panel prompt must not affect digest'
			}
		});
		const shot = clone.shots.find((item: { id: string }) => item.id === shotId);
		shot.selectedTakeId = derivedTakeId;
		if (!shot.takeIds.includes(derivedTakeId)) shot.takeIds.push(derivedTakeId);
		expect(computeStretchDigest(stretch, clone)).toBe(digest);
		const report = buildVisualStretchesReport(clone);
		const row = report.rows.find((r: { id: string }) => r.id === stretch.id);
		expect(row?.staleDerivedTakeIds).toEqual([]);
	});
});
