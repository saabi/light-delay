import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { checkReferenceBudget } from '../../../scripts/lib/generation-planning.mjs';
import { computeStretchDigest } from '../../../scripts/lib/visual-stretch-digest.mjs';
import {
	collectStillStretchReferences,
	collectVideoStretchReferences,
	partitionStretchVideoJobs,
	referenceBudgetBlockers
} from '../../../scripts/lib/visual-stretch-jobs.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const gptImageLimits = {
	maxImages: 8,
	maxVideos: 0,
	maxAudios: 0,
	maxTotalReferences: 8
};

describe('visual stretch reference budgets', () => {
	it('accepts 8 still references and blocks 9', () => {
		const eight = Array.from({ length: 8 }, (_, i) => ({
			kind: 'image',
			id: `asset:ref-${i}`
		}));
		const nine = [...eight, { kind: 'image', id: 'asset:ref-8' }];
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
		const refs = collectVideoStretchReferences({
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
});

describe('visual stretch Seedance partition', () => {
	const stretch = { id: 'stretch:x', revision: 1, referenceAssetIds: [] };
	const seedanceCeilingMs = 30000;

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
			seedanceCeilingMs,
			'still:1'
		);
		expect(jobs).toHaveLength(1);
		expect(jobs[0].durationMs).toBe(29000);
		expect(jobs[0].durationMs).toBeLessThanOrEqual(seedanceCeilingMs);
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
			seedanceCeilingMs,
			'still:1'
		);
		expect(jobs).toHaveLength(2);
		expect(jobs.every((job) => job.durationMs <= seedanceCeilingMs)).toBe(true);
	});

	it('blocks a single 45s member instead of emitting an oversized clean job', () => {
		const members = [{ shotId: 'a', order: 1 }];
		const shotsById = new Map([['a', { id: 'a', durationMs: 45000 }]]);
		const jobs = partitionStretchVideoJobs(
			stretch,
			members,
			shotsById,
			seedanceCeilingMs,
			'still:1'
		);
		expect(jobs).toHaveLength(1);
		expect(jobs[0].durationMs).toBe(45000);
		expect(jobs[0].blockers).toContain('member_exceeds_max_duration');
	});
});

describe('visual stretch digest agreement', () => {
	it('agrees between computeStretchDigest callers for the festival pilot', () => {
		const script = JSON.parse(
			readFileSync(join(ROOT, 'data/scripts/light-delay-festival-master.json'), 'utf8')
		);
		const stretch = (script.visualStretches || []).find((s) =>
			String(s.id).includes('bridge-meal-010-012')
		);
		expect(stretch).toBeTruthy();
		const a = computeStretchDigest(stretch, script);
		const b = computeStretchDigest(stretch, script);
		expect(a).toBe(b);
		expect(a).toMatch(/^[a-f0-9]{64}$/);
	});
});
