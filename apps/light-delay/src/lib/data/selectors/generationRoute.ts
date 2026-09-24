import { error } from '@sveltejs/kit';
import { getScript } from '$lib/data/repositories/index';
import * as m from '$lib/paraglide/messages.js';
import type { ScriptId } from '$lib/types/ids';

export function requireGenerationScript(scriptId: string) {
	try {
		getScript(scriptId as ScriptId);
	} catch {
		error(404, m.generation_script_not_found());
	}
}
