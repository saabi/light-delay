import type { ValidationResult } from '$lib/types/common';
import type { AssetsFile } from '$lib/types/assets';
import type { ImageEditorialStatus } from '$lib/types/assets';
import { sourceStoryText } from './localizedString.ts';

const IMAGE_STATES = new Set([
	'current',
	'needs_review',
	'needs_replacement',
	'needs_regeneration'
]);
const IMAGE_REASONS = new Set([
	'canon_mismatch',
	'wrong_composition',
	'continuity_error',
	'placeholder',
	'quality',
	'missing_subject'
]);

export function validateImageEditorialStatus(
	status: ImageEditorialStatus,
	label: string,
	errors: string[]
) {
	if (!IMAGE_STATES.has(status.status))
		errors.push(`${label}: invalid image status ${status.status}`);
	if (!Array.isArray(status.reasons) || status.reasons.length === 0) {
		errors.push(`${label}: image status requires at least one reason`);
	} else {
		for (const reason of status.reasons) {
			if (!IMAGE_REASONS.has(reason)) errors.push(`${label}: invalid image reason ${reason}`);
		}
	}
	if (status.status !== 'current' && !sourceStoryText(status.explanation)?.trim()) {
		errors.push(`${label}: non-current image status requires an explanation`);
	}
}

export function validateAssets(file: AssetsFile): ValidationResult {
	const errors: string[] = [];
	if (!file?.schemaVersion) errors.push('assets: missing schemaVersion');
	if (!Array.isArray(file?.assets)) {
		errors.push('assets: missing assets array');
		return { ok: false, errors };
	}

	const ids = new Set<string>();
	for (const asset of file.assets) {
		if (!asset.id) {
			errors.push('assets: asset without id');
			continue;
		}
		if (ids.has(asset.id)) errors.push(`assets: duplicate id ${asset.id}`);
		ids.add(asset.id);
		if (!asset.path) {
			errors.push(`assets: ${asset.id} missing path`);
		} else if (!asset.path.startsWith('/assets/')) {
			errors.push(`assets: ${asset.id} path must start with /assets/ (got "${asset.path}")`);
		}
		if (!asset.kind) errors.push(`assets: ${asset.id} missing kind`);
		if (!asset.role) errors.push(`assets: ${asset.id} missing role`);
		if (asset.role === 'animatic_placeholder' && asset.kind !== 'image') {
			errors.push(`assets: ${asset.id} animatic_placeholder must be an image`);
		}
		if (asset.imageStatus)
			validateImageEditorialStatus(asset.imageStatus, `assets: ${asset.id}`, errors);
	}

	return { ok: errors.length === 0, errors };
}
