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

export function parseGenerationShot(value: string | null | undefined): string | null {
	const shot = value?.trim();
	return shot ? shot : null;
}

function searchParamsFrom(search: string | URLSearchParams | null | undefined): URLSearchParams {
	if (!search) return new URLSearchParams();
	if (typeof search === 'string') {
		return new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
	}
	return search;
}

/** Query suffix for generation routes; empty when filter is `all` and no shot is set. */
export function generationSearchFromUrl(search: string | URLSearchParams | null | undefined): string {
	const params = searchParamsFrom(search);
	const next = new URLSearchParams();
	const filter = parseGenerationFilter(params.get('filter'));
	if (filter !== 'all') next.set('filter', filter);
	const shot = parseGenerationShot(params.get('shot'));
	if (shot) next.set('shot', shot);
	const qs = next.toString();
	return qs ? `?${qs}` : '';
}
