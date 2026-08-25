import { redirect } from '@sveltejs/kit';
import { getProject } from '$lib/data/repositories/index';
import { encodeScriptId } from '$lib/utils/scriptId';

/** Legacy player path → scoped canonical player. */
export function load({ url }: { url: URL }) {
	const canonical = getProject().project.canonicalScriptId;
	const dest = `/animatic/${encodeScriptId(canonical)}/player${url.search}`;
	redirect(307, dest);
}
