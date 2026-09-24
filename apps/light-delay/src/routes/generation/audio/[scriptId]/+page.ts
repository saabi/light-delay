import { listAudioPackages } from '$lib/data/selectors/generationPackages';
import { requireGenerationScript } from '$lib/data/selectors/generationRoute';
import { decodeScriptId } from '$lib/utils/scriptId';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const scriptId = decodeScriptId(params.scriptId ?? '');
	requireGenerationScript(scriptId);
	return {
		scriptId,
		medium: 'audio' as const,
		hasPlan: true,
		packages: listAudioPackages(scriptId)
	};
};
