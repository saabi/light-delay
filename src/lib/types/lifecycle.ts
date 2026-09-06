import type { StoryText } from './i18n.ts';

export type LifecycleStatus = 'active' | 'deprecated' | 'obsolete' | 'review_required';
export type MasterRelevance =
	| 'authoritative'
	| 'required'
	| 'compatible'
	| 'unrelated'
	| 'uncertain'
	| 'platform';
export type LifecycleDisposition = 'retain' | 'retain_for_salvage' | 'delete_after_gates';
export type LifecycleRefKind =
	| 'project'
	| 'continuity'
	| 'script'
	| 'outline'
	| 'animatic'
	| 'entity'
	| 'asset'
	| 'voice_profile'
	| 'entity_variant'
	| 'narrative_function'
	| 'comparison_item'
	| 'production_plan'
	| 'production_context'
	| 'continuity_ledger'
	| 'document'
	| 'archive'
	| 'static_file';

export interface LifecycleRef {
	kind: LifecycleRefKind;
	id: string;
}

export interface LifecycleGroup {
	id: string;
	status: LifecycleStatus;
	relevance: MasterRelevance;
	disposition: LifecycleDisposition;
	reason: StoryText;
	replacementRef?: LifecycleRef;
	refs: LifecycleRef[];
}

export interface EditorialLifecycleFile {
	schemaVersion: string;
	authority: {
		outlineId: string;
		scriptId: string;
		continuityId: string;
		status: 'wip_authoritative';
	};
	deletionGates: Array<{
		id:
			| 'master_outline_complete'
			| 'salvage_review_complete'
			| 'replacement_derivatives_approved'
			| 'no_active_dependants';
		status: 'open' | 'complete';
	}>;
	defaults: {
		unclassifiedStatus: 'review_required';
		unclassifiedRelevance: 'uncertain';
		unclassifiedDisposition: 'retain';
	};
	groups: LifecycleGroup[];
}
