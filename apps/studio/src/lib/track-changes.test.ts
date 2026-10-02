import { describe, expect, it } from 'vitest';
import type { AuthoringOperation, ScreenplayElement } from '@light-delay/v2-core';
import { applyOperations, changesBetween, trackChanges } from './track-changes';

const scope = { documentId: 'document:test', versionId: 'version:feature' };
const el = (id: string, kind: ScreenplayElement['kind'], text: string): ScreenplayElement => ({
	id: `element:${id}`,
	kind,
	text
});
const before = [
	el('heading', 'scene-heading', 'EXT. HARBOR LIGHT — NIGHT'),
	el('action', 'action', 'Mara steadies the lamp.'),
	el('cue', 'character', 'MARA'),
	el('line', 'dialogue', 'Leave the channel open.')
];

describe('trackChanges', () => {
	it('marks a revision word by word and leaves the rest unchanged', () => {
		const after = before.map((element) =>
			element.id === 'element:line' ? { ...element, text: 'Keep the channel alive.' } : element
		);
		const ops: AuthoringOperation[] = [
			{
				type: 'UpdateScreenplayElementText',
				scope,
				elementId: 'element:line',
				text: 'Keep the channel alive.'
			}
		];
		const tracked = trackChanges(before, after, ops);
		expect(tracked.map((item) => item.state)).toEqual([
			'unchanged',
			'unchanged',
			'unchanged',
			'revised'
		]);
		expect(tracked[3].parts).toContainEqual({ op: 'delete', text: 'Leave' });
		expect(tracked[3].parts).toContainEqual({ op: 'insert', text: 'Keep' });
	});

	it('keeps removed elements in place and shows added and moved ones', () => {
		const added = el('new', 'action', 'The lamp flickers.');
		const after = [before[0], before[2], before[3], added];
		const ops: AuthoringOperation[] = [
			{ type: 'RemoveScreenplayElement', scope, elementId: 'element:action' },
			{ type: 'InsertScreenplayElement', scope, element: added, afterElementId: 'element:line' }
		];
		const tracked = trackChanges(before, after, ops);
		expect(tracked.map((item) => [item.key, item.state])).toEqual([
			['element:heading', 'unchanged'],
			['removed:element:action', 'removed'],
			['element:cue', 'unchanged'],
			['element:line', 'unchanged'],
			['element:new', 'added']
		]);
		const swapped = [before[0], before[2], before[1], before[3]];
		const move: AuthoringOperation[] = [
			{
				type: 'MoveScreenplayElement',
				scope,
				elementId: 'element:action',
				afterElementId: 'element:cue'
			}
		];
		expect(trackChanges(before, swapped, move).find((item) => item.moved)?.key).toBe(
			'element:action'
		);
	});

	it('places an element removed at the start before everything else', () => {
		const ops: AuthoringOperation[] = [
			{ type: 'RemoveScreenplayElement', scope, elementId: 'element:heading' }
		];
		expect(trackChanges(before, before.slice(1), ops)[0]).toMatchObject({
			key: 'removed:element:heading',
			state: 'removed'
		});
	});
});

describe('changesBetween', () => {
	const ids = (set: Set<string>) => [...set].sort();

	it('finds revised, added and removed elements', () => {
		const after = [
			before[0],
			{ ...before[1], text: 'Mara lowers the lamp.' },
			el('new', 'action', 'A horn answers.'),
			before[2]
		];
		const changes = changesBetween(before, after);
		expect(ids(changes.revised)).toEqual(['element:action']);
		expect(ids(changes.added)).toEqual(['element:new']);
		expect(ids(changes.removed)).toEqual(['element:line']);
		expect(ids(changes.moved)).toEqual([]);
	});

	it('marks only what moved, as core does', () => {
		const swapped = [before[0], before[2], before[1], before[3]];
		expect(ids(changesBetween(before, swapped).moved)).toEqual(['element:cue']);
		const last = [before[1], before[2], before[3], before[0]];
		expect(ids(changesBetween(before, last).moved)).toEqual([
			'element:action',
			'element:cue',
			'element:line'
		]);
	});

	it('reports nothing for the same screenplay, and drives trackChanges', () => {
		const changes = changesBetween(before, before);
		expect(
			[changes.revised, changes.added, changes.removed, changes.moved].every(
				(set) => set.size === 0
			)
		).toBe(true);
		const tracked = trackChanges(before, before.slice(1), changesBetween(before, before.slice(1)));
		expect(tracked[0]).toMatchObject({ state: 'removed', key: 'removed:element:heading' });
	});
});

describe('applyOperations', () => {
	it('produces the screenplay a proposal describes, ignoring other cuts', () => {
		const ops: AuthoringOperation[] = [
			{ type: 'RemoveScreenplayElement', scope, elementId: 'element:action' },
			{
				type: 'InsertScreenplayElement',
				scope,
				element: el('new', 'action', 'A horn answers.'),
				afterElementId: 'element:heading'
			},
			{ type: 'UpdateScreenplayElementText', scope, elementId: 'element:line', text: 'Hold on.' },
			{ type: 'MoveScreenplayElement', scope, elementId: 'element:line', afterElementId: null },
			{
				type: 'UpdateScreenplayElementText',
				scope: { ...scope, versionId: 'version:trailer' },
				elementId: 'element:cue',
				text: 'ELSEWHERE'
			}
		];
		expect(applyOperations(before, ops, scope)).toEqual([
			{ ...before[3], text: 'Hold on.' },
			before[0],
			el('new', 'action', 'A horn answers.'),
			before[2]
		]);
		expect(before[3].text).toBe('Leave the channel open.');
	});

	it('round-trips with changesBetween on the elements it marks', () => {
		const after = applyOperations(
			before,
			[
				{
					type: 'MoveScreenplayElement',
					scope,
					elementId: 'element:cue',
					afterElementId: 'element:heading'
				}
			],
			scope
		);
		expect([...changesBetween(before, after).moved]).toEqual(['element:cue']);
	});
});
