import { describe, expect, it } from 'vitest';
import {
	collectShotVisibleEntityIds,
	evaluateReferenceBudget,
	evaluateVideoStretchReferenceBudget,
	excessSlotsFromViolations,
	indexEntityReferenceAssets,
	resolveReferenceCoverage
} from './referenceBudget';

function asset(id: string, opts: { path?: string; status?: string; entityIds?: string[] } = {}) {
	return {
		id,
		path: opts.path ?? `/assets/${id}.png`,
		imageStatus: opts.status ? { status: opts.status } : { status: 'current' },
		...(opts.entityIds ? { metadata: { entityIds: opts.entityIds } } : {})
	};
}

describe('reference budget', () => {
	it('exact-limit success with no remediation', () => {
		const assets = new Map([
			['asset:loc', asset('asset:loc')],
			['asset:a', asset('asset:a')],
			['asset:b', asset('asset:b')]
		]);
		const { entityReferenceIds, packEntitiesByAssetId, packAssetIdsByEntity } =
			indexEntityReferenceAssets({
				catalogs: [
					{ id: 'location:bridge', referenceAssetIds: ['asset:loc'] },
					{ id: 'character:a', referenceAssetIds: ['asset:a'] },
					{ id: 'character:b', referenceAssetIds: ['asset:b'] }
				],
				assets
			});
		const attached = ['asset:loc', 'asset:a', 'asset:b'];
		const result = evaluateReferenceBudget({
			references: attached.map((id) => ({ kind: 'image' as const, id })),
			limits: { maxImages: 3 },
			requiredEntityIds: ['location:bridge', 'character:a', 'character:b'],
			entityReferenceIds,
			packEntitiesByAssetId,
			packAssetIdsByEntity,
			assetsById: assets
		});
		expect(result.referenceBudget.violations).toEqual([]);
		expect(result.referenceBudget.uncoveredEntityIds).toEqual([]);
		expect(result.remediation).toEqual([]);
		expect(result.attachedAssetIds).toEqual(attached);
	});

	it('one-over-limit emits consolidation only and never trims', () => {
		const assets = new Map(
			[1, 2, 3, 4].map((n) => [`asset:${n}`, asset(`asset:${n}`)] as const)
		);
		const catalogs = [1, 2, 3, 4].map((n) => ({
			id: `character:c${n}`,
			referenceAssetIds: [`asset:${n}`]
		}));
		const { entityReferenceIds, packEntitiesByAssetId, packAssetIdsByEntity } =
			indexEntityReferenceAssets({ catalogs, assets });
		const attached = ['asset:1', 'asset:2', 'asset:3', 'asset:4'];
		const before = [...attached];
		const result = evaluateReferenceBudget({
			references: attached.map((id) => ({ kind: 'image' as const, id })),
			limits: { maxImages: 3 },
			requiredEntityIds: catalogs.map((c) => c.id),
			entityReferenceIds,
			packEntitiesByAssetId,
			packAssetIdsByEntity,
			assetsById: assets
		});
		expect(result.attachedAssetIds).toEqual(before);
		expect(result.referenceBudget.violations).toEqual(['images:4>3']);
		expect(result.referenceBudget.uncoveredEntityIds).toEqual([]);
		expect(result.remediation).toHaveLength(1);
		expect(result.remediation[0]?.code).toBe('reference_consolidation_required');
		if (result.remediation[0]?.code === 'reference_consolidation_required') {
			expect(result.remediation[0].excessSlots).toBe(1);
			expect(result.remediation[0].consolidateCandidateAssetIds).toHaveLength(1);
			expect(result.remediation[0].consolidateCandidateAssetIds[0]).toBe(
				result.referenceBudget.wouldOmitEntityIds.length
					? result.referenceBudget.coveringAssetByEntity[
							result.referenceBudget.wouldOmitEntityIds[0]!
						]
					: result.remediation[0].consolidateCandidateAssetIds[0]
			);
		}
		expect(result.blockers.some((b) => b.startsWith('reference_pack_required'))).toBe(false);
	});

	it('uncovered under cap emits pack remediation only', () => {
		const pack = asset('asset:pack-ab', {
			entityIds: ['character:a', 'character:b']
		});
		const assets = new Map([
			['asset:loc', asset('asset:loc')],
			['asset:pack-ab', pack]
		]);
		const { entityReferenceIds, packEntitiesByAssetId, packAssetIdsByEntity } =
			indexEntityReferenceAssets({
				catalogs: [
					{ id: 'location:bridge', referenceAssetIds: ['asset:loc'] },
					{ id: 'character:a', referenceAssetIds: ['asset:a-solo'] },
					{ id: 'character:b', referenceAssetIds: ['asset:b-solo'] }
				],
				assets
			});
		const result = evaluateReferenceBudget({
			references: [{ kind: 'image', id: 'asset:loc' }],
			limits: { maxImages: 8 },
			requiredEntityIds: ['location:bridge', 'character:a', 'character:b'],
			entityReferenceIds,
			packEntitiesByAssetId,
			packAssetIdsByEntity,
			assetsById: assets
		});
		expect(result.referenceBudget.violations).toEqual([]);
		expect(result.referenceBudget.uncoveredEntityIds).toEqual(['character:a', 'character:b']);
		expect(result.remediation[0]?.code).toBe('reference_pack_required');
		if (result.remediation[0]?.code === 'reference_pack_required') {
			expect(result.remediation[0].compatiblePackAssetIds).toEqual(['asset:pack-ab']);
			expect(result.remediation[0].packsNeeded).toBe(1);
		}
		expect(result.blockers.some((b) => b.startsWith('reference_consolidation'))).toBe(false);
	});

	it('orphan pack without entityIds does not clear uncovered', () => {
		const assets = new Map([
			['asset:orphan', asset('asset:orphan', { entityIds: [] })]
		]);
		// empty entityIds → index skips
		const { entityReferenceIds } = indexEntityReferenceAssets({
			catalogs: [{ id: 'character:a', referenceAssetIds: ['asset:solo'] }],
			assets
		});
		const coverage = resolveReferenceCoverage({
			requiredEntityIds: ['character:a'],
			attachedAssetIds: ['asset:orphan'],
			entityReferenceIds,
			assetsById: assets
		});
		expect(coverage.uncoveredEntityIds).toEqual(['character:a']);
	});

	it('meal stretch: location + six chars via three pair packs within 5 images', () => {
		const packs = [
			['asset:pair-vh', ['character:voss', 'character:harlan']],
			['asset:pair-zr', ['character:zao', 'character:rao']],
			['asset:pair-so', ['character:sorell', 'character:okoye']]
		] as const;
		const assets = new Map<string, ReturnType<typeof asset>>([
			['asset:meal-loc', asset('asset:meal-loc')],
			['asset:ardor', asset('asset:ardor')],
			...packs.map(([id, entityIds]) => [id, asset(id, { entityIds: [...entityIds] })] as const)
		]);
		const chars = [
			'character:voss',
			'character:harlan',
			'character:zao',
			'character:rao',
			'character:sorell',
			'character:okoye'
		];
		const { entityReferenceIds, packEntitiesByAssetId, packAssetIdsByEntity } =
			indexEntityReferenceAssets({
				catalogs: [
					{
						id: 'location:celestial-ardor-bridge-meal-table',
						referenceAssetIds: ['asset:meal-loc']
					},
					{ id: 'vehicle:celestial-ardor', referenceAssetIds: ['asset:ardor'] },
					...chars.map((id) => ({ id, referenceAssetIds: [`asset:solo-${id}`] }))
				],
				assets
			});
		const attached = [
			'asset:pair-vh',
			'asset:pair-zr',
			'asset:pair-so',
			'asset:meal-loc',
			'asset:ardor'
		];
		const result = evaluateReferenceBudget({
			references: attached.map((id) => ({ kind: 'image' as const, id })),
			limits: { maxImages: 5 },
			requiredEntityIds: [
				'location:celestial-ardor-bridge-meal-table',
				'vehicle:celestial-ardor',
				...chars
			],
			entityReferenceIds,
			packEntitiesByAssetId,
			packAssetIdsByEntity,
			assetsById: assets
		});
		expect(result.referenceBudget.violations).toEqual([]);
		expect(result.referenceBudget.uncoveredEntityIds).toEqual([]);
		expect(result.attachedAssetIds).toHaveLength(5);
		expect(result.remediation).toEqual([]);
	});

	it('maxImages null uses total excess; no bogus images excess', () => {
		const excess = excessSlotsFromViolations(
			['total:51>50'],
			{ maxImages: null, maxTotalReferences: 50 },
			{ image: 40, video: 0, audio: 11, total: 51 }
		);
		expect(excess).toBe(1);
		const bogus = excessSlotsFromViolations(
			[],
			{ maxImages: null, maxTotalReferences: 50 },
			{ image: 40, video: 0, audio: 0, total: 40 }
		);
		expect(bogus).toBe(0);
	});

	it('stale asset does not cover', () => {
		const assets = new Map([
			['asset:stale', asset('asset:stale', { status: 'needs_regeneration' })]
		]);
		const { entityReferenceIds } = indexEntityReferenceAssets({
			catalogs: [{ id: 'character:a', referenceAssetIds: ['asset:stale'] }],
			assets
		});
		const coverage = resolveReferenceCoverage({
			requiredEntityIds: ['character:a'],
			attachedAssetIds: ['asset:stale'],
			entityReferenceIds,
			assetsById: assets
		});
		expect(coverage.uncoveredEntityIds).toEqual(['character:a']);
	});

	it('secondary location without visibleRefs is not required', () => {
		const ids = collectShotVisibleEntityIds({
			locationId: 'location:primary',
			secondaryLocationIds: ['location:secondary'],
			visibleRefs: [{ kind: 'character', id: 'character:a' }]
		});
		expect(ids).toEqual(['character:a', 'location:primary']);
		expect(ids).not.toContain('location:secondary');
	});

	it('pack covers only declared entityIds', () => {
		const assets = new Map([
			['asset:pack', asset('asset:pack', { entityIds: ['character:a'] })]
		]);
		const { entityReferenceIds } = indexEntityReferenceAssets({
			catalogs: [],
			assets
		});
		const coverage = resolveReferenceCoverage({
			requiredEntityIds: ['character:a', 'character:b'],
			attachedAssetIds: ['asset:pack'],
			entityReferenceIds,
			assetsById: assets
		});
		expect(coverage.coveredEntityIds).toEqual(['character:a']);
		expect(coverage.uncoveredEntityIds).toEqual(['character:b']);
	});

	it('packsNeeded null when no compatible packs', () => {
		const assets = new Map([['asset:loc', asset('asset:loc')]]);
		const { entityReferenceIds, packEntitiesByAssetId, packAssetIdsByEntity } =
			indexEntityReferenceAssets({
				catalogs: [
					{ id: 'location:x', referenceAssetIds: ['asset:loc'] },
					{ id: 'character:a', referenceAssetIds: ['asset:solo'] }
				],
				assets
			});
		const result = evaluateReferenceBudget({
			references: [{ kind: 'image', id: 'asset:loc' }],
			limits: { maxImages: 8 },
			requiredEntityIds: ['location:x', 'character:a'],
			entityReferenceIds,
			packEntitiesByAssetId,
			packAssetIdsByEntity,
			assetsById: assets
		});
		expect(result.remediation[0]?.code).toBe('reference_pack_required');
		if (result.remediation[0]?.code === 'reference_pack_required') {
			expect(result.remediation[0].packsNeeded).toBeNull();
			expect(result.remediation[0].compatiblePackAssetIds).toEqual([]);
		}
		expect(result.blockers).toContain('reference_pack_required:authoring_required');
	});

	it('fallback video budget does not emit pack blockers for keyframe-covered entities', () => {
		const result = evaluateVideoStretchReferenceBudget({
			references: [
				{ kind: 'image', id: 'asset:kf-a', role: 'keyframe' },
				{ kind: 'image', id: 'asset:kf-b', role: 'keyframe' }
			],
			limits: { maxImages: 8, maxAudios: 8, maxTotalReferences: 50 },
			requiredEntityIds: ['character:a', 'character:b', 'location:bridge'],
			keyframeCoveredEntityIds: ['character:a', 'character:b', 'location:bridge'],
			keyframeCoveringAssetByEntity: {
				'character:a': 'asset:kf-a',
				'location:bridge': 'asset:kf-a',
				'character:b': 'asset:kf-b'
			},
			effectiveVideoReferenceAssetIds: [],
			videoReferencePolicy: 'fallback',
			entityReferenceIds: new Map([
				['character:a', ['asset:sheet-a']],
				['character:b', ['asset:sheet-b']],
				['location:bridge', ['asset:loc']]
			]),
			packEntitiesByAssetId: new Map(),
			packAssetIdsByEntity: new Map()
		});
		expect(result.referenceBudget.keyframeCoveredEntityIds).toEqual([
			'character:a',
			'character:b',
			'location:bridge'
		]);
		expect(result.referenceBudget.uncoveredVideoEntityIds).toEqual([]);
		expect(result.referenceBudget.uncoveredEntityIds).toEqual([]);
		expect(result.blockers.some((b) => b.startsWith('reference_pack_required'))).toBe(false);
		expect(result.remediation).toEqual([]);
	});

	it('explicit video budget remediates only entities beyond keyframes', () => {
		const result = evaluateVideoStretchReferenceBudget({
			references: [{ kind: 'image', id: 'asset:kf-a', role: 'keyframe' }],
			limits: { maxImages: 8 },
			requiredEntityIds: ['character:a', 'character:b', 'location:bridge'],
			keyframeCoveredEntityIds: ['character:a', 'location:bridge'],
			keyframeCoveringAssetByEntity: {
				'character:a': 'asset:kf-a',
				'location:bridge': 'asset:kf-a'
			},
			effectiveVideoReferenceAssetIds: [],
			videoReferencePolicy: 'explicit',
			entityReferenceIds: new Map([
				['character:a', ['asset:sheet-a']],
				['character:b', ['asset:sheet-b']],
				['location:bridge', ['asset:loc']]
			]),
			packEntitiesByAssetId: new Map([['asset:pack-ab', ['character:a', 'character:b']]]),
			packAssetIdsByEntity: new Map([
				['character:a', ['asset:pack-ab']],
				['character:b', ['asset:pack-ab']]
			]),
			assetsById: new Map([
				[
					'asset:pack-ab',
					{
						id: 'asset:pack-ab',
						path: '/assets/pack-ab.png',
						imageStatus: { status: 'current' },
						metadata: { entityIds: ['character:a', 'character:b'] }
					}
				]
			])
		});
		expect(result.referenceBudget.keyframeCoveredEntityIds).toEqual([
			'character:a',
			'location:bridge'
		]);
		expect(result.referenceBudget.uncoveredVideoEntityIds).toEqual(['character:b']);
		expect(result.remediation[0]?.code).toBe('reference_pack_required');
		if (result.remediation[0]?.code === 'reference_pack_required') {
			expect(result.remediation[0].uncoveredEntityIds).toEqual(['character:b']);
			expect(result.remediation[0].packsNeeded).toBe(1);
		}
	});
});
