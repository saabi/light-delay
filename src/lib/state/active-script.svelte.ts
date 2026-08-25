import { getProject, listScripts } from '$lib/data/repositories/index';
import {
	readStoredScriptId,
	resolveActiveScriptId,
	writeStoredScriptId
} from '$lib/utils/scriptRouting';

let storedId = $state<string | null>(readStoredScriptId());

export function activeScriptIdFromParam(paramEncoded: string | null | undefined): string {
	const project = getProject().project;
	return resolveActiveScriptId({
		paramEncoded: paramEncoded ?? null,
		storedId,
		canonicalId: project.canonicalScriptId,
		registeredIds: listScripts().map((s) => s.id)
	});
}

export function setActiveScriptId(scriptId: string): void {
	storedId = scriptId;
	writeStoredScriptId(scriptId);
}
