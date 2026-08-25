import type { Asset } from '$lib/types/assets';
import type { DocumentRecord } from '$lib/types/document';
import type { Character, Faction, Location, StoryObject, Vehicle } from '$lib/types/entities';
import type { Cue, Scene, Shot, Take } from '$lib/types/script';
import {
	getAssets,
	getCharacters,
	getDocuments,
	getFactions,
	getLocations,
	getObjects,
	getScript,
	getVehicles
} from './index.ts';

export type EntityKind = 'characters' | 'locations' | 'objects' | 'vehicles' | 'factions';

export function getDocumentBySlug(slug: string): DocumentRecord | undefined {
	return getDocuments().documents.find((d) => d.slug === slug);
}

export function getAssetById(id: string): Asset | undefined {
	return getAssets().assets.find((a) => a.id === id);
}

export function getCharacterById(id: string): Character | undefined {
	return getCharacters().characters.find((c) => c.id === id);
}

export function getLocationById(id: string): Location | undefined {
	return getLocations().locations.find((l) => l.id === id);
}

export function getObjectById(id: string): StoryObject | undefined {
	return getObjects().objects.find((o) => o.id === id);
}

export function getVehicleById(id: string): Vehicle | undefined {
	return getVehicles().vehicles.find((v) => v.id === id);
}

export function getFactionById(id: string): Faction | undefined {
	return getFactions().factions.find((f) => f.id === id);
}

export function listEntities(kind: EntityKind) {
	switch (kind) {
		case 'characters':
			return getCharacters().characters.map((e) => ({
				kind,
				id: e.id,
				name: e.name,
				description: e.description,
				referenceAssetIds: e.referenceAssetIds
			}));
		case 'locations':
			return getLocations().locations.map((e) => ({
				kind,
				id: e.id,
				name: e.name,
				description: e.description,
				referenceAssetIds: e.referenceAssetIds
			}));
		case 'objects':
			return getObjects().objects.map((e) => ({
				kind,
				id: e.id,
				name: e.name,
				description: e.description,
				referenceAssetIds: e.referenceAssetIds
			}));
		case 'vehicles':
			return getVehicles().vehicles.map((e) => ({
				kind,
				id: e.id,
				name: e.name,
				description: e.description,
				referenceAssetIds: e.referenceAssetIds
			}));
		case 'factions':
			return getFactions().factions.map((e) => ({
				kind,
				id: e.id,
				name: e.name,
				description: e.description,
				referenceAssetIds: e.referenceAssetIds ?? []
			}));
	}
}

export function getEntity(kind: EntityKind, id: string) {
	return listEntities(kind).find((e) => e.id === id);
}

export function getSceneById(id: string): Scene | undefined {
	return getScript().scenes.find((s) => s.id === id);
}

export function getShotById(id: string): Shot | undefined {
	return getScript().shots.find((s) => s.id === id);
}

export function getCueById(id: string): Cue | undefined {
	return getScript().cues.find((c) => c.id === id);
}

export function getTakeById(id: string): Take | undefined {
	return getScript().takes.find((t) => t.id === id);
}

/** Resolve public image path for a shot's selected take. */
export function getShotImagePath(shot: Shot): string | undefined {
	const script = getScript();
	const take = shot.selectedTakeId
		? script.takes.find((t) => t.id === shot.selectedTakeId)
		: undefined;
	if (!take?.imageAssetId) return undefined;
	return getAssetById(take.imageAssetId)?.path;
}

export function getEntityPrimaryImagePath(referenceAssetIds: string[]): string | undefined {
	for (const id of referenceAssetIds) {
		const asset = getAssetById(id);
		if (asset?.kind === 'image' && asset.path.startsWith('/assets/')) {
			return asset.path;
		}
	}
	return undefined;
}

export const ENTITY_KIND_LABELS: Record<EntityKind, string> = {
	characters: 'Personajes',
	locations: 'Localizaciones',
	objects: 'Objetos',
	vehicles: 'Vehículos',
	factions: 'Facciones'
};

export const VALID_ENTITY_KINDS: EntityKind[] = [
	'characters',
	'locations',
	'objects',
	'vehicles',
	'factions'
];
