import type { GenerationPlanFile } from '$lib/types/generated/production';
import type { Asset } from '$lib/types/assets';
import type { ScriptId } from '$lib/types/ids';
import { assertJsonModule } from '../loaders/loadJson.ts';
import { getAssetById } from './lookups';

const planGlob = import.meta.glob('../../../../data/production/plans/*.json', {
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

export function listGenerationPlanScriptIds(): string[] {
	return [...new Set(Object.keys(PLAN_BY_SCRIPT_ID))].sort();
}

export function getGenerationPlan(scriptId: ScriptId | string): GenerationPlanFile | undefined {
	return PLAN_BY_SCRIPT_ID[scriptId] ?? PLAN_BY_SCRIPT_ID[`script:${scriptId}`];
}

export type AssetPresenceKind = Asset['kind'] | 'unknown';

export type ResolvedAssetPresence = {
	assetId: string;
	present: boolean;
	path: string | null;
	kind: AssetPresenceKind;
	asset: Asset | undefined;
};

/**
 * Catalog presence for a generation reference or output.
 * Present when the asset id resolves and `path` is non-empty.
 */
export function resolveRefPresence(assetId: string | null | undefined): ResolvedAssetPresence {
	if (!assetId) {
		return { assetId: '', present: false, path: null, kind: 'unknown', asset: undefined };
	}
	const asset = getAssetById(assetId);
	const path = asset?.path?.trim() ? asset.path : null;
	return {
		assetId,
		present: Boolean(asset && path),
		path,
		kind: asset?.kind ?? 'unknown',
		asset
	};
}
