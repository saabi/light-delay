import { describe, expect, it } from 'vitest';
import { ids, lightDelayBridgeFixture } from './light-delay-fixture.js';
import { InMemoryRevisionHistory } from './history.js';

const principal = { kind: 'human' as const, id: 'user:ushi' };

function createHistory() {
	return new InMemoryRevisionHistory(lightDelayBridgeFixture, {
		trustedPrincipal: principal,
		stateKeys: ['gravity', 'door:service-hatch-bridge', 'newKey'],
		projectId: 'project:light-delay',
		initialTimestamp: '2026-09-21T00:00:00.000Z',
		now: () => '2026-09-21T00:01:00.000Z',
		idFactory: (() => {
			let counter = 0;
			return () => `changeset:test-${++counter}`;
		})()
	});
}

describe('immutable ChangeSet and revision history', () => {
	it('creates ordered revisions with principal attribution and deterministic projection', () => {
		const history = createHistory();
		const result = history.commit({
			baseRevision: 1,
			intent: 'Enable microgravity for the bridge test',
			operations: [{ type: 'SetWorldState', key: 'gravity', value: 'microgravity' }]
		});

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.revision.number).toBe(2);
		expect(result.changeSet.resultingRevision).toBe(2);
		expect(result.changeSet.principal).toEqual(principal);
		expect(history.history.map((revision) => revision.number)).toEqual([1, 2]);
		expect(history.current.state.state.gravity).toBe('microgravity');
		expect(history.getRevision(1)?.state.state.gravity).toBe('1g');
		expect(Object.isFrozen(history.getRevision(1))).toBe(true);
		expect(Object.isFrozen(history.current.state.state)).toBe(true);
	});

	it('rejects stale base revisions and failed preconditions without appending history', () => {
		const history = createHistory();
		const first = history.commit({
			baseRevision: 1,
			intent: 'Enable microgravity',
			operations: [{ type: 'SetWorldState', key: 'gravity', value: 'microgravity' }]
		});
		expect(first.ok).toBe(true);

		const stale = history.commit({
			baseRevision: 1,
			intent: 'Close the service hatch',
			operations: [{ type: 'SetWorldState', key: 'door:service-hatch-bridge', value: 'closed' }]
		});
		expect(stale).toMatchObject({
			ok: false,
			error: { kind: 'conflict', code: 'STALE_BASE_REVISION', actualRevision: 2 }
		});

		const failedPrecondition = history.commit({
			baseRevision: 2,
			intent: 'Close the service hatch',
			preconditions: [{ type: 'WorldStateEquals', key: 'gravity', expected: '1g' }],
			operations: [{ type: 'SetWorldState', key: 'door:service-hatch-bridge', value: 'closed' }]
		});
		expect(failedPrecondition).toMatchObject({
			ok: false,
			error: { kind: 'precondition-failed', code: 'PRECONDITION_FAILED' }
		});
		expect(history.history).toHaveLength(2);
	});

	it('applies semantic occupancy operations and preserves route behavior', () => {
		const history = createHistory();
		const result = history.commit({
			baseRevision: 1,
			intent: 'Record Harlan blocking the crew stations',
			operations: [
				{
					type: 'SetOccupancy',
					entityId: ids.harlan,
					occupancy: [
						{
							entityId: ids.harlan,
							nodeId: ids.stations,
							blocksTraversal: true,
							reason: 'Harlan blocks the passage.'
						}
					]
				}
			]
		});

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.revision.state.occupancy).toHaveLength(1);
		expect(result.revision.state.occupancy[0].entityId).toBe(ids.harlan);
	});

	it('restores a previous projection by appending a new ChangeSet', () => {
		const history = createHistory();
		const changed = history.commit({
			baseRevision: 1,
			intent: 'Enable microgravity',
			operations: [{ type: 'SetWorldState', key: 'gravity', value: 'microgravity' }]
		});
		expect(changed.ok).toBe(true);

		const restored = history.restore(1, {
			baseRevision: 2,
			intent: 'Restore bridge baseline'
		});
		expect(restored.ok).toBe(true);
		if (!restored.ok) return;
		expect(restored.revision.number).toBe(3);
		expect(restored.changeSet.restoresRevision).toBe(1);
		expect(history.getRevision(2)?.state.state.gravity).toBe('microgravity');
		expect(history.current.state.state.gravity).toBe('1g');
		expect(history.history.map((revision) => revision.number)).toEqual([1, 2, 3]);
	});
});

describe('bounded runtime acceptance', () => {
	it('restores added and removed keys and occupancy, without altering prior history', () => {
		const history = createHistory();
		const before = JSON.parse(JSON.stringify(history.current.state));
		expect(
			history.commit({
				baseRevision: 1,
				intent: 'Edit fixture',
				operations: [
					{ type: 'SetWorldState', key: 'newKey', value: false },
					{ type: 'UnsetWorldState', key: 'gravity' },
					{
						type: 'SetOccupancy',
						entityId: ids.harlan,
						occupancy: [
							{
								entityId: ids.harlan,
								nodeId: ids.stations,
								blocksTraversal: true,
								reason: 'Blocked'
							}
						]
					}
				]
			}).ok
		).toBe(true);
		expect(history.restore(1, { baseRevision: 2 }).ok).toBe(true);
		expect({ ...history.current.state, revision: 1 }).toEqual(before);
		expect(Object.hasOwn(history.current.state.state, 'newKey')).toBe(false);
		expect(history.getRevision(2)?.state.state.newKey).toBe(false);
		expect(Object.hasOwn(history.getRevision(2)!.state.state, 'gravity')).toBe(false);
		expect(history.restore(2, { baseRevision: 3 }).ok).toBe(true);
		expect({ ...history.current.state, revision: 2 }).toEqual(history.getRevision(2)?.state);
	});
	it.each([
		null,
		{},
		{ type: 'Bogus' },
		{ type: 'SetWorldState', key: 'gravity' },
		...[NaN, Infinity, undefined, null, {}, [], 1n, () => 1].map((value) => ({
			type: 'SetWorldState',
			key: 'gravity',
			value
		})),
		{ type: 'SetWorldState', key: 'unknown', value: true },
		{ type: 'SetWorldState', key: '__proto__', value: true },
		{ type: 'SetOccupancy', entityId: 'missing', occupancy: [] },
		{
			type: 'SetOccupancy',
			entityId: ids.harlan,
			occupancy: [
				{ entityId: ids.sorell, nodeId: ids.stations, blocksTraversal: true, reason: 'Mismatch' }
			]
		},
		{
			type: 'SetOccupancy',
			entityId: ids.harlan,
			occupancy: [
				{ entityId: ids.harlan, nodeId: 'nowhere', blocksTraversal: true, reason: 'Unknown' }
			]
		}
	])('rejects malformed or unresolved operation %# atomically', (operation) => {
		const history = createHistory();
		expect(
			history.commit({
				baseRevision: 1,
				intent: 'Invalid',
				operations: [{ type: 'SetWorldState', key: 'gravity', value: 'microgravity' }, operation]
			})
		).toMatchObject({ ok: false, error: { kind: 'validation' } });
		expect(history.history).toHaveLength(1);
	});
	it.each([
		null,
		{},
		{ baseRevision: -1 },
		{ baseRevision: 1.5 },
		{ principal: { kind: 'system', id: 'forged' } },
		{ timestamp: '1970-01-01' },
		{ preconditions: [{ type: 'Bogus' }] },
		{ preconditions: [{ type: 'OccupancyEquals', entityId: 'unknown', expected: [] }] }
	])('rejects malformed command or forged attribution %#', (override) => {
		const history = createHistory();
		const command = {
			baseRevision: 1,
			intent: 'Test',
			operations: [{ type: 'SetWorldState', key: 'gravity', value: 'microgravity' }]
		};
		const result = history.commit(
			override === null || Object.keys(override).length === 0
				? override
				: { ...command, ...override }
		);
		expect(result).toMatchObject({ ok: false, error: { kind: 'validation' } });
		expect(history.history).toHaveLength(1);
	});
	it('keeps runtime attribution and can reconstruct from JSON-roundtripped operations', () => {
		const history = createHistory();
		expect(
			history.commit({
				baseRevision: 1,
				intent: 'Add',
				preconditions: [{ type: 'WorldStateAbsent', key: 'newKey' }],
				operations: [{ type: 'SetWorldState', key: 'newKey', value: 0 }]
			}).ok
		).toBe(true);
		expect(history.restore(1, { baseRevision: 2 }).ok).toBe(true);
		const replay = createHistory();
		for (const change of JSON.parse(JSON.stringify(history.changeSetsInOrder))) {
			expect(
				replay.commit({
					baseRevision: change.baseRevision,
					intent: change.intent,
					operations: change.operations,
					preconditions: change.preconditions
				}).ok
			).toBe(true);
			expect(replay.current.state).toEqual(history.getRevision(change.resultingRevision)?.state);
			expect(change.principal).toEqual(principal);
		}
	});
});

it('appends an attributable restore even when the selected projection is equivalent', () => {
	const history = createHistory();
	expect(history.restore(1, { baseRevision: 1 }).ok).toBe(true);
	expect(history.history).toHaveLength(2);
	expect(history.changeSetsInOrder[0]).toMatchObject({
		schemaVersion: 1,
		restoresRevision: 1,
		principal
	});
	expect(history.commit({ baseRevision: 2, intent: 'Empty command', operations: [] }).ok).toBe(
		false
	);
	expect(history.restore(1, { baseRevision: 1 })).toMatchObject({
		ok: false,
		error: { kind: 'conflict' }
	});
});

it('rejects cyclic and accessor-bearing commands without invoking user code', () => {
	const history = createHistory();
	const cyclic: Record<string, unknown> = {};
	cyclic.self = cyclic;
	expect(history.commit(cyclic)).toMatchObject({ ok: false, error: { kind: 'validation' } });
	const accessor = {
		get baseRevision() {
			throw new Error('must not execute');
		}
	};
	expect(history.commit(accessor)).toMatchObject({ ok: false, error: { kind: 'validation' } });
	expect(history.history).toHaveLength(1);
});

it('compares occupancy preconditions as semantic sets independent of JSON property order', () => {
	const history = createHistory();
	const a = { entityId: ids.harlan, nodeId: ids.stations, blocksTraversal: true, reason: 'A' };
	const b = { entityId: ids.harlan, nodeId: ids.central, blocksTraversal: false, reason: 'B' };
	expect(
		history.commit({
			baseRevision: 1,
			intent: 'Set occupancy',
			operations: [{ type: 'SetOccupancy', entityId: ids.harlan, occupancy: [a, b] }]
		}).ok
	).toBe(true);
	expect(
		history.commit({
			baseRevision: 2,
			intent: 'Clear',
			preconditions: [
				{
					type: 'OccupancyEquals',
					entityId: ids.harlan,
					expected: [
						b,
						{
							reason: a.reason,
							blocksTraversal: a.blocksTraversal,
							nodeId: a.nodeId,
							entityId: a.entityId
						}
					]
				}
			],
			operations: [{ type: 'SetOccupancy', entityId: ids.harlan, occupancy: [] }]
		}).ok
	).toBe(true);
});
