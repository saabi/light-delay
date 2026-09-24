// @ts-nocheck
import { repositoryRoot } from '$legacy-project';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	adjacencyRejection,
	compareShotsByTimeline,
	findVisualStretchCandidates,
	formatVisualStretchCandidate
} from './visualStretchCandidates';
import { findAdjacentUnstretchedPairs } from './visualStretch';

const ROOT = join(repositoryRoot);

function loadFestival() {
	return JSON.parse(
		readFileSync(join(ROOT, 'data/scripts/light-delay-festival-master.json'), 'utf8')
	);
}

function loadLocations() {
	const data = JSON.parse(readFileSync(join(ROOT, 'data/locations.json'), 'utf8'));
	return new Map((data.locations || []).map((loc: { id: string }) => [loc.id, loc]));
}

describe('visual stretch candidates', () => {
	it('reports Festival 001–003, 006–009, 010–012 without mutating JSON', () => {
		const script = loadFestival();
		const before = JSON.stringify(script.visualStretches);
		const locationsById = loadLocations();
		const { candidates } = findVisualStretchCandidates(script, { locationsById });
		expect(JSON.stringify(script.visualStretches)).toBe(before);

		const labels = candidates.map((c) => c.shotLabels.join(','));
		expect(labels.some((l) => l.startsWith('001,002,003'))).toBe(true);
		expect(labels.some((l) => l.includes('006') && l.includes('009'))).toBe(true);
		expect(labels.some((l) => l.includes('010') && l.includes('012'))).toBe(true);

		const meal = candidates.find((c) => c.shotLabels.includes('010'));
		expect(meal?.status).toBe('already_authored');
		expect(meal?.notAutoCreatedReason).toMatch(/editorial approval/i);
		expect(formatVisualStretchCandidate(meal!)).toContain('not_auto_created:');
	});

	it('does not treat two scenes with shot.order 1 as adjacent', () => {
		const scenesById = new Map([
			['scene:a', { id: 'scene:a', order: 1, sequenceId: 'seq:1', setting: { interiorExterior: 'INT' } }],
			['scene:b', { id: 'scene:b', order: 2, sequenceId: 'seq:2', setting: { interiorExterior: 'INT' } }]
		]);
		const a = { id: 'shot:a', sceneId: 'scene:a', order: 1, locationId: 'location:x' };
		const b = { id: 'shot:b', sceneId: 'scene:b', order: 1, locationId: 'location:x' };
		expect(compareShotsByTimeline(a, b, scenesById)).toBeLessThan(0);
		const locationsById = new Map([
			['location:x', { id: 'location:x' }]
		]);
		const rejection = adjacencyRejection(a, b, scenesById, locationsById);
		expect(rejection).toBe('sequence_mismatch');
	});

	it('matches parent/sublocation ancestry', () => {
		const locationsById = loadLocations();
		const scenesById = new Map([
			[
				'scene:1',
				{
					id: 'scene:1',
					order: 1,
					sequenceId: 'seq:1',
					setting: { interiorExterior: 'INT' }
				}
			]
		]);
		const a = {
			id: 'shot:1',
			sceneId: 'scene:1',
			order: 1,
			locationId: 'location:celestial-ardor-bridge',
			visibleRefs: [{ kind: 'character', id: 'character:zao' }]
		};
		const b = {
			id: 'shot:2',
			sceneId: 'scene:1',
			order: 2,
			locationId: 'location:celestial-ardor-bridge-meal-table',
			visibleRefs: [{ kind: 'character', id: 'character:zao' }]
		};
		expect(adjacencyRejection(a, b, scenesById, locationsById)).toBeNull();
	});

	it('rejects location mismatch, no cast overlap, environment unknown/mismatch, continuity break', () => {
		const locationsById = new Map([
			['location:a', { id: 'location:a' }],
			['location:b', { id: 'location:b' }]
		]);
		const scene = {
			id: 'scene:1',
			order: 1,
			sequenceId: 'seq:1',
			setting: { interiorExterior: 'INT' }
		};
		const scenesById = new Map([['scene:1', scene]]);
		expect(
			adjacencyRejection(
				{
					id: 's1',
					sceneId: 'scene:1',
					order: 1,
					locationId: 'location:a',
					visibleRefs: [{ kind: 'character', id: 'character:zao' }]
				},
				{
					id: 's2',
					sceneId: 'scene:1',
					order: 2,
					locationId: 'location:b',
					visibleRefs: [{ kind: 'character', id: 'character:zao' }]
				},
				scenesById,
				locationsById
			)
		).toBe('location_mismatch');

		expect(
			adjacencyRejection(
				{
					id: 's1',
					sceneId: 'scene:1',
					order: 1,
					locationId: 'location:a',
					visibleRefs: [{ kind: 'character', id: 'character:zao' }]
				},
				{
					id: 's2',
					sceneId: 'scene:2',
					order: 1,
					locationId: 'location:a',
					visibleRefs: [{ kind: 'character', id: 'character:voss' }]
				},
				new Map([
					[
						'scene:1',
						{ id: 'scene:1', order: 1, sequenceId: 'seq:1', setting: { interiorExterior: 'INT' } }
					],
					[
						'scene:2',
						{ id: 'scene:2', order: 2, sequenceId: 'seq:1', setting: { interiorExterior: 'INT' } }
					]
				]),
				locationsById
			)
		).toBe('no_cast_overlap');

		const unknownScene = {
			id: 'scene:u',
			order: 1,
			sequenceId: 'seq:1',
			setting: {}
		};
		expect(
			adjacencyRejection(
				{
					id: 's1',
					sceneId: 'scene:u',
					order: 1,
					locationId: 'location:a',
					visibleRefs: [{ kind: 'character', id: 'character:zao' }]
				},
				{
					id: 's2',
					sceneId: 'scene:u',
					order: 2,
					locationId: 'location:a',
					visibleRefs: [{ kind: 'character', id: 'character:zao' }]
				},
				new Map([['scene:u', unknownScene]]),
				locationsById
			)
		).toBe('environment_unknown');

		expect(
			adjacencyRejection(
				{
					id: 's1',
					sceneId: 'scene:1',
					order: 1,
					locationId: 'location:a',
					visibleRefs: [{ kind: 'character', id: 'character:zao' }],
					transitionOut: { transition: 'fade_out' }
				},
				{
					id: 's2',
					sceneId: 'scene:1',
					order: 2,
					locationId: 'location:a',
					visibleRefs: [{ kind: 'character', id: 'character:zao' }]
				},
				scenesById,
				locationsById
			)
		).toBe('continuity_break');
	});

	it('excludes off-screen characters from cast overlap across scenes', () => {
		const locationsById = new Map([['location:a', { id: 'location:a' }]]);
		// Both on-screen lists empty of shared cast after off-screen exclusion on A.
		expect(
			adjacencyRejection(
				{
					id: 's1',
					sceneId: 'scene:1',
					order: 1,
					locationId: 'location:a',
					visibleRefs: [{ kind: 'character', id: 'character:zao' }],
					offScreenCharacterIds: ['character:zao']
				},
				{
					id: 's2',
					sceneId: 'scene:2',
					order: 1,
					locationId: 'location:a',
					visibleRefs: [{ kind: 'character', id: 'character:voss' }]
				},
				new Map([
					[
						'scene:1',
						{ id: 'scene:1', order: 1, sequenceId: 'seq:1', setting: { interiorExterior: 'INT' } }
					],
					[
						'scene:2',
						{ id: 'scene:2', order: 2, sequenceId: 'seq:1', setting: { interiorExterior: 'INT' } }
					]
				]),
				locationsById
			)
		).toBe('no_cast_overlap');
	});

	it('findAdjacentUnstretchedPairs uses composite timeline not raw order alone', () => {
		const script = {
			scenes: [
				{ id: 'scene:a', order: 1 },
				{ id: 'scene:b', order: 2 }
			],
			shots: [
				{ id: 'shot:b1', sceneId: 'scene:b', order: 1, locationId: 'location:x' },
				{ id: 'shot:a1', sceneId: 'scene:a', order: 1, locationId: 'location:x' },
				{ id: 'shot:a2', sceneId: 'scene:a', order: 2, locationId: 'location:x' }
			],
			visualStretches: []
		};
		const pairs = findAdjacentUnstretchedPairs(script, {
			locationsById: new Map([['location:x', { id: 'location:x' }]])
		});
		expect(pairs.some((p) => p.shotA === 'shot:a1' && p.shotB === 'shot:a2')).toBe(true);
		expect(pairs.some((p) => p.shotA === 'shot:b1' && p.shotB === 'shot:a1')).toBe(false);
	});
});
