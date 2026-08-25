/**
 * Route-safe encoding for script IDs: `:` ↔ `~`.
 * Example: script:light-delay-main-short → script~light-delay-main-short
 */
export function encodeScriptId(scriptId: string): string {
	return scriptId.replaceAll(':', '~');
}

export function decodeScriptId(encoded: string): string {
	return encoded.replaceAll('~', ':');
}
