import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getLocations, getOutline, getScript } from './index.ts';
import type { StoryText } from '$lib/types/i18n';

const scriptId = 'script:light-delay-festival-master';
const root = process.cwd();
const english = (value: StoryText | undefined) =>
	typeof value === 'string' ? value : (value?.en ?? '');

describe('master-derived Festival screenplay', () => {
	it('implements the approved screenplay scope', () => {
		const script = getScript(scriptId);
		expect(script.acts).toHaveLength(3);
		expect(script.sequences).toHaveLength(11);
		expect(script.scenes).toHaveLength(33);
		expect(script.scenes.filter((scene) => scene.sequenceId)).toHaveLength(31);
		expect(script.scenes.reduce((total, scene) => total + (scene.targetDurationMs ?? 0), 0)).toBe(
			809_759
		);
		expect(script.cues.filter((cue) => cue.type === 'dialogue').length).toBeGreaterThan(100);
	});

	it('implements the storyboard as Shot/Take records with still-image prompts', () => {
		const script = getScript(scriptId);
		expect(script.shots).toHaveLength(103);
		expect(script.takes).toHaveLength(103);
		const shotIds = new Set(script.shots.map((shot) => shot.id));
		expect(shotIds.size).toBe(103);
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
		for (const take of script.takes) {
			expect(take.status, take.id).toBe('candidate');
			expect(take.generation?.prompt, take.id).toBeTruthy();
			// A separate asset-generation pipeline may since have picked up this prompt,
			// generated a still, and recorded its own provider/model/imageAssetId — that's
			// expected and fine; this suite only owns prompt authorship, not generation.
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

	it('covers every Festival outline step with script evidence', () => {
		const outline = getOutline(scriptId)!;
		const story = outline.steps.filter((step) => step.level === 'story');
		expect(story).toHaveLength(24);
		for (const step of story) {
			expect(step.coverage?.script?.status, step.id).toBe('covered');
			expect(step.coverage?.script?.sceneIds?.length, step.id).toBeGreaterThan(0);
			expect(step.coverage?.script?.beatIds?.length, step.id).toBeGreaterThan(0);
			expect(step.coverage?.script?.cueIds?.length, step.id).toBeGreaterThan(0);
		}
	});

	it('preserves the delayed reveal and places flight sabotage after the murder', () => {
		const script = getScript(scriptId);
		const cues = script.cues;
		const impact = cues.findIndex(
			(cue) => cue.type === 'sound' && english(cue.description).includes('bodily impact')
		);
		const flightSabotage = cues.findIndex(
			(cue) =>
				cue.type === 'action' && english(cue.text).includes('disconnects bridge flight commands')
		);
		const heardRecording = cues.findIndex(
			(cue) =>
				cue.type === 'dialogue' && cue.content.variants.en.spokenText.startsWith('If this reaches')
		);
		const silentRecording = cues.findIndex(
			(cue) => cue.type === 'silence' && english(cue.purpose).includes('deliberately inaudible')
		);
		expect(impact).toBeGreaterThan(-1);
		expect(flightSabotage).toBeGreaterThan(impact);
		expect(heardRecording).toBeGreaterThan(silentRecording);
	});

	it('marks four separate gravity events and reserves 96 story shot-plan units', () => {
		const script = getScript(scriptId);
		const action = script.cues
			.filter((cue) => cue.type === 'action')
			.map((cue) => (cue.type === 'action' ? english(cue.text) : ''))
			.join('\n');
		expect(action).toContain('At Jupiter periapsis, thrust cuts');
		expect(action).toContain('thrust cuts again for the precision crossing');
		expect(action).toContain('thrust cuts for the third time');
		expect(action).toContain('thrust cuts for the fourth time');

		const blueprint = readFileSync(
			join(root, 'docs/wip/festival-master-shot-blueprint.en.md'),
			'utf8'
		);
		// (?!\w) excludes the lettered follow-up shot `shot-plan-040b` (added to give the
		// throat-crossing its own exterior beat) from this count of the 96 originally
		// reserved three-digit story units.
		expect(blueprint.match(/festival-master:shot-plan-\d{3}(?!\w)/g)).toHaveLength(96);
		const storyTargets = [...blueprint.matchAll(/shot-plan-\d{3}(?!\w)` \| ([\d.]+)s/g)].map(
			(match) => Number(match[1])
		);
		expect(storyTargets).toHaveLength(96);
		// Per-shot ceiling is the campaign's maxSegmentMs (30 s), not an earlier 8 s draft rule.
		expect(Math.max(...storyTargets)).toBeLessThanOrEqual(30);
	});

	it('uses the master reactor geography and never the obsolete diplomatic core', () => {
		const script = getScript(scriptId);
		const byId = new Map(script.scenes.map((scene) => [scene.id, scene]));
		const usedLocations = script.scenes.flatMap((scene) => [
			scene.locationId,
			...(scene.secondaryLocationIds ?? [])
		]);
		expect(usedLocations).not.toContain('location:diplomatic-core-room');
		expect(byId.get('festival-master:scene-09')?.locationId).toBe(
			'location:celestial-ardor-inner-shielding-vault'
		);
		expect(byId.get('festival-master:scene-27')?.locationId).toBe(
			'location:celestial-ardor-inner-shielding-vault'
		);
		for (const sceneId of [
			'festival-master:scene-14',
			'festival-master:scene-26',
			'festival-master:scene-32'
		]) {
			expect(byId.get(sceneId)?.locationId, sceneId).toBe(
				'location:celestial-ardor-reactor-service-bay'
			);
		}

		const locations = new Map(getLocations().locations.map((location) => [location.id, location]));
		expect(locations.get('location:celestial-ardor-reactor-service-bay')?.parentLocationId).toBe(
			'location:celestial-ardor-engineering'
		);
		expect(locations.get('location:celestial-ardor-inner-shielding-vault')?.parentLocationId).toBe(
			'location:celestial-ardor-reactor-service-bay'
		);
		// Reference art has since been generated for both (was pending when this test was
		// first written); just confirm the location records still resolve and aren't
		// silently missing their reference sheet.
		expect(
			locations.get('location:celestial-ardor-reactor-service-bay')?.referenceAssetIds?.length
		).toBeGreaterThan(0);
		expect(
			locations.get('location:celestial-ardor-inner-shielding-vault')?.referenceAssetIds?.length
		).toBeGreaterThan(0);

		const blueprint = readFileSync(
			join(root, 'docs/wip/festival-master-shot-blueprint.en.md'),
			'utf8'
		);
		// One location-binding line per story scene. Scene 15 uses a per-shot variant of the
		// phrasing (it mixes bridge-interior and wormhole-exterior shots), so this matches the
		// declaration generically rather than the single-location wording used elsewhere.
		expect(blueprint.match(/^Location binding[^\n]*/gm)).toHaveLength(31);
		expect(blueprint).not.toContain('location:diplomatic-core-room');
	});

	it('uses no extra intelligible Earth speaker beyond the reporter', () => {
		const script = getScript(scriptId);
		const opening = script.scenes.find(
			(scene) => english(scene.title) === 'Forty-three minutes late'
		)!;
		const openingBeatIds = new Set(opening.beatIds);
		const openingSpeakers = new Set(
			script.cues.flatMap((cue) =>
				openingBeatIds.has(cue.beatId) && cue.type === 'dialogue' ? [cue.speakerId] : []
			)
		);
		expect(openingSpeakers).toContain('character:periodista');
		expect(openingSpeakers).not.toContain('character:earth-protesters');
		expect(openingSpeakers).not.toContain('character:manifestante-acheron');
		expect(openingSpeakers).not.toContain('character:joven-contacto');
	});
});
