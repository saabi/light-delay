/**
 * Register a combined stretch sheet asset (after agent image tool lands the file).
 * Copies from --from via same-directory .partial + atomic rename (EXDEV-safe).
 * Usage:
 *   node scripts/register-visual-stretch-sheet.mjs --script <slug> --stretch <id> --from <path>
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { atomicCopyFile } from './lib/atomic-fs.mjs';
import { readArgValue, scriptAnimaticFramesSegment, stretchJobId } from './lib/visual-stretch.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const scriptSlug = readArgValue(args, '--script');
const stretchId = readArgValue(args, '--stretch');
const fromPath = readArgValue(args, '--from');
if (!scriptSlug || !stretchId || !fromPath) {
	console.error(
		'Usage: node scripts/register-visual-stretch-sheet.mjs --script <slug> --stretch <id> --from <path>'
	);
	process.exit(1);
}
if (!existsSync(fromPath)) {
	console.error(`Generator output missing: ${fromPath}`);
	process.exit(1);
}

const scriptPath = join(ROOT, 'data/scripts', `${scriptSlug}.json`);
const assetsPath = join(ROOT, 'data/assets.json');
const script = JSON.parse(readFileSync(scriptPath, 'utf8'));
const assetsFile = JSON.parse(readFileSync(assetsPath, 'utf8'));
const stretch = (script.visualStretches || []).find((item) => item.id === stretchId);
if (!stretch) throw new Error(`Stretch not found: ${stretchId}`);

const framesSegment = scriptAnimaticFramesSegment(scriptSlug);
const stretchSlug = stretchId.replace(/[^a-zA-Z0-9_-]+/g, '-');
const relPath = `/assets/animatic/frames/${framesSegment}/stretches/${stretchSlug}/sheet.png`;
const absDir = join(ROOT, 'static', 'assets/animatic/frames', framesSegment, 'stretches', stretchSlug);
const absPath = join(absDir, 'sheet.png');
mkdirSync(absDir, { recursive: true });

await atomicCopyFile(fromPath, absPath);
const meta = await sharp(absPath).metadata();
if (!meta.width || !meta.height) {
	throw new Error('sharp could not read dimensions from registered sheet');
}

const assetId = `asset:${stretchSlug}-sheet`;
const existing = assetsFile.assets.find((a) => a.id === assetId);
const record = {
	id: assetId,
	kind: 'image',
	role: 'animatic',
	path: relPath,
	mimeType: 'image/png',
	width: meta.width,
	height: meta.height,
	source: {
		provider: 'OpenAI',
		model: 'gpt-image-2',
		generatedAt: new Date().toISOString()
	},
	metadata: {
		visualStretchId: stretchId,
		stretchJobId: stretchJobId(stretch),
		scriptId: script.script?.id ?? `script:${scriptSlug}`
	},
	imageStatus: {
		status: 'needs_review',
		reasons: ['quality'],
		explanation: {
			en: 'Combined visual-stretch storyboard sheet pending editorial review and split.',
			es: 'Hoja storyboard combinada de visual stretch pendiente de revisión editorial y partición.'
		}
	}
};
if (existing) {
	Object.assign(existing, record);
} else {
	assetsFile.assets.push(record);
}
stretch.combinedStillAssetId = assetId;
writeFileSync(assetsPath, `${JSON.stringify(assetsFile, null, 2)}\n`, 'utf8');
writeFileSync(scriptPath, `${JSON.stringify(script, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ assetId, path: relPath, width: meta.width, height: meta.height }, null, 2));
