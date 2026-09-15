import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { planSegments, resolveDiegeticText, sha256 } from './lib/generation-planning.mjs';
import { resolveCampaignProviders } from './lib/provider-capabilities.mjs';
import {
	deriveGenerationGateFromTakes,
	resolveShotSourceTakeIds
} from './lib/production-gate.mjs';
import {
	assetPassesCoverageQuality,
	collectShotVisibleEntityIds,
	evaluateReferenceBudget,
	greedyPackCover,
	indexEntityReferenceAssets
} from './lib/reference-budget.mjs';
import { buildVisualStretchJobs, pickApprovedVoiceSampleAssetId } from './lib/visual-stretch-jobs.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');
const campaignId = 'campaign:higgsfield-trial-24h';
const providerCapabilities = JSON.parse(
	readFileSync(join(ROOT, 'data', 'production', 'provider-capabilities.json'), 'utf8')
);
const { campaign, stillProvider, videoProvider } = resolveCampaignProviders(
	providerCapabilities,
	campaignId
);
const maxSegmentMs = campaign.maxSegmentMs;
const stretchMaxSegmentMs = Math.min(
	maxSegmentMs,
	videoProvider?.limits?.maxDurationMs ?? maxSegmentMs
);
const productionContexts = JSON.parse(
	readFileSync(join(ROOT, 'data', 'production', 'contexts.json'), 'utf8')
);
const contextAssignments = productionContexts.assignments;
const voiceProfiles = JSON.parse(readFileSync(join(ROOT, 'data', 'voice-profiles.json'), 'utf8')).voiceProfiles;
const entityFiles = ['characters.json', 'locations.json', 'objects.json', 'vehicles.json'];
/** @type {any[]} */
const catalogEntities = [];
/** @type {Map<string, string[]>} */
const catalogReferenceAssets = new Map();
for (const file of entityFiles) {
	const data = JSON.parse(readFileSync(join(ROOT, 'data', file), 'utf8'));
	for (const collection of Object.values(data).filter(Array.isArray)) {
		for (const entity of collection) {
			catalogEntities.push(entity);
			catalogReferenceAssets.set(entity.id, entity.referenceAssetIds ?? []);
		}
	}
}
const assetsList = JSON.parse(readFileSync(join(ROOT, 'data', 'assets.json'), 'utf8')).assets;
const assetsById = new Map(assetsList.map((asset) => [asset.id, asset]));
const { entityReferenceIds, packEntitiesByAssetId, packAssetIdsByEntity } = indexEntityReferenceAssets({
	catalogs: catalogEntities,
	assets: assetsList
});
const manifestById = new Map(
	JSON.parse(readFileSync(join(ROOT, 'data', 'production', 'asset-generation-manifest.json'), 'utf8')).assets.map(
		(row) => [row.assetId, row]
	)
);
const makeReference = (kind, id, required, role) => {
	const asset = assetsById.get(id);
	if (!asset) throw new Error(`Missing asset ${id} while building generation plan`);
	return { kind, id, ...(asset.path ? { path: asset.path } : {}), required, role };
};
const scripts = ['light-delay-main-short', 'light-delay-festival', 'light-delay-trailer', 'light-delay-long', 'light-delay-festival-master'];
for (const slug of scripts) {
	const scriptPath = join(ROOT, 'data', 'scripts', `${slug}.json`);
	// Normalize CRLF so sourceDigest matches Linux CI checkouts (Windows autocrlf).
	const source = readFileSync(scriptPath, 'utf8').replace(/\r\n/g, '\n');
	const file = JSON.parse(source);
	const takesById = new Map((file.takes || []).map((take) => [take.id, take]));
	const shots = file.shots.map((shot) => {
		const references = [];
		const requiredEntityIds = collectShotVisibleEntityIds(shot);
		const offScreen = new Set(shot.offScreenCharacterIds ?? []);
		for (const entityId of requiredEntityIds) {
			const kind = entityId.startsWith('character:')
				? 'character'
				: entityId.startsWith('location:')
					? 'location'
					: entityId.startsWith('vehicle:')
						? 'vehicle'
						: entityId.startsWith('faction:')
							? 'faction'
							: 'object';
			if (kind === 'character' && offScreen.has(entityId)) continue;
			// Attach catalog solo sheets only — packs are authored on stretches, not auto-inflated per shot.
			for (const assetId of catalogReferenceAssets.get(entityId) ?? []) {
				references.push(makeReference('image', assetId, true, kind));
			}
		}
		let uniqueReferences = [...new Map(references.map((reference) => [reference.id, reference])).values()];
		// A prepared take may carry an explicit per-shot reference set. This is the
		// authoritative override for independent regeneration; it prevents a
		// location catalog default from replacing a shot-specific reference view.
		const selectedTakeForReferences = shot.selectedTakeId
			? takesById.get(shot.selectedTakeId)
			: undefined;
		const authoredReferenceAssetIds = selectedTakeForReferences?.generation?.referenceAssetIds;
		if (Array.isArray(authoredReferenceAssetIds) && authoredReferenceAssetIds.length) {
			uniqueReferences = authoredReferenceAssetIds.map((assetId) => {
				const asset = assetsById.get(assetId);
				if (!asset) throw new Error(`Missing authored reference ${assetId} while building generation plan`);
				const role = assetId.startsWith('asset:character-') ? 'character'
					: assetId.startsWith('asset:location-') ? 'location'
					: assetId.startsWith('asset:vehicle-') ? 'vehicle' : 'object';
				return makeReference('image', assetId, true, role);
			});
		}

		// Consolidate solo character sheets into an existing paired reference sheet when the
		// character count alone would exceed the still image budget — applied algorithmically via
		// the same greedy pack-cover already used for uncovered-entity remediation, so this only
		// ever activates for a shot that would otherwise violate the budget.
		const stillImageCap = stillProvider?.limits?.maxImages ?? null;
		if (stillImageCap != null) {
			const characterEntityIds = requiredEntityIds.filter(
				(entityId) => entityId.startsWith('character:') && !offScreen.has(entityId)
			);
			const soloCharacterRefs = uniqueReferences.filter((reference) => reference.role === 'character');
			const otherImageCount = uniqueReferences.length - soloCharacterRefs.length;
			if (characterEntityIds.length > 1 && soloCharacterRefs.length + otherImageCount > stillImageCap) {
				const compatiblePacks = new Set();
				for (const entityId of characterEntityIds) {
					for (const packId of packAssetIdsByEntity.get(entityId) ?? []) {
						if (assetPassesCoverageQuality(packId, assetsById)) compatiblePacks.add(packId);
					}
				}
				const { selected } = greedyPackCover(characterEntityIds, [...compatiblePacks].sort(), packEntitiesByAssetId);
				const coveredByPacks = new Set();
				const usefulPacks = [];
				for (const packId of selected) {
					const covers = (packEntitiesByAssetId.get(packId) ?? []).filter((id) => characterEntityIds.includes(id));
					if (covers.length < 2) continue;
					usefulPacks.push(packId);
					for (const id of covers) coveredByPacks.add(id);
				}
				if (usefulPacks.length) {
					const soloAssetIdsToRemove = new Set();
					for (const entityId of coveredByPacks) {
						for (const assetId of catalogReferenceAssets.get(entityId) ?? []) soloAssetIdsToRemove.add(assetId);
					}
					uniqueReferences = uniqueReferences.filter((reference) => !soloAssetIdsToRemove.has(reference.id));
					for (const packId of usefulPacks) uniqueReferences.push(makeReference('image', packId, true, 'character'));
				}
			}
		}
		const blockers = [];
		const { takeIds, missingSelectedTake } = resolveShotSourceTakeIds(shot);
		if (missingSelectedTake) blockers.push('missing_selected_take');
		const sourceTakes = takeIds.map((id) => takesById.get(id)).filter(Boolean);
		// Still readiness: holds scoped 'all' or 'still' block the shot (animatic still / frames).
		const gate = deriveGenerationGateFromTakes(sourceTakes, { assetsById, manifestById }, { medium: 'still' });
		blockers.push(...gate.blockers);
		// Video readiness: holds scoped exactly 'video' never touch still readiness; they land on the
		// segments and on a separate videoGenerationGate (all-media holds already cover video above).
		const videoGate = deriveGenerationGateFromTakes(
			sourceTakes,
			{ assetsById, manifestById },
			{ medium: 'video', exclusive: true }
		);
		/** @type {string[]} */
		const videoBlockers = [];
		if (videoGate.generationGate) {
			const marker =
				videoGate.generationGate.status === 'blocked'
					? 'video_generation_blocked'
					: 'video_generation_deferred';
			// Video-scoped holds land on segments/videoGenerationGate only — never the shared
			// still blockers (schema's own videoGenerationGate doc: "never the animatic still").
			videoBlockers.push(marker, ...videoGate.blockers);
		}
		const shotCues = shot.cuePlacements.map((placement) => file.cues.find((cue) => cue.id === placement.cueId)).filter(Boolean);
		const dialogueCues = shotCues.filter((cue) => cue.type === 'dialogue');
		const diegeticText = shotCues.map((cue) => resolveDiegeticText(cue, 'en')).filter(Boolean);
		for (const cue of dialogueCues) {
			const profile = voiceProfiles.find((item) => item.characterId === cue.speakerId);
			const sampleId = pickApprovedVoiceSampleAssetId(profile, 'en');
			if (!sampleId) blockers.push(`missing_voice_sample:${cue.speakerId}`);
			else uniqueReferences.push(makeReference('audio', sampleId, true, 'voice_sample'));
		}
		const hasContext = contextAssignments.some(
			(assignment) =>
				assignment.scriptId === file.script.id &&
				((assignment.shotIds ?? []).includes(shot.id) || (assignment.sceneIds ?? []).includes(shot.sceneId))
		);
		if (!hasContext) blockers.push('missing_production_context');
		if (!shot.purpose?.es || !shot.purpose?.en) blockers.push('missing_purpose');
		if (!shot.composition?.framing?.es || !shot.composition?.framing?.en) blockers.push('missing_framing');
		if (!('visibleRefs' in shot || 'offScreenCharacterIds' in shot)) blockers.push('missing_entity_binding');
		// Still-side editorial prompt freeze lifted for this cut per explicit session
		// authorization (mirrors the stretch-job freeze lift; see AGENT_GENERATION_BRIEF.md).
		const budgetedReferences = [...new Map(uniqueReferences.map((reference) => [`${reference.kind}:${reference.id}`, reference])).values()];
		// Still budget/coverage uses image references only — audio (voice-sample) refs below
		// are for the shot's finalAudio artifact, not the still, and must never count against the
		// still provider budget (mirrors stillReferenceAssetIds on stretch jobs). requiredReferences
		// below stays the full image+audio list — video packages read it.
		const stillBudgetReferences = budgetedReferences.filter((r) => r.kind === 'image');
		const evaluated = evaluateReferenceBudget({
			references: stillBudgetReferences.map((r) => ({ kind: r.kind, id: r.id, role: r.role })),
			limits: stillProvider?.limits || {},
			requiredEntityIds,
			entityReferenceIds,
			packEntitiesByAssetId,
			packAssetIdsByEntity,
			assetsById
		});
		blockers.push(...evaluated.blockers);
		const finalBlockers = [...new Set(blockers)];
		// Still-artifact status/assetId derive from the shot's resolved source take instead of a
		// permanent stub — mirrors Take.imageStatus (ImageEditorialState) onto the artifact schema's
		// enum (missing/generated/accepted); needs_review, needs_regeneration, and needs_replacement
		// all mean 'generated, not yet accepted'.
		const stillTake = sourceTakes[0];
		const animaticStill = !stillTake?.imageAssetId
			? { required: true, status: /** @type {const} */ ('missing') }
			: {
					required: true,
					status: /** @type {const} */ (stillTake.imageStatus?.status === 'current' ? 'accepted' : 'generated'),
					assetId: stillTake.imageAssetId
				};
		return {
			shotId: shot.id,
			status: finalBlockers.length === 0 ? 'ready' : 'blocked',
			blockers: finalBlockers,
			diegeticText,
			artifacts: {
				animaticStill,
				firstFrame: { required: false, status: 'missing' },
				lastFrame: { required: shot.durationMs > maxSegmentMs, status: 'missing' },
				finalAudio: { required: dialogueCues.length > 0, status: 'missing' }
			},
			requiredReferences: budgetedReferences,
			referenceBudget: evaluated.referenceBudget,
			...(evaluated.remediation.length ? { remediation: evaluated.remediation } : {}),
			...(gate.generationGate ? { generationGate: gate.generationGate } : {}),
			...(videoGate.generationGate ? { videoGenerationGate: videoGate.generationGate } : {}),
			segments: planSegments(shot, maxSegmentMs).map((segment) =>
				videoBlockers.length ? { ...segment, blockers: [...new Set(videoBlockers)] } : segment
			)
		};
	});
	const visualStretchJobs = buildVisualStretchJobs(file, {
		maxSegmentMs: stretchMaxSegmentMs,
		stillProvider,
		videoProvider,
		entityReferenceIds,
		packEntitiesByAssetId,
		packAssetIdsByEntity,
		voiceProfiles,
		language: 'en',
		assetsById,
		manifestById
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
