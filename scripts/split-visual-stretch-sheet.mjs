/**
 * Split a registered visual-stretch combined sheet into derived panel PNGs.
 * Usage: node scripts/split-visual-stretch-sheet.mjs --script <slug> --stretch <stretchId> [--dry-run]
 *
 * After a successful split, register candidates with:
 *   node scripts/register-visual-stretch-panels.mjs --script <slug> --stretch <stretchId>
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { atomicReplaceFromWriter } from './lib/atomic-fs.mjs';
import {
	computeMargins,
	derivePanelRegions,
	readArgValue,
	scriptAnimaticFramesSegment,
	stretchJobId
} from './lib/visual-stretch.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const scriptSlug = readArgValue(args, '--script');
const stretchId = readArgValue(args, '--stretch');
if (!scriptSlug || !stretchId) {
	console.error(
		'Usage: node scripts/split-visual-stretch-sheet.mjs --script <slug> --stretch <stretchId> [--dry-run]'
	);
	process.exit(1);
}

const scriptPath = join(ROOT, 'data/scripts', `${scriptSlug}.json`);
const assetsPath = join(ROOT, 'data/assets.json');
const script = JSON.parse(readFileSync(scriptPath, 'utf8'));
const assetsFile = JSON.parse(readFileSync(assetsPath, 'utf8'));
const stretch = (script.visualStretches || []).find((item) => item.id === stretchId);
if (!stretch) throw new Error(`Stretch not found: ${stretchId}`);
if (!stretch.combinedStillAssetId) throw new Error(`Stretch ${stretchId} has no combinedStillAssetId`);

const sheetAsset = assetsFile.assets.find((a) => a.id === stretch.combinedStillAssetId);
if (!sheetAsset?.path) throw new Error(`Missing sheet asset path for ${stretch.combinedStillAssetId}`);
const sheetAbs = join(ROOT, 'static', sheetAsset.path.replace(/^\//, ''));
if (!existsSync(sheetAbs)) throw new Error(`Sheet file missing: ${sheetAbs}`);

const layout = stretch.generationProfile?.gridLayout;
if (!layout) throw new Error('gridLayout required');
const meta = await sharp(sheetAbs).metadata();
const outputSize = { width: meta.width, height: meta.height };
const margins = computeMargins(outputSize, layout.panelAspect ?? '16:9', layout.minOuterMarginFraction ?? 0);
const regions = derivePanelRegions(layout, margins);
const members = [...stretch.members].sort((a, b) => a.order - b.order);
if (regions.length !== members.length) {
	throw new Error(`Region count ${regions.length} != member count ${members.length}`);
}

const jobId = stretchJobId(stretch);
const framesSegment = scriptAnimaticFramesSegment(scriptSlug);
const stretchSlug = stretchId.replace(/[^a-zA-Z0-9_-]+/g, '-');
const outDirRel = `/assets/animatic/frames/${framesSegment}/stretches/${stretchSlug}`;
const outDirAbs = join(ROOT, 'static', outDirRel.replace(/^\//, ''));
if (!dryRun) mkdirSync(outDirAbs, { recursive: true });

console.log(
	JSON.stringify(
		{
			stretchId,
			jobId,
			sheet: sheetAsset.path,
			outputSize,
			margins,
			panels: members.map((member, i) => ({
				order: member.order,
				shotId: member.shotId,
				frameRegion: regions[i].frameRegion,
				path: `${outDirRel}/panel-${String(member.order).padStart(2, '0')}.png`
			})),
			dryRun
		},
		null,
		2
	)
);

if (dryRun) process.exit(0);

for (let i = 0; i < members.length; i += 1) {
	const member = members[i];
	const region = regions[i].frameRegion;
	const left = Math.round(region.x * outputSize.width);
	const top = Math.round(region.y * outputSize.height);
	const width = Math.round(region.w * outputSize.width);
	const height = Math.round(region.h * outputSize.height);
	const panelName = `panel-${String(member.order).padStart(2, '0')}.png`;
	const panelAbs = join(outDirAbs, panelName);
	await atomicReplaceFromWriter(panelAbs, async (partialAbs) => {
		await sharp(sheetAbs).extract({ left, top, width, height }).png().toFile(partialAbs);
	});
	console.log(`wrote ${panelAbs}`);
}

console.log(
	'split-visual-stretch-sheet: OK — next: npm run register:visual-stretch-panels -- --script ' +
		scriptSlug +
		' --stretch ' +
		stretchId
);
