/**
 * Durable map of local assetId + staging-file sha256 → Higgsfield media_id.
 * SoT: data/production/higgsfield-media-ledger.json
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const HIGGSFIELD_MEDIA_LEDGER_REL = 'data/production/higgsfield-media-ledger.json';
export const HIGGSFIELD_MEDIA_DUPLICATES_REL = 'data/production/higgsfield-media-duplicates.json';
/** Private Ultra workspace used for Festival Seedance MCP jobs. */
export const DEFAULT_HIGGSFIELD_WORKSPACE_ID = 'e4d99f54-5f04-4f20-8544-330c41232965';

/**
 * @param {string} root
 */
export function ledgerAbsPath(root) {
	return join(root, ...HIGGSFIELD_MEDIA_LEDGER_REL.split('/'));
}

/**
 * @param {string} root
 */
export function duplicatesAbsPath(root) {
	return join(root, ...HIGGSFIELD_MEDIA_DUPLICATES_REL.split('/'));
}

/**
 * @param {string} root
 * @returns {{
 *   schemaVersion: string,
 *   workspaceId: string,
 *   updatedAt: string,
 *   notes?: string,
 *   entries: Array<Record<string, unknown>>
 * }}
 */
export function loadLedger(root) {
	const abs = ledgerAbsPath(root);
	if (!existsSync(abs)) {
		return {
			schemaVersion: '1.0.0',
			workspaceId: DEFAULT_HIGGSFIELD_WORKSPACE_ID,
			updatedAt: new Date().toISOString(),
			entries: []
		};
	}
	return JSON.parse(readFileSync(abs, 'utf8'));
}

/**
 * @param {string} root
 * @param {{
 *   schemaVersion: string,
 *   workspaceId: string,
 *   updatedAt: string,
 *   notes?: string,
 *   entries: Array<Record<string, unknown>>
 * }} ledger
 */
export function saveLedger(root, ledger) {
	const next = {
		...ledger,
		updatedAt: new Date().toISOString()
	};
	writeFileSync(ledgerAbsPath(root), `${JSON.stringify(next, null, 2)}\n`, 'utf8');
	return next;
}

/**
 * @param {string} absPath
 */
export function sha256File(absPath) {
	const buf = readFileSync(absPath);
	return createHash('sha256').update(buf).digest('hex');
}

/**
 * @param {{ entries?: Array<{ assetId?: string, sha256?: string, mediaId?: string }> }} ledger
 * @param {string} assetId
 * @param {string} sha256
 * @returns {string | null}
 */
export function lookup(ledger, assetId, sha256) {
	if (!assetId || !sha256) return null;
	const hit = (ledger.entries || []).find(
		(e) => e.assetId === assetId && e.sha256 === sha256 && typeof e.mediaId === 'string'
	);
	return hit?.mediaId ?? null;
}

/**
 * @param {string} assetId
 * @param {string} sha256
 */
export function entryKey(assetId, sha256) {
	return `${assetId}\0${sha256}`;
}

/**
 * Replace same (assetId, sha256) key; push prior mediaId into supersededMediaIds when different.
 * @param {{ entries?: Array<Record<string, unknown>> }} ledger
 * @param {{
 *   assetId: string,
 *   sha256: string,
 *   mediaId: string,
 *   kind: 'image' | 'video' | 'audio',
 *   workspaceId?: string,
 *   sourceRunId?: string | null,
 *   uploadedAt?: string | null,
 *   localPath?: string | null,
 *   seedConfidence?: string
 * }} entry
 */
export function upsertEntry(ledger, entry) {
	if (!entry?.assetId || !entry?.sha256 || !entry?.mediaId || !entry?.kind) {
		throw new Error('upsertEntry requires assetId, sha256, mediaId, kind');
	}
	const entries = Array.isArray(ledger.entries) ? [...ledger.entries] : [];
	const idx = entries.findIndex(
		(e) => e.assetId === entry.assetId && e.sha256 === entry.sha256
	);
	/** @type {string[]} */
	let superseded = [];
	if (idx >= 0) {
		const prev = entries[idx];
		const priorSuperseded = Array.isArray(prev.supersededMediaIds)
			? prev.supersededMediaIds.filter(/** @param {unknown} id */ (id) => typeof id === 'string')
			: [];
		superseded = [...priorSuperseded];
		if (typeof prev.mediaId === 'string' && prev.mediaId !== entry.mediaId) {
			if (!superseded.includes(prev.mediaId)) superseded.push(prev.mediaId);
		}
		entries[idx] = {
			assetId: entry.assetId,
			sha256: entry.sha256,
			mediaId: entry.mediaId,
			kind: entry.kind,
			workspaceId: entry.workspaceId ?? prev.workspaceId ?? ledger.workspaceId,
			sourceRunId: entry.sourceRunId ?? prev.sourceRunId ?? null,
			uploadedAt: entry.uploadedAt ?? prev.uploadedAt ?? null,
			localPath: entry.localPath ?? prev.localPath ?? null,
			...(superseded.length ? { supersededMediaIds: superseded } : {}),
			...(entry.seedConfidence || prev.seedConfidence
				? { seedConfidence: entry.seedConfidence ?? prev.seedConfidence }
				: {})
		};
	} else {
		entries.push({
			assetId: entry.assetId,
			sha256: entry.sha256,
			mediaId: entry.mediaId,
			kind: entry.kind,
			workspaceId: entry.workspaceId ?? ledger.workspaceId,
			sourceRunId: entry.sourceRunId ?? null,
			uploadedAt: entry.uploadedAt ?? null,
			localPath: entry.localPath ?? null,
			...(entry.seedConfidence ? { seedConfidence: entry.seedConfidence } : {})
		});
	}
	ledger.entries = entries;
	return ledger;
}

/**
 * @param {string | null | undefined} a
 * @param {string | null | undefined} b
 * @returns {number} positive if a is later
 */
export function compareIsoTimestamps(a, b) {
	const ta = a ? Date.parse(a) : NaN;
	const tb = b ? Date.parse(b) : NaN;
	const na = Number.isFinite(ta) ? ta : 0;
	const nb = Number.isFinite(tb) ? tb : 0;
	return na - nb;
}

/**
 * Infer asset kind for ledger from assets.json record or assetId prefix.
 * @param {{ kind?: string, mimeType?: string } | null | undefined} asset
 * @param {string} assetId
 * @returns {'image' | 'video' | 'audio'}
 */
export function inferLedgerKind(asset, assetId) {
	if (asset?.kind === 'audio' || asset?.kind === 'video' || asset?.kind === 'image') {
		return asset.kind;
	}
	if (typeof asset?.mimeType === 'string') {
		if (asset.mimeType.startsWith('audio/')) return 'audio';
		if (asset.mimeType.startsWith('video/')) return 'video';
	}
	if (String(assetId).includes('voice')) return 'audio';
	if (String(assetId).includes('video')) return 'video';
	return 'image';
}

/**
 * Voice Seedance clips must not be seeded from historical uploadHandles (often full WAV).
 * @param {{ metadata?: Record<string, unknown> } | null | undefined} asset
 */
export function shouldSkipSeedFromHistoricalUploads(asset) {
	return typeof asset?.metadata?.seedanceUploadPath === 'string';
}

/**
 * Build keepers + deleteCandidates from scan rows and ledger keepers.
 * @param {Array<{ assetId: string, mediaId: string, when: string | null, sourceRunId: string | null }>} rows
 * @param {Array<{ assetId: string, mediaId: string, sha256: string }>} keepers
 */
export function buildDuplicatesReport(rows, keepers) {
	const keeperSet = new Set(keepers.map((k) => `${k.assetId}\0${k.mediaId}`));
	const keeperMediaOnly = new Set(keepers.map((k) => k.mediaId));
	/** @type {Map<string, Set<string>>} */
	const byAsset = new Map();
	for (const row of rows) {
		if (!byAsset.has(row.assetId)) byAsset.set(row.assetId, new Set());
		byAsset.get(row.assetId).add(row.mediaId);
	}
	/** @type {Array<{ assetId: string, mediaId: string, reason: string }>} */
	const deleteCandidates = [];
	const seenDelete = new Set();
	for (const [assetId, ids] of byAsset) {
		for (const mediaId of ids) {
			const key = `${assetId}\0${mediaId}`;
			if (keeperSet.has(key)) continue;
			if (seenDelete.has(mediaId)) continue;
			// Same mediaId may appear under one asset only; still list once.
			seenDelete.add(mediaId);
			const reason = keeperMediaOnly.size
				? 'superseded_or_non_keeper_upload_for_asset'
				: 'duplicate_upload_for_asset';
			deleteCandidates.push({ assetId, mediaId, reason });
		}
	}
	return {
		schemaVersion: '1.0.0',
		updatedAt: new Date().toISOString(),
		notes:
			'Delete only deleteCandidates in the Higgsfield Assets UI (input uploads). Never delete keepers. Never delete generation output videos you still want remote. MCP has no delete-media tool. Workspace: Private Ultra e4d99f54-5f04-4f20-8544-330c41232965.',
		keepers,
		deleteCandidates
	};
}
