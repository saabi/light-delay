/** Validate complete English coverage of human-facing structured data. */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data');
const translation = JSON.parse(readFileSync(join(DATA, 'translations', 'public.en.json'), 'utf8'));
const translated = translation.translations ?? {};
const required = new Map();

function add(value, context) {
	if (typeof value !== 'string' || !value.trim()) return;
	const contexts = required.get(value) ?? [];
	contexts.push(context);
	required.set(value, contexts);
}

function notes(items, context) {
	for (const [index, note] of (items ?? []).entries()) add(note.text, `${context}.notes[${index}]`);
}

const project = JSON.parse(readFileSync(join(DATA, 'project.json'), 'utf8')).project;
for (const item of project.scripts ?? []) {
	add(item.label, `project.${item.id}.label`);
	add(item.lineage?.notes, `project.${item.id}.lineage.notes`);
}

for (const filename of readdirSync(join(DATA, 'scripts')).filter((name) =>
	name.endsWith('.json')
)) {
	const file = JSON.parse(readFileSync(join(DATA, 'scripts', filename), 'utf8'));
	const root = `scripts/${filename}`;
	add(file.script.title, `${root}.script.title`);
	add(file.script.lineage?.notes, `${root}.script.lineage.notes`);
	for (const [index, assignment] of (file.script.characterFunctionAssignments ?? []).entries())
		add(assignment.notes, `${root}.script.characterFunctionAssignments[${index}].notes`);
	for (const [index, claim] of (file.script.comparisonProfile?.canonClaims ?? []).entries())
		add(claim.statement, `${root}.script.comparisonProfile.canonClaims[${index}].statement`);
	for (const [index, event] of (file.script.comparisonProfile?.eventCoverage ?? []).entries())
		add(event.note, `${root}.script.comparisonProfile.eventCoverage[${index}].note`);
	for (const item of file.acts) {
		add(item.title, `${root}.${item.id}.title`);
		add(item.dramaticPurpose, `${root}.${item.id}.dramaticPurpose`);
	}
	for (const item of file.sequences) {
		add(item.title, `${root}.${item.id}.title`);
		add(item.summary, `${root}.${item.id}.summary`);
	}
	for (const item of file.scenes) {
		add(item.title, `${root}.${item.id}.title`);
		add(item.summary, `${root}.${item.id}.summary`);
		add(item.dramaticPurpose, `${root}.${item.id}.dramaticPurpose`);
		add(item.setting?.timeOfDay, `${root}.${item.id}.setting.timeOfDay`);
		add(item.setting?.storyTime, `${root}.${item.id}.setting.storyTime`);
		add(item.setting?.continuity, `${root}.${item.id}.setting.continuity`);
		notes(item.notes, `${root}.${item.id}`);
	}
	for (const item of file.beats) {
		add(item.title, `${root}.${item.id}.title`);
		add(item.purpose, `${root}.${item.id}.purpose`);
		add(item.summary, `${root}.${item.id}.summary`);
		notes(item.notes, `${root}.${item.id}`);
	}
	for (const item of file.cues) {
		if (item.type === 'action') add(item.text, `${root}.${item.id}.text`);
		else if (item.type === 'dialogue') {
			const source = item.content?.variants?.[item.content?.sourceLanguage];
			add(source?.spokenText, `${root}.${item.id}.spokenText`);
			add(source?.subtitleText, `${root}.${item.id}.subtitleText`);
			add(source?.pronunciationNote, `${root}.${item.id}.pronunciationNote`);
			add(source?.delivery, `${root}.${item.id}.delivery`);
			add(item.performance?.emotion, `${root}.${item.id}.performance.emotion`);
			add(item.performance?.intention, `${root}.${item.id}.performance.intention`);
		} else if (item.type === 'sound' || item.type === 'music')
			add(item.description, `${root}.${item.id}.description`);
		else if (item.type === 'silence') add(item.purpose, `${root}.${item.id}.purpose`);
		else if (item.type === 'transition') add(item.description, `${root}.${item.id}.description`);
		else if (item.type === 'text') {
			const source = item.content?.variants?.[item.content?.sourceLanguage];
			add(source?.text, `${root}.${item.id}.text`);
		}
		notes(item.notes, `${root}.${item.id}`);
	}
	for (const item of file.shots) {
		add(item.purpose, `${root}.${item.id}.purpose`);
		add(item.description, `${root}.${item.id}.description`);
		for (const key of ['angle', 'framing', 'focus', 'foreground', 'background'])
			add(item.composition?.[key], `${root}.${item.id}.composition.${key}`);
		add(item.camera?.movementDescription, `${root}.${item.id}.camera.movementDescription`);
		add(item.camera?.startFrame, `${root}.${item.id}.camera.startFrame`);
		add(item.camera?.endFrame, `${root}.${item.id}.camera.endFrame`);
		add(item.transitionIn?.description, `${root}.${item.id}.transitionIn.description`);
		add(item.transitionOut?.description, `${root}.${item.id}.transitionOut.description`);
		notes(item.notes, `${root}.${item.id}`);
	}
	for (const item of file.takes) {
		add(item.imageStatus?.explanation, `${root}.${item.id}.imageStatus.explanation`);
		add(item.imageStatus?.replacementBrief, `${root}.${item.id}.imageStatus.replacementBrief`);
		add(item.review?.notes, `${root}.${item.id}.review.notes`);
	}
}

const assets = JSON.parse(readFileSync(join(DATA, 'assets.json'), 'utf8')).assets;
for (const item of assets) {
	add(item.title, `assets.${item.id}.title`);
	add(item.description, `assets.${item.id}.description`);
	add(item.imageStatus?.explanation, `assets.${item.id}.imageStatus.explanation`);
	add(item.imageStatus?.replacementBrief, `assets.${item.id}.imageStatus.replacementBrief`);
}

const taxonomy = JSON.parse(readFileSync(join(DATA, 'comparison-taxonomy.json'), 'utf8'));
for (const item of [...taxonomy.canonDimensions, ...taxonomy.majorEvents]) {
	add(item.label, `comparison.${item.id}.label`);
	add(item.description, `comparison.${item.id}.description`);
}
const functions = JSON.parse(
	readFileSync(join(DATA, 'narrative-functions.json'), 'utf8')
).functions;
for (const item of functions) {
	add(item.label, `functions.${item.id}.label`);
	add(item.description, `functions.${item.id}.description`);
}
const variants = JSON.parse(readFileSync(join(DATA, 'entity-variants.json'), 'utf8')).variants;
for (const item of variants) {
	for (const key of [
		'label',
		'roleOverride',
		'biographyOverride',
		'descriptionOverride',
		'appearanceOverride',
		'costumeOverride'
	])
		add(item[key], `variants.${item.id}.${key}`);
	for (const [index, value] of (item.traitsOverride ?? []).entries())
		add(value, `variants.${item.id}.traitsOverride[${index}]`);
	notes(item.notes, `variants.${item.id}`);
}

const contextFilter = process.argv.find((arg) => arg.startsWith('--context='))?.slice(10);
const offset = Number(process.argv.find((arg) => arg.startsWith('--offset='))?.slice(9) ?? 0);
const limit = Number(process.argv.find((arg) => arg.startsWith('--limit='))?.slice(8) ?? 100);
const missing = [...required].filter(([source]) => !translated[source]);
const orphaned = Object.keys(translated).filter((source) => !required.has(source));
if (process.argv.includes('--all')) {
	const selected = missing.filter(
		([, contexts]) => !contextFilter || contexts.some((context) => context.includes(contextFilter))
	);
	for (const [source, contexts] of selected.slice(offset, offset + limit))
		console.log(JSON.stringify({ source, contexts }, null, 0));
	for (const source of orphaned.slice(offset, offset + limit))
		console.log(JSON.stringify({ orphaned: source }, null, 0));
	console.log(
		`selected=${selected.length} orphaned=${orphaned.length} offset=${offset} limit=${limit}`
	);
}
if (missing.length || orphaned.length) {
	console.error(
		`translation coverage failed: required=${required.size} translated=${Object.keys(translated).length} missing=${missing.length} orphaned=${orphaned.length}`
	);
	for (const [source, contexts] of missing.slice(0, 20))
		console.error(`- missing ${JSON.stringify(source)} (${contexts[0]})`);
	for (const source of orphaned.slice(0, 20)) console.error(`- orphaned ${JSON.stringify(source)}`);
	process.exit(1);
}

console.log(`translation coverage OK: ${required.size} unique source strings`);
