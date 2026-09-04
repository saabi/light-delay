import type { BeatId, CueId, SceneId, ScriptId, ShotId } from './ids.ts';
import type { Note } from './common.ts';
import type { StoryText } from './i18n.ts';
import type { SourceReference } from './script.ts';

export type OutlineImportance = 'required' | 'optional';
export type OutlineStepStatus = 'planned' | 'covered' | 'missing' | 'deferred';
export type OutlineFileStatus = 'draft' | 'reviewed' | 'locked';
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
	| { type: 'blockquote'; text: StoryText };

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

export interface OutlineMeta {
	id: string;
	scriptId: ScriptId;
	title: StoryText;
	synopsis: StoryText;
	status: OutlineFileStatus;
	version: string;
	source?: OutlineSource;
	editorialNotice?: StoryText;
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
	sourceRefs?: SourceReference[];
	notes?: Note[];
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
	steps: OutlineStep[];
}

export interface OutlineCoverageEntry {
	scriptId: ScriptId;
	label: string;
	present: boolean;
	stepCount: number;
	outlinePath: string;
}
