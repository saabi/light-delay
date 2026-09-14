/**
 * Canonical registry of all editorial reports (CLI + web server).
 * Browser UI should import metadata from `report-meta.mjs` only.
 */
// @ts-nocheck
import { REPORT_ENTRIES as REPORT_META } from './report-meta.mjs';
import {
	buildCueCoverageReport,
	buildCuePlacementReport,
	buildDialogueI18nReport,
	buildDialoguePerformanceReport,
	buildEntityBindingReport,
	buildImageDebtReport,
	buildRegenBriefsReport,
	buildScenePolishReport,
	buildShotCompletenessReport,
	buildTakeWorkflowReport,
	buildVisualArtReport,
	formatCueCoverageMarkdown,
	formatCuePlacementMarkdown,
	formatDialogueI18nMarkdown,
	formatDialoguePerformanceMarkdown,
	formatEntityBindingMarkdown,
	formatImageDebtMarkdown,
	formatRegenBriefsMarkdown,
	formatScenePolishMarkdown,
	formatShotCompletenessMarkdown,
	formatTakeWorkflowMarkdown,
	formatVisualArtMarkdown
} from './editorial-reports.mjs';
import {
	buildDialogueTimingReport,
	formatDialogueTimingMarkdown
} from './dialogue-timing.mjs';
import {
	buildVisualStretchesReport,
	formatVisualStretchesMarkdown
} from './visual-stretches-report.mjs';

const BUILDERS = {
	'dialogue-timing': {
		build: (script, _ctx, _projectCtx, language) => buildDialogueTimingReport(script, language),
		formatMarkdown: formatDialogueTimingMarkdown
	},
	'visual-art': {
		build: buildVisualArtReport,
		formatMarkdown: formatVisualArtMarkdown
	},
	'image-debt': {
		build: buildImageDebtReport,
		formatMarkdown: formatImageDebtMarkdown
	},
	'shot-completeness': {
		build: buildShotCompletenessReport,
		formatMarkdown: formatShotCompletenessMarkdown
	},
	'cue-placement': {
		build: buildCuePlacementReport,
		formatMarkdown: formatCuePlacementMarkdown
	},
	'dialogue-performance': {
		build: buildDialoguePerformanceReport,
		formatMarkdown: formatDialoguePerformanceMarkdown
	},
	'entity-binding': {
		build: buildEntityBindingReport,
		formatMarkdown: formatEntityBindingMarkdown
	},
	'scene-polish': {
		build: buildScenePolishReport,
		formatMarkdown: formatScenePolishMarkdown
	},
	'cue-coverage': {
		build: buildCueCoverageReport,
		formatMarkdown: formatCueCoverageMarkdown
	},
	'take-workflow': {
		build: buildTakeWorkflowReport,
		formatMarkdown: formatTakeWorkflowMarkdown
	},
	'dialogue-i18n': {
		build: buildDialogueI18nReport,
		formatMarkdown: formatDialogueI18nMarkdown
	},
	'regen-briefs': {
		build: buildRegenBriefsReport,
		formatMarkdown: formatRegenBriefsMarkdown
	},
	'visual-stretches': {
		build: buildVisualStretchesReport,
		formatMarkdown: formatVisualStretchesMarkdown
	}
};

/** @type {Array<{ id: string; titleKey: string; descriptionKey: string; build: Function; formatMarkdown: Function }>} */
export const REPORT_ENTRIES = REPORT_META.map((entry) => {
	const builder = BUILDERS[entry.id];
	if (!builder) throw new Error(`Missing report builder for ${entry.id}`);
	return { ...entry, ...builder };
});

export const REPORT_IDS = REPORT_ENTRIES.map((entry) => entry.id);

/** @type {Map<string, typeof REPORT_ENTRIES[number]>} */
export const REPORT_BY_ID = new Map(REPORT_ENTRIES.map((entry) => [entry.id, entry]));

export function getReportEntry(reportId) {
	const entry = REPORT_BY_ID.get(reportId);
	if (!entry) throw new Error(`Unknown report: ${reportId}`);
	return entry;
}
