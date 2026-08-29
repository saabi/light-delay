import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data');
const overlayPath = join(DATA, 'translations', 'entities.en.json');
const overlay = JSON.parse(readFileSync(overlayPath, 'utf8'));
const files = [
	['characters.json', 'characters', ['name', 'role', 'description']],
	['locations.json', 'locations', ['name', 'description']],
	['objects.json', 'objects', ['name', 'description']],
	['vehicles.json', 'vehicles', ['name', 'description']],
	['factions.json', 'factions', ['name', 'description']]
];
const extraTranslations = {
	'location:proxima-station': { atmosphere: 'Orbital exterior and silhouette' },
	'location:proxima-dock': { atmosphere: 'Celestial Ardor departure' },
	'location:celestial-ardor-bridge': { atmosphere: 'Command center' },
	'location:celestial-ardor-command-vestibule': { atmosphere: 'Axial transit and bridge blind spot' },
	'location:celestial-ardor-central-access': { atmosphere: 'Everyday microgravity circulation' },
	'location:celestial-ardor-service-cylinder': { atmosphere: 'Restricted technical route' },
	'location:celestial-ardor-engineering': { atmosphere: 'Diagnostics and quarantine' },
	'location:diplomatic-core-room': { atmosphere: 'Sabotage site' },
	'location:velari-wormhole-mouth': { atmosphere: 'Threshold and single window' },
	'location:velari-station': { atmosphere: 'First-contact destination' },
	'object:diplomatic-quantum-core': { dramaticFunction: 'Compromised system' },
	'object:optical-contingency-transmitter': { dramaticFunction: 'Independent physical channel used by Zao' },
	'object:wired-comms-deck-patch-panel': { dramaticFunction: 'Harlan cuts and restores the diplomatic deck wired backup' },
	'object:physical-override-relay': { dramaticFunction: 'Material evidence and double key' },
	'object:read-only-greeting-medium': { dramaticFunction: 'Clean passive content' }
};

for (const [filename, collection, fields] of files) {
	const path = join(DATA, filename);
	const file = JSON.parse(readFileSync(path, 'utf8'));
	file.schemaVersion = '1.1.0';
	for (const entity of file[collection]) {
		const translations = { ...(overlay[entity.id] ?? {}), ...(extraTranslations[entity.id] ?? {}) };
		for (const field of [...fields, 'atmosphere', 'dramaticFunction']) {
			if (entity[field] == null || typeof entity[field] !== 'string') continue;
			const english = translations[field] ?? (field === 'name' ? entity[field] : undefined);
			if (typeof english !== 'string' || !english.trim()) {
				throw new Error(`Missing English translation for ${entity.id}.${field}`);
			}
			entity[field] = { es: entity[field], en: english };
		}
	}
	writeFileSync(path, `${JSON.stringify(file, null, 2)}\n`, 'utf8');
}
writeFileSync(overlayPath, '{}\n', 'utf8');
console.log('migrate-entity-inline-i18n OK');
