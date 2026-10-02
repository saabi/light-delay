import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';

const css = readFileSync(new URL('../studio.css', import.meta.url), 'utf8');
const token = (name: string) => {
	const match = css.match(new RegExp(`--studio-${name}:\\s*(#[0-9a-f]{3,6})\\s*;`, 'i'));
	if (!match) throw new Error(`Missing colour token --studio-${name}`);
	return match[1];
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

	it('focus indicator is distinguishable from every surface (3:1)', () => {
		for (const surface of ['bg', 'surface', 'surface-subtle'])
			expect(contrastRatio(token('focus'), token(surface))).toBeGreaterThanOrEqual(3);
	});
});
