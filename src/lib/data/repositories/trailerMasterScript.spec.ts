import { describe, expect, it } from 'vitest';
import { getScript } from './index.ts';

const scriptId = 'script:light-delay-trailer-master';

describe('master-derived trailer', () => {
	it('is registered as a draft trailer sourced from the Festival master cut', () => {
		const script = getScript(scriptId);
		expect(script.script.kind).toBe('trailer');
		expect(script.script.status).toBe('draft');
		expect(script.script.lineage?.sourceScriptId).toBe('script:light-delay-festival-master');
		expect(script.acts).toHaveLength(1);
		expect(script.scenes).toHaveLength(7);
	});

	it('implements every shot as a Shot/Take pair with valid cuePlacement spans', () => {
		const script = getScript(scriptId);
		expect(script.shots).toHaveLength(22);
		expect(script.takes).toHaveLength(22);
		const shotIds = new Set(script.shots.map((shot) => shot.id));
		expect(shotIds.size).toBe(22);
		for (const shot of script.shots) {
			expect(shot.cuePlacements.length, shot.id).toBeGreaterThan(0);
			const span = shot.cuePlacements.reduce(
				(max, placement) => Math.max(max, placement.atMs + (placement.durationMs ?? 0)),
				0
			);
			expect(span, shot.id).toBe(shot.durationMs);
			expect(shot.takeIds, shot.id).toHaveLength(1);
			expect(shot.selectedTakeId, shot.id).toBe(shot.takeIds[0]);
		}
	});

	it('reuses already-generated Festival-master frames where they exist, and gives every other take its own standalone prompt', () => {
		const script = getScript(scriptId);
		let reused = 0;
		let ownPrompt = 0;
		for (const take of script.takes) {
			if (take.imageAssetId) {
				reused += 1;
			} else {
				ownPrompt += 1;
				expect(take.generation?.prompt, take.id).toBeTruthy();
			}
		}
		expect(reused).toBeGreaterThan(0);
		expect(ownPrompt).toBeGreaterThan(0);
		expect(reused + ownPrompt).toBe(script.takes.length);
	});

	it('sums scene durations to the script target duration', () => {
		const script = getScript(scriptId);
		const sum = script.scenes.reduce((total, scene) => total + (scene.targetDurationMs ?? 0), 0);
		expect(sum).toBe(script.script.targetDurationMs);
		expect(sum).toBe(67_700);
	});

	it('ends before first contact resolves, matching its stated restraint', () => {
		const script = getScript(scriptId);
		const lastScene = script.scenes[script.scenes.length - 1]!;
		expect(lastScene.id).toBe('trailer-master:scene-g');
		// No shot in the trailer reuses the ending beats (contact success / "You made it in time").
		const reusedSourceShotIds = script.shots
			.flatMap((shot) => shot.sourceRefs ?? [])
			.map((ref) => ref.shotId);
		expect(reusedSourceShotIds).not.toContain('festival-master:shot-plan-096');
		expect(reusedSourceShotIds).not.toContain('festival-master:shot-plan-095');
	});
});
