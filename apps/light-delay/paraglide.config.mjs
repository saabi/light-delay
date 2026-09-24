/** @returns {import('@inlang/paraglide-js').CompilerOptions} */
export function paraglideOptions(base = resolveBase(process.env.BASE_PATH)) {
	return {
		project: './project.inlang',
		outdir: './src/lib/paraglide',
		emitTsDeclarations: true,
		strategy: ['url', 'baseLocale'],
		trailingSlash: 'always',
		isServer: "import.meta.env?.SSR ?? typeof window === 'undefined'",
		urlPatterns: [
			{
				pattern: `:protocol://:domain(.*)::port?${base}/:path(.*)?`,
				localized: [
					['es', `:protocol://:domain(.*)::port?${base}/es/:path(.*)?`],
					['en', `:protocol://:domain(.*)::port?${base}/:path(.*)?`]
				]
			}
		]
	};
}

/**
 * @param {string | undefined} configuredBase
 * @returns {'' | `/${string}`}
 */
export function resolveBase(configuredBase) {
	if (!configuredBase || configuredBase === '/') return '';
	if (!configuredBase.startsWith('/') || configuredBase.endsWith('/')) {
		throw new Error('BASE_PATH must start with "/" and must not end with "/"');
	}
	return /** @type {`/${string}`} */ (configuredBase);
}
