import type { AuthoringOperation } from '@light-delay/v2-core';

export function describeOperation(operation: AuthoringOperation): string {
	if (operation.type === 'InsertScreenplayElement')
		return `Add ${operation.element.kind.replace('-', ' ')}`;
	if (operation.type === 'UpdateScreenplayElementText') return 'Revise authored text';
	if (operation.type === 'RemoveScreenplayElement')
		return 'Remove screenplay element from this cut';
	if (operation.type === 'MoveScreenplayElement') return 'Reorder screenplay element';
	return `Restore this screenplay from revision ${operation.targetRevision}`;
}

export function draftSavedMessage(): string {
	return 'Draft saved in this Studio process';
}
