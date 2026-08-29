import { describe, expect, it } from 'vitest';
import {
	buildImageDebtReport,
	buildRegenBriefsReport,
	buildShotCompletenessReport,
	buildVisualArtReport
} from '../../../../scripts/lib/editorial-reports.mjs';
import {
	shotCompletenessFlags,
	takeNeedsRegeneration
} from '../../../../scripts/lib/editorial-readiness-core.mjs';
import { createScriptContext } from '../../../../scripts/lib/script-context.mjs';
import type { ScriptFile } from '$lib/types/script';

const fixture: ScriptFile = {
	schemaVersion: '1.0.0',
	script: {
		id: 'script:readiness-test',
		projectId: 'project:light-delay',
		continuityId: 'continuity:test',
		title: 'Test',
		version: '0',
		status: 'draft',
		kind: 'proof_of_concept',
		actIds: ['test:act-1']
	},
	acts: [{ id: 'test:act-1', number: 1, sceneIds: ['test:scene-01'] }],
	sequences: [],
	scenes: [
		{
			id: 'test:scene-01',
			actId: 'test:act-1',
			number: 1,
			order: 1,
			title: 'Bridge',
			locationId: 'location:celestial-ardor-bridge',
			setting: { interiorExterior: 'INT' },
			summary: 's',
			characterIds: ['character:zao'],
			beatIds: ['test:beat-01'],
			shotIds: ['test:shot-01']
		}
	],
	beats: [
		{
			id: 'test:beat-01',
			sceneId: 'test:scene-01',
			order: 1,
			purpose: 'p',
			summary: 's',
			cueIds: []
		}
	],
	cues: [],
	shots: [
		{
			id: 'test:shot-01',
			sceneId: 'test:scene-01',
			beatIds: ['test:beat-01'],
			number: 1,
			order: 1,
			description: 'Short',
			composition: { size: 'MS' },
			durationMs: 2000,
			cuePlacements: [],
			takeIds: ['test:take-01'],
			selectedTakeId: 'test:take-01'
		}
	],
	takes: [
		{
			id: 'test:take-01',
			shotId: 'test:shot-01',
			number: 1,
			status: 'selected',
			imageAssetId: 'asset:missing',
			imageStatus: {
				status: 'needs_regeneration',
				reasons: ['canon_mismatch'],
				explanation: 'test',
				replacementBrief: 'test brief'
			}
		}
	]
};

const projectCtx = {
	assets: [{ id: 'asset:missing', kind: 'image', path: '/assets/missing.png' }],
	assetById: new Map([['asset:missing', { id: 'asset:missing', kind: 'image', path: '/assets/missing.png' }]]),
	entities: [],
	staticRoot: '/tmp/static',
	supportedLangs: ['es', 'en'],
	sourceLanguage: 'es',
	allScripts: ['script:readiness-test'],
	locationById: new Map([['location:celestial-ardor-bridge', { id: 'location:celestial-ardor-bridge', name: 'Bridge' }]])
};

describe('editorial reports', () => {
	it('flags incomplete shots', () => {
		const flags = shotCompletenessFlags(fixture.shots[0]);
		expect(flags).toContain('missing_purpose');
		expect(flags).toContain('missing_camera');
		expect(flags).toContain('thin_description');
	});

	it('detects take regeneration debt', () => {
		expect(takeNeedsRegeneration(fixture.takes[0])).toBe(true);
	});

	it('builds image debt queue', () => {
		const ctx = createScriptContext(fixture);
		const report = buildImageDebtReport(fixture, ctx, projectCtx);
		expect(report.summary.queueCount).toBe(1);
		expect(report.queue[0].reasons).toContain('canon_mismatch');
	});

	it('builds regen briefs from queue', () => {
		const ctx = createScriptContext(fixture);
		const report = buildRegenBriefsReport(fixture, ctx, projectCtx);
		expect(report.briefs).toHaveLength(1);
		expect(report.briefs[0].replacementBrief).toBe('test brief');
	});

	it('builds shot completeness report', () => {
		const ctx = createScriptContext(fixture);
		const report = buildShotCompletenessReport(fixture, ctx);
		expect(report.summary.flaggedShotCount).toBe(1);
	});

	it('builds visual art report structure', () => {
		const ctx = createScriptContext(fixture);
		const report = buildVisualArtReport(fixture, ctx, projectCtx);
		expect(report.summary).toHaveProperty('missingFileCount');
	});
});
