/**
 * Validate inline story i18n coverage (LocalizedString + dialogue/text variants).
 * Entity gallery overlay (entities.en.json) is out of scope for this checker.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sourceLocalizedString } from './lib/localized-string.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data');
const SOURCE = 'es';
const TARGET = 'en';

const missingSource = [];
const missingTarget = [];
const invalidShape = [];

function isMap(value) {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function checkLocalized(value, context, { required = true } = {}) {
	if (value == null) {
		if (required) missingSource.push(context);
		return;
	}
	if (typeof value === 'string') {
		invalidShape.push(`${context}: expected LocalizedString map, got plain string`);
		if (!value.trim()) missingSource.push(context);
		else missingTarget.push(context);
		return;
	}
	if (!isMap(value)) {
		invalidShape.push(`${context}: expected LocalizedString map`);
		return;
	}
	const es = value[SOURCE];
	if (typeof es !== 'string' || !es.trim()) missingSource.push(context);
	const en = value[TARGET];
	if (typeof en !== 'string' || !en.trim()) missingTarget.push(context);
}

function checkNotes(notes, context) {
	for (const [index, note] of (notes ?? []).entries()) {
		checkLocalized(note.text, `${context}.notes[${index}].text`);
	}
}

function checkScript(file, filename) {
	const root = `scripts/${filename}`;
	checkLocalized(file.script?.title, `${root}.script.title`);
	if (file.script?.lineage?.notes != null)
		checkLocalized(file.script.lineage.notes, `${root}.script.lineage.notes`);
	for (const [index, assignment] of (file.script?.characterFunctionAssignments ?? []).entries()) {
		if (assignment.notes != null)
			checkLocalized(
				assignment.notes,
				`${root}.script.characterFunctionAssignments[${index}].notes`
			);
	}
	for (const [index, claim] of (file.script?.comparisonProfile?.canonClaims ?? []).entries()) {
		checkLocalized(
			claim.statement,
			`${root}.script.comparisonProfile.canonClaims[${index}].statement`
		);
	}
	for (const [index, event] of (file.script?.comparisonProfile?.eventCoverage ?? []).entries()) {
		if (event.note != null)
			checkLocalized(
				event.note,
				`${root}.script.comparisonProfile.eventCoverage[${index}].note`
			);
	}
	for (const item of file.acts ?? []) {
		if (item.title != null) checkLocalized(item.title, `${root}.${item.id}.title`);
		if (item.dramaticPurpose != null)
			checkLocalized(item.dramaticPurpose, `${root}.${item.id}.dramaticPurpose`);
	}
	for (const item of file.sequences ?? []) {
		checkLocalized(item.title, `${root}.${item.id}.title`);
		if (item.summary != null) checkLocalized(item.summary, `${root}.${item.id}.summary`);
	}
	for (const item of file.scenes ?? []) {
		checkLocalized(item.title, `${root}.${item.id}.title`);
		checkLocalized(item.summary, `${root}.${item.id}.summary`);
		if (item.dramaticPurpose != null)
			checkLocalized(item.dramaticPurpose, `${root}.${item.id}.dramaticPurpose`);
		for (const key of ['timeOfDay', 'storyTime', 'continuity']) {
			if (item.setting?.[key] != null)
				checkLocalized(item.setting[key], `${root}.${item.id}.setting.${key}`);
		}
		checkNotes(item.notes, `${root}.${item.id}`);
	}
	for (const item of file.beats ?? []) {
		if (item.title != null) checkLocalized(item.title, `${root}.${item.id}.title`);
		checkLocalized(item.purpose, `${root}.${item.id}.purpose`);
		checkLocalized(item.summary, `${root}.${item.id}.summary`);
		checkNotes(item.notes, `${root}.${item.id}`);
	}
	for (const item of file.cues ?? []) {
		if (item.type === 'action') checkLocalized(item.text, `${root}.${item.id}.text`);
		else if (item.type === 'dialogue') {
			const source = item.content?.variants?.[item.content?.sourceLanguage ?? SOURCE];
			const en = item.content?.variants?.[TARGET];
			if (!source?.spokenText?.trim()) missingSource.push(`${root}.${item.id}.spokenText`);
			if (!en?.spokenText?.trim()) missingTarget.push(`${root}.${item.id}.variants.en`);
			if (item.performance?.emotion != null)
				checkLocalized(item.performance.emotion, `${root}.${item.id}.performance.emotion`);
			if (item.performance?.intention != null)
				checkLocalized(item.performance.intention, `${root}.${item.id}.performance.intention`);
		} else if (item.type === 'sound' || item.type === 'music')
			checkLocalized(item.description, `${root}.${item.id}.description`);
		else if (item.type === 'silence' && item.purpose != null)
			checkLocalized(item.purpose, `${root}.${item.id}.purpose`);
		else if (item.type === 'transition' && item.description != null)
			checkLocalized(item.description, `${root}.${item.id}.description`);
		else if (item.type === 'text') {
			const source = item.content?.variants?.[item.content?.sourceLanguage ?? SOURCE];
			const en = item.content?.variants?.[TARGET];
			if (!source?.text?.trim()) missingSource.push(`${root}.${item.id}.text`);
			if (!en?.text?.trim()) missingTarget.push(`${root}.${item.id}.variants.en`);
		}
		checkNotes(item.notes, `${root}.${item.id}`);
	}
	for (const item of file.shots ?? []) {
		if (item.purpose != null) checkLocalized(item.purpose, `${root}.${item.id}.purpose`);
		checkLocalized(item.description, `${root}.${item.id}.description`);
		for (const key of ['angle', 'framing', 'focus', 'foreground', 'background']) {
			if (item.composition?.[key] != null)
				checkLocalized(item.composition[key], `${root}.${item.id}.composition.${key}`);
		}
		for (const key of ['movementDescription', 'startFrame', 'endFrame']) {
			if (item.camera?.[key] != null)
				checkLocalized(item.camera[key], `${root}.${item.id}.camera.${key}`);
		}
		if (item.transitionIn?.description != null)
			checkLocalized(
				item.transitionIn.description,
				`${root}.${item.id}.transitionIn.description`
			);
		if (item.transitionOut?.description != null)
			checkLocalized(
				item.transitionOut.description,
				`${root}.${item.id}.transitionOut.description`
			);
		checkNotes(item.notes, `${root}.${item.id}`);
	}
	for (const item of file.takes ?? []) {
		if (item.imageStatus?.explanation != null)
			checkLocalized(item.imageStatus.explanation, `${root}.${item.id}.imageStatus.explanation`);
		if (item.imageStatus?.replacementBrief != null)
			checkLocalized(
				item.imageStatus.replacementBrief,
				`${root}.${item.id}.imageStatus.replacementBrief`
			);
		if (item.review?.notes != null)
			checkLocalized(item.review.notes, `${root}.${item.id}.review.notes`);
	}
}

function checkOutline(file, filename) {
	const root = `outlines/${filename}`;
	checkLocalized(file.outline?.title, `${root}.outline.title`);
	for (const step of file.steps ?? []) {
		checkLocalized(step.title, `${root}.${step.id}.title`);
		checkLocalized(step.summary, `${root}.${step.id}.summary`);
		checkNotes(step.notes, `${root}.${step.id}`);
	}
}

const project = JSON.parse(readFileSync(join(DATA, 'project.json'), 'utf8')).project;
for (const item of project.scripts ?? []) {
	checkLocalized(item.label, `project.${item.id}.label`);
	if (item.lineage?.notes != null)
		checkLocalized(item.lineage.notes, `project.${item.id}.lineage.notes`);
}

for (const filename of readdirSync(join(DATA, 'scripts')).filter((n) => n.endsWith('.json'))) {
	checkScript(JSON.parse(readFileSync(join(DATA, 'scripts', filename), 'utf8')), filename);
}

const outlinesDir = join(DATA, 'outlines');
if (existsSync(outlinesDir)) {
	for (const filename of readdirSync(outlinesDir).filter((n) => n.endsWith('.json'))) {
		checkOutline(JSON.parse(readFileSync(join(outlinesDir, filename), 'utf8')), filename);
	}
}

const assets = JSON.parse(readFileSync(join(DATA, 'assets.json'), 'utf8')).assets;
for (const item of assets) {
	if (item.title != null) checkLocalized(item.title, `assets.${item.id}.title`);
	if (item.description != null) checkLocalized(item.description, `assets.${item.id}.description`);
	if (item.imageStatus?.explanation != null)
		checkLocalized(item.imageStatus.explanation, `assets.${item.id}.imageStatus.explanation`);
	if (item.imageStatus?.replacementBrief != null)
		checkLocalized(
			item.imageStatus.replacementBrief,
			`assets.${item.id}.imageStatus.replacementBrief`
		);
}

const taxonomy = JSON.parse(readFileSync(join(DATA, 'comparison-taxonomy.json'), 'utf8'));
for (const item of [...taxonomy.canonDimensions, ...taxonomy.majorEvents]) {
	checkLocalized(item.label, `comparison.${item.id}.label`);
	if (item.description != null)
		checkLocalized(item.description, `comparison.${item.id}.description`);
}

const functions = JSON.parse(readFileSync(join(DATA, 'narrative-functions.json'), 'utf8')).functions;
for (const item of functions) {
	checkLocalized(item.label, `functions.${item.id}.label`);
	if (item.description != null)
		checkLocalized(item.description, `functions.${item.id}.description`);
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
	]) {
		if (item[key] != null) checkLocalized(item[key], `variants.${item.id}.${key}`);
	}
	for (const [index, value] of (item.traitsOverride ?? []).entries()) {
		checkLocalized(value, `variants.${item.id}.traitsOverride[${index}]`);
	}
	checkNotes(item.notes, `variants.${item.id}`);
}

// Sanity: sourceLocalizedString still works on a known field
const sampleTitle = project.scripts?.[0]?.label;
if (!sourceLocalizedString(sampleTitle, SOURCE)) {
	invalidShape.push('project.scripts[0].label: unreadable LocalizedString');
}

const failed =
	missingSource.length > 0 || missingTarget.length > 0 || invalidShape.length > 0;

console.log(
	JSON.stringify(
		{
			ok: !failed,
			missingSource: missingSource.length,
			missingTarget: missingTarget.length,
			invalidShape: invalidShape.length,
			missingSourceSample: missingSource.slice(0, 20),
			missingTargetSample: missingTarget.slice(0, 20),
			invalidShapeSample: invalidShape.slice(0, 20),
			note: 'Entity gallery overlay (entities.en.json) is validated separately / later.'
		},
		null,
		2
	)
);

if (failed) process.exit(1);
