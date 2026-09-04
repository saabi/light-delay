import type { Asset } from '$lib/types/assets';
import type { ComparisonTaxonomyFile } from '$lib/types/comparison';
import type { Note } from '$lib/types/common';
import type { StoryText } from '$lib/types/i18n';
import type { OutlineFile, OutlineProseBlock } from '$lib/types/outline';
import type { EntityVariant, NarrativeFunctionsFile, ScriptFile } from '$lib/types/script';
import type { ScriptRegistryEntry } from '$lib/types/project';
import { resolveLocalizedString } from './localized.ts';

const SOURCE_LANGUAGE = 'es';

/**
 * Resolve co-located story text (LocalizedString or legacy plain string) for UI.
 * Overlay catalogs are no longer used for story copy.
 */
export function translatePublicText(
	value: StoryText | undefined,
	language: string,
	sourceLanguage: string = SOURCE_LANGUAGE
): string | undefined {
	return resolveLocalizedString(value, language, {
		sourceLanguage,
		fallbackLanguage: sourceLanguage
	});
}

function resolveText(
	value: StoryText | undefined,
	language: string,
	sourceLanguage: string = SOURCE_LANGUAGE
): string | undefined {
	return translatePublicText(value, language, sourceLanguage);
}

function resolveRequired(value: StoryText | undefined, language: string, fallback = ''): string {
	return resolveText(value, language) ?? fallback;
}

function translateNotes(notes: Note[] | undefined, language: string): Note[] | undefined {
	return notes?.map((note) => ({
		...note,
		text: resolveRequired(note.text, language)
	}));
}

/**
 * Flatten LocalizedString story fields to plain strings for the requested language.
 * Dialogue/text cues keep LocalizedValue; variants are already co-located on disk.
 */
export function localizeScript(source: ScriptFile, language: string): ScriptFile {
	const script = structuredClone(source);
	const t = (value: StoryText | undefined) => resolveText(value, language);

	script.script.title = resolveRequired(script.script.title, language);
	if (script.script.lineage?.notes != null) {
		script.script.lineage.notes = t(script.script.lineage.notes);
	}
	for (const assignment of script.script.characterFunctionAssignments ?? []) {
		if (assignment.notes != null) assignment.notes = t(assignment.notes);
	}
	for (const claim of script.script.comparisonProfile?.canonClaims ?? []) {
		claim.statement = resolveRequired(claim.statement, language);
	}
	for (const event of script.script.comparisonProfile?.eventCoverage ?? []) {
		if (event.note != null) event.note = t(event.note);
	}

	for (const act of script.acts) {
		if (act.title != null) act.title = t(act.title);
		if (act.dramaticPurpose != null) act.dramaticPurpose = t(act.dramaticPurpose);
	}
	for (const sequence of script.sequences) {
		sequence.title = resolveRequired(sequence.title, language);
		if (sequence.summary != null) sequence.summary = t(sequence.summary);
	}
	for (const scene of script.scenes) {
		scene.title = resolveRequired(scene.title, language);
		scene.summary = resolveRequired(scene.summary, language);
		if (scene.dramaticPurpose != null) scene.dramaticPurpose = t(scene.dramaticPurpose);
		if (scene.setting.timeOfDay != null) scene.setting.timeOfDay = t(scene.setting.timeOfDay);
		if (scene.setting.storyTime != null) scene.setting.storyTime = t(scene.setting.storyTime);
		if (scene.setting.continuity != null) scene.setting.continuity = t(scene.setting.continuity);
		scene.notes = translateNotes(scene.notes, language);
	}
	for (const beat of script.beats) {
		if (beat.title != null) beat.title = t(beat.title);
		beat.purpose = resolveRequired(beat.purpose, language);
		beat.summary = resolveRequired(beat.summary, language);
		beat.notes = translateNotes(beat.notes, language);
	}
	for (const cue of script.cues) {
		cue.notes = translateNotes(cue.notes, language);
		if (cue.type === 'action') cue.text = resolveRequired(cue.text, language);
		else if (cue.type === 'dialogue') {
			if (cue.performance?.emotion != null) cue.performance.emotion = t(cue.performance.emotion);
			if (cue.performance?.intention != null)
				cue.performance.intention = t(cue.performance.intention);
		} else if (cue.type === 'sound' || cue.type === 'music') {
			cue.description = resolveRequired(cue.description, language);
		} else if (cue.type === 'silence' && cue.purpose != null) cue.purpose = t(cue.purpose);
		else if (cue.type === 'transition' && cue.description != null)
			cue.description = t(cue.description);
	}

	for (const shot of script.shots) {
		if (shot.purpose != null) shot.purpose = t(shot.purpose);
		shot.description = resolveRequired(shot.description, language);
		for (const key of ['angle', 'framing', 'focus', 'foreground', 'background'] as const) {
			if (shot.composition[key] != null) shot.composition[key] = t(shot.composition[key]);
		}
		if (shot.camera?.movementDescription != null)
			shot.camera.movementDescription = t(shot.camera.movementDescription);
		if (shot.camera?.startFrame != null) shot.camera.startFrame = t(shot.camera.startFrame);
		if (shot.camera?.endFrame != null) shot.camera.endFrame = t(shot.camera.endFrame);
		if (shot.transitionIn?.description != null)
			shot.transitionIn.description = t(shot.transitionIn.description);
		if (shot.transitionOut?.description != null)
			shot.transitionOut.description = t(shot.transitionOut.description);
		shot.notes = translateNotes(shot.notes, language);
	}
	for (const take of script.takes) {
		if (take.imageStatus?.explanation != null)
			take.imageStatus.explanation = t(take.imageStatus.explanation);
		if (take.imageStatus?.replacementBrief != null)
			take.imageStatus.replacementBrief = t(take.imageStatus.replacementBrief);
		if (take.review?.notes != null) take.review.notes = t(take.review.notes);
	}

	return script;
}

export function localizeScriptRegistryEntries(
	source: ScriptRegistryEntry[],
	language: string
): ScriptRegistryEntry[] {
	return structuredClone(source).map((entry) => ({
		...entry,
		label: resolveRequired(entry.label, language),
		lineage: entry.lineage
			? {
					...entry.lineage,
					notes: resolveText(entry.lineage.notes, language)
				}
			: undefined
	}));
}

export function localizeAsset(source: Asset, language: string): Asset {
	const asset = structuredClone(source);
	asset.title = resolveText(asset.title, language);
	asset.description = resolveText(asset.description, language);
	if (asset.imageStatus?.explanation != null)
		asset.imageStatus.explanation = resolveText(asset.imageStatus.explanation, language);
	if (asset.imageStatus?.replacementBrief != null)
		asset.imageStatus.replacementBrief = resolveText(asset.imageStatus.replacementBrief, language);
	return asset;
}

export function localizeComparisonTaxonomy(
	source: ComparisonTaxonomyFile,
	language: string
): ComparisonTaxonomyFile {
	const file = structuredClone(source);
	for (const item of [...file.canonDimensions, ...file.majorEvents]) {
		item.label = resolveRequired(item.label, language);
		item.description = resolveText(item.description, language);
	}
	return file;
}

export function localizeNarrativeFunctions(
	source: NarrativeFunctionsFile,
	language: string
): NarrativeFunctionsFile {
	const file = structuredClone(source);
	for (const item of file.functions) {
		item.label = resolveRequired(item.label, language);
		item.description = resolveText(item.description, language);
	}
	return file;
}

export function localizeEntityVariants(source: EntityVariant[], language: string): EntityVariant[] {
	return structuredClone(source).map((variant) => ({
		...variant,
		label: resolveRequired(variant.label, language),
		roleOverride: resolveText(variant.roleOverride, language),
		traitsOverride: variant.traitsOverride?.map((value) => resolveRequired(value, language)),
		biographyOverride: resolveText(variant.biographyOverride, language),
		descriptionOverride: resolveText(variant.descriptionOverride, language),
		appearanceOverride: resolveText(variant.appearanceOverride, language),
		costumeOverride: resolveText(variant.costumeOverride, language),
		notes: translateNotes(variant.notes, language)
	}));
}

export function localizeOutline(source: OutlineFile, language: string): OutlineFile {
	const file = structuredClone(source);
	file.outline.title = resolveRequired(file.outline.title, language);
	file.outline.synopsis = resolveRequired(file.outline.synopsis, language);
	if (file.outline.editorialNotice != null)
		file.outline.editorialNotice = resolveRequired(file.outline.editorialNotice, language);
	for (const section of file.framing ?? []) {
		section.title = resolveRequired(section.title, language);
		section.blocks = section.blocks.map((block) => localizeOutlineBlock(block, language));
	}
	for (const section of file.storySections ?? []) {
		section.title = resolveRequired(section.title, language);
	}
	for (const step of file.steps) {
		step.title = resolveRequired(step.title, language);
		if (step.summary != null) step.summary = resolveRequired(step.summary, language);
		if (step.body) step.body = step.body.map((block) => localizeOutlineBlock(block, language));
		for (const link of step.causalLinks ?? []) {
			link.explanation = resolveRequired(link.explanation, language);
		}
		step.notes = translateNotes(step.notes, language);
	}
	return file;
}

function localizeOutlineBlock(block: OutlineProseBlock, language: string): OutlineProseBlock {
	if (block.type === 'list') {
		return {
			...block,
			items: block.items.map((item) => resolveRequired(item, language))
		};
	}
	return { ...block, text: resolveRequired(block.text, language) };
}

export function publicTranslationStatus() {
	return {
		language: 'en',
		status: 'inline' as const,
		note: 'Story copy lives as LocalizedString / variants.* in JSON; entities.en.json remains a separate overlay.'
	};
}
