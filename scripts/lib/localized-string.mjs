/**
 * Resolve co-located LocalizedString / legacy plain string for Node scripts.
 * @param {unknown} value
 * @param {string} language
 * @param {{ sourceLanguage?: string; fallbackLanguage?: string }} [options]
 * @returns {string | undefined}
 */
export function resolveLocalizedString(value, language, options = {}) {
	if (value == null) return undefined;
	if (typeof value === 'string') return value;
	if (typeof value !== 'object' || Array.isArray(value)) return undefined;
	const sourceLanguage = options.sourceLanguage ?? 'es';
	const fallbackLanguage = options.fallbackLanguage ?? sourceLanguage;
	const map = /** @type {Record<string, unknown>} */ (value);
	const requested = map[language];
	if (typeof requested === 'string' && requested.length > 0) return requested;
	const fallback = map[fallbackLanguage];
	if (typeof fallback === 'string' && fallback.length > 0) return fallback;
	const source = map[sourceLanguage];
	if (typeof source === 'string') return source;
	for (const candidate of Object.values(map)) {
		if (typeof candidate === 'string' && candidate.length > 0) return candidate;
	}
	return undefined;
}

/**
 * @param {unknown} value
 * @param {string} [sourceLanguage='es']
 * @returns {string | undefined}
 */
export function sourceLocalizedString(value, sourceLanguage = 'es') {
	return resolveLocalizedString(value, sourceLanguage, { sourceLanguage });
}
