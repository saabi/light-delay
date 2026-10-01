import type { AuthoringOperation, ScreenplayElement } from '@light-delay/v2-core';

export interface ProposalReviewItem {
	title: string;
	before?: string;
	after?: string;
	detail?: string;
}

const kindLabel = (kind: ScreenplayElement['kind']) => kind.replace('-', ' ');

function findElement(elements: readonly ScreenplayElement[], elementId: string) {
	return elements.find((element) => element.id === elementId);
}

function quotedAnchor(elements: readonly ScreenplayElement[], elementId: string | null): string {
	if (elementId === null) return 'Move to the start of the screenplay';
	const anchor = findElement(elements, elementId);
	return anchor ? `Place after “${anchor.text}”` : 'Place after the preceding screenplay element';
}

export function describeOperation(
	operation: AuthoringOperation,
	baseElements: readonly ScreenplayElement[]
): ProposalReviewItem {
	if (operation.type === 'InsertScreenplayElement')
		return {
			title: `Add ${kindLabel(operation.element.kind)}`,
			after: operation.element.text,
			detail: quotedAnchor(baseElements, operation.afterElementId)
		};
	if (operation.type === 'UpdateScreenplayElementText') {
		const original = findElement(baseElements, operation.elementId);
		return {
			title: `Revise ${original ? kindLabel(original.kind) : 'screenplay text'}`,
			...(original ? { before: original.text } : {}),
			after: operation.text
		};
	}
	if (operation.type === 'RemoveScreenplayElement') {
		const original = findElement(baseElements, operation.elementId);
		return {
			title: `Remove ${original ? kindLabel(original.kind) : 'screenplay element'} from this cut`,
			...(original ? { before: original.text } : {})
		};
	}
	if (operation.type === 'MoveScreenplayElement') {
		const original = findElement(baseElements, operation.elementId);
		return {
			title: `Move ${original ? kindLabel(original.kind) : 'screenplay element'}`,
			...(original ? { before: original.text } : {}),
			detail: quotedAnchor(baseElements, operation.afterElementId)
		};
	}
	return {
		title: `Restore this screenplay from revision ${operation.targetRevision}`,
		detail: 'Only this screenplay and cut will be restored'
	};
}

export function draftSavedMessage(): string {
	return 'Draft saved';
}
