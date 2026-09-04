/** Plain-string IDs that stay distinguishable in TypeScript. */

export type ProjectId = string;
export type ScriptId = string;
export type ContinuityId = string;
export type ActId = string;
export type SequenceId = string;
export type SceneId = string;
export type BeatId = string;
export type CueId = string;
export type ShotId = string;
export type TakeId = string;

export type CharacterId = string;
export type LocationId = string;
export type ObjectId = string;
export type VehicleId = string;
export type FactionId = string;
export type AssetId = string;
export type VoiceProfileId = string;
export type DocumentId = string;
export type EntityVariantId = string;
export type NarrativeFunctionId = string;

export type ScriptKind =
	| 'main_short'
	| 'long_version'
	| 'festival_cut'
	| 'trailer'
	| 'teaser'
	| 'proof_of_concept'
	| 'master_narrative'
	| 'alternate';
