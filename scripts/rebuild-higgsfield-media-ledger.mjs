/**
 * Rebuild data/production/higgsfield-media-ledger.json from run *-results.json uploadHandles.
 * Usage: node scripts/rebuild-higgsfield-media-ledger.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	buildDuplicatesReport,
	compareIsoTimestamps,
	DEFAULT_HIGGSFIELD_WORKSPACE_ID,
	duplicatesAbsPath,
	inferLedgerKind,
	saveLedger,
	sha256File,
	shouldSkipSeedFromHistoricalUploads,
	upsertEntry
} from './lib/higgsfield-media-ledger.mjs';
import {
	assertRepoRelativeFileExists,
	repoRelativeFromAssetPath,
	resolveStretchStagingSource
} from './lib/visual-stretch-handoff.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RUNS_DIR = join(ROOT, 'data/production/runs');
const ASSETS_PATH = join(ROOT, 'data/assets.json');

const assetsFile = JSON.parse(readFileSync(ASSETS_PATH, 'utf8'));
/** @type {Map<string, any>} */
const assetsById = new Map((assetsFile.assets || []).map(/** @param {any} a */ (a) => [a.id, a]));

/**
 * @param {string} assetId
 * @returns {{ abs: string, rel: string, kind: 'image' | 'video' | 'audio' } | null}
 */
function resolveCurrentStaging(assetId) {
	const asset = assetsById.get(assetId);
	if (!asset) return null;
	const role =
		asset.kind === 'audio' || String(assetId).includes('voice') ? 'voice_sample' : undefined;
	const staging = resolveStretchStagingSource(asset, { role });
	if (!staging.publicPath) return null;
	try {
		const rel = repoRelativeFromAssetPath(ROOT, staging.publicPath);
		const abs = assertRepoRelativeFileExists(ROOT, rel);
		return { abs, rel, kind: inferLedgerKind(asset, assetId) };
	} catch {
		return null;
	}
}

/** @type {Array<{ assetId: string, mediaId: string, when: string | null, sourceRunId: string | null }>} */
const rows = [];

for (const name of readdirSync(RUNS_DIR).filter((n) => n.endsWith('-results.json'))) {
	const abs = join(RUNS_DIR, name);
	const result = JSON.parse(readFileSync(abs, 'utf8'));
	const when = result.completedAt || result.submittedAt || null;
	const sourceRunId = result.sourceRunId || result.jobId || name;
	const handles = result.uploadHandles || {};
	for (const [assetId, mediaId] of Object.entries(handles)) {
		if (typeof mediaId !== 'string' || !mediaId) continue;
		rows.push({ assetId, mediaId, when, sourceRunId });
	}
}

/** @type {Map<string, typeof rows>} */
const byAsset = new Map();
for (const row of rows) {
	if (!byAsset.has(row.assetId)) byAsset.set(row.assetId, []);
	byAsset.get(row.assetId).push(row);
}

const ledger = {
	schemaVersion: '1.0.0',
	workspaceId: DEFAULT_HIGGSFIELD_WORKSPACE_ID,
	updatedAt: new Date().toISOString(),
	notes:
		'Seeded from data/production/runs/*-results.json uploadHandles. Key is assetId + sha256 of current staging bytes (resolveStretchStagingSource). Voice assets with seedanceUploadPath are not seeded from historical handles (often full WAV).',
	entries: []
};

/** @type {Array<{ assetId: string, mediaId: string, sha256: string }>} */
const keepers = [];
/** @type {string[]} */
const skippedVoice = [];
/** @type {string[]} */
const missingFiles = [];

for (const [assetId, assetRows] of [...byAsset.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
	const sorted = [...assetRows].sort((a, b) => compareIsoTimestamps(a.when, b.when));
	const latest = sorted[sorted.length - 1];
	const asset = assetsById.get(assetId);

	if (shouldSkipSeedFromHistoricalUploads(asset)) {
		skippedVoice.push(assetId);
		continue;
	}

	const staging = resolveCurrentStaging(assetId);
	if (!staging) {
		missingFiles.push(assetId);
		continue;
	}

	const sha = sha256File(staging.abs);
	upsertEntry(ledger, {
		assetId,
		sha256: sha,
		mediaId: latest.mediaId,
		kind: staging.kind,
		workspaceId: DEFAULT_HIGGSFIELD_WORKSPACE_ID,
		sourceRunId: latest.sourceRunId,
		uploadedAt: latest.when,
		localPath: staging.rel,
		seedConfidence: 'assumed_current_bytes'
	});
	keepers.push({ assetId, mediaId: latest.mediaId, sha256: sha });
}

saveLedger(ROOT, ledger);

const report = buildDuplicatesReport(rows, keepers);
// Voice historical uploads: all mediaIds are delete candidates (not keepers).
for (const assetId of skippedVoice) {
	const ids = new Set((byAsset.get(assetId) || []).map((r) => r.mediaId));
	for (const mediaId of ids) {
		if (report.deleteCandidates.some((d) => d.mediaId === mediaId)) continue;
		report.deleteCandidates.push({
			assetId,
			mediaId,
			reason: 'voice_seedance_clip_reupload_required_historical_wav_or_unverified'
		});
	}
}
writeFileSync(duplicatesAbsPath(ROOT), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(
	JSON.stringify(
		{
			ok: true,
			ledgerPath: 'data/production/higgsfield-media-ledger.json',
			duplicatesPath: 'data/production/higgsfield-media-duplicates.json',
			entries: ledger.entries.length,
			keepers: keepers.length,
			deleteCandidates: report.deleteCandidates.length,
			skippedVoiceSeed: skippedVoice,
			missingStagingFiles: missingFiles,
			scannedUploadRows: rows.length
		},
		null,
		2
	)
);
