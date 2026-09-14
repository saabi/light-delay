import { error } from '@sveltejs/kit';
import { getScript } from '$lib/data/repositories/index';
import { listAudioPackages } from '$lib/data/selectors/generationPackages';
import { decodeScriptId } from '$lib/utils/scriptId';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const scriptId = decodeScriptId(params.scriptId ?? '');
	try {
		getScript(scriptId);
	} catch {
		error(404, `Script not found: ${scriptId}`);
	}
	return {
		scriptId,
		medium: 'audio' as const,
		packages: listAudioPackages(scriptId)
	};
};
