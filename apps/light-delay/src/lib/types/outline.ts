import type { BeatId, CharacterId, CueId, SceneId, ScriptId, ShotId } from './ids.ts';
import type { Note } from './common.ts';
import type { StoryText } from './i18n.ts';
import type { SourceReference } from './script.ts';

export type OutlineImportance = 'required' | 'optional';
export type OutlineStepStatus = 'planned' | 'covered' | 'missing' | 'deferred';
export type OutlineFileStatus = 'draft' | 'reviewed' | 'locked' | 'deprecated';
export type OutlineStepLevel = 'story' | 'detail';
export type OutlineCausalRelation =
	'enables' | 'motivates' | 'reveals' | 'forces' | 'prevents' | 'pays_off';
export type OutlineCoverageStatus =
	'not_started' | 'partial' | 'covered' | 'deferred' | 'not_applicable';

export type OutlineFramingPlacement = 'before_story' | 'after_story';
export type OutlineFramingKind =
	| 'purpose'
	| 'terminology'
	| 'premise'
	| 'setting'
	| 'physics'
	| 'gravity'
	| 'cast'
	| 'motivation'
	| 'stakes'
	| 'throughlines'
	| 'production_choices'
	| 'other';

export type OutlineProseBlock =
	| { type: 'paragraph'; text: StoryText }
	| { type: 'heading'; level: 3 | 4; text: StoryText }
	| { type: 'list'; ordered?: boolean; items: StoryText[] }
	| { type: 'blockquote'; text: StoryText; speakerId?: CharacterId };

export interface OutlineFramingSection {
	id: string;
	placement: OutlineFramingPlacement;
	order: number;
	kind: OutlineFramingKind;
	title: StoryText;
	blocks: OutlineProseBlock[];
}

export interface OutlineStorySection {
	id: string;
	order: number;
	title: StoryText;
}

export interface OutlineSource {
	path: string;
	revision: string;
	language: string;
	sha256?: string;
}

export interface OutlineExport {
	path: string;
	language: string;
	format: 'markdown';
}

export interface OutlineMeta {
	id: string;
	scriptId: ScriptId;
	title: StoryText;
	synopsis: StoryText;
	status: OutlineFileStatus;
	version: string;
	/** Current editorial revision; independent from historical import provenance. */
	revision?: number;
	localization?: {
		sourceLanguage: 'en';
		translations: Record<
			string,
			{ status: 'current' | 'needs_revision' | 'not_started'; lastSyncedRevision?: number }
		>;
	};
	source?: OutlineSource;
	provenance?: { importedFrom?: OutlineSource[] };
	exports?: OutlineExport[];
	editorialNotice?: StoryText;
	derivation?: {
		sourceOutlineId: string;
		sourceRevision: number;
		sourceVersion?: string;
		relationship: 'adaptation';
		/**
		 * `complete_causal_chain`: every master story step is covered via step `sourceRefs`
		 * (enforced by `validate-data.mjs`). `deliberate_omission`: a cut that intentionally
		 * withholds later master facts (e.g. the trailer) — not held to that full-coverage
		 * check; see `scripts/lib/trailer-master-omitted-facts.mjs`.
		 */
		fidelity: 'complete_causal_chain' | 'deliberate_omission';
		reviewStatus: 'current' | 'stale' | 'review_required';
	};
}

export interface OutlineStep {
	id: string;
	level: OutlineStepLevel;
	parentStepId?: string;
	sectionId?: string;
	order: number;
	title: StoryText;
	/** Compact narrative description. Mutually exclusive with body. */
	summary?: StoryText;
	/** Structured full narrative prose. Story steps only; mutually exclusive with summary. */
	body?: OutlineProseBlock[];
	importance: OutlineImportance;
	causalLinks?: OutlineCausalLink[];
	coverage?: OutlineStepCoverage;
	/** @deprecated Use coverage; accepted while historical outlines migrate. */
	status?: OutlineStepStatus;
	/** Optional link to comparison-taxonomy majorEvents */
	majorEventId?: string;
	sceneIds?: SceneId[];
	beatIds?: BeatId[];
	cueIds?: CueId[];
	shotIds?: ShotId[];
	/** @deprecated Use causalLinks with a human-readable explanation. */
	dependsOnStepIds?: string[];
	requiresFactIds?: string[];
	revealsFactIds?: string[];
	sourceRefs?: SourceReference[];
	notes?: Note[];
}

export interface OutlineFact {
	id: string;
	description: StoryText;
	dependsOnFactIds?: string[];
	introducedInStepId?: string;
	audienceVisibility?: 'overt' | 'withheld' | 'implied';
	status: 'active' | 'retired';
	legacyIds?: string[];
}

export interface OutlineKnowledgeEvent {
	stepId: string;
	factId: string;
	characterIds: CharacterId[];
}

export interface OutlineActionRequirement {
	stepId: string;
	actorId: CharacterId;
	action: StoryText;
	requiresKnownFactIds: string[];
}

export interface OutlineCausalLink {
	sourceStepId: string;
	relation: OutlineCausalRelation;
	explanation: StoryText;
}

export interface OutlineCoverageEvidence {
	status: OutlineCoverageStatus;
	sourceRefs?: SourceReference[];
	sceneIds?: SceneId[];
	beatIds?: BeatId[];
	cueIds?: CueId[];
	shotIds?: ShotId[];
}

export interface OutlineStepCoverage {
	treatment?: OutlineCoverageEvidence;
	script?: OutlineCoverageEvidence;
	animatic?: OutlineCoverageEvidence;
}

export interface OutlineFile {
	schemaVersion: string;
	outline: OutlineMeta;
	framing?: OutlineFramingSection[];
	storySections?: OutlineStorySection[];
	facts?: OutlineFact[];
	knowledgeEvents?: OutlineKnowledgeEvent[];
	actionRequirements?: OutlineActionRequirement[];
	steps: OutlineStep[];
}

export interface OutlineCoverageEntry {
	scriptId: ScriptId;
	label: string;
	present: boolean;
	stepCount: number;
	outlinePath: string;
}
