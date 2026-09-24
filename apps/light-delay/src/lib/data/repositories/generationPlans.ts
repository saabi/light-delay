import type { GenerationPlanFile } from '$lib/types/generated/production';
import type { Asset, ImageEditorialStatus } from '$lib/types/assets';
import type { ScriptId } from '$lib/types/ids';
import { assertJsonModule } from '../loaders/loadJson.ts';
import { getAssetById } from './lookups';

const planGlob = import.meta.glob('$project-data/production/plans/*.json', {
	eager: true,
	import: 'default'
}) as Record<string, GenerationPlanFile>;

const PLAN_BY_SCRIPT_ID: Record<string, GenerationPlanFile> = {};
for (const [path, mod] of Object.entries(planGlob)) {
	const match = path.match(/([^/\\]+)\.json$/);
	if (!match) continue;
	const slug = match[1];
	const plan = assertJsonModule(mod, `production/plans/${slug}`);
	const scriptId = plan.plan?.scriptId;
	if (typeof scriptId === 'string' && scriptId.length) {
		PLAN_BY_SCRIPT_ID[scriptId] = plan;
	}
	PLAN_BY_SCRIPT_ID[`script:${slug}`] = plan;
}

/** Keys only — does not import file bytes into the client bundle. */
const STATIC_ASSET_FILES = import.meta.glob('$project-static/assets/**/*', {
	query: '?url'
});

const STATIC_CATALOG_PATHS = new Set(
	Object.keys(STATIC_ASSET_FILES)
		.map(globKeyToCatalogPath)
		.filter((path): path is string => Boolean(path))
);

export function listGenerationPlanScriptIds(): string[] {
	return [...new Set(Object.keys(PLAN_BY_SCRIPT_ID))].sort();
}

export function getGenerationPlan(scriptId: ScriptId | string): GenerationPlanFile | undefined {
	return PLAN_BY_SCRIPT_ID[scriptId] ?? PLAN_BY_SCRIPT_ID[`script:${scriptId}`];
}

export type AssetPresenceKind = Asset['kind'] | 'unknown';

export type AssetPresenceStatus =
	| 'current'
	| 'needs_review'
	| 'needs_regeneration'
	| 'needs_replacement'
	| 'invalid_kind'
	| 'missing_file'
	| 'invalid_path'
	| 'missing_catalog_entry';

export type ResolvedAssetPresence = {
	assetId: string;
	present: boolean;
	path: string | null;
	kind: AssetPresenceKind;
	status: AssetPresenceStatus;
	asset: Asset | undefined;
};

export type ResolveAssetPresenceOptions = {
	expectedKind?: Asset['kind'];
	imageStatusOverride?: ImageEditorialStatus;
};

export function globKeyToCatalogPath(key: string): string | null {
	const normalized = key.replace(/\\/g, '/').replace(/^\$project-static\//, 'static/');
	const match = normalized.match(/(?:^|\/)static\/(assets\/.*)$/);
	return match ? `/${match[1]}` : null;
}

export function catalogPathIsSafe(path: string): boolean {
	if (!path.startsWith('/assets/')) return false;
	if (path.includes('..') || path.includes('\\') || path.includes('://')) return false;
	return true;
}

export function catalogFileExists(path: string): boolean {
	return STATIC_CATALOG_PATHS.has(path);
}

export function editorialStatusFromImageStatus(
	imageStatus: ImageEditorialStatus | undefined
): Extract<
	AssetPresenceStatus,
	'current' | 'needs_review' | 'needs_regeneration' | 'needs_replacement'
> {
	const status = imageStatus?.status;
	if (status === 'needs_review' || status === 'needs_regeneration' || status === 'needs_replacement') {
		return status;
	}
	return 'current';
}

/**
 * Resolve catalog + disk + kind + editorial status for a generation ref or output.
 * `present` means the browser can load a file of the expected medium.
 */
export function resolveAssetPresence(
	assetId: string | null | undefined,
	asset: Asset | undefined,
	options: ResolveAssetPresenceOptions = {}
): ResolvedAssetPresence {
	if (!assetId) {
		return {
			assetId: '',
			present: false,
			path: null,
			kind: 'unknown',
			status: 'missing_catalog_entry',
			asset: undefined
		};
	}
	if (!asset) {
		return {
			assetId,
			present: false,
			path: null,
			kind: 'unknown',
			status: 'missing_catalog_entry',
			asset: undefined
		};
	}
	const rawPath = asset.path?.trim() || '';
	if (!rawPath || !catalogPathIsSafe(rawPath)) {
		return {
			assetId,
			present: false,
			path: rawPath || null,
			kind: asset.kind ?? 'unknown',
			status: 'invalid_path',
			asset
		};
	}
	if (!catalogFileExists(rawPath)) {
		return {
			assetId,
			present: false,
			path: rawPath,
			kind: asset.kind ?? 'unknown',
			status: 'missing_file',
			asset
		};
	}
	if (options.expectedKind && asset.kind !== options.expectedKind) {
		return {
			assetId,
			present: false,
			path: rawPath,
			kind: asset.kind ?? 'unknown',
			status: 'invalid_kind',
			asset
		};
	}
	const imageStatus = options.imageStatusOverride ?? asset.imageStatus;
	return {
		assetId,
		present: true,
		path: rawPath,
		kind: asset.kind ?? 'unknown',
		status: editorialStatusFromImageStatus(imageStatus),
		asset
	};
}

export function resolveRefPresence(
	assetId: string | null | undefined,
	options: ResolveAssetPresenceOptions = {}
): ResolvedAssetPresence {
	if (!assetId) return resolveAssetPresence(assetId, undefined, options);
	return resolveAssetPresence(assetId, getAssetById(assetId), options);
}
