import { redirect } from '@sveltejs/kit';
import { encodeScriptId } from '$lib/utils/scriptId';
import { withLocale } from '$lib/utils/paths';
import { generationSearchFromUrl } from '$lib/utils/generationFilter';

/** Static default cut for generation readiness (authorized Festival-master WIP, not narrative authority). */
const FESTIVAL_MASTER = 'script:light-delay-festival-master';

export function load({ url }: { url: URL }) {
	redirect(
		307,
		`${withLocale(`/generation/image/${encodeScriptId(FESTIVAL_MASTER)}`)}${generationSearchFromUrl(url.search)}`
	);
}
