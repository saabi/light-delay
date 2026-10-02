import { describe, expect, it } from 'vitest';
import type { AuthoringOperation, ScreenplayElement } from '@light-delay/v2-core';
import { trackChanges } from './track-changes';

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
