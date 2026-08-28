import {
	analyzeShotDialogue as analyzeShotDialogueCore,
	estimateCueSpokenMs as estimateCueSpokenMsCore,
	estimateSceneSpokenMs as estimateSceneSpokenMsCore,
	estimateScriptSpokenMs as estimateScriptSpokenMsCore,
	estimateShotSpokenMs as estimateShotSpokenMsCore,
	montageSceneMs as montageSceneMsCore,
	montageScriptMs as montageScriptMsCore,
	montageShotMs as montageShotMsCore
} from '../../../../scripts/lib/dialogue-timing.mjs';
import { durationFromEdits, type AnimaticEdits } from '$lib/state/animatic-overlay';
import type { LanguageTag } from '$lib/types/i18n';
import type { Cue, ScriptFile, Shot } from '$lib/types/script';

export type ShotDialogueAnalysis = ReturnType<typeof analyzeShotDialogueCore>;

export function estimateCueSpokenMs(
	cue: Cue,
	language: LanguageTag,
	projectFallback: LanguageTag = 'es'
): number {
	return estimateCueSpokenMsCore(cue, language, projectFallback);
}

export function montageShotMs(
	shot: Shot,
	edits?: Pick<AnimaticEdits, 'shotDurations'>
): number {
	if (!edits) return montageShotMsCore(shot);
	return durationFromEdits(
		{ scriptId: '', scriptVersion: '', shotDurations: edits.shotDurations },
		shot.id,
		shot.durationMs
	);
}

export function montageSceneMs(
	script: ScriptFile,
	sceneId: string,
	edits?: Pick<AnimaticEdits, 'shotDurations'>
): number {
	return montageSceneMsCore(script, sceneId, edits?.shotDurations);
}

export function montageScriptMs(
	script: ScriptFile,
	edits?: Pick<AnimaticEdits, 'shotDurations'>
): number {
	return montageScriptMsCore(script, edits?.shotDurations);
}

export function estimateShotSpokenMs(
	script: ScriptFile,
	shot: Shot,
	language: LanguageTag,
	projectFallback: LanguageTag = 'es'
): number {
	return estimateShotSpokenMsCore(script, shot, language, projectFallback);
}

export function estimateSceneSpokenMs(
	script: ScriptFile,
	sceneId: string,
	language: LanguageTag,
	projectFallback: LanguageTag = 'es'
): number {
	return estimateSceneSpokenMsCore(script, sceneId, language, projectFallback);
}

export function estimateScriptSpokenMs(
	script: ScriptFile,
	language: LanguageTag,
	projectFallback: LanguageTag = 'es'
): number {
	return estimateScriptSpokenMsCore(script, language, projectFallback);
}

export function analyzeShotDialogue(
	script: ScriptFile,
	shot: Shot,
	language: LanguageTag,
	projectFallback: LanguageTag = 'es'
): ShotDialogueAnalysis {
	return analyzeShotDialogueCore(script, shot, language, projectFallback);
}
