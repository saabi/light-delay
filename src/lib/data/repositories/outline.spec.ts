import { describe, expect, it } from 'vitest';
import {
	getOutline,
	hasOutline,
	listOutlineCoverage,
	listScripts,
	outlinePathForScript
} from '$lib/data/repositories/index';
import { validateOutline } from '$lib/data/validation/validateOutline';
import type { OutlineFile } from '$lib/types/outline';
import { buildOutlineMissingReport } from '../../../../scripts/lib/outline-missing.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../../..');

describe('outlines (optional)', () => {
	it('returns null when outline JSON is absent', () => {
		for (const entry of listScripts()) {
			expect(getOutline(entry.id)).toBeNull();
			expect(hasOutline(entry.id)).toBe(false);
			expect(outlinePathForScript(entry.id)).toBe(
				`data/outlines/${entry.id.replace(/^script:/, '')}.json`
			);
		}
	});

	it('lists coverage for every registered script', () => {
		const coverage = listOutlineCoverage();
		expect(coverage.length).toBe(listScripts().length);
		expect(coverage.every((row) => !row.present && row.stepCount === 0)).toBe(true);
	});

	it('validateOutline accepts a well-formed file', () => {
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
	it('flags all scripts while outlines are absent', () => {
		const report = buildOutlineMissingReport(ROOT);
		expect(report.summary.scripts).toBe(4);
		expect(report.summary.missing).toBe(4);
		expect(report.missing.map((row) => row.scriptId).sort()).toEqual(
			listScripts()
				.map((s) => s.id)
				.sort()
		);
	});
});
