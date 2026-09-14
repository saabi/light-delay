/**
 * Register the 29 Festival-master visual-stretch combined storyboard sheets and their split
 * panel takes in data/production/asset-generation-manifest.json. These images already exist
 * (generated + split, registered in data/assets.json and data/scripts/light-delay-festival-master.json)
 * but — unlike every non-stretch shot still and every reference sheet — were never given a
 * manifest entry, so they carried no structured prompt/reference record.
 *
 * Prompt text is derived, not invented: the sheet prompt reuses
 * scripts/lib/visual-stretch.mjs#compileStretchStillPrompt (the same compiler
 * npm run compile:visual-stretch dry-runs); the per-panel prompt reuses each panel's own shot
 * description, following the same structured-prompt template as
 * scripts/register-festival-master-storyboard-batch.mjs.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	compileStretchStillPrompt,
	computeMargins,
	derivePanelRegions
} from './lib/visual-stretch.mjs';
import { stripSpokenDialogueQuotes } from './lib/still-prompt-no-dialogue.mjs';

const ROOT = join(fileURLToPath(new URL('..', import.meta.url)));
const scriptPath = join(ROOT, 'data/scripts/light-delay-festival-master.json');
const assetsPath = join(ROOT, 'data/assets.json');
const manifestPath = join(ROOT, 'data/production/asset-generation-manifest.json');
const checkOnly = process.argv.includes('--check');

const script = JSON.parse(readFileSync(scriptPath, 'utf8'));
const assetsFile = JSON.parse(readFileSync(assetsPath, 'utf8'));
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const assetsById = new Map(assetsFile.assets.map((asset) => [asset.id, asset]));
const shotsById = new Map(script.shots.map((shot) => [shot.id, shot]));
const manifestIds = new Set(manifest.assets.map((asset) => asset.assetId));

const STYLE_MEDIUM =
	'Grounded cinematic hard-science-fiction storyboard concept art matching the attached Light Delay references.';
const COLOR_PALETTE = 'Cool graphite, off-white, slate-blue and restrained practical amber accents.';
const MATERIALS_TEXTURES =
	'Worn maintainable spacecraft and station surfaces, physically plausible hardware and textiles.';
const TEXT_VERBATIM = 'English-only diegetic UI where the shot requires it; no bilingual display text.';
const AVOID = 'Off-screen characters, obsolete location layouts, extra people, fantasy technology, logos, watermark.';

const toReferences = (assetIds) =>
	(assetIds ?? []).map((assetId) => ({ assetId, role: 'visual continuity reference' }));
const toInputImages = (assetIds) => (assetIds ?? []).map((assetId) => `Reference asset: ${assetId}`);

const takesByStretchId = new Map();
for (const take of script.takes) {
	const stretchId = take.generation?.visualStretchId;
	if (!stretchId) continue;
	if (!takesByStretchId.has(stretchId)) takesByStretchId.set(stretchId, []);
	takesByStretchId.get(stretchId).push(take);
}

let sheetsAdded = 0;
let panelsAdded = 0;

for (const stretch of script.visualStretches) {
	const sheetAsset = assetsById.get(stretch.combinedStillAssetId);
	if (!sheetAsset) throw new Error(`Missing registered asset for stretch sheet ${stretch.combinedStillAssetId}`);

	const members = [...stretch.members].sort((a, b) => a.order - b.order);
	const layout = stretch.generationProfile?.gridLayout;
	if (!layout) throw new Error(`Stretch ${stretch.id} has no generationProfile.gridLayout`);
	const margins = computeMargins(
		{ width: sheetAsset.width, height: sheetAsset.height },
		layout.panelAspect,
		layout.minOuterMarginFraction ?? 0
	);
	const regions = derivePanelRegions(layout, margins);
	const { sharedFragment } = compileStretchStillPrompt({ stretch, members, layout, regions, shotsById });

	if (!manifestIds.has(stretch.combinedStillAssetId)) {
		manifest.assets.push({
			assetId: stretch.combinedStillAssetId,
			entityId: stretch.id,
			kind: 'combinedStoryboard',
			status: 'generated',
			outputPath: sheetAsset.path,
			dimensions: { width: sheetAsset.width, height: sheetAsset.height },
			styleAnchorAssetIds: stretch.referenceAssetIds ?? [],
			references: toReferences(stretch.referenceAssetIds),
			prompt: {
				useCase: 'stylized-concept',
				assetType: 'Festival-master visual-stretch combined storyboard sheet',
				primaryRequest: `${layout.rows}x${layout.cols} ordered multi-panel storyboard sheet: ${stripSpokenDialogueQuotes(stretch.sharedDescription?.en ?? '')}`,
				inputImages: toInputImages(stretch.referenceAssetIds),
				sceneBackdrop: `Continuity setting ${stretch.locationId}.`,
				subject: (stretch.presentCharacterIds ?? []).join(', ') || 'The subjects specified by the stretch members.',
				styleMedium: STYLE_MEDIUM,
				compositionFraming: `${layout.rows}x${layout.cols} equal 16:9 panels, gutterFraction ${layout.gutterFraction}, blankCells ${JSON.stringify(layout.blankCells ?? [])}; each panel follows its own shot's composition and camera plan. ${sharedFragment}`,
				lightingMood: stretch.lighting?.en ?? 'Practical cinematic lighting appropriate to the stretch location and continuity.',
				colorPalette: COLOR_PALETTE,
				materialsTextures: MATERIALS_TEXTURES,
				textVerbatim: TEXT_VERBATIM,
				constraints:
					'Preserve the authored per-character blocking (zone, screen side, facing, posture, eyeline) for this stretch; blank grid cells must stay a flat neutral field with no characters, props, or text; use only the visible characters and props declared per panel; preserve current Celestial Ardor and Proxima geography; no watermark.',
				avoid: `${AVOID} Inconsistent blocking or geography across panels.`
			},
			review: {
				notes: 'Combined visual-stretch storyboard sheet; pending editorial review.',
				regenerationRequired: false
			}
		});
		sheetsAdded += 1;
	}

	const panelTakes = [...(takesByStretchId.get(stretch.id) ?? [])].sort((a, b) => {
		const orderA = assetsById.get(a.imageAssetId)?.metadata?.panelOrder ?? 0;
		const orderB = assetsById.get(b.imageAssetId)?.metadata?.panelOrder ?? 0;
		return orderA - orderB;
	});

	for (const take of panelTakes) {
		if (manifestIds.has(take.imageAssetId)) continue;
		const panelAsset = assetsById.get(take.imageAssetId);
		if (!panelAsset) throw new Error(`Missing registered asset for panel take ${take.id} (${take.imageAssetId})`);
		const shot = shotsById.get(take.shotId);
		if (!shot) throw new Error(`Missing shot ${take.shotId} for panel take ${take.id}`);
		const panelOrder = panelAsset.metadata?.panelOrder;
		const refs = take.generation?.referenceAssetIds ?? [];
		const visibleCharacters = (shot.visibleRefs ?? [])
			.filter((ref) => ref.kind === 'character' && !(shot.offScreenCharacterIds ?? []).includes(ref.id))
			.map((ref) => ref.id)
			.join(', ');

		manifest.assets.push({
			assetId: take.imageAssetId,
			entityId: shot.id,
			kind: 'animaticStill',
			status: 'generated',
			outputPath: panelAsset.path,
			dimensions: { width: panelAsset.width, height: panelAsset.height },
			styleAnchorAssetIds: refs,
			references: toReferences(refs),
			prompt: {
				useCase: 'stylized-concept',
				assetType: 'Festival-master storyboard still (visual-stretch panel)',
				primaryRequest: stripSpokenDialogueQuotes(shot.description?.en ?? `Storyboard still for ${shot.id}`),
				inputImages: toInputImages(refs),
				sceneBackdrop: `Continuity setting ${shot.locationId ?? stretch.locationId}.`,
				subject: visibleCharacters || 'The subjects specified by the shot description.',
				styleMedium: STYLE_MEDIUM,
				compositionFraming: `${shot.composition?.size ?? 'production'} composition, ${shot.composition?.aspectRatio ?? '16:9'} aspect ratio; cropped from panel ${panelOrder} of the ${stretch.id} combined storyboard sheet (${stretch.combinedStillAssetId}).`,
				lightingMood: stretch.lighting?.en ?? 'Practical cinematic lighting appropriate to the shot description and ship/station continuity.',
				colorPalette: COLOR_PALETTE,
				materialsTextures: MATERIALS_TEXTURES,
				textVerbatim: TEXT_VERBATIM,
				constraints:
					'Use only the visible characters and props declared by the shot; preserve current Celestial Ardor and Proxima geography and this stretch’s authored blocking; this panel is cropped directly from its combined sheet, not independently generated; no watermark.',
				avoid: AVOID
			},
			review: {
				notes: `Derived panel ${panelOrder} from visual-stretch sheet ${stretch.combinedStillAssetId}; pending editorial review.`,
				regenerationRequired: false
			}
		});
		panelsAdded += 1;
	}
}

const output = `${JSON.stringify(manifest, null, 2)}\n`;
if (checkOnly) {
	if (readFileSync(manifestPath, 'utf8') !== output) {
		throw new Error(`${manifestPath} is stale; run node scripts/register-festival-master-stretch-manifest.mjs`);
	}
	console.log('register-festival-master-stretch-manifest:check OK');
} else {
	writeFileSync(manifestPath, output, 'utf8');
	console.log(`registered ${sheetsAdded} stretch sheets and ${panelsAdded} stretch panels in the asset-generation manifest`);
}
