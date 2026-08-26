import { redirect } from '@sveltejs/kit';
import { getProject } from '$lib/data/repositories/index';
import { withBase } from '$lib/utils/paths';
import { encodeScriptId } from '$lib/utils/scriptId';

// This compatibility route preserves arbitrary query parameters, so it is
// resolved client-side through adapter-static's 404 fallback rather than
// prerendered with a fictitious build-time query string.
export const prerender = false;

/** Legacy player path → scoped canonical player. */
export function load({ url }: { url: URL }) {
	const canonical = getProject().project.canonicalScriptId;
	const dest = withBase(`/animatic/${encodeScriptId(canonical)}/player${url.search}`);
	redirect(307, dest);
}
