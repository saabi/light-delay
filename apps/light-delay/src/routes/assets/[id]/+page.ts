import { error } from '@sveltejs/kit';
import { getAssetById } from '$lib/data/repositories/lookups';
import { getLifecycleForRef } from '$lib/data/repositories/index';
import { decodeRouteId } from '$lib/utils/routeId';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const assetId = decodeRouteId(params.id);
	const asset = getAssetById(assetId);
	if (!asset) {
		error(404, `Asset no encontrado: ${assetId}`);
	}
	return { asset, lifecycle: getLifecycleForRef('asset', assetId) };
};
