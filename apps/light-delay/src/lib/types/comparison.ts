import type { CharacterId, SceneId } from './ids.ts';
import type { StoryText } from './i18n.ts';

export type CanonClaimStatus = 'established' | 'proposed' | 'unresolved' | 'not_applicable';
export type EventCoverageStatus = 'present' | 'reworked' | 'omitted' | 'planned' | 'unresolved';
export type PairwiseComparison = 'same' | 'different' | 'unspecified';

export interface CanonClaim {
	dimensionId: string;
	valueId?: string;
	statement: StoryText;
	status: CanonClaimStatus;
}

export interface EventCoverage {
	eventId: string;
	status: EventCoverageStatus;
	sceneIds?: SceneId[];
	note?: StoryText;
}

export interface ComparisonProfile {
	version: string;
	canonClaims: CanonClaim[];
	eventCoverage: EventCoverage[];
}

export interface CanonDimensionDefinition {
	id: string;
	category: string;
	label: StoryText;
	description?: StoryText;
	foundational?: boolean;
}

export interface MajorEventDefinition {
	id: string;
	category: string;
	label: StoryText;
	description?: StoryText;
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
