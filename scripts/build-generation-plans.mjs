import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { planSegments, resolveDiegeticText, sha256 } from './lib/generation-planning.mjs';
import {
	computeMargins,
	derivePanelRegions,
	DEFAULT_GUTTER_FRACTION,
	stretchJobId,
	validateGridLayout
} from './lib/visual-stretch.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');
const campaignId = 'campaign:higgsfield-trial-24h';
const providerCapabilities = JSON.parse(
	readFileSync(join(ROOT, 'data', 'production', 'provider-capabilities.json'), 'utf8')
);
const campaign = providerCapabilities.campaigns.find((item) => item.id === campaignId);
if (!campaign) throw new Error(`Missing campaign ${campaignId} in provider-capabilities.json`);
const maxSegmentMs = campaign.maxSegmentMs;
const stillProvider = providerCapabilities.snapshots.find(
	(item) => item.id === 'provider:openai:gpt-image-2:2026-09-13'
);
const productionContexts = JSON.parse(
	readFileSync(join(ROOT, 'data', 'production', 'contexts.json'), 'utf8')
);
const contextAssignments = productionContexts.assignments;
const voiceProfiles = JSON.parse(readFileSync(join(ROOT, 'data', 'voice-profiles.json'), 'utf8')).voiceProfiles;
const entityFiles = ['characters.json', 'locations.json', 'objects.json', 'vehicles.json'];
const referenceAssets = new Map();
for (const file of entityFiles) {
	const data = JSON.parse(readFileSync(join(ROOT, 'data', file), 'utf8'));
	for (const collection of Object.values(data).filter(Array.isArray)) {
		for (const entity of collection) referenceAssets.set(entity.id, entity.referenceAssetIds ?? []);
	}
}
const assetsById = new Map(
	JSON.parse(readFileSync(join(ROOT, 'data', 'assets.json'), 'utf8')).assets.map((asset) => [asset.id, asset])
);
const makeReference = (kind, id, required, role) => {
	const asset = assetsById.get(id);
	if (!asset) throw new Error(`Missing asset ${id} while building generation plan`);
	return { kind, id, ...(asset.path ? { path: asset.path } : {}), required, role };
};
const locationReferences = new Map(referenceAssets);
const scripts = ['light-delay-main-short', 'light-delay-festival', 'light-delay-trailer', 'light-delay-long', 'light-delay-festival-master'];
for (const slug of scripts) {
	const scriptPath = join(ROOT, 'data', 'scripts', `${slug}.json`);
	// Normalize CRLF so sourceDigest matches Linux CI checkouts (Windows autocrlf).
	const source = readFileSync(scriptPath, 'utf8').replace(/\r\n/g, '\n');
	const file = JSON.parse(source);
	const shots = file.shots.map((shot) => {
		const references = [];
		const offScreen = new Set(shot.offScreenCharacterIds ?? []);
		for (const ref of shot.visibleRefs ?? []) {
			if (ref.kind === 'character' && offScreen.has(ref.id)) continue;
			for (const assetId of referenceAssets.get(ref.id) ?? []) references.push(makeReference('image', assetId, true, ref.kind));
		}
		for (const locationId of [shot.locationId, ...(shot.secondaryLocationIds ?? [])].filter(Boolean)) {
			for (const assetId of locationReferences.get(locationId) ?? []) references.push(makeReference('image', assetId, true, 'location'));
		}
		const uniqueReferences = [...new Map(references.map((reference) => [reference.id, reference])).values()];
		const blockers = [];
		const shotCues = shot.cuePlacements.map((placement) => file.cues.find((cue) => cue.id === placement.cueId)).filter(Boolean);
		const dialogueCues = shotCues.filter((cue) => cue.type === 'dialogue');
		const diegeticText = shotCues.map((cue) => resolveDiegeticText(cue, 'en')).filter(Boolean);
		for (const cue of dialogueCues) {
			const profile = voiceProfiles.find((item) => item.characterId === cue.speakerId);
			const samples = profile?.variants.flatMap((variant) => variant.sampleAssetIds ?? []) ?? [];
			if (!samples.length) blockers.push(`missing_voice_sample:${cue.speakerId}`);
			for (const assetId of samples) uniqueReferences.push(makeReference('audio', assetId, true, 'voice_sample'));
		}
		const hasContext = contextAssignments.some(
			(assignment) =>
				assignment.scriptId === file.script.id &&
				((assignment.shotIds ?? []).includes(shot.id) || (assignment.sceneIds ?? []).includes(shot.sceneId))
		);
		if (!hasContext) blockers.push('missing_production_context');
		if (!shot.purpose?.es || !shot.purpose?.en) blockers.push('missing_purpose');
		if (!shot.composition?.framing?.es || !shot.composition?.framing?.en) blockers.push('missing_framing');
		if (!(shot.visibleRefs?.length || shot.offScreenCharacterIds?.length)) blockers.push('missing_entity_binding');
		blockers.push('editorial_prompt_freeze_not_approved');
		const budgetedReferences = [...new Map(uniqueReferences.map((reference) => [`${reference.kind}:${reference.id}`, reference])).values()];
		return {
			shotId: shot.id,
			status: 'blocked',
			blockers: [...new Set(blockers)],
			diegeticText,
			artifacts: {
				animaticStill: { required: true, status: 'missing' },
				firstFrame: { required: false, status: 'missing' },
				lastFrame: { required: shot.durationMs > maxSegmentMs, status: 'missing' },
				finalAudio: { required: dialogueCues.length > 0, status: 'missing' }
			},
			requiredReferences: budgetedReferences,
			segments: planSegments(shot, maxSegmentMs)
		};
	});
	const visualStretchJobs = buildVisualStretchJobs(file, {
		maxSegmentMs,
		stillProvider
	});
	const plan = {
		schemaVersion: '1.0.0',
		plan: {
			id: `generation-plan:${slug}`,
			scriptId: file.script.id,
			scriptVersion: file.script.version,
			sourceDigest: sha256(source),
			campaignId,
		status: file.script.status === 'deprecated' ? 'obsolete' : 'blocked',
		promptLanguage: 'en',
		diegeticTextLanguage: 'en',
		briefLanguage: 'es'
		},
		shots,
		visualStretchJobs
	};
	const output = `${JSON.stringify(plan, null, 2)}\n`;
	const outputPath = join(ROOT, 'data', 'production', 'plans', `${slug}.json`);
	if (checkOnly) {
		if (!existsSync(outputPath) || readFileSync(outputPath, 'utf8') !== output) throw new Error(`${outputPath} is stale; run npm run production:plans`);
	} else {
		mkdirSync(dirname(outputPath), { recursive: true });
		writeFileSync(outputPath, output, 'utf8');
	}
}
console.log(`production:plans:${checkOnly ? 'check' : 'build'} OK`);

/**
 * @param {object} file
 * @param {{ maxSegmentMs: number, stillProvider?: object }} opts
 */
function buildVisualStretchJobs(file, { maxSegmentMs, stillProvider }) {
	const jobs = [];
	const shotsById = new Map((file.shots || []).map((shot) => [shot.id, shot]));
	for (const stretch of file.visualStretches || []) {
		const stillMode = stretch.generationProfile?.stillMode ?? 'combined_storyboard_sheet';
		const members = [...(stretch.members || [])].sort((a, b) => a.order - b.order);
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
		const blockers = ['editorial_prompt_freeze_not_approved'];
		const incompleteBlocking = (stretch.presentCharacterIds || []).some((characterId) => {
			const row = (stretch.blocking || []).find((b) => b.characterId === characterId);
			return !row?.zoneOrSeat || !row?.posture;
		});
		if (incompleteBlocking) blockers.push('missing_stretch_blocking');

		const sharedReferenceAssetIds = [...(stretch.referenceAssetIds || [])];
		const jobId = stretchJobId(stretch);

		if (stillMode === 'combined_storyboard_sheet') {
			const gridLayout = stretch.generationProfile?.gridLayout ?? {
				rows: 2,
				cols: 2,
				gutterFraction: DEFAULT_GUTTER_FRACTION,
				panelAspect: '16:9',
				blankCells: []
			};
			const outputSize = stillProvider?.outputSizes?.[0] ?? { width: 1536, height: 1024 };
			const layoutErrors = validateGridLayout(gridLayout, members.length, {
				allowFourByFour: Boolean(
					stillProvider?.supportedStoryboardLayouts?.some((l) => l.rows === 4 && l.columns === 4)
				),
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
			jobs.push({
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
						panels: members.map((member, index) => ({
							order: member.order,
							shotId: member.shotId,
							sourceTakeIds: memberInputs[index].sourceTakeIds,
							frameRegion: member.frameRegion ?? regions[index]?.frameRegion ?? { x: 0, y: 0, w: 1, h: 1 }
						}))
					}
				],
				blockers: [...new Set(blockers)],
				coherenceException: false
			});
		} else {
			jobs.push({
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
				blockers: [...new Set([...blockers, 'coherence_exception'])],
				coherenceException: true
			});
		}

		if (stretch.generationProfile?.videoMode === 'grouped_seedance') {
			const videoJobs = partitionStretchVideoJobs(stretch, members, shotsById, maxSegmentMs, jobId);
			jobs.push(...videoJobs);
		}
	}
	return jobs;
}

/**
 * Partition stretch members into consecutive Seedance jobs under the segment ceiling.
 */
function partitionStretchVideoJobs(stretch, members, shotsById, maxSegmentMs, stillJobId) {
	const jobs = [];
	let bucket = [];
	let bucketMs = 0;
	let part = 1;
	const flush = () => {
		if (!bucket.length) return;
		jobs.push({
			id: `${stillJobId}:video-${part}`,
			stretchId: stretch.id,
			revision: stretch.revision,
			medium: 'video',
			mode: 'grouped_seedance',
			outputTakePolicy: 'new_candidate',
			dependsOnStillJobId: stillJobId,
			memberInputs: bucket.map((member) => {
				const shot = shotsById.get(member.shotId);
				return {
					order: member.order,
					shotId: member.shotId,
					sourceTakeIds: shot?.selectedTakeId ? [shot.selectedTakeId] : [],
					keyframeAssetId: undefined
				};
			}),
			sharedReferenceAssetIds: [...(stretch.referenceAssetIds || [])],
			compiledPrompt: null,
			outputs: [{ order: 1, artifact: 'video' }],
			blockers: ['editorial_prompt_freeze_not_approved', 'seedance_execution_gated'],
			coherenceException: false
		});
		part += 1;
		bucket = [];
		bucketMs = 0;
	};
	for (const member of members) {
		const duration = shotsById.get(member.shotId)?.durationMs ?? 0;
		if (bucket.length && bucketMs + duration > maxSegmentMs) flush();
		bucket.push(member);
		bucketMs += duration;
	}
	flush();
	return jobs;
}
