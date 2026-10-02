import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';

const css = readFileSync(new URL('../studio.css', import.meta.url), 'utf8');
/* Colour tokens declared in a block whose selector matches `selector` exactly (default :root). */
const block = (selector: string) => {
	const start = css.indexOf(`${selector} {`);
	if (start < 0) throw new Error(`Missing block ${selector}`);
	return css.slice(start, css.indexOf('}', start));
};
const tokenIn = (selector: string, name: string) => {
	const match = block(selector).match(
		new RegExp(`--studio-${name}:\\s*(#[0-9a-f]{3,6})\\s*;`, 'i')
	);
	return match?.[1];
};
const token = (name: string) => {
	const value = tokenIn(':root', name);
	if (!value) throw new Error(`Missing colour token --studio-${name}`);
	return value;
};

/* Every text token must meet WCAG AA (4.5:1) on every surface it is used on. */
const textOnSurfaces: Array<[string, string[]]> = [
	['text', ['bg', 'surface', 'surface-subtle', 'notice']],
	['text-muted', ['bg', 'surface', 'surface-subtle']],
	['accent', ['bg', 'surface', 'surface-subtle']],
	['success', ['bg', 'surface', 'surface-subtle']],
	['danger', ['bg', 'surface', 'surface-subtle']],
	['warning', ['bg', 'surface', 'surface-subtle', 'notice']],
	['on-accent', ['accent']]
];

describe('Studio colour tokens', () => {
	for (const [text, surfaces] of textOnSurfaces)
		for (const surface of surfaces)
			it(`--studio-${text} on --studio-${surface} meets AA`, () => {
				expect(contrastRatio(token(text), token(surface))).toBeGreaterThanOrEqual(4.5);
			});

	for (const level of ['high', 'maximum'])
		it(`muted text in the ${level} contrast preference is stronger than normal and meets AAA`, () => {
			const muted = tokenIn(`:root[data-contrast='${level}']`, 'text-muted')!;
			for (const surface of ['bg', 'surface', 'surface-subtle'])
				expect(contrastRatio(muted, token(surface))).toBeGreaterThanOrEqual(7);
			expect(contrastRatio(muted, token('bg'))).toBeGreaterThan(
				contrastRatio(token('text-muted'), token('bg'))
			);
		});

	it('focus indicator is distinguishable from every surface (3:1)', () => {
		for (const surface of ['bg', 'surface', 'surface-subtle'])
			expect(contrastRatio(token('focus'), token(surface))).toBeGreaterThanOrEqual(3);
	});
});
