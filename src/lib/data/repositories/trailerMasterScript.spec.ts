import { describe, expect, it } from 'vitest';
import { TRAILER_MASTER_FESTIVAL_DIALOGUE_MAP } from '../../../../scripts/lib/trailer-master-festival-dialogue-audio.mjs';
import { getProject, getScript } from './index.ts';

const scriptId = 'script:light-delay-trailer-master';
const festivalScriptId = 'script:light-delay-festival-master';

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

	it('reuses an already-generated Festival-master frame for every take, and carries no leftover standalone prompt once reused', () => {
		const script = getScript(scriptId);
		let reused = 0;
		let ownPrompt = 0;
		for (const take of script.takes) {
			if (take.imageAssetId) {
				reused += 1;
				// Regeneration finished for the takes that used to need their own prompt
				// (docs/wip/trailer-master-blueprint.en.md, PROJECT_STATUS 2026-09-12/13); a
				// take that now reuses a frame shouldn't still carry a dead standalone prompt.
				expect(take.generation, take.id).toBeUndefined();
			} else {
				ownPrompt += 1;
				expect(take.generation?.prompt, take.id).toBeTruthy();
			}
		}
		expect(reused).toBe(script.takes.length);
		expect(ownPrompt).toBe(0);
	});

	it('sums scene durations to the script target duration', () => {
		const script = getScript(scriptId);
		const shotSum = script.shots.reduce((total, shot) => total + shot.durationMs, 0);
		const sceneSum = script.scenes.reduce((total, scene) => total + (scene.targetDurationMs ?? 0), 0);
		expect(sceneSum).toBe(script.script.targetDurationMs);
		expect(shotSum).toBe(script.script.targetDurationMs);
		expect(sceneSum).toBe(87_800);
		const registry = getProject().project.scripts.find((entry) => entry.id === scriptId);
		expect(registry?.targetDurationMs).toBe(87_800);
	});

	it('reuses Festival-master EN dialogue audio on every spoken trailer cue', () => {
		const trailer = getScript(scriptId);
		const festival = getScript(festivalScriptId);
		const festivalCueById = new Map(festival.cues.map((cue) => [cue.id, cue]));
		const dialogue = trailer.cues.filter((cue) => cue.type === 'dialogue');
		expect(dialogue).toHaveLength(Object.keys(TRAILER_MASTER_FESTIVAL_DIALOGUE_MAP).length);

		for (const cue of dialogue) {
			if (cue.type !== 'dialogue') continue;
			const sourceId =
				TRAILER_MASTER_FESTIVAL_DIALOGUE_MAP[
					cue.id as keyof typeof TRAILER_MASTER_FESTIVAL_DIALOGUE_MAP
				];
			expect(sourceId, cue.id).toBeTruthy();
			const source = festivalCueById.get(sourceId);
			expect(source?.type, sourceId).toBe('dialogue');
			if (!source || source.type !== 'dialogue') continue;
			expect(cue.speakerId).toBe(source.speakerId);
			expect(cue.content.variants.en?.audioAssetId).toBe(source.content.variants.en?.audioAssetId);
			expect(
				cue.sourceRefs?.some((ref) => 'cueId' in ref && ref.cueId === sourceId)
			).toBe(true);
		}
	});

	it('keeps promoted EN dialogue audio inside its shot without overlaps', () => {
		const script = getScript(scriptId);
		const cueById = new Map(script.cues.map((cue) => [cue.id, cue]));
		for (const shot of script.shots) {
			const intervals: { id: string; at: number; end: number }[] = [];
			for (const placement of shot.cuePlacements) {
				const cue = cueById.get(placement.cueId);
				if (!cue || cue.type !== 'dialogue') continue;
				const wavMs = cue.content.variants.en?.estimatedDurationMs;
				expect(wavMs, cue.id).toBeGreaterThan(0);
				expect(placement.atMs + (wavMs ?? 0), `${shot.id}:${cue.id}`).toBeLessThanOrEqual(
					shot.durationMs
				);
				intervals.push({
					id: cue.id,
					at: placement.atMs,
					end: placement.atMs + (wavMs ?? 0)
				});
			}
			intervals.sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));
			for (let i = 1; i < intervals.length; i += 1) {
				expect(intervals[i]!.at, `${shot.id}:${intervals[i]!.id}`).toBeGreaterThanOrEqual(
					intervals[i - 1]!.end
				);
			}
		}
	});

	it('ends before first contact resolves, matching its stated restraint', () => {
		const script = getScript(scriptId);
		const lastScene = script.scenes[script.scenes.length - 1]!;
		expect(lastScene.id).toBe('trailer-master:scene-g');
		// No shot in the trailer reuses the ending beats (contact success / "You made it in time").
		const reusedSourceShotIds = script.shots
			.flatMap((shot) => shot.sourceRefs ?? [])
			.map((ref) => ('shotId' in ref ? ref.shotId : undefined));
		expect(reusedSourceShotIds).not.toContain('festival-master:shot-plan-096');
		expect(reusedSourceShotIds).not.toContain('festival-master:shot-plan-095');
	});
});
