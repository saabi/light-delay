import { redirect } from '@sveltejs/kit';
import { getProject } from '$lib/data/repositories/index';
import { encodeScriptId } from '$lib/utils/scriptId';

export function load() {
	const canonical = getProject().project.canonicalScriptId;
	redirect(307, `/animatic/${encodeScriptId(canonical)}`);
}
