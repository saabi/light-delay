/**
 * Load JSON via static Vite/TS `resolveJsonModule` imports or a relative/module URL.
 * Prefer repository modules that import from `data/*.json` at build time.
 */
export async function loadJson<T>(source: string | T): Promise<T> {
	if (typeof source !== 'string') {
		return source;
	}

	const mod = await import(/* @vite-ignore */ source);
	return (mod.default ?? mod) as T;
}

export function assertJsonModule<T>(value: T, label: string): T {
	if (value == null || typeof value !== 'object') {
		throw new Error(`Expected JSON object for ${label}`);
	}
	return value;
}
