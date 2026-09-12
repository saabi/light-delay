import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('..', import.meta.url)));
const scriptPath = join(ROOT, 'data/scripts/light-delay-festival-master.json');
const assetsPath = join(ROOT, 'data/assets.json');
const manifestPath = join(ROOT, 'data/production/asset-generation-manifest.json');

const shotNames = [
	'title',
	...Array.from({ length: 96 }, (_, index) => String(index + 1).padStart(3, '0')).flatMap((name) =>
		name === '013' ? [name, '013b'] : name === '040' ? [name, '040b'] : [name]
	),
	'016b',
	'credit-01',
	'credit-02',
	'credit-03'
];
const script = JSON.parse(readFileSync(scriptPath, 'utf8'));
const assetsFile = JSON.parse(readFileSync(assetsPath, 'utf8'));
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const shotsById = new Map(script.shots.map((shot) => [shot.id, shot]));
const takesByShotId = new Map(script.takes.map((take) => [take.shotId, take]));
const assetsById = new Map(assetsFile.assets.map((asset) => [asset.id, asset]));
const manifestIds = new Set(manifest.assets.map((asset) => asset.assetId));
const generatedAt = '2026-09-12T00:00:00.000Z';

function localized(en, es = en) {
	return { es, en };
}

for (const name of shotNames) {
	const shotId = `festival-master:shot-plan-${name}`;
	const shot = shotsById.get(shotId);
	const take = takesByShotId.get(shotId);
	if (!shot || !take) throw new Error(`Missing Festival-master shot/take for ${shotId}`);

	const filename = `shot-plan-${name}.png`;
	const outputPath = `/assets/animatic/frames/festival-master/${filename}`;
	if (!existsSync(join(ROOT, 'static', outputPath.replace(/^\//, '')))) {
		throw new Error(`Missing generated storyboard image ${outputPath}`);
	}

	const assetId = `asset:festival-master-storyboard-${name}`;
	if (name === '016b') {
		take.generation = {
			...(take.generation ?? {}),
			referenceAssetIds: [
				'asset:location-velari-wormhole-mouth-sheet',
				'asset:vehicle-celestial-ardor-jupiter',
				'asset:vehicle-celestial-ardor-proportional'
			]
		};
	}
	if (name === 'title') {
		take.generation = {
			...(take.generation ?? {}),
			referenceAssetIds: [
				'asset:location-proxima-station-berthed',
				'asset:vehicle-celestial-ardor-jupiter',
				'asset:vehicle-celestial-ardor-jupiter'
			]
		};
	}
	const refs = (take.generation?.referenceAssetIds ?? []).map((referenceId) => ({
		assetId: referenceId,
		role: 'visual continuity reference'
	}));
	const inputImages = (take.generation?.referenceAssetIds ?? []).map((referenceId) => `Reference asset: ${referenceId}`);
	const location = shot.locationId ?? 'shipboard or station setting';
	const visibleCharacters = (shot.visibleRefs ?? [])
		.filter((ref) => ref.kind === 'character' && !(shot.offScreenCharacterIds ?? []).includes(ref.id))
		.map((ref) => ref.id)
		.join(', ');
	const prompt = {
		useCase: 'stylized-concept',
		assetType: 'Festival-master storyboard still',
		primaryRequest: shot.description?.en ?? `Storyboard still for ${shotId}`,
		inputImages,
		sceneBackdrop: `Continuity setting ${location}.`,
		subject: visibleCharacters || 'The subjects specified by the shot description.',
		styleMedium: 'Grounded cinematic hard-science-fiction storyboard concept art matching the attached Light Delay references.',
		compositionFraming: `${shot.composition?.size ?? 'production'} composition, ${shot.composition?.aspectRatio ?? '16:9'} aspect ratio; follow the shot camera plan.`,
		lightingMood: 'Practical cinematic lighting appropriate to the shot description and ship/station continuity.',
		colorPalette: 'Cool graphite, off-white, slate-blue and restrained practical amber accents.',
		materialsTextures: 'Worn maintainable spacecraft and station surfaces, physically plausible hardware and textiles.',
		textVerbatim: 'English-only diegetic text where the shot requires it; no bilingual display text.',
		constraints: 'Use only the visible characters and props declared by the shot; preserve current Celestial Ardor and Proxima geography; no watermark.',
		avoid: 'Off-screen characters, obsolete location layouts, extra people, fantasy technology, logos, watermark.'
	};
	if (name === 'title') {
		prompt.primaryRequest = 'Corrected opening title card: Proxima Station and the Celestial Ardor are in the Sun–Jupiter system near Jupiter, never near Earth. Show Jupiter unmistakably in the background; no Earth anywhere. Keep the exact English title text LIGHT DELAY.';
		prompt.sceneBackdrop = 'Exterior Proxima Station in the Sun–Jupiter system, with Jupiter dominant in the distant background.';
		prompt.constraints = 'Use the attached Proxima Station, Ardor, and Jupiter references; preserve the title-card composition and typography; Jupiter is the only planetary body; no Earth; no bilingual display text; no watermark.';
		prompt.avoid = 'Earth, blue terrestrial planet, Earth city lights, Earth sunrise, obsolete geography, extra text, logo, watermark.';
		take.generation.prompt = 'Grounded cinematic hard science fiction, photoreal render quality. Static 16:9 opening title card at Proxima Station in the Sun–Jupiter system. The station and the Celestial Ardor are near Jupiter, before departure toward the Jupiter-mouth throat; Jupiter dominates the left background with unmistakable banded cloud detail. Preserve the established rotating station ring-and-spine geometry and Ardor axial silhouette. Hold the exact English title text "LIGHT DELAY" in clean thin widely tracked white sans-serif lettering across the dark negative space. No Earth, no Earth-like blue planet, no continents, no Earth city lights, no other text. Locked camera, quiet observational mood, cold starlight and restrained warm Jovian reflections, grounded cinematic hard-science-fiction concept art, 16:9.';
	}

	const asset = {
		id: assetId,
		kind: 'image',
		role: 'production',
		path: outputPath,
		mimeType: 'image/png',
		title: localized(`Festival Master storyboard ${name}`, `Storyboard Festival Master ${name}`),
		description: localized(
			`Generated storyboard still for ${shotId}; pending editorial review.`,
			`Imagen de storyboard generada para ${shotId}; pendiente de revisión editorial.`
		),
		width: 1672,
		height: 941,
		source: { provider: 'OpenAI', model: 'gpt-image-2', generatedAt },
		metadata: {
			scriptId: 'script:light-delay-festival-master',
			shotId,
			batch: 'festival-master-storyboard-01',
			storyboardEligible: true
		},
		imageStatus: {
			status: 'needs_review',
			reasons: ['quality'],
			explanation: localized('Generated batch still; editorial acceptance is pending.', 'Imagen generada; la aceptación editorial está pendiente.')
		}
	};
	const existingIndex = assetsFile.assets.findIndex((entry) => entry.id === assetId);
	if (existingIndex >= 0) assetsFile.assets[existingIndex] = asset;
	else assetsFile.assets.push(asset);
	assetsById.set(assetId, asset);

	take.imageAssetId = assetId;
	take.imageStatus = {
		status: 'needs_review',
		reasons: ['quality'],
		sourceShotId: shotId,
		explanation: localized('Generated storyboard still; pending editorial review.', 'Imagen de storyboard generada; pendiente de revisión editorial.')
	};
	take.generation = {
		...(take.generation ?? {}),
		provider: 'OpenAI',
		model: 'gpt-image-2',
		generatedAt
	};

	if (!manifestIds.has(assetId)) {
		manifest.assets.push({
			assetId,
			entityId: shotId,
			kind: 'animaticStill',
			status: 'generated',
			outputPath,
			dimensions: { width: 1672, height: 941 },
			styleAnchorAssetIds: take.generation?.referenceAssetIds ?? [],
			references: refs,
			prompt,
			review: { notes: 'Festival-master storyboard batch 01; generated with visible-shot references and awaiting editorial review.', regenerationRequired: false }
		});
	}
}

writeFileSync(assetsPath, `${JSON.stringify(assetsFile, null, 2)}\n`, 'utf8');
writeFileSync(scriptPath, `${JSON.stringify(script, null, 2)}\n`, 'utf8');
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`registered ${shotNames.length} Festival-master storyboard stills`);
