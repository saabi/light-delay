import { describe, expect, it } from 'vitest';
import { compileStretchVideoPrompt } from '../../../scripts/lib/visual-stretch-video-prompt.mjs';
import {
	AGENT_INSTRUCTIONS_PREVIEW,
	DEFAULT_SMOKE_EXECUTION_POLICY,
	buildVisualStretchRunHandoff,
	stagingFilenameForAssetId
} from '../../../scripts/lib/visual-stretch-handoff.mjs';

describe('compileStretchVideoPrompt', () => {
	it('returns preview + blockers without throwing when blockers exist', () => {
		const stretch = {
			id: 'stretch:x',
			locationId: 'location:bridge',
			presentCharacterIds: ['character:zao'],
			physics: { en: '1g' },
			lighting: { en: 'blue' },
			members: [
				{
					shotId: 'shot-a',
					order: 1,
					startState: { en: 'start' },
					event: { en: 'event' },
					endState: { en: 'end' }
				}
			]
		};
		const job = {
			memberInputs: [{ order: 1, shotId: 'shot-a', sourceTakeIds: [] }],
			blockers: ['missing_stretch_blocking', 'missing_voice_sample:character:zao']
		};
		const script = {
			shots: [{ id: 'shot-a', durationMs: 10000, description: { en: 'Zao sits.' }, cuePlacements: [] }],
			cues: []
		};
		const result = compileStretchVideoPrompt({ stretch, job, script, blockers: job.blockers });
		expect(result.preview).toContain('style:');
		expect(result.preview).toContain('physics: 1g');
		expect(result.blockers).toContain('missing_stretch_blocking');
		expect(result.sections.audio).toBeTruthy();
	});
});

describe('visual stretch handoff', () => {
	it('uses stable staging filenames from asset ids', () => {
		expect(stagingFilenameForAssetId('asset:character-zao-sheet', 'png')).toBe(
			'asset-character-zao-sheet.png'
		);
	});

	it('refuses without --allow-preview-prompt', () => {
		expect(() =>
			buildVisualStretchRunHandoff({
				root: process.cwd(),
				script: { shots: [], cues: [], visualStretches: [] },
				plan: { plan: { scriptId: 'script:x', promptLanguage: 'en' } },
				job: {
					id: 'job:1',
					stretchId: 'stretch:x',
					medium: 'video',
					providerSnapshotId: 'provider:test',
					memberInputs: [],
					blockers: [],
					compiledPrompt: null
				},
				stretch: { id: 'stretch:x', members: [] },
				snapshot: { provider: 'higgsfield', model: 'seedance-2.5' },
				assetsById: new Map(),
				allowPreviewPrompt: false
			})
		).toThrow(/allow-preview-prompt/);
	});

	it('emits nonExecutable preview with smoke policy', () => {
		const run = buildVisualStretchRunHandoff({
			root: process.cwd(),
			script: {
				shots: [{ id: 'shot-a', durationMs: 5000, description: { en: 'A' }, cuePlacements: [] }],
				cues: [],
				visualStretches: []
			},
			plan: { plan: { scriptId: 'script:x', promptLanguage: 'en' } },
			job: {
				id: 'job:video-1',
				stretchId: 'stretch:x',
				medium: 'video',
				providerSnapshotId: 'provider:higgsfield:seedance-2.5:test',
				dependsOnStillJobId: 'job:still',
				durationMs: 5000,
				memberInputs: [{ order: 1, shotId: 'shot-a', sourceTakeIds: [] }],
				blockers: ['editorial_prompt_freeze_not_approved'],
				compiledPrompt: null
			},
			stretch: {
				id: 'stretch:x',
				locationId: 'location:bridge',
				presentCharacterIds: [],
				physics: { en: '1g' },
				lighting: { en: 'lit' },
				members: [{ shotId: 'shot-a', order: 1, event: { en: 'beat' } }]
			},
			snapshot: { provider: 'higgsfield', model: 'seedance-2.5' },
			assetsById: new Map(),
			allowPreviewPrompt: true
		});
		expect(run.nonExecutable).toBe(true);
		expect(run.status).toBe('preview');
		expect(run.executionPolicy).toEqual(DEFAULT_SMOKE_EXECUTION_POLICY);
		expect(run.agentInstructions).toContain('Do NOT submit');
		expect(run.agentInstructions).toBe(AGENT_INSTRUCTIONS_PREVIEW);
		expect(run.references.some((r) => r.role === 'keyframe')).toBe(true);
		expect(run.inputDigest).toHaveLength(64);
	});

	it('rejects medium flag mismatch', () => {
		expect(() =>
			buildVisualStretchRunHandoff({
				root: process.cwd(),
				script: { shots: [], cues: [] },
				plan: { plan: { scriptId: 'script:x' } },
				job: {
					id: 'job:1',
					stretchId: 's',
					medium: 'video',
					providerSnapshotId: 'p',
					memberInputs: [],
					blockers: [],
					compiledPrompt: null
				},
				stretch: { id: 's', members: [] },
				snapshot: {},
				assetsById: new Map(),
				allowPreviewPrompt: true,
				mediumFlag: 'still'
			})
		).toThrow(/does not match/);
	});
});
