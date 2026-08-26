/** Encode namespaced canonical IDs for portable URL path segments (`:` ↔ `~`). */
export function encodeRouteId(id: string): string {
	return id.replaceAll(':', '~');
}

export function decodeRouteId(encoded: string): string {
	return encoded.replaceAll('~', ':');
}
