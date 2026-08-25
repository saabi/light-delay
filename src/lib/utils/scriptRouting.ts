import { decodeScriptId, encodeScriptId } from './scriptId';

export const ACTIVE_SCRIPT_STORAGE_KEY = 'light-delay.activeScriptId';

export function readStoredScriptId(): string | null {
	if (typeof sessionStorage === 'undefined') return null;
	try {
		return sessionStorage.getItem(ACTIVE_SCRIPT_STORAGE_KEY);
	} catch {
		return null;
	}
}

export function writeStoredScriptId(scriptId: string): void {
	if (typeof sessionStorage === 'undefined') return;
	try {
		sessionStorage.setItem(ACTIVE_SCRIPT_STORAGE_KEY, scriptId);
	} catch {
		// ignore quota / private mode
	}
}

export function resolveActiveScriptId(options: {
	paramEncoded?: string | null;
	storedId?: string | null;
	canonicalId: string;
	registeredIds: readonly string[];
}): string {
	const registered = new Set(options.registeredIds);
	if (options.paramEncoded) {
		const decoded = decodeScriptId(options.paramEncoded);
		if (registered.has(decoded)) return decoded;
	}
	if (options.storedId && registered.has(options.storedId)) return options.storedId;
	if (registered.has(options.canonicalId)) return options.canonicalId;
	return options.registeredIds[0] ?? options.canonicalId;
}

/**
 * Keep the same section when switching cuts on script/animatic/player routes;
 * otherwise land on the chosen script page.
 */
export function hrefAfterScriptSwitch(pathname: string, newScriptId: string): string {
	const encoded = encodeScriptId(newScriptId);
	if (/^\/animatic\/[^/]+\/player\/?$/.test(pathname)) {
		return `/animatic/${encoded}/player`;
	}
	if (/^\/animatic(\/[^/]+)?\/?$/.test(pathname)) {
		return `/animatic/${encoded}`;
	}
	if (/^\/script(\/[^/]+)?\/?$/.test(pathname)) {
		return `/script/${encoded}`;
	}
	return `/script/${encoded}`;
}

export function scriptSectionHref(section: 'script' | 'animatic', scriptId: string): string {
	return `/${section}/${encodeScriptId(scriptId)}`;
}
