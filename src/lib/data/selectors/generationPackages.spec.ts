import { describe, expect, it } from 'vitest';
import type { Asset } from '$lib/types/assets';
import {
	getGenerationPlan,
	resolveAssetPresence,
	resolveRefPresence
} from '$lib/data/repositories/generationPlans';
import { getScript } from '$lib/data/repositories/index';
import {
	derivePackageRunnable,
	filterPackages,
	independentStillPrompt,
	listAudioPackages,
	listImagePackages,
	listVideoPackages,
	packageHasOutput,
	packageOutputStatus,
	packageRefReadiness,
	packageRefsComplete,
	packageRefsReady,
	promptReadyFromCompiled,
	refCategoryFromRole,
	summarizePackages,
	type GenerationPackage,
	type GenerationPackageRef
} from '$lib/data/selectors/generationPackages';
import { getShotSelectedTake } from '$lib/data/selectors/index';

const FESTIVAL = 'script:light-delay-festival-master';

function fakeAsset(overrides: Partial<Asset> & Pick<Asset, 'id' | 'path'>): Asset {
	return {
		kind: 'image',
		role: 'production',
		...overrides
	};
}

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
		const resolved = resolveRefPresence(refId);
		expect(resolved.present).toBe(true);
		expect(resolved.status).toBe('current');
		expect(resolveRefPresence('asset:does-not-exist-xyz').present).toBe(false);
		expect(resolveRefPresence('asset:does-not-exist-xyz').status).toBe('missing_catalog_entry');
		expect(resolveRefPresence(null).present).toBe(false);
		expect(resolveRefPresence(null).status).toBe('missing_catalog_entry');
	});

	it('marks a catalog path whose file is missing', () => {
		const resolved = resolveAssetPresence(
			'asset:generation-test-missing-file',
			fakeAsset({
				id: 'asset:generation-test-missing-file',
				path: '/assets/does-not-exist-for-generation-test.png'
			})
		);
		expect(resolved.present).toBe(false);
		expect(resolved.status).toBe('missing_file');
	});

	it('marks an unsafe catalog path invalid', () => {
		const resolved = resolveAssetPresence(
			'asset:generation-test-invalid-path',
			fakeAsset({
				id: 'asset:generation-test-invalid-path',
				path: '../secrets/still.png'
			})
		);
		expect(resolved.present).toBe(false);
		expect(resolved.status).toBe('invalid_path');
	});

	it('marks a kind mismatch even when the file exists', () => {
		const plan = getGenerationPlan(FESTIVAL);
		const still = (plan?.visualStretchJobs || []).find((j) => j.medium === 'still');
		const refId = still?.stillReferenceAssetIds?.[0];
		expect(refId).toBeTruthy();
		const resolved = resolveRefPresence(refId, { expectedKind: 'audio' });
		expect(resolved.present).toBe(false);
		expect(resolved.status).toBe('invalid_kind');
	});

	it('surfaces editorial stale status from imageStatus', () => {
		const resolved = resolveAssetPresence(
			'asset:generation-test-stale',
			fakeAsset({
				id: 'asset:generation-test-stale',
				path: '/assets/does-not-exist-for-generation-test.png',
				imageStatus: {
					status: 'needs_regeneration',
					reasons: ['canon_mismatch'],
					explanation: { en: 'stale', es: 'stale' }
				}
			})
		);
		expect(resolved.status).toBe('missing_file');
		const presentImage = getGenerationPlan(FESTIVAL)?.visualStretchJobs?.find(
			(job) => job.medium === 'still'
		)?.stillReferenceAssetIds?.[0];
		expect(presentImage).toBeTruthy();
		const stale = resolveRefPresence(presentImage, {
			imageStatusOverride: {
				status: 'needs_regeneration',
				reasons: ['canon_mismatch'],
				explanation: { en: 'stale', es: 'stale' }
			}
		});
		expect(stale.present).toBe(true);
		expect(stale.status).toBe('needs_regeneration');
	});
});

describe('generation packages selectors', () => {
	it('lists Festival still stretch packages with references and sheet outputs', () => {
		const packages = listImagePackages(FESTIVAL);
		expect(packages.some((p) => p.source === 'stretch_still')).toBe(true);
		const stretch = packages.find((p) => p.id.includes('operations-gallery-001-003'));
		expect(stretch).toBeTruthy();
		expect(stretch!.refs.length).toBeGreaterThan(0);
		expect(stretch!.refs.every((ref) => ref.category === 'visual')).toBe(true);
		expect(stretch!.promptReady).toBe(true);
		expect(stretch!.blockers).not.toContain('editorial_prompt_freeze_not_approved');
		expect(packageHasOutput(stretch!) || stretch!.outputs.length > 0).toBe(true);
		expect(stretch!.groupId).toBe(stretch!.title);
	});

	it('uses the selected take prompt for independent stills', () => {
		const packages = listImagePackages(FESTIVAL);
		const independent = packages.find((p) => p.source === 'shot_still');
		expect(independent).toBeTruthy();
		const script = getScript(FESTIVAL);
		const shotId = independent!.memberShotIds?.[0];
		expect(shotId).toBeTruthy();
		const shot = script.shots.find((item) => item.id === shotId);
		expect(shot).toBeTruthy();
		const take = getShotSelectedTake(script, shot!);
		expect(independent!.promptPreview).toBe(independentStillPrompt(take));
		expect(independent!.promptPreview).toBeTruthy();
		expect(independent!.promptReady).toBe(true);
		expect(independent!.groupId).toBeTruthy();
		expect(independent!.runnable).toBe(
			independent!.promptReady &&
				packageRefsReady(independent!) &&
				independent!.blockers.length === 0
		);
	});

	it('marks a fully eligible independent still as runnable with a generated output', () => {
		// festival-master:shot-plan-016b: zero blockers, compiled prompt, complete refs, and an
		// already-generated (needs_review) still — regression coverage for the plan compiler
		// previously stubbing shot.status/artifacts.animaticStill to 'blocked'/'missing' forever.
		const packages = listImagePackages(FESTIVAL);
		const pkg = packages.find((p) => p.id === 'shot-still:festival-master:shot-plan-016b');
		expect(pkg).toBeTruthy();
		expect(pkg!.blockers).toEqual([]);
		expect(pkg!.promptReady).toBe(true);
		expect(pkg!.runnable).toBe(true);
		const still = pkg!.outputs.find((o) => o.label === 'animaticStill');
		expect(still?.assetId).toBe('asset:festival-master-storyboard-016b');
		expect(still?.present).toBe(true);
		expect(still?.status).toBe('needs_review');
	});

	it('treats a missing independent still prompt as not ready', () => {
		expect(promptReadyFromCompiled(null, [])).toBe(false);
		expect(promptReadyFromCompiled('   ', [])).toBe(false);
		expect(promptReadyFromCompiled('a prompt', ['editorial_prompt_freeze_not_approved'])).toBe(
			false
		);
		expect(independentStillPrompt(undefined)).toBeNull();
		expect(
			independentStillPrompt({
				id: 'take:test',
				shotId: 'shot:test',
				number: 1,
				status: 'selected',
				generation: { prompt: '   ' }
			})
		).toBeNull();
	});

	it('distinguishes review-pending independent still outputs without treating them as not-runnable', () => {
		const packages = listImagePackages(FESTIVAL);
		const independent = packages.find(
			(p) => p.source === 'shot_still' && p.outputs.some((out) => out.status === 'needs_review')
		);
		expect(independent).toBeTruthy();
		expect(packageHasOutput(independent!)).toBe(true);
		expect(packageOutputStatus(independent!)).toBe('needs_review');
		expect(independent!.runnable).toBe(
			independent!.promptReady &&
				packageRefsReady(independent!) &&
				independent!.blockers.length === 0
		);
	});

	it('lists Festival video stretch packages with separate reference categories', () => {
		const packages = listVideoPackages(FESTIVAL);
		const stretch = packages.find((p) => p.source === 'stretch_video');
		expect(stretch).toBeTruthy();
		expect(stretch!.refs.some((r) => r.role.startsWith('keyframe:') && r.category === 'keyframe')).toBe(
			true
		);
		expect(stretch!.refs.some((r) => r.category === 'visual')).toBe(true);
		expect(refCategoryFromRole('voice_sample')).toBe('voice_sample');
		const ready = packages.find(
			(p) => p.source === 'stretch_video' && p.id.includes('operations-gallery-001-003')
		);
		expect(ready?.promptReady).toBe(true);
		expect(ready?.runnable).toBe(true);
		const held = packages.find(
			(p) => p.source === 'stretch_video' && p.blockers.includes('editorial_prompt_freeze_not_approved')
		);
		expect(held?.promptReady).toBe(false);
		expect(held?.runnable).toBe(false);
	});

	it('lists dialogue audio packages with voice-sample refs and optional outputs', () => {
		const packages = listAudioPackages(FESTIVAL);
		expect(packages.length).toBeGreaterThan(0);
		const en = packages.find((p) => p.id.endsWith(':en'));
		expect(en).toBeTruthy();
		expect(en!.refs.some((r) => r.role === 'voice_sample' && r.category === 'voice_sample')).toBe(
			true
		);
		const summary = summarizePackages(packages);
		expect(summary.total).toBe(packages.length);
		expect(summary.refsComplete).toBe(packages.filter((p) => packageRefsComplete(p)).length);
		expect(summary.refsReady).toBe(packages.filter((p) => packageRefsReady(p)).length);
		expect(summary.canGenerate).toBe(packages.filter((p) => p.runnable === true).length);
		expect(summary.outputNeedsReview + summary.outputCurrent + summary.outputNeedsRegeneration + summary.outputMissingFile + packages.filter((p) => packageOutputStatus(p) === 'none').length).toBe(
			packages.length
		);
	});

	it('adds a missing_voice_sample blocker when no sample is present', () => {
		const packages = listAudioPackages(FESTIVAL);
		const missing = packages.find((pkg) => pkg.refs.some((ref) => !ref.present));
		if (missing) {
			expect(missing.blockers).toContain('missing_voice_sample');
			expect(packageRefsComplete(missing)).toBe(false);
			expect(missing.promptReady).toBe(Boolean(missing.promptPreview));
			expect(missing.runnable).toBe(false);
		} else {
			const synthetic = resolveRefPresence(null, { expectedKind: 'audio' });
			expect(synthetic.status).toBe('missing_catalog_entry');
			expect(synthetic.present).toBe(false);
		}
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

function fakeRef(overrides: Partial<GenerationPackageRef> & Pick<GenerationPackageRef, 'assetId'>): GenerationPackageRef {
	return {
		role: 'still_reference',
		category: 'visual',
		present: true,
		path: '/assets/x.png',
		kind: 'image',
		status: 'current',
		required: true,
		...overrides
	};
}

function fakePkg(overrides: Partial<GenerationPackage> = {}): GenerationPackage {
	return {
		id: 'pkg',
		title: 'pkg',
		medium: 'image',
		source: 'shot_still',
		promptReady: true,
		promptPreview: 'a compiled prompt',
		blockers: [],
		refs: [fakeRef({ assetId: 'asset:a' })],
		outputs: [],
		runnable: false,
		groupId: 'g',
		groupLabel: 'g',
		...overrides
	};
}

describe('generation package readiness predicates', () => {
	it('separates refs present, current, and ready', () => {
		const missing = fakePkg({
			refs: [fakeRef({ assetId: 'asset:missing', present: false, status: 'missing_catalog_entry' })]
		});
		expect(packageRefReadiness(missing)).toEqual({
			refsPresent: false,
			refsCurrent: false,
			refsReady: false
		});
		const stale = fakePkg({
			refs: [fakeRef({ assetId: 'asset:stale', status: 'needs_review' })]
		});
		expect(packageRefReadiness(stale)).toEqual({
			refsPresent: true,
			refsCurrent: false,
			refsReady: false
		});
		expect(packageRefsComplete(stale)).toBe(true);
		expect(packageRefsReady(stale)).toBe(false);
		const current = fakePkg();
		expect(packageRefReadiness(current).refsReady).toBe(true);
	});

	it('does not treat a prompt-ready package with stale refs as runnable', () => {
		const staleRefs = [fakeRef({ assetId: 'asset:stale', status: 'needs_regeneration' })];
		expect(
			derivePackageRunnable({
				promptReady: true,
				refs: staleRefs,
				blockers: []
			})
		).toBe(false);
		expect(
			derivePackageRunnable({
				promptReady: true,
				refs: staleRefs,
				blockers: []
			}, true)
		).toBe(false);
		expect(
			derivePackageRunnable({
				promptReady: true,
				refs: [fakeRef({ assetId: 'asset:a' })],
				blockers: []
			})
		).toBe(true);
	});

	it('keeps an explicit plan runnable:false as not runnable', () => {
		expect(
			derivePackageRunnable(
				{
					promptReady: true,
					refs: [fakeRef({ assetId: 'asset:a' })],
					blockers: []
				},
				false
			)
		).toBe(false);
	});

	it('requires a non-empty prompt before a package can generate', () => {
		expect(
			derivePackageRunnable({
				promptReady: false,
				refs: [fakeRef({ assetId: 'asset:a' })],
				blockers: []
			})
		).toBe(false);
	});

	it('filters refs_complete by presence and refs_ready by current status', () => {
		const stale = fakePkg({
			id: 'stale',
			refs: [fakeRef({ assetId: 'asset:stale', status: 'needs_replacement' })]
		});
		const current = fakePkg({ id: 'current' });
		expect(filterPackages([stale, current], 'refs_complete').map((p) => p.id)).toEqual([
			'stale',
			'current'
		]);
		expect(filterPackages([stale, current], 'refs_ready').map((p) => p.id)).toEqual(['current']);
	});

	it('treats festival-master shot-plan-016b as generatable despite review-pending output', () => {
		const packages = listImagePackages(FESTIVAL);
		const shot016b = packages.find((p) => p.id === 'shot-still:festival-master:shot-plan-016b');
		expect(shot016b).toBeTruthy();
		expect(shot016b!.promptReady).toBe(true);
		expect(packageRefsReady(shot016b!)).toBe(true);
		expect(shot016b!.blockers).toEqual([]);
		expect(packageOutputStatus(shot016b!)).toBe('needs_review');
		expect(shot016b!.runnable).toBe(true);
	});
});
