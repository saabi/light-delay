import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
	collectProductionGateValidation,
	deriveGenerationGateFromTakes,
	effectiveProductionGateStatus,
	evaluatePrerequisiteAssets,
	isProductionGateHold,
	resolveShotSourceTakeIds,
	resolveStretchMemberSourceTakeIds
} from '../../../scripts/lib/production-gate.mjs';
import {
	buildVisualStretchJobs,
	collectStretchProductionGate
} from '../../../scripts/lib/visual-stretch-jobs.mjs';
import { buildImageDebtReport, buildRegenBriefsReport } from '../../../scripts/lib/editorial-reports.mjs';
import { createScriptContext } from '../../../scripts/lib/report-cli.mjs';
import { createProjectContext } from '../../../scripts/lib/project-context.mjs';

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

describe('Take.productionGate', () => {
	it('treats absent gate as eligible', () => {
		expect(effectiveProductionGateStatus({})).toBe('eligible');
		expect(isProductionGateHold({})).toBe(false);
	});

	it('enforces deferred / blocked / eligible invariants', () => {
		const assetIds = new Set(['asset:ref-a']);
		const deferredOk = collectProductionGateValidation(
			{
				productionGate: {
					status: 'deferred',
					reasonCode: 'awaiting_reference_asset',
					reason: { en: 'Need Blender rings ref.' },
					prerequisiteAssetIds: ['asset:ref-a']
				}
			},
			'take:x',
			{ assetIds }
		);
		expect(deferredOk.errors).toEqual([]);

		const deferredMissing = collectProductionGateValidation(
			{
				productionGate: {
					status: 'deferred',
					reasonCode: 'awaiting_reference_asset',
					reason: { en: 'Need ref.' },
					prerequisiteAssetIds: []
				}
			},
			'take:x',
			{ assetIds }
		);
		expect(deferredMissing.errors.some((e) => e.includes('prerequisiteAssetIds'))).toBe(true);

		const blockedWithPrereq = collectProductionGateValidation(
			{
				productionGate: {
					status: 'blocked',
					reasonCode: 'author_hold',
					reason: { en: 'Hold.' },
					prerequisiteAssetIds: ['asset:ref-a']
				}
			},
			'take:x',
			{ assetIds }
		);
		expect(blockedWithPrereq.errors.some((e) => e.includes('must not carry'))).toBe(true);

		const eligibleDirty = collectProductionGateValidation(
			{
				productionGate: {
					status: 'eligible',
					reasonCode: 'author_hold',
					reason: { en: 'nope' }
				}
			},
			'take:x',
			{ assetIds }
		);
		expect(eligibleDirty.errors.length).toBeGreaterThan(0);
	});

	it('warns on unknown reasonCode without erroring', () => {
		const result = collectProductionGateValidation(
			{
				productionGate: {
					status: 'blocked',
					reasonCode: 'custom_author_code',
					reason: { en: 'Custom hold.' }
				}
			},
			'take:x',
			{}
		);
		expect(result.errors).toEqual([]);
		expect(result.warnings.some((w) => w.includes('unknown productionGate.reasonCode'))).toBe(
			true
		);
	});

	it('resolves prerequisites from catalog or manifest', () => {
		const assetIds = new Set(['asset:catalog']);
		const manifestIds = new Set(['asset:planned']);
		expect(
			evaluatePrerequisiteAssets(['asset:catalog', 'asset:planned'], { assetIds, manifestIds })
				.errors
		).toEqual([]);
		expect(
			evaluatePrerequisiteAssets(['asset:missing'], { assetIds, manifestIds }).errors
		).toEqual(['unknown_prerequisite:asset:missing']);
	});

	it('flags rejected/deprecated manifest and non-current catalog as blockers', () => {
		const assetsById = new Map([
			['asset:stale', { imageStatus: { status: 'needs_regeneration' } }]
		]);
		const manifestById = new Map([
			['asset:rej', { status: 'rejected' }],
			['asset:dep', { status: 'deprecated' }]
		]);
		const result = evaluatePrerequisiteAssets(
			['asset:stale', 'asset:rej', 'asset:dep'],
			{
				assetIds: new Set(['asset:stale']),
				manifestIds: new Set(['asset:rej', 'asset:dep']),
				assetsById,
				manifestById
			}
		);
		expect(result.blockers).toEqual(
			expect.arrayContaining([
				'prerequisite_asset_not_current:asset:stale',
				'prerequisite_manifest_rejected:asset:rej',
				'prerequisite_manifest_deprecated:asset:dep'
			])
		);
	});

	it('resolves shot/stretch take ids without first-take fallback', () => {
		expect(resolveShotSourceTakeIds({})).toEqual({ takeIds: [], missingSelectedTake: true });
		expect(resolveShotSourceTakeIds({ selectedTakeId: 'take:a' })).toEqual({
			takeIds: ['take:a'],
			missingSelectedTake: false
		});
		expect(
			resolveStretchMemberSourceTakeIds(
				{ takeScope: 'explicit', takeIds: ['take:1', 'take:2'], shotId: 'shot:x' },
				{ selectedTakeId: 'take:ignored' }
			)
		).toEqual({ takeIds: ['take:1', 'take:2'], missingSelectedTake: false });
	});

	it('derives generationGate and clears when holds are removed', () => {
		const take = {
			id: 'take:deferred',
			productionGate: {
				status: 'deferred',
				reasonCode: 'awaiting_reference_asset',
				reason: { en: 'Wait.' },
				prerequisiteAssetIds: ['asset:ref']
			}
		};
		const assetsById = new Map([['asset:ref', {}]]);
		const withGate = deriveGenerationGateFromTakes([take], { assetsById });
		expect(withGate.generationGate?.status).toBe('deferred');
		expect(withGate.generationGate?.takeIds).toEqual(['take:deferred']);
		expect(withGate.blockers).toContain('generation_deferred');
		const cleared = deriveGenerationGateFromTakes([{ id: 'take:deferred' }], { assetsById });
		expect(cleared.generationGate).toBeNull();
		expect(cleared.blockers).toEqual([]);
	});

	it('blocks stretch still and video jobs with multi-take ids; leaves unrelated shots eligible', () => {
		const deferredTake = {
			id: 'take:a',
			shotId: 'shot:a',
			productionGate: {
				status: 'deferred',
				reasonCode: 'awaiting_reference_asset',
				reason: { en: 'Need ref.' },
				prerequisiteAssetIds: ['asset:ref']
			}
		};
		const eligibleTake = { id: 'take:b', shotId: 'shot:b' };
		const file = {
			script: { id: 'script:test' },
			shots: [
				{
					id: 'shot:a',
					selectedTakeId: 'take:a',
					durationMs: 2000,
					cuePlacements: []
				},
				{
					id: 'shot:b',
					selectedTakeId: 'take:b',
					durationMs: 2000,
					cuePlacements: []
				},
				{
					id: 'shot:c',
					selectedTakeId: 'take:c',
					durationMs: 2000,
					cuePlacements: []
				}
			],
			takes: [deferredTake, eligibleTake, { id: 'take:c', shotId: 'shot:c' }],
			cues: [],
			visualStretches: [
				{
					id: 'stretch:test',
					revision: 1,
					status: 'draft',
					members: [
						{ order: 1, shotId: 'shot:a', takeScope: 'explicit', takeIds: ['take:a'] },
						{ order: 2, shotId: 'shot:b', takeScope: 'selected' }
					],
					generationProfile: {
						stillMode: 'combined_storyboard_sheet',
						videoMode: 'grouped_seedance'
					},
					referenceAssetIds: [],
					sharedDescription: { en: 'shared' },
					positions: [],
					physics: { en: '1g' },
					lighting: { en: 'soft' }
				}
			]
		};
		const assetsById = new Map([['asset:ref', {}]]);
		const jobs = buildVisualStretchJobs(file, {
			maxSegmentMs: 30000,
			stillProvider: stillProviderFixture,
			videoProvider: videoProviderFixture,
			assetsById
		});
		const still = jobs.find((j) => j.medium === 'still');
		const video = jobs.find((j) => j.medium === 'video');
		expect(still?.generationGate?.takeIds).toContain('take:a');
		expect(still?.blockers.some((b) => b.includes('generation_deferred'))).toBe(true);
		expect(still?.blockers.some((b) => b.includes('take:a'))).toBe(true);
		expect(video?.blockers.some((b) => b.includes('generation_deferred'))).toBe(true);
		expect(video?.runnable).toBe(false);

		const unrelated = deriveGenerationGateFromTakes([{ id: 'take:c', shotId: 'shot:c' }]);
		expect(unrelated.generationGate).toBeNull();

		const gate = collectStretchProductionGate(
			file.visualStretches[0].members,
			new Map(file.shots.map((s) => [s.id, s])),
			new Map(file.takes.map((t) => [t.id, t])),
			{ assetsById }
		);
		expect(gate.generationGate?.takeIds).toEqual(expect.arrayContaining(['take:a']));
	});

	it('does not alter imageStatus when deriving gates', () => {
		const take = {
			id: 'take:x',
			imageStatus: { status: 'current', reasons: [] },
			productionGate: {
				status: 'blocked',
				reasonCode: 'author_hold',
				reason: { en: 'Hold.' }
			}
		};
		deriveGenerationGateFromTakes([take]);
		expect(take.imageStatus.status).toBe('current');
	});

	it('excludes deferred/blocked from regen briefs and lists them in image-debt', () => {
		const script = {
			script: { id: 'script:gate-test' },
			scenes: [{ id: 'scene:1', number: 1, order: 1 }],
			beats: [],
			shots: [
				{
					id: 'shot:1',
					sceneId: 'scene:1',
					number: 1,
					selectedTakeId: 'take:hold',
					cuePlacements: [],
					description: { en: 'A detailed enough shot description for completeness.' },
					purpose: { en: 'purpose' },
					composition: { framing: { en: 'wide' } },
					camera: { movement: 'static' },
					locationId: 'location:x'
				}
			],
			takes: [
				{
					id: 'take:hold',
					shotId: 'shot:1',
					imageStatus: {
						status: 'needs_regeneration',
						reasons: ['canon_mismatch']
					},
					productionGate: {
						status: 'deferred',
						reasonCode: 'awaiting_reference_asset',
						reason: { en: 'Wait for ref.' },
						prerequisiteAssetIds: ['asset:ref']
					}
				},
				{
					id: 'take:regen',
					shotId: 'shot:1',
					imageStatus: {
						status: 'needs_regeneration',
						reasons: ['canon_mismatch']
					}
				}
			],
			cues: []
		};
		const ctx = createScriptContext(script as any);
		const projectCtx = createProjectContext();
		(projectCtx as any).assetsById = new Map([['asset:ref', {}]]);
		const debt = buildImageDebtReport(script as any, ctx, projectCtx);
		expect(debt.productionGateHolds).toHaveLength(1);
		expect(debt.queue).toHaveLength(2);
		const regen = buildRegenBriefsReport(script as any, ctx, projectCtx);
		expect(regen.briefs.map((b) => b.takeId)).toEqual(['take:regen']);
		expect(regen.deferredOrBlocked.map((b) => b.takeId)).toEqual(['take:hold']);
	});

	it('empty-repo rebuild of five plans is no-diff when no takes are gated', () => {
		const slugs = [
			'light-delay-main-short',
			'light-delay-festival',
			'light-delay-trailer',
			'light-delay-long',
			'light-delay-festival-master'
		];
		for (const slug of slugs) {
			const planPath = join(ROOT, 'data', 'production', 'plans', `${slug}.json`);
			const plan = JSON.parse(readFileSync(planPath, 'utf8'));
			for (const shot of plan.shots ?? []) {
				expect(shot.generationGate).toBeUndefined();
			}
			for (const job of plan.visualStretchJobs ?? []) {
				expect(job.generationGate).toBeUndefined();
			}
		}
	});
});
