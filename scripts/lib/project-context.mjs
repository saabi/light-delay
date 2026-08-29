/**
 * Project-wide context for editorial reports (browser + Node safe).
 */
// @ts-nocheck
import projectFile from '../../data/project.json' with { type: 'json' };
import assetsFile from '../../data/assets.json' with { type: 'json' };
import charactersFile from '../../data/characters.json' with { type: 'json' };
import locationsFile from '../../data/locations.json' with { type: 'json' };
import objectsFile from '../../data/objects.json' with { type: 'json' };
import vehiclesFile from '../../data/vehicles.json' with { type: 'json' };
import factionsFile from '../../data/factions.json' with { type: 'json' };

/**
 * @param {{ checkDisk?: (publicPath: string) => boolean }} [options]
 */
export function createProjectContext(options = {}) {
	const assets = assetsFile.assets ?? [];
	const assetById = new Map(assets.map((a) => [a.id, a]));
	const entities = [];
	for (const [file, key, kind] of [
		[charactersFile, 'characters', 'character'],
		[locationsFile, 'locations', 'location'],
		[objectsFile, 'objects', 'object'],
		[vehiclesFile, 'vehicles', 'vehicle'],
		[factionsFile, 'factions', 'faction']
	]) {
		for (const entity of file[key] ?? []) {
			entities.push({ kind, ...entity });
		}
	}
	const project = projectFile.project;
	const supportedLangs = project.languages?.supported?.map((l) => l.tag) ?? ['es', 'en'];
	const locations = locationsFile.locations ?? [];
	const locationById = new Map(locations.map((l) => [l.id, l]));

	return {
		assets,
		assetById,
		entities,
		supportedLangs,
		sourceLanguage: project.languages?.sourceLanguage ?? 'es',
		allScripts: project.scripts.map((s) => s.id),
		locationById,
		checkDisk: options.checkDisk,
		diskAuditEnabled: Boolean(options.checkDisk)
	};
}
