import { describe, expect, it } from 'vitest';
import {
	buildReport,
	formatReportMarkdown,
	REPORT_IDS,
	summarizeReport
} from '../../../../scripts/lib/report-runner.mjs';
import { createProjectContext } from '../../../../scripts/lib/project-context.mjs';
import { getLocalizedScript } from '$lib/data/repositories/index';

const canonical = 'script:light-delay-main-short';

describe('report-runner', () => {
	it('exposes all 12 report ids', () => {
		expect(REPORT_IDS).toHaveLength(12);
		expect(REPORT_IDS).toContain('dialogue-timing');
		expect(REPORT_IDS).toContain('regen-briefs');
	});

	it('builds dialogue timing for canonical script', () => {
		const script = getLocalizedScript(canonical, 'es');
		const report = buildReport('dialogue-timing', script, 'es', createProjectContext());
		expect(report.summary).toHaveProperty('montageMs');
		expect(report.summary).toHaveProperty('spokenMs');
	});

	it('builds image debt with regen queue', () => {
		const script = getLocalizedScript(canonical, 'es');
		const report = buildReport('image-debt', script, 'es', createProjectContext());
		expect(report.summary.queueCount).toBeGreaterThan(0);
		expect(report.summary.status).toBe('debt');
	});

	it('uses the public translation overlay and marks absent production units not applicable', () => {
		const main = getLocalizedScript(canonical, 'es');
		const long = getLocalizedScript('script:light-delay-long', 'es');
		const projectCtx = createProjectContext();
		expect(buildReport('dialogue-i18n', main, 'es', projectCtx).summary).toMatchObject({
			status: 'complete',
			missingVariantCount: 0
		});
		expect(buildReport('shot-completeness', long, 'es', projectCtx).summary.status).toBe(
			'not_applicable'
		);
		expect(buildReport('dialogue-i18n', long, 'es', projectCtx).summary.status).toBe(
			'not_applicable'
		);
	});

	it('formats markdown for each report id', () => {
		const script = getLocalizedScript('script:light-delay-long', 'es');
		const projectCtx = createProjectContext();
		for (const reportId of REPORT_IDS) {
			const report = buildReport(reportId, script, 'es', projectCtx);
			const md = formatReportMarkdown(reportId, report);
			expect(md).toContain('#');
			expect(summarizeReport(reportId, script, 'es', projectCtx)).toBeTruthy();
		}
	});

	it('visual-art disk audit is optional', () => {
		const script = getLocalizedScript(canonical, 'es');
		const withoutDisk = buildReport('visual-art', script, 'es', createProjectContext());
		const withDisk = buildReport(
			'visual-art',
			script,
			'es',
			createProjectContext({ checkDisk: () => false })
		);
		expect(withoutDisk.summary.missingFileCount).toBe(0);
		expect(withDisk.summary.missingFileCount).toBeGreaterThanOrEqual(0);
	});

	it('throws for unknown report id', () => {
		const script = getLocalizedScript(canonical, 'es');
		expect(() => buildReport('not-a-report', script, 'es')).toThrow(/Unknown report/);
	});
});
