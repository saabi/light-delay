/**
 * Take.productionGate helpers: validation, take resolution, plan derivation.
 * Shared by validate-data, validateScript, plan builder, and stretch jobs.
 */

export const KNOWN_PRODUCTION_GATE_REASON_CODES = Object.freeze([
	'awaiting_reference_asset',
	'awaiting_motion_reference',
	'author_hold',
	'video_deferred_external_reference'
]);

export const PRODUCTION_GATE_STATUSES = Object.freeze(['eligible', 'deferred', 'blocked']);

/**
 * Media a hold can apply to. Absent ⇒ 'all' (legacy behaviour: blocks stills and video).
 * 'still' blocks still/keyframe generation only; 'video' blocks Seedance/video jobs only and
 * never makes a still job non-runnable.
 */
export const PRODUCTION_GATE_MEDIA = Object.freeze(['all', 'still', 'video']);

/**
 * @param {any} take
 * @returns {'all' | 'still' | 'video'}
 */
export function productionGateMedium(take) {
	const medium = take?.productionGate?.medium;
	if (medium === 'still' || medium === 'video') return medium;
	return 'all';
}

/**
 * Whether a take's hold applies to the requested medium.
 * @param {any} take
 * @param {'all' | 'still' | 'video' | undefined} [medium] undefined ⇒ any medium
 * @param {{ exclusive?: boolean }} [opts] exclusive ⇒ only holds scoped exactly to `medium` (not 'all')
 */
export function gateAppliesToMedium(take, medium, opts = {}) {
	const holdMedium = productionGateMedium(take);
	if (!medium || medium === 'all') return opts.exclusive ? holdMedium === 'all' : true;
	if (opts.exclusive) return holdMedium === medium;
	return holdMedium === 'all' || holdMedium === medium;
}

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
 * @param {'all' | 'still' | 'video'} [medium] when given, only holds applying to that medium count
 * @param {{ exclusive?: boolean }} [opts]
 */
export function isProductionGateHold(take, medium, opts = {}) {
	const status = effectiveProductionGateStatus(take);
	if (!(status === 'deferred' || status === 'blocked')) return false;
	return gateAppliesToMedium(take, medium, opts);
}

/**
 * Blocker-code suffix for a hold's medium ('' for legacy all-media holds).
 * @param {any} take
 */
export function gateMediumTag(take) {
	const medium = productionGateMedium(take);
	return medium === 'all' ? '' : `:${medium}`;
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
	if (gate.medium != null && !PRODUCTION_GATE_MEDIA.includes(gate.medium)) {
		errors.push(`${label}: invalid productionGate.medium ${gate.medium}`);
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
 *
 * `opts.medium` selects which holds count: 'still' ⇒ holds scoped 'all' or 'still';
 * 'video' ⇒ holds scoped 'all' or 'video'; undefined ⇒ every hold (legacy).
 * `opts.exclusive` restricts to holds scoped exactly to `opts.medium` (used by the plan
 * builder to emit a separate video-only gate that never touches still readiness).
 * Blocker codes carry the hold's medium tag (`generation_deferred:video`) when the hold is
 * not all-media, so a still job can never be blocked by a video-only hold.
 *
 * @param {any[]} takes
 * @param {{
 *   assetsById?: Map<string, any>,
 *   manifestById?: Map<string, any>
 * }} [ctx]
 * @param {{ medium?: 'all' | 'still' | 'video', exclusive?: boolean }} [opts]
 */
export function deriveGenerationGateFromTakes(takes, ctx = {}, opts = {}) {
	const holds = (takes || []).filter((t) => isProductionGateHold(t, opts.medium, opts));
	if (!holds.length) {
		return { blockers: /** @type {string[]} */ ([]), generationGate: null, prerequisiteBlockers: [] };
	}

	/** Prefer deferred over blocked when mixed for the derived status label. */
	const deferred = holds.filter((t) => effectiveProductionGateStatus(t) === 'deferred');
	const primary = deferred[0] || holds[0];
	const status = effectiveProductionGateStatus(primary);
	const takeIds = [...new Set(holds.map((t) => t.id).filter(Boolean))];
	const reasonCode = primary.productionGate?.reasonCode || 'author_hold';
	/** Derived medium: 'all' when any counted hold is all-media, else the shared scoped medium. */
	const media = new Set(holds.map((t) => productionGateMedium(t)));
	const medium = media.has('all') || media.size > 1 ? 'all' : [...media][0];
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
	const primaryTag = gateMediumTag(primary);
	if (status === 'deferred') blockers.push(`generation_deferred${primaryTag}`);
	if (status === 'blocked') blockers.push(`generation_blocked${primaryTag}`);
	for (const take of holds) {
		const st = effectiveProductionGateStatus(take);
		const tag = gateMediumTag(take);
		if (st === 'deferred') blockers.push(`generation_deferred${tag}:${take.id}`);
		if (st === 'blocked') blockers.push(`generation_blocked${tag}:${take.id}`);
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
		medium,
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
 * @param {'all' | 'still' | 'video'} [medium] hold medium; 'still'/'video' tag the codes
 */
export function stretchMemberGateBlockers(shotId, takeIds, status, medium = 'all') {
	const tag = medium === 'still' || medium === 'video' ? `:${medium}` : '';
	const base = status === 'deferred' ? 'member_generation_deferred' : 'member_generation_blocked';
	const blockers = [`${base}${tag}:${shotId}`];
	for (const takeId of takeIds) blockers.push(`${base}_take${tag}:${takeId}`);
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
