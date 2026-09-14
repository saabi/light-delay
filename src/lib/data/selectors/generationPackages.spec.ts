import { describe, expect, it } from 'vitest';
import { getGenerationPlan, resolveRefPresence } from '$lib/data/repositories/generationPlans';
import {
	listAudioPackages,
	listImagePackages,
	listVideoPackages,
	packageHasOutput,
	packageRefsComplete,
	summarizePackages
} from '$lib/data/selectors/generationPackages';

const FESTIVAL = 'script:light-delay-festival-master';

describe('generation plan repository', () => {
	it('loads the Festival-master plan by script id', () => {
		const plan = getGenerationPlan(FESTIVAL);
		expect(plan?.plan.scriptId).toBe(FESTIVAL);
		expect((plan?.visualStretchJobs || []).length).toBeGreaterThan(0);
	});

	it('resolves present vs missing asset ids', () => {
		const plan = getGenerationPlan(FESTIVAL);
		const still = (plan?.visualStretchJobs || []).find((j) => j.medium === 'still');
		const refId = still?.stillReferenceAssetIds?.[0];
		expect(refId).toBeTruthy();
		expect(resolveRefPresence(refId).present).toBe(true);
		expect(resolveRefPresence('asset:does-not-exist-xyz').present).toBe(false);
		expect(resolveRefPresence(null).present).toBe(false);
	});
});

describe('generation packages selectors', () => {
	it('lists Festival still stretch packages with references and sheet outputs', () => {
		const packages = listImagePackages(FESTIVAL);
		expect(packages.some((p) => p.source === 'stretch_still')).toBe(true);
		const stretch = packages.find((p) => p.id.includes('operations-gallery-001-003'));
		expect(stretch).toBeTruthy();
		expect(stretch!.refs.length).toBeGreaterThan(0);
		// Still-side editorial prompt freeze lifted for this cut (scripts/lib/visual-stretch-jobs.mjs).
		expect(stretch!.promptReady).toBe(true);
		expect(stretch!.blockers).not.toContain('editorial_prompt_freeze_not_approved');
		expect(packageHasOutput(stretch!) || stretch!.outputs.length > 0).toBe(true);
	});

	it('lists Festival video stretch packages with keyframe roles', () => {
		const packages = listVideoPackages(FESTIVAL);
		const stretch = packages.find((p) => p.source === 'stretch_video');
		expect(stretch).toBeTruthy();
		expect(stretch!.refs.some((r) => r.role.startsWith('keyframe:'))).toBe(true);
		expect(stretch!.promptReady).toBe(false);
	});

	it('lists dialogue audio packages with voice-sample refs and optional outputs', () => {
		const packages = listAudioPackages(FESTIVAL);
		expect(packages.length).toBeGreaterThan(0);
		const en = packages.find((p) => p.id.endsWith(':en'));
		expect(en).toBeTruthy();
		expect(en!.refs.some((r) => r.role === 'voice_sample')).toBe(true);
		const summary = summarizePackages(packages);
		expect(summary.total).toBe(packages.length);
		expect(summary.refsComplete).toBe(
			packages.filter((p) => packageRefsComplete(p)).length
		);
	});

	it('does not double-count stretch-covered shots as independent still packages', () => {
		const packages = listImagePackages(FESTIVAL);
		const stretch = packages.find((p) => p.id.includes('operations-gallery-001-003'));
		expect(stretch?.memberShotIds?.length).toBeGreaterThan(0);
		for (const shotId of stretch!.memberShotIds || []) {
			expect(packages.some((p) => p.id === `shot-still:${shotId}`)).toBe(false);
		}
	});
});
