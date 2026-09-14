import { getGenerationPlan } from '$lib/data/repositories/index';
import { listVideoPackages } from '$lib/data/selectors/generationPackages';
import { requireGenerationScript } from '$lib/data/selectors/generationRoute';
import { decodeScriptId } from '$lib/utils/scriptId';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const scriptId = decodeScriptId(params.scriptId ?? '');
	requireGenerationScript(scriptId);
	const plan = getGenerationPlan(scriptId);
	return {
		scriptId,
		medium: 'video' as const,
		hasPlan: Boolean(plan),
		packages: plan ? listVideoPackages(scriptId) : []
	};
};
