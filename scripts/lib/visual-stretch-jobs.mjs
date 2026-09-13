/**
 * Visual-stretch generation-plan helpers: reference budgets, Seedance partition, job builder.
 * Node-only (imports generation-planning + visual-stretch).
 */

/**
 * @typedef {import('../../src/lib/types/generated/production.ts').GenerationPlanFile44} VisualStretchJob
 * @typedef {{ shotId: string, order: number, takeScope?: string, takeIds?: string[], frameRegion?: { x: number, y: number, w: number, h: number } }} StretchMember
 * @typedef {{ kind: 'image' | 'video' | 'audio', id: string, role?: string }} StretchReference
 * @typedef {{ id: string, characterId: string, variants?: Array<{ language?: string, sampleAssetIds?: string[] }> }} VoiceProfile
 */

import { checkReferenceBudget } from './generation-planning.mjs';
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
 * Dialogue voice samples for speakers who talk in the bucket's shots.
 * @param {{
 *   members: StretchMember[],
 *   shotsById: Map<string, any>,
 *   cuesById?: Map<string, any>,
 *   voiceProfiles?: VoiceProfile[],
 *   language?: string
 * }} args
 * @returns {{ references: StretchReference[], blockers: string[] }}
 */
export function collectDialogueVoiceSampleReferences(args) {
	const {
		members,
		shotsById,
		cuesById = new Map(),
		voiceProfiles = [],
		language = 'en'
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
		references.push({
			kind: /** @type {'audio'} */ ('audio'),
			id: sampleId,
			role: 'voice_sample'
		});
	}
	return { references, blockers };
}

/**
 * Seedance jobs: ordered keyframes + additional visual refs not already in those frames
 * + dialogue voice samples for speakers in the bucket.
 *
 * @param {{
 *   stretch: { referenceAssetIds?: string[], locationId?: string, presentCharacterIds?: string[] },
 *   members: StretchMember[],
 *   shotsById: Map<string, any>,
 *   keyframeByShotId?: Map<string, string>,
 *   entityReferenceIds?: Map<string, string[]>,
 *   cuesById?: Map<string, any>,
 *   voiceProfiles?: VoiceProfile[],
 *   language?: string
 * }} args
 * @returns {{ references: StretchReference[], blockers: string[] }}
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
		language = 'en'
	} = args;
	/** @type {StretchReference[]} */
	const refs = [];
	const coveredAssetIds = new Set();
	const coveredEntityIds = new Set();
	let hasKeyframe = false;

	for (const member of members) {
		const keyframeId = keyframeByShotId.get(member.shotId);
		if (!keyframeId) continue;
		hasKeyframe = true;
		refs.push({
			kind: /** @type {'image'} */ ('image'),
			id: keyframeId,
			role: 'keyframe'
		});
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
		refs.push({
			kind: /** @type {'image'} */ ('image'),
			id: assetId,
			role: 'visual_reference'
		});
	}

	const voice = collectDialogueVoiceSampleReferences({
		members,
		shotsById,
		cuesById,
		voiceProfiles,
		language
	});
	const seenAudio = new Set();
	for (const ref of voice.references) {
		if (seenAudio.has(ref.id)) continue;
		seenAudio.add(ref.id);
		refs.push(ref);
	}
	return { references: refs, blockers: voice.blockers };
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
 * @returns {VisualStretchJob}
 */
function finalizeStretchJob(job) {
	const blockers = [...new Set(job.blockers || [])];
	return /** @type {VisualStretchJob} */ ({
		...job,
		blockers,
		runnable: blockers.length === 0
	});
}

/**
 * Partition stretch members into consecutive Seedance jobs under the segment ceiling.
 * A single member longer than the ceiling is emitted alone with `member_exceeds_max_duration`
 * and `runnable: false` (descriptor retained for diagnostics; must not be submitted).
 *
 * @param {{ id: string, revision: number, referenceAssetIds?: string[], locationId?: string, presentCharacterIds?: string[] }} stretch
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
 *   videoLimits?: { maxImages?: number | null, maxVideos?: number | null, maxAudios?: number | null, maxTotalReferences?: number | null }
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

	/**
	 * @param {StretchMember[]} bucketMembers
	 * @param {number} durationMs
	 * @param {string[]} [extraBlockers]
	 * @returns {VisualStretchJob}
	 */
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
		const { references, blockers: voiceBlockers } = collectVideoStretchReferences({
			stretch,
			members: bucketMembers,
			shotsById,
			keyframeByShotId,
			entityReferenceIds,
			cuesById,
			voiceProfiles,
			language
		});
		/** @type {string[]} */
		const blockers = [
			'editorial_prompt_freeze_not_approved',
			'seedance_execution_gated',
			...voiceBlockers,
			...referenceBudgetBlockers(references, opts.videoLimits),
			...extraBlockers
		];
		if (durationMs > maxSegmentMs) {
			blockers.push('member_exceeds_max_duration');
		}
		return finalizeStretchJob({
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
			blockers,
			coherenceException: false
		});
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
 *   language?: string
 * }} opts
 * @returns {VisualStretchJob[]}
 */
export function buildVisualStretchJobs(
	file,
	{ maxSegmentMs, stillProvider, videoProvider, entityReferenceIds, voiceProfiles = [], language = 'en' }
) {
	/** @type {VisualStretchJob[]} */
	const jobs = [];
	const shotsById = new Map((file.shots || []).map(/** @param {any} shot */ (shot) => [shot.id, shot]));
	const cuesById = new Map((file.cues || []).map(/** @param {any} cue */ (cue) => [cue.id, cue]));

	for (const stretch of file.visualStretches || []) {
		const stillMode = stretch.generationProfile?.stillMode ?? 'combined_storyboard_sheet';
		/** @type {StretchMember[]} */
		const members = [...(stretch.members || [])].sort(
			/** @param {StretchMember} a @param {StretchMember} b */ (a, b) => a.order - b.order
		);
		const memberInputs = members.map((member) => {
			const shot = shotsById.get(member.shotId);
			const sourceTakeIds =
				member.takeScope === 'explicit'
					? member.takeIds ?? []
					: shot?.selectedTakeId
						? [shot.selectedTakeId]
						: [];
			return { order: member.order, shotId: member.shotId, sourceTakeIds };
		});
		/** @type {string[]} */
		const blockers = [
			'editorial_prompt_freeze_not_approved',
			...stretchBlockingBlockers(stretch)
		];

		const stillReferences = collectStillStretchReferences(stretch);
		const sharedReferenceAssetIds = stillReferences.map((r) => r.id);
		blockers.push(...referenceBudgetBlockers(stillReferences, stillProvider?.limits));
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
					outputTakePolicy: 'new_candidate',
					memberInputs,
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
					coherenceException: false
				})
			);
		} else {
			jobs.push(
				finalizeStretchJob({
					id: jobId,
					stretchId: stretch.id,
					revision: stretch.revision,
					medium: 'still',
					mode: 'independent_shared_authority',
					outputTakePolicy: 'new_candidate',
					memberInputs,
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
					coherenceException: true
				})
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
					videoLimits: videoProvider?.limits
				}
			);
			jobs.push(...videoJobs);
		}
	}
	return jobs;
}
