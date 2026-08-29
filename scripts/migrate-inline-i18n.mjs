/**
 * Migrate Spanish-keyed public.en.json overlay into co-located LocalizedString /
 * variants.en fields on story JSON files.
 *
 * Usage:
 *   node scripts/migrate-inline-i18n.mjs           # dry-run (default)
 *   node scripts/migrate-inline-i18n.mjs --apply   # write files
 *   node scripts/migrate-inline-i18n.mjs --apply --prune-overlay
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data');
const SOURCE_LANG = 'es';
const TARGET_LANG = 'en';
const APPLY = process.argv.includes('--apply');
const PRUNE_OVERLAY = process.argv.includes('--prune-overlay');

const overlayFile = JSON.parse(
	readFileSync(join(DATA, 'translations', 'public.en.json'), 'utf8')
);
const overlay = overlayFile.translations ?? {};

const stats = {
	converted: 0,
	alreadyLocalized: 0,
	enFilled: 0,
	missingEn: [],
	dialogueVariants: 0,
	filesWritten: 0
};

function isPlainObject(value) {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isLocalizedMap(value) {
	return isPlainObject(value) && typeof value[SOURCE_LANG] === 'string';
}

/** Convert a Spanish string (or existing map) into LocalizedString. */
function localizeField(value, context) {
	if (value == null) return value;
	if (typeof value === 'string') {
		if (!value.trim()) return value;
		stats.converted += 1;
		const next = { [SOURCE_LANG]: value };
		if (overlay[value]) {
			next[TARGET_LANG] = overlay[value];
			stats.enFilled += 1;
		} else {
			stats.missingEn.push(context);
		}
		return next;
	}
	if (isLocalizedMap(value)) {
		stats.alreadyLocalized += 1;
		if (!value[TARGET_LANG] && typeof value[SOURCE_LANG] === 'string' && overlay[value[SOURCE_LANG]]) {
			const next = { ...value, [TARGET_LANG]: overlay[value[SOURCE_LANG]] };
			stats.enFilled += 1;
			return next;
		}
		if (!value[TARGET_LANG] && typeof value[SOURCE_LANG] === 'string' && value[SOURCE_LANG].trim()) {
			stats.missingEn.push(context);
		}
		return value;
	}
	return value;
}

function localizeNotes(notes, context) {
	if (!Array.isArray(notes)) return notes;
	return notes.map((note, index) => ({
		...note,
		text: localizeField(note.text, `${context}.notes[${index}].text`)
	}));
}

function translateOrKeep(esValue) {
	if (typeof esValue !== 'string') return esValue;
	return overlay[esValue] ?? esValue;
}

function migrateDialogueVariant(sourceVariant, context) {
	const spoken = sourceVariant.spokenText;
	const hasAny =
		(typeof spoken === 'string' && overlay[spoken]) ||
		(typeof sourceVariant.subtitleText === 'string' && overlay[sourceVariant.subtitleText]) ||
		(typeof sourceVariant.pronunciationNote === 'string' &&
			overlay[sourceVariant.pronunciationNote]) ||
		(typeof sourceVariant.delivery === 'string' && overlay[sourceVariant.delivery]);

	if (typeof spoken === 'string' && spoken.trim() && !overlay[spoken]) {
		stats.missingEn.push(`${context}.spokenText`);
	}

	return {
		spokenText: translateOrKeep(sourceVariant.spokenText),
		subtitleText:
			sourceVariant.subtitleText != null
				? translateOrKeep(sourceVariant.subtitleText)
				: undefined,
		translatorNote: undefined,
		pronunciationNote:
			sourceVariant.pronunciationNote != null
				? translateOrKeep(sourceVariant.pronunciationNote)
				: undefined,
		delivery: sourceVariant.delivery != null ? translateOrKeep(sourceVariant.delivery) : undefined,
		voiceProfileId: undefined,
		audioAssetId: undefined,
		status: 'draft',
		_hadOverlay: hasAny
	};
}

function migrateTextVariant(sourceVariant, context) {
	const text = sourceVariant.text;
	if (typeof text === 'string' && text.trim() && !overlay[text]) {
		stats.missingEn.push(`${context}.text`);
	}
	return {
		text: translateOrKeep(text),
		status: 'draft'
	};
}

function migrateCueContent(cue, context) {
	if (cue.type !== 'dialogue' && cue.type !== 'text') return cue;
	const content = cue.content;
	if (!content?.variants) return cue;
	const sourceLang = content.sourceLanguage ?? SOURCE_LANG;
	const sourceVariant = content.variants[sourceLang];
	if (!sourceVariant) return cue;
	if (content.variants[TARGET_LANG]) {
		stats.alreadyLocalized += 1;
		return cue;
	}
	stats.dialogueVariants += 1;
	const enVariant =
		cue.type === 'dialogue'
			? migrateDialogueVariant(sourceVariant, context)
			: migrateTextVariant(sourceVariant, context);
	const { _hadOverlay, ...clean } = enVariant;
	void _hadOverlay;
	return {
		...cue,
		content: {
			...content,
			variants: {
				...content.variants,
				[TARGET_LANG]: clean
			}
		}
	};
}

function migrateScript(file, filename) {
	const root = `scripts/${filename}`;
	file.schemaVersion = '1.1.0';
	file.script.title = localizeField(file.script.title, `${root}.script.title`);
	if (file.script.lineage?.notes != null) {
		file.script.lineage.notes = localizeField(
			file.script.lineage.notes,
			`${root}.script.lineage.notes`
		);
	}
	for (const [index, assignment] of (file.script.characterFunctionAssignments ?? []).entries()) {
		if (assignment.notes != null) {
			assignment.notes = localizeField(
				assignment.notes,
				`${root}.script.characterFunctionAssignments[${index}].notes`
			);
		}
	}
	for (const [index, claim] of (file.script.comparisonProfile?.canonClaims ?? []).entries()) {
		claim.statement = localizeField(
			claim.statement,
			`${root}.script.comparisonProfile.canonClaims[${index}].statement`
		);
	}
	for (const [index, event] of (file.script.comparisonProfile?.eventCoverage ?? []).entries()) {
		if (event.note != null) {
			event.note = localizeField(
				event.note,
				`${root}.script.comparisonProfile.eventCoverage[${index}].note`
			);
		}
	}

	for (const item of file.acts ?? []) {
		if (item.title != null) item.title = localizeField(item.title, `${root}.${item.id}.title`);
		if (item.dramaticPurpose != null)
			item.dramaticPurpose = localizeField(
				item.dramaticPurpose,
				`${root}.${item.id}.dramaticPurpose`
			);
	}
	for (const item of file.sequences ?? []) {
		item.title = localizeField(item.title, `${root}.${item.id}.title`);
		if (item.summary != null)
			item.summary = localizeField(item.summary, `${root}.${item.id}.summary`);
	}
	for (const item of file.scenes ?? []) {
		item.title = localizeField(item.title, `${root}.${item.id}.title`);
		item.summary = localizeField(item.summary, `${root}.${item.id}.summary`);
		if (item.dramaticPurpose != null)
			item.dramaticPurpose = localizeField(
				item.dramaticPurpose,
				`${root}.${item.id}.dramaticPurpose`
			);
		if (item.setting) {
			for (const key of ['timeOfDay', 'storyTime', 'continuity']) {
				if (item.setting[key] != null)
					item.setting[key] = localizeField(
						item.setting[key],
						`${root}.${item.id}.setting.${key}`
					);
			}
		}
		item.notes = localizeNotes(item.notes, `${root}.${item.id}`);
	}
	for (const item of file.beats ?? []) {
		if (item.title != null) item.title = localizeField(item.title, `${root}.${item.id}.title`);
		item.purpose = localizeField(item.purpose, `${root}.${item.id}.purpose`);
		item.summary = localizeField(item.summary, `${root}.${item.id}.summary`);
		item.notes = localizeNotes(item.notes, `${root}.${item.id}`);
	}

	file.cues = (file.cues ?? []).map((cue) => {
		let next = migrateCueContent(cue, `${root}.${cue.id}`);
		next = { ...next, notes: localizeNotes(next.notes, `${root}.${cue.id}`) };
		if (next.type === 'action') {
			next.text = localizeField(next.text, `${root}.${cue.id}.text`);
		} else if (next.type === 'dialogue') {
			if (next.performance?.emotion != null)
				next.performance.emotion = localizeField(
					next.performance.emotion,
					`${root}.${cue.id}.performance.emotion`
				);
			if (next.performance?.intention != null)
				next.performance.intention = localizeField(
					next.performance.intention,
					`${root}.${cue.id}.performance.intention`
				);
		} else if (next.type === 'sound' || next.type === 'music') {
			next.description = localizeField(next.description, `${root}.${cue.id}.description`);
		} else if (next.type === 'silence' && next.purpose != null) {
			next.purpose = localizeField(next.purpose, `${root}.${cue.id}.purpose`);
		} else if (next.type === 'transition' && next.description != null) {
			next.description = localizeField(next.description, `${root}.${cue.id}.description`);
		}
		return next;
	});

	for (const item of file.shots ?? []) {
		if (item.purpose != null)
			item.purpose = localizeField(item.purpose, `${root}.${item.id}.purpose`);
		item.description = localizeField(item.description, `${root}.${item.id}.description`);
		if (item.composition) {
			for (const key of ['angle', 'framing', 'focus', 'foreground', 'background']) {
				if (item.composition[key] != null)
					item.composition[key] = localizeField(
						item.composition[key],
						`${root}.${item.id}.composition.${key}`
					);
			}
		}
		if (item.camera) {
			for (const key of ['movementDescription', 'startFrame', 'endFrame']) {
				if (item.camera[key] != null)
					item.camera[key] = localizeField(
						item.camera[key],
						`${root}.${item.id}.camera.${key}`
					);
			}
		}
		if (item.transitionIn?.description != null)
			item.transitionIn.description = localizeField(
				item.transitionIn.description,
				`${root}.${item.id}.transitionIn.description`
			);
		if (item.transitionOut?.description != null)
			item.transitionOut.description = localizeField(
				item.transitionOut.description,
				`${root}.${item.id}.transitionOut.description`
			);
		item.notes = localizeNotes(item.notes, `${root}.${item.id}`);
	}

	for (const item of file.takes ?? []) {
		if (item.imageStatus?.explanation != null)
			item.imageStatus.explanation = localizeField(
				item.imageStatus.explanation,
				`${root}.${item.id}.imageStatus.explanation`
			);
		if (item.imageStatus?.replacementBrief != null)
			item.imageStatus.replacementBrief = localizeField(
				item.imageStatus.replacementBrief,
				`${root}.${item.id}.imageStatus.replacementBrief`
			);
		if (item.review?.notes != null)
			item.review.notes = localizeField(item.review.notes, `${root}.${item.id}.review.notes`);
	}

	return file;
}

function migrateOutline(file, filename) {
	const root = `outlines/${filename}`;
	file.schemaVersion = '1.1.0';
	file.outline.title = localizeField(file.outline.title, `${root}.outline.title`);
	for (const step of file.steps ?? []) {
		step.title = localizeField(step.title, `${root}.${step.id}.title`);
		step.summary = localizeField(step.summary, `${root}.${step.id}.summary`);
		step.notes = localizeNotes(step.notes, `${root}.${step.id}`);
	}
	return file;
}

function migrateProject(file) {
	for (const item of file.project.scripts ?? []) {
		item.label = localizeField(item.label, `project.${item.id}.label`);
		if (item.lineage?.notes != null)
			item.lineage.notes = localizeField(item.lineage.notes, `project.${item.id}.lineage.notes`);
	}
	return file;
}

function migrateAssets(file) {
	for (const item of file.assets ?? []) {
		if (item.title != null) item.title = localizeField(item.title, `assets.${item.id}.title`);
		if (item.description != null)
			item.description = localizeField(item.description, `assets.${item.id}.description`);
		if (item.imageStatus?.explanation != null)
			item.imageStatus.explanation = localizeField(
				item.imageStatus.explanation,
				`assets.${item.id}.imageStatus.explanation`
			);
		if (item.imageStatus?.replacementBrief != null)
			item.imageStatus.replacementBrief = localizeField(
				item.imageStatus.replacementBrief,
				`assets.${item.id}.imageStatus.replacementBrief`
			);
	}
	return file;
}

function migrateTaxonomy(file) {
	for (const item of [...(file.canonDimensions ?? []), ...(file.majorEvents ?? [])]) {
		item.label = localizeField(item.label, `comparison.${item.id}.label`);
		if (item.description != null)
			item.description = localizeField(item.description, `comparison.${item.id}.description`);
	}
	return file;
}

function migrateFunctions(file) {
	for (const item of file.functions ?? []) {
		item.label = localizeField(item.label, `functions.${item.id}.label`);
		if (item.description != null)
			item.description = localizeField(item.description, `functions.${item.id}.description`);
	}
	return file;
}

function migrateVariants(file) {
	for (const item of file.variants ?? []) {
		for (const key of [
			'label',
			'roleOverride',
			'biographyOverride',
			'descriptionOverride',
			'appearanceOverride',
			'costumeOverride'
		]) {
			if (item[key] != null) item[key] = localizeField(item[key], `variants.${item.id}.${key}`);
		}
		if (Array.isArray(item.traitsOverride)) {
			item.traitsOverride = item.traitsOverride.map((value, index) =>
				localizeField(value, `variants.${item.id}.traitsOverride[${index}]`)
			);
		}
		item.notes = localizeNotes(item.notes, `variants.${item.id}`);
	}
	return file;
}

function writeJson(path, data) {
	if (!APPLY) return;
	writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
	stats.filesWritten += 1;
}

function loadJson(path) {
	return JSON.parse(readFileSync(path, 'utf8'));
}

function processDomain(label, path, migrate) {
	if (!existsSync(path)) {
		console.log(`skip ${label}: missing ${path}`);
		return;
	}
	const data = migrate(loadJson(path));
	writeJson(path, data);
	console.log(`${APPLY ? 'wrote' : 'would write'} ${label}`);
}

function processDir(dir, migrate) {
	if (!existsSync(dir)) return;
	for (const filename of readdirSync(dir).filter((name) => name.endsWith('.json'))) {
		const path = join(dir, filename);
		const data = migrate(loadJson(path), filename);
		writeJson(path, data);
		console.log(`${APPLY ? 'wrote' : 'would write'} ${filename}`);
	}
}

console.log(`migrate-inline-i18n (${APPLY ? 'APPLY' : 'dry-run'})`);
processDir(join(DATA, 'scripts'), migrateScript);
processDir(join(DATA, 'outlines'), migrateOutline);
processDomain('project.json', join(DATA, 'project.json'), migrateProject);
processDomain('assets.json', join(DATA, 'assets.json'), migrateAssets);
processDomain('comparison-taxonomy.json', join(DATA, 'comparison-taxonomy.json'), migrateTaxonomy);
processDomain('narrative-functions.json', join(DATA, 'narrative-functions.json'), migrateFunctions);
processDomain('entity-variants.json', join(DATA, 'entity-variants.json'), migrateVariants);

if (APPLY && PRUNE_OVERLAY) {
	const pruned = {
		...overlayFile,
		translations: {},
		_note:
			'Story strings migrated inline (LocalizedString / variants.en). Entity gallery overlay remains in entities.en.json.'
	};
	writeJson(join(DATA, 'translations', 'public.en.json'), pruned);
	console.log('pruned public.en.json translations map');
}

const reportDir = join(ROOT, 'reports', 'i18n');
const report = {
	mode: APPLY ? 'apply' : 'dry-run',
	converted: stats.converted,
	alreadyLocalized: stats.alreadyLocalized,
	enFilled: stats.enFilled,
	dialogueVariants: stats.dialogueVariants,
	filesWritten: stats.filesWritten,
	missingEnCount: stats.missingEn.length,
	missingEn: stats.missingEn.slice(0, 200)
};
if (APPLY) {
	mkdirSync(reportDir, { recursive: true });
	writeFileSync(join(reportDir, 'inline-i18n-migration.json'), `${JSON.stringify(report, null, 2)}\n`);
}

console.log(JSON.stringify({ ...report, missingEnSample: report.missingEn.slice(0, 20) }, null, 2));
if (stats.missingEn.length > 200) {
	console.log(`…and ${stats.missingEn.length - 200} more missing EN contexts`);
}
if (!APPLY) {
	console.log('\nRe-run with --apply to write files. Add --prune-overlay after runtime switch.');
}
