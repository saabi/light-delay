/**
 * Pure path helpers for asset thumbnails.
 * Shared by Node scripts and the SvelteKit app (via TS re-export).
 */

const ASSETS_PREFIX = '/assets/';
const THUMBS_PREFIX = '/assets/_thumbs/';

/**
 * @param {string} assetPath Public asset path, e.g. `/assets/locations/foo/concept-sheet.png`
 * @returns {string | undefined} Thumb URL `/assets/_thumbs/.../concept-sheet.webp`, or undefined if not mappable
 */
export function thumbnailPathForAsset(assetPath) {
	if (typeof assetPath !== 'string' || !assetPath.startsWith(ASSETS_PREFIX)) {
		return undefined;
	}
	if (assetPath.startsWith(THUMBS_PREFIX)) {
		return undefined;
	}

	const relative = assetPath.slice(ASSETS_PREFIX.length);
	if (!relative || relative.includes('..')) {
		return undefined;
	}

	const lastSlash = relative.lastIndexOf('/');
	const dir = lastSlash === -1 ? '' : relative.slice(0, lastSlash + 1);
	const file = lastSlash === -1 ? relative : relative.slice(lastSlash + 1);
	if (!file || file === '.' || file === '..') {
		return undefined;
	}

	return `${THUMBS_PREFIX}${dir}${file}.webp`;
}

/**
 * @param {string} assetPath
 * @returns {boolean}
 */
export function isThumbAssetPath(assetPath) {
	return typeof assetPath === 'string' && assetPath.startsWith(THUMBS_PREFIX);
}

/**
 * Relative path under `static/assets/` for a public `/assets/...` URL.
 * @param {string} publicPath
 * @returns {string | undefined}
 */
export function publicAssetToStaticRelative(publicPath) {
	if (typeof publicPath !== 'string' || !publicPath.startsWith(ASSETS_PREFIX)) {
		return undefined;
	}
	return publicPath.slice(ASSETS_PREFIX.length);
}

export const THUMB_MAX_EDGE = 480;
export const THUMB_WEBP_QUALITY = 80;
