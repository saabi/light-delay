import publicEnglishJson from '../../../../data/translations/public.en.json';
import type { Asset } from '$lib/types/assets';
import type { ComparisonTaxonomyFile } from '$lib/types/comparison';
import type { OutlineFile } from '$lib/types/outline';
import type { EntityVariant, NarrativeFunctionsFile, ScriptFile } from '$lib/types/script';
import type { StringTranslationFile } from '$lib/types/translations';
import type { ScriptRegistryEntry } from '$lib/types/project';

const english = publicEnglishJson as StringTranslationFile;

export function translatePublicText(
	value: string | undefined,
	language: string
): string | undefined {
	if (!value || language !== english.language) return value;
	return english.translations[value] ?? value;
}

function translateNotes<T extends { text: string }>(notes: T[] | undefined, language: string) {
	return notes?.map((note) => ({
		...note,
		text: translatePublicText(note.text, language) ?? note.text
	}));
}

export function localizeScript(source: ScriptFile, language: string): ScriptFile {
	if (language !== english.language) return source;
	const script = structuredClone(source);
	const t = (value: string | undefined) => translatePublicText(value, language);

	script.script.title = t(script.script.title) ?? script.script.title;
	if (script.script.lineage?.notes) script.script.lineage.notes = t(script.script.lineage.notes);
	for (const assignment of script.script.characterFunctionAssignments ?? []) {
		if (assignment.notes) assignment.notes = t(assignment.notes);
	}
	for (const claim of script.script.comparisonProfile?.canonClaims ?? []) {
		claim.statement = t(claim.statement) ?? claim.statement;
	}
	for (const event of script.script.comparisonProfile?.eventCoverage ?? []) {
		if (event.note) event.note = t(event.note);
	}

	for (const act of script.acts) {
		if (act.title) act.title = t(act.title);
		if (act.dramaticPurpose) act.dramaticPurpose = t(act.dramaticPurpose);
	}
	for (const sequence of script.sequences) {
		sequence.title = t(sequence.title) ?? sequence.title;
		if (sequence.summary) sequence.summary = t(sequence.summary);
	}
	for (const scene of script.scenes) {
		scene.title = t(scene.title) ?? scene.title;
		scene.summary = t(scene.summary) ?? scene.summary;
		if (scene.dramaticPurpose) scene.dramaticPurpose = t(scene.dramaticPurpose);
		if (scene.setting.timeOfDay) scene.setting.timeOfDay = t(scene.setting.timeOfDay);
		if (scene.setting.storyTime) scene.setting.storyTime = t(scene.setting.storyTime);
		if (scene.setting.continuity) scene.setting.continuity = t(scene.setting.continuity);
		scene.notes = translateNotes(scene.notes, language);
	}
	for (const beat of script.beats) {
		if (beat.title) beat.title = t(beat.title);
		beat.purpose = t(beat.purpose) ?? beat.purpose;
		beat.summary = t(beat.summary) ?? beat.summary;
		beat.notes = translateNotes(beat.notes, language);
	}
	for (const cue of script.cues) {
		cue.notes = translateNotes(cue.notes, language);
		if (cue.type === 'action') cue.text = t(cue.text) ?? cue.text;
		else if (cue.type === 'dialogue') {
			const sourceVariant = cue.content.variants[cue.content.sourceLanguage];
			if (sourceVariant && !cue.content.variants[language]) {
				cue.content.variants[language] = {
					...sourceVariant,
					spokenText: t(sourceVariant.spokenText) ?? sourceVariant.spokenText,
					subtitleText: t(sourceVariant.subtitleText),
					translatorNote: undefined,
					pronunciationNote: t(sourceVariant.pronunciationNote),
					delivery: t(sourceVariant.delivery),
					voiceProfileId: undefined,
					audioAssetId: undefined,
					status: 'draft'
				};
			}
			if (cue.performance?.emotion) cue.performance.emotion = t(cue.performance.emotion);
			if (cue.performance?.intention) cue.performance.intention = t(cue.performance.intention);
		} else if (cue.type === 'sound' || cue.type === 'music') {
			cue.description = t(cue.description) ?? cue.description;
		} else if (cue.type === 'silence' && cue.purpose) cue.purpose = t(cue.purpose);
		else if (cue.type === 'transition' && cue.description) cue.description = t(cue.description);
		else if (cue.type === 'text') {
			const sourceVariant = cue.content.variants[cue.content.sourceLanguage];
			if (sourceVariant && !cue.content.variants[language]) {
				cue.content.variants[language] = {
					text: t(sourceVariant.text) ?? sourceVariant.text,
					status: 'draft'
				};
			}
		}
	}

	for (const shot of script.shots) {
		if (shot.purpose) shot.purpose = t(shot.purpose);
		shot.description = t(shot.description) ?? shot.description;
		for (const key of ['angle', 'framing', 'focus', 'foreground', 'background'] as const) {
			if (shot.composition[key]) shot.composition[key] = t(shot.composition[key]);
		}
		if (shot.camera?.movementDescription)
			shot.camera.movementDescription = t(shot.camera.movementDescription);
		if (shot.camera?.startFrame) shot.camera.startFrame = t(shot.camera.startFrame);
		if (shot.camera?.endFrame) shot.camera.endFrame = t(shot.camera.endFrame);
		if (shot.transitionIn?.description)
			shot.transitionIn.description = t(shot.transitionIn.description);
		if (shot.transitionOut?.description)
			shot.transitionOut.description = t(shot.transitionOut.description);
		shot.notes = translateNotes(shot.notes, language);
	}
	for (const take of script.takes) {
		if (take.imageStatus?.explanation)
			take.imageStatus.explanation = t(take.imageStatus.explanation);
		if (take.imageStatus?.replacementBrief)
			take.imageStatus.replacementBrief = t(take.imageStatus.replacementBrief);
		if (take.review?.notes) take.review.notes = t(take.review.notes);
	}

	return script;
}

export function localizeScriptRegistryEntries(
	source: ScriptRegistryEntry[],
	language: string
): ScriptRegistryEntry[] {
	if (language !== english.language) return source;
	return structuredClone(source).map((entry) => ({
		...entry,
		label: translatePublicText(entry.label, language) ?? entry.label,
		lineage: entry.lineage
			? {
					...entry.lineage,
					notes: translatePublicText(entry.lineage.notes, language)
				}
			: undefined
	}));
}

export function localizeAsset(source: Asset, language: string): Asset {
	if (language !== english.language) return source;
	const asset = structuredClone(source);
	asset.title = translatePublicText(asset.title, language);
	asset.description = translatePublicText(asset.description, language);
	if (asset.imageStatus?.explanation)
		asset.imageStatus.explanation = translatePublicText(asset.imageStatus.explanation, language);
	if (asset.imageStatus?.replacementBrief)
		asset.imageStatus.replacementBrief = translatePublicText(
			asset.imageStatus.replacementBrief,
			language
		);
	return asset;
}

export function localizeComparisonTaxonomy(
	source: ComparisonTaxonomyFile,
	language: string
): ComparisonTaxonomyFile {
	if (language !== english.language) return source;
	const file = structuredClone(source);
	for (const item of [...file.canonDimensions, ...file.majorEvents]) {
		item.label = translatePublicText(item.label, language) ?? item.label;
		item.description = translatePublicText(item.description, language);
	}
	return file;
}

export function localizeNarrativeFunctions(
	source: NarrativeFunctionsFile,
	language: string
): NarrativeFunctionsFile {
	if (language !== english.language) return source;
	const file = structuredClone(source);
	for (const item of file.functions) {
		item.label = translatePublicText(item.label, language) ?? item.label;
		item.description = translatePublicText(item.description, language);
	}
	return file;
}

export function localizeEntityVariants(source: EntityVariant[], language: string): EntityVariant[] {
	if (language !== english.language) return source;
	return structuredClone(source).map((variant) => ({
		...variant,
		label: translatePublicText(variant.label, language) ?? variant.label,
		roleOverride: translatePublicText(variant.roleOverride, language),
		traitsOverride: variant.traitsOverride?.map(
			(value) => translatePublicText(value, language) ?? value
		),
		biographyOverride: translatePublicText(variant.biographyOverride, language),
		descriptionOverride: translatePublicText(variant.descriptionOverride, language),
		appearanceOverride: translatePublicText(variant.appearanceOverride, language),
		costumeOverride: translatePublicText(variant.costumeOverride, language),
		notes: translateNotes(variant.notes, language)
	}));
}

export function localizeOutline(source: OutlineFile, language: string): OutlineFile {
	if (language !== english.language) return source;
	const file = structuredClone(source);
	const t = (value: string | undefined) => translatePublicText(value, language);
	file.outline.title = t(file.outline.title) ?? file.outline.title;
	for (const step of file.steps) {
		step.title = t(step.title) ?? step.title;
		step.summary = t(step.summary) ?? step.summary;
		step.notes = translateNotes(step.notes, language);
	}
	return file;
}

export function publicTranslationStatus() {
	return { language: english.language, status: english.status };
}
