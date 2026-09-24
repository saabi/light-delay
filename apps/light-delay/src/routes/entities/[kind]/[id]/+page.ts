import { error } from '@sveltejs/kit';
import {
	ENTITY_KIND_LABELS,
	getAssetById,
	getEntity,
	VALID_ENTITY_KINDS,
	type EntityKind
} from '$lib/data/repositories/lookups';
import { getLifecycleForRef, getVoiceProfiles } from '$lib/data/repositories/index';
import { decodeRouteId } from '$lib/utils/routeId';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const kind = params.kind as EntityKind;
	if (!VALID_ENTITY_KINDS.includes(kind)) {
		error(404, `Tipo de entidad desconocido: ${params.kind}`);
	}
	const entityId = decodeRouteId(params.id);
	const entity = getEntity(kind, entityId);
	if (!entity) {
		error(404, `Entidad no encontrada: ${entityId}`);
	}
	const assets = (entity.referenceAssetIds ?? [])
		.map((id) => getAssetById(id))
		.filter((a): a is NonNullable<typeof a> => !!a);
	const voiceProfileId =
		'defaultVoiceProfileId' in entity ? entity.defaultVoiceProfileId : undefined;
	const voiceProfile = voiceProfileId
		? getVoiceProfiles().voiceProfiles.find((profile) => profile.id === voiceProfileId)
		: undefined;
	return {
		kind,
		label: ENTITY_KIND_LABELS[kind],
		entity,
		assets,
		voiceProfile,
		lifecycle: getLifecycleForRef('entity', entityId)
	};
};
