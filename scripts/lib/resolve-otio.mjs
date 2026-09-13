/**
 * Build and swap OpenTimelineIO JSON for DaVinci Resolve.
 * See docs/production/RESOLVE_OTIO_EXPORT.md.
 */
import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';

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

/**
 * Resolve 20.1 Windows exports (and reimports) native filesystem paths:
 * `E:\\Work\\...` in JSON, not `file://` and not POSIX slashes.
 */
export function filesystemPathForOtio(absPath) {
	return String(absPath || '');
}

export const RESOLVE_OTIO_META_VERSION = '1.0';
export const TIMELINE_START_SECONDS = 3600;

function resolveTimelineMeta(extra = {}) {
	return {
		Resolve_OTIO: { 'Resolve OTIO Meta Version': RESOLVE_OTIO_META_VERSION },
		...extra
	};
}

function resolveClipMeta(extra = {}) {
	return { Resolve_OTIO: {}, ...extra };
}

function resolveVideoTrackMeta() {
	return { Resolve_OTIO: { Locked: false } };
}

function resolveAudioTrackMeta() {
	return { Resolve_OTIO: { 'Audio Type': 'Stereo', Locked: false, SoloOn: false } };
}

/** Resolve/Windows reject `:` in clip and timeline names. Swap still matches via metadata. */
export function otioSafeName(id) {
	return String(id || '').replace(/:/g, '__');
}

export function otioNameToId(name) {
	return String(name || '').replace(/__/g, ':');
}

export function isStillUrl(url) {
	const path = String(url || '').split(/[?#]/)[0];
	return STILL_EXT.test(path);
}

export function isVideoUrl(url) {
	const path = String(url || '').split(/[?#]/)[0];
	return VIDEO_EXT.test(path);
}

export function clipMediaRef(clipItem) {
	if (clipItem?.media_reference) return clipItem.media_reference;
	const key = clipItem?.active_media_reference_key || 'DEFAULT_MEDIA';
	return clipItem?.media_references?.[key] ?? null;
}

export function clipTargetUrl(clipItem) {
	return clipMediaRef(clipItem)?.target_url || '';
}

function setClipMedia(clipItem, ref) {
	clipItem.OTIO_SCHEMA = 'Clip.2';
	clipItem.enabled = true;
	clipItem.media_references = { DEFAULT_MEDIA: ref };
	clipItem.active_media_reference_key = 'DEFAULT_MEDIA';
	delete clipItem.media_reference;
}

function rationalTime(value, rate) {
	return { OTIO_SCHEMA: 'RationalTime.1', rate, value };
}

function timeRange(start, duration, rate) {
	return {
		OTIO_SCHEMA: 'TimeRange.1',
		duration: rationalTime(duration, rate),
		start_time: rationalTime(start, rate)
	};
}

function externalReference(targetUrl, availableFrames, fps) {
	const ref = {
		OTIO_SCHEMA: 'ExternalReference.1',
		metadata: {},
		name: basename(String(targetUrl || '').split(/[?#]/)[0] || 'media')
	};
	if (availableFrames != null) {
		ref.available_range = timeRange(0, availableFrames, fps);
	}
	ref.available_image_bounds = null;
	ref.target_url = targetUrl;
	return ref;
}

function clip({ name, start, duration, fps, targetUrl, availableFrames, metadata }) {
	return {
		OTIO_SCHEMA: 'Clip.2',
		metadata: resolveClipMeta(metadata ?? {}),
		name,
		source_range: timeRange(start, duration, fps),
		effects: [],
		markers: [],
		enabled: true,
		media_references: {
			DEFAULT_MEDIA: externalReference(targetUrl, availableFrames, fps)
		},
		active_media_reference_key: 'DEFAULT_MEDIA'
	};
}

function gap(duration, fps, name = '') {
	return {
		OTIO_SCHEMA: 'Gap.1',
		metadata: {},
		name,
		source_range: timeRange(0, duration, fps),
		effects: [],
		markers: [],
		enabled: true
	};
}

function track(name, kind, children, metadata = {}) {
	return {
		OTIO_SCHEMA: 'Track.1',
		metadata,
		name,
		source_range: null,
		effects: [],
		markers: [],
		enabled: true,
		children,
		kind
	};
}

export function emptyTimeline(name, fps = DEFAULT_FPS) {
	return {
		OTIO_SCHEMA: 'Timeline.1',
		metadata: resolveTimelineMeta(),
		name,
		global_start_time: rationalTime(fps * TIMELINE_START_SECONDS, fps),
		tracks: {
			OTIO_SCHEMA: 'Stack.1',
			metadata: {},
			name: '',
			source_range: null,
			effects: [],
			markers: [],
			enabled: true,
			children: []
		}
	};
}

export function defaultSmokeOtioPath(root) {
	return join(root, 'tmp', 'resolve-otio', 'smoke-one-still.otio');
}

export function assembleSmokeTimeline(root, { fps = DEFAULT_FPS, fileExists = existsSync } = {}) {
	const abs = join(root, 'static', 'assets', 'animatic', 'frames', 'festival-master', 'shot-plan-title.png');
	if (!fileExists(abs)) throw new Error(`Smoke still missing: ${abs}`);
	const timeline = emptyTimeline('smoke-one-still', fps);
	timeline.tracks.children = [
		track(
			'Video 1',
			'Video',
			[
				clip({
					name: 'smoke-still',
					start: 0,
					duration: fps * 3,
					fps,
					targetUrl: filesystemPathForOtio(abs),
					availableFrames: 1,
					metadata: {}
				})
			],
			resolveVideoTrackMeta()
		),
		track(
			'Audio 1',
			'Audio',
			[gap(fps * 3, fps)],
			resolveAudioTrackMeta()
		)
	];
	return timeline;
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
	return { abs, url: filesystemPathForOtio(abs), asset };
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
	const name = slugFromScriptId(script.script?.id) || 'timeline';
	const timeline = emptyTimeline(name, fps);
	const pictureChildren = [];
	const takeAudioSlots = [];
	const stillShotIds = new Set();

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
					name: otioSafeName(shot.id),
					start: 0,
					duration: durationFrames,
					fps,
					targetUrl: videoFile.url,
					availableFrames: null,
					metadata: meta
				})
			);
			takeAudioSlots.push({
				kind: 'clip',
				name: `${otioSafeName(shot.id)}__audio`,
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
					name: otioSafeName(shot.id),
					start: 0,
					duration: durationFrames,
					fps,
					targetUrl: imageFile.url,
					availableFrames: 1,
					metadata: meta
				})
			);
			takeAudioSlots.push({ kind: 'gap', duration: durationFrames });
		} else {
			report.pictureGaps += 1;
			report.missingStills.push(shot.id);
			pictureChildren.push(gap(durationFrames, fps));
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
				name: otioSafeName(cue.cueId),
				start: 0,
				duration,
				fps,
				targetUrl: file.url,
				availableFrames: duration,
				metadata: lightDelayMeta({
					shotId: cue.shotId,
					mediaKind: 'dialogue',
					cueIds: [cue.cueId]
				})
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
			metadata: slot.metadata
		});
	});

	timeline.tracks.children = [
		track('Video 1', 'Video', pictureChildren, resolveVideoTrackMeta()),
		track('Audio 1', 'Audio', audioChildren, resolveAudioTrackMeta()),
		track('Audio 2', 'Audio', takeAudioChildren, resolveAudioTrackMeta())
	];
	timeline.metadata.light_delay = {
		fps,
		lang,
		scriptId: script.script?.id
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
	const url = clipTargetUrl(clipItem);
	if (isStillUrl(url)) return 'still';
	if (isVideoUrl(url)) return 'video';
	return 'unknown';
}

export function matchShotId(clipItem, shotIds) {
	const meta = clipItem?.metadata?.light_delay?.shotId;
	if (meta && shotIds.has(meta)) return meta;
	if (clipItem?.name && shotIds.has(clipItem.name)) return clipItem.name;
	const fromSafe = otioNameToId(clipItem?.name);
	if (fromSafe && shotIds.has(fromSafe)) return fromSafe;
	const url = clipTargetUrl(clipItem);
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
	if (name.includes('cue-') || name.includes(':cue') || name.includes('__cue')) {
		return [otioNameToId(name)];
	}
	const url = clipTargetUrl(clipItem);
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
			const url = clipTargetUrl(item);
			const shotId = item.metadata?.light_delay?.shotId || otioNameToId(item.name);
			children.push(
				clip({
					name: `${otioSafeName(shotId)}__audio`,
					start: item.source_range?.start_time?.value ?? 0,
					duration,
					fps,
					targetUrl: url,
					availableFrames: null,
					metadata: item.metadata
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
	const audioTracks = stack.filter((item) => item.kind === 'Audio');
	const dialogueTrack =
		stack.find((item) => item.kind === 'Audio' && /Dialogue|Audio 1/i.test(String(item.name || ''))) ||
		audioTracks[0];
	let takeAudioTrack =
		stack.find((item) => item.kind === 'Audio' && /Take|Audio 2/i.test(String(item.name || ''))) ||
		audioTracks[1];

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
			setClipMedia(item, externalReference(file.url, null, fps));
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
				report.droppedDialogue.push(cueIds[0] || otioNameToId(item.name) || shotId);
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
		takeAudioTrack = track('Audio 2', 'Audio', rebuilt, resolveAudioTrackMeta());
		stack.push(takeAudioTrack);
	}

	return { timeline, report };
}

export function serializeOtio(timeline) {
	const json = JSON.stringify(timeline, null, 4);
	return `${json.replace(/("(?:rate|value)": )(-?\d+)(\s*[,}\n])/g, '$1$2.0$3')}\n`;
}

export function assetsByIdFromFile(assetsFile) {
	const list = assetsFile?.assets || [];
	return new Map(list.map((asset) => [asset.id, asset]));
}
