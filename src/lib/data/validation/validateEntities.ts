import type { ValidationResult } from '$lib/types/common';
import type {
	CharactersFile,
	FactionsFile,
	LocationsFile,
	ObjectsFile,
	VehiclesFile,
	VoiceProfilesFile
} from '$lib/types/entities';
import type { DocumentsFile } from '$lib/types/document';

function validateIdList(label: string, ids: string[], errors: string[]) {
	const seen = new Set<string>();
	for (const id of ids) {
		if (!id) {
			errors.push(`${label}: empty id`);
			continue;
		}
		if (seen.has(id)) errors.push(`${label}: duplicate id ${id}`);
		seen.add(id);
	}
}

export function validateCharacters(file: CharactersFile): ValidationResult {
	const errors: string[] = [];
	if (!file?.schemaVersion) errors.push('characters: missing schemaVersion');
	if (!Array.isArray(file?.characters)) {
		errors.push('characters: missing characters array');
		return { ok: false, errors };
	}
	validateIdList(
		'characters',
		file.characters.map((c) => c.id),
		errors
	);
	for (const c of file.characters) {
		if (!c.name) errors.push(`characters: ${c.id} missing name`);
		if (!Array.isArray(c.referenceAssetIds)) {
			errors.push(`characters: ${c.id} missing referenceAssetIds`);
		}
	}
	return { ok: errors.length === 0, errors };
}

export function validateLocations(file: LocationsFile): ValidationResult {
	const errors: string[] = [];
	if (!file?.schemaVersion) errors.push('locations: missing schemaVersion');
	if (!Array.isArray(file?.locations)) {
		errors.push('locations: missing locations array');
		return { ok: false, errors };
	}
	validateIdList(
		'locations',
		file.locations.map((l) => l.id),
		errors
	);
	return { ok: errors.length === 0, errors };
}

export function validateObjects(file: ObjectsFile): ValidationResult {
	const errors: string[] = [];
	if (!file?.schemaVersion) errors.push('objects: missing schemaVersion');
	if (!Array.isArray(file?.objects)) {
		errors.push('objects: missing objects array');
		return { ok: false, errors };
	}
	validateIdList(
		'objects',
		file.objects.map((o) => o.id),
		errors
	);
	return { ok: errors.length === 0, errors };
}

export function validateVehicles(file: VehiclesFile): ValidationResult {
	const errors: string[] = [];
	if (!file?.schemaVersion) errors.push('vehicles: missing schemaVersion');
	if (!Array.isArray(file?.vehicles)) {
		errors.push('vehicles: missing vehicles array');
		return { ok: false, errors };
	}
	validateIdList(
		'vehicles',
		file.vehicles.map((v) => v.id),
		errors
	);
	return { ok: errors.length === 0, errors };
}

export function validateFactions(file: FactionsFile): ValidationResult {
	const errors: string[] = [];
	if (!file?.schemaVersion) errors.push('factions: missing schemaVersion');
	if (!Array.isArray(file?.factions)) {
		errors.push('factions: missing factions array');
		return { ok: false, errors };
	}
	validateIdList(
		'factions',
		file.factions.map((f) => f.id),
		errors
	);
	return { ok: errors.length === 0, errors };
}

export function validateVoiceProfiles(file: VoiceProfilesFile): ValidationResult {
	const errors: string[] = [];
	if (!file?.schemaVersion) errors.push('voice-profiles: missing schemaVersion');
	if (!Array.isArray(file?.voiceProfiles)) {
		errors.push('voice-profiles: missing voiceProfiles array');
		return { ok: false, errors };
	}
	validateIdList(
		'voice-profiles',
		file.voiceProfiles.map((v) => v.id),
		errors
	);
	for (const profile of file.voiceProfiles) {
		if (!Array.isArray(profile.variants) || profile.variants.length === 0) {
			errors.push(`voice-profiles: ${profile.id} needs at least one language variant`);
		}
	}
	return { ok: errors.length === 0, errors };
}

export function validateDocuments(file: DocumentsFile): ValidationResult {
	const errors: string[] = [];
	if (!file?.schemaVersion) errors.push('documents: missing schemaVersion');
	if (!Array.isArray(file?.documents)) {
		errors.push('documents: missing documents array');
		return { ok: false, errors };
	}
	validateIdList(
		'documents',
		file.documents.map((d) => d.id),
		errors
	);
	for (const doc of file.documents) {
		if (!doc.slug) errors.push(`documents: ${doc.id} missing slug`);
		if (!Array.isArray(doc.blocks)) errors.push(`documents: ${doc.id} missing blocks`);
	}
	return { ok: errors.length === 0, errors };
}
