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
	if (report?.summary) {
		const applicability = assessReport(reportId, script, report.summary);
		report.summary = { status: applicability, ...report.summary };
	}
	return report;
}

function assessReport(reportId, script, summary) {
	const requiresShots = new Set([
		'dialogue-timing',
		'image-debt',
		'shot-completeness',
		'cue-placement',
		'cue-coverage',
		'take-workflow',
		'regen-briefs',
		'entity-binding'
	]);
	if (requiresShots.has(reportId) && !(script.shots?.length > 0)) return 'not_applicable';
	if (['dialogue-performance', 'dialogue-i18n'].includes(reportId) && !(summary.dialogueCount > 0))
		return 'not_applicable';
	const debt = {
		'visual-art':
			(summary.missingFileCount ?? 0) +
			(summary.unknownRefCount ?? 0) +
			(summary.shotsWithoutMediaCount ?? 0) +
			(summary.entitiesWithoutRasterCount ?? 0),
		'image-debt': summary.queueCount,
		'shot-completeness': summary.flaggedShotCount,
		'cue-placement':
			(summary.missingDuration ?? 0) +
			(summary.unplacedActionCues ?? 0),
		'dialogue-performance':
			(summary.missingPerformance ?? 0) +
			(summary.partialPerformance ?? 0) +
			(summary.missingVariantFields ?? 0) +
			(summary.missingAddressee ?? 0),
		'entity-binding': (summary.shotsMissingBinding ?? 0) + (summary.actionWithoutRefs ?? 0),
		'scene-polish':
			(summary.missingDramaticPurpose ?? 0) +
			(summary.missingTimeOfDay ?? 0) +
			(summary.missingContinuity ?? 0) +
			(summary.placeholderBeats ?? 0),
		'cue-coverage': (summary.unplacedCueCount ?? 0) + (summary.uncoveredDialogueCount ?? 0),
		'take-workflow':
			(summary.missingGeneration ?? 0) + (summary.missingReview ?? 0) + (summary.missingVideo ?? 0),
		'dialogue-i18n': summary.missingVariantCount,
		'regen-briefs': summary.briefCount,
		'dialogue-timing':
			(summary.multiSpeakerShotCount ?? 0) +
			(summary.offCameraShotCount ?? 0) +
			(summary.spokenSurplusShotCount ?? 0)
	}[reportId];
	return (debt ?? 0) > 0 ? 'debt' : 'complete';
}

/**
 * @param {string} reportId
 * @param {unknown} report
 */
export function formatReportMarkdown(reportId, report) {
	const markdown = getReportEntry(reportId).formatMarkdown(report);
	const status = report?.summary?.status;
	if (!status) return markdown;
	const lines = markdown.split('\n');
	const languageLine = lines.findIndex((line) => line.startsWith('Idioma:'));
	if (languageLine >= 0) lines.splice(languageLine + 1, 0, `Estado: **${status}**`);
	return lines.join('\n');
}

/**
 * @param {string} reportId
 * @param {import('../../src/lib/types/script.ts').ScriptFile} script
 * @param {string} language
 * @param {ReturnType<typeof createProjectContext>} [projectCtx]
 */
export function summarizeReport(reportId, script, language, projectCtx = createProjectContext()) {
	const report = buildReport(reportId, script, language, projectCtx);
	const line = report.summary?.consoleLine ?? '';
	return report.summary?.status ? `[${report.summary.status}] ${line}` : line;
}
