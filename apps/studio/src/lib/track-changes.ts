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
 * Which elements changed comes from the proposal's operations (what will actually be committed),
 * or from `changesBetween`; `after` is the screenplay they produce and `before` the one they apply to.
 */
/** Which elements a change touches, by element ID. */
export interface ElementChanges {
	revised: Set<string>;
	added: Set<string>;
	removed: Set<string>;
	moved: Set<string>;
}

export function changesFromOperations(operations: readonly AuthoringOperation[]): ElementChanges {
	const changes: ElementChanges = {
		revised: new Set(),
		added: new Set(),
		removed: new Set(),
		moved: new Set()
	};
	for (const operation of operations) {
		if (operation.type === 'UpdateScreenplayElementText') changes.revised.add(operation.elementId);
		else if (operation.type === 'InsertScreenplayElement') changes.added.add(operation.element.id);
		else if (operation.type === 'RemoveScreenplayElement') changes.removed.add(operation.elementId);
		else if (operation.type === 'MoveScreenplayElement') changes.moved.add(operation.elementId);
	}
	return changes;
}

/**
 * The changes between two screenplays when there is no proposal to read them from (text kept on
 * this device, compared with what is saved). Mirrors how core derives a proposal's operations:
 * removals, insertions, text revisions, then moves for whatever is still out of order.
 */
export function changesBetween(
	before: readonly ScreenplayElement[],
	after: readonly ScreenplayElement[]
): ElementChanges {
	const changes: ElementChanges = {
		revised: new Set(),
		added: new Set(),
		removed: new Set(),
		moved: new Set()
	};
	const beforeById = new Map(before.map((element) => [element.id, element]));
	const afterIds = after.map((element) => element.id);
	const afterSet = new Set(afterIds);
	const working = before.map((element) => element.id).filter((id) => afterSet.has(id));
	for (const element of before) if (!afterSet.has(element.id)) changes.removed.add(element.id);
	const placeAfter = (id: string, previous: string | null) => {
		const current = working.indexOf(id);
		if (current >= 0) working.splice(current, 1);
		working.splice(previous === null ? 0 : working.indexOf(previous) + 1, 0, id);
	};
	after.forEach((element, index) => {
		const original = beforeById.get(element.id);
		if (!original) {
			changes.added.add(element.id);
			placeAfter(element.id, index === 0 ? null : afterIds[index - 1]);
		} else if (original.text !== element.text || original.kind !== element.kind)
			changes.revised.add(element.id);
	});
	afterIds.forEach((id, index) => {
		if (working[index] === id) return;
		changes.moved.add(id);
		placeAfter(id, index === 0 ? null : afterIds[index - 1]);
	});
	return changes;
}

export function trackChanges(
	before: readonly ScreenplayElement[],
	after: readonly ScreenplayElement[],
	operations: readonly AuthoringOperation[] | ElementChanges
): TrackedElement[] {
	const { revised, added, removed, moved } = Array.isArray(operations)
		? changesFromOperations(operations)
		: (operations as ElementChanges);
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

/**
 * The screenplay a proposal produces: its operations applied, in order, to the screenplay it was
 * made against. Only operations on `scope` apply. Used to show a pending proposal inline.
 */
export function applyOperations(
	base: readonly ScreenplayElement[],
	operations: readonly AuthoringOperation[],
	scope: { documentId: string; versionId: string }
): ScreenplayElement[] {
	const result = base.map((element) => ({ ...element }));
	const indexOf = (id: string) => result.findIndex((element) => element.id === id);
	const insertAfter = (element: ScreenplayElement, afterElementId: string | null) =>
		result.splice(afterElementId === null ? 0 : indexOf(afterElementId) + 1, 0, element);
	for (const operation of operations) {
		if (
			!('scope' in operation) ||
			operation.scope.documentId !== scope.documentId ||
			operation.scope.versionId !== scope.versionId
		)
			continue;
		if (operation.type === 'InsertScreenplayElement')
			insertAfter({ ...operation.element }, operation.afterElementId);
		else if (operation.type === 'UpdateScreenplayElementText') {
			const index = indexOf(operation.elementId);
			if (index >= 0) result[index] = { ...result[index], text: operation.text };
		} else if (operation.type === 'RemoveScreenplayElement') {
			const index = indexOf(operation.elementId);
			if (index >= 0) result.splice(index, 1);
		} else if (operation.type === 'MoveScreenplayElement') {
			const index = indexOf(operation.elementId);
			if (index < 0) continue;
			const [moved] = result.splice(index, 1);
			insertAfter(moved, operation.afterElementId);
		}
	}
	return result;
}
