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
	collectShotVisibleEntityIds,
	evaluateReferenceBudget,
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
		const uniqueReferences = [...new Map(references.map((reference) => [reference.id, reference])).values()];
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
			blockers.push(marker);
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
		if (!(shot.visibleRefs?.length || shot.offScreenCharacterIds?.length)) blockers.push('missing_entity_binding');
		blockers.push('editorial_prompt_freeze_not_approved');
		const budgetedReferences = [...new Map(uniqueReferences.map((reference) => [`${reference.kind}:${reference.id}`, reference])).values()];
		const evaluated = evaluateReferenceBudget({
			references: budgetedReferences.map((r) => ({ kind: r.kind, id: r.id, role: r.role })),
			limits: stillProvider?.limits || {},
			requiredEntityIds,
			entityReferenceIds,
			packEntitiesByAssetId,
			packAssetIdsByEntity,
			assetsById
		});
		blockers.push(...evaluated.blockers);
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
