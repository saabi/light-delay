import { describe, expect, it } from 'vitest';
import { TextSelection, type Command, type EditorState } from 'prosemirror-state';
import { undo, redo } from 'prosemirror-history';
import type { ScreenplayElement, ScreenplayElementKind } from '@light-delay/v2-core';
import {
	createEditorState,
	cycleEmptyElementKind,
	elementsFromDocument,
	moveElement,
	parsePlainText,
	removeElement,
	setElementKind,
	splitElement
} from './index';

const el = (id: string, kind: ScreenplayElementKind, text: string): ScreenplayElement => ({
	id: `element:${id}`,
	kind,
	text
});
const script = [
	el('heading', 'scene-heading', 'EXT. HARBOR LIGHT — NIGHT'),
	el('action', 'action', 'Mara steadies the lamp.'),
	el('cue', 'character', 'MARA'),
	el('line', 'dialogue', 'Leave the channel open.')
];
const committed = new Map(script.map((element) => [element.id, element.kind]));

/* Applies a command (and any appended transactions, such as the ID plugin's). */
function run(state: EditorState, command: Command): EditorState {
	let next = state;
	command(state, (tr) => (next = state.apply(tr)));
	return next;
}

/* Caret at `offset` within the element at `index`. */
function at(state: EditorState, index: number, offset: number | 'end'): EditorState {
	let pos = 0;
	for (let i = 0; i < index; i++) pos += state.doc.child(i).nodeSize;
	const node = state.doc.child(index);
	const inner = offset === 'end' ? node.content.size : offset;
	return state.apply(state.tr.setSelection(TextSelection.create(state.doc, pos + 1 + inner)));
}

const elements = (state: EditorState) => elementsFromDocument(state.doc, committed);
const kinds = (state: EditorState) => elements(state).map((element) => element.kind);
const insertText = (state: EditorState, text: string) => state.apply(state.tr.insertText(text));

describe('screenplay editor: serialization', () => {
	it('round-trips elements, IDs included', () => {
		expect(elements(createEditorState(script))).toEqual(script);
	});
});

describe('screenplay editor: Enter conventions', () => {
	it.each([
		[0, 'action'],
		[1, 'action'],
		[2, 'dialogue'],
		[3, 'action']
	] as const)('Enter at the end of element %i starts %s', (index, expected) => {
		const state = run(at(createEditorState(script), index, 'end'), splitElement);
		expect(kinds(state)[index + 1]).toBe(expected);
		expect(elements(state)[index].id).toBe(script[index].id);
		expect(elements(state)[index + 1].text).toBe('');
	});

	it('parenthetical → dialogue and transition → scene heading', () => {
		const custom = [el('p', 'parenthetical', '(quietly)'), el('t', 'transition', 'CUT TO:')];
		const state = createEditorState(custom);
		expect(kinds(run(at(state, 0, 'end'), splitElement))[1]).toBe('dialogue');
		expect(kinds(run(at(state, 1, 'end'), splitElement))[2]).toBe('scene-heading');
	});

	it('splitting in the middle keeps the first half’s identity and gives the rest a new one', () => {
		const state = run(at(createEditorState(script), 1, 5), splitElement);
		const [, first, second] = elements(state);
		expect(first).toEqual({ ...script[1], text: 'Mara ' });
		expect(second.kind).toBe('action');
		expect(second.text).toBe('steadies the lamp.');
		expect(second.id).not.toBe(script[1].id);
	});

	it('Enter at the start of an element opens a blank one above; the text keeps its identity', () => {
		const state = run(at(createEditorState(script), 3, 0), splitElement);
		const result = elements(state);
		expect(result[3]).toMatchObject({ kind: 'dialogue', text: '' });
		expect(result[4]).toEqual(script[3]);
	});
});

describe('screenplay editor: element kinds', () => {
	it('Tab and Shift+Tab change an empty element as screenwriting software does', () => {
		let state = run(at(createEditorState(script), 1, 'end'), splitElement);
		const seen: string[] = [kinds(state)[2]];
		for (let i = 0; i < 4; i++) {
			state = run(state, cycleEmptyElementKind(1));
			seen.push(kinds(state)[2]);
		}
		expect(seen).toEqual(['action', 'character', 'transition', 'scene-heading', 'action']);
		expect(kinds(run(state, cycleEmptyElementKind(-1)))[2]).toBe('scene-heading');

		/* An empty line under a cue is dialogue; one Tab makes it a parenthetical, another returns. */
		state = run(state, cycleEmptyElementKind(1));
		state = run(state, splitElement);
		expect(kinds(state)[3]).toBe('dialogue');
		state = run(state, cycleEmptyElementKind(1));
		expect(kinds(state)[3]).toBe('parenthetical');
		expect(kinds(run(state, cycleEmptyElementKind(-1)))[3]).toBe('dialogue');
	});

	it('Tab on a non-empty element is left to the browser', () => {
		const state = at(createEditorState(script), 1, 3);
		expect(cycleEmptyElementKind(1)(state)).toBe(false);
	});

	it('retyping a committed element gives it a derived identity, and retyping back restores it', () => {
		let state = run(at(createEditorState(script), 1, 3), setElementKind('transition'));
		expect(elements(state)[1]).toEqual({
			id: 'element:action~transition',
			kind: 'transition',
			text: script[1].text
		});
		state = run(state, setElementKind('action'));
		expect(elements(state)[1]).toEqual(script[1]);
	});

	it('a new element keeps its identity whatever its kind', () => {
		let state = run(at(createEditorState(script), 3, 'end'), splitElement);
		const id = elements(state)[4].id;
		state = run(insertText(state, 'CUT TO:'), setElementKind('transition'));
		expect(elements(state)[4]).toEqual({ id, kind: 'transition', text: 'CUT TO:' });
	});
});

describe('screenplay editor: structure and history', () => {
	it('moves the current element with its identity and keeps the caret in it', () => {
		const state = run(at(createEditorState(script), 1, 2), moveElement(1));
		expect(elements(state).map((element) => element.id)).toEqual([
			script[0].id,
			script[2].id,
			script[1].id,
			script[3].id
		]);
		expect(state.selection.$head.parent.attrs.id).toBe(script[1].id);
	});

	it('removing the last element leaves one empty action', () => {
		let state = createEditorState([script[0]]);
		state = run(at(state, 0, 0), removeElement);
		expect(elements(state)).toMatchObject([{ kind: 'action', text: '' }]);
	});

	it('undoes and redoes across elements', () => {
		let state = insertText(at(createEditorState(script), 1, 'end'), ' Again.');
		state = state.apply(state.tr.setMeta('addToHistory', true));
		state = run(state, splitElement);
		state = insertText(state, 'Signal.');
		const edited = elements(state);
		expect(edited).toHaveLength(5);
		while (undo(state)) state = run(state, undo);
		expect(elements(state)).toEqual(script);
		while (redo(state)) state = run(state, redo);
		expect(elements(state).map((element) => element.text)).toEqual(
			edited.map((element) => element.text)
		);
	});

	it('a type change is its own undo step, even straight after typing', () => {
		let state = insertText(at(createEditorState(script), 1, 'end'), ' Again.');
		state = run(state, setElementKind('transition'));
		expect(elements(state)[1]).toMatchObject({
			kind: 'transition',
			text: 'Mara steadies the lamp. Again.'
		});
		state = run(state, undo);
		expect(elements(state)[1]).toMatchObject({
			kind: 'action',
			text: 'Mara steadies the lamp. Again.'
		});
	});

	it('pasting several lines creates action elements with unique identities', () => {
		let state = at(createEditorState(script), 3, 'end');
		state = state.apply(state.tr.replaceSelection(parsePlainText('One.\nTwo.\nThree.')));
		const result = elements(state);
		expect(result.map((element) => element.text)).toEqual([
			...script.slice(0, 3).map((element) => element.text),
			'Leave the channel open.One.',
			'Two.',
			'Three.'
		]);
		expect(new Set(result.map((element) => element.id)).size).toBe(result.length);
		expect(result[3].id).toBe(script[3].id);
	});

	it('duplicate identities from a copy are renewed, the original keeps its own', () => {
		let state = at(createEditorState(script), 3, 'end');
		const copied = state.doc.slice(
			state.doc.child(0).nodeSize,
			state.doc.child(0).nodeSize + state.doc.child(1).nodeSize
		);
		state = state.apply(state.tr.insert(state.doc.content.size, copied.content));
		const result = elements(state);
		expect(result[1].id).toBe(script[1].id);
		expect(result[4].text).toBe(script[1].text);
		expect(result[4].id).not.toBe(script[1].id);
	});
});
