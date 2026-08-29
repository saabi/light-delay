import type { ContinuityId, ProjectId, ScriptId, ScriptKind } from './ids.ts';
import type { ProjectLanguages, StoryText } from './i18n.ts';

export interface ScriptLineage {
	sourceScriptId: ScriptId;
	relationship: 'cut' | 'trailer' | 'teaser' | 'adaptation' | 'rewrite' | 'alternate_continuity';
	sourceVersion?: string;
	notes?: StoryText;
}

export interface Continuity {
	id: ContinuityId;
	name: string;
	description?: string;
	derivedFromContinuityId?: ContinuityId;
}

export interface ScriptRegistryEntry {
	id: ScriptId;
	continuityId: ContinuityId;
	label: StoryText;
	kind: ScriptKind;
	status: 'draft' | 'review' | 'locked' | 'deprecated';
	targetDurationMs?: number;
	lineage?: ScriptLineage;
}

export interface ProjectFile {
	schemaVersion: string;
	project: {
		id: ProjectId;
		title: string;
		alternateTitles?: string[];
		description?: string;
		languages: ProjectLanguages;
		canonicalScriptId: ScriptId;
		scripts: ScriptRegistryEntry[];
		continuities: Continuity[];
		targetDurationMs?: number;
		createdAt?: string;
		updatedAt?: string;
	};
}
