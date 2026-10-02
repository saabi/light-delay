import type { AuthoringOperation, ScreenplayElement } from '@light-delay/v2-core';
import { diffWords, type DiffPart } from './text-diff';

export interface TrackedElement {
	key: string;
	kind: ScreenplayElement['kind'];
	state: 'unchanged' | 'revised' | 'added' | 'removed';
	moved: boolean;
	parts: DiffPart[];
}

/**
 * The document as it will read after a commit, with the commit's changes marked in place: revised
 * text as word-level insertions and deletions, added and removed elements whole, moves flagged.
 * Which elements changed comes from the proposal's operations (what will actually be committed);
 * `after` is the screenplay those operations produce and `before` the one they apply to.
 */
export function trackChanges(
	before: readonly ScreenplayElement[],
	after: readonly ScreenplayElement[],
	operations: readonly AuthoringOperation[]
): TrackedElement[] {
	const revised = new Set<string>();
	const added = new Set<string>();
	const removed = new Set<string>();
	const moved = new Set<string>();
	for (const operation of operations) {
		if (operation.type === 'UpdateScreenplayElementText') revised.add(operation.elementId);
		else if (operation.type === 'InsertScreenplayElement') added.add(operation.element.id);
		else if (operation.type === 'RemoveScreenplayElement') removed.add(operation.elementId);
		else if (operation.type === 'MoveScreenplayElement') moved.add(operation.elementId);
	}
	const beforeById = new Map(before.map((element) => [element.id, element]));

	/* Removed elements stay where they were: after the nearest earlier element that survives. */
	const removedAfter = new Map<string | null, ScreenplayElement[]>();
	let anchor: string | null = null;
	for (const element of before) {
		if (removed.has(element.id)) {
			const list = removedAfter.get(anchor) ?? [];
			list.push(element);
			removedAfter.set(anchor, list);
		} else anchor = element.id;
	}
	const removedItems = (key: string | null): TrackedElement[] =>
		(removedAfter.get(key) ?? []).map((element) => ({
			key: `removed:${element.id}`,
			kind: element.kind,
			state: 'removed',
			moved: false,
			parts: [{ op: 'delete', text: element.text }]
		}));

	const result: TrackedElement[] = [...removedItems(null)];
	for (const element of after) {
		const original = beforeById.get(element.id);
		const state = added.has(element.id)
			? 'added'
			: revised.has(element.id)
				? 'revised'
				: 'unchanged';
		result.push({
			key: element.id,
			kind: element.kind,
			state,
			moved: moved.has(element.id),
			parts:
				state === 'added'
					? [{ op: 'insert', text: element.text }]
					: state === 'revised' && original
						? diffWords(original.text, element.text)
						: [{ op: 'equal', text: element.text }]
		});
		result.push(...removedItems(element.id));
	}
	return result;
}
