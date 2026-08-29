/**
 * Canonical registry of all editorial reports (CLI + web).
 */
// @ts-nocheck
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

/** @type {Array<{ id: string; titleKey: string; descriptionKey: string; build: Function; formatMarkdown: Function }>} */
export const REPORT_ENTRIES = [
	{
		id: 'dialogue-timing',
		titleKey: 'reports_dialogue_timing_title',
		descriptionKey: 'reports_dialogue_timing_desc',
		build: (script, _ctx, _projectCtx, language) => buildDialogueTimingReport(script, language),
		formatMarkdown: formatDialogueTimingMarkdown
	},
	{
		id: 'visual-art',
		titleKey: 'reports_visual_art_title',
		descriptionKey: 'reports_visual_art_desc',
		build: buildVisualArtReport,
		formatMarkdown: formatVisualArtMarkdown
	},
	{
		id: 'image-debt',
		titleKey: 'reports_image_debt_title',
		descriptionKey: 'reports_image_debt_desc',
		build: buildImageDebtReport,
		formatMarkdown: formatImageDebtMarkdown
	},
	{
		id: 'shot-completeness',
		titleKey: 'reports_shot_completeness_title',
		descriptionKey: 'reports_shot_completeness_desc',
		build: buildShotCompletenessReport,
		formatMarkdown: formatShotCompletenessMarkdown
	},
	{
		id: 'cue-placement',
		titleKey: 'reports_cue_placement_title',
		descriptionKey: 'reports_cue_placement_desc',
		build: buildCuePlacementReport,
		formatMarkdown: formatCuePlacementMarkdown
	},
	{
		id: 'dialogue-performance',
		titleKey: 'reports_dialogue_performance_title',
		descriptionKey: 'reports_dialogue_performance_desc',
		build: buildDialoguePerformanceReport,
		formatMarkdown: formatDialoguePerformanceMarkdown
	},
	{
		id: 'entity-binding',
		titleKey: 'reports_entity_binding_title',
		descriptionKey: 'reports_entity_binding_desc',
		build: buildEntityBindingReport,
		formatMarkdown: formatEntityBindingMarkdown
	},
	{
		id: 'scene-polish',
		titleKey: 'reports_scene_polish_title',
		descriptionKey: 'reports_scene_polish_desc',
		build: buildScenePolishReport,
		formatMarkdown: formatScenePolishMarkdown
	},
	{
		id: 'cue-coverage',
		titleKey: 'reports_cue_coverage_title',
		descriptionKey: 'reports_cue_coverage_desc',
		build: buildCueCoverageReport,
		formatMarkdown: formatCueCoverageMarkdown
	},
	{
		id: 'take-workflow',
		titleKey: 'reports_take_workflow_title',
		descriptionKey: 'reports_take_workflow_desc',
		build: buildTakeWorkflowReport,
		formatMarkdown: formatTakeWorkflowMarkdown
	},
	{
		id: 'dialogue-i18n',
		titleKey: 'reports_dialogue_i18n_title',
		descriptionKey: 'reports_dialogue_i18n_desc',
		build: buildDialogueI18nReport,
		formatMarkdown: formatDialogueI18nMarkdown
	},
	{
		id: 'regen-briefs',
		titleKey: 'reports_regen_briefs_title',
		descriptionKey: 'reports_regen_briefs_desc',
		build: buildRegenBriefsReport,
		formatMarkdown: formatRegenBriefsMarkdown
	}
];

export const REPORT_IDS = REPORT_ENTRIES.map((entry) => entry.id);

/** @type {Map<string, typeof REPORT_ENTRIES[number]>} */
export const REPORT_BY_ID = new Map(REPORT_ENTRIES.map((entry) => [entry.id, entry]));

export function getReportEntry(reportId) {
	const entry = REPORT_BY_ID.get(reportId);
	if (!entry) throw new Error(`Unknown report: ${reportId}`);
	return entry;
}
