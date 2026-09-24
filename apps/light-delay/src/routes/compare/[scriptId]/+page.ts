import { listScripts } from '$lib/data/repositories/index';
import { encodeScriptId } from '$lib/utils/scriptId';
import type { EntryGenerator } from './$types';

export const entries: EntryGenerator = () =>
	listScripts().map((script) => ({ scriptId: encodeScriptId(script.id) }));
