import * as m from '$lib/paraglide/messages.js';

const TITLE_BY_KEY: Record<string, () => string> = {
	reports_dialogue_timing_title: m.reports_dialogue_timing_title,
	reports_visual_art_title: m.reports_visual_art_title,
	reports_image_debt_title: m.reports_image_debt_title,
	reports_shot_completeness_title: m.reports_shot_completeness_title,
	reports_cue_placement_title: m.reports_cue_placement_title,
	reports_dialogue_performance_title: m.reports_dialogue_performance_title,
	reports_entity_binding_title: m.reports_entity_binding_title,
	reports_scene_polish_title: m.reports_scene_polish_title,
	reports_cue_coverage_title: m.reports_cue_coverage_title,
	reports_take_workflow_title: m.reports_take_workflow_title,
	reports_dialogue_i18n_title: m.reports_dialogue_i18n_title,
	reports_regen_briefs_title: m.reports_regen_briefs_title
};

const DESC_BY_KEY: Record<string, () => string> = {
	reports_dialogue_timing_desc: m.reports_dialogue_timing_desc,
	reports_visual_art_desc: m.reports_visual_art_desc,
	reports_image_debt_desc: m.reports_image_debt_desc,
	reports_shot_completeness_desc: m.reports_shot_completeness_desc,
	reports_cue_placement_desc: m.reports_cue_placement_desc,
	reports_dialogue_performance_desc: m.reports_dialogue_performance_desc,
	reports_entity_binding_desc: m.reports_entity_binding_desc,
	reports_scene_polish_desc: m.reports_scene_polish_desc,
	reports_cue_coverage_desc: m.reports_cue_coverage_desc,
	reports_take_workflow_desc: m.reports_take_workflow_desc,
	reports_dialogue_i18n_desc: m.reports_dialogue_i18n_desc,
	reports_regen_briefs_desc: m.reports_regen_briefs_desc
};

export function reportTitle(titleKey: string): string {
	return TITLE_BY_KEY[titleKey]?.() ?? titleKey;
}

export function reportDescription(descriptionKey: string): string {
	return DESC_BY_KEY[descriptionKey]?.() ?? descriptionKey;
}
