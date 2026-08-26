import { base } from '$app/paths';

const EXTERNAL_OR_FRAGMENT = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\?)/i;

/** Prefix an app-local absolute path with SvelteKit's configured base path. */
export function withBase(path: string): string {
	if (!path || EXTERNAL_OR_FRAGMENT.test(path) || !path.startsWith('/')) return path;
	if (base && (path === base || path.startsWith(`${base}/`))) return path;
	if (path === '/') return base || '/';
	return `${base}${path}`;
}

/** Remove the configured base path before matching application route patterns. */
export function withoutBase(pathname: string): string {
	if (!base) return pathname || '/';
	if (pathname === base) return '/';
	if (pathname.startsWith(`${base}/`)) return pathname.slice(base.length) || '/';
	return pathname || '/';
}
