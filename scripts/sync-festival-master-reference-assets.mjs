import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('..', import.meta.url)));
const scriptPath = join(ROOT, 'data', 'scripts', 'light-delay-festival-master.json');
const entityFiles = ['characters.json', 'locations.json', 'objects.json', 'vehicles.json'];

/** Scale/orthographic diagrams stay in the art bible — never feed storyboard takes. */
function isStoryboardEligibleAsset(asset) {
	if (!asset || asset.kind !== 'image') return false;
	const meta = asset.metadata ?? {};
	if (meta.storyboardEligible === false) return false;
	if (meta.useCase === 'scale-diagram') return false;
	const path = asset.path ?? '';
	if (path.includes('/specs/')) return false;
	if (path.includes('/scale-references/')) return false;
	if (path.includes('proportional-reference')) return false;
	return true;
}

const assetsById = new Map(
	JSON.parse(readFileSync(join(ROOT, 'data', 'assets.json'), 'utf8')).assets.map((asset) => [
		asset.id,
		asset
	])
);

const referenceAssets = new Map();
for (const file of entityFiles) {
	const data = JSON.parse(readFileSync(join(ROOT, 'data', file), 'utf8'));
	for (const collection of Object.values(data).filter(Array.isArray)) {
		for (const entity of collection) {
			const eligible = (entity.referenceAssetIds ?? []).filter((id) =>
				isStoryboardEligibleAsset(assetsById.get(id))
			);
			referenceAssets.set(entity.id, eligible);
		}
	}
}

const file = JSON.parse(readFileSync(scriptPath, 'utf8'));
const shots = new Map(file.shots.map((shot) => [shot.id, shot]));
const objectRules = [
	[/geophysical impulse package|impulse package|thermonuclear package/i, 'object:proxima-geophysical-impulse-package'],
	[/wrist|jammer|vault lock/i, 'object:harlan-wrist-device'],
	[/time-reference diagnostic|diagnostic unit|time reference/i, 'object:time-reference-diagnostic-unit'],
	[/optical array|optical transmitter|optical control/i, 'object:optical-contingency-transmitter'],
	[/COM A|COM B|communications distributor|wired comm/i, 'object:wired-comms-deck-patch-panel'],
	[/transport sphere|personal transport sphere/i, 'vehicle:velari-transport-sphere']
];

let removedSpecs = 0;
for (const take of file.takes ?? []) {
	const shot = shots.get(take.shotId);
	if (!shot) continue;
	const text = `${shot.description?.en ?? ''} ${take.generation?.prompt ?? ''}`;
	const ids = new Set();
	// Rebuild from shot bindings on every pass. Existing IDs can be stale after editorial changes.
	for (const existing of take.generation?.referenceAssetIds ?? []) {
		if (!isStoryboardEligibleAsset(assetsById.get(existing))) removedSpecs += 1;
	}
	const offScreen = new Set(shot.offScreenCharacterIds ?? []);
	for (const ref of shot.visibleRefs ?? []) {
		if (ref.kind === 'character' && offScreen.has(ref.id)) continue;
		for (const assetId of referenceAssets.get(ref.id) ?? []) ids.add(assetId);
	}
	for (const locationId of [shot.locationId, ...(shot.secondaryLocationIds ?? [])].filter(Boolean)) {
		for (const assetId of referenceAssets.get(locationId) ?? []) ids.add(assetId);
	}
	for (const [pattern, entityId] of objectRules) {
		if (pattern.test(text)) {
			for (const assetId of referenceAssets.get(entityId) ?? []) ids.add(assetId);
		}
	}
	if (take.generation) take.generation.referenceAssetIds = [...ids];
}

writeFileSync(scriptPath, `${JSON.stringify(file, null, 2)}\n`, 'utf8');
console.log(
	`festival-master reference assets synced: takes=${file.takes?.length ?? 0} removedIneligible=${removedSpecs}`
);
