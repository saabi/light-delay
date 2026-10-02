import { Plugin, PluginKey, TextSelection } from 'prosemirror-state';
import { Decoration, DecorationSet, type EditorView } from 'prosemirror-view';
import { newElementId } from './document';
import { currentElement } from './commands';
import { kindLabels } from './kinds';

/**
 * Every element has a unique identity. Splitting copies attributes and pasting may bring IDs
 * along, so the first occurrence keeps the ID and any later duplicate (or missing ID) gets a new one.
 */
export const uniqueIds = new Plugin({
	key: new PluginKey('screenplay-unique-ids'),
	appendTransaction: (transactions, _old, state) => {
		if (!transactions.some((tr) => tr.docChanged)) return null;
		const seen = new Set<string>();
		let tr = state.tr;
		let changed = false;
		state.doc.forEach((node, offset) => {
			const id = node.attrs.id as string | null;
			if (id && !seen.has(id)) {
				seen.add(id);
				return;
			}
			const fresh = newElementId();
			seen.add(fresh);
			tr = tr.setNodeMarkup(offset, undefined, { ...node.attrs, id: fresh });
			changed = true;
		});
		return changed ? tr.setMeta('addToHistory', false) : null;
	}
});

/** Marks the element holding the caret (a visible indicator, not only a caret) and empty elements. */
export const elementDecorations = new Plugin({
	key: new PluginKey('screenplay-element-decorations'),
	props: {
		decorations: (state) => {
			const decorations: Decoration[] = [];
			const current = currentElement(state);
			state.doc.forEach((node, offset) => {
				const attrs: Record<string, string> = {};
				if (current && current.pos === offset) attrs.class = 'el-current';
				if (node.content.size === 0)
					attrs['data-placeholder'] = kindLabels[node.attrs.kind as keyof typeof kindLabels];
				if (Object.keys(attrs).length)
					decorations.push(Decoration.node(offset, offset + node.nodeSize, attrs));
			});
			return DecorationSet.create(state.doc, decorations);
		}
	}
});

/**
 * Brings the editor's selection up to date with the page's before a key is handled. Browsers
 * report caret moves (End, arrow keys, clicks) a moment later than the key itself, so a quick
 * End then Enter could otherwise split where the caret used to be.
 */
export function syncSelectionFromDOM(view: EditorView) {
	const root = view.root as Document | (ShadowRoot & { getSelection?: () => Selection | null });
	const dom = root.getSelection?.();
	if (!dom?.anchorNode || !dom.focusNode) return;
	if (!view.dom.contains(dom.anchorNode) || !view.dom.contains(dom.focusNode)) return;
	let anchor: number, head: number;
	try {
		anchor = view.posAtDOM(dom.anchorNode, dom.anchorOffset);
		head = view.posAtDOM(dom.focusNode, dom.focusOffset);
	} catch {
		return;
	}
	const { selection } = view.state;
	if (selection.anchor === anchor && selection.head === head) return;
	const next = TextSelection.between(view.state.doc.resolve(anchor), view.state.doc.resolve(head));
	view.dispatch(view.state.tr.setSelection(next));
}

export const selectionSync = new Plugin({
	key: new PluginKey('screenplay-selection-sync'),
	props: {
		handleKeyDown: (view, event) => {
			if (!event.isComposing && event.keyCode !== 229) syncSelectionFromDOM(view);
			return false;
		}
	}
});
