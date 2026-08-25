import { error } from '@sveltejs/kit';
import {
	ENTITY_KIND_LABELS,
	getEntityPrimaryImagePath,
	listEntities,
	VALID_ENTITY_KINDS,
	type EntityKind
} from '$lib/data/repositories/lookups';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const kind = params.kind as EntityKind;
	if (!VALID_ENTITY_KINDS.includes(kind)) {
		error(404, `Tipo de entidad desconocido: ${params.kind}`);
	}
	const items = listEntities(kind).map((e) => ({
		id: e.id,
		href: `/entities/${kind}/${e.id}`,
		title: e.name,
		description: e.description,
		imageSrc: getEntityPrimaryImagePath(e.referenceAssetIds),
		eyebrow: ENTITY_KIND_LABELS[kind]
	}));
	return {
		kind,
		label: ENTITY_KIND_LABELS[kind],
		items
	};
};
