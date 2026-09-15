#!/usr/bin/env node
/**
 * Generate a Festival-master storyboard still via Black Forest Labs FLUX.2.
 *
 * Prompting follows BFL FLUX.2 [pro]/[max] guidance:
 * - No negative prompts (describe desired state positively)
 * - Subject → action → style → context; name multi-ref roles as Image 1/2/3
 * - disable_pup so authored storyboard text is not rewritten
 *
 * Default is dry-run (no spend). Pass --submit to call the API.
 * Iterate with flux-2-pro; finalize with --model flux-2-max.
 *
 * Setup: BFL_API_KEY in env or local .env (gitignored).
 *
 * Examples:
 *   node scripts/generate-bfl-still.mjs --shot 042
 *   node scripts/generate-bfl-still.mjs --shot 042 --submit
 *   node scripts/generate-bfl-still.mjs --shot 042 --submit --model flux-2-max
 *   node scripts/generate-bfl-still.mjs --shot 042 --submit --soften-blood
 */

import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
	bflGetCredits,
	bflPollUntilReady,
	bflSubmitFlux2,
	downloadToFile,
	fileToBflImagePayload,
	loadEnvFile,
	requireBflApiKey
} from './lib/bfl-client.mjs';

loadEnvFile();

const ROOT = resolve(process.cwd());
const args = process.argv.slice(2);

function flag(name) {
	return args.includes(`--${name}`);
}
function opt(name, fallback) {
	const i = args.indexOf(`--${name}`);
	if (i >= 0 && args[i + 1] && !args[i + 1].startsWith('--')) return args[i + 1];
	return fallback;
}

const shotNum = opt('shot', '042');
const model = opt('model', 'flux-2-pro');
const safetyTolerance = Number(opt('safety', '5'));
const width = Number(opt('width', '1536'));
const height = Number(opt('height', '864'));
const submit = flag('submit');
const creditsOnly = flag('credits');
const softenBlood = flag('soften-blood');
const useJson = flag('json-prompt');

const script = JSON.parse(
	readFileSync(resolve(ROOT, 'data/scripts/light-delay-festival-master.json'), 'utf8')
);
const assets = JSON.parse(readFileSync(resolve(ROOT, 'data/assets.json'), 'utf8'));
const byId = new Map(assets.assets.map((a) => [a.id, a]));

const shotId = `festival-master:shot-plan-${shotNum}`;
const shot = script.shots.find((s) => s.id === shotId);
if (!shot) {
	console.error(`Unknown shot ${shotId}`);
	process.exit(1);
}
const take = script.takes.find((t) => t.id === shot.selectedTakeId);
if (!take?.generation?.prompt) {
	console.error(`Selected take missing generation.prompt: ${shot.selectedTakeId}`);
	process.exit(1);
}

const refIds = take.generation.referenceAssetIds || [];
const refPaths = refIds.map((id) => {
	const a = byId.get(id);
	if (!a?.path) throw new Error(`Missing asset ${id}`);
	return { id, path: resolve(ROOT, 'static' + a.path) };
});

/** Map known asset ids to Flux multi-ref role lines (Image N = …). */
const REF_ROLE_BY_ASSET = {
	'asset:character-sorell-sheet':
		'Sorell character sheet — identity and shipboard wardrobe authoritative (not an EVA suit)',
	'asset:character-zao-sheet':
		'Zao character sheet — identity and engineer wardrobe authoritative',
	'asset:location-celestial-ardor-reactor-service-bay-sheet':
		'Celestial Ardor outer reactor service bay location sheet — geography and practical lighting authoritative',
	'asset:character-harlan-sheet': 'Harlan character sheet — identity and wardrobe authoritative',
	'asset:character-okoye-sheet':
		'Okoye character sheet — identity, security flight suit, and kit authoritative',
	'asset:location-celestial-ardor-service-cylinder-sheet':
		'Celestial Ardor service-cylinder concept sheet (current) — circular restricted shaft geography authoritative',
	'asset:object-wired-comms-deck-patch-panel-sheet':
		'Wired communications distributor / COM tray prop sheet — tray and coupler identity authoritative',
	'asset:festival-master-storyboard-026':
		'Approved shot-026 keyframe — continuity lock for service-cylinder geography and prop placement'
};

function softenInjuryLanguage(text) {
	return text
		.replace(/\bbloodied\b/gi, 'injured')
		.replace(
			/tries to stop blood that no longer circulates/gi,
			'checks for injury and tries to aid her'
		)
		.replace(/\bblood\b/gi, 'injury residue');
}

/**
 * FLUX.2 has no negative prompts. Convert common still-prompt bans into
 * positive framing; drop residual "Avoid:" dumps.
 */
function positiveConstraintsFromNegative(neg) {
	if (!neg || typeof neg !== 'string') return [];
	const out = [];
	const n = neg.toLowerCase();
	if (/planet|earth|jupiter|proxima/.test(n)) {
		out.push('Interior only; no planetary discs or exterior planet views.');
	}
	if (/extra|other crew|unlisted/.test(n)) {
		out.push('Only the named characters are present; the frame is otherwise empty of crew.');
	}
	if (/transmitter|optical/.test(n)) {
		out.push('Optical transmitter remains outside the frame.');
	}
	if (/service-shaft tray|tray in frame/.test(n)) {
		out.push('Service-shaft tray remains outside the frame.');
	}
	if (/eva/.test(n)) {
		out.push('Wardrobe is shipboard clothing from the character sheets, not EVA suits.');
	}
	if (/luxury|anachronistic/.test(n)) {
		out.push('Grounded utilitarian hard-SF look; no luxury-liner styling.');
	}
	if (/watermark|subtitle|logo/.test(n)) {
		out.push('Clean frame with no watermark, burned-in subtitles, or logos.');
	}
	if (/motion blur/.test(n)) {
		out.push('Sharp focus throughout; no heavy motion blur.');
	}
	if (/bridge|spiral|helical/.test(n)) {
		out.push('No bridge interior and no spiral or helical central-access stairs.');
	}
	return out;
}

/** Load-bearing physics/atmosphere that GPT stills often omit and Flux invents against. */
function physicsAndAtmosphereLocks() {
	return [
		'Physics is true microgravity: both bodies float and drift; loose straps, hair, and small droplets float freely; there is no usable floor and nobody kneels, stands, or plants weight on a deck.',
		'Clear hard-edged practical lighting only; clean air with no smoke, haze, fog, volumetric god-rays, or dusty atmosphere.'
	];
}

function buildFluxNaturalPrompt() {
	const roles = refPaths.map((r, i) => {
		const role = REF_ROLE_BY_ASSET[r.id] || `${r.id} — visual reference`;
		return `Image ${i + 1} = ${role}`;
	});

	let beat = shot.description?.en || take.generation.prompt;
	if (softenBlood) beat = softenInjuryLanguage(beat);

	// Shot-specific Flux-native rewrite for 042 (storyboard peak, not sheet collage).
	if (shotNum === '042') {
		beat = softenBlood
			? 'Sorell screen-left floats while cradling injured unconscious Zao screen-right; she braces from a handhold, checks airway and pulse, and tries to aid her. Both are suspended mid-bay, not resting on any surface.'
			: 'Sorell screen-left floats while cradling injured unconscious Zao screen-right; she braces from a handhold, checks airway and pulse, and tries to stop bleeding that no longer circulates. Both are suspended mid-bay, not resting on any surface.';
	}

	const positives = [
		'Create one continuous 16:9 cinematic hard-science-fiction storyboard still — a single film frame, not a contact sheet or multi-panel layout.',
		...roles.map((line) => `${line}.`),
		beat,
		...physicsAndAtmosphereLocks(),
		'Medium close-up, shot on Arri Alexa, 35mm lens, cool graphite and slate-blue console practicals with restrained hatch spill, photoreal VFX quality, crisp air.',
		'Preserve outer-bay geography from the location reference.',
		...positiveConstraintsFromNegative(take.generation.negativePrompt)
	];

	return positives.filter(Boolean).join(' ');
}

function buildFluxJsonPrompt() {
	const natural = buildFluxNaturalPrompt();
	const payload = {
		task: 'single 16:9 cinematic storyboard still (not a contact sheet)',
		references: refPaths.map((r, i) => ({
			image: i + 1,
			assetId: r.id,
			role: REF_ROLE_BY_ASSET[r.id] || r.id
		})),
		scene: shot.description?.en || '',
		subjects: (shot.visibleRefs || [])
			.filter((v) => v.kind === 'character')
			.map((v) => ({
				id: v.id,
				role: v.role
			})),
		composition: shot.composition?.framing?.en || shot.composition?.size || 'MS',
		camera: {
			movement: shot.camera?.movement,
			style: 'Arri Alexa, 35mm, cinematic hard-SF'
		},
		physics:
			'true microgravity; bodies float; no kneeling or standing on a deck; handhold brace only',
		atmosphere: 'clear air; no smoke, haze, fog, or volumetric dust',
		style: 'grounded photoreal hard science fiction storyboard',
		constraints: [
			...physicsAndAtmosphereLocks(),
			...positiveConstraintsFromNegative(take.generation.negativePrompt)
		],
		instruction: natural
	};
	return JSON.stringify(payload);
}

const fluxPrompt = useJson ? buildFluxJsonPrompt() : buildFluxNaturalPrompt();

const outMp = (width * height) / 1_048_576;
const approxUsd = model.includes('max')
	? Math.max(0.07, 0.07 * outMp)
	: Math.max(0.045, 0.045 * outMp);

console.log(
	JSON.stringify(
		{
			mode: submit ? 'SUBMIT' : 'DRY_RUN',
			shotId,
			selectedTakeId: shot.selectedTakeId,
			model,
			width,
			height,
			outputMp: Number(outMp.toFixed(2)),
			approxUsdFloor: Number(approxUsd.toFixed(3)),
			safetyTolerance,
			softenBlood,
			useJson,
			disablePup: true,
			refs: refPaths.map((r) => ({ id: r.id, path: r.path })),
			prompt: fluxPrompt
		},
		null,
		2
	)
);

if (creditsOnly || submit) {
	const apiKey = requireBflApiKey();
	const credits = await bflGetCredits(apiKey);
	console.log('credits', credits);
	if (creditsOnly && !submit) process.exit(0);
}

if (!submit) {
	console.log(
		'\nDry-run only. When ready:\n  npm run bfl:still:042 -- --submit\n  npm run bfl:still:042 -- --submit --model flux-2-max\n'
	);
	process.exit(0);
}

const apiKey = requireBflApiKey();
console.log('Encoding reference images…');
const inputImages = refPaths.map((r) => fileToBflImagePayload(r.path));

console.log(`Submitting ${model}…`);
const submitted = await bflSubmitFlux2({
	apiKey,
	model,
	prompt: fluxPrompt,
	inputImages,
	width,
	height,
	safetyTolerance,
	disablePup: true,
	outputFormat: 'png'
});
console.log('submitted', {
	id: submitted.id,
	cost: submitted.cost,
	input_mp: submitted.input_mp,
	output_mp: submitted.output_mp,
	polling_url: submitted.polling_url
});

const result = await bflPollUntilReady(apiKey, submitted.polling_url, {
	intervalMs: 2000,
	onStatus: (status) => console.log('status', status)
});

const sampleUrl = result?.result?.sample;
if (!sampleUrl) {
	console.error('Ready but no sample URL', result);
	process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = resolve(ROOT, 'tmp/bfl', `shot-${shotNum}`, stamp);
mkdirSync(outDir, { recursive: true });
const outPng = resolve(outDir, `${shotNum}-${model}.png`);
await downloadToFile(sampleUrl, outPng);

const metaPath = resolve(outDir, 'result.json');
writeFileSync(
	metaPath,
	JSON.stringify(
		{
			shotId,
			selectedTakeId: shot.selectedTakeId,
			model,
			width,
			height,
			safetyTolerance,
			softenBlood,
			useJson,
			submitted,
			resultStatus: result.status,
			sampleUrl,
			outputPath: outPng,
			prompt: fluxPrompt,
			referenceAssetIds: refIds,
			generatedAt: new Date().toISOString()
		},
		null,
		2
	) + '\n'
);

console.log(
	JSON.stringify(
		{
			ok: true,
			outputPath: outPng,
			metaPath,
			cost: submitted.cost,
			note: 'Candidate only — not registered into assets.json / animatic. Review before promotion.'
		},
		null,
		2
	)
);
