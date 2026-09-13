import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { planSegments, resolveDiegeticText, sha256 } from './lib/generation-planning.mjs';
import { buildVisualStretchJobs, pickApprovedVoiceSampleAssetId } from './lib/visual-stretch-jobs.mjs';

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
const videoProvider = providerCapabilities.snapshots.find(
	(item) => item.id === campaign.providerSnapshotId
);
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
		maxSegmentMs: stretchMaxSegmentMs,
		stillProvider,
		videoProvider,
		entityReferenceIds: referenceAssets,
		voiceProfiles,
		language: 'en'
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
