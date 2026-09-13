/**
 * Register split stretch panels as derived assets + new candidate takes.
 * Does not change selectedTakeId. Idempotent by stretchJobId + shotId.
 * Usage:
 *   node scripts/register-visual-stretch-panels.mjs --script <slug> --stretch <id> [--dry-run]
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
	computeMargins,
	derivePanelRegions,
	readArgValue,
	scriptAnimaticFramesSegment,
	stretchJobId
} from './lib/visual-stretch.mjs';
import { computeStretchDigest } from './lib/visual-stretch-digest.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const scriptSlug = readArgValue(args, '--script');
const stretchId = readArgValue(args, '--stretch');
if (!scriptSlug || !stretchId) {
	console.error(
		'Usage: node scripts/register-visual-stretch-panels.mjs --script <slug> --stretch <id> [--dry-run]'
	);
	process.exit(1);
}

const scriptPath = join(ROOT, 'data/scripts', `${scriptSlug}.json`);
const assetsPath = join(ROOT, 'data/assets.json');
const planPath = join(ROOT, 'data/production/plans', `${scriptSlug}.json`);
const script = JSON.parse(readFileSync(scriptPath, 'utf8'));
const assetsFile = JSON.parse(readFileSync(assetsPath, 'utf8'));
const plan = existsSync(planPath) ? JSON.parse(readFileSync(planPath, 'utf8')) : null;
const stretch = (script.visualStretches || []).find((item) => item.id === stretchId);
if (!stretch) throw new Error(`Stretch not found: ${stretchId}`);
if (!stretch.combinedStillAssetId) throw new Error(`Stretch ${stretchId} has no combinedStillAssetId`);

const sheetAsset = assetsFile.assets.find((a) => a.id === stretch.combinedStillAssetId);
if (!sheetAsset?.path) throw new Error(`Missing sheet asset ${stretch.combinedStillAssetId}`);

const layout = stretch.generationProfile?.gridLayout;
if (!layout) throw new Error('gridLayout required');

const shotsById = new Map((script.shots || []).map((s) => [s.id, s]));
const takesById = new Map((script.takes || []).map((t) => [t.id, t]));
const members = [...stretch.members].sort((a, b) => a.order - b.order);
const jobId = stretchJobId(stretch);
const framesSegment = scriptAnimaticFramesSegment(scriptSlug);
const stretchSlug = stretchId.replace(/[^a-zA-Z0-9_-]+/g, '-');
const outDirRel = `/assets/animatic/frames/${framesSegment}/stretches/${stretchSlug}`;

const sheetAbs = join(ROOT, 'static', sheetAsset.path.replace(/^\//, ''));
const sheetMeta = await sharp(sheetAbs).metadata();
const outputSize = { width: sheetMeta.width, height: sheetMeta.height };
const margins = computeMargins(outputSize, layout.panelAspect ?? '16:9', layout.minOuterMarginFraction ?? 0);
const regions = derivePanelRegions(layout, margins);
if (regions.length !== members.length) {
	throw new Error(`Region count ${regions.length} != member count ${members.length}`);
}

const stretchDigest = computeStretchDigest(stretch, script);
const generatedAt = new Date().toISOString();
const results = [];

for (let i = 0; i < members.length; i += 1) {
	const member = members[i];
	const shot = shotsById.get(member.shotId);
	if (!shot) throw new Error(`Missing shot ${member.shotId}`);
	const region = regions[i].frameRegion;
	const panelName = `panel-${String(member.order).padStart(2, '0')}.png`;
	const relPath = `${outDirRel}/${panelName}`;
	const panelAbs = join(ROOT, 'static', relPath.replace(/^\//, ''));
	if (!existsSync(panelAbs)) {
		throw new Error(`Panel PNG missing (run split first): ${panelAbs}`);
	}
	const meta = await sharp(panelAbs).metadata();
	if (!meta.width || !meta.height) throw new Error(`Could not read dimensions for ${panelAbs}`);

	const assetId = `asset:${stretchSlug}-panel-${String(member.order).padStart(2, '0')}`;
	const existingTake = (script.takes || []).find(
		(t) =>
			t.shotId === member.shotId &&
			t.generation?.stretchJobId === jobId &&
			t.generation?.visualStretchId === stretchId
	);
	if (existingTake && shot.selectedTakeId === existingTake.id) {
		throw new Error(
			`Refuse to overwrite selected take ${existingTake.id} for ${member.shotId} (job ${jobId})`
		);
	}

	let takeId = existingTake?.id;
	let takeNumber = existingTake?.number;
	if (!takeId) {
		const shotTakes = (script.takes || []).filter((t) => t.shotId === member.shotId);
		takeNumber = Math.max(0, ...shotTakes.map((t) => t.number || 0)) + 1;
		takeId = `${member.shotId}:take-${String(takeNumber).padStart(2, '0')}`;
		if (takesById.has(takeId)) {
			throw new Error(`Take id collision ${takeId}`);
		}
	}

	const assetRecord = {
		id: assetId,
		kind: 'image',
		role: 'animatic',
		path: relPath,
		mimeType: 'image/png',
		width: meta.width,
		height: meta.height,
		source: {
			provider: 'local',
			model: 'sharp-split',
			generatedAt,
			originalAssetId: stretch.combinedStillAssetId
		},
		metadata: {
			visualStretchId: stretchId,
			stretchJobId: jobId,
			shotId: member.shotId,
			panelOrder: member.order,
			panelRegionX: region.x,
			panelRegionY: region.y,
			panelRegionW: region.w,
			panelRegionH: region.h,
			scriptId: script.script?.id ?? `script:${scriptSlug}`
		},
		imageStatus: {
			status: 'needs_review',
			reasons: ['quality'],
			explanation: {
				en: `Derived panel ${member.order} from visual-stretch sheet; pending editorial review.`,
				es: `Panel ${member.order} derivado de la hoja visual-stretch; pendiente de revisión editorial.`
			}
		}
	};

	const takeRecord = {
		id: takeId,
		shotId: member.shotId,
		number: takeNumber,
		status: 'candidate',
		imageAssetId: assetId,
		imageStatus: assetRecord.imageStatus,
		generation: {
			provider: 'OpenAI',
			model: 'gpt-image-2',
			generatedAt,
			visualStretchId: stretchId,
			stretchJobId: jobId,
			stretchDigest,
			referenceAssetIds: [...(stretch.referenceAssetIds || [])]
		}
	};

	results.push({
		order: member.order,
		shotId: member.shotId,
		takeId,
		assetId,
		path: relPath,
		updated: Boolean(existingTake)
	});

	if (dryRun) continue;

	const existingAsset = assetsFile.assets.find((a) => a.id === assetId);
	if (existingAsset) Object.assign(existingAsset, assetRecord);
	else assetsFile.assets.push(assetRecord);

	if (existingTake) {
		Object.assign(existingTake, takeRecord);
	} else {
		script.takes.push(takeRecord);
		takesById.set(takeId, takeRecord);
		if (!Array.isArray(shot.takeIds)) shot.takeIds = [];
		if (!shot.takeIds.includes(takeId)) shot.takeIds.push(takeId);
	}
}

if (dryRun) {
	console.log(JSON.stringify({ dryRun: true, jobId, stretchDigest, panels: results }, null, 2));
	process.exit(0);
}

if (plan?.visualStretchJobs) {
	const stillJob = plan.visualStretchJobs.find(
		(job) => job.id === jobId && job.medium === 'still' && job.mode === 'combined_storyboard_sheet'
	);
	const output = stillJob?.outputs?.find((o) => o.artifact === 'combinedStoryboard');
	if (output?.panels) {
		for (const panel of output.panels) {
			const match = results.find((r) => r.order === panel.order && r.shotId === panel.shotId);
			if (!match) continue;
			panel.derivedTakeId = match.takeId;
			panel.derivedAssetId = match.assetId;
		}
		output.assetId = stretch.combinedStillAssetId;
		writeFileSync(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
	}
}

writeFileSync(assetsPath, `${JSON.stringify(assetsFile, null, 2)}\n`, 'utf8');
writeFileSync(scriptPath, `${JSON.stringify(script, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ jobId, stretchDigest, panels: results }, null, 2));
