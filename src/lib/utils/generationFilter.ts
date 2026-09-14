export const GENERATION_FILTERS = [
	'all',
	'prompt_ready',
	'refs_complete',
	'refs_ready',
	'has_output',
	'blocked'
] as const;

export type GenerationPackageFilter = (typeof GENERATION_FILTERS)[number];

export function parseGenerationFilter(value: string | null | undefined): GenerationPackageFilter {
	if (value && (GENERATION_FILTERS as readonly string[]).includes(value)) {
		return value as GenerationPackageFilter;
	}
	return 'all';
}

/** Query suffix for generation routes; empty when the filter is the default `all`. */
export function generationSearchFromUrl(search: string | URLSearchParams | null | undefined): string {
	if (!search) return '';
	const params =
		typeof search === 'string'
			? new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
			: search;
	const filter = parseGenerationFilter(params.get('filter'));
	return filter === 'all' ? '' : `?filter=${filter}`;
}
