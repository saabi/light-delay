import { describe, expect, it } from 'vitest';
import { describeOperation, draftSavedMessage } from './authoring-presenter.js';

describe('Studio authoring presentation', () => {
	it('uses filmmaking language for semantic text changes', () => {
		expect(
			describeOperation({
				type: 'UpdateScreenplayElementText',
				scope: { documentId: 'document:test', versionId: 'version:feature' },
				elementId: 'element:test',
				text: 'New line'
			})
		).toBe('Revise authored text');
	});

	it('states the in-memory Draft durability boundary truthfully', () => {
		expect(draftSavedMessage()).toBe('Draft saved in this Studio process');
	});
});
