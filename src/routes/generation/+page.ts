import { redirect } from '@sveltejs/kit';
import { encodeScriptId } from '$lib/utils/scriptId';
import { withLocale } from '$lib/utils/paths';

/** Default cut for generation readiness (authorized Festival-master WIP). */
const FESTIVAL_MASTER = 'script:light-delay-festival-master';

export function load() {
	redirect(307, withLocale(`/generation/image/${encodeScriptId(FESTIVAL_MASTER)}`));
}
