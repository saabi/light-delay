import { describe, expect, it } from 'vitest';
import { ids, lightDelayBridgeFixture } from './light-delay-fixture';
import { InMemoryRevisionHistory } from './history';

const principal = { kind: 'human' as const, id: 'user:ushi' };

function createHistory() {
 return new InMemoryRevisionHistory(lightDelayBridgeFixture, {
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
   principal,
   intent: 'Enable microgravity for the bridge test',
   changeSetId: 'changeset:gravity',
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
   principal,
   intent: 'Enable microgravity',
   operations: [{ type: 'SetWorldState', key: 'gravity', value: 'microgravity' }]
  });
  expect(first.ok).toBe(true);

  const stale = history.commit({
   baseRevision: 1,
   principal,
   intent: 'Close the service hatch',
   operations: [{ type: 'SetWorldState', key: 'door:service-hatch-bridge', value: 'closed' }]
  });
  expect(stale).toMatchObject({ ok: false, error: { kind: 'conflict', code: 'STALE_BASE_REVISION', actualRevision: 2 } });

  const failedPrecondition = history.commit({
   baseRevision: 2,
   principal,
   intent: 'Close the service hatch',
   preconditions: [{ type: 'WorldStateEquals', key: 'gravity', expected: '1g' }],
   operations: [{ type: 'SetWorldState', key: 'door:service-hatch-bridge', value: 'closed' }]
  });
  expect(failedPrecondition).toMatchObject({ ok: false, error: { kind: 'precondition-failed', code: 'PRECONDITION_FAILED' } });
  expect(history.history).toHaveLength(2);
 });

 it('applies semantic occupancy operations and preserves route behavior', () => {
  const history = createHistory();
  const result = history.commit({
   baseRevision: 1,
   principal: { kind: 'system', id: 'system:test' },
   intent: 'Record Harlan blocking the crew stations',
   operations: [{
    type: 'SetOccupancy',
    entityId: ids.harlan,
    occupancy: [{ entityId: ids.harlan, nodeId: ids.stations, blocksTraversal: true, reason: 'Harlan blocks the passage.' }]
   }]
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
   principal,
   intent: 'Enable microgravity',
   operations: [{ type: 'SetWorldState', key: 'gravity', value: 'microgravity' }]
  });
  expect(changed.ok).toBe(true);

  const restored = history.restore(1, {
   baseRevision: 2,
   principal,
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
