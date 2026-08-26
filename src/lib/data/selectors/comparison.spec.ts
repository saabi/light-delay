import { describe, expect, it } from 'vitest';
import {
	getCharacters,
	getComparisonTaxonomy,
	getEntityVariants,
	getScript
} from '../repositories/index.ts';
import { compareScripts } from './comparison.ts';
import { getFoundationalConflictWarnings } from '../validation/validateComparison.ts';

describe('cross-script comparison', () => {
	it('compares declared canon, events and cast without inference', () => {
		const result = compareScripts({
			primary: getScript('script:light-delay-main-short'),
			against: getScript('script:light-delay-festival'),
			taxonomy: getComparisonTaxonomy(),
			characters: getCharacters().characters,
			variants: getEntityVariants().variants
		});

		expect(result.canon).toHaveLength(11);
		expect(result.canon.every((row) => row.comparison === 'same')).toBe(true);
		expect(result.events.find((row) => row.definition.id === 'event:embarkation')?.comparison).toBe(
			'different'
		);
		const cael = result.cast.find((row) => row.characterId === 'character:cael');
		expect(cael?.primary?.declared).toBe(true);
		expect(cael?.against).toBeUndefined();
	});

	it('warns only for explicit foundational conflicts in one continuity', () => {
		const main = getScript('script:light-delay-main-short');
		const alternate = structuredClone(main);
		alternate.script.id = 'script:test-conflict';
		const claim = alternate.script.comparisonProfile?.canonClaims.find(
			(item) => item.dimensionId === 'canon:tunnel-geometry'
		);
		if (!claim) throw new Error('missing test claim');
		claim.valueId = 'ring';

		expect(getFoundationalConflictWarnings(main, alternate, getComparisonTaxonomy())).toEqual([
			`${main.script.id} / ${alternate.script.id}: foundational conflict canon:tunnel-geometry`
		]);
	});
});
