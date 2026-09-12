import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('..', import.meta.url)));
const script = JSON.parse(readFileSync(join(ROOT, 'data/scripts/light-delay-festival-master.json'), 'utf8'));
const assets = JSON.parse(readFileSync(join(ROOT, 'data/assets.json'), 'utf8')).assets;
const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
const characters = JSON.parse(readFileSync(join(ROOT, 'data/characters.json'), 'utf8'));
const characterAssetOwners = new Map();
for (const collection of Object.values(characters).filter(Array.isArray)) {
	for (const character of collection) {
		for (const assetId of character.referenceAssetIds ?? []) {
			if (!characterAssetOwners.has(assetId)) characterAssetOwners.set(assetId, []);
			characterAssetOwners.get(assetId).push(character.id);
		}
	}
}
const shotsById = new Map(script.shots.map((shot) => [shot.id, shot]));
const errors = [];
let references = 0;
for (const take of script.takes ?? []) {
	const shot = shotsById.get(take.shotId);
	if (!shot) {
		errors.push(`${take.id}: missing shot ${take.shotId}`);
		continue;
	}
	const offScreen = new Set(shot.offScreenCharacterIds ?? []);
	for (const assetId of take.generation?.referenceAssetIds ?? []) {
		references += 1;
		const asset = assetsById.get(assetId);
		if (!asset) {
			errors.push(`${take.id}: missing asset ${assetId}`);
			continue;
		}
		if (asset.kind !== 'image') errors.push(`${take.id}: non-image storyboard reference ${assetId}`);
		if (asset.path && !existsSync(join(ROOT, 'static', asset.path.replace(/^\//, '')))) {
			errors.push(`${take.id}: missing image path ${asset.path}`);
		}
		for (const characterId of characterAssetOwners.get(assetId) ?? []) {
			if (offScreen.has(characterId)) errors.push(`${take.id}: off-screen character reference ${assetId} (${characterId})`);
		}
	}
}

console.log(`festival-master reference audit: takes=${script.takes?.length ?? 0} references=${references} errors=${errors.length}`);
if (errors.length) {
	for (const error of errors) console.error(`- ${error}`);
	process.exitCode = 1;
}
