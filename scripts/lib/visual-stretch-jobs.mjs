/**
 * Visual-stretch generation-plan helpers: reference budgets, Seedance partition, job builder.
 * Node-only (imports generation-planning + visual-stretch).
 */

/**
 * @typedef {NonNullable<import('../../src/lib/types/generated/production.ts').GenerationPlanFile['visualStretchJobs']>[number]} VisualStretchJob
 * @typedef {{ shotId: string, order: number, takeScope?: string, takeIds?: string[], frameRegion?: { x: number, y: number, w: number, h: number } }} StretchMember
 * @typedef {{ kind: 'image' | 'video' | 'audio', id: string, role?: string }} StretchReference
 * @typedef {{ id: string, characterId: string, variants?: Array<{ language?: string, sampleAssetIds?: string[] }> }} VoiceProfile
 */

import { checkReferenceBudget } from './generation-planning.mjs';
import {
	deriveGenerationGateFromTakes,
	effectiveProductionGateStatus,
	isProductionGateHold,
	productionGateMedium,
	resolveStretchMemberSourceTakeIds,
	stretchMemberGateBlockers
} from './production-gate.mjs';
import {
	computeMargins,
	derivePanelRegions,
	DEFAULT_GUTTER_FRACTION,
	providerAllowsFourByFour,
	selectGridForMemberCount,
	selectLargestSuitableOutputSize,
	stretchBlockingBlockers,
	stretchJobId,
	validateGridLayout
} from './visual-stretch.mjs';

/**
 * Collect production-gate blockers + derived generationGate for stretch members.
 * @param {StretchMember[]} members
 * @param {Map<string, any>} shotsById
 * @param {Map<string, any>} takesById
 * @param {{ assetsById?: Map<string, any>, manifestById?: Map<string, any> }} [ctx]
 * @param {{ medium?: 'all' | 'still' | 'video' }} [opts] still jobs pass 'still', video jobs 'video';
 *   a video-scoped Take.productionGate then never blocks the still job (and vice versa).
 */
export function collectStretchProductionGate(members, shotsById, takesById, ctx = {}, opts = {}) {
	/** @type {string[]} */
	const blockers = [];
	/** @type {any[]} */
	const sourceTakes = [];
	for (const member of members) {
		const shot = shotsById.get(member.shotId);
		const { takeIds, missingSelectedTake } = resolveStretchMemberSourceTakeIds(member, shot);
		if (missingSelectedTake) blockers.push(`missing_selected_take:${member.shotId}`);
		for (const takeId of takeIds) {
			const take = takesById.get(takeId);
			if (!take) {
				blockers.push(`unknown_source_take:${takeId}`);
				continue;
			}
			sourceTakes.push(take);
			if (isProductionGateHold(take, opts.medium)) {
				const status = /** @type {'deferred' | 'blocked'} */ (
					effectiveProductionGateStatus(take)
				);
				blockers.push(
					...stretchMemberGateBlockers(
						member.shotId,
						[take.id],
						status,
						productionGateMedium(take)
					)
				);
			}
		}
	}
	const derived = deriveGenerationGateFromTakes(sourceTakes, ctx, { medium: opts.medium });
	blockers.push(...derived.blockers);
	return {
		blockers: [...new Set(blockers)],
		generationGate: derived.generationGate
	};
}
/**
 * One approved voice sample per speaker for the job language (SEEDANCE_PROMPTING §4 / §6.1).
 * Prefers the matching language variant; falls back to the first sample on any variant.
 * @param {VoiceProfile | undefined} profile
 * @param {string} [language]
 * @returns {string | null}
 */
export function pickApprovedVoiceSampleAssetId(profile, language = 'en') {
	if (!profile?.variants?.length) return null;
	const preferred = profile.variants.find((variant) => variant.language === language);
	const fromPreferred = preferred?.sampleAssetIds?.find((id) => Boolean(id));
	if (fromPreferred) return fromPreferred;
	for (const variant of profile.variants) {
		const sample = variant.sampleAssetIds?.find((id) => Boolean(id));
		if (sample) return sample;
	}
	return null;
}

/**
 * Still / combined-sheet jobs need every authored visual reference.
 * Nothing is "already in frame" until the sheet exists.
 * @param {{ referenceAssetIds?: string[] }} stretch
 * @returns {StretchReference[]}
 */
export function collectStillStretchReferences(stretch) {
	return (stretch.referenceAssetIds || []).map((id) => ({
		kind: /** @type {'image'} */ ('image'),
		id,
		role: 'visual_reference'
	}));
}

/**
 * Catalog asset must resolve with a usable path; imageStatus absent or current.
 * @param {string} assetId
 * @param {Map<string, any> | undefined} assetsById
 * @param {'image' | 'audio'} kind
 * @returns {string[]}
 */
export function assetReferenceQualityBlockers(assetId, assetsById, kind = 'image') {
	if (!assetsById) return [];
	const asset = assetsById.get(assetId);
	if (!asset) return [`missing_${kind}_asset:${assetId}`];
	if (!asset.path) return [`missing_${kind}_path:${assetId}`];
	const status = asset.imageStatus?.status;
	if (status && status !== 'current') {
		return [`stale_${kind}_asset:${assetId}`];
	}
	return [];
}

/**
 * Dialogue voice samples for speakers who talk in the bucket's shots.
 * @param {{
 *   members: StretchMember[],
 *   shotsById: Map<string, any>,
 *   cuesById?: Map<string, any>,
 *   voiceProfiles?: VoiceProfile[],
 *   language?: string,
 *   assetsById?: Map<string, any>
 * }} args
 * @returns {{ references: StretchReference[], blockers: string[] }}
 */
export function collectDialogueVoiceSampleReferences(args) {
	const {
		members,
		shotsById,
		cuesById = new Map(),
		voiceProfiles = [],
		language = 'en',
		assetsById
	} = args;
	/** @type {StretchReference[]} */
	const references = [];
	/** @type {string[]} */
	const blockers = [];
	/** @type {Set<string>} */
	const speakers = new Set();

	for (const member of members) {
		const shot = shotsById.get(member.shotId);
		for (const placement of shot?.cuePlacements || []) {
			const cue = cuesById.get(placement.cueId);
			if (cue?.type === 'dialogue' && cue.speakerId) speakers.add(cue.speakerId);
		}
	}

	for (const speakerId of [...speakers].sort()) {
		const profile = voiceProfiles.find((item) => item.characterId === speakerId);
		const sampleId = pickApprovedVoiceSampleAssetId(profile, language);
		if (!sampleId) {
			blockers.push(`missing_voice_sample:${speakerId}`);
			continue;
		}
		const quality = assetReferenceQualityBlockers(sampleId, assetsById, 'audio');
		if (quality.length) {
			blockers.push(...quality);
			continue;
		}
		references.push({
			kind: /** @type {'audio'} */ ('audio'),
			id: sampleId,
			role: 'voice_sample'
		});
	}
	return { references, blockers };
}

/**
 * Resolve authored video reference policy (tri-state).
 * @param {{ videoReferenceAssetIds?: string[] }} stretch
 * @returns {'fallback' | 'explicit'}
 */
export function resolveVideoReferencePolicy(stretch) {
	return Object.prototype.hasOwnProperty.call(stretch ?? {}, 'videoReferenceAssetIds')
		? 'explicit'
		: 'fallback';
}

/**
 * Assert deprecated sharedReferenceAssetIds alias matches medium-specific field.
 * @param {{ id?: string, medium?: string, sharedReferenceAssetIds?: string[], stillReferenceAssetIds?: string[], effectiveVideoReferenceAssetIds?: string[] }} job
 */
export function assertSharedReferenceAlias(job) {
	const shared = job.sharedReferenceAssetIds || [];
	if (job.medium === 'still') {
		const still = job.stillReferenceAssetIds || [];
		if (shared.length !== still.length || shared.some((id, i) => id !== still[i])) {
			throw new Error(
				`stretch job ${job.id || '?'}: sharedReferenceAssetIds must equal stillReferenceAssetIds`
			);
		}
		return;
	}
	if (job.medium === 'video') {
		const effective = job.effectiveVideoReferenceAssetIds || [];
		if (shared.length !== effective.length || shared.some((id, i) => id !== effective[i])) {
			throw new Error(
				`stretch job ${job.id || '?'}: sharedReferenceAssetIds must equal effectiveVideoReferenceAssetIds`
			);
		}
	}
}

/**
 * Deduplicate references by asset id, preserving first-seen order.
 * @param {StretchReference[]} references
 * @returns {StretchReference[]}
 */
export function dedupeReferencesByAssetId(references) {
	const seen = new Set();
	/** @type {StretchReference[]} */
	const out = [];
	for (const ref of references || []) {
		if (!ref?.id || seen.has(ref.id)) continue;
		seen.add(ref.id);
		out.push(ref);
	}
	return out;
}

/**
 * Seedance jobs: ordered keyframes + additional visual refs not already in those frames
 * + dialogue voice samples. Still list is never mutated.
 *
 * Coverage is per registered-keyframe shot only (no stretch-wide blanket).
 * Explicit policy: extras from videoReferenceAssetIds; fallback: from referenceAssetIds.
 * Completeness (explicit): uncovered visible entities whose catalog sheets are absent → blockers.
 *
 * @param {{
 *   stretch: { referenceAssetIds?: string[], videoReferenceAssetIds?: string[], locationId?: string, presentCharacterIds?: string[] },
 *   members: StretchMember[],
 *   shotsById: Map<string, any>,
 *   keyframeByShotId?: Map<string, string>,
 *   entityReferenceIds?: Map<string, string[]>,
 *   cuesById?: Map<string, any>,
 *   voiceProfiles?: VoiceProfile[],
 *   language?: string,
 *   assetsById?: Map<string, any>
 * }} args
 * @returns {{
 *   references: StretchReference[],
 *   blockers: string[],
 *   videoReferencePolicy: 'fallback' | 'explicit',
 *   effectiveVideoReferenceAssetIds: string[],
 *   voiceSampleAssetIds: string[]
 * }}
 */
export function collectVideoStretchReferences(args) {
	const {
		stretch,
		members,
		shotsById,
		keyframeByShotId = new Map(),
		entityReferenceIds = new Map(),
		cuesById = new Map(),
		voiceProfiles = [],
		language = 'en',
		assetsById
	} = args;
	const videoReferencePolicy = resolveVideoReferencePolicy(stretch);
	/** @type {StretchReference[]} */
	const keyframeRefs = [];
	const coveredAssetIds = new Set();
	/** Entities covered by a registered keyframe shot. */
	const keyframeCoveredEntityIds = new Set();
	/** All visible entities on job members (for explicit completeness). */
	const requiredEntityIds = new Set();

	for (const member of members) {
		const shot = shotsById.get(member.shotId);
		if (shot?.locationId) requiredEntityIds.add(shot.locationId);
		for (const ref of shot?.visibleRefs || []) {
			if (ref?.id) requiredEntityIds.add(ref.id);
		}
		const keyframeId = keyframeByShotId.get(member.shotId);
		if (!keyframeId) continue;
		keyframeRefs.push({
			kind: /** @type {'image'} */ ('image'),
			id: keyframeId,
			role: 'keyframe'
		});
		if (shot?.locationId) keyframeCoveredEntityIds.add(shot.locationId);
		for (const ref of shot?.visibleRefs || []) {
			if (ref?.id) keyframeCoveredEntityIds.add(ref.id);
		}
	}

	for (const entityId of keyframeCoveredEntityIds) {
		for (const assetId of entityReferenceIds.get(entityId) || []) {
			coveredAssetIds.add(assetId);
		}
	}
	for (const kf of keyframeRefs) coveredAssetIds.add(kf.id);

	const extraSource =
		videoReferencePolicy === 'explicit'
			? stretch.videoReferenceAssetIds || []
			: stretch.referenceAssetIds || [];

	/** @type {StretchReference[]} */
	const visualExtras = [];
	for (const assetId of extraSource) {
		if (!assetId || coveredAssetIds.has(assetId)) continue;
		visualExtras.push({
			kind: /** @type {'image'} */ ('image'),
			id: assetId,
			role: 'visual_reference'
		});
		coveredAssetIds.add(assetId);
	}

	const effectiveVideoReferenceAssetIds = visualExtras.map((r) => r.id);

	/** @type {string[]} */
	const blockers = [];
	if (videoReferencePolicy === 'explicit') {
		const effectiveSet = new Set(effectiveVideoReferenceAssetIds);
		for (const entityId of requiredEntityIds) {
			if (keyframeCoveredEntityIds.has(entityId)) continue;
			const sheets = entityReferenceIds.get(entityId) || [];
			const coveredBySheet = sheets.some(/** @param {string} id */ (id) => effectiveSet.has(id));
			if (!coveredBySheet) blockers.push(`uncovered_video_entity:${entityId}`);
		}
	}

	const voice = collectDialogueVoiceSampleReferences({
		members,
		shotsById,
		cuesById,
		voiceProfiles,
		language,
		assetsById
	});
	blockers.push(...voice.blockers);

	const references = dedupeReferencesByAssetId([
		...keyframeRefs,
		...visualExtras,
		...voice.references
	]);
	for (const ref of references) {
		if (ref.role === 'voice_sample') continue;
		blockers.push(...assetReferenceQualityBlockers(ref.id, assetsById, 'image'));
	}
	const voiceSampleAssetIds = references
		.filter((r) => r.role === 'voice_sample')
		.map((r) => r.id);

	return {
		references,
		blockers,
		videoReferencePolicy,
		effectiveVideoReferenceAssetIds,
		voiceSampleAssetIds
	};
}

/**
 * @param {StretchReference[]} references
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
 * Submission adapters must refuse any job where this is false.
 * No in-repo submission adapter exists yet — exercised by tests and plan inspection.
 * @param {{ blockers?: string[], runnable?: boolean } | null | undefined} job
 */
export function isStretchJobRunnable(job) {
	return job?.runnable === true && Array.isArray(job.blockers) && job.blockers.length === 0;
}

/**
 * @param {Omit<VisualStretchJob, 'runnable' | 'blockers'> & { blockers?: string[] }} job
 * @param {{ maxOutputsPerRequest?: number | null }} [opts]
 * @returns {VisualStretchJob}
 */
function finalizeStretchJob(job, opts = {}) {
	const blockers = [...new Set(job.blockers || [])];
	const maxOutputs = opts.maxOutputsPerRequest;
	if (maxOutputs != null && Array.isArray(job.outputs) && job.outputs.length > maxOutputs) {
		blockers.push(`outputs:${job.outputs.length}>${maxOutputs}`);
	}
	const finalized = /** @type {VisualStretchJob} */ ({
		...job,
		blockers,
		runnable: blockers.length === 0
	});
	assertSharedReferenceAlias(finalized);
	return finalized;
}

/**
 * Partition stretch members into consecutive Seedance jobs under the segment ceiling.
 * A single member longer than the ceiling is emitted alone with `member_exceeds_max_duration`
 * and `runnable: false` (descriptor retained for diagnostics; must not be submitted).
 *
 * @param {{ id: string, revision: number, referenceAssetIds?: string[], videoReferenceAssetIds?: string[], locationId?: string, presentCharacterIds?: string[] }} stretch
 * @param {StretchMember[]} members
 * @param {Map<string, any>} shotsById
 * @param {number} maxSegmentMs
 * @param {string} stillJobId
 * @param {{
 *   keyframeByShotId?: Map<string, string>,
 *   entityReferenceIds?: Map<string, string[]>,
 *   cuesById?: Map<string, any>,
 *   voiceProfiles?: VoiceProfile[],
 *   language?: string,
 *   videoLimits?: { maxImages?: number | null, maxVideos?: number | null, maxAudios?: number | null, maxTotalReferences?: number | null },
 *   providerSnapshotId?: string,
 *   maxOutputsPerRequest?: number | null,
 *   takesById?: Map<string, any>,
 *   assetsById?: Map<string, any>,
 *   manifestById?: Map<string, any>
 * }} [opts]
 * @returns {VisualStretchJob[]}
 */
export function partitionStretchVideoJobs(
	stretch,
	members,
	shotsById,
	maxSegmentMs,
	stillJobId,
	opts = {}
) {
	/** @type {VisualStretchJob[]} */
	const jobs = [];
	/** @type {StretchMember[]} */
	let bucket = [];
	let bucketMs = 0;
	let part = 1;
	const keyframeByShotId = opts.keyframeByShotId ?? new Map();
	const entityReferenceIds = opts.entityReferenceIds ?? new Map();
	const cuesById = opts.cuesById ?? new Map();
	const voiceProfiles = opts.voiceProfiles ?? [];
	const language = opts.language ?? 'en';
	const providerSnapshotId = opts.providerSnapshotId ?? '';
	const takesById = opts.takesById ?? new Map();
	const gateCtx = { assetsById: opts.assetsById, manifestById: opts.manifestById };

	/**
	 * @param {StretchMember[]} bucketMembers
	 * @param {number} durationMs
	 * @param {string[]} [extraBlockers]
	 * @returns {VisualStretchJob}
	 */
	const buildJob = (bucketMembers, durationMs, extraBlockers = []) => {
		const memberInputs = bucketMembers.map((member) => {
			const shot = shotsById.get(member.shotId);
			const { takeIds } = resolveStretchMemberSourceTakeIds(member, shot);
			return {
				order: member.order,
				shotId: member.shotId,
				sourceTakeIds: takeIds,
				keyframeAssetId: keyframeByShotId.get(member.shotId)
			};
		});
		const collected = collectVideoStretchReferences({
			stretch,
			members: bucketMembers,
			shotsById,
			keyframeByShotId,
			entityReferenceIds,
			cuesById,
			voiceProfiles,
			language,
			assetsById: opts.assetsById
		});
		const gate = collectStretchProductionGate(bucketMembers, shotsById, takesById, gateCtx, {
			medium: 'video'
		});
		const stillReferenceAssetIds = [...(stretch.referenceAssetIds || [])];
		const effectiveVideoReferenceAssetIds = collected.effectiveVideoReferenceAssetIds;
		/** @type {string[]} */
		const blockers = [
			'editorial_prompt_freeze_not_approved',
			'seedance_execution_gated',
			...collected.blockers,
			...referenceBudgetBlockers(collected.references, opts.videoLimits),
			...gate.blockers,
			...extraBlockers
		];
		for (const mi of memberInputs) {
			if (!mi.keyframeAssetId) blockers.push(`missing_keyframe:${mi.shotId}`);
		}
		if (durationMs > maxSegmentMs) {
			blockers.push('member_exceeds_max_duration');
		}
		if (!providerSnapshotId) blockers.push('missing_provider_snapshot');
		/** @type {Record<string, unknown>} */
		const videoFields = {
			stillReferenceAssetIds,
			videoReferencePolicy: collected.videoReferencePolicy,
			effectiveVideoReferenceAssetIds,
			voiceSampleAssetIds: collected.voiceSampleAssetIds,
			sharedReferenceAssetIds: effectiveVideoReferenceAssetIds
		};
		if (collected.videoReferencePolicy === 'explicit') {
			videoFields.videoReferenceAssetIds = stretch.videoReferenceAssetIds || [];
		}
		return finalizeStretchJob({
			id: `${stillJobId}:video-${part}`,
			stretchId: stretch.id,
			revision: stretch.revision,
			medium: 'video',
			mode: 'grouped_seedance',
			providerSnapshotId,
			outputTakePolicy: 'new_candidate',
			dependsOnStillJobId: stillJobId,
			durationMs,
			memberInputs,
			...videoFields,
			compiledPrompt: null,
			outputs: [{ order: 1, artifact: 'video' }],
			blockers,
			coherenceException: false,
			...(gate.generationGate ? { generationGate: gate.generationGate } : {})
		}, { maxOutputsPerRequest: opts.maxOutputsPerRequest });
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

/**
 * Build still + optional Seedance jobs for every stretch on a script file.
 * @param {any} file
 * @param {{
 *   maxSegmentMs: number,
 *   stillProvider?: any,
 *   videoProvider?: any,
 *   entityReferenceIds?: Map<string, string[]>,
 *   voiceProfiles?: VoiceProfile[],
 *   language?: string,
 *   assetsById?: Map<string, any>,
 *   manifestById?: Map<string, any>
 * }} opts
 * @returns {VisualStretchJob[]}
 */
export function buildVisualStretchJobs(
	file,
	{
		maxSegmentMs,
		stillProvider,
		videoProvider,
		entityReferenceIds,
		voiceProfiles = [],
		language = 'en',
		assetsById,
		manifestById
	}
) {
	/** @type {VisualStretchJob[]} */
	const jobs = [];
	const shotsById = new Map((file.shots || []).map(/** @param {any} shot */ (shot) => [shot.id, shot]));
	const takesById = new Map((file.takes || []).map(/** @param {any} take */ (take) => [take.id, take]));
	const cuesById = new Map((file.cues || []).map(/** @param {any} cue */ (cue) => [cue.id, cue]));
	const gateCtx = { assetsById, manifestById };

	for (const stretch of file.visualStretches || []) {
		const stillMode = stretch.generationProfile?.stillMode ?? 'combined_storyboard_sheet';
		/** @type {StretchMember[]} */
		const members = [...(stretch.members || [])].sort(
			/** @param {StretchMember} a @param {StretchMember} b */ (a, b) => a.order - b.order
		);
		const memberInputs = members.map((member) => {
			const shot = shotsById.get(member.shotId);
			const { takeIds } = resolveStretchMemberSourceTakeIds(member, shot);
			return { order: member.order, shotId: member.shotId, sourceTakeIds: takeIds };
		});
		const gate = collectStretchProductionGate(members, shotsById, takesById, gateCtx, {
			medium: 'still'
		});
		/** @type {string[]} */
		const blockers = [
			'editorial_prompt_freeze_not_approved',
			...stretchBlockingBlockers(stretch),
			...gate.blockers
		];

		const stillReferences = collectStillStretchReferences(stretch);
		const stillReferenceAssetIds = stillReferences.map((r) => r.id);
		const sharedReferenceAssetIds = stillReferenceAssetIds;
		blockers.push(...referenceBudgetBlockers(stillReferences, stillProvider?.limits));
		for (const assetId of stillReferenceAssetIds) {
			blockers.push(...assetReferenceQualityBlockers(assetId, assetsById, 'image'));
		}
		const jobId = stretchJobId(stretch);
		const allowFourByFour = providerAllowsFourByFour(stillProvider);
		const derivedByShot = new Map();
		for (const take of file.takes || []) {
			if (
				take.generation?.stretchJobId === jobId &&
				take.generation?.visualStretchId === stretch.id
			) {
				derivedByShot.set(take.shotId, take);
			}
		}
		const keyframeByShotId = new Map();
		for (const [shotId, take] of derivedByShot) {
			if (take.imageAssetId) keyframeByShotId.set(shotId, take.imageAssetId);
		}

		const stillSnapshotId = stillProvider?.id ?? '';
		if (!stillSnapshotId) blockers.push('missing_provider_snapshot');

		if (stillMode === 'combined_storyboard_sheet') {
			const gridLayout =
				stretch.generationProfile?.gridLayout ??
				(() => {
					const selected = selectGridForMemberCount(members.length, { allowFourByFour });
					if ('error' in selected) {
						blockers.push(selected.error);
						return {
							rows: 2,
							cols: 2,
							gutterFraction: DEFAULT_GUTTER_FRACTION,
							panelAspect: '16:9',
							blankCells: []
						};
					}
					return {
						rows: selected.rows,
						cols: selected.cols,
						gutterFraction: DEFAULT_GUTTER_FRACTION,
						panelAspect: '16:9',
						blankCells: selected.blankCells
					};
				})();
			const outputSize = selectLargestSuitableOutputSize(
				stillProvider?.outputSizes,
				gridLayout,
				stillProvider?.minPanelResolution
			);
			const layoutErrors = validateGridLayout(gridLayout, members.length, {
				allowFourByFour,
				outputSize,
				minPanelResolution: stillProvider?.minPanelResolution
			});
			for (const err of layoutErrors) blockers.push(err);
			if (!stillProvider?.supportsCombinedStoryboardSheet) {
				blockers.push('still_provider_lacks_combined_sheet');
			}
			const computedMargins = computeMargins(
				outputSize,
				gridLayout.panelAspect ?? '16:9',
				gridLayout.minOuterMarginFraction ?? 0
			);
			const regions = derivePanelRegions(gridLayout, computedMargins);
			jobs.push(
				finalizeStretchJob({
					id: jobId,
					stretchId: stretch.id,
					revision: stretch.revision,
					medium: 'still',
					mode: 'combined_storyboard_sheet',
					providerSnapshotId: stillSnapshotId,
					outputTakePolicy: 'new_candidate',
					memberInputs,
					stillReferenceAssetIds,
					sharedReferenceAssetIds,
					gridLayout,
					computedMargins,
					compiledPrompt: null,
					outputs: [
						{
							order: 1,
							artifact: 'combinedStoryboard',
							assetId: stretch.combinedStillAssetId,
							panels: members.map((member, index) => {
								const derived = derivedByShot.get(member.shotId);
								return {
									order: member.order,
									shotId: member.shotId,
									sourceTakeIds: memberInputs[index].sourceTakeIds,
									frameRegion:
										member.frameRegion ??
										regions[index]?.frameRegion ?? { x: 0, y: 0, w: 1, h: 1 },
									...(derived?.id ? { derivedTakeId: derived.id } : {}),
									...(derived?.imageAssetId ? { derivedAssetId: derived.imageAssetId } : {})
								};
							})
						}
					],
					blockers,
					coherenceException: false,
					...(gate.generationGate ? { generationGate: gate.generationGate } : {})
				}, { maxOutputsPerRequest: stillProvider?.limits?.maxOutputsPerRequest })
			);
		} else {
			jobs.push(
				finalizeStretchJob({
					id: jobId,
					stretchId: stretch.id,
					revision: stretch.revision,
					medium: 'still',
					mode: 'independent_shared_authority',
					providerSnapshotId: stillSnapshotId,
					outputTakePolicy: 'new_candidate',
					memberInputs,
					stillReferenceAssetIds,
					sharedReferenceAssetIds,
					compiledPrompt: null,
					outputs: members.map((member, index) => ({
						order: member.order,
						artifact: 'animaticStill',
						panels: [
							{
								order: member.order,
								shotId: member.shotId,
								sourceTakeIds: memberInputs[index].sourceTakeIds,
								frameRegion: { x: 0, y: 0, w: 1, h: 1 }
							}
						]
					})),
					blockers: [...blockers, 'coherence_exception'],
					coherenceException: true,
					...(gate.generationGate ? { generationGate: gate.generationGate } : {})
				}, { maxOutputsPerRequest: stillProvider?.limits?.maxOutputsPerRequest })
			);
		}

		if (stretch.generationProfile?.videoMode === 'grouped_seedance') {
			const videoJobs = partitionStretchVideoJobs(
				stretch,
				members,
				shotsById,
				maxSegmentMs,
				jobId,
				{
					keyframeByShotId,
					entityReferenceIds: entityReferenceIds ?? new Map(),
					cuesById,
					voiceProfiles,
					language,
					videoLimits: videoProvider?.limits,
					providerSnapshotId: videoProvider?.id ?? '',
					maxOutputsPerRequest: videoProvider?.limits?.maxOutputsPerRequest,
					takesById,
					assetsById,
					manifestById
				}
			);
			jobs.push(...videoJobs);
		}
	}
	return jobs;
}
