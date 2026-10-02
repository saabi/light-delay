import type { Node } from 'prosemirror-model';
import type { ScreenplayElement, ScreenplayElementKind } from '@light-delay/v2-core';
import { screenplaySchema } from './schema';

export const newElementId = () => `element:studio-${crypto.randomUUID()}`;

export function documentFromElements(elements: readonly ScreenplayElement[]): Node {
	const nodes = elements.map((element) =>
		screenplaySchema.nodes.element.create(
			{ id: element.id, kind: element.kind },
			element.text ? screenplaySchema.text(element.text) : undefined
		)
	);
	return screenplaySchema.nodes.doc.create(
		null,
		nodes.length ? nodes : [screenplaySchema.nodes.element.create({ id: newElementId() })]
	);
}

/* A derived identity records the kind it was retyped to: `element:x~transition`. */
const rootId = (id: string) => id.split('~')[0];

/**
 * The document as screenplay elements. An element's kind is fixed for its committed identity, so a
 * committed element whose type was changed is given a derived identity (`<root>~<kind>`), and goes
 * back to its own identity if its type is changed back. Elements not yet committed keep their ID
 * whatever their kind.
 */
export function elementsFromDocument(
	doc: Node,
	committedKinds: ReadonlyMap<string, ScreenplayElementKind>
): ScreenplayElement[] {
	const nodes: { id: string; kind: ScreenplayElementKind; text: string }[] = [];
	doc.forEach((node) =>
		nodes.push({
			id: node.attrs.id ?? newElementId(),
			kind: node.attrs.kind,
			text: node.textContent
		})
	);
	const present = new Set(nodes.map((node) => node.id));
	const used = new Set<string>();
	return nodes.map(({ id, kind, text }) => {
		let stable = id;
		const root = rootId(id);
		if (committedKinds.get(id) === kind) stable = id;
		else if (committedKinds.get(root) === kind && (root === id || !present.has(root)))
			stable = root;
		else if (committedKinds.has(id)) stable = `${root}~${kind}`;
		if (used.has(stable)) stable = newElementId();
		used.add(stable);
		return { id: stable, kind, text };
	});
}
