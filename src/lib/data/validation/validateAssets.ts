import type { ValidationResult } from '$lib/types/common';
import type { AssetsFile } from '$lib/types/assets';

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
	}

	return { ok: errors.length === 0, errors };
}
