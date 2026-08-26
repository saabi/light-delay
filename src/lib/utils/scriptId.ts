import { decodeRouteId, encodeRouteId } from './routeId';

/**
 * Route-safe encoding for script IDs: `:` ↔ `~`.
 * Example: script:light-delay-main-short → script~light-delay-main-short
 */
export function encodeScriptId(scriptId: string): string {
	return encodeRouteId(scriptId);
}

export function decodeScriptId(encoded: string): string {
	return decodeRouteId(encoded);
}
