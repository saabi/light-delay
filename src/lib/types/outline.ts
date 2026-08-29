import type { BeatId, SceneId, ScriptId } from './ids.ts';
import type { Note } from './common.ts';
import type { StoryText } from './i18n.ts';
import type { SourceReference } from './script.ts';

export type OutlineImportance = 'required' | 'optional';
export type OutlineStepStatus = 'planned' | 'covered' | 'missing' | 'deferred';
export type OutlineFileStatus = 'draft' | 'reviewed' | 'locked';

export interface OutlineMeta {
	id: string;
	scriptId: ScriptId;
	title: StoryText;
	status: OutlineFileStatus;
	version: string;
}

export interface OutlineStep {
	id: string;
	order: number;
	title: StoryText;
	summary: StoryText;
	importance: OutlineImportance;
	status: OutlineStepStatus;
	/** Optional link to comparison-taxonomy majorEvents */
	majorEventId?: string;
	sceneIds?: SceneId[];
	beatIds?: BeatId[];
	/** Other steps in this outline that this step causally depends on */
	dependsOnStepIds?: string[];
	sourceRefs?: SourceReference[];
	notes?: Note[];
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
