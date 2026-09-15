/**
 * Build durable ~5 s MP3 Seedance voice clips from approved EN WAVs.
 * Never overwrites or deletes the source WAVs under static/assets/voices/en/.
 *
 * Usage: node scripts/prepare-seedance-voice-clips.mjs
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VOICES_EN = join(ROOT, 'static/assets/voices/en');
const OUT_DIR = join(VOICES_EN, 'seedance-5s');
const SECONDS = 5;

/** @type {Array<{ assetId: string, sourceFile: string, outFile: string }>} */
const CLIPS = [
	{ assetId: 'asset:voice-ref-en-zao', sourceFile: 'Zao.wav', outFile: 'Zao.mp3' },
	{ assetId: 'asset:voice-ref-en-voss', sourceFile: 'Voss.wav', outFile: 'Voss.mp3' },
	{ assetId: 'asset:voice-ref-en-harlan', sourceFile: 'Harlan.wav', outFile: 'Harlan.mp3' },
	{ assetId: 'asset:voice-ref-en-elin', sourceFile: 'Elin.wav', outFile: 'Elin.mp3' },
	{ assetId: 'asset:voice-ref-en-sorell', sourceFile: 'Sorell.wav', outFile: 'Sorell.mp3' },
	{ assetId: 'asset:voice-ref-en-okoye', sourceFile: 'Okoye.wav', outFile: 'Okoye.mp3' },
	{ assetId: 'asset:voice-ref-en-reporter', sourceFile: 'Reporter.wav', outFile: 'Reporter.mp3' }
];

function probeDurationMs(absPath) {
	const out = execFileSync(
		'ffprobe',
		['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', absPath],
		{ encoding: 'utf8' }
	).trim();
	const sec = Number(out);
	if (!Number.isFinite(sec)) throw new Error(`ffprobe failed for ${absPath}: ${out}`);
	return Math.round(sec * 1000);
}

function main() {
	mkdirSync(OUT_DIR, { recursive: true });
	const assetsPath = join(ROOT, 'data/assets.json');
	const assetsFile = JSON.parse(readFileSync(assetsPath, 'utf8'));
	const list = assetsFile.assets || assetsFile;
	/** @type {Record<string, number>} */
	const durations = {};

	for (const clip of CLIPS) {
		const src = join(VOICES_EN, clip.sourceFile);
		const dest = join(OUT_DIR, clip.outFile);
		if (!existsSync(src)) throw new Error(`Missing source WAV: ${src}`);
		execFileSync(
			'ffmpeg',
			['-y', '-i', src, '-t', String(SECONDS), '-codec:a', 'libmp3lame', '-q:a', '2', dest],
			{ stdio: ['ignore', 'ignore', 'pipe'] }
		);
		const durationMs = probeDurationMs(dest);
		durations[clip.assetId] = durationMs;
		const uploadPath = `/assets/voices/en/seedance-5s/${clip.outFile}`;
		const asset = list.find(/** @param {any} a */ (a) => a.id === clip.assetId);
		if (!asset) throw new Error(`Missing asset ${clip.assetId}`);
		asset.metadata = {
			...(asset.metadata || {}),
			seedanceUploadPath: uploadPath,
			seedanceUploadMimeType: 'audio/mpeg',
			seedanceUploadDurationMs: durationMs,
			seedanceUploadNote:
				'Truncated MP3 for Seedance MCP voice refs (combined ≤30s). Canonical bank remains path (.wav).'
		};
		console.log(`${clip.assetId} → ${uploadPath} (${durationMs} ms)`);
	}

	writeFileSync(assetsPath, JSON.stringify(assetsFile, null, 2) + '\n');
	console.log(`updated ${assetsPath}`);
	console.log('source WAVs left unchanged under static/assets/voices/en/*.wav');
}

main();
