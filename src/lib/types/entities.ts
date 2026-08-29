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
	provider?: string;
	model?: string;
	providerVoiceId?: string;
	sampleAssetIds?: AssetId[];
	pronunciationDictionaryAssetId?: AssetId;
	settings?: Record<string, string | number | boolean>;
}

export interface VoiceProfile {
	id: VoiceProfileId;
	characterId?: CharacterId;
	name: string;
	description?: string;
	variants: VoiceProfileVariant[];
}

export interface LocationsFile {
	schemaVersion: string;
	locations: Location[];
}

export interface Location {
	id: LocationId;
	name: StoryText;
	description: StoryText;
	parentLocationId?: LocationId;
	referenceAssetIds: AssetId[];
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
