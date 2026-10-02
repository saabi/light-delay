import type { ScreenplayElementKind } from '@light-delay/v2-core';

/** Screenplay element kinds in screenwriting-software order (also the Mod+Alt+1…6 shortcuts). */
export const elementKinds: readonly ScreenplayElementKind[] = [
	'scene-heading',
	'action',
	'character',
	'parenthetical',
	'dialogue',
	'transition'
];

export const kindLabels: Record<ScreenplayElementKind, string> = {
	'scene-heading': 'Scene heading',
	action: 'Action',
	character: 'Character',
	parenthetical: 'Parenthetical',
	dialogue: 'Dialogue',
	transition: 'Transition'
};

/** Enter at the end of an element starts the conventional next one. */
export const nextKind: Record<ScreenplayElementKind, ScreenplayElementKind> = {
	'scene-heading': 'action',
	action: 'action',
	character: 'dialogue',
	parenthetical: 'dialogue',
	dialogue: 'action',
	transition: 'scene-heading'
};

/**
 * Tab / Shift+Tab on an empty element change its kind, as in screenwriting software: outside
 * speech they cycle action → character → transition → scene heading; inside speech, dialogue and
 * parenthetical swap (an empty line under a cue becomes a parenthetical with one Tab).
 */
export const tabCycles: readonly (readonly ScreenplayElementKind[])[] = [
	['action', 'character', 'transition', 'scene-heading'],
	['dialogue', 'parenthetical']
];

export function cycleKind(kind: ScreenplayElementKind, direction: 1 | -1): ScreenplayElementKind {
	const cycle = tabCycles.find((item) => item.includes(kind))!;
	const index = cycle.indexOf(kind);
	return cycle[(index + direction + cycle.length) % cycle.length];
}
