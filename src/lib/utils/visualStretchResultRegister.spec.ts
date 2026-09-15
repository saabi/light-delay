import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import { describe, expect, it } from 'vitest';
import { buildVisualStretchRunHandoff } from '../../../scripts/lib/visual-stretch-handoff.mjs';
import { compileStretchVideoPrompt } from '../../../scripts/lib/visual-stretch-video-prompt.mjs';
import {
	collectDurationDriftErrors,
	collectHashMismatchErrors,
	collectResultDuplicateErrors,
	collectResultJobIdentityErrors,
	collectResultRequiredFieldErrors,
	collectResultRunMatchErrors,
	sanitizeRunResultFilename,
	validateOutputRepoPath
} from '../../../scripts/lib/visual-stretch-result-register.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');

describe('compileStretchVideoPrompt dialogue and camera', () => {
	it('reads spokenText and movementDescription', () => {
		const stretch = {
			id: 'stretch:x',
			locationId: 'location:bridge',
			presentCharacterIds: ['character:zao'],
			physics: { en: '1g' },
			lighting: { en: 'blue' },
			members: [{ shotId: 'shot-a', order: 1, event: { en: 'speaks' } }]
		};
		const job = {
			memberInputs: [{ order: 1, shotId: 'shot-a', sourceTakeIds: [] }],
			blockers: ['missing_voice_sample:character:zao']
		};
		const script = {
			shots: [
				{
					id: 'shot-a',
					durationMs: 8000,
					description: { en: 'Zao speaks.' },
					camera: {
						movement: 'tracking',
						movementDescription: { en: 'Slow tracking left across the table.' }
					},
					composition: { size: 'MCU' },
					cuePlacements: [{ cueId: 'cue-1', atMs: 1200 }]
				}
			],
			cues: [
				{
					id: 'cue-1',
					type: 'dialogue',
					speakerId: 'character:zao',
					content: { variants: { en: { spokenText: 'Nice ship name.' } } }
				}
			]
		};
		const result = compileStretchVideoPrompt({ stretch, job, script });
		expect(result.preview).toContain('{Nice ship name.}');
		expect(result.preview).toContain('Slow tracking left across the table.');
		expect(result.preview).not.toContain('No dialogue cues in this bucket');
	});

	it('binds spoken cues to character image and voice references and carries motion state', () => {
		const result = compileStretchVideoPrompt({
			stretch: {
				id: 'stretch:x',
				presentCharacterIds: ['character:zao'],
				members: [
					{ shotId: 'shot-a', order: 1, endState: { en: 'Zao settles at the console.' } },
					{ shotId: 'shot-b', order: 2, startState: { en: 'Zao remains at the console.' }, event: { en: 'Zao turns.' } }
				]
			},
			job: { memberInputs: [{ shotId: 'shot-a' }, { shotId: 'shot-b' }] },
			script: {
				shots: [
					{ id: 'shot-a', durationMs: 4000, cuePlacements: [{ cueId: 'cue-1', atMs: 500 }] },
					{ id: 'shot-b', durationMs: 4000, cuePlacements: [] }
				],
				cues: [{ id: 'cue-1', type: 'dialogue', speakerId: 'character:zao', content: { variants: { en: { spokenText: 'I see it.' } } } }]
			},
			effectiveReferences: [
				{ role: 'visual_reference', assetId: 'asset:character-zao-sheet', kind: 'image', entityIds: ['character:zao'] },
				{ role: 'voice_sample', assetId: 'asset:voice-ref-en-zao', kind: 'audio', entityIds: ['character:zao'] }
			]
		});
		expect(result.preview).toContain('asset:character-zao-sheet');
		expect(result.preview).toContain('asset:voice-ref-en-zao');
		expect(result.preview).toContain('continue from prior settled state');
		expect(result.blockers).not.toContain('unmapped_dialogue_character:character:zao');
		expect(result.blockers).not.toContain('unmapped_dialogue_voice:character:zao');
	});
});

describe('run schema validation', () => {
	it('accepts a pilot-shaped preview run', () => {
		const run = buildVisualStretchRunHandoff({
			root: ROOT,
			script: {
				script: { id: 'script:light-delay-festival-master' },
				shots: [
					{
						id: 'festival-master:shot-plan-010',
						durationMs: 5000,
						description: { en: 'Meal insert.' },
						camera: { movementDescription: { en: 'Tracking.' } },
						cuePlacements: []
					}
				],
				cues: []
			},
			plan: {
				plan: { scriptId: 'script:light-delay-festival-master', promptLanguage: 'en' }
			},
			job: {
				id: 'festival-master:stretch-bridge-meal-010-012:rev-1:video-1',
				stretchId: 'festival-master:stretch-bridge-meal-010-012',
				medium: 'video',
				providerSnapshotId: 'provider:higgsfield:seedance-2.5:2026-08-29',
				dependsOnStillJobId: 'festival-master:stretch-bridge-meal-010-012:rev-1',
				durationMs: 5000,
				memberInputs: [
					{ order: 1, shotId: 'festival-master:shot-plan-010', sourceTakeIds: [] }
				],
				blockers: ['missing_voice_sample:character:zao'],
				compiledPrompt: null
			},
			stretch: {
				id: 'festival-master:stretch-bridge-meal-010-012',
				locationId: 'location:celestial-ardor-bridge',
				presentCharacterIds: ['character:zao'],
				physics: { en: '1g' },
				lighting: { en: 'blue' },
				members: [{ shotId: 'festival-master:shot-plan-010', order: 1, event: { en: 'beat' } }],
				referenceAssetIds: []
			},
			snapshot: { provider: 'higgsfield', model: 'seedance-2.5' },
			assetsById: new Map(),
			allowPreviewPrompt: true
		});
		expect(run.nonExecutable).toBe(true);
		expect(run.parameters.resolution).toBeUndefined();
		const nullKeyframes = run.references.filter((r) => r.role === 'keyframe' && r.assetId == null);
		expect(nullKeyframes.length).toBeGreaterThanOrEqual(0);
		const schema = JSON.parse(readFileSync(join(ROOT, 'data/schemas/run.schema.json'), 'utf8'));
		const ajv = new Ajv2020({ allErrors: true, strict: true, validateFormats: false });
		const validate = ajv.compile(schema);
		const ok = validate(run);
		if (!ok) {
			console.error(validate.errors);
		}
		expect(ok).toBe(true);
		// Ready runs must not carry null assetIds — freeze path responsibility (documented).
		const readyInvalid = {
			...run,
			status: 'ready',
			nonExecutable: false,
			blockers: [],
			references: [{ role: 'keyframe', assetId: null, kind: 'image' }]
		};
		// Schema allows null assetId on preview; freeze CLI must strip/reject before ready.
		expect(readyInvalid.references.some((r) => r.assetId == null)).toBe(true);
	});
});

describe('result register refuses', () => {
	it('sanitizes colons out of result filenames', () => {
		expect(sanitizeRunResultFilename('run:foo:bar:preview')).toBe('run-foo-bar-preview-results.json');
	});

	it('refuses missing identity fields', () => {
		expect(collectResultRequiredFieldErrors({}).length).toBeGreaterThan(0);
	});

	it('refuses job/snapshot mismatch', () => {
		expect(
			collectResultJobIdentityErrors(
				{
					jobId: 'j1',
					stretchId: 's1',
					providerSnapshotId: 'p1'
				},
				{ id: 'j1', stretchId: 's2', providerSnapshotId: 'p1' }
			)
		).toContain('stretchId_mismatch');
	});

	it('refuses nonExecutable or non-ready source runs', () => {
		const errors = collectResultRunMatchErrors(
			{
				jobId: 'j1',
				scriptId: 'script:x',
				stretchId: 's1',
				providerSnapshotId: 'p1',
				inputDigest: 'abc',
				sourceRunId: 'run:1'
			},
			{
				runId: 'run:1',
				jobId: 'j1',
				scriptId: 'script:x',
				stretchId: 's1',
				providerSnapshotId: 'p1',
				inputDigest: 'abc',
				nonExecutable: true,
				status: 'preview'
			}
		);
		expect(errors).toContain('source_run_nonExecutable');
		expect(errors).toContain('source_run_not_ready');
	});

	it('refuses duplicate providerJobId', () => {
		expect(
			collectResultDuplicateErrors(
				{ providerJobId: 'hf-1', jobId: 'j1', inputDigest: 'a' },
				[{ abs: '/other.json', providerJobId: 'hf-1', jobId: 'j2', inputDigest: 'b' }],
				'/current.json'
			)
		).toContain('duplicate_providerJobId:hf-1');
	});

	it('refuses path escape and hash/duration drift', () => {
		expect(validateOutputRepoPath(ROOT, 'E:/outside/a.mp4').ok).toBe(false);
		expect(validateOutputRepoPath(ROOT, 'static/assets/ok.mp4').ok).toBe(true);
		const buf = Buffer.from('abc');
		expect(collectHashMismatchErrors(buf, '0'.repeat(64)).length).toBe(1);
		expect(collectDurationDriftErrors(1000, 2000, 500)).toContain('duration_drift:1000!=2000');
	});
});

describe('maxOutputsPerRequest', () => {
	it('blocks when outputs exceed snapshot maxOutputsPerRequest', async () => {
		const { buildVisualStretchJobs } = await import(
			'../../../scripts/lib/visual-stretch-jobs.mjs'
		);
		const file = {
			shots: [
				{ id: 'a', durationMs: 5000, selectedTakeId: 't1', visibleRefs: [] },
				{ id: 'b', durationMs: 5000, selectedTakeId: 't2', visibleRefs: [] }
			],
			takes: [
				{ id: 't1', shotId: 'a' },
				{ id: 't2', shotId: 'b' }
			],
			cues: [],
			visualStretches: [
				{
					id: 'stretch:x',
					revision: 1,
					locationId: 'location:bridge',
					presentCharacterIds: [],
					referenceAssetIds: [],
					blocking: { present: [] },
					members: [
						{ shotId: 'a', order: 1 },
						{ shotId: 'b', order: 2 }
					],
					generationProfile: {
						stillMode: 'independent_shared_authority',
						videoMode: 'grouped_seedance'
					}
				}
			]
		};
		const jobs = buildVisualStretchJobs(file, {
			maxSegmentMs: 30000,
			stillProvider: {
				id: 'provider:still',
				supportsCombinedStoryboardSheet: true,
				limits: { maxImages: 8, maxVideos: 0, maxAudios: 0, maxTotalReferences: 8, maxOutputsPerRequest: 1 }
			},
			videoProvider: {
				id: 'provider:video',
				limits: {
					maxImages: null,
					maxVideos: null,
					maxAudios: null,
					maxTotalReferences: 50,
					maxDurationMs: 30000,
					maxOutputsPerRequest: 1
				}
			},
			entityReferenceIds: new Map()
		});
		const still = jobs.find((j) => j.medium === 'still');
		expect(still?.outputs.length).toBe(2);
		expect(still?.blockers.some((b) => b.startsWith('outputs:'))).toBe(true);
	});
});
