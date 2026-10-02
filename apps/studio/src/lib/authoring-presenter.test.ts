import { describe, expect, it } from 'vitest';
import type { ScreenplayElement } from '@light-delay/v2-core';
import type { AuthoringChangeSet, ScreenplayElement as Element } from '@light-delay/v2-core';
import { describeHistoryEntry, describeOperation, explainError } from './authoring-presenter.js';

const scope = { documentId: 'document:test', versionId: 'version:feature' };
const base: ScreenplayElement[] = [
	{ id: 'element:heading', kind: 'scene-heading', text: 'INT. LIGHTHOUSE — NIGHT' },
	{ id: 'element:action', kind: 'action', text: 'Mara opens the shutter.' },
	{ id: 'element:dialogue', kind: 'dialogue', text: 'Keep the channel open.' }
];

describe('Studio authoring presentation', () => {
	it('shows meaningful before and after copy for authored text revisions', () => {
		expect(
			describeOperation(
				{
					type: 'UpdateScreenplayElementText',
					scope,
					elementId: 'element:dialogue',
					text: 'Keep the channel alive.'
				},
				base
			)
		).toEqual({
			title: 'Revise dialogue',
			before: 'Keep the channel open.',
			after: 'Keep the channel alive.'
		});
	});

	it('describes insertion, removal, and movement in filmmaking language', () => {
		expect(
			describeOperation(
				{
					type: 'InsertScreenplayElement',
					scope,
					element: { id: 'element:new', kind: 'action', text: 'The beam sweeps the bay.' },
					afterElementId: 'element:action'
				},
				base
			)
		).toMatchObject({
			title: 'Add action',
			after: 'The beam sweeps the bay.',
			detail: 'Place after “Mara opens the shutter.”'
		});
		expect(
			describeOperation(
				{ type: 'RemoveScreenplayElement', scope, elementId: 'element:dialogue' },
				base
			)
		).toMatchObject({
			title: 'Remove dialogue from this cut',
			before: 'Keep the channel open.'
		});
		expect(
			describeOperation(
				{
					type: 'MoveScreenplayElement',
					scope,
					elementId: 'element:dialogue',
					afterElementId: null
				},
				base
			)
		).toMatchObject({ title: 'Move dialogue', detail: 'Move to the start of the screenplay' });
	});

	describe('history entries', () => {
		const now = new Date('2026-10-01T22:30:00');
		const cutLabels = { 'version:feature': 'Feature', 'version:trailer': 'Trailer' };
		const changeSet = (overrides: Partial<AuthoringChangeSet>) =>
			({
				principal: { kind: 'human', id: 'user:local-filmmaker' },
				timestamp: '2026-10-01T22:15:00',
				operations: [
					{ type: 'UpdateScreenplayElementText', scope, elementId: 'element:dialogue', text: 'x' }
				],
				provenance: { kind: 'proposal-acceptance' },
				...overrides
			}) as unknown as AuthoringChangeSet;
		const entry = (value: AuthoringChangeSet, baseElements?: readonly Element[]) =>
			describeHistoryEntry(value, {
				viewedVersionId: 'version:feature',
				cutLabels,
				baseElements,
				now
			});

		it('reads like "You · 22:15 · Revised dialogue" and never shows IDs', () => {
			expect(entry(changeSet({}), base)).toEqual({
				who: 'You',
				when: '22:15',
				summary: 'Revised dialogue'
			});
			const text = JSON.stringify(entry(changeSet({}), base));
			expect(text).not.toMatch(/element:|proposal:|revision/i);
		});

		it('carries the author’s note beside the worked-out summary', () => {
			expect(entry(changeSet({ note: { text: 'Mara keeps the lamp lit' } }), base)).toEqual({
				who: 'You',
				when: '22:15',
				summary: 'Revised dialogue',
				note: 'Mara keeps the lamp lit'
			});
		});

		it('counts further changes, names other cuts and restores', () => {
			const two = changeSet({
				operations: [
					{ type: 'UpdateScreenplayElementText', scope, elementId: 'element:dialogue', text: 'x' },
					{ type: 'RemoveScreenplayElement', scope, elementId: 'element:action' }
				] as AuthoringChangeSet['operations']
			});
			expect(entry(two, base).summary).toBe('Revised dialogue and 1 more change');
			const trailer = { ...scope, versionId: 'version:trailer' };
			expect(
				entry(
					changeSet({
						operations: [
							{ type: 'RemoveScreenplayElement', scope: trailer, elementId: 'element:action' }
						] as AuthoringChangeSet['operations']
					}),
					base
				).summary
			).toBe('Changed the Trailer cut');
			expect(
				entry(
					changeSet({
						provenance: { kind: 'scoped-restore', scope } as AuthoringChangeSet['provenance']
					})
				).summary
			).toBe('Restored an earlier version');
		});

		it('shows the date for older entries and names non-human authors', () => {
			const older = entry(
				changeSet({
					timestamp: '2026-09-28T09:05:00',
					principal: { kind: 'agent', id: 'agent:x' }
				}),
				base
			);
			expect(older.who).toBe('Assistant');
			expect(older.when).toMatch(/^28 Sept?, 09:05$/);
		});
	});
});

describe('explainError', () => {
	it('never surfaces internal vocabulary', () => {
		for (const code of ['NO_CHANGES', 'CONFLICT', 'PROPOSAL_ALREADY_RESOLVED', 'INVALID_DRAFT'])
			expect(
				explainError({ code, message: 'Draft matches the authoritative screenplay' })
			).not.toMatch(/authoritative|draft|proposal|revision/i);
	});
});
