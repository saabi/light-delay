import { base } from '$app/paths';
import { deLocalizeUrl, getLocale, localizeHref, type Locale } from '$lib/paraglide/runtime.js';

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

/** Build an app route for the active (or requested) interface locale. */
export function withLocale(path: string, locale: Locale = getLocale()): string {
	if (!path || EXTERNAL_OR_FRAGMENT.test(path) || !path.startsWith('/')) return path;
	const localized = localizeHref(withBase(path), { locale });
	const misplacedPrefix = base ? `/${locale}${base}` : '';
	if (
		misplacedPrefix &&
		(localized === misplacedPrefix || localized.startsWith(`${misplacedPrefix}/`))
	) {
		return `${base}/${locale}${localized.slice(misplacedPrefix.length)}`;
	}
	return localized;
}

/** Canonical route pathname without locale or deployment base prefixes. */
export function canonicalPathname(url: URL): string {
	return withoutBase(deLocalizeUrl(url).pathname);
}

/** Switch locale while retaining the current canonical route, query, and hash. */
export function localeSwitchHref(url: URL, locale: Locale): string {
	const canonical = deLocalizeUrl(url);
	const localized = new URL(localizeHref(canonical.href, { locale }));
	return `${localized.pathname}${localized.search}${localized.hash}`;
}
