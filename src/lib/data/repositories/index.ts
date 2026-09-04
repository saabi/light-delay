import projectJson from '../../../../data/project.json';
import mainScriptJson from '../../../../data/scripts/light-delay-main-short.json';
import festivalScriptJson from '../../../../data/scripts/light-delay-festival.json';
import trailerScriptJson from '../../../../data/scripts/light-delay-trailer.json';
import longScriptJson from '../../../../data/scripts/light-delay-long.json';
import masterNarrativeScriptJson from '../../../../data/scripts/light-delay-master-narrative.json';
import assetsJson from '../../../../data/assets.json';
import charactersJson from '../../../../data/characters.json';
import locationsJson from '../../../../data/locations.json';
import objectsJson from '../../../../data/objects.json';
import vehiclesJson from '../../../../data/vehicles.json';
import factionsJson from '../../../../data/factions.json';
import voiceProfilesJson from '../../../../data/voice-profiles.json';
import documentsJson from '../../../../data/documents.json';
import narrativeFunctionsJson from '../../../../data/narrative-functions.json';
import entityVariantsJson from '../../../../data/entity-variants.json';
import comparisonTaxonomyJson from '../../../../data/comparison-taxonomy.json';

import type { ProjectFile, ScriptRegistryEntry } from '$lib/types/project';
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
import type { ScriptId } from '$lib/types/ids';
import type { ComparisonTaxonomyFile } from '$lib/types/comparison';
import type { OutlineCoverageEntry, OutlineFile } from '$lib/types/outline';
import { assertJsonModule } from '../loaders/loadJson.ts';
import {
	localizeComparisonTaxonomy,
	localizeEntityVariants,
	localizeNarrativeFunctions,
	localizeOutline,
	localizeScript,
	localizeScriptRegistryEntries
} from '../selectors/publicTranslations.ts';
import { sourceLocalizedString } from '../selectors/localized.ts';

const outlineGlob = import.meta.glob('../../../../data/outlines/*.json', {
	eager: true,
	import: 'default'
}) as Record<string, OutlineFile>;

const OUTLINE_MODULES: Record<string, OutlineFile> = {};
for (const [path, mod] of Object.entries(outlineGlob)) {
	const match = path.match(/([^/\\]+)\.json$/);
	if (!match) continue;
	const slug = match[1];
	OUTLINE_MODULES[`script:${slug}`] = assertJsonModule(mod, `outlines/${slug}`);
}

const SCRIPT_MODULES: Record<string, ScriptFile> = {
	'script:light-delay-main-short': assertJsonModule(
		mainScriptJson as ScriptFile,
		'scripts/light-delay-main-short'
	),
	'script:light-delay-festival': assertJsonModule(
		festivalScriptJson as ScriptFile,
		'scripts/light-delay-festival'
	),
	'script:light-delay-trailer': assertJsonModule(
		trailerScriptJson as ScriptFile,
		'scripts/light-delay-trailer'
	),
	'script:light-delay-long': assertJsonModule(
		longScriptJson as ScriptFile,
		'scripts/light-delay-long'
	),
	'script:light-delay-master-narrative': assertJsonModule(
		masterNarrativeScriptJson as ScriptFile,
		'scripts/light-delay-master-narrative'
	)
};

function slugFromScriptId(scriptId: ScriptId): string {
	const bare = scriptId.includes(':') ? scriptId.slice(scriptId.indexOf(':') + 1) : scriptId;
	return bare;
}

export function getProject(): ProjectFile {
	return assertJsonModule(projectJson as ProjectFile, 'project');
}

export function listScripts(): ScriptRegistryEntry[] {
	return getProject().project.scripts ?? [];
}

export function listLocalizedScripts(language: string): ScriptRegistryEntry[] {
	return localizeScriptRegistryEntries(listScripts(), language);
}

export function getCanonicalScript(): ScriptFile {
	const id = getProject().project.canonicalScriptId;
	return getScript(id);
}

/**
 * Load a script by id. Prefer getCanonicalScript() for the default film.
 * @throws if scriptId is missing or unknown
 */
export function getScript(scriptId: ScriptId): ScriptFile {
	if (!scriptId) {
		throw new Error('getScript(scriptId): scriptId is required; use getCanonicalScript()');
	}
	const cached = SCRIPT_MODULES[scriptId];
	if (cached) return cached;
	const registered = listScripts().find((s) => s.id === scriptId);
	if (!registered) {
		throw new Error(`getScript: unknown scriptId "${scriptId}"`);
	}
	throw new Error(
		`getScript: registry entry "${scriptId}" has no imported module (expected data/scripts/${slugFromScriptId(scriptId)}.json)`
	);
}

export function getLocalizedScript(scriptId: ScriptId, language: string): ScriptFile {
	return localizeScript(getScript(scriptId), language);
}

/** Relative path convention for an outline JSON file (may not exist on disk). */
export function outlinePathForScript(scriptId: ScriptId): string {
	return `data/outlines/${slugFromScriptId(scriptId)}.json`;
}

/** Load outline for a script, or null when the optional JSON is absent. */
export function getOutline(scriptId: ScriptId): OutlineFile | null {
	if (!scriptId) return null;
	return OUTLINE_MODULES[scriptId] ?? null;
}

export function getLocalizedOutline(scriptId: ScriptId, language: string): OutlineFile | null {
	const outline = getOutline(scriptId);
	if (!outline) return null;
	return localizeOutline(outline, language);
}

export function hasOutline(scriptId: ScriptId): boolean {
	return getOutline(scriptId) !== null;
}

export function listOutlineCoverage(): OutlineCoverageEntry[] {
	return listScripts().map((entry) => {
		const outline = getOutline(entry.id);
		return {
			scriptId: entry.id,
			label: sourceLocalizedString(entry.label) ?? entry.id,
			present: outline !== null,
			stepCount: outline?.steps?.length ?? 0,
			outlinePath: outlinePathForScript(entry.id)
		};
	});
}

export function getNarrativeFunctions(): NarrativeFunctionsFile {
	return assertJsonModule(narrativeFunctionsJson as NarrativeFunctionsFile, 'narrative-functions');
}

export function getLocalizedNarrativeFunctions(language: string): NarrativeFunctionsFile {
	return localizeNarrativeFunctions(getNarrativeFunctions(), language);
}

export function getEntityVariants(): EntityVariantsFile {
	return assertJsonModule(entityVariantsJson as EntityVariantsFile, 'entity-variants');
}

export function getLocalizedEntityVariants(language: string): EntityVariantsFile {
	const source = getEntityVariants();
	return { ...source, variants: localizeEntityVariants(source.variants, language) };
}

export function getComparisonTaxonomy(): ComparisonTaxonomyFile {
	return assertJsonModule(comparisonTaxonomyJson as ComparisonTaxonomyFile, 'comparison-taxonomy');
}

export function getLocalizedComparisonTaxonomy(language: string): ComparisonTaxonomyFile {
	return localizeComparisonTaxonomy(getComparisonTaxonomy(), language);
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
		script: getCanonicalScript(),
		scripts: listScripts().map((e) => getScript(e.id)),
		assets: getAssets(),
		characters: getCharacters(),
		locations: getLocations(),
		objects: getObjects(),
		vehicles: getVehicles(),
		factions: getFactions(),
		voiceProfiles: getVoiceProfiles(),
		documents: getDocuments(),
		narrativeFunctions: getNarrativeFunctions(),
		entityVariants: getEntityVariants(),
		comparisonTaxonomy: getComparisonTaxonomy()
	};
}

export * from './lookups.ts';
