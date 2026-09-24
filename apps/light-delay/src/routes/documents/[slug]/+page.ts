import { error } from '@sveltejs/kit';
import { getDocumentBySlug } from '$lib/data/repositories/lookups';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const document = getDocumentBySlug(params.slug);
	if (!document) {
		error(404, `Documento no encontrado: ${params.slug}`);
	}
	return { document };
};
