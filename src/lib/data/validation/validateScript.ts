import type { ValidationResult } from '$lib/types/common';
import type { Cue, ScriptFile } from '$lib/types/script';

function uniqueIds(label: string, ids: string[], errors: string[]) {
	const seen = new Set<string>();
	for (const id of ids) {
		if (!id) {
			errors.push(`${label}: empty id`);
			continue;
		}
		if (seen.has(id)) errors.push(`${label}: duplicate id ${id}`);
		seen.add(id);
	}
}

function validateDialogueCue(cue: Cue, sourceLanguage: string, errors: string[]) {
	if (cue.type !== 'dialogue') return;
	if (!cue.speakerId) errors.push(`script: dialogue ${cue.id} missing speakerId`);
	if (!cue.content) {
		errors.push(`script: dialogue ${cue.id} missing content`);
		return;
	}
	if (cue.content.sourceLanguage !== sourceLanguage) {
		errors.push(`script: dialogue ${cue.id} content.sourceLanguage must be "${sourceLanguage}"`);
	}
	const sourceVariant = cue.content.variants?.[sourceLanguage];
	if (!sourceVariant) {
		errors.push(`script: dialogue ${cue.id} missing source variant "${sourceLanguage}"`);
		return;
	}
	if (sourceVariant.status !== 'source') {
		errors.push(`script: dialogue ${cue.id} source variant must have status "source"`);
	}
	if (!sourceVariant.spokenText?.trim()) {
		errors.push(`script: dialogue ${cue.id} source spokenText is empty`);
	}
	for (const [tag, variant] of Object.entries(cue.content.variants ?? {})) {
		if (tag !== sourceLanguage && variant.status === 'source') {
			errors.push(
				`script: dialogue ${cue.id} non-source language "${tag}" must not use status "source"`
			);
		}
	}
}

export function validateScript(
	file: ScriptFile,
	options: { sourceLanguage?: string; expectShotCount?: number; expectSceneCount?: number } = {}
): ValidationResult {
	const errors: string[] = [];
	const sourceLanguage = options.sourceLanguage ?? 'es';

	if (!file?.schemaVersion) errors.push('script: missing schemaVersion');
	if (!file?.script?.id) errors.push('script: missing script.id');
	if (!Array.isArray(file?.acts)) errors.push('script: missing acts');
	if (!Array.isArray(file?.scenes)) errors.push('script: missing scenes');
	if (!Array.isArray(file?.beats)) errors.push('script: missing beats');
	if (!Array.isArray(file?.cues)) errors.push('script: missing cues');
	if (!Array.isArray(file?.shots)) errors.push('script: missing shots');
	if (!Array.isArray(file?.takes)) errors.push('script: missing takes');

	if (!file) return { ok: false, errors };

	uniqueIds(
		'script.acts',
		file.acts.map((a) => a.id),
		errors
	);
	uniqueIds(
		'script.scenes',
		file.scenes.map((s) => s.id),
		errors
	);
	uniqueIds(
		'script.beats',
		file.beats.map((b) => b.id),
		errors
	);
	uniqueIds(
		'script.cues',
		file.cues.map((c) => c.id),
		errors
	);
	uniqueIds(
		'script.shots',
		file.shots.map((s) => s.id),
		errors
	);
	uniqueIds(
		'script.takes',
		file.takes.map((t) => t.id),
		errors
	);

	if (options.expectSceneCount != null && file.scenes.length !== options.expectSceneCount) {
		errors.push(`script: expected ${options.expectSceneCount} scenes, got ${file.scenes.length}`);
	}
	if (options.expectShotCount != null && file.shots.length !== options.expectShotCount) {
		errors.push(`script: expected ${options.expectShotCount} shots, got ${file.shots.length}`);
	}

	const takeById = new Map(file.takes.map((t) => [t.id, t]));
	for (const shot of file.shots) {
		if (!shot.selectedTakeId) {
			errors.push(`script: shot ${shot.id} missing selectedTakeId`);
		} else if (!takeById.has(shot.selectedTakeId)) {
			errors.push(`script: shot ${shot.id} selectedTakeId not found`);
		}
		if (!Array.isArray(shot.cuePlacements)) {
			errors.push(`script: shot ${shot.id} missing cuePlacements`);
		}
		if (typeof shot.durationMs !== 'number' || shot.durationMs < 0) {
			errors.push(`script: shot ${shot.id} invalid durationMs`);
		}
	}

	for (const cue of file.cues) {
		validateDialogueCue(cue, sourceLanguage, errors);
	}

	return { ok: errors.length === 0, errors };
}
