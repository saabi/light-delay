import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Festival-master still-reference audit (read-only).
 *
 * Per take: catalog presence, file existence, editorial status, duplicates, gpt-image-2 image
 * budget (8), off-screen character sheets, scale diagrams, on-frame entity coverage, and the
 * interior/exterior authority rule (an INT shot must not use an exterior station/dock sheet as
 * its location authority). Per context: gravity wording in still prompts.
 */
const ROOT = join(fileURLToPath(new URL('..', import.meta.url)));
const script = JSON.parse(readFileSync(join(ROOT, 'data/scripts/light-delay-festival-master.json'), 'utf8'));
const assets = JSON.parse(readFileSync(join(ROOT, 'data/assets.json'), 'utf8')).assets;
const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
const manifestIds = new Set(
	JSON.parse(readFileSync(join(ROOT, 'data/production/asset-generation-manifest.json'), 'utf8')).assets.map((a) => a.assetId)
);
const contexts = JSON.parse(readFileSync(join(ROOT, 'data/production/contexts.json'), 'utf8'));
const providerCapabilities = JSON.parse(readFileSync(join(ROOT, 'data/production/provider-capabilities.json'), 'utf8'));
const stillLimit =
	providerCapabilities.snapshots.find((s) => s.id === 'provider:openai:gpt-image-2:2026-09-13')?.limits?.maxImages ?? 8;

const entityFiles = ['characters.json', 'locations.json', 'objects.json', 'vehicles.json'];
/** entity id → its catalog sheets */
const entitySheets = new Map();
/** sheet id → entity ids that own it */
const sheetOwners = new Map();
for (const file of entityFiles) {
	const data = JSON.parse(readFileSync(join(ROOT, 'data', file), 'utf8'));
	for (const collection of Object.values(data).filter(Array.isArray)) {
		for (const entity of collection) {
			entitySheets.set(entity.id, entity.referenceAssetIds ?? []);
			for (const assetId of entity.referenceAssetIds ?? []) {
				if (!sheetOwners.has(assetId)) sheetOwners.set(assetId, []);
				sheetOwners.get(assetId).push(entity.id);
			}
		}
	}
}
const EXTERIOR_LOCATION_SHEETS = new Set(['asset:location-proxima-station-berthed', 'asset:location-proxima-dock-sheet']);
const STALE_STATUSES = new Set(['needs_replacement', 'needs_regeneration']);

const scenesById = new Map(script.scenes.map((scene) => [scene.id, scene]));
const shotsById = new Map(script.shots.map((shot) => [shot.id, shot]));
const contextByShot = new Map();
for (const assignment of contexts.assignments) {
	if (assignment.scriptId !== script.script.id) continue;
	for (const shot of script.shots) {
		if ((assignment.shotIds ?? []).includes(shot.id) || (assignment.sceneIds ?? []).includes(shot.sceneId)) {
			if (!contextByShot.has(shot.id)) contextByShot.set(shot.id, new Set());
			contextByShot.get(shot.id).add(assignment.contextId);
		}
	}
}

const GRAVITY_RULES = {
	'context:proxima-habitat-ring': {
		require: [/0\.5 g/],
		forbid: [/microgravity/i, /floating/i, /\b1 g\b/]
	},
	'context:proxima-dock': {
		require: [/microgravity/i],
		forbid: [/\b1 g\b/, /feet planted/i, /\bstanding\b/i, /\bplatform\b/i, /landing pad/i, /hangar floor/i, /deck floor/i]
	}
};

const errors = [];
let references = 0;
for (const take of script.takes ?? []) {
	const shot = shotsById.get(take.shotId);
	if (!shot) {
		errors.push(`${take.id}: missing shot ${take.shotId}`);
		continue;
	}
	const offScreen = new Set(shot.offScreenCharacterIds ?? []);
	const refs = take.generation?.referenceAssetIds ?? [];
	const seen = new Set();
	const scene = scenesById.get(shot.sceneId);
	const interior = scene?.setting?.interiorExterior === 'INT';
	let imageCount = 0;
	for (const assetId of refs) {
		references += 1;
		if (seen.has(assetId)) errors.push(`${take.id}: duplicate reference ${assetId}`);
		seen.add(assetId);
		const asset = assetsById.get(assetId);
		if (!asset) {
			errors.push(`${take.id}: ${manifestIds.has(assetId) ? 'manifest-only (unregistered)' : 'missing'} asset ${assetId}`);
			continue;
		}
		if (asset.kind !== 'image') errors.push(`${take.id}: non-image storyboard reference ${assetId}`);
		else imageCount += 1;
		if (asset.path && !existsSync(join(ROOT, 'static', asset.path.replace(/^\//, '')))) {
			errors.push(`${take.id}: missing image path ${asset.path}`);
		}
		if (asset.imageStatus?.status && STALE_STATUSES.has(asset.imageStatus.status)) {
			errors.push(`${take.id}: stale reference ${assetId} (${asset.imageStatus.status})`);
		}
		if (asset.storyboardEligible === false || /\/specs\/|scale-reference/.test(asset.path ?? '')) {
			errors.push(`${take.id}: scale/diagram asset attached ${assetId}`);
		}
		for (const characterId of sheetOwners.get(assetId) ?? []) {
			if (offScreen.has(characterId)) errors.push(`${take.id}: off-screen character reference ${assetId} (${characterId})`);
		}
		if (interior && EXTERIOR_LOCATION_SHEETS.has(assetId)) {
			errors.push(`${take.id}: exterior_sheet_on_interior_take:${assetId}`);
		}
		// Every attached entity sheet must map to an on-frame entity (or the shot location).
		const owners = sheetOwners.get(assetId) ?? [];
		if (owners.length) {
			const onFrameIds = new Set([
				...(shot.visibleRefs ?? []).filter((v) => !(v.kind === 'character' && offScreen.has(v.id))).map((v) => v.id),
				shot.locationId,
				...(shot.secondaryLocationIds ?? [])
			]);
			if (!owners.some((owner) => onFrameIds.has(owner))) {
				errors.push(`${take.id}: reference_without_visible_entity:${assetId}`);
			}
		}
	}
	if (imageCount > stillLimit) errors.push(`${take.id}: image references ${imageCount} > ${stillLimit}`);
	// Every on-frame entity with a catalog sheet must have one of its current sheets attached.
	for (const visible of shot.visibleRefs ?? []) {
		if (visible.kind === 'character' && offScreen.has(visible.id)) continue;
		const sheets = entitySheets.get(visible.id) ?? [];
		if (!sheets.length) continue;
		if (!sheets.some((sheet) => refs.includes(sheet))) {
			errors.push(`${take.id}: visible_entity_without_reference:${visible.id}`);
		}
	}
	// Gravity wording by production context (stateless still prompts must state it).
	const prompt = take.generation?.prompt ?? '';
	for (const contextId of contextByShot.get(shot.id) ?? []) {
		const rule = GRAVITY_RULES[contextId];
		if (!rule) continue;
		for (const re of rule.require) if (!re.test(prompt)) errors.push(`${take.id}: gravity_missing:${contextId}:${re}`);
		// Negated clauses ("not a hangar, platform, or landing pad", "no floor") are constraints, not
		// contradictions: drop them before testing the forbidden positive claims.
		const stripped = prompt.replace(/\b(not|no|never|without|avoid)\b[^.;]*/gi, '');
		for (const re of rule.forbid) {
			if (re.test(stripped)) errors.push(`${take.id}: gravity_contradiction:${contextId}:${re}`);
		}
	}
}

console.log(`festival-master reference audit: takes=${script.takes?.length ?? 0} references=${references} errors=${errors.length}`);
if (errors.length) {
	for (const error of errors) console.error(`- ${error}`);
	process.exitCode = 1;
}
