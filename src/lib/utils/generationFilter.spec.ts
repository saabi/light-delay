import { describe, expect, it } from 'vitest';
import { generationSearchFromUrl, parseGenerationFilter } from './generationFilter';

describe('generation filter query', () => {
	it('accepts known filters and defaults invalid values to all', () => {
		expect(parseGenerationFilter('blocked')).toBe('blocked');
		expect(parseGenerationFilter('prompt_ready')).toBe('prompt_ready');
		expect(parseGenerationFilter('refs_ready')).toBe('refs_ready');
		expect(parseGenerationFilter('nope')).toBe('all');
		expect(parseGenerationFilter(null)).toBe('all');
	});

	it('omits the default all filter from the search string', () => {
		expect(generationSearchFromUrl('?filter=all')).toBe('');
		expect(generationSearchFromUrl('?filter=blocked')).toBe('?filter=blocked');
		expect(generationSearchFromUrl('?filter=blocked&x=1')).toBe('?filter=blocked');
		expect(generationSearchFromUrl('')).toBe('');
	});
});
