import type { CharacterId, FactionId, LocationId, ObjectId, VehicleId } from './ids.ts';

export type LanguageTag = string;

export type EntityKind = 'character' | 'location' | 'object' | 'vehicle' | 'faction';

export interface EntityRef {
	kind: EntityKind;
	id: CharacterId | LocationId | ObjectId | VehicleId | FactionId | string;
	role?: string;
}

export interface Note {
	type: 'story' | 'continuity' | 'performance' | 'camera' | 'sound' | 'vfx' | 'production' | 'todo';
	text: string;
	resolved?: boolean;
}

export interface ValidationResult {
	ok: boolean;
	errors: string[];
}
