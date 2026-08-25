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
import type { EntityVariantsFile, NarrativeFunctionsFile, ScriptFile } from '$lib/types/script';
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
	/** @deprecated Prefer scripts[]; kept for callers that expect the canonical script. */
	script: ScriptFile;
	scripts?: ScriptFile[];
	assets: AssetsFile;
	characters: CharactersFile;
	locations: LocationsFile;
	objects: ObjectsFile;
	vehicles: VehiclesFile;
	factions: FactionsFile;
	voiceProfiles: VoiceProfilesFile;
	documents?: DocumentsFile;
	narrativeFunctions?: NarrativeFunctionsFile;
	entityVariants?: EntityVariantsFile;
}

export function validateAll(bundle: CanonicalDataBundle): ValidationResult {
	const scripts = bundle.scripts?.length ? bundle.scripts : [bundle.script];
	const characterIds = new Set(bundle.characters.characters.map((c) => c.id));
	const sourceLanguage = bundle.project.project.languages.sourceLanguage;

	const results: ValidationResult[] = [
		validateProject(bundle.project, { scripts }),
		validateAssets(bundle.assets),
		validateCharacters(bundle.characters),
		validateLocations(bundle.locations),
		validateObjects(bundle.objects),
		validateVehicles(bundle.vehicles),
		validateFactions(bundle.factions),
		validateVoiceProfiles(bundle.voiceProfiles)
	];

	if (bundle.documents) results.push(validateDocuments(bundle.documents));

	for (const script of scripts) {
		const isCanonical = script.script.id === bundle.project.project.canonicalScriptId;
		results.push(
			validateScript(script, {
				sourceLanguage,
				expectSceneCount: isCanonical ? 17 : undefined,
				expectShotCount: isCanonical ? 100 : undefined,
				requireSelectedTakes: script.shots.length > 0,
				narrativeFunctions: bundle.narrativeFunctions,
				characterIds
			})
		);
	}

	const ownedIds = new Set<string>();
	for (const script of scripts) {
		for (const collection of [
			script.acts,
			script.scenes,
			script.beats,
			script.cues,
			script.shots,
			script.takes
		]) {
			for (const item of collection) {
				if (ownedIds.has(item.id)) {
					results.push({
						ok: false,
						errors: [`cross-script: duplicate script-owned id ${item.id}`]
					});
				}
				ownedIds.add(item.id);
			}
		}
	}

	const errors = results.flatMap((r) => r.errors);
	return { ok: errors.length === 0, errors };
}
