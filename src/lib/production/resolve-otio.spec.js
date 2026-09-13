import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	FESTIVAL_SCRIPT_ID,
	TRAILER_SCRIPT_ID,
	assembleTimeline,
	assetsByIdFromFile,
	collectDialogueCues,
	clipTargetUrl,
	isStillUrl,
	matchShotId,
	msToFrames,
	serializeOtio,
	swapTakes
} from '../../../scripts/lib/resolve-otio.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');

function loadJson(rel) {
	return JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
}

function fixtureScript() {
	return {
		script: { id: 'script:test-cut' },
		cues: [
			{
				id: 'test:cue-1',
				type: 'dialogue',
				content: {
					variants: {
						en: { spokenText: 'Hi.', audioAssetId: 'asset:wav-1', estimatedDurationMs: 1000 }
					}
				}
			}
		],
		shots: [
			{
				id: 'test:shot-a',
				durationMs: 2000,
				selectedTakeId: 'test:shot-a:take-01',
				cuePlacements: [{ cueId: 'test:cue-1', atMs: 250, durationMs: 1000 }],
				takeIds: ['test:shot-a:take-01']
			},
			{
				id: 'test:shot-b',
				durationMs: 1000,
				selectedTakeId: 'test:shot-b:take-01',
				cuePlacements: [],
				takeIds: ['test:shot-b:take-01']
			}
		],
		takes: [
			{
				id: 'test:shot-a:take-01',
				shotId: 'test:shot-a',
				imageAssetId: 'asset:still-a'
			},
			{
				id: 'test:shot-b:take-01',
				shotId: 'test:shot-b',
				imageAssetId: 'asset:still-b'
			}
		]
	};
}

function fixtureAssets() {
	return new Map([
		['asset:still-a', { id: 'asset:still-a', kind: 'image', path: '/assets/a.png' }],
		['asset:still-b', { id: 'asset:still-b', kind: 'image', path: '/assets/b.png' }],
		['asset:wav-1', { id: 'asset:wav-1', kind: 'audio', path: '/assets/cue-1.wav' }],
		['asset:video-a', { id: 'asset:video-a', kind: 'video', path: '/assets/a.mov' }]
	]);
}

const alwaysExists = () => true;

describe('resolve OTIO time snap', () => {
	it('rounds millisecond durations to whole frames at 24 fps', () => {
		expect(msToFrames(1000, 24)).toBe(24);
		expect(msToFrames(500, 24)).toBe(12);
		expect(msToFrames(13620, 24)).toBe(327);
	});
});

describe('resolve OTIO fresh assembly', () => {
	it('places stills on V1 and cue WAVs on A1 using the animatic startMs formula', () => {
		const script = fixtureScript();
		const { timeline, report } = assembleTimeline(script, fixtureAssets(), {
			root: ROOT,
			fileExists: alwaysExists
		});
		expect(report.pictureClips).toBe(2);
		expect(report.dialogueClips).toBe(1);
		expect(report.pictureGaps).toBe(0);
		const video = timeline.tracks.children[0];
		const audio = timeline.tracks.children[1];
		expect(video.kind).toBe('Video');
		expect(video.name).toBe('Video 1');
		expect(audio.name).toBe('Audio 1');
		expect(video.children).toHaveLength(2);
		expect(timeline.name).toBe('test-cut');
		expect(timeline.global_start_time.value).toBe(86400);
		expect(timeline.metadata.Resolve_OTIO['Resolve OTIO Meta Version']).toBe('1.0');
		expect(video.children[0].name).toBe('test__shot-a');
		expect(video.children[0].name.includes(':')).toBe(false);
		expect(video.children[0].OTIO_SCHEMA).toBe('Clip.2');
		expect(video.children[0].enabled).toBe(true);
		expect(video.children[0].markers).toEqual([]);
		expect(video.children[0].source_range.duration.value).toBe(48);
		expect(video.children[0].media_references.DEFAULT_MEDIA.available_range.duration.value).toBe(1);
		const stillUrl = clipTargetUrl(video.children[0]);
		expect(isStillUrl(stillUrl)).toBe(true);
		expect(stillUrl.startsWith('file:')).toBe(false);
		expect(stillUrl.replace(/\\/g, '/')).toMatch(/\/static\/assets\/a\.png$/);
		if (process.platform === 'win32') expect(stillUrl.includes('\\')).toBe(true);
		const cues = collectDialogueCues(script, { lang: 'en', fps: 24 });
		expect(cues[0].startMs).toBe(250);
		expect(cues[0].startFrame).toBe(msToFrames(250, 24));
		const wav = audio.children.find((item) => item.OTIO_SCHEMA.startsWith('Clip'));
		expect(wav?.name).toBe('test__cue-1');
		expect(wav?.source_range.duration.value).toBe(24);
		const serialized = serializeOtio(timeline);
		expect(serialized).toContain('"rate": 24.0');
		const parsed = JSON.parse(serialized);
		expect(parsed.OTIO_SCHEMA).toBe('Timeline.1');
	});

	it('uses a Gap when a shot has no still on disk', () => {
		const script = fixtureScript();
		const { report, timeline } = assembleTimeline(script, fixtureAssets(), {
			root: ROOT,
			fileExists: () => false
		});
		expect(report.pictureGaps).toBe(2);
		expect(report.missingStills).toEqual(['test:shot-a', 'test:shot-b']);
		expect(timeline.tracks.children[0].children.every((item) => item.OTIO_SCHEMA.startsWith('Gap'))).toBe(
			true
		);
	});
});

describe('resolve OTIO swap', () => {
	it('replaces a still with video, keeps duration, drops that shot’s TTS, and leaves unmatched clips', () => {
		const script = fixtureScript();
		const assets = fixtureAssets();
		const { timeline } = assembleTimeline(script, assets, { root: ROOT, fileExists: alwaysExists });
		script.takes[0].videoAssetId = 'asset:video-a';
		timeline.tracks.children[0].children.push({
			OTIO_SCHEMA: 'Clip.1',
			name: 'user-broll',
			source_range: {
				OTIO_SCHEMA: 'TimeRange.1',
				start_time: { OTIO_SCHEMA: 'RationalTime.1', rate: 24, value: 0 },
				duration: { OTIO_SCHEMA: 'RationalTime.1', rate: 24, value: 12 }
			},
			media_reference: {
				OTIO_SCHEMA: 'ExternalReference.1',
				target_url: 'file:///tmp/broll.mov'
			},
			metadata: {},
			markers: [],
			effects: []
		});
		const beforeDuration = timeline.tracks.children[0].children[0].source_range.duration.value;
		const { timeline: next, report } = swapTakes(timeline, script, assets, {
			root: ROOT,
			fileExists: alwaysExists
		});
		expect(report.swapped).toEqual(['test:shot-a']);
		const picture = next.tracks.children[0].children[0];
		expect(picture.OTIO_SCHEMA).toBe('Clip.2');
		expect(clipTargetUrl(picture)).toContain('a.mov');
		expect(picture.source_range.duration.value).toBe(beforeDuration);
		expect(picture.metadata.light_delay.mediaKind).toBe('video');
		const dialogue = next.tracks.children[1].children.filter((item) =>
			String(item.OTIO_SCHEMA).startsWith('Clip')
		);
		expect(dialogue.some((item) => item.name === 'test__cue-1' || item.name === 'test:cue-1')).toBe(
			false
		);
		expect(report.droppedDialogue).toContain('test:cue-1');
		expect(next.tracks.children[0].children.at(-1).name).toBe('user-broll');
		expect(matchShotId({ name: 'test:shot-a' }, new Set(['test:shot-a']))).toBe('test:shot-a');
		expect(matchShotId({ name: 'test__shot-a' }, new Set(['test:shot-a']))).toBe('test:shot-a');
		expect(
			matchShotId(
				{
					name: 'shot-plan-001.png',
					media_references: {
						DEFAULT_MEDIA: {
							target_url:
								'E:\\Work\\light-delay\\static\\assets\\animatic\\frames\\festival-master\\shot-plan-001.png'
						}
					}
				},
				new Set(['festival-master:shot-plan-001'])
			)
		).toBe('festival-master:shot-plan-001');
	});
});

describe('resolve OTIO live Festival and trailer assemblies', () => {
	it('builds a Festival-master timeline with stills and dialogue WAVs', () => {
		const script = loadJson('data/scripts/light-delay-festival-master.json');
		const assets = assetsByIdFromFile(loadJson('data/assets.json'));
		expect(script.script.id).toBe(FESTIVAL_SCRIPT_ID);
		const { timeline, report } = assembleTimeline(script, assets, { root: ROOT });
		expect(report.pictureClips).toBeGreaterThan(50);
		expect(report.dialogueClips).toBeGreaterThan(50);
		expect(timeline.tracks.children[0].children.length).toBe(script.shots.length);
		const cues = collectDialogueCues(script, { lang: 'en', fps: 24 });
		expect(cues[0].startMs).toBeGreaterThanOrEqual(0);
		const wavClips = timeline.tracks.children[1].children.filter((item) =>
			String(item.OTIO_SCHEMA).startsWith('Clip')
		);
		expect(wavClips[0].source_range.start_time.value).toBe(0);
		const firstStill = timeline.tracks.children[0].children.find((item) =>
			String(item.OTIO_SCHEMA).startsWith('Clip')
		);
		expect(firstStill?.OTIO_SCHEMA).toBe('Clip.2');
		expect(firstStill?.name).toBe('festival-master__shot-plan-title');
		expect(firstStill?.name.includes(':')).toBe(false);
		expect(clipTargetUrl(firstStill).startsWith('file:')).toBe(false);
		expect(timeline.name.includes(':')).toBe(false);
	});

	it('builds a trailer-master timeline on its own shot clock with reused Festival media', () => {
		const script = loadJson('data/scripts/light-delay-trailer-master.json');
		const assets = assetsByIdFromFile(loadJson('data/assets.json'));
		expect(script.script.id).toBe(TRAILER_SCRIPT_ID);
		const { timeline, report } = assembleTimeline(script, assets, { root: ROOT });
		expect(timeline.tracks.children[0].children.length).toBe(script.shots.length);
		expect(report.pictureClips + report.pictureGaps).toBe(script.shots.length);
		const cues = collectDialogueCues(script, { lang: 'en', fps: 24 });
		const withAudio = cues.filter((cue) => cue.audioAssetId);
		expect(withAudio.length).toBeGreaterThan(0);
		expect(report.dialogueClips).toBeGreaterThan(0);
	});
});
