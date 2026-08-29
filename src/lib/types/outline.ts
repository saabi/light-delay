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

export interface OutlineMeta {
	id: string;
	scriptId: ScriptId;
	title: StoryText;
	synopsis: StoryText;
	status: OutlineFileStatus;
	version: string;
}

export interface OutlineStep {
	id: string;
	level: OutlineStepLevel;
	parentStepId?: string;
	order: number;
	title: StoryText;
	summary: StoryText;
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
	steps: OutlineStep[];
}

export interface OutlineCoverageEntry {
	scriptId: ScriptId;
	label: string;
	present: boolean;
	stepCount: number;
	outlinePath: string;
}
