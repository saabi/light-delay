import type { TimedAudioCue } from '$lib/audio/webAudioCueSequencer';
import { getAssetById } from '$lib/data/repositories/lookups';
import { withBase } from '$lib/utils/paths';
import type { LanguageTag } from '$lib/types/i18n';
import type { Cue, DialogueCue, ScriptFile, Shot } from '$lib/types/script';

export type AnimaticDialogueTimelineCue = TimedAudioCue & {
	cueId: string;
	shotId: string;
	relativeAtMs: number;
	durationMs?: number;
};

function isDialogueCue(cue: Cue | undefined): cue is DialogueCue {
	return Boolean(cue && cue.type === 'dialogue');
}

function assetUrl(assetId: string): string | undefined {
	const asset = getAssetById(assetId);
	if (!asset || asset.kind !== 'audio' || !asset.path) return undefined;
	return withBase(asset.path.startsWith('/') ? asset.path : `/${asset.path}`);
}

/**
 * Build an absolute dialogue timeline from shot-relative cue placements.
 * Skips dialogue without a resolvable audioAssetId.
 * Prefers the active dialogue language, then falls back to any variant that
 * already has linked audio (EN source first) so movie mode is not silent
 * when only one language has been promoted.
 */
export function buildShotDialogueTimeline(
	script: ScriptFile,
	shotDurationsMs: number[],
	dialogueLanguage: LanguageTag,
	projectFallback: LanguageTag = 'es'
): AnimaticDialogueTimelineCue[] {
	const cueById = new Map(script.cues.map((cue) => [cue.id, cue]));
	const out: AnimaticDialogueTimelineCue[] = [];
	let shotOriginMs = 0;

	script.shots.forEach((shot: Shot, shotIndex: number) => {
		const duration = shotDurationsMs[shotIndex] ?? shot.durationMs;
		for (const placement of shot.cuePlacements) {
			const cue = cueById.get(placement.cueId);
			if (!isDialogueCue(cue)) continue;

			const preferred =
				cue.content.variants[dialogueLanguage] ?? cue.content.variants[projectFallback];
			const audioVariant =
				(preferred?.audioAssetId ? preferred : undefined) ??
				cue.content.variants.en ??
				cue.content.variants.es ??
				Object.values(cue.content.variants).find((v) => v?.audioAssetId);
			const audioAssetId = audioVariant?.audioAssetId;
			if (!audioAssetId) continue;
			const url = assetUrl(audioAssetId);
			if (!url) continue;

			const timingLang =
				(preferred?.audioAssetId ? dialogueLanguage : undefined) ??
				(audioVariant === cue.content.variants.en ? 'en' : dialogueLanguage);
			const localized = placement.timingByLanguage?.[timingLang] ?? placement.timingByLanguage?.[dialogueLanguage];
			const relativeAtMs = localized?.atMs ?? placement.atMs;
			const durationMs =
				localized?.durationMs ??
				placement.durationMs ??
				audioVariant?.estimatedDurationMs;
			const gainDb = localized?.gainDb ?? placement.gainDb;

			out.push({
				id: `${shot.id}:${cue.id}:${dialogueLanguage}`,
				cueId: cue.id,
				shotId: shot.id,
				url,
				startMs: shotOriginMs + relativeAtMs,
				relativeAtMs,
				durationMs,
				gainDb
			});
		}
		shotOriginMs += duration;
	});

	return out.sort((a, b) => a.startMs - b.startMs || a.id.localeCompare(b.id));
}
