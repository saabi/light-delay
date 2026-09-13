/**
 * Build and swap OpenTimelineIO JSON for DaVinci Resolve.
 * See docs/production/RESOLVE_OTIO_EXPORT.md.
 */
import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const DEFAULT_FPS = 24;
export const DEFAULT_LANG = 'en';
export const FESTIVAL_SCRIPT_ID = 'script:light-delay-festival-master';
export const TRAILER_SCRIPT_ID = 'script:light-delay-trailer-master';
export const BOTH_SCRIPT_IDS = [FESTIVAL_SCRIPT_ID, TRAILER_SCRIPT_ID];

const STILL_EXT = /\.(png|jpe?g|tif{1,2}|webp|dpx|tga|gif|bmp)$/i;
const VIDEO_EXT = /\.(mov|mp4|m4v|mkv|webm|avi)$/i;

export function slugFromScriptId(scriptId) {
	return String(scriptId || '').replace(/^script:/, '');
}

export function scriptPathForId(root, scriptId) {
	return join(root, 'data', 'scripts', `${slugFromScriptId(scriptId)}.json`);
}

export function defaultOtioPath(root, scriptId) {
	return join(root, 'tmp', 'resolve-otio', `${slugFromScriptId(scriptId)}.otio`);
}

export function msToFrames(ms, fps = DEFAULT_FPS) {
	return Math.round((Number(ms) || 0) * fps / 1000);
}

export function framesToMs(frames, fps = DEFAULT_FPS) {
	return (Number(frames) || 0) * 1000 / fps;
}

export function staticPathFromAsset(root, asset) {
	const rel = String(asset?.path || '').replace(/^\//, '');
	if (!rel) return null;
	return join(root, 'static', rel);
}

export function fileUrlFromPath(absPath) {
	return pathToFileURL(absPath).href;
}

export function isStillUrl(url) {
	const path = String(url || '').split(/[?#]/)[0];
	return STILL_EXT.test(path);
}

export function isVideoUrl(url) {
	const path = String(url || '').split(/[?#]/)[0];
	return VIDEO_EXT.test(path);
}

function rationalTime(value, rate) {
	return { OTIO_SCHEMA: 'RationalTime.1', rate, value };
}

function timeRange(start, duration, rate) {
	return {
		OTIO_SCHEMA: 'TimeRange.1',
		start_time: rationalTime(start, rate),
		duration: rationalTime(duration, rate)
	};
}

function externalReference(targetUrl, availableFrames, fps) {
	const ref = {
		OTIO_SCHEMA: 'ExternalReference.1',
		name: basename(String(targetUrl || '').split(/[?#]/)[0] || 'media'),
		target_url: targetUrl
	};
	if (availableFrames != null) {
		ref.available_range = timeRange(0, availableFrames, fps);
	}
	return ref;
}

function marker(name, fps) {
	return {
		OTIO_SCHEMA: 'Marker.1',
		name,
		marked_range: timeRange(0, 1, fps),
		color: 'RED'
	};
}

function clip({ name, start, duration, fps, targetUrl, availableFrames, metadata, freeze }) {
	const item = {
		OTIO_SCHEMA: 'Clip.1',
		name,
		source_range: timeRange(start, duration, fps),
		media_reference: externalReference(targetUrl, availableFrames, fps),
		metadata: metadata ?? {},
		markers: [marker(name, fps)],
		effects: freeze
			? [{ OTIO_SCHEMA: 'FreezeFrame.1', name: 'FreezeFrame' }]
			: []
	};
	return item;
}

function gap(duration, fps, name = 'gap') {
	return {
		OTIO_SCHEMA: 'Gap.1',
		name,
		source_range: timeRange(0, duration, fps),
		media_reference: null,
		metadata: {},
		markers: [],
		effects: []
	};
}

function track(name, kind, children) {
	return {
		OTIO_SCHEMA: 'Track.1',
		name,
		kind,
		children,
		source_range: null,
		metadata: {},
		markers: [],
		effects: []
	};
}

export function emptyTimeline(name, fps = DEFAULT_FPS) {
	return {
		OTIO_SCHEMA: 'Timeline.1',
		name,
		global_start_time: rationalTime(0, fps),
		metadata: { light_delay: { fps } },
		tracks: {
			OTIO_SCHEMA: 'Stack.1',
			name: 'tracks',
			children: [],
			source_range: null,
			metadata: {},
			markers: [],
			effects: []
		}
	};
}

function takeForShot(script, shot) {
	if (!shot?.selectedTakeId) return undefined;
	return (script.takes || []).find((take) => take.id === shot.selectedTakeId);
}

function resolveDialogueVariant(cue, lang) {
	const variants = cue?.content?.variants ?? {};
	const preferred = variants[lang];
	if (preferred?.audioAssetId) return { variant: preferred, timingLang: lang };
	if (variants.en?.audioAssetId) return { variant: variants.en, timingLang: 'en' };
	if (variants.es?.audioAssetId) return { variant: variants.es, timingLang: 'es' };
	const any = Object.values(variants).find((item) => item?.audioAssetId);
	return any ? { variant: any, timingLang: lang } : null;
}

/**
 * Absolute dialogue cues using the animatic startMs formula, then frame-snapped.
 */
export function collectDialogueCues(script, { lang = DEFAULT_LANG, fps = DEFAULT_FPS } = {}) {
	const cueById = new Map((script.cues || []).map((cue) => [cue.id, cue]));
	const out = [];
	let shotOriginMs = 0;
	for (const shot of script.shots || []) {
		for (const placement of shot.cuePlacements || []) {
			const cue = cueById.get(placement.cueId);
			if (!cue || cue.type !== 'dialogue') continue;
			const resolved = resolveDialogueVariant(cue, lang);
			if (!resolved) continue;
			const localized =
				placement.timingByLanguage?.[resolved.timingLang] ??
				placement.timingByLanguage?.[lang];
			const relativeAtMs = localized?.atMs ?? placement.atMs ?? 0;
			const durationMs =
				localized?.durationMs ??
				placement.durationMs ??
				resolved.variant.estimatedDurationMs ??
				0;
			out.push({
				cueId: cue.id,
				shotId: shot.id,
				audioAssetId: resolved.variant.audioAssetId,
				startMs: shotOriginMs + relativeAtMs,
				relativeAtMs,
				durationMs,
				startFrame: msToFrames(shotOriginMs + relativeAtMs, fps),
				durationFrames: Math.max(1, msToFrames(durationMs, fps))
			});
		}
		shotOriginMs += shot.durationMs || 0;
	}
	return out.sort((a, b) => a.startFrame - b.startFrame || a.cueId.localeCompare(b.cueId));
}

function lightDelayMeta({ shotId, takeId, mediaKind, cueIds }) {
	return {
		light_delay: {
			shotId,
			takeId: takeId ?? null,
			mediaKind,
			cueIds: cueIds ?? []
		}
	};
}

function resolveMediaFile(root, asset, fileExists) {
	if (!asset?.path) return null;
	const abs = staticPathFromAsset(root, asset);
	if (!abs || !fileExists(abs)) return null;
	return { abs, url: fileUrlFromPath(abs), asset };
}

export function assembleTimeline(
	script,
	assetsById,
	{
		root,
		lang = DEFAULT_LANG,
		fps = DEFAULT_FPS,
		fileExists = existsSync
	} = {}
) {
	const report = {
		scriptId: script.script?.id,
		fps,
		lang,
		pictureClips: 0,
		pictureGaps: 0,
		dialogueClips: 0,
		takeAudioClips: 0,
		missingStills: [],
		missingAudio: [],
		snap: [],
		videoShots: []
	};
	const name = script.script?.id || 'timeline';
	const timeline = emptyTimeline(name, fps);
	const pictureChildren = [];
	const takeAudioSlots = [];
	const stillShotIds = new Set();
	const cueIdsByShot = new Map();

	let pictureFrames = 0;
	for (const shot of script.shots || []) {
		const durationFrames = Math.max(1, msToFrames(shot.durationMs || 0, fps));
		const snappedMs = framesToMs(durationFrames, fps);
		if (Math.abs(snappedMs - (shot.durationMs || 0)) > 0.5) {
			report.snap.push({
				shotId: shot.id,
				durationMs: shot.durationMs,
				frames: durationFrames,
				snappedMs: Math.round(snappedMs * 1000) / 1000
			});
		}
		const take = takeForShot(script, shot);
		const videoAsset = take?.videoAssetId ? assetsById.get(take.videoAssetId) : undefined;
		const videoFile = videoAsset ? resolveMediaFile(root, videoAsset, fileExists) : null;
		const imageAsset = take?.imageAssetId ? assetsById.get(take.imageAssetId) : undefined;
		const imageFile = !videoFile && imageAsset ? resolveMediaFile(root, imageAsset, fileExists) : null;
		const cueIds = (shot.cuePlacements || []).map((placement) => placement.cueId);
		cueIdsByShot.set(shot.id, cueIds);

		if (videoFile) {
			report.pictureClips += 1;
			report.videoShots.push(shot.id);
			const meta = lightDelayMeta({
				shotId: shot.id,
				takeId: take?.id,
				mediaKind: 'video',
				cueIds
			});
			pictureChildren.push(
				clip({
					name: shot.id,
					start: 0,
					duration: durationFrames,
					fps,
					targetUrl: videoFile.url,
					availableFrames: null,
					metadata: meta,
					freeze: false
				})
			);
			takeAudioSlots.push({
				kind: 'clip',
				name: `${shot.id}:audio`,
				duration: durationFrames,
				url: videoFile.url,
				metadata: meta
			});
		} else if (imageFile) {
			report.pictureClips += 1;
			stillShotIds.add(shot.id);
			const meta = lightDelayMeta({
				shotId: shot.id,
				takeId: take?.id,
				mediaKind: 'still',
				cueIds
			});
			pictureChildren.push(
				clip({
					name: shot.id,
					start: 0,
					duration: durationFrames,
					fps,
					targetUrl: imageFile.url,
					availableFrames: durationFrames,
					metadata: meta,
					freeze: true
				})
			);
			takeAudioSlots.push({ kind: 'gap', duration: durationFrames });
		} else {
			report.pictureGaps += 1;
			report.missingStills.push(shot.id);
			pictureChildren.push(gap(durationFrames, fps, `${shot.id}:missing`));
			takeAudioSlots.push({ kind: 'gap', duration: durationFrames });
		}
		pictureFrames += durationFrames;
	}

	const dialogue = collectDialogueCues(script, { lang, fps });
	const audioChildren = [];
	let cursor = 0;
	for (const cue of dialogue) {
		if (!stillShotIds.has(cue.shotId)) continue;
		const asset = assetsById.get(cue.audioAssetId);
		const file = asset ? resolveMediaFile(root, asset, fileExists) : null;
		if (!file) {
			report.missingAudio.push(cue.cueId);
			continue;
		}
		let start = cue.startFrame;
		if (start < cursor) start = cursor;
		if (start > cursor) audioChildren.push(gap(start - cursor, fps));
		const duration = cue.durationFrames;
		audioChildren.push(
			clip({
				name: cue.cueId,
				start: 0,
				duration,
				fps,
				targetUrl: file.url,
				availableFrames: duration,
				metadata: lightDelayMeta({
					shotId: cue.shotId,
					mediaKind: 'dialogue',
					cueIds: [cue.cueId]
				}),
				freeze: false
			})
		);
		report.dialogueClips += 1;
		cursor = start + duration;
	}
	if (cursor < pictureFrames) audioChildren.push(gap(pictureFrames - cursor, fps));

	const takeAudioChildren = takeAudioSlots.map((slot) => {
		if (slot.kind === 'gap') return gap(slot.duration, fps);
		report.takeAudioClips += 1;
		return clip({
			name: slot.name,
			start: 0,
			duration: slot.duration,
			fps,
			targetUrl: slot.url,
			availableFrames: null,
			metadata: slot.metadata,
			freeze: false
		});
	});

	timeline.tracks.children = [
		track('V1 Picture', 'Video', pictureChildren),
		track('A1 Dialogue', 'Audio', audioChildren),
		track('A2 Take audio', 'Audio', takeAudioChildren)
	];
	timeline.metadata.light_delay = {
		fps,
		lang,
		scriptId: script.script?.id,
		cueIdsByShot: Object.fromEntries(cueIdsByShot)
	};
	return { timeline, report };
}

function clipDurationFrames(item) {
	return item?.source_range?.duration?.value ?? 0;
}

function setClipDuration(item, duration, fps) {
	if (!item.source_range) item.source_range = timeRange(0, duration, fps);
	else item.source_range.duration = rationalTime(duration, fps);
}

function setClipStart(item, start, fps) {
	if (!item.source_range) item.source_range = timeRange(start, clipDurationFrames(item), fps);
	else item.source_range.start_time = rationalTime(start, fps);
}

function isClip(item) {
	return String(item?.OTIO_SCHEMA || '').startsWith('Clip');
}

function isGap(item) {
	return String(item?.OTIO_SCHEMA || '').startsWith('Gap');
}

function mediaKindOf(clipItem) {
	const kind = clipItem?.metadata?.light_delay?.mediaKind;
	if (kind) return kind;
	const url = clipItem?.media_reference?.target_url;
	if (isStillUrl(url)) return 'still';
	if (isVideoUrl(url)) return 'video';
	return 'unknown';
}

export function matchShotId(clipItem, shotIds) {
	const meta = clipItem?.metadata?.light_delay?.shotId;
	if (meta && shotIds.has(meta)) return meta;
	if (clipItem?.name && shotIds.has(clipItem.name)) return clipItem.name;
	const url = clipItem?.media_reference?.target_url || '';
	const base = basename(url.split(/[?#]/)[0] || '').replace(/\.[^.]+$/, '');
	if (!base) return null;
	for (const id of shotIds) {
		const slug = id.split(':').pop();
		if (slug === base || id.endsWith(`:${base}`)) return id;
	}
	if (clipItem?.name) {
		const nameBase = clipItem.name.replace(/\.[^.]+$/, '');
		for (const id of shotIds) {
			if (id.split(':').pop() === nameBase) return id;
		}
	}
	return null;
}

function cueIdsOfClip(clipItem) {
	const fromMeta = clipItem?.metadata?.light_delay?.cueIds;
	if (Array.isArray(fromMeta) && fromMeta.length) return fromMeta;
	const name = clipItem?.name || '';
	if (name.includes('cue-') || name.includes(':cue')) return [name];
	const url = clipItem?.media_reference?.target_url || '';
	const base = basename(url.split(/[?#]/)[0] || '').replace(/\.[^.]+$/, '');
	if (base.includes('cue-')) return [base];
	return [];
}

function videoFileForShot(script, shot, assetsById, root, fileExists) {
	const take = takeForShot(script, shot);
	if (!take?.videoAssetId) return null;
	const asset = assetsById.get(take.videoAssetId);
	return asset ? resolveMediaFile(root, asset, fileExists) : null;
}

function rebuildTakeAudioTrack(pictureChildren, fps) {
	const children = [];
	for (const item of pictureChildren) {
		const duration = clipDurationFrames(item);
		if (isClip(item) && mediaKindOf(item) === 'video') {
			const url = item.media_reference?.target_url;
			const shotId = item.metadata?.light_delay?.shotId || item.name;
			children.push(
				clip({
					name: `${shotId}:audio`,
					start: item.source_range?.start_time?.value ?? 0,
					duration,
					fps,
					targetUrl: url,
					availableFrames: null,
					metadata: item.metadata,
					freeze: false
				})
			);
		} else {
			children.push(gap(duration, fps));
		}
	}
	return children;
}

export function swapTakes(
	timeline,
	script,
	assetsById,
	{
		root,
		fps = timeline?.metadata?.light_delay?.fps ?? DEFAULT_FPS,
		fileExists = existsSync
	} = {}
) {
	const shots = script.shots || [];
	const shotById = new Map(shots.map((shot) => [shot.id, shot]));
	const shotIds = new Set(shotById.keys());
	const report = {
		scriptId: script.script?.id,
		swapped: [],
		preserved: [],
		unmatchedVideo: [],
		droppedDialogue: []
	};

	const stack = timeline.tracks?.children || [];
	const videoTrack = stack.find((item) => item.kind === 'Video') || stack[0];
	const dialogueTrack =
		stack.find((item) => item.kind === 'Audio' && String(item.name || '').includes('Dialogue')) ||
		stack.find((item) => item.kind === 'Audio');
	let takeAudioTrack = stack.find(
		(item) => item.kind === 'Audio' && String(item.name || '').includes('Take')
	);

	const pictureChildren = videoTrack?.children || [];
	const stillClipsByShot = new Map();
	for (const item of pictureChildren) {
		if (!isClip(item)) continue;
		const shotId = matchShotId(item, shotIds);
		if (!shotId) {
			report.preserved.push(item.name || '(unnamed)');
			continue;
		}
		if (mediaKindOf(item) !== 'still') continue;
		if (!stillClipsByShot.has(shotId)) stillClipsByShot.set(shotId, []);
		stillClipsByShot.get(shotId).push(item);
	}

	const swappedShotIds = new Set();
	for (const [shotId, clipsForShot] of stillClipsByShot) {
		const shot = shotById.get(shotId);
		const file = videoFileForShot(script, shot, assetsById, root, fileExists);
		if (!file) continue;
		let offset = 0;
		for (const item of clipsForShot) {
			const duration = clipDurationFrames(item);
			item.media_reference = externalReference(file.url, null, fps);
			item.effects = [];
			setClipStart(item, offset, fps);
			setClipDuration(item, duration, fps);
			item.metadata = {
				...(item.metadata || {}),
				light_delay: {
					...(item.metadata?.light_delay || {}),
					shotId,
					takeId: takeForShot(script, shot)?.id ?? null,
					mediaKind: 'video',
					cueIds: item.metadata?.light_delay?.cueIds ?? []
				}
			};
			offset += duration;
		}
		swappedShotIds.add(shotId);
		report.swapped.push(shotId);
	}

	for (const shot of shots) {
		const file = videoFileForShot(script, shot, assetsById, root, fileExists);
		if (!file) continue;
		const present = pictureChildren.some(
			(item) => isClip(item) && matchShotId(item, shotIds) === shot.id
		);
		if (!present) report.unmatchedVideo.push(shot.id);
	}

	const swappedCueIds = new Set();
	for (const shotId of swappedShotIds) {
		for (const cueId of shotById.get(shotId)?.cuePlacements?.map((placement) => placement.cueId) ||
			[]) {
			swappedCueIds.add(cueId);
		}
	}

	if (dialogueTrack) {
		const kept = [];
		for (const item of dialogueTrack.children || []) {
			if (isGap(item)) {
				kept.push(item);
				continue;
			}
			if (!isClip(item)) {
				kept.push(item);
				continue;
			}
			const shotId = matchShotId(item, shotIds) || item.metadata?.light_delay?.shotId;
			const cueIds = cueIdsOfClip(item);
			const drop =
				(shotId && swappedShotIds.has(shotId)) || cueIds.some((id) => swappedCueIds.has(id));
			if (drop) {
				report.droppedDialogue.push(item.name || cueIds[0] || shotId);
				const duration = clipDurationFrames(item);
				kept.push(gap(duration, fps));
				continue;
			}
			kept.push(item);
		}
		dialogueTrack.children = kept;
	}

	const rebuilt = rebuildTakeAudioTrack(pictureChildren, fps);
	if (takeAudioTrack) {
		takeAudioTrack.children = rebuilt;
	} else {
		takeAudioTrack = track('A2 Take audio', 'Audio', rebuilt);
		stack.push(takeAudioTrack);
	}

	return { timeline, report };
}

export function serializeOtio(timeline) {
	return `${JSON.stringify(timeline, null, 2)}\n`;
}

export function assetsByIdFromFile(assetsFile) {
	const list = assetsFile?.assets || [];
	return new Map(list.map((asset) => [asset.id, asset]));
}
