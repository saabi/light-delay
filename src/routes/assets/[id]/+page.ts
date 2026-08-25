import { error } from '@sveltejs/kit';
import { getAssetById } from '$lib/data/repositories/lookups';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const asset = getAssetById(params.id);
	if (!asset) {
		error(404, `Asset no encontrado: ${params.id}`);
	}
	return { asset };
};
