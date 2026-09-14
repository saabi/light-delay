/**
 * Strip spoken dialogue / subtitle copy from storyboard still prompts.
 * Keeps intentional diegetic UI / title / time-card strings.
 * Does not add avoid/negative boilerplate — omitting dialogue is enough.
 */

/** @type {ReadonlySet<string>} */
const PRESERVE_DIEGETIC = new Set([
	'LIGHT DELAY',
	'23 H 15 MIN',
	'TRANSMITTED',
	'29 HOURS LATER',
	'4—3—2—1',
	'4-3-2-1'
]);

const AVOID_SUBTITLES_CLAUSE =
	/\s*Avoid subtitles, closed captions, burned-in dialogue, speech bubbles, lower-thirds, and any on-image spoken lines\.?/gi;

const NEGATIVE_SUBTITLES_CLAUSE =
	/(?:;\s*)?no subtitles;\s*no closed captions;\s*no burned-in dialogue;\s*no speech bubbles;\s*no lower-thirds;\s*no on-image spoken lines\.?/gi;

/**
 * @param {string} quoted
 */
export function isPreservedDiegeticQuote(quoted) {
	const trimmed = quoted.trim();
	if (PRESERVE_DIEGETIC.has(trimmed)) return true;
	if (trimmed.length <= 48 && !/[a-z]/.test(trimmed) && /[A-Z0-9]/.test(trimmed)) return true;
	return false;
}

/**
 * @param {string} quoted
 */
export function looksLikeSpokenDialogue(quoted) {
	const trimmed = quoted.trim();
	if (!trimmed || isPreservedDiegeticQuote(trimmed)) return false;
	if (/^[A-Za-z][\w'-]*$/.test(trimmed) && trimmed.length <= 16) return false;
	if (/\s/.test(trimmed) && /[a-z]/.test(trimmed)) return true;
	if (/[.!?…,—]/.test(trimmed) && /[a-z]/.test(trimmed)) return true;
	return false;
}

/**
 * @param {string} text
 */
export function stripSpokenDialogueQuotes(text) {
	if (!text) return text;
	let out = text;

	out = out.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

	out = out.replace(/"([^"\n]{1,500})"/g, (full, inner) => {
		if (isPreservedDiegeticQuote(inner)) return `"${inner.trim()}"`;
		if (looksLikeSpokenDialogue(inner)) return '';
		if (/^[A-Za-z][\w'-]*$/.test(inner.trim())) return inner.trim();
		return full;
	});

	out = out.replace(
		/:\s*(?=(Composition:|Setting:|Cast:|Camera:|Frame |Aspect |Avoid |Preserve |Reference assets))/g,
		'. '
	);

	out = out.replace(/:\s+(?=[A-Z])/g, (match, offset, full) => {
		const before = full.slice(Math.max(0, offset - 24), offset);
		// Structured prompt section labels (compilePrompt sections + still-prompt template) are not
		// speaker labels; keep their colons.
		if (
			/\b(Action|Composition|Setting|Cast|Camera|Style|NEG|On frame|Physics|Continuity|Lighting|Diegetic display|Subjects|Location|Interface|Audio|Negative)\s*$/i.test(
				before
			)
		)
			return match;
		return '. ';
	});

	out = out.replace(/\b(?:and\s+)?(says|said|asks|asked|mutters),?\s*(?=\.|$)/gi, '');
	out = out.replace(/\s+\b(?:and\s+)?(says|said|asks|asked|mutters),?\s+(?=Only\b|[A-Z])/gi, '. ');

	out = out.replace(/\bwhen the word\s+\w+\s+lands\b/gi, 'when that accusation lands');
	out = out.replace(/\bwhen the word\s+lands\b/gi, 'when that accusation lands');

	out = out.replace(/([a-z])([A-Z])/g, '$1. $2');

	out = out.replace(/\s{2,}/g, ' ');
	out = out.replace(/\s+([,.;])/g, '$1');
	out = out.replace(/([,;])\s*\./g, '.');
	out = out.replace(/\.\s*\./g, '.');
	out = out.replace(/\s+\./g, '.');
	out = out.replace(/:\s*$/g, '.');
	out = out.replace(/\(\s*\)/g, '');
	out = out.replace(/\s{2,}/g, ' ').trim();
	return out;
}

/**
 * Remove previously injected subtitle-avoid boilerplate (do not re-add it).
 * @param {string} prompt
 */
export function stripSubtitleAvoidBoilerplate(prompt) {
	return prompt.replace(AVOID_SUBTITLES_CLAUSE, ' ').replace(/\s{2,}/g, ' ').trim();
}

/**
 * @param {string | undefined} negative
 */
export function stripSubtitleNegativeBoilerplate(negative) {
	if (!negative) return negative;
	return negative
		.replace(NEGATIVE_SUBTITLES_CLAUSE, '')
		.replace(/\s*;\s*$/g, '')
		.replace(/\s{2,}/g, ' ')
		.trim();
}

/**
 * @param {{ generation?: { prompt?: string, negativePrompt?: string } }} take
 */
export function scrubStillTakeGeneration(take) {
	if (!take?.generation?.prompt) return false;
	const before = take.generation.prompt;
	const beforeNeg = take.generation.negativePrompt ?? '';
	const prompt = stripSubtitleAvoidBoilerplate(stripSpokenDialogueQuotes(before));
	const negative = stripSubtitleNegativeBoilerplate(beforeNeg);
	const changed = prompt !== before || negative !== beforeNeg;
	take.generation.prompt = prompt;
	if (negative !== undefined) take.generation.negativePrompt = negative || undefined;
	return changed;
}
