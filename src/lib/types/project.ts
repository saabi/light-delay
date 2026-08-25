import type { ProjectId } from './ids.ts';
import type { ProjectLanguages } from './i18n.ts';

export interface ProjectFile {
	schemaVersion: string;
	project: {
		id: ProjectId;
		title: string;
		alternateTitles?: string[];
		description?: string;
		languages: ProjectLanguages;
		canonicalScriptId: string;
		targetDurationMs?: number;
		createdAt?: string;
		updatedAt?: string;
	};
}
