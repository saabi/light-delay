import { repositoryRoot } from '$legacy-project';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
	normalizeSnapshotDefaults,
	resolveCampaignProviders,
	resolveSnapshotById,
	resolveStillProvider
} from '$project-tools/lib/provider-capabilities.mjs';
import { checkReferenceBudget } from '$project-tools/lib/generation-planning.mjs';

const ROOT = repositoryRoot;
const live = JSON.parse(
	readFileSync(join(ROOT, 'data/production/provider-capabilities.json'), 'utf8')
);

describe('provider-capabilities resolver', () => {
	it('resolves campaign still and video snapshots from pinned ids', () => {
		const { stillProvider, videoProvider, campaign } = resolveCampaignProviders(
			live,
			'campaign:higgsfield-trial-24h'
		);
		expect(campaign.stillProviderSnapshotId).toBe('provider:openai:gpt-image-2:2026-09-13');
		expect(stillProvider?.id).toBe(campaign.stillProviderSnapshotId);
		expect(stillProvider?.medium).toBe('image');
		expect(videoProvider?.id).toBe(campaign.providerSnapshotId);
		expect(videoProvider?.medium).toBe('video');
		expect(stillProvider?.limits?.maxOutputsPerRequest).toBe(1);
	});

	it('defaults medium and limitSurface on legacy snapshots', () => {
		const legacy = normalizeSnapshotDefaults({
			id: 'provider:test:legacy',
			provider: 'openai',
			model: 'gpt-image-2',
			limits: { maxImages: 5, maxVideos: 0, maxAudios: 0, maxTotalReferences: 5 }
		});
		expect(legacy?.medium).toBe('image');
		expect(legacy?.limitSurface).toEqual(['model']);
	});

	it('keeps maxImages as input reference count for budget checks', () => {
		const limits = { maxImages: 5, maxVideos: 0, maxAudios: 0, maxTotalReferences: 5 };
		const five = Array.from({ length: 5 }, (_, i) => ({ kind: 'image' as const, id: `a${i}` }));
		expect(checkReferenceBudget(five, limits).ok).toBe(true);
		expect(
			checkReferenceBudget([...five, { kind: 'image' as const, id: 'a5' }], limits).ok
		).toBe(false);
	});

	it('resolveStillProvider matches campaign still snapshot', () => {
		const a = resolveStillProvider(live, { campaignId: 'campaign:higgsfield-trial-24h' });
		const b = resolveSnapshotById(live, 'provider:openai:gpt-image-2:2026-09-13');
		expect(a?.id).toBe(b?.id);
	});

	it('pins providerSnapshotId on still and video festival-master stretch jobs', () => {
		const plan = JSON.parse(
			readFileSync(join(ROOT, 'data/production/plans/light-delay-festival-master.json'), 'utf8')
		);
		const stretchJobs = (plan.visualStretchJobs || []).filter((j: { stretchId?: string }) =>
			String(j.stretchId || '').includes('bridge-meal')
		);
		expect(stretchJobs.length).toBeGreaterThanOrEqual(2);
		for (const job of stretchJobs) {
			expect(job.providerSnapshotId).toMatch(/^provider:/);
		}
		expect(stretchJobs.some((j: { medium: string }) => j.medium === 'still')).toBe(true);
		expect(stretchJobs.some((j: { medium: string }) => j.medium === 'video')).toBe(true);
	});
});
