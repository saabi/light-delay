/**
 * Pure spoken-dialogue duration estimation (WPM heuristics).
 * Shared by the SvelteKit app (TS re-export) and Node report scripts.
 */

/** @type {ReadonlySet<string>} */
export const OFF_CAMERA_PRESENTATIONS = new Set([
	'off_screen',
	'voice_over',
	'radio',
	'intercom',
	'recording',
	'telepathic',
	'synthetic'
]);

/** @type {Record<string, number>} */
export const PACE_MULTIPLIERS = {
	slow: 1.25,
	measured: 1.1,
	normal: 1,
	fast: 0.85
};

export const SPOKEN_FLOOR_MS = 400;
export const ROUND_MS = 100;

export const MONTAGE_SURPLUS_THRESHOLD_MS = 5000;
export const MONTAGE_SURPLUS_SPOKEN_RATIO = 0.3;
export const SILENT_LONG_SHOT_MS = 8000;

/**
 * @param {string} language
 * @returns {number}
 */
export function wpmForLanguage(language) {
	if (language === 'es') return 150;
	if (language === 'en') return 160;
	return 155;
}

/**
 * @param {string | undefined} pace
 * @returns {number}
 */
export function paceMultiplier(pace) {
	if (!pace) return 1;
	return PACE_MULTIPLIERS[pace] ?? 1;
}

/**
 * @param {string | undefined} text
 * @returns {number}
 */
export function wordCount(text) {
	if (!text?.trim()) return 0;
	const matches = text.match(/\p{L}+/gu);
	return matches?.length ?? 0;
}

/**
 * @param {number} ms
 * @returns {number}
 */
export function roundSpokenMs(ms) {
	return Math.round(ms / ROUND_MS) * ROUND_MS;
}

/**
 * @param {string} text
 * @param {string} language
 * @param {number} [paceFactor=1]
 * @returns {number}
 */
export function estimateSpokenMsFromText(text, language, paceFactor = 1) {
	if (!text?.trim()) return 0;
	const words = wordCount(text);
	if (words === 0) return 0;
	const wpm = wpmForLanguage(language);
	const raw = (words / wpm) * 60_000 * paceFactor;
	return roundSpokenMs(Math.max(SPOKEN_FLOOR_MS, raw));
}

/**
 * @param {{ estimatedDurationMs?: number; spokenText?: string }} variant
 * @param {string} language
 * @param {{ pace?: string } | undefined} [performance]
 * @returns {number}
 */
export function estimateDialogueVariantMs(variant, language, performance) {
	if (variant?.estimatedDurationMs !== undefined) {
		return roundSpokenMs(Math.max(0, variant.estimatedDurationMs));
	}
	return estimateSpokenMsFromText(
		variant?.spokenText ?? '',
		language,
		paceMultiplier(performance?.pace)
	);
}

/**
 * @param {string} presentation
 * @returns {boolean}
 */
export function isOffCameraPresentation(presentation) {
	return OFF_CAMERA_PRESENTATIONS.has(presentation);
}
