/**
 * Visual-stretch generation-plan helpers: reference budgets and Seedance partition.
 * Node-only (imports generation-planning).
 */
import { checkReferenceBudget } from './generation-planning.mjs';

/**
 * Still / combined-sheet jobs need every authored visual reference.
 * Nothing is "already in frame" until the sheet exists.
 * @param {{ referenceAssetIds?: string[] }} stretch
 * @returns {Array<{ kind: 'image', id: string, role: string }>}
 */
export function collectStillStretchReferences(stretch) {
	return (stretch.referenceAssetIds || []).map((id) => ({
		kind: 'image',
		id,
		role: 'visual_reference'
	}));
}

/**
 * Seedance jobs: ordered keyframes count; character/location sheets for subjects
 * already depicted in those keyframes are omitted from additional references.
 *
 * @param {{
 *   stretch: { referenceAssetIds?: string[], locationId?: string, presentCharacterIds?: string[] },
 *   members: Array<{ shotId: string, order: number, takeScope?: string, takeIds?: string[] }>,
 *   shotsById: Map<string, any>,
 *   keyframeByShotId?: Map<string, string>,
 *   entityReferenceIds?: Map<string, string[]>
 * }} args
 * @returns {Array<{ kind: 'image', id: string, role: string }>}
 */
export function collectVideoStretchReferences(args) {
	const {
		stretch,
		members,
		shotsById,
		keyframeByShotId = new Map(),
		entityReferenceIds = new Map()
	} = args;
	const refs = [];
	const coveredAssetIds = new Set();
	const coveredEntityIds = new Set();
	let hasKeyframe = false;

	for (const member of members) {
		const keyframeId = keyframeByShotId.get(member.shotId);
		if (!keyframeId) continue;
		hasKeyframe = true;
		refs.push({ kind: 'image', id: keyframeId, role: 'keyframe' });
		const shot = shotsById.get(member.shotId);
		if (shot?.locationId) coveredEntityIds.add(shot.locationId);
		for (const ref of shot?.visibleRefs || []) {
			if (ref?.id) coveredEntityIds.add(ref.id);
		}
	}

	if (hasKeyframe) {
		if (stretch.locationId) coveredEntityIds.add(stretch.locationId);
		for (const characterId of stretch.presentCharacterIds || []) {
			coveredEntityIds.add(characterId);
		}
	}

	for (const entityId of coveredEntityIds) {
		for (const assetId of entityReferenceIds.get(entityId) || []) {
			coveredAssetIds.add(assetId);
		}
	}

	for (const assetId of stretch.referenceAssetIds || []) {
		if (coveredAssetIds.has(assetId)) continue;
		refs.push({ kind: 'image', id: assetId, role: 'visual_reference' });
	}
	return refs;
}

/**
 * @param {Array<{ kind: 'image' | 'video' | 'audio', id?: string, role?: string }>} references
 * @param {{ maxImages?: number | null, maxVideos?: number | null, maxAudios?: number | null, maxTotalReferences?: number | null } | undefined} limits
 * @returns {string[]}
 */
export function referenceBudgetBlockers(references, limits) {
	if (!limits) return [];
	const result = checkReferenceBudget(references, limits);
	if (result.ok) return [];
	return result.violations.map((v) => `reference_budget:${v}`);
}

/**
 * Partition stretch members into consecutive Seedance jobs under the segment ceiling.
 * A single member longer than the ceiling is emitted alone with `member_exceeds_max_duration`.
 *
 * @param {any} stretch
 * @param {Array<{ shotId: string, order: number, takeScope?: string, takeIds?: string[] }>} members
 * @param {Map<string, any>} shotsById
 * @param {number} maxSegmentMs
 * @param {string} stillJobId
 * @param {{
 *   keyframeByShotId?: Map<string, string>,
 *   entityReferenceIds?: Map<string, string[]>,
 *   videoLimits?: { maxImages?: number | null, maxVideos?: number | null, maxAudios?: number | null, maxTotalReferences?: number | null }
 * }} [opts]
 */
export function partitionStretchVideoJobs(
	stretch,
	members,
	shotsById,
	maxSegmentMs,
	stillJobId,
	opts = {}
) {
	const jobs = [];
	let bucket = [];
	let bucketMs = 0;
	let part = 1;
	const keyframeByShotId = opts.keyframeByShotId ?? new Map();
	const entityReferenceIds = opts.entityReferenceIds ?? new Map();

	const buildJob = (bucketMembers, durationMs, extraBlockers = []) => {
		const memberInputs = bucketMembers.map((member) => {
			const shot = shotsById.get(member.shotId);
			const sourceTakeIds =
				member.takeScope === 'explicit'
					? member.takeIds ?? []
					: shot?.selectedTakeId
						? [shot.selectedTakeId]
						: [];
			return {
				order: member.order,
				shotId: member.shotId,
				sourceTakeIds,
				keyframeAssetId: keyframeByShotId.get(member.shotId)
			};
		});
		const references = collectVideoStretchReferences({
			stretch,
			members: bucketMembers,
			shotsById,
			keyframeByShotId,
			entityReferenceIds
		});
		const blockers = [
			'editorial_prompt_freeze_not_approved',
			'seedance_execution_gated',
			...referenceBudgetBlockers(references, opts.videoLimits),
			...extraBlockers
		];
		if (durationMs > maxSegmentMs) {
			blockers.push('member_exceeds_max_duration');
		}
		return {
			id: `${stillJobId}:video-${part}`,
			stretchId: stretch.id,
			revision: stretch.revision,
			medium: 'video',
			mode: 'grouped_seedance',
			outputTakePolicy: 'new_candidate',
			dependsOnStillJobId: stillJobId,
			durationMs,
			memberInputs,
			sharedReferenceAssetIds: references
				.filter((r) => r.role === 'visual_reference')
				.map((r) => r.id),
			compiledPrompt: null,
			outputs: [{ order: 1, artifact: 'video' }],
			blockers: [...new Set(blockers)],
			coherenceException: false
		};
	};

	const flush = () => {
		if (!bucket.length) return;
		jobs.push(buildJob(bucket, bucketMs));
		part += 1;
		bucket = [];
		bucketMs = 0;
	};

	for (const member of members) {
		const duration = shotsById.get(member.shotId)?.durationMs ?? 0;
		if (duration > maxSegmentMs) {
			flush();
			jobs.push(buildJob([member], duration, ['member_exceeds_max_duration']));
			part += 1;
			continue;
		}
		if (bucket.length && bucketMs + duration > maxSegmentMs) flush();
		bucket.push(member);
		bucketMs += duration;
	}
	flush();
	return jobs;
}
