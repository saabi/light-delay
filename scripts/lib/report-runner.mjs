/**
 * Shared report runner for CLI and web routes.
 *
 * Callers must pass a report-ready ScriptFile (localized when needed).
 */
// @ts-nocheck
import { createProjectContext } from './project-context.mjs';
import { getReportEntry, REPORT_ENTRIES, REPORT_IDS } from './report-registry.mjs';
import { createScriptContext } from './script-context.mjs';

export { REPORT_ENTRIES, REPORT_IDS, getReportEntry };

/**
 * @param {string} reportId
 * @param {import('../../src/lib/types/script.ts').ScriptFile} script
 * @param {string} language
 * @param {ReturnType<typeof createProjectContext>} [projectCtx]
 */
export function buildReport(reportId, script, language, projectCtx = createProjectContext()) {
	const entry = getReportEntry(reportId);
	const ctx = createScriptContext(script);
	const report = entry.build(script, ctx, projectCtx, language);
	if (report && typeof report === 'object' && !report.language) {
		report.language = language;
	}
	return report;
}

/**
 * @param {string} reportId
 * @param {unknown} report
 */
export function formatReportMarkdown(reportId, report) {
	return getReportEntry(reportId).formatMarkdown(report);
}

/**
 * @param {string} reportId
 * @param {import('../../src/lib/types/script.ts').ScriptFile} script
 * @param {string} language
 * @param {ReturnType<typeof createProjectContext>} [projectCtx]
 */
export function summarizeReport(reportId, script, language, projectCtx = createProjectContext()) {
	const report = buildReport(reportId, script, language, projectCtx);
	return report.summary?.consoleLine ?? '';
}
