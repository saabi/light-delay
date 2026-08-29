/**
 * Browser-safe editorial readiness classifiers (no Node APIs).
 * Shared by the SvelteKit app and Node report scripts.
 */
import { sourceLocalizedString } from './localized-string.mjs';

export const REGEN_IMAGE_STATUS = {
	status: 'needs_regeneration',
	reasons: ['canon_mismatch'],
	explanation: {
		es: 'Still desactualizado tras el cambio de orientación de la Ardor (cubiertas perpendiculares al progrado) y la revisión visual de exteriores; regenerar la toma.',
		en: 'Still outdated after the Ardor orientation change (decks perpendicular to prograde) and exterior visual review; regenerate the take.'
	},
	replacementBrief: {
		es: 'Regenerar coherente con la arquitectura actual (empuje = arriba), encuadre y descripción de la toma; no reutilizar frames previos del animatic.',
		en: 'Regenerate consistent with current architecture (thrust = up), framing, and shot description; do not reuse prior animatic frames.'
	}
};

export const BEAT_PLACEHOLDER_RE = /1 beat por escena/i;
export const ANIMATIC_PLACEHOLDER_ASSET_ID = 'asset:animatic-placeholder-missing-frame';

/** @param {unknown} value */
function text(value) {
	return sourceLocalizedString(value) ?? (typeof value === 'string' ? value : '');
}

/** @param {import('../../src/lib/types/script.ts').Shot} shot */
export function shotCompletenessFlags(shot) {
	const flags = [];
	const purpose = text(shot.purpose);
	const description = text(shot.description);
	const framing = text(shot.composition?.framing);
	const movementDescription = text(shot.camera?.movementDescription);
	if (!purpose.trim()) flags.push('missing_purpose');
	const cameraMissing = !shot.camera || (!shot.camera.movement && !movementDescription.trim());
	if (cameraMissing) flags.push('missing_camera');
	if (!description.trim() || description.trim().length < 20) flags.push('thin_description');
	if (!framing.trim()) flags.push('missing_framing');
	return flags;
}

/** @param {import('../../src/lib/types/script.ts').Take | undefined} take */
export function takeNeedsRegeneration(take) {
	if (!take?.imageStatus) return false;
	return take.imageStatus.status !== 'current';
}

/**
 * @param {import('../../src/lib/types/script.ts').Shot} shot
 * @param {import('../../src/lib/types/script.ts').Take | undefined} take
 */
export function shotReadinessChips(shot, take) {
	const chips = [];
	if (takeNeedsRegeneration(take)) chips.push('regenerate');
	for (const flag of shotCompletenessFlags(shot)) {
		if (flag === 'missing_purpose') chips.push('missing_purpose');
		if (flag === 'missing_camera') chips.push('missing_camera');
	}
	return chips;
}

/** @param {import('../../src/lib/types/script.ts').ScriptFile} script */
export function countTakesNeedingRegeneration(script) {
	return script.takes.filter((t) => takeNeedsRegeneration(t)).length;
}
