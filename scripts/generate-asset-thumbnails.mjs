/**
 * Generate / sync WebP thumbnails for catalogued image assets.
 *
 * Usage:
 *   node scripts/generate-asset-thumbnails.mjs generate [--dry-run]
 *   node scripts/generate-asset-thumbnails.mjs sync [--dry-run]
 *
 * Output: static/assets/_thumbs/** mirrored from /assets/... → .webp
 * Manifest: static/assets/_thumbs/manifest.json
 */
import { createHash } from 'node:crypto';
import {
	existsSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	rmSync,
	statSync,
	writeFileSync
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
	THUMB_MAX_EDGE,
	THUMB_WEBP_QUALITY,
	publicAssetToStaticRelative,
	thumbnailPathForAsset
} from './lib/thumbnail-path.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const STATIC_ASSETS = join(ROOT, 'static', 'assets');
const THUMBS_ROOT = join(STATIC_ASSETS, '_thumbs');
const MANIFEST_PATH = join(THUMBS_ROOT, 'manifest.json');
const ASSETS_JSON = join(ROOT, 'data', 'assets.json');

/**
 * @typedef {{
 *   source: string;
 *   thumb: string;
 *   mtimeMs: number;
 *   size: number;
 *   hash: string;
 * }} ManifestEntry
 */

/**
 * @typedef {{
 *   schemaVersion: string;
 *   generatedAt: string;
 *   entries: Record<string, ManifestEntry>;
 * }} Manifest
 */

function parseArgs(argv) {
	const command = argv[0] === 'sync' || argv[0] === 'generate' ? argv[0] : 'generate';
	const rest = argv[0] === 'sync' || argv[0] === 'generate' ? argv.slice(1) : argv;
	return {
		command,
		dryRun: rest.includes('--dry-run')
	};
}

function loadManifest() {
	/** @type {Manifest} */
	const empty = { schemaVersion: '1.0.0', generatedAt: '', entries: {} };
	if (!existsSync(MANIFEST_PATH)) return empty;
	try {
		const raw = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
		if (!raw || typeof raw !== 'object' || typeof raw.entries !== 'object') return empty;
		return /** @type {Manifest} */ ({
			schemaVersion: raw.schemaVersion ?? '1.0.0',
			generatedAt: raw.generatedAt ?? '',
			entries: raw.entries ?? {}
		});
	} catch {
		return empty;
	}
}

/**
 * @param {Manifest} manifest
 */
function writeManifest(manifest, dryRun) {
	manifest.generatedAt = new Date().toISOString();
	manifest.schemaVersion = '1.0.0';
	if (dryRun) return;
	mkdirSync(THUMBS_ROOT, { recursive: true });
	writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, '\t')}\n`, 'utf8');
}

/**
 * @param {string} filePath
 */
function shortHash(filePath) {
	const buf = readFileSync(filePath);
	return createHash('sha256').update(buf).digest('hex').slice(0, 16);
}

/**
 * @returns {{ id: string; path: string }[]}
 */
function listCatalogImages() {
	const file = JSON.parse(readFileSync(ASSETS_JSON, 'utf8'));
	const assets = Array.isArray(file.assets) ? file.assets : [];
	/** @type {{ id: string; path: string }[]} */
	const out = [];
	for (const asset of assets) {
		if (!asset || asset.kind !== 'image' || typeof asset.path !== 'string') continue;
		const thumb = thumbnailPathForAsset(asset.path);
		if (!thumb) continue;
		out.push({ id: asset.id, path: asset.path });
	}
	return out;
}

/**
 * @param {string} dir
 * @param {string[]} acc
 */
function walkWebp(dir, acc = []) {
	if (!existsSync(dir)) return acc;
	for (const name of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, name.name);
		if (name.isDirectory()) {
			walkWebp(full, acc);
		} else if (name.isFile() && name.name.toLowerCase().endsWith('.webp')) {
			acc.push(full);
		}
	}
	return acc;
}

/**
 * @param {string} publicPath
 */
function toDisk(publicPath) {
	const rel = publicAssetToStaticRelative(publicPath);
	if (!rel) return null;
	return join(STATIC_ASSETS, ...rel.split('/'));
}

/**
 * @param {{ dryRun: boolean; prune: boolean }} opts
 */
async function run({ dryRun, prune }) {
	const catalog = listCatalogImages();
	const manifest = loadManifest();
	/** @type {Record<string, ManifestEntry>} */
	const nextEntries = {};

	let created = 0;
	let updated = 0;
	let skipped = 0;
	let missingSource = 0;
	let deleted = 0;

	/** @type {Set<string>} */
	const expectedThumbRels = new Set();

	for (const asset of catalog) {
		const thumbPublic = thumbnailPathForAsset(asset.path);
		if (!thumbPublic) continue;

		const sourceDisk = toDisk(asset.path);
		const thumbDisk = toDisk(thumbPublic);
		if (!sourceDisk || !thumbDisk) continue;

		const thumbRel = relative(THUMBS_ROOT, thumbDisk).replaceAll('\\', '/');
		expectedThumbRels.add(thumbRel);

		if (!existsSync(sourceDisk)) {
			missingSource += 1;
			console.warn(`missing source: ${asset.path} (${asset.id})`);
			continue;
		}

		const st = statSync(sourceDisk);
		const hash = shortHash(sourceDisk);
		const prev = manifest.entries[thumbRel];
		const thumbExists = existsSync(thumbDisk);
		const upToDate =
			thumbExists &&
			prev &&
			prev.mtimeMs === st.mtimeMs &&
			prev.size === st.size &&
			prev.hash === hash &&
			prev.source === asset.path &&
			prev.thumb === thumbPublic;

		if (upToDate) {
			skipped += 1;
			nextEntries[thumbRel] = prev;
			continue;
		}

		const action = thumbExists ? 'updated' : 'created';
		if (dryRun) {
			console.log(`[dry-run] ${action}: ${thumbPublic} ← ${asset.path}`);
		} else {
			mkdirSync(dirname(thumbDisk), { recursive: true });
			await sharp(sourceDisk)
				.resize({
					width: THUMB_MAX_EDGE,
					height: THUMB_MAX_EDGE,
					fit: 'inside',
					withoutEnlargement: true
				})
				.webp({ quality: THUMB_WEBP_QUALITY })
				.toFile(thumbDisk);
		}

		if (action === 'created') created += 1;
		else updated += 1;

		nextEntries[thumbRel] = {
			source: asset.path,
			thumb: thumbPublic,
			mtimeMs: st.mtimeMs,
			size: st.size,
			hash
		};
	}

	if (prune) {
		const onDisk = walkWebp(THUMBS_ROOT);
		for (const full of onDisk) {
			const thumbRel = relative(THUMBS_ROOT, full).replaceAll('\\', '/');
			const entry = nextEntries[thumbRel] ?? manifest.entries[thumbRel];
			const sourcePublic = entry?.source;
			const sourceDisk = sourcePublic ? toDisk(sourcePublic) : null;
			const orphan =
				!expectedThumbRels.has(thumbRel) ||
				!sourceDisk ||
				!existsSync(sourceDisk);

			if (!orphan) continue;

			deleted += 1;
			if (dryRun) {
				console.log(`[dry-run] delete: ${thumbRel}`);
			} else {
				rmSync(full, { force: true });
			}
			delete nextEntries[thumbRel];
		}
	}

	manifest.entries = nextEntries;
	writeManifest(manifest, dryRun);

	console.log(
		`thumbs:${prune ? 'sync' : 'generate'} ${dryRun ? '(dry-run) ' : ''}— ` +
			`created=${created} updated=${updated} skipped=${skipped} ` +
			`deleted=${deleted} missing-source=${missingSource} catalog=${catalog.length}`
	);
}

async function main() {
	const { command, dryRun } = parseArgs(process.argv.slice(2));
	if (command !== 'generate' && command !== 'sync') {
		console.error('Usage: node scripts/generate-asset-thumbnails.mjs <generate|sync> [--dry-run]');
		process.exit(1);
	}
	await run({ dryRun, prune: command === 'sync' });
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
