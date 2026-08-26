import type { CharacterId, SceneId } from './ids.ts';

export type CanonClaimStatus = 'established' | 'proposed' | 'unresolved' | 'not_applicable';
export type EventCoverageStatus = 'present' | 'reworked' | 'omitted' | 'planned' | 'unresolved';
export type PairwiseComparison = 'same' | 'different' | 'unspecified';

export interface CanonClaim {
	dimensionId: string;
	valueId?: string;
	statement: string;
	status: CanonClaimStatus;
}

export interface EventCoverage {
	eventId: string;
	status: EventCoverageStatus;
	sceneIds?: SceneId[];
	note?: string;
}

export interface ComparisonProfile {
	version: string;
	canonClaims: CanonClaim[];
	eventCoverage: EventCoverage[];
}

export interface CanonDimensionDefinition {
	id: string;
	category: string;
	label: string;
	description?: string;
	foundational?: boolean;
}

export interface MajorEventDefinition {
	id: string;
	category: string;
	label: string;
	description?: string;
}

export interface ComparisonTaxonomyFile {
	schemaVersion: string;
	profileVersion: string;
	canonDimensions: CanonDimensionDefinition[];
	majorEvents: MajorEventDefinition[];
}

export interface CharacterParticipation {
	characterId: CharacterId;
	declared: boolean;
	used: boolean;
	functionAssigned: boolean;
}
