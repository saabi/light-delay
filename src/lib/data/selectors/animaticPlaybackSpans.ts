import type { GenerationPlanFile } from '$lib/types/generated/production';
import type { Asset } from '$lib/types/assets';
import type { ShotId } from '$lib/types/ids';
import type { ScriptFile, Shot, Take } from '$lib/types/script';
import { getAssetById } from '$lib/data/repositories/lookups';
import { catalogFileExists, catalogPathIsSafe } from '$lib/data/repositories/generationPlans';
import type { AnimaticDialogueTimelineCue } from './animaticDialogueTimeline';

export type AnimaticStillSpan = {
	kind: 'still';
	shotId: ShotId;
	shotIndex: number;
	durationMs: number;
};

export type AnimaticStretchVideoSpan = {
	kind: 'stretchVideo';
	stretchId: string;
	jobId: string;
	assetId: string;
	videoPath: string;
	durationMs: number;
	/** Ordered member shot ids covered by this Seedance job. */
	shotIds: ShotId[];
	/** First member's index in the ordered shot list. */
	primaryShotIndex: number;
	imageStatus: Asset['imageStatus'];
};

export type AnimaticPlaybackSpan = AnimaticStillSpan | AnimaticStretchVideoSpan;

const PLAYABLE_VIDEO_STATUSES = new Set(['current', 'needs_review']);

export type BuildAnimaticPlaybackSpansOptions = {
	/** Per-shot duration overrides (animatic edits). Missing → shot.durationMs. */
	shotDurationMs?: (shot: Shot, shotIndex: number) => number;
	getAsset?: (id: string) => Asset | undefined;
	fileExists?: (catalogPath: string) => boolean;
};

function isPlayableVideoAsset(
	asset: Asset | undefined,
	fileExists: (path: string) => boolean
): asset is Asset {
	if (!asset || asset.kind !== 'video') return false;
	const path = asset.path?.trim() || '';
	if (!path || !catalogPathIsSafe(path) || !fileExists(path)) return false;
	const status = asset.imageStatus?.status ?? 'current';
	return PLAYABLE_VIDEO_STATUSES.has(status);
}

type VideoJobCover = {
	jobId: string;
	stretchId: string;
	assetId: string;
	videoPath: string;
	durationMs: number;
	shotIds: ShotId[];
	imageStatus: Asset['imageStatus'];
};

/**
 * Collect playable stretch video jobs from the generation plan.
 * Each job with a registered video output covering memberInputs becomes a cover.
 */
export function collectPlayableStretchVideoJobs(
	plan: GenerationPlanFile | undefined,
	options: Pick<BuildAnimaticPlaybackSpansOptions, 'getAsset' | 'fileExists'> = {}
): VideoJobCover[] {
	const getAsset = options.getAsset ?? getAssetById;
	const fileExists = options.fileExists ?? catalogFileExists;
	const jobs = plan?.visualStretchJobs ?? [];
	const out: VideoJobCover[] = [];

	for (const job of jobs) {
		if (job.medium !== 'video') continue;
		const videoOut = (job.outputs || []).find((o) => o.artifact === 'video' && o.assetId);
		const assetId = videoOut?.assetId;
		if (!assetId) continue;
		const asset = getAsset(assetId);
		if (!isPlayableVideoAsset(asset, fileExists)) continue;

		const members = [...(job.memberInputs || [])].sort((a, b) => a.order - b.order);
		const shotIds = members.map((m) => m.shotId as ShotId).filter(Boolean);
		if (!shotIds.length) continue;

		const durationMs =
			typeof asset.durationMs === 'number' && asset.durationMs > 0
				? asset.durationMs
				: typeof job.durationMs === 'number' && job.durationMs > 0
					? job.durationMs
					: 0;
		if (durationMs <= 0) continue;

		out.push({
			jobId: job.id,
			stretchId: job.stretchId,
			assetId,
			videoPath: asset.path,
			durationMs,
			shotIds,
			imageStatus: asset.imageStatus
		});
	}

	return out;
}

function selectedTakeForShot(script: ScriptFile, shot: Shot): Take | undefined {
	if (!shot.selectedTakeId) return undefined;
	return script.takes?.find((take) => take.id === shot.selectedTakeId);
}

/**
 * Singleton take videos (not stretch jobs). Stretch covers win when both exist.
 */
export function collectPlayableTakeVideos(
	script: ScriptFile,
	orderedShots: Shot[],
	options: Pick<BuildAnimaticPlaybackSpansOptions, 'getAsset' | 'fileExists'> = {}
): VideoJobCover[] {
	const getAsset = options.getAsset ?? getAssetById;
	const fileExists = options.fileExists ?? catalogFileExists;
	const out: VideoJobCover[] = [];

	for (const shot of orderedShots) {
		const take = selectedTakeForShot(script, shot);
		if (!take?.videoAssetId) continue;
		const asset = getAsset(take.videoAssetId);
		if (!isPlayableVideoAsset(asset, fileExists)) continue;
		const durationMs =
			typeof asset.durationMs === 'number' && asset.durationMs > 0
				? asset.durationMs
				: Math.max(0, shot.durationMs || 0);
		if (durationMs <= 0) continue;
		out.push({
			jobId: `take-video:${take.id}`,
			stretchId: shot.id,
			assetId: take.videoAssetId,
			videoPath: asset.path,
			durationMs,
			shotIds: [shot.id],
			imageStatus: asset.imageStatus
		});
	}

	return out;
}

/**
 * Build ordered playback spans: still per uncovered shot, or one stretchVideo span
 * collapsing a Seedance job's member shots (duration = asset.durationMs).
 */
export function buildAnimaticPlaybackSpans(
	script: ScriptFile,
	orderedShots: Shot[],
	plan: GenerationPlanFile | undefined,
	options: BuildAnimaticPlaybackSpansOptions = {}
): AnimaticPlaybackSpan[] {
	const shotDurationMs =
		options.shotDurationMs ?? ((shot: Shot) => Math.max(0, shot.durationMs || 0));

	const covers = [
		...collectPlayableStretchVideoJobs(plan, options),
		...collectPlayableTakeVideos(script, orderedShots, options)
	];
	const shotIndexById = new Map(orderedShots.map((s, i) => [s.id, i]));

	/** shotId → cover that claims it (first claim wins if overlap). Stretch jobs are listed first. */
	const coverByShotId = new Map<ShotId, VideoJobCover>();
	for (const cover of covers) {
		for (const shotId of cover.shotIds) {
			if (!shotIndexById.has(shotId)) continue;
			if (!coverByShotId.has(shotId)) coverByShotId.set(shotId, cover);
		}
	}

	const spans: AnimaticPlaybackSpan[] = [];
	const emittedJobs = new Set<string>();
	let i = 0;
	while (i < orderedShots.length) {
		const shot = orderedShots[i]!;
		const cover = coverByShotId.get(shot.id);
		if (cover && !emittedJobs.has(cover.jobId)) {
			const memberIndexes = cover.shotIds
				.map((id) => shotIndexById.get(id))
				.filter((idx): idx is number => idx != null)
				.sort((a, b) => a - b);
			if (!memberIndexes.length) {
				i += 1;
				continue;
			}
			// Emit stretch span at the earliest member; skip later members in the walk.
			const primaryShotIndex = memberIndexes[0]!;
			const orderedMemberIds = memberIndexes.map((idx) => orderedShots[idx]!.id);
			spans.push({
				kind: 'stretchVideo',
				stretchId: cover.stretchId,
				jobId: cover.jobId,
				assetId: cover.assetId,
				videoPath: cover.videoPath,
				durationMs: cover.durationMs,
				shotIds: orderedMemberIds,
				primaryShotIndex,
				imageStatus: cover.imageStatus
			});
			emittedJobs.add(cover.jobId);
			// Advance past contiguous claimed members starting at i.
			while (i < orderedShots.length && coverByShotId.get(orderedShots[i]!.id)?.jobId === cover.jobId) {
				i += 1;
			}
			continue;
		}
		if (cover && emittedJobs.has(cover.jobId)) {
			// Member already folded into an earlier span (non-contiguous leftover).
			i += 1;
			continue;
		}
		spans.push({
			kind: 'still',
			shotId: shot.id,
			shotIndex: i,
			durationMs: shotDurationMs(shot, i)
		});
		i += 1;
	}

	return spans;
}

/** Span index containing the given shot, or -1. */
export function spanIndexForShotId(spans: AnimaticPlaybackSpan[], shotId: ShotId): number {
	return spans.findIndex((span) =>
		span.kind === 'still' ? span.shotId === shotId : span.shotIds.includes(shotId)
	);
}

/**
 * Map a shot list index → span index. Still spans match `shotIndex`;
 * stretch spans match any member whose list index equals `shotIndex`.
 */
export function spanIndexForShotIndex(
	spans: AnimaticPlaybackSpan[],
	orderedShotIds: string[],
	shotIndex: number
): number {
	const shotId = orderedShotIds[shotIndex];
	if (!shotId) return -1;
	return spanIndexForShotId(spans, shotId);
}

export function spanDurationsMs(spans: AnimaticPlaybackSpan[]): number[] {
	return spans.map((s) => s.durationMs);
}

/**
 * Per-ordered-shot durations for dialogue/subtitle absolute mapping.
 * Stretch members share the video duration proportionally to their still durations.
 */
export function shotDurationsAlignedToSpans(
	orderedShots: Shot[],
	spans: AnimaticPlaybackSpan[],
	stillDurationMs: (shot: Shot, shotIndex: number) => number
): number[] {
	const out = orderedShots.map((shot, i) => stillDurationMs(shot, i));
	for (const span of spans) {
		if (span.kind !== 'stretchVideo') continue;
		const members = span.shotIds
			.map((id) => orderedShots.findIndex((s) => s.id === id))
			.filter((idx) => idx >= 0);
		if (!members.length) continue;
		const weights = members.map((idx) => Math.max(1, stillDurationMs(orderedShots[idx]!, idx)));
		const weightSum = weights.reduce((a, b) => a + b, 0);
		let allocated = 0;
		for (let m = 0; m < members.length; m++) {
			const idx = members[m]!;
			const share =
				m === members.length - 1
					? span.durationMs - allocated
					: Math.round((span.durationMs * weights[m]!) / weightSum);
			out[idx] = Math.max(0, share);
			allocated += share;
		}
	}
	return out;
}

/** Drop WAV cues whose shot is covered by a stretch video span (Seedance audio owns that range). */
export function filterDialogueCuesOutsideStretchVideo(
	cues: AnimaticDialogueTimelineCue[],
	spans: AnimaticPlaybackSpan[]
): AnimaticDialogueTimelineCue[] {
	const suppressed = new Set<string>();
	for (const span of spans) {
		if (span.kind === 'stretchVideo') {
			for (const id of span.shotIds) suppressed.add(id);
		}
	}
	if (!suppressed.size) return cues;
	return cues.filter((cue) => !suppressed.has(cue.shotId));
}

export function isStretchVideoSpan(
	span: AnimaticPlaybackSpan | undefined
): span is AnimaticStretchVideoSpan {
	return span?.kind === 'stretchVideo';
}
