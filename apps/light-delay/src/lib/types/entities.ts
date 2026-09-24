import type {
	AssetId,
	CharacterId,
	FactionId,
	LocationId,
	ObjectId,
	VehicleId,
	VoiceProfileId
} from './ids.ts';
import type { LanguageTag } from './common.ts';
import type { Note } from './common.ts';
import type { StoryText } from './i18n.ts';

export interface CharactersFile {
	schemaVersion: string;
	characters: Character[];
}

export interface Character {
	id: CharacterId;
	name: StoryText;
	shortName?: string;
	role: StoryText;
	description: StoryText;
	traits?: StoryText[];
	appearance?: StoryText;
	costume?: StoryText;
	factionIds?: FactionId[];
	referenceAssetIds: AssetId[];
	defaultVoiceProfileId?: VoiceProfileId;
	voiceProfileId?: VoiceProfileId;
	aliases?: string[];
	notes?: Note[];
}

export interface VoiceProfilesFile {
	schemaVersion: string;
	voiceProfiles: VoiceProfile[];
}

export interface VoiceProfileVariant {
	language: LanguageTag;
	/** BCP 47 locale for the acquired language variety (for example es-AR or en-NG). */
	locale?: string;
	languageFormation?: {
		place: StoryText;
		variety: StoryText;
	};
	/** Acoustic rhythm and intonation carried into this language; never an orthographic style. */
	prosody?: StoryText;
	/** Lexicon, syntax, register and forms of address used when authoring dialogue. */
	dialogueStyle?: StoryText;
	provider?: string;
	model?: string;
	providerVoiceId?: string;
	sampleAssetIds?: AssetId[];
	/** Canonical written form to language-specific speakable form for TTS. */
	pronunciationMap?: Record<string, string>;
	pronunciationDictionaryAssetId?: AssetId;
	settings?: Record<string, string | number | boolean>;
}

export interface VoiceProfile {
	id: VoiceProfileId;
	characterId?: CharacterId;
	name: string;
	description?: StoryText;
	variants: VoiceProfileVariant[];
}

export type LocationSpatialKind =
	| 'universe'
	| 'region'
	| 'exterior'
	| 'facility'
	| 'vessel'
	| 'room'
	| 'sublocation'
	| 'axial_spine';

export type LocationParentRelation =
	| 'region_of'
	| 'in_space_of'
	| 'stationed_in'
	| 'contained_in'
	| 'aboard'
	| 'sublocation_of'
	| 'opens_from'
	| 'recessed_in';

export interface LocationPortal {
	id: string;
	kind: string;
	towardLocationId?: LocationId;
	maxRange?: number;
	bidirectional?: boolean;
	notes?: string;
}

export interface LocationSpineConnect {
	deckLocationId: LocationId;
	relation: string;
	levelId?: string;
	notes?: string;
}

export interface LocationNavNode {
	id: string;
	hostLocationId: LocationId;
	name: StoryText;
	navOnly?: true;
	notes?: string;
}

export interface LocationProximityEdge {
	a: LocationId;
	b: LocationId;
	distance: number;
	notes?: string;
}

export interface LocationNavEdge {
	id: string;
	from: LocationId | string;
	to: LocationId | string;
	via?: string;
	requires?: unknown[];
	cost?: number;
	tags?: string[];
}

export interface LocationsFile {
	schemaVersion: string;
	distanceUnit?: string;
	locations: Location[];
	navNodes?: LocationNavNode[];
	proximityEdges?: LocationProximityEdge[];
	navEdges?: LocationNavEdge[];
}

export interface Location {
	id: LocationId;
	name: StoryText;
	description: StoryText;
	spatialKind?: LocationSpatialKind;
	parentLocationId?: LocationId;
	parentRelation?: LocationParentRelation;
	shootable?: boolean;
	referenceAssetIds: AssetId[];
	connects?: LocationSpineConnect[];
	portals?: LocationPortal[];
	atmosphere?: StoryText;
	lighting?: StoryText;
	scale?: StoryText;
	notes?: Note[];
}

export interface ObjectsFile {
	schemaVersion: string;
	objects: StoryObject[];
}

export interface StoryObject {
	id: ObjectId;
	name: StoryText;
	description: StoryText;
	dramaticFunction?: StoryText;
	ownerCharacterId?: CharacterId;
	locationId?: LocationId;
	referenceAssetIds: AssetId[];
	notes?: Note[];
}

export interface VehiclesFile {
	schemaVersion: string;
	vehicles: Vehicle[];
}

export interface Vehicle {
	id: VehicleId;
	name: StoryText;
	description: StoryText;
	factionId?: FactionId;
	homeLocationId?: LocationId;
	referenceAssetIds: AssetId[];
	notes?: Note[];
}

export interface FactionsFile {
	schemaVersion: string;
	factions: Faction[];
}

export interface Faction {
	id: FactionId;
	name: StoryText;
	description: StoryText;
	memberCharacterIds?: CharacterId[];
	referenceAssetIds?: AssetId[];
}
