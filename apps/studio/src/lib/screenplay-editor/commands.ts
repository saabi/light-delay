import { TextSelection, type Command, type EditorState, type Transaction } from 'prosemirror-state';
import { closeHistory } from 'prosemirror-history';
import type { ScreenplayElementKind } from '@light-delay/v2-core';
import { cycleKind, nextKind } from './kinds';
import { newElementId } from './document';
import { screenplaySchema } from './schema';

const elementType = screenplaySchema.nodes.element;

/* Type changes, moves and removals are their own undo steps, never merged into nearby typing. */
const discrete = (tr: Transaction) => closeHistory(tr);

/** The element (top-level block) holding the selection head, with its document position. */
export function currentElement(state: EditorState) {
	const $head = state.selection.$head;
	const depth = Math.min($head.depth, 1);
	if (depth < 1) return undefined;
	return { node: $head.node(1), pos: $head.before(1), index: $head.index(0) };
}

/**
 * Enter ends the element and starts the conventional next one (character → dialogue …). In the
 * middle of an element it splits it, the second half getting a new identity. At the very start of a
 * non-empty element it opens a blank element above, so the text keeps its identity.
 */
export const splitElement: Command = (state, dispatch) => {
	let tr: Transaction = state.tr;
	if (!state.selection.empty) tr = tr.deleteSelection();
	const $from = tr.selection.$from;
	if ($from.depth < 1) return false;
	const node = $from.parent;
	const kind = node.attrs.kind as ScreenplayElementKind;
	if ($from.parentOffset === 0 && node.content.size > 0) {
		tr = tr.insert($from.before(1), elementType.create({ id: newElementId(), kind }));
	} else {
		const atEnd = $from.parentOffset === node.content.size;
		tr = tr.split($from.pos, 1, [
			{ type: elementType, attrs: { id: newElementId(), kind: atEnd ? nextKind[kind] : kind } }
		]);
	}
	dispatch?.(tr.scrollIntoView());
	return true;
};

/** Tab / Shift+Tab on an empty element cycle its kind. Elsewhere Tab is left to the browser. */
export const cycleEmptyElementKind =
	(direction: 1 | -1): Command =>
	(state, dispatch) => {
		const current = currentElement(state);
		if (!current || current.node.content.size > 0 || !state.selection.empty) return false;
		dispatch?.(
			discrete(
				state.tr.setNodeMarkup(current.pos, undefined, {
					...current.node.attrs,
					kind: cycleKind(current.node.attrs.kind, direction)
				})
			)
		);
		return true;
	};

export const setElementKind =
	(kind: ScreenplayElementKind): Command =>
	(state, dispatch) => {
		const current = currentElement(state);
		if (!current) return false;
		if (current.node.attrs.kind !== kind)
			dispatch?.(
				discrete(state.tr.setNodeMarkup(current.pos, undefined, { ...current.node.attrs, kind }))
			);
		return true;
	};

/** Alt+↑ / Alt+↓: move the current element, keeping the caret in it. */
export const moveElement =
	(direction: -1 | 1): Command =>
	(state, dispatch) => {
		const current = currentElement(state);
		if (!current) return false;
		const neighbourIndex = current.index + direction;
		if (neighbourIndex < 0 || neighbourIndex >= state.doc.childCount) return true;
		const neighbour = state.doc.child(neighbourIndex);
		const offset = state.selection.head - current.pos;
		const tr = state.tr.delete(current.pos, current.pos + current.node.nodeSize);
		const target =
			direction < 0 ? current.pos - neighbour.nodeSize : current.pos + neighbour.nodeSize;
		tr.insert(target, current.node);
		tr.setSelection(TextSelection.create(tr.doc, target + offset));
		dispatch?.(discrete(tr).scrollIntoView());
		return true;
	};

/** Remove the current element; the document always keeps at least one element. */
export const removeElement: Command = (state, dispatch) => {
	const current = currentElement(state);
	if (!current) return false;
	let tr = state.tr;
	if (state.doc.childCount === 1)
		tr = tr.replaceWith(
			0,
			state.doc.content.size,
			elementType.create({ id: newElementId(), kind: 'action' })
		);
	else tr = tr.delete(current.pos, current.pos + current.node.nodeSize);
	const position = Math.min(current.pos, tr.doc.content.size - 1);
	tr.setSelection(TextSelection.near(tr.doc.resolve(Math.max(1, position + 1))));
	dispatch?.(discrete(tr).scrollIntoView());
	return true;
};
