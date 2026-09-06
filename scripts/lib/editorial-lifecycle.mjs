import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

function readJson(path) {
	return JSON.parse(readFileSync(path, 'utf8'));
}

function key(kind, id) {
	return `${kind}\u0000${id}`;
}

function ref(kind, id, label = id, source = '') {
	return { kind, id, label, source };
}

function filesUnder(directory) {
	const files = [];
	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) files.push(...filesUnder(path));
		else files.push(path);
	}
	return files;
}

export function loadLifecycle(root) {
	return readJson(join(root, 'data/editorial-lifecycle.json'));
}

export function explicitLifecycleIndex(lifecycle) {
	const index = new Map();
	const duplicates = [];
	for (const group of lifecycle.groups ?? []) {
		for (const item of group.refs ?? []) {
			const itemKey = key(item.kind, item.id);
			if (index.has(itemKey)) duplicates.push(`${item.kind}:${item.id}`);
			index.set(itemKey, { ...group, refs: undefined });
		}
	}
	return { index, duplicates };
}

export function buildLifecycleInventory(root) {
	const data = join(root, 'data');
	const projectFile = readJson(join(data, 'project.json'));
	const project = projectFile.project;
	const assetsFile = readJson(join(data, 'assets.json'));
	const assets = assetsFile.assets ?? [];
	const entities = [];
	for (const [filename, collection] of [
		['characters.json', 'characters'],
		['locations.json', 'locations'],
		['objects.json', 'objects'],
		['vehicles.json', 'vehicles'],
		['factions.json', 'factions']
	]) {
		for (const item of readJson(join(data, filename))[collection] ?? []) {
			entities.push({ ...item, catalog: filename });
		}
	}
	const voiceProfiles = readJson(join(data, 'voice-profiles.json')).voiceProfiles ?? [];
	const variants = readJson(join(data, 'entity-variants.json')).variants ?? [];
	const functions = readJson(join(data, 'narrative-functions.json')).functions ?? [];
	const taxonomy = readJson(join(data, 'comparison-taxonomy.json'));
	const documents = readJson(join(data, 'documents.json')).documents ?? [];
	const contexts = readJson(join(data, 'production/contexts.json')).contexts ?? [];
	const records = [ref('project', project.id, project.title, 'data/project.json')];
	for (const path of [join(root, 'AGENTS.md'), join(root, 'README.md'), join(root, 'TODO.md'), join(root, 'CHANGELOG.md'), join(root, 'data/README.md')]) {
		if (!existsSync(path)) continue;
		const id = relative(root, path).replaceAll('\\', '/');
		records.push(ref('static_file', id, id, id));
	}
	for (const path of filesUnder(join(root, 'docs')).filter((item) => item.endsWith('.md'))) {
		const id = relative(root, path).replaceAll('\\', '/');
		records.push(ref('static_file', id, id, id));
	}
	for (const item of project.continuities ?? []) records.push(ref('continuity', item.id, item.id, 'data/project.json'));
	for (const item of project.scripts ?? []) {
		records.push(ref('script', item.id, item.id, 'data/project.json'));
		records.push(ref('animatic', item.id, item.id, `data/scripts/${item.id.replace('script:', '')}.json`));
	}
	for (const filename of readdirSync(join(data, 'outlines')).filter((item) => item.endsWith('.json'))) {
		if (filename.includes('.import-candidate.')) continue;
		const outline = readJson(join(data, 'outlines', filename));
		records.push(ref('outline', outline.outline.id, outline.outline.id, `data/outlines/${filename}`));
	}
	for (const item of entities) records.push(ref('entity', item.id, item.name?.es ?? item.id, `data/${item.catalog}`));
	for (const item of assets) records.push(ref('asset', item.id, item.title?.es ?? item.id, 'data/assets.json'));
	for (const item of voiceProfiles) records.push(ref('voice_profile', item.id, item.id, 'data/voice-profiles.json'));
	for (const item of variants) records.push(ref('entity_variant', item.id, item.id, 'data/entity-variants.json'));
	for (const item of functions) records.push(ref('narrative_function', item.id, item.label?.es ?? item.id, 'data/narrative-functions.json'));
	for (const item of [...(taxonomy.canonDimensions ?? []), ...(taxonomy.majorEvents ?? [])]) {
		records.push(ref('comparison_item', item.id, item.label?.es ?? item.id, 'data/comparison-taxonomy.json'));
	}
	for (const item of documents) records.push(ref('document', item.id, item.title ?? item.id, 'data/documents.json'));
	for (const item of contexts) records.push(ref('production_context', item.id, item.label?.es ?? item.id, 'data/production/contexts.json'));
	const plansDir = join(data, 'production/plans');
	for (const filename of readdirSync(plansDir).filter((item) => item.endsWith('.json'))) {
		const plan = readJson(join(plansDir, filename));
		records.push(ref('production_plan', plan.plan.scriptId, plan.plan.scriptId, `data/production/plans/${filename}`));
	}
	const continuityDir = join(data, 'continuity');
	for (const filename of readdirSync(continuityDir).filter((item) => item.endsWith('.json'))) {
		const ledger = readJson(join(continuityDir, filename));
		records.push(ref('continuity_ledger', ledger.ledger.scriptId, ledger.ledger.scriptId, `data/continuity/${filename}`));
	}
	records.push(ref('archive', 'archive:main-short-unplaced-action-cues', 'Acciones huérfanas del corto anterior', 'data/archive/main-short-unplaced-action-cues.json'));
	return { projectFile, project, assets, entities, voiceProfiles, variants, functions, taxonomy, documents, contexts, records };
}

export function classifyInventory(root) {
	const lifecycle = loadLifecycle(root);
	const inventory = buildLifecycleInventory(root);
	const { index, duplicates } = explicitLifecycleIndex(lifecycle);
	const inventoryKeys = new Set(inventory.records.map((item) => key(item.kind, item.id)));
	for (const group of lifecycle.groups ?? []) {
		for (const item of group.refs ?? []) {
			if (inventoryKeys.has(key(item.kind, item.id))) continue;
			inventory.records.push(ref(item.kind, item.id, item.id, 'data/editorial-lifecycle.json'));
			inventoryKeys.add(key(item.kind, item.id));
		}
	}
	const entityByAsset = new Map();
	for (const entity of inventory.entities) {
		for (const assetId of entity.referenceAssetIds ?? []) {
			const list = entityByAsset.get(assetId) ?? [];
			list.push(entity.id);
			entityByAsset.set(assetId, list);
		}
	}
	const characterByVoice = new Map();
	for (const character of inventory.entities.filter((item) => item.id.startsWith('character:'))) {
		const voiceId = character.defaultVoiceProfileId ?? character.voiceProfileId;
		if (!voiceId) continue;
		const list = characterByVoice.get(voiceId) ?? [];
		list.push(character.id);
		characterByVoice.set(voiceId, list);
	}
	function explicit(kind, id) {
		return index.get(key(kind, id));
	}
	function derived(record) {
		const direct = explicit(record.kind, record.id);
		if (direct) return { ...direct, basis: 'explicit' };
		if (record.kind === 'asset') {
			const asset = inventory.assets.find((item) => item.id === record.id);
			if (asset?.role === 'animatic_placeholder') {
				return { status: 'active', relevance: 'platform', disposition: 'retain', basis: 'asset-role' };
			}
			if (asset?.role === 'animatic') {
				return { status: 'obsolete', relevance: 'unrelated', disposition: 'delete_after_gates', basis: 'deprecated-animatic' };
			}
			const owners = entityByAsset.get(record.id) ?? [];
			if (owners.length) {
				const ownerStates = owners.map((id) => derived(ref('entity', id)));
				if (ownerStates.every((item) => item.status === 'obsolete')) {
					return { status: 'obsolete', relevance: 'unrelated', disposition: 'delete_after_gates', basis: 'obsolete-entity-only' };
				}
				return { status: 'review_required', relevance: 'uncertain', disposition: 'retain', basis: 'active-entity-reference' };
			}
		}
		if (record.kind === 'voice_profile') {
			const owners = characterByVoice.get(record.id) ?? [];
			if (owners.length && owners.every((id) => derived(ref('entity', id)).status === 'obsolete')) {
				return { status: 'obsolete', relevance: 'unrelated', disposition: 'delete_after_gates', basis: 'obsolete-character-only' };
			}
		}
		return {
			status: lifecycle.defaults.unclassifiedStatus,
			relevance: lifecycle.defaults.unclassifiedRelevance,
			disposition: lifecycle.defaults.unclassifiedDisposition,
			basis: 'default-review'
		};
	}
	const classified = inventory.records.map((record) => ({ ...record, lifecycle: derived(record) }));
	return { lifecycle, inventory, classified, duplicates, explicit };
}

export function localizedReason(record, language = 'es') {
	return record.lifecycle.reason?.[language] ?? record.lifecycle.reason?.es ?? '';
}
