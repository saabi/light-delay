/**
 * Take.productionGate helpers: validation, take resolution, plan derivation.
 * Shared by validate-data, validateScript, plan builder, and stretch jobs.
 */

export const KNOWN_PRODUCTION_GATE_REASON_CODES = Object.freeze([
	'awaiting_reference_asset',
	'awaiting_motion_reference',
	'author_hold'
]);

export const PRODUCTION_GATE_STATUSES = Object.freeze(['eligible', 'deferred', 'blocked']);

/**
 * @param {any} take
 * @returns {'eligible' | 'deferred' | 'blocked'}
 */
export function effectiveProductionGateStatus(take) {
	const status = take?.productionGate?.status;
	if (status === 'deferred' || status === 'blocked' || status === 'eligible') return status;
	return 'eligible';
}

/**
 * @param {any} take
 */
export function isProductionGateHold(take) {
	const status = effectiveProductionGateStatus(take);
	return status === 'deferred' || status === 'blocked';
}

/**
 * Resolve source take ids for a shot (selected only — no first-take fallback).
 * @param {{ selectedTakeId?: string }} shot
 * @returns {{ takeIds: string[], missingSelectedTake: boolean }}
 */
export function resolveShotSourceTakeIds(shot) {
	if (!shot?.selectedTakeId) return { takeIds: [], missingSelectedTake: true };
	return { takeIds: [shot.selectedTakeId], missingSelectedTake: false };
}

/**
 * Resolve source take ids for a stretch member (explicit takeIds or selected).
 * @param {{ takeScope?: string, takeIds?: string[], shotId: string }} member
 * @param {{ selectedTakeId?: string } | undefined} shot
 */
export function resolveStretchMemberSourceTakeIds(member, shot) {
	if (member?.takeScope === 'explicit') {
		const takeIds = Array.isArray(member.takeIds) ? [...member.takeIds] : [];
		return { takeIds, missingSelectedTake: false };
	}
	return resolveShotSourceTakeIds(shot || {});
}

/**
 * @param {Map<string, any> | Record<string, any> | undefined | null} assetsById
 * @param {string} assetId
 */
function catalogAsset(assetsById, assetId) {
	if (!assetsById) return null;
	if (assetsById instanceof Map) return assetsById.get(assetId) ?? null;
	return assetsById[assetId] ?? null;
}

/**
 * @param {Map<string, any> | Record<string, any> | undefined | null} manifestById
 * @param {string} assetId
 */
function manifestEntry(manifestById, assetId) {
	if (!manifestById) return null;
	if (manifestById instanceof Map) return manifestById.get(assetId) ?? null;
	return manifestById[assetId] ?? null;
}

/**
 * Prerequisite resolve + non-runnable status blockers (does not include the hold itself).
 * @param {string[]} prerequisiteAssetIds
 * @param {{
 *   assetIds?: Set<string>,
 *   assetsById?: Map<string, any> | Record<string, any>,
 *   manifestIds?: Set<string>,
 *   manifestById?: Map<string, any> | Record<string, any>
 * }} ctx
 * @returns {{ errors: string[], blockers: string[] }}
 */
export function evaluatePrerequisiteAssets(prerequisiteAssetIds, ctx = {}) {
	/** @type {string[]} */
	const errors = [];
	/** @type {string[]} */
	const blockers = [];
	const seen = new Set();
	for (const id of prerequisiteAssetIds || []) {
		if (!id) {
			errors.push('empty_prerequisite_id');
			continue;
		}
		if (seen.has(id)) {
			errors.push(`duplicate_prerequisite:${id}`);
			continue;
		}
		seen.add(id);
		const inCatalog = ctx.assetIds?.has(id) || Boolean(catalogAsset(ctx.assetsById, id));
		const inManifest = ctx.manifestIds?.has(id) || Boolean(manifestEntry(ctx.manifestById, id));
		if (!inCatalog && !inManifest) {
			errors.push(`unknown_prerequisite:${id}`);
			continue;
		}
		const asset = catalogAsset(ctx.assetsById, id);
		if (asset?.imageStatus?.status && asset.imageStatus.status !== 'current') {
			blockers.push(`prerequisite_asset_not_current:${id}`);
		}
		const row = manifestEntry(ctx.manifestById, id);
		if (row?.status === 'rejected') blockers.push(`prerequisite_manifest_rejected:${id}`);
		if (row?.status === 'deprecated') blockers.push(`prerequisite_manifest_deprecated:${id}`);
	}
	return { errors, blockers };
}

/**
 * Structural validation of Take.productionGate (errors + unknown-code warnings).
 * @param {any} take
 * @param {string} label
 * @param {{
 *   assetIds?: Set<string>,
 *   assetsById?: Map<string, any>,
 *   manifestIds?: Set<string>,
 *   manifestById?: Map<string, any>
 * }} ctx
 */
export function collectProductionGateValidation(take, label, ctx = {}) {
	/** @type {string[]} */
	const errors = [];
	/** @type {string[]} */
	const warnings = [];
	const gate = take?.productionGate;
	if (gate == null) return { errors, warnings };

	const status = gate.status;
	if (!PRODUCTION_GATE_STATUSES.includes(status)) {
		errors.push(`${label}: invalid productionGate.status ${status}`);
		return { errors, warnings };
	}

	const reasonCode = typeof gate.reasonCode === 'string' ? gate.reasonCode.trim() : '';
	const reasonEn =
		typeof gate.reason?.en === 'string'
			? gate.reason.en.trim()
			: typeof gate.reason === 'string'
				? gate.reason.trim()
				: '';
	const prereqs = Array.isArray(gate.prerequisiteAssetIds) ? gate.prerequisiteAssetIds : [];

	if (status === 'eligible') {
		if (reasonCode) errors.push(`${label}: eligible productionGate must not carry reasonCode`);
		if (reasonEn) errors.push(`${label}: eligible productionGate must not carry reason`);
		if (prereqs.length)
			errors.push(`${label}: eligible productionGate must not carry prerequisiteAssetIds`);
		return { errors, warnings };
	}

	if (!reasonCode) errors.push(`${label}: productionGate.${status} requires reasonCode`);
	else if (!KNOWN_PRODUCTION_GATE_REASON_CODES.includes(reasonCode)) {
		warnings.push(`${label}: unknown productionGate.reasonCode ${reasonCode}`);
	}
	if (!reasonEn) errors.push(`${label}: productionGate.${status} requires English reason`);

	if (status === 'deferred') {
		if (prereqs.length < 1) {
			errors.push(`${label}: deferred productionGate requires prerequisiteAssetIds`);
		} else {
			const evalResult = evaluatePrerequisiteAssets(prereqs, ctx);
			for (const err of evalResult.errors) errors.push(`${label}: ${err}`);
		}
	}
	if (status === 'blocked' && prereqs.length > 0) {
		errors.push(`${label}: blocked productionGate must not carry prerequisiteAssetIds`);
	}

	return { errors, warnings };
}

/**
 * Plan/stretch blockers + derived generationGate from resolved takes.
 * @param {any[]} takes
 * @param {{
 *   assetsById?: Map<string, any>,
 *   manifestById?: Map<string, any>
 * }} [ctx]
 */
export function deriveGenerationGateFromTakes(takes, ctx = {}) {
	const holds = (takes || []).filter((t) => isProductionGateHold(t));
	if (!holds.length) {
		return { blockers: /** @type {string[]} */ ([]), generationGate: null, prerequisiteBlockers: [] };
	}

	/** Prefer deferred over blocked when mixed for the derived status label. */
	const deferred = holds.filter((t) => effectiveProductionGateStatus(t) === 'deferred');
	const primary = deferred[0] || holds[0];
	const status = effectiveProductionGateStatus(primary);
	const takeIds = [...new Set(holds.map((t) => t.id).filter(Boolean))];
	const reasonCode = primary.productionGate?.reasonCode || 'author_hold';
	const prerequisiteAssetIds = [
		...new Set(
			holds.flatMap((t) =>
				effectiveProductionGateStatus(t) === 'deferred'
					? t.productionGate?.prerequisiteAssetIds || []
					: []
			)
		)
	];

	/** @type {string[]} */
	const blockers = [];
	if (status === 'deferred') blockers.push('generation_deferred');
	if (status === 'blocked') blockers.push('generation_blocked');
	for (const take of holds) {
		const st = effectiveProductionGateStatus(take);
		if (st === 'deferred') blockers.push(`generation_deferred:${take.id}`);
		if (st === 'blocked') blockers.push(`generation_blocked:${take.id}`);
	}

	const prereqEval = evaluatePrerequisiteAssets(prerequisiteAssetIds, {
		assetsById: ctx.assetsById,
		manifestById: ctx.manifestById,
		assetIds: ctx.assetsById instanceof Map ? new Set(ctx.assetsById.keys()) : undefined,
		manifestIds: ctx.manifestById instanceof Map ? new Set(ctx.manifestById.keys()) : undefined
	});
	blockers.push(...prereqEval.blockers);

	/** @type {any} */
	const generationGate = {
		status,
		takeIds,
		reasonCode,
		...(status === 'deferred' ? { prerequisiteAssetIds } : {})
	};

	return {
		blockers: [...new Set(blockers)],
		generationGate,
		prerequisiteBlockers: prereqEval.blockers
	};
}

/**
 * @param {string} shotId
 * @param {string[]} takeIds
 * @param {'deferred' | 'blocked'} status
 */
export function stretchMemberGateBlockers(shotId, takeIds, status) {
	const prefix = status === 'deferred' ? 'member_generation_deferred' : 'member_generation_blocked';
	const blockers = [`${prefix}:${shotId}`];
	for (const takeId of takeIds) blockers.push(`${prefix}_take:${takeId}`);
	return blockers;
}

/**
 * Human-readable prerequisite origin for UI.
 * @param {string} assetId
 * @param {{ assetsById?: Map<string, any>, manifestById?: Map<string, any> }} ctx
 */
export function describePrerequisiteStatus(assetId, ctx = {}) {
	const asset = catalogAsset(ctx.assetsById, assetId);
	const row = manifestEntry(ctx.manifestById, assetId);
	if (asset) {
		const imageStatus = asset.imageStatus?.status || 'current';
		return { origin: 'catalog', status: imageStatus, assetId };
	}
	if (row) {
		return { origin: 'manifest', status: row.status || 'draft', assetId };
	}
	return { origin: 'unknown', status: 'missing', assetId };
}
