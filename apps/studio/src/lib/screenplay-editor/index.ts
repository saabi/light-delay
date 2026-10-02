import { baseKeymap } from 'prosemirror-commands';
import { history, redo, undo } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { EditorState, type Plugin } from 'prosemirror-state';
import type { ScreenplayElement } from '@light-delay/v2-core';
import {
	cycleEmptyElementKind,
	moveElement,
	removeElement,
	setElementKind,
	splitElement
} from './commands';
import { documentFromElements } from './document';
import { elementKinds } from './kinds';
import { elementDecorations, selectionSync, uniqueIds } from './plugins';

export * from './commands';
export * from './document';
export * from './kinds';
export { syncSelectionFromDOM } from './plugins';
export { parsePlainText, screenplaySchema } from './schema';

/** Keyboard conventions (STUDIO_DESIGN_SYSTEM.md § Editor model). */
export function screenplayKeymap(): Plugin {
	const bindings: Record<string, ReturnType<typeof setElementKind>> = {
		Enter: splitElement,
		Tab: cycleEmptyElementKind(1),
		'Shift-Tab': cycleEmptyElementKind(-1),
		'Alt-ArrowUp': moveElement(-1),
		'Alt-ArrowDown': moveElement(1),
		'Mod-z': undo,
		'Shift-Mod-z': redo,
		'Mod-y': redo
	};
	elementKinds.forEach((kind, index) => (bindings[`Mod-Alt-${index + 1}`] = setElementKind(kind)));
	return keymap(bindings);
}

export function createEditorState(elements: readonly ScreenplayElement[], extra: Plugin[] = []) {
	return EditorState.create({
		doc: documentFromElements(elements),
		plugins: [
			selectionSync,
			history(),
			screenplayKeymap(),
			keymap(baseKeymap),
			uniqueIds,
			elementDecorations,
			...extra
		]
	});
}

export { removeElement };
