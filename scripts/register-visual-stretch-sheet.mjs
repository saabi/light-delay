/**
 * Register a combined stretch sheet asset (after agent image tool lands the file).
 * Copies from --from (generator output) via OS temp + atomic rename into the final path.
 * Usage:
 *   node scripts/register-visual-stretch-sheet.mjs --script <slug> --stretch <id> --from <path>
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const scriptSlug = args[args.indexOf('--script') + 1];
const stretchId = args[args.indexOf('--stretch') + 1];
const fromPath = args[args.indexOf('--from') + 1];
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

const stretchSlug = stretchId.replace(/[^a-zA-Z0-9_-]+/g, '-');
const relPath = `/assets/animatic/frames/festival-master/stretches/${stretchSlug}/sheet.png`;
const absDir = join(ROOT, 'static', 'assets/animatic/frames/festival-master/stretches', stretchSlug);
const absPath = join(absDir, 'sheet.png');
mkdirSync(absDir, { recursive: true });

const tempAbs = join(tmpdir(), `vs-sheet-${randomBytes(8).toString('hex')}.png`);
copyFileSync(fromPath, tempAbs);
const meta = await sharp(tempAbs).metadata();
if (!meta.width || !meta.height) {
	unlinkSync(tempAbs);
	throw new Error('sharp could not read dimensions from generator output');
}
renameSync(tempAbs, absPath);

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
		stretchJobId: `${stretchId}:rev-${stretch.revision}`
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
writeFileSync(assetsPath, `${JSON.stringify(assetsFile, null, '\t')}\n`, 'utf8');
writeFileSync(scriptPath, `${JSON.stringify(script, null, '\t')}\n`, 'utf8');
console.log(JSON.stringify({ assetId, path: relPath, width: meta.width, height: meta.height }, null, 2));
