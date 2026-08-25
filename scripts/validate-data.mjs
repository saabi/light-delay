/**
 * Load data/*.json and run structural checks (JS twin of TS validators).
 * Usage: node scripts/validate-data.mjs
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data');
const SCRIPTS_DIR = join(DATA, 'scripts');

function load(name) {
	return JSON.parse(readFileSync(join(DATA, name), 'utf8'));
}

function loadScript(filename) {
	return JSON.parse(readFileSync(join(SCRIPTS_DIR, filename), 'utf8'));
}

function unique(label, ids, errors) {
	const seen = new Set();
	for (const id of ids) {
		if (!id) errors.push(`${label}: empty id`);
		else if (seen.has(id)) errors.push(`${label}: duplicate ${id}`);
		seen.add(id);
	}
}

function slugFromScriptId(scriptId) {
	const i = scriptId.indexOf(':');
	return i >= 0 ? scriptId.slice(i + 1) : scriptId;
}

function validateScriptFile(
	script,
	{ sourceLang, expectScenes, expectShots, functionIds, characterIds, errors }
) {
	const label = `script(${script.script?.id})`;
	if (!script.script?.id) errors.push(`${label}: missing id`);
	if (!script.script?.kind) errors.push(`${label}: missing kind`);
	if (!script.script?.continuityId) errors.push(`${label}: missing continuityId`);

	unique(
		`${label}.scenes`,
		(script.scenes || []).map((s) => s.id),
		errors
	);
	unique(
		`${label}.shots`,
		(script.shots || []).map((s) => s.id),
		errors
	);
	unique(
		`${label}.takes`,
		(script.takes || []).map((t) => t.id),
		errors
	);
	unique(
		`${label}.cues`,
		(script.cues || []).map((c) => c.id),
		errors
	);

	if (expectScenes != null && script.scenes.length !== expectScenes) {
		errors.push(`${label}: expected ${expectScenes} scenes, got ${script.scenes.length}`);
	}
	if (expectShots != null && script.shots.length !== expectShots) {
		errors.push(`${label}: expected ${expectShots} shots, got ${script.shots.length}`);
	}

	for (const cue of script.cues || []) {
		if (cue.type !== 'dialogue') continue;
		if (cue.content?.sourceLanguage !== sourceLang) {
			errors.push(`${label} cue ${cue.id}: content.sourceLanguage must be ${sourceLang}`);
		}
		const v = cue.content?.variants?.[sourceLang];
		if (!v || v.status !== 'source') {
			errors.push(`${label} cue ${cue.id}: source variant missing or status != source`);
		}
		if (!v?.spokenText?.trim()) errors.push(`${label} cue ${cue.id}: empty spokenText`);
	}

	const takeIds = new Set((script.takes || []).map((t) => t.id));
	if ((script.shots || []).length > 0) {
		for (const shot of script.shots) {
			if (!shot.selectedTakeId || !takeIds.has(shot.selectedTakeId)) {
				errors.push(`${label} shot ${shot.id}: invalid selectedTakeId`);
			}
		}
	}

	for (const a of script.script?.characterFunctionAssignments || []) {
		if (functionIds.size && !functionIds.has(a.functionId)) {
			errors.push(`${label}: unknown functionId ${a.functionId}`);
		}
		if (characterIds.size && !characterIds.has(a.characterId)) {
			errors.push(`${label}: unknown character ${a.characterId}`);
		}
		for (const src of a.sourceCharacterIds || []) {
			if (characterIds.size && !characterIds.has(src)) {
				errors.push(`${label}: unknown sourceCharacter ${src}`);
			}
		}
	}

	if (script.script?.lineage?.sourceScriptId === script.script?.id) {
		errors.push(`${label}: lineage cannot reference self`);
	}
}

function main() {
	const errors = [];
	const project = load('project.json');
	const assets = load('assets.json');
	const characters = load('characters.json');
	const locations = load('locations.json');
	const objects = load('objects.json');
	const vehicles = load('vehicles.json');
	const factions = load('factions.json');
	const voiceProfiles = load('voice-profiles.json');
	const documents = load('documents.json');
	const narrativeFunctions = load('narrative-functions.json');
	load('entity-variants.json');

	if (!project.schemaVersion) errors.push('project: missing schemaVersion');
	const langs = project.project?.languages;
	if (!langs) errors.push('project: missing languages');
	else if (!/^es(-|$)/i.test(langs.sourceLanguage)) {
		errors.push(`project: sourceLanguage must be Spanish, got ${langs.sourceLanguage}`);
	}

	const registry = project.project?.scripts || [];
	const continuities = project.project?.continuities || [];
	if (!registry.length) errors.push('project: empty scripts registry');
	if (!continuities.length) errors.push('project: empty continuities');

	const continuityIds = new Set(continuities.map((c) => c.id));
	const registryIds = new Set(registry.map((e) => e.id));
	if (!registryIds.has(project.project?.canonicalScriptId)) {
		errors.push('project: canonicalScriptId not in registry');
	}

	const scriptFilesOnDisk = readdirSync(SCRIPTS_DIR).filter((f) => f.endsWith('.json'));
	const scriptsById = new Map();
	for (const entry of registry) {
		if (!continuityIds.has(entry.continuityId)) {
			errors.push(`registry ${entry.id}: bad continuityId`);
		}
		if (entry.lineage?.sourceScriptId && !registryIds.has(entry.lineage.sourceScriptId)) {
			errors.push(`registry ${entry.id}: lineage.sourceScriptId not registered`);
		}
		const filename = `${slugFromScriptId(entry.id)}.json`;
		if (!scriptFilesOnDisk.includes(filename)) {
			errors.push(`registry ${entry.id}: missing file scripts/${filename}`);
			continue;
		}
		const script = loadScript(filename);
		scriptsById.set(entry.id, script);
		if (script.script?.id !== entry.id) {
			errors.push(`registry ${entry.id}: file id mismatch (${script.script?.id})`);
		}
		if (script.script?.kind !== entry.kind) {
			errors.push(`registry ${entry.id}: kind mismatch`);
		}
	}

	unique(
		'assets',
		assets.assets.map((a) => a.id),
		errors
	);
	unique(
		'characters',
		characters.characters.map((c) => c.id),
		errors
	);
	unique(
		'locations',
		locations.locations.map((l) => l.id),
		errors
	);
	unique(
		'objects',
		objects.objects.map((o) => o.id),
		errors
	);
	unique(
		'vehicles',
		vehicles.vehicles.map((v) => v.id),
		errors
	);
	unique(
		'factions',
		factions.factions.map((f) => f.id),
		errors
	);
	unique(
		'voiceProfiles',
		voiceProfiles.voiceProfiles.map((v) => v.id),
		errors
	);
	unique(
		'documents',
		documents.documents.map((d) => d.id),
		errors
	);
	unique(
		'narrativeFunctions',
		narrativeFunctions.functions.map((f) => f.id),
		errors
	);

	for (const asset of assets.assets) {
		if (!asset.path?.startsWith('/assets/')) {
			errors.push(`asset ${asset.id} path must start with /assets/: ${asset.path}`);
		}
	}

	const sourceLang = langs?.sourceLanguage || 'es';
	const functionIds = new Set(narrativeFunctions.functions.map((f) => f.id));
	const characterIds = new Set(characters.characters.map((c) => c.id));
	const ownedIds = new Set();

	for (const [id, script] of scriptsById) {
		const isCanonical = id === project.project.canonicalScriptId;
		validateScriptFile(script, {
			sourceLang,
			expectScenes: isCanonical ? 17 : undefined,
			expectShots: isCanonical ? 100 : undefined,
			functionIds,
			characterIds,
			errors
		});
		for (const collection of [
			script.acts,
			script.scenes,
			script.beats,
			script.cues,
			script.shots,
			script.takes
		]) {
			for (const item of collection || []) {
				if (ownedIds.has(item.id)) errors.push(`cross-script duplicate id ${item.id}`);
				ownedIds.add(item.id);
			}
		}
	}

	if (errors.length) {
		console.error('validate:data FAILED');
		for (const e of errors) console.error(' -', e);
		process.exit(1);
	}
	console.log('validate:data OK');
	const main = scriptsById.get(project.project.canonicalScriptId);
	console.log(
		`scripts=${scriptsById.size} scenes(main)=${main?.scenes?.length} shots(main)=${main?.shots?.length} assets=${assets.assets.length}`
	);
}

main();
