import type { ScreenplayElement } from '@light-delay/v2-core';

/** True when two screenplays read the same: same element kinds and text, in the same order. */
export function sameScreenplayText(
	a: readonly Pick<ScreenplayElement, 'kind' | 'text'>[],
	b: readonly Pick<ScreenplayElement, 'kind' | 'text'>[]
) {
	return (
		a.length === b.length &&
		a.every((element, index) => element.kind === b[index].kind && element.text === b[index].text)
	);
}
