import type { CharacterId, FactionId, LocationId, ObjectId, VehicleId } from './ids.ts';
import type { StoryText } from './i18n.ts';

export type LanguageTag = string;

export type EntityKind = 'character' | 'location' | 'object' | 'vehicle' | 'faction';

export interface EntityRef {
	kind: EntityKind;
	id: CharacterId | LocationId | ObjectId | VehicleId | FactionId | string;
	role?: string;
}

export interface Note {
	id?: string;
	type:
		| 'story'
		| 'continuity'
		| 'performance'
		| 'camera'
		| 'sound'
		| 'vfx'
		| 'production'
		| 'editorial'
		| 'technical'
		| 'visual'
		| 'todo';
	text: StoryText;
	status?: 'open' | 'in_progress' | 'resolved' | 'wont_fix';
	priority?: 'critical' | 'high' | 'medium' | 'low';
	suggestedAction?: StoryText;
	acceptanceCriteria?: StoryText;
	targetPaths?: string[];
	author?: string;
	createdAt?: string;
	updatedAt?: string;
	/** @deprecated Use status; retained while existing notes migrate gradually. */
	resolved?: boolean;
}

export interface ValidationResult {
	ok: boolean;
	errors: string[];
}
