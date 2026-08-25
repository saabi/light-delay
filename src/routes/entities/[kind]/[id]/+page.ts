import { error } from '@sveltejs/kit';
import {
	ENTITY_KIND_LABELS,
	getAssetById,
	getEntity,
	VALID_ENTITY_KINDS,
	type EntityKind
} from '$lib/data/repositories/lookups';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const kind = params.kind as EntityKind;
	if (!VALID_ENTITY_KINDS.includes(kind)) {
		error(404, `Tipo de entidad desconocido: ${params.kind}`);
	}
	const entity = getEntity(kind, params.id);
	if (!entity) {
		error(404, `Entidad no encontrada: ${params.id}`);
	}
	const assets = entity.referenceAssetIds
		.map((id) => getAssetById(id))
		.filter((a): a is NonNullable<typeof a> => !!a);
	return {
		kind,
		label: ENTITY_KIND_LABELS[kind],
		entity,
		assets
	};
};
