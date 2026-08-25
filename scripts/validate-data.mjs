/**
 * Load data/*.json and run structural checks (JS twin of TS validators).
 * Usage: node scripts/validate-data.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data');

function load(name) {
	return JSON.parse(readFileSync(join(DATA, name), 'utf8'));
}

function unique(label, ids, errors) {
	const seen = new Set();
	for (const id of ids) {
		if (!id) errors.push(`${label}: empty id`);
		else if (seen.has(id)) errors.push(`${label}: duplicate ${id}`);
		seen.add(id);
	}
}

function main() {
	const errors = [];
	const project = load('project.json');
	const script = load('script.json');
	const assets = load('assets.json');
	const characters = load('characters.json');
	const locations = load('locations.json');
	const objects = load('objects.json');
	const vehicles = load('vehicles.json');
	const factions = load('factions.json');
	const voiceProfiles = load('voice-profiles.json');
	const documents = load('documents.json');

	if (!project.schemaVersion) errors.push('project: missing schemaVersion');
	const langs = project.project?.languages;
	if (!langs) errors.push('project: missing languages');
	else {
		if (!/^es(-|$)/i.test(langs.sourceLanguage)) {
			errors.push(`project: sourceLanguage must be Spanish, got ${langs.sourceLanguage}`);
		}
	}

	unique(
		'scenes',
		script.scenes.map((s) => s.id),
		errors
	);
	unique(
		'shots',
		script.shots.map((s) => s.id),
		errors
	);
	unique(
		'takes',
		script.takes.map((t) => t.id),
		errors
	);
	unique(
		'cues',
		script.cues.map((c) => c.id),
		errors
	);
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

	if (script.scenes.length !== 17) {
		errors.push(`expected 17 scenes, got ${script.scenes.length}`);
	}
	if (script.shots.length !== 100) {
		errors.push(`expected 100 shots, got ${script.shots.length}`);
	}

	for (const asset of assets.assets) {
		if (!asset.path?.startsWith('/assets/')) {
			errors.push(`asset ${asset.id} path must start with /assets/: ${asset.path}`);
		}
	}

	const sourceLang = langs?.sourceLanguage || 'es';
	for (const cue of script.cues) {
		if (cue.type !== 'dialogue') continue;
		if (cue.content?.sourceLanguage !== sourceLang) {
			errors.push(`cue ${cue.id}: content.sourceLanguage must be ${sourceLang}`);
		}
		const v = cue.content?.variants?.[sourceLang];
		if (!v || v.status !== 'source') {
			errors.push(`cue ${cue.id}: source variant missing or status != source`);
		}
		if (!v?.spokenText?.trim()) errors.push(`cue ${cue.id}: empty spokenText`);
		for (const [tag, variant] of Object.entries(cue.content?.variants || {})) {
			if (tag !== sourceLang && variant.status === 'source') {
				errors.push(`cue ${cue.id}: non-source lang ${tag} has status source`);
			}
		}
	}

	const takeIds = new Set(script.takes.map((t) => t.id));
	for (const shot of script.shots) {
		if (!shot.selectedTakeId || !takeIds.has(shot.selectedTakeId)) {
			errors.push(`shot ${shot.id}: invalid selectedTakeId`);
		}
	}

	if (errors.length) {
		console.error('validate:data FAILED');
		for (const e of errors) console.error(' -', e);
		process.exit(1);
	}
	console.log('validate:data OK');
	console.log(
		`scenes=${script.scenes.length} shots=${script.shots.length} cues=${script.cues.length} assets=${assets.assets.length}`
	);
}

main();
