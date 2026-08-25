export { validateProject } from './validateProject.ts';
export { validateScript } from './validateScript.ts';
export { validateAssets } from './validateAssets.ts';
export {
	validateCharacters,
	validateLocations,
	validateObjects,
	validateVehicles,
	validateFactions,
	validateVoiceProfiles,
	validateDocuments
} from './validateEntities.ts';

import type { ValidationResult } from '$lib/types/common';
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
import { validateProject } from './validateProject.ts';
import { validateScript } from './validateScript.ts';
import { validateAssets } from './validateAssets.ts';
import {
	validateCharacters,
	validateLocations,
	validateObjects,
	validateVehicles,
	validateFactions,
	validateVoiceProfiles,
	validateDocuments
} from './validateEntities.ts';

export interface CanonicalDataBundle {
	project: ProjectFile;
	script: ScriptFile;
	assets: AssetsFile;
	characters: CharactersFile;
	locations: LocationsFile;
	objects: ObjectsFile;
	vehicles: VehiclesFile;
	factions: FactionsFile;
	voiceProfiles: VoiceProfilesFile;
	documents?: DocumentsFile;
}

export function validateAll(bundle: CanonicalDataBundle): ValidationResult {
	const results = [
		validateProject(bundle.project),
		validateScript(bundle.script, {
			sourceLanguage: bundle.project.project.languages.sourceLanguage,
			expectSceneCount: 17,
			expectShotCount: 100
		}),
		validateAssets(bundle.assets),
		validateCharacters(bundle.characters),
		validateLocations(bundle.locations),
		validateObjects(bundle.objects),
		validateVehicles(bundle.vehicles),
		validateFactions(bundle.factions),
		validateVoiceProfiles(bundle.voiceProfiles)
	];
	if (bundle.documents) results.push(validateDocuments(bundle.documents));

	const errors = results.flatMap((r) => r.errors);
	return { ok: errors.length === 0, errors };
}
