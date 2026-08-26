import { decodeScriptId, encodeScriptId } from './scriptId';
import { withBase, withoutBase } from './paths';

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
export function hrefAfterScriptSwitch(
	pathname: string,
	newScriptId: string,
	options: { againstId?: string | null; registeredIds?: readonly string[] } = {}
): string {
	const localPathname = withoutBase(pathname);
	const encoded = encodeScriptId(newScriptId);
	if (/^\/compare\/[^/]+\/?$/.test(localPathname)) {
		const against =
			options.againstId && options.againstId !== newScriptId
				? options.againstId
				: options.registeredIds?.find((id) => id !== newScriptId);
		return withBase(
			against
				? `/compare/${encoded}?against=${encodeURIComponent(against)}`
				: `/compare/${encoded}`
		);
	}
	if (/^\/animatic\/[^/]+\/player\/?$/.test(localPathname)) {
		return withBase(`/animatic/${encoded}/player`);
	}
	if (/^\/animatic(\/[^/]+)?\/?$/.test(localPathname)) {
		return withBase(`/animatic/${encoded}`);
	}
	if (/^\/script(\/[^/]+)?\/?$/.test(localPathname)) {
		return withBase(`/script/${encoded}`);
	}
	return withBase(`/script/${encoded}`);
}

export function scriptSectionHref(section: 'script' | 'animatic', scriptId: string): string {
	return withBase(`/${section}/${encodeScriptId(scriptId)}`);
}
