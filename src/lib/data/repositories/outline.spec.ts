import { describe, expect, it } from 'vitest';
import {
	getLocalizedOutline,
	getOutline,
	hasOutline,
	listOutlineCoverage,
	listScripts,
	outlinePathForScript
} from '$lib/data/repositories/index';
import { validateOutline } from '$lib/data/validation/validateOutline';
import type { OutlineFile } from '$lib/types/outline';
import { localizeOutline } from '$lib/data/selectors/publicTranslations';
import { buildOutlineMissingReport } from '../../../../scripts/lib/outline-missing.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
const festivalId = 'script:light-delay-festival';

describe('outlines (optional)', () => {
	it('returns festival outline when present and null for others without files', () => {
		expect(hasOutline(festivalId)).toBe(true);
		expect(getOutline(festivalId)?.steps.length).toBeGreaterThan(0);
		for (const entry of listScripts()) {
			expect(outlinePathForScript(entry.id)).toBe(
				`data/outlines/${entry.id.replace(/^script:/, '')}.json`
			);
			if (entry.id === festivalId) continue;
			expect(getOutline(entry.id)).toBeNull();
			expect(hasOutline(entry.id)).toBe(false);
		}
	});

	it('lists coverage for every registered script', () => {
		const coverage = listOutlineCoverage();
		expect(coverage.length).toBe(listScripts().length);
		const festival = coverage.find((row) => row.scriptId === festivalId);
		expect(festival?.present).toBe(true);
		expect(festival?.stepCount).toBeGreaterThan(0);
		expect(coverage.filter((row) => !row.present)).toHaveLength(3);
	});

	it('localizes festival outline titles via public.en overlay', () => {
		const source = getOutline(festivalId)!;
		const localized = localizeOutline(source, 'en');
		expect(getLocalizedOutline(festivalId, 'es')).toBe(source);
		expect(localized.outline.title).toBe('Outline — Light Delay: Festival Cut');
		expect(localized.steps[0]?.title).not.toBe(source.steps[0]?.title);
	});

	it('validateOutline accepts dependsOnStepIds within the file', () => {
		const file: OutlineFile = {
			schemaVersion: '1.0.0',
			outline: {
				id: 'outline:light-delay-main-short',
				scriptId: 'script:light-delay-main-short',
				title: 'Test',
				status: 'draft',
				version: '0.0.1'
			},
			steps: [
				{
					id: 'main:outline-01',
					order: 1,
					title: 'Arrival',
					summary: 'Crew arrives',
					importance: 'required',
					status: 'planned'
				},
				{
					id: 'main:outline-02',
					order: 2,
					title: 'Payoff',
					summary: 'Depends on arrival',
					importance: 'required',
					status: 'planned',
					dependsOnStepIds: ['main:outline-01']
				}
			]
		};
		const result = validateOutline(file, {
			registeredScriptIds: new Set(listScripts().map((s) => s.id))
		});
		expect(result.ok).toBe(true);
	});
});

describe('report:outline-missing', () => {
	it('flags scripts that still lack outline files', () => {
		const report = buildOutlineMissingReport(ROOT);
		expect(report.summary.scripts).toBe(4);
		expect(report.summary.missing).toBe(3);
		expect(report.missing.map((row) => row.scriptId).sort()).toEqual(
			listScripts()
				.map((s) => s.id)
				.filter((id) => id !== festivalId)
				.sort()
		);
	});
});
