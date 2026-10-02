import { Fragment, Schema, Slice, type Node } from 'prosemirror-model';
import type { ScreenplayElementKind } from '@light-delay/v2-core';
import { elementKinds } from './kinds';

const isKind = (value: string | null): value is ScreenplayElementKind =>
	!!value && (elementKinds as readonly string[]).includes(value);

/**
 * One continuous document of typed blocks. Each block is a screenplay element with a stable `id`
 * (null until the ID plugin assigns one) and a `kind`. Plain text only: no marks.
 */
export const screenplaySchema = new Schema({
	nodes: {
		doc: { content: 'element+' },
		element: {
			content: 'text*',
			marks: '',
			attrs: { id: { default: null }, kind: { default: 'action' } },
			defining: true,
			toDOM: (node) => [
				'p',
				{ class: 'el', 'data-kind': node.attrs.kind, 'data-id': node.attrs.id ?? '' },
				0
			],
			parseDOM: [
				{
					tag: 'p[data-kind]',
					getAttrs: (dom) => {
						const element = dom as HTMLElement;
						const kind = element.getAttribute('data-kind');
						return {
							id: element.getAttribute('data-id') || null,
							kind: isKind(kind) ? kind : 'action'
						};
					}
				},
				/* Anything else pasted becomes action. */
				{ tag: 'p', attrs: { kind: 'action' } },
				{ tag: 'div', attrs: { kind: 'action' } },
				{ tag: 'li', attrs: { kind: 'action' } },
				{ tag: 'h1', attrs: { kind: 'scene-heading' } },
				{ tag: 'h2', attrs: { kind: 'scene-heading' } },
				{ tag: 'h3', attrs: { kind: 'scene-heading' } }
			]
		},
		text: {}
	}
});

/** Plain-text paste: one line stays inline; several lines become action elements. */
export function parsePlainText(text: string): Slice {
	const lines = text.replace(/\r\n?/g, '\n').split('\n');
	if (lines.length === 1)
		return new Slice(Fragment.from(text ? screenplaySchema.text(text) : []), 0, 0);
	const nodes: Node[] = lines.map((line) =>
		screenplaySchema.nodes.element.create(
			{ id: null, kind: 'action' },
			line ? screenplaySchema.text(line) : undefined
		)
	);
	return new Slice(Fragment.from(nodes), 1, 1);
}
