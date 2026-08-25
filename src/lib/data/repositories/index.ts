import projectJson from '../../../../data/project.json';
import scriptJson from '../../../../data/script.json';
import assetsJson from '../../../../data/assets.json';
import charactersJson from '../../../../data/characters.json';
import locationsJson from '../../../../data/locations.json';
import objectsJson from '../../../../data/objects.json';
import vehiclesJson from '../../../../data/vehicles.json';
import factionsJson from '../../../../data/factions.json';
import voiceProfilesJson from '../../../../data/voice-profiles.json';
import documentsJson from '../../../../data/documents.json';

import type { ProjectFile } from '$lib/types/project';
import type { ScriptFile } from '$lib/types/script';
import type { AssetsFile } from '$lib/types/assets';
import type {
	CharactersFile,
	FactionsFile,
	LocationsFile,
	ObjectsFile,
	VehiclesFile,
	VoiceProfilesFile
} from '$lib/types/entities';
import type { DocumentsFile } from '$lib/types/document';
import { assertJsonModule } from '../loaders/loadJson.ts';

export function getProject(): ProjectFile {
	return assertJsonModule(projectJson as ProjectFile, 'project');
}

export function getScript(): ScriptFile {
	return assertJsonModule(scriptJson as ScriptFile, 'script');
}

export function getAssets(): AssetsFile {
	return assertJsonModule(assetsJson as AssetsFile, 'assets');
}

export function getCharacters(): CharactersFile {
	return assertJsonModule(charactersJson as CharactersFile, 'characters');
}

export function getLocations(): LocationsFile {
	return assertJsonModule(locationsJson as LocationsFile, 'locations');
}

export function getObjects(): ObjectsFile {
	return assertJsonModule(objectsJson as ObjectsFile, 'objects');
}

export function getVehicles(): VehiclesFile {
	return assertJsonModule(vehiclesJson as VehiclesFile, 'vehicles');
}

export function getFactions(): FactionsFile {
	return assertJsonModule(factionsJson as FactionsFile, 'factions');
}

export function getVoiceProfiles(): VoiceProfilesFile {
	return assertJsonModule(voiceProfilesJson as VoiceProfilesFile, 'voice-profiles');
}

export function getDocuments(): DocumentsFile {
	return assertJsonModule(documentsJson as DocumentsFile, 'documents');
}

export function getCanonicalBundle() {
	return {
		project: getProject(),
		script: getScript(),
		assets: getAssets(),
		characters: getCharacters(),
		locations: getLocations(),
		objects: getObjects(),
		vehicles: getVehicles(),
		factions: getFactions(),
		voiceProfiles: getVoiceProfiles(),
		documents: getDocuments()
	};
}

export * from './lookups.ts';
