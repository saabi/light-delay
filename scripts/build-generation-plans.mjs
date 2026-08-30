import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { planSegments, resolveDiegeticText, sha256 } from './lib/generation-planning.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');
const campaignId = 'campaign:higgsfield-trial-24h';
const maxSegmentMs = 8000;
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
const scripts = ['light-delay-main-short', 'light-delay-festival', 'light-delay-trailer', 'light-delay-long'];
for (const slug of scripts) {
	const scriptPath = join(ROOT, 'data', 'scripts', `${slug}.json`);
	const source = readFileSync(scriptPath, 'utf8');
	const file = JSON.parse(source);
	const shots = file.shots.map((shot) => {
		const references = [];
		for (const ref of shot.visibleRefs ?? []) {
			for (const assetId of referenceAssets.get(ref.id) ?? []) references.push({ kind: 'image', id: assetId, required: true, role: ref.kind });
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
			for (const assetId of samples) uniqueReferences.push({ kind: 'audio', id: assetId, required: true, role: 'voice_sample' });
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
	const plan = {
		schemaVersion: '1.0.0',
		plan: {
			id: `generation-plan:${slug}`,
			scriptId: file.script.id,
			scriptVersion: file.script.version,
			sourceDigest: sha256(source),
			campaignId,
		status: 'blocked',
		promptLanguage: 'en',
		diegeticTextLanguage: 'en',
		briefLanguage: 'es'
		},
		shots
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
