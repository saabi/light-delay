import { describe, expect, it } from 'vitest';
import type { ScreenplayElement } from '@light-delay/v2-core';
import { describeOperation, draftSavedMessage } from './authoring-presenter.js';

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

	it('states the in-memory Draft durability boundary truthfully', () => {
		expect(draftSavedMessage()).toBe('Draft saved in this Studio process');
	});
});
