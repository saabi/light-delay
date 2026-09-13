/**
 * Resolve still/video provider snapshots from provider-capabilities.json.
 * Single entry point for compile, plan builder, and validate-data.
 */

/**
 * @typedef {{
 *   id: string,
 *   provider: string,
 *   model: string,
 *   medium?: 'image' | 'video',
 *   limitSurface?: Array<'api' | 'mcp' | 'ui' | 'account' | 'model'>,
 *   limits: {
 *     maxImages?: number | null,
 *     maxVideos?: number | null,
 *     maxAudios?: number | null,
 *     maxTotalReferences?: number | null,
 *     maxDurationMs?: number | null,
 *     maxOutputsPerRequest?: number | null,
 *     maxConcurrentRequests?: number | null
 *   },
 *   [key: string]: any
 * }} ProviderSnapshot
 *
 * @typedef {{
 *   id: string,
 *   providerSnapshotId: string,
 *   stillProviderSnapshotId?: string,
 *   maxSegmentMs: number,
 *   concurrency?: number | null,
 *   [key: string]: any
 * }} ProviderCampaign
 *
 * @typedef {{
 *   schemaVersion?: string,
 *   snapshots?: ProviderSnapshot[],
 *   campaigns?: ProviderCampaign[]
 * }} ProviderCapabilitiesFile
 */

/** @param {ProviderSnapshot | null | undefined} snapshot */
export function normalizeSnapshotDefaults(snapshot) {
	if (!snapshot) return null;
	const medium =
		snapshot.medium ??
		(snapshot.model?.includes('seedance') || snapshot.provider === 'higgsfield' ? 'video' : 'image');
	const limitSurface = Array.isArray(snapshot.limitSurface) ? snapshot.limitSurface : ['model'];
	return /** @type {ProviderSnapshot} */ ({ ...snapshot, medium, limitSurface });
}

/**
 * @param {ProviderCapabilitiesFile} file
 * @param {string} snapshotId
 * @returns {ProviderSnapshot | null}
 */
export function resolveSnapshotById(file, snapshotId) {
	if (!snapshotId) return null;
	const raw = file.snapshots?.find((item) => item.id === snapshotId) ?? null;
	return normalizeSnapshotDefaults(raw);
}

/**
 * @param {ProviderCapabilitiesFile} file
 * @param {string} campaignId
 * @returns {{ campaign: ProviderCampaign, stillProvider: ProviderSnapshot | null, videoProvider: ProviderSnapshot | null }}
 */
export function resolveCampaignProviders(file, campaignId) {
	const campaign = file.campaigns?.find((item) => item.id === campaignId);
	if (!campaign) throw new Error(`Missing campaign ${campaignId} in provider-capabilities.json`);
	const stillId = campaign.stillProviderSnapshotId;
	const videoId = campaign.providerSnapshotId;
	if (!stillId) {
		throw new Error(`Campaign ${campaignId} missing stillProviderSnapshotId`);
	}
	return {
		campaign,
		stillProvider: resolveSnapshotById(file, stillId),
		videoProvider: resolveSnapshotById(file, videoId)
	};
}

/**
 * Prefer campaign.stillProviderSnapshotId; fall back to legacy model lookup only for migration tests.
 * @param {ProviderCapabilitiesFile} file
 * @param {{ campaignId?: string, stillSnapshotId?: string }} [opts]
 */
export function resolveStillProvider(file, opts = {}) {
	if (opts.stillSnapshotId) return resolveSnapshotById(file, opts.stillSnapshotId);
	if (opts.campaignId) {
		const { stillProvider } = resolveCampaignProviders(file, opts.campaignId);
		return stillProvider;
	}
	const withStill = file.campaigns?.find((c) => c.stillProviderSnapshotId);
	if (withStill?.stillProviderSnapshotId) {
		return resolveSnapshotById(file, withStill.stillProviderSnapshotId);
	}
	return normalizeSnapshotDefaults(file.snapshots?.find((s) => s.model === 'gpt-image-2') ?? null);
}
