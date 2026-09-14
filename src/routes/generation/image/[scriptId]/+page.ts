import { error } from '@sveltejs/kit';
import { getGenerationPlan, getScript } from '$lib/data/repositories/index';
import { listImagePackages } from '$lib/data/selectors/generationPackages';
import { decodeScriptId } from '$lib/utils/scriptId';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const scriptId = decodeScriptId(params.scriptId ?? '');
	try {
		getScript(scriptId);
	} catch {
		error(404, `Script not found: ${scriptId}`);
	}
	const plan = getGenerationPlan(scriptId);
	if (!plan) error(404, `Generation plan not found for ${scriptId}`);
	return {
		scriptId,
		medium: 'image' as const,
		packages: listImagePackages(scriptId)
	};
};
