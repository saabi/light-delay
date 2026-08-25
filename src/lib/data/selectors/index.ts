import type { LocalizedResolution, LocalizedValue } from '$lib/types/i18n';
import type { LanguageTag } from '$lib/types/common';
import type { DialogueVariant, ScriptFile, Shot, Take } from '$lib/types/script';

function baseLanguage(tag: LanguageTag): LanguageTag {
	return tag.split('-')[0] ?? tag;
}

export function resolveLocalized<T>(
	content: LocalizedValue<T>,
	requestedLanguage: LanguageTag,
	projectFallback: LanguageTag
): LocalizedResolution<T> | undefined {
	const order = [
		requestedLanguage,
		baseLanguage(requestedLanguage),
		content.sourceLanguage,
		projectFallback
	];
	const seen = new Set<string>();
	for (const lang of order) {
		if (!lang || seen.has(lang)) continue;
		seen.add(lang);
		const value = content.variants[lang];
		if (value !== undefined) {
			return {
				requestedLanguage,
				resolvedLanguage: lang,
				value,
				usedFallback: lang !== requestedLanguage
			};
		}
	}
	return undefined;
}

export function getEffectiveDuration(script: ScriptFile, sceneId?: string): number {
	const shots = sceneId ? script.shots.filter((s) => s.sceneId === sceneId) : script.shots;
	return shots.reduce((sum, shot) => sum + (shot.durationMs || 0), 0);
}

export function getShotSelectedTake(script: ScriptFile, shot: Shot): Take | undefined {
	if (!shot.selectedTakeId) return undefined;
	return script.takes.find((t) => t.id === shot.selectedTakeId);
}

export function getDialogueVariant(
	script: ScriptFile,
	cueId: string,
	requestedLanguage: LanguageTag,
	projectFallback: LanguageTag = 'es'
): LocalizedResolution<DialogueVariant> | undefined {
	const cue = script.cues.find((c) => c.id === cueId);
	if (!cue || cue.type !== 'dialogue') return undefined;
	return resolveLocalized(cue.content, requestedLanguage, projectFallback);
}

export interface SubtitleSegment {
	cueId: string;
	shotId: string;
	atMs: number;
	durationMs?: number;
	text: string;
	resolvedLanguage: LanguageTag;
	usedFallback: boolean;
}

/**
 * Derive subtitle segments from shot cue placements + localized dialogue variants.
 * Does not maintain an independent subtitle copy.
 */
export function getSubtitleSegments(
	script: ScriptFile,
	options: {
		dialogueLanguage?: LanguageTag;
		subtitleLanguage?: LanguageTag | null;
		projectFallback?: LanguageTag;
		shotIds?: string[];
	} = {}
): SubtitleSegment[] {
	const dialogueLanguage = options.dialogueLanguage ?? 'es';
	const subtitleLanguage =
		options.subtitleLanguage === undefined ? dialogueLanguage : options.subtitleLanguage;
	if (subtitleLanguage === null) return [];

	const fallback = options.projectFallback ?? 'es';
	const shots = options.shotIds
		? script.shots.filter((s) => options.shotIds!.includes(s.id))
		: script.shots;

	const cueById = new Map(script.cues.map((c) => [c.id, c]));
	const segments: SubtitleSegment[] = [];

	for (const shot of shots) {
		for (const placement of shot.cuePlacements) {
			const cue = cueById.get(placement.cueId);
			if (!cue || cue.type !== 'dialogue') continue;
			const resolved = resolveLocalized(cue.content, subtitleLanguage, fallback);
			if (!resolved) continue;
			const text = resolved.value.subtitleText ?? resolved.value.spokenText;
			if (!text?.trim()) continue;
			segments.push({
				cueId: cue.id,
				shotId: shot.id,
				atMs: placement.atMs,
				durationMs: placement.durationMs,
				text,
				resolvedLanguage: resolved.resolvedLanguage,
				usedFallback: resolved.usedFallback
			});
		}
	}

	return segments;
}
