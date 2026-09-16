// @ts-nocheck
/**
 * Reference budget + pack coverage diagnostics.
 * Still/video/voice budgets stay independent; attached lists are never silently trimmed.
 * Browser-safe (no node:crypto).
 */

/**
 * @typedef {{ maxImages?: number | null, maxVideos?: number | null, maxAudios?: number | null, maxTotalReferences?: number | null }} ReferenceLimits
 * @typedef {{ kind: 'image' | 'video' | 'audio', id: string, role?: string }} BudgetReference
 * @typedef {{
 *   requiredEntityIds: string[],
 *   coveredEntityIds: string[],
 *   uncoveredEntityIds: string[],
 *   attachedAssetIds: string[],
 *   coveringAssetByEntity: Record<string, string>,
 *   wouldOmitEntityIds: string[],
 *   limits: ReferenceLimits,
 *   violations: string[],
 *   keyframeCoveredEntityIds?: string[],
 *   videoExtraCoveredEntityIds?: string[],
 *   uncoveredVideoEntityIds?: string[]
 * }} ReferenceBudgetDiagnostic
 * @typedef {{
 *   code: 'reference_pack_required',
 *   uncoveredEntityIds: string[],
 *   compatiblePackAssetIds: string[],
 *   packsNeeded: number | null
 * } | {
 *   code: 'reference_consolidation_required',
 *   excessSlots: number,
 *   consolidateCandidateAssetIds: string[]
 * }} ReferenceRemediation
 */

/**
 * @param {BudgetReference[]} references
 * @param {ReferenceLimits} limits
 */
export function checkReferenceBudget(references, limits) {
	const counts = { image: 0, video: 0, audio: 0 };
	for (const reference of references) counts[reference.kind] += 1;
	/** @type {string[]} */
	const violations = [];
	if (limits.maxImages != null && counts.image > limits.maxImages) {
		violations.push(`images:${counts.image}>${limits.maxImages}`);
	}
	if (limits.maxVideos != null && counts.video > limits.maxVideos) {
		violations.push(`videos:${counts.video}>${limits.maxVideos}`);
	}
	if (limits.maxAudios != null && counts.audio > limits.maxAudios) {
		violations.push(`audios:${counts.audio}>${limits.maxAudios}`);
	}
	const total = counts.image + counts.video + counts.audio;
	if (limits.maxTotalReferences != null && total > limits.maxTotalReferences) {
		violations.push(`total:${total}>${limits.maxTotalReferences}`);
	}
	return { counts, total, violations, ok: violations.length === 0 };
}

const ENTITY_KIND_BAND = {
	location: 0,
	vehicle: 1,
	object: 1,
	faction: 1,
	character: 2
};

/**
 * Infer EntityKind band from a namespaced entity id.
 * @param {string} entityId
 * @returns {'character' | 'location' | 'object' | 'vehicle' | 'faction'}
 */
export function entityKindFromId(entityId) {
	if (entityId.startsWith('character:')) return 'character';
	if (entityId.startsWith('location:')) return 'location';
	if (entityId.startsWith('vehicle:')) return 'vehicle';
	if (entityId.startsWith('faction:')) return 'faction';
	if (entityId.startsWith('object:')) return 'object';
	return 'object';
}

/**
 * Visible entities for a shot (primary location always; secondaries only if also in visibleRefs).
 * @param {{
 *   locationId?: string,
 *   secondaryLocationIds?: string[],
 *   visibleRefs?: Array<{ kind?: string, id?: string }>,
 *   offScreenCharacterIds?: string[]
 * }} shot
 * @returns {string[]}
 */
export function collectShotVisibleEntityIds(shot) {
	/** @type {Set<string>} */
	const ids = new Set();
	const offScreen = new Set(shot.offScreenCharacterIds ?? []);
	if (shot.locationId) ids.add(shot.locationId);
	const visibleIds = new Set(
		(shot.visibleRefs || []).map((ref) => ref?.id).filter(Boolean)
	);
	for (const secondaryId of shot.secondaryLocationIds ?? []) {
		if (visibleIds.has(secondaryId)) ids.add(secondaryId);
	}
	for (const ref of shot.visibleRefs || []) {
		if (!ref?.id) continue;
		if (ref.kind === 'character' && offScreen.has(ref.id)) continue;
		ids.add(ref.id);
	}
	return [...ids].sort();
}

/**
 * On-screen character IDs for cast-overlap (visibleRefs characters minus offScreen).
 * @param {{ visibleRefs?: Array<{ kind?: string, id?: string }>, offScreenCharacterIds?: string[] }} shot
 * @returns {string[]}
 */
export function collectOnScreenCharacterIds(shot) {
	const offScreen = new Set(shot.offScreenCharacterIds ?? []);
	/** @type {Set<string>} */
	const ids = new Set();
	for (const ref of shot.visibleRefs || []) {
		if (ref?.kind !== 'character' || !ref.id) continue;
		if (offScreen.has(ref.id)) continue;
		ids.add(ref.id);
	}
	return [...ids].sort();
}

/**
 * Visible entities for a visual stretch + member shots.
 * @param {{
 *   locationId?: string,
 *   presentCharacterIds?: string[],
 *   blocking?: Array<{ characterId?: string }>,
 *   members?: Array<{ shotId: string }>
 * }} stretch
 * @param {Map<string, any>} shotsById
 * @returns {string[]}
 */
export function collectStretchVisibleEntityIds(stretch, shotsById) {
	/** @type {Set<string>} */
	const ids = new Set();
	if (stretch.locationId) ids.add(stretch.locationId);
	for (const characterId of stretch.presentCharacterIds || []) ids.add(characterId);
	for (const row of stretch.blocking || []) {
		if (row?.characterId) ids.add(row.characterId);
	}
	for (const member of stretch.members || []) {
		const shot = shotsById.get(member.shotId);
		if (!shot) continue;
		for (const id of collectShotVisibleEntityIds(shot)) ids.add(id);
	}
	return [...ids].sort();
}

/**
 * Build entity → asset ids map from catalogs + pack metadata.entityIds.
 * @param {{
 *   catalogs?: Iterable<{ id?: string, referenceAssetIds?: string[] }>,
 *   assets?: Iterable<any> | Map<string, any>
 * }} args
 * @returns {{ entityReferenceIds: Map<string, string[]>, packAssetIdsByEntity: Map<string, string[]>, packEntitiesByAssetId: Map<string, string[]> }}
 */
export function indexEntityReferenceAssets(args) {
	/** @type {Map<string, Set<string>>} */
	const byEntity = new Map();
	/** @type {Map<string, Set<string>>} */
	const packByEntity = new Map();
	/** @type {Map<string, string[]>} */
	const packEntitiesByAssetId = new Map();

	const add = (/** @type {Map<string, Set<string>>} */ map, entityId, assetId) => {
		if (!entityId || !assetId) return;
		if (!map.has(entityId)) map.set(entityId, new Set());
		map.get(entityId)?.add(assetId);
	};

	for (const entity of args.catalogs || []) {
		if (!entity?.id) continue;
		for (const assetId of entity.referenceAssetIds || []) add(byEntity, entity.id, assetId);
	}

	const assetList =
		args.assets instanceof Map ? [...args.assets.values()] : [...(args.assets || [])];
	for (const asset of assetList) {
		const entityIds = asset?.metadata?.entityIds;
		if (!Array.isArray(entityIds) || entityIds.length === 0) continue;
		const valid = entityIds.filter((id) => typeof id === 'string' && id.length > 0);
		if (!valid.length) continue;
		packEntitiesByAssetId.set(asset.id, [...valid].sort());
		for (const entityId of valid) {
			add(byEntity, entityId, asset.id);
			add(packByEntity, entityId, asset.id);
		}
	}

	/** @type {Map<string, string[]>} */
	const entityReferenceIds = new Map();
	for (const [entityId, set] of byEntity) {
		entityReferenceIds.set(entityId, [...set].sort());
	}
	/** @type {Map<string, string[]>} */
	const packAssetIdsByEntity = new Map();
	for (const [entityId, set] of packByEntity) {
		packAssetIdsByEntity.set(entityId, [...set].sort());
	}
	return { entityReferenceIds, packAssetIdsByEntity, packEntitiesByAssetId };
}

/**
 * @param {string} assetId
 * @param {Map<string, any> | undefined} assetsById
 * @returns {boolean}
 */
export function assetPassesCoverageQuality(assetId, assetsById) {
	if (!assetsById) return true;
	const asset = assetsById.get(assetId);
	if (!asset?.path) return false;
	const status = asset.imageStatus?.status;
	if (status && status !== 'current') return false;
	const entityIds = asset.metadata?.entityIds;
	if (entityIds != null) {
		if (!Array.isArray(entityIds) || entityIds.length === 0) return false;
		if (!entityIds.every((id) => typeof id === 'string' && id.length > 0)) return false;
	}
	return true;
}

/**
 * @param {{
 *   requiredEntityIds: string[],
 *   attachedAssetIds: string[],
 *   entityReferenceIds: Map<string, string[]>,
 *   assetsById?: Map<string, any>
 * }} args
 */
export function resolveReferenceCoverage(args) {
	const { requiredEntityIds, attachedAssetIds, entityReferenceIds, assetsById } = args;
	const attachedSet = new Set(attachedAssetIds);
	/** @type {Record<string, string>} */
	const coveringAssetByEntity = {};
	/** @type {string[]} */
	const coveredEntityIds = [];
	/** @type {string[]} */
	const uncoveredEntityIds = [];

	for (const entityId of [...requiredEntityIds].sort()) {
		const candidates = entityReferenceIds.get(entityId) || [];
		const covering = candidates.find(
			(assetId) => attachedSet.has(assetId) && assetPassesCoverageQuality(assetId, assetsById)
		);
		if (covering) {
			coveringAssetByEntity[entityId] = covering;
			coveredEntityIds.push(entityId);
		} else {
			uncoveredEntityIds.push(entityId);
		}
	}
	return {
		coveredEntityIds,
		uncoveredEntityIds,
		attachedAssetIds: [...attachedAssetIds],
		coveringAssetByEntity
	};
}

/**
 * Null-safe excess from whichever caps actually violated.
 * @param {string[]} violations
 * @param {ReferenceLimits} limits
 * @param {{ image: number, video: number, audio: number, total: number }} counts
 * @returns {number}
 */
export function excessSlotsFromViolations(violations, limits, counts) {
	/** @type {number[]} */
	const excesses = [];
	for (const violation of violations) {
		const match = /^(images|videos|audios|total):(\d+)>(\d+)$/.exec(violation);
		if (!match) continue;
		const kind = match[1];
		const n = Number(match[2]);
		const m = Number(match[3]);
		if (kind === 'images' && limits.maxImages == null) continue;
		if (kind === 'videos' && limits.maxVideos == null) continue;
		if (kind === 'audios' && limits.maxAudios == null) continue;
		if (kind === 'total' && limits.maxTotalReferences == null) continue;
		excesses.push(Math.max(0, n - m));
	}
	if (!excesses.length) return 0;
	return Math.max(...excesses);
}

/**
 * Priority-ordered asset ids for hypothetical cutoff (location → vehicle|object|faction → character).
 * Assets covering no required entity sort last by id.
 * @param {string[]} attachedAssetIds
 * @param {Record<string, string>} coveringAssetByEntity
 * @param {string[]} requiredEntityIds
 * @returns {string[]}
 */
export function prioritizeAttachedAssets(attachedAssetIds, coveringAssetByEntity, requiredEntityIds) {
	/** @type {Map<string, number>} */
	const bestBand = new Map();
	for (const entityId of requiredEntityIds) {
		const assetId = coveringAssetByEntity[entityId];
		if (!assetId) continue;
		const band = ENTITY_KIND_BAND[entityKindFromId(entityId)] ?? 9;
		const prev = bestBand.get(assetId);
		if (prev == null || band < prev) bestBand.set(assetId, band);
	}
	return [...attachedAssetIds].sort((a, b) => {
		const bandA = bestBand.has(a) ? /** @type {number} */ (bestBand.get(a)) : 100;
		const bandB = bestBand.has(b) ? /** @type {number} */ (bestBand.get(b)) : 100;
		if (bandA !== bandB) return bandA - bandB;
		return a.localeCompare(b);
	});
}

/**
 * Binding image-slot cap for would-omit / consolidation candidates (null = no image cut).
 * @param {ReferenceLimits} limits
 * @param {string[]} violations
 * @returns {number | null}
 */
function bindingImageCap(limits, violations) {
	if (limits.maxImages != null && violations.some((v) => v.startsWith('images:'))) {
		return limits.maxImages;
	}
	if (limits.maxTotalReferences != null && violations.some((v) => v.startsWith('total:'))) {
		return limits.maxTotalReferences;
	}
	if (limits.maxImages != null) return limits.maxImages;
	if (limits.maxTotalReferences != null) return limits.maxTotalReferences;
	return null;
}

/**
 * Greedy deterministic pack cover for uncovered characters (then other entities).
 * @param {string[]} uncoveredEntityIds
 * @param {string[]} compatiblePackAssetIds
 * @param {Map<string, string[]>} packEntitiesByAssetId
 * @returns {{ selected: string[], remaining: string[] }}
 */
export function greedyPackCover(uncoveredEntityIds, compatiblePackAssetIds, packEntitiesByAssetId) {
	/** @type {Set<string>} */
	const remaining = new Set(uncoveredEntityIds);
	/** @type {string[]} */
	const selected = [];
	const packs = [...compatiblePackAssetIds].sort();
	while (remaining.size) {
		let best = null;
		let bestCover = [];
		for (const packId of packs) {
			if (selected.includes(packId)) continue;
			const entities = packEntitiesByAssetId.get(packId) || [];
			const cover = entities.filter((id) => remaining.has(id));
			if (!cover.length) continue;
			if (
				!best ||
				cover.length > bestCover.length ||
				(cover.length === bestCover.length && packId.localeCompare(best) < 0)
			) {
				best = packId;
				bestCover = cover;
			}
		}
		if (!best) break;
		selected.push(best);
		for (const id of bestCover) remaining.delete(id);
	}
	return { selected, remaining: [...remaining].sort() };
}

/**
 * @param {{
 *   references: BudgetReference[],
 *   limits?: ReferenceLimits,
 *   requiredEntityIds: string[],
 *   entityReferenceIds: Map<string, string[]>,
 *   packEntitiesByAssetId?: Map<string, string[]>,
 *   packAssetIdsByEntity?: Map<string, string[]>,
 *   assetsById?: Map<string, any>
 * }} args
 * @returns {{
 *   referenceBudget: ReferenceBudgetDiagnostic,
 *   remediation: ReferenceRemediation[],
 *   blockers: string[],
 *   attachedAssetIds: string[]
 * }}
 */
export function evaluateReferenceBudget(args) {
	const {
		references,
		limits = {},
		requiredEntityIds,
		entityReferenceIds,
		packEntitiesByAssetId = new Map(),
		packAssetIdsByEntity = new Map(),
		assetsById
	} = args;

	const attachedAssetIds = references.map((r) => r.id);
	const attachedBefore = [...attachedAssetIds];
	const coverage = resolveReferenceCoverage({
		requiredEntityIds,
		attachedAssetIds,
		entityReferenceIds,
		assetsById
	});
	const budget = checkReferenceBudget(references, limits);
	const violations = budget.ok ? [] : budget.violations;
	const excessSlots = excessSlotsFromViolations(violations, limits, {
		...budget.counts,
		total: budget.total
	});

	const prioritized = prioritizeAttachedAssets(
		attachedAssetIds,
		coverage.coveringAssetByEntity,
		requiredEntityIds
	);
	const cap = bindingImageCap(limits, violations);
	/** @type {string[]} */
	let consolidateCandidateAssetIds = [];
	/** @type {string[]} */
	let wouldOmitEntityIds = [];
	if (cap != null && prioritized.length > cap) {
		consolidateCandidateAssetIds = prioritized.slice(cap);
		const afterCutoff = new Set(consolidateCandidateAssetIds);
		for (const entityId of requiredEntityIds) {
			const covering = coverage.coveringAssetByEntity[entityId];
			if (!covering) continue;
			const alsoCoveredEarlier = prioritized
				.slice(0, cap)
				.some((assetId) => {
					const sheets = entityReferenceIds.get(entityId) || [];
					return sheets.includes(assetId) && assetPassesCoverageQuality(assetId, assetsById);
				});
			if (afterCutoff.has(covering) && !alsoCoveredEarlier) {
				wouldOmitEntityIds.push(entityId);
			}
		}
		wouldOmitEntityIds = [...new Set(wouldOmitEntityIds)].sort();
	}

	// Never trim — assert identity for callers/tests.
	if (attachedAssetIds.join('\0') !== attachedBefore.join('\0')) {
		throw new Error('reference budget must never trim attached assets');
	}

	/** @type {ReferenceBudgetDiagnostic} */
	const referenceBudget = {
		requiredEntityIds: [...requiredEntityIds].sort(),
		coveredEntityIds: coverage.coveredEntityIds,
		uncoveredEntityIds: coverage.uncoveredEntityIds,
		attachedAssetIds,
		coveringAssetByEntity: coverage.coveringAssetByEntity,
		wouldOmitEntityIds,
		limits: {
			maxImages: limits.maxImages ?? null,
			maxVideos: limits.maxVideos ?? null,
			maxAudios: limits.maxAudios ?? null,
			maxTotalReferences: limits.maxTotalReferences ?? null
		},
		violations: [...violations]
	};

	/** @type {ReferenceRemediation[]} */
	const remediation = [];
	/** @type {string[]} */
	const blockers = violations.map((v) => `reference_budget:${v}`);

	if (coverage.uncoveredEntityIds.length) {
		const uncoveredSet = new Set(coverage.uncoveredEntityIds);
		const attachedSet = new Set(attachedAssetIds);
		/** @type {Set<string>} */
		const compatible = new Set();
		for (const entityId of coverage.uncoveredEntityIds) {
			for (const packId of packAssetIdsByEntity.get(entityId) || []) {
				if (attachedSet.has(packId)) continue;
				if (!assetPassesCoverageQuality(packId, assetsById)) continue;
				compatible.add(packId);
			}
		}
		const compatiblePackAssetIds = [...compatible].sort();
		const { selected, remaining } = greedyPackCover(
			coverage.uncoveredEntityIds,
			compatiblePackAssetIds,
			packEntitiesByAssetId
		);
		/** @type {number | null} */
		const packsNeeded =
			remaining.length === 0 && selected.length > 0 ? selected.length : null;
		remediation.push({
			code: 'reference_pack_required',
			uncoveredEntityIds: coverage.uncoveredEntityIds,
			compatiblePackAssetIds,
			packsNeeded
		});
		if (packsNeeded == null) {
			blockers.push('reference_pack_required:authoring_required');
		} else {
			blockers.push(`reference_pack_required:packsNeeded:${packsNeeded}`);
		}
		// Also surface uncovered entities for video/still completeness consumers.
		for (const entityId of coverage.uncoveredEntityIds) {
			blockers.push(`uncovered_entity:${entityId}`);
		}
	}

	if (excessSlots > 0 && coverage.uncoveredEntityIds.length === 0) {
		remediation.push({
			code: 'reference_consolidation_required',
			excessSlots,
			consolidateCandidateAssetIds
		});
		blockers.push(`reference_consolidation_required:excess:${excessSlots}`);
	} else if (excessSlots > 0 && coverage.uncoveredEntityIds.length > 0) {
		remediation.push({
			code: 'reference_consolidation_required',
			excessSlots,
			consolidateCandidateAssetIds
		});
		blockers.push(`reference_consolidation_required:excess:${excessSlots}`);
	}

	return {
		referenceBudget,
		remediation,
		blockers: [...new Set(blockers)],
		attachedAssetIds
	};
}

/**
 * Seedance/video jobs: keyframes establish member-shot entities; pack metadata on panel
 * assets is not required. Fallback policy never emits reference_pack_required from generic
 * sheet coverage. Explicit policy remediates only entities still uncovered after keyframes
 * + effective video extras (same set as uncovered_video_entity:*).
 *
 * @param {{
 *   references: BudgetReference[],
 *   limits?: ReferenceLimits,
 *   requiredEntityIds: string[],
 *   keyframeCoveredEntityIds: Iterable<string>,
 *   keyframeCoveringAssetByEntity?: Record<string, string>,
 *   effectiveVideoReferenceAssetIds?: string[],
 *   videoReferencePolicy: 'fallback' | 'explicit',
 *   entityReferenceIds: Map<string, string[]>,
 *   packEntitiesByAssetId?: Map<string, string[]>,
 *   packAssetIdsByEntity?: Map<string, string[]>,
 *   assetsById?: Map<string, any>
 * }} args
 * @returns {{
 *   referenceBudget: ReferenceBudgetDiagnostic,
 *   remediation: ReferenceRemediation[],
 *   blockers: string[],
 *   attachedAssetIds: string[]
 * }}
 */
export function evaluateVideoStretchReferenceBudget(args) {
	const {
		references,
		limits = {},
		requiredEntityIds,
		keyframeCoveredEntityIds,
		keyframeCoveringAssetByEntity = {},
		effectiveVideoReferenceAssetIds = [],
		videoReferencePolicy,
		entityReferenceIds,
		packEntitiesByAssetId = new Map(),
		packAssetIdsByEntity = new Map(),
		assetsById
	} = args;

	const attachedAssetIds = references.map((r) => r.id);
	const required = [...new Set(requiredEntityIds)].sort();
	const keyframeSet = new Set(keyframeCoveredEntityIds);
	const keyframeCovered = [...keyframeSet].filter((id) => required.includes(id)).sort();

	const extraCoverage = resolveReferenceCoverage({
		requiredEntityIds: required,
		attachedAssetIds: effectiveVideoReferenceAssetIds,
		entityReferenceIds,
		assetsById
	});
	const videoExtraCoveredEntityIds = extraCoverage.coveredEntityIds
		.filter((id) => !keyframeSet.has(id))
		.sort();

	/** @type {Record<string, string>} */
	const coveringAssetByEntity = { ...keyframeCoveringAssetByEntity };
	for (const [entityId, assetId] of Object.entries(extraCoverage.coveringAssetByEntity)) {
		if (!coveringAssetByEntity[entityId]) coveringAssetByEntity[entityId] = assetId;
	}

	const uncoveredVideoEntityIds = required.filter(
		(id) => !keyframeSet.has(id) && !extraCoverage.coveredEntityIds.includes(id)
	);
	const coveredEntityIds = required.filter((id) => !uncoveredVideoEntityIds.includes(id));

	const budget = checkReferenceBudget(references, limits);
	const violations = budget.ok ? [] : budget.violations;
	const excessSlots = excessSlotsFromViolations(violations, limits, {
		...budget.counts,
		total: budget.total
	});

	const prioritized = prioritizeAttachedAssets(
		attachedAssetIds,
		coveringAssetByEntity,
		required
	);
	const cap = bindingImageCap(limits, violations);
	/** @type {string[]} */
	let consolidateCandidateAssetIds = [];
	/** @type {string[]} */
	let wouldOmitEntityIds = [];
	if (cap != null && prioritized.length > cap) {
		consolidateCandidateAssetIds = prioritized.slice(cap);
		const afterCutoff = new Set(consolidateCandidateAssetIds);
		for (const entityId of required) {
			const covering = coveringAssetByEntity[entityId];
			if (!covering) continue;
			const alsoCoveredEarlier = prioritized.slice(0, cap).includes(covering);
			if (afterCutoff.has(covering) && !alsoCoveredEarlier) {
				wouldOmitEntityIds.push(entityId);
			}
		}
		wouldOmitEntityIds = [...new Set(wouldOmitEntityIds)].sort();
	}

	/** @type {ReferenceBudgetDiagnostic} */
	const referenceBudget = {
		requiredEntityIds: required,
		coveredEntityIds,
		uncoveredEntityIds: uncoveredVideoEntityIds,
		attachedAssetIds,
		coveringAssetByEntity,
		wouldOmitEntityIds,
		limits: {
			maxImages: limits.maxImages ?? null,
			maxVideos: limits.maxVideos ?? null,
			maxAudios: limits.maxAudios ?? null,
			maxTotalReferences: limits.maxTotalReferences ?? null
		},
		violations: [...violations],
		keyframeCoveredEntityIds: keyframeCovered,
		videoExtraCoveredEntityIds,
		uncoveredVideoEntityIds
	};

	/** @type {ReferenceRemediation[]} */
	const remediation = [];
	/** @type {string[]} */
	const blockers = violations.map((v) => `reference_budget:${v}`);

	// Pack remediations apply only under explicit video extras policy.
	if (videoReferencePolicy === 'explicit' && uncoveredVideoEntityIds.length) {
		const attachedSet = new Set(attachedAssetIds);
		/** @type {Set<string>} */
		const compatible = new Set();
		for (const entityId of uncoveredVideoEntityIds) {
			for (const packId of packAssetIdsByEntity.get(entityId) || []) {
				if (attachedSet.has(packId)) continue;
				if (!assetPassesCoverageQuality(packId, assetsById)) continue;
				compatible.add(packId);
			}
		}
		const compatiblePackAssetIds = [...compatible].sort();
		const { selected, remaining } = greedyPackCover(
			uncoveredVideoEntityIds,
			compatiblePackAssetIds,
			packEntitiesByAssetId
		);
		/** @type {number | null} */
		const packsNeeded =
			remaining.length === 0 && selected.length > 0 ? selected.length : null;
		remediation.push({
			code: 'reference_pack_required',
			uncoveredEntityIds: uncoveredVideoEntityIds,
			compatiblePackAssetIds,
			packsNeeded
		});
		if (packsNeeded == null) {
			blockers.push('reference_pack_required:authoring_required');
		} else {
			blockers.push(`reference_pack_required:packsNeeded:${packsNeeded}`);
		}
	}

	if (excessSlots > 0) {
		remediation.push({
			code: 'reference_consolidation_required',
			excessSlots,
			consolidateCandidateAssetIds
		});
		blockers.push(`reference_consolidation_required:excess:${excessSlots}`);
	}

	return {
		referenceBudget,
		remediation,
		blockers: [...new Set(blockers)],
		attachedAssetIds
	};
}

/**
 * Location ancestry root via parentLocationId.
 * @param {string} locationId
 * @param {Map<string, { id?: string, parentLocationId?: string }>} locationsById
 * @returns {string}
 */
export function locationAncestryRoot(locationId, locationsById) {
	/** @type {Set<string>} */
	const seen = new Set();
	let current = locationId;
	while (current && !seen.has(current)) {
		seen.add(current);
		const loc = locationsById.get(current);
		if (!loc?.parentLocationId) return current;
		current = loc.parentLocationId;
	}
	return locationId;
}

/**
 * Stretch / adjacency compatibility: exact match, or nested containment under a
 * shootable room/spine — not merely sharing a distant facility/vessel/region root
 * (e.g. Proxima dock must not unify with Operations Gallery).
 * @param {string} a
 * @param {string} b
 * @param {Map<string, { id?: string, parentLocationId?: string, spatialKind?: string }>} locationsById
 */
export function locationsShareAncestry(a, b, locationsById) {
	if (!a || !b) return false;
	if (a === b) return true;
	const nonUnifying = new Set(['facility', 'vessel', 'region', 'universe', 'exterior']);
	/**
	 * @param {string} ancestor
	 * @param {string} descendant
	 */
	function isNestedUnder(ancestor, descendant) {
		const ancestorLoc = locationsById.get(ancestor);
		if (ancestorLoc?.spatialKind && nonUnifying.has(ancestorLoc.spatialKind)) return false;
		/** @type {Set<string>} */
		const seen = new Set();
		let current = descendant;
		while (current && !seen.has(current)) {
			seen.add(current);
			const loc = locationsById.get(current);
			if (!loc?.parentLocationId) return false;
			if (loc.parentLocationId === ancestor) return true;
			current = loc.parentLocationId;
		}
		return false;
	}
	return isNestedUnder(a, b) || isNestedUnder(b, a);
}
