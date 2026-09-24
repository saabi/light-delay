import type {
	GenerationOutputBadge,
	GenerationPackage,
	GenerationPackageSource,
	GenerationRefCategory
} from '$lib/data/selectors/generationPackages';
import { packageRefReadiness } from '$lib/data/selectors/generationPackages';
import type { AssetPresenceStatus } from '$lib/data/repositories/generationPlans';
import * as m from '$lib/paraglide/messages.js';

export function generationSourceLabel(source: GenerationPackageSource): string {
	switch (source) {
		case 'stretch_still':
			return m.generation_source_stretch_still();
		case 'shot_still':
			return m.generation_source_shot_still();
		case 'stretch_video':
			return m.generation_source_stretch_video();
		case 'shot_segment':
			return m.generation_source_shot_segment();
		case 'dialogue_cue':
			return m.generation_source_dialogue_cue();
	}
}

export function generationBlockerLabel(code: string): string {
	switch (code) {
		case 'editorial_prompt_freeze_not_approved':
			return m.generation_blocker_editorial_prompt_freeze_not_approved();
		case 'missing_voice_sample':
			return m.generation_blocker_missing_voice_sample();
		case 'missing_dialogue_text':
			return m.generation_blocker_missing_dialogue_text();
		default:
			return m.generation_blocker_generic({ code });
	}
}

export function generationPromptBadgeLabel(pkg: GenerationPackage): string {
	if (pkg.source === 'dialogue_cue') {
		return pkg.promptReady ? m.generation_text_ready() : m.generation_text_not_ready();
	}
	return pkg.promptReady ? m.generation_prompt_ready() : m.generation_prompt_not_ready();
}

export function generationRefsBadgeLabel(pkg: GenerationPackage): string {
	const { refsPresent, refsReady } = packageRefReadiness(pkg);
	if (refsReady) return m.generation_refs_ready();
	if (refsPresent) return m.generation_refs_present();
	return m.generation_refs_incomplete();
}

export function generationRefsBadgeTone(pkg: GenerationPackage): 'ok' | 'warn' | 'bad' {
	const { refsPresent, refsReady } = packageRefReadiness(pkg);
	if (refsReady) return 'ok';
	if (refsPresent) return 'warn';
	return 'bad';
}

export function generationAssetStatusLabel(status: AssetPresenceStatus): string {
	switch (status) {
		case 'current':
			return m.generation_status_current();
		case 'needs_review':
			return m.generation_status_needs_review();
		case 'needs_regeneration':
			return m.generation_status_needs_regeneration();
		case 'needs_replacement':
			return m.generation_status_needs_replacement();
		case 'invalid_kind':
			return m.generation_status_invalid_kind();
		case 'missing_file':
			return m.generation_status_missing_file();
		case 'invalid_path':
			return m.generation_status_invalid_path();
		case 'missing_catalog_entry':
			return m.generation_status_missing_catalog_entry();
	}
}

export function generationOutputBadgeLabel(status: GenerationOutputBadge): string {
	switch (status) {
		case 'none':
			return m.generation_no_output();
		case 'current':
			return m.generation_has_output();
		case 'needs_review':
			return m.generation_output_review_pending();
		case 'needs_regeneration':
			return m.generation_output_regeneration_required();
		case 'missing_file':
			return m.generation_output_missing_file();
	}
}

export function generationRefCategoryLabel(category: GenerationRefCategory): string {
	switch (category) {
		case 'keyframe':
			return m.generation_refs_keyframes();
		case 'visual':
			return m.generation_refs_visual();
		case 'voice_sample':
			return m.generation_refs_voice();
		case 'other':
			return m.generation_refs_other();
	}
}

export function packageDomId(packageId: string): string {
	return `generation-package-${packageId.replace(/[^a-zA-Z0-9_-]+/g, '-')}`;
}
