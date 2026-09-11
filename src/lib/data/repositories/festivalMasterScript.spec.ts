import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getOutline, getScript } from './index.ts';
import type { StoryText } from '$lib/types/i18n';

const scriptId = 'script:light-delay-festival-master';
const root = process.cwd();
const english = (value: StoryText | undefined) =>
	typeof value === 'string' ? value : (value?.en ?? '');

describe('master-derived Festival screenplay', () => {
	it('implements the approved screenplay scope without production shots or takes', () => {
		const script = getScript(scriptId);
		expect(script.acts).toHaveLength(3);
		expect(script.sequences).toHaveLength(11);
		expect(script.scenes).toHaveLength(33);
		expect(script.scenes.filter((scene) => scene.sequenceId)).toHaveLength(31);
		expect(script.scenes.reduce((total, scene) => total + (scene.targetDurationMs ?? 0), 0)).toBe(
			690_000
		);
		expect(script.shots).toEqual([]);
		expect(script.takes).toEqual([]);
		expect(script.cues.filter((cue) => cue.type === 'dialogue').length).toBeGreaterThan(100);
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
			(cue) => cue.type === 'action' && english(cue.text).includes('disconnects bridge flight commands')
		);
		const heardRecording = cues.findIndex(
			(cue) =>
				cue.type === 'dialogue' && cue.content.variants.en.spokenText.startsWith('If this reaches')
		);
		const silentRecording = cues.findIndex(
			(cue) =>
				cue.type === 'silence' && english(cue.purpose).includes('deliberately inaudible')
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
		expect(blueprint.match(/festival-master:shot-plan-\d{3}/g)).toHaveLength(96);
		const storyTargets = [...blueprint.matchAll(/shot-plan-\d{3}` \| ([\d.]+)s/g)].map(
			(match) => Number(match[1])
		);
		expect(storyTargets).toHaveLength(96);
		expect(Math.max(...storyTargets)).toBeLessThanOrEqual(8);
	});

	it('uses no extra intelligible Earth speaker beyond the reporter', () => {
		const script = getScript(scriptId);
		const opening = script.scenes.find(
			(scene) => english(scene.title) === 'Forty-three minutes late'
		)!;
		const openingBeatIds = new Set(opening.beatIds);
		const openingSpeakers = new Set(
			script.cues
				.flatMap((cue) =>
					openingBeatIds.has(cue.beatId) && cue.type === 'dialogue' ? [cue.speakerId] : []
				)
		);
		expect(openingSpeakers).toContain('character:periodista');
		expect(openingSpeakers).not.toContain('character:earth-protesters');
		expect(openingSpeakers).not.toContain('character:manifestante-acheron');
		expect(openingSpeakers).not.toContain('character:joven-contacto');
	});
});
