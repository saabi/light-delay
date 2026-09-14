/**
 * Report metadata only — safe for browser imports (no Node builders / crypto).
 */
// @ts-nocheck

/** @type {Array<{ id: string; titleKey: string; descriptionKey: string }>} */
export const REPORT_ENTRIES = [
	{
		id: 'dialogue-timing',
		titleKey: 'reports_dialogue_timing_title',
		descriptionKey: 'reports_dialogue_timing_desc'
	},
	{
		id: 'visual-art',
		titleKey: 'reports_visual_art_title',
		descriptionKey: 'reports_visual_art_desc'
	},
	{
		id: 'image-debt',
		titleKey: 'reports_image_debt_title',
		descriptionKey: 'reports_image_debt_desc'
	},
	{
		id: 'shot-completeness',
		titleKey: 'reports_shot_completeness_title',
		descriptionKey: 'reports_shot_completeness_desc'
	},
	{
		id: 'cue-placement',
		titleKey: 'reports_cue_placement_title',
		descriptionKey: 'reports_cue_placement_desc'
	},
	{
		id: 'dialogue-performance',
		titleKey: 'reports_dialogue_performance_title',
		descriptionKey: 'reports_dialogue_performance_desc'
	},
	{
		id: 'entity-binding',
		titleKey: 'reports_entity_binding_title',
		descriptionKey: 'reports_entity_binding_desc'
	},
	{
		id: 'scene-polish',
		titleKey: 'reports_scene_polish_title',
		descriptionKey: 'reports_scene_polish_desc'
	},
	{
		id: 'cue-coverage',
		titleKey: 'reports_cue_coverage_title',
		descriptionKey: 'reports_cue_coverage_desc'
	},
	{
		id: 'take-workflow',
		titleKey: 'reports_take_workflow_title',
		descriptionKey: 'reports_take_workflow_desc'
	},
	{
		id: 'dialogue-i18n',
		titleKey: 'reports_dialogue_i18n_title',
		descriptionKey: 'reports_dialogue_i18n_desc'
	},
	{
		id: 'regen-briefs',
		titleKey: 'reports_regen_briefs_title',
		descriptionKey: 'reports_regen_briefs_desc'
	},
	{
		id: 'visual-stretches',
		titleKey: 'reports_visual_stretches_title',
		descriptionKey: 'reports_visual_stretches_desc'
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
