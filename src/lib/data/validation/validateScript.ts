import type { ValidationResult } from '$lib/types/common';
import type { Cue, NarrativeFunctionsFile, ScriptFile } from '$lib/types/script';
import type { AssetId, CharacterId } from '$lib/types/ids';
import { validateImageEditorialStatus } from './validateAssets.ts';

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
	options: {
		sourceLanguage?: string;
		expectShotCount?: number;
		expectSceneCount?: number;
		narrativeFunctions?: NarrativeFunctionsFile;
		characterIds?: Set<CharacterId>;
		assetIds?: Set<AssetId>;
		requireSelectedTakes?: boolean;
	} = {}
): ValidationResult {
	const errors: string[] = [];
	const sourceLanguage = options.sourceLanguage ?? 'es';
	const requireSelectedTakes = options.requireSelectedTakes ?? true;

	if (!file?.schemaVersion) errors.push('script: missing schemaVersion');
	if (!file?.script?.id) errors.push('script: missing script.id');
	if (!file?.script?.kind) errors.push('script: missing script.kind');
	if (!file?.script?.continuityId) errors.push('script: missing script.continuityId');
	if (!Array.isArray(file?.acts)) errors.push('script: missing acts');
	if (!Array.isArray(file?.scenes)) errors.push('script: missing scenes');
	if (!Array.isArray(file?.beats)) errors.push('script: missing beats');
	if (!Array.isArray(file?.cues)) errors.push('script: missing cues');
	if (!Array.isArray(file?.shots)) errors.push('script: missing shots');
	if (!Array.isArray(file?.takes)) errors.push('script: missing takes');

	if (!file) return { ok: false, errors };

	const label = `script(${file.script.id})`;

	uniqueIds(
		`${label}.acts`,
		file.acts.map((a) => a.id),
		errors
	);
	uniqueIds(
		`${label}.scenes`,
		file.scenes.map((s) => s.id),
		errors
	);
	uniqueIds(
		`${label}.beats`,
		file.beats.map((b) => b.id),
		errors
	);
	uniqueIds(
		`${label}.cues`,
		file.cues.map((c) => c.id),
		errors
	);
	uniqueIds(
		`${label}.shots`,
		file.shots.map((s) => s.id),
		errors
	);
	uniqueIds(
		`${label}.takes`,
		file.takes.map((t) => t.id),
		errors
	);

	if (options.expectSceneCount != null && file.scenes.length !== options.expectSceneCount) {
		errors.push(`${label}: expected ${options.expectSceneCount} scenes, got ${file.scenes.length}`);
	}
	if (options.expectShotCount != null && file.shots.length !== options.expectShotCount) {
		errors.push(`${label}: expected ${options.expectShotCount} shots, got ${file.shots.length}`);
	}

	const takeById = new Map(file.takes.map((t) => [t.id, t]));
	const shotIds = new Set(file.shots.map((shot) => shot.id));
	for (const shot of file.shots) {
		if (requireSelectedTakes) {
			if (!shot.selectedTakeId) {
				errors.push(`${label}: shot ${shot.id} missing selectedTakeId`);
			} else if (!takeById.has(shot.selectedTakeId)) {
				errors.push(`${label}: shot ${shot.id} selectedTakeId not found`);
			}
		}
		if (!Array.isArray(shot.cuePlacements)) {
			errors.push(`${label}: shot ${shot.id} missing cuePlacements`);
		}
		if (typeof shot.durationMs !== 'number' || shot.durationMs < 0) {
			errors.push(`${label}: shot ${shot.id} invalid durationMs`);
		}
	}

	for (const take of file.takes) {
		if (take.imageAssetId && options.assetIds && !options.assetIds.has(take.imageAssetId)) {
			errors.push(`${label}: take ${take.id} references unknown image asset ${take.imageAssetId}`);
		}
		if (!take.imageStatus) continue;
		validateImageEditorialStatus(take.imageStatus, `${label}: take ${take.id}`, errors);
		if (take.imageStatus.reasons.includes('placeholder') && !take.imageStatus.sourceShotId) {
			errors.push(`${label}: placeholder take ${take.id} requires sourceShotId`);
		}
		if (take.imageStatus.sourceShotId && !shotIds.has(take.imageStatus.sourceShotId)) {
			errors.push(`${label}: take ${take.id} references unknown sourceShotId`);
		}
	}

	for (const cue of file.cues) {
		validateDialogueCue(cue, sourceLanguage, errors);
	}

	const functionIds = new Set((options.narrativeFunctions?.functions ?? []).map((f) => f.id));
	const characterIds = options.characterIds;
	for (const assignment of file.script.characterFunctionAssignments ?? []) {
		if (functionIds.size && !functionIds.has(assignment.functionId)) {
			errors.push(`${label}: unknown functionId ${assignment.functionId}`);
		}
		if (characterIds && !characterIds.has(assignment.characterId)) {
			errors.push(`${label}: assignment character ${assignment.characterId} not in catalog`);
		}
		for (const src of assignment.sourceCharacterIds ?? []) {
			if (characterIds && !characterIds.has(src)) {
				errors.push(`${label}: sourceCharacter ${src} not in catalog`);
			}
		}
	}

	if (file.script.lineage?.sourceScriptId === file.script.id) {
		errors.push(`${label}: lineage.sourceScriptId cannot equal script.id`);
	}

	return { ok: errors.length === 0, errors };
}
