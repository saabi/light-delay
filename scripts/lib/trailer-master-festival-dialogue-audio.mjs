/**
 * Map master-trailer dialogue cues onto Festival-master EN performances.
 * Condensed trailer copy still points at the source WAV (shot timings expand to fit).
 */
export const TRAILER_MASTER_FESTIVAL_DIALOGUE_MAP = Object.freeze({
	'trailer-master:cue-a-02': 'festival-master:cue-0004',
	'trailer-master:cue-a-03': 'festival-master:cue-0005',
	'trailer-master:cue-a-04': 'festival-master:cue-0024',
	'trailer-master:cue-a-05': 'festival-master:cue-0021',
	'trailer-master:cue-b-01': 'festival-master:cue-0030b',
	'trailer-master:cue-b-02': 'festival-master:cue-0042',
	'trailer-master:cue-c-01': 'festival-master:cue-0047',
	'trailer-master:cue-c-02': 'festival-master:cue-0049',
	'trailer-master:cue-d-01': 'festival-master:cue-0093',
	'trailer-master:cue-d-02': 'festival-master:cue-0096',
	'trailer-master:cue-d-03': 'festival-master:cue-0116',
	'trailer-master:cue-e-01': 'festival-master:cue-0126',
	'trailer-master:cue-f-01': 'festival-master:cue-0167',
	'trailer-master:cue-f-02': 'festival-master:cue-0169',
	'trailer-master:cue-f-03': 'festival-master:cue-0170',
	'trailer-master:cue-f-05': 'festival-master:cue-0078b'
});

/**
 * @typedef {{ cueId?: string, scriptId?: string }} CueSourceRef
 * @typedef {{
 *   id: string,
 *   type: string,
 *   speakerId?: string,
 *   content?: { variants?: { en?: Record<string, unknown> } },
 *   sourceRefs?: CueSourceRef[]
 * }} CueLike
 * @typedef {{ cues?: CueLike[] }} ScriptLike
 */

/**
 * @param {ScriptLike} trailer
 * @param {ScriptLike} festival
 */
export function linkTrailerMasterFestivalDialogue(trailer, festival) {
	const festivalCueById = new Map(
		(festival.cues || []).map((/** @type {CueLike} */ cue) => [cue.id, cue])
	);
	const linked = [];
	const missing = [];

	for (const cue of trailer.cues || []) {
		if (cue.type !== 'dialogue') continue;
		const sourceId =
			TRAILER_MASTER_FESTIVAL_DIALOGUE_MAP[
				/** @type {keyof typeof TRAILER_MASTER_FESTIVAL_DIALOGUE_MAP} */ (cue.id)
			];
		if (!sourceId) {
			missing.push({ trailerCueId: cue.id, reason: 'unmapped' });
			continue;
		}
		const source = festivalCueById.get(sourceId);
		const srcEn = source?.type === 'dialogue' ? source.content?.variants?.en : undefined;
		if (!source || source.type !== 'dialogue' || !srcEn?.audioAssetId) {
			missing.push({ trailerCueId: cue.id, festivalCueId: sourceId, reason: 'missing-source-audio' });
			continue;
		}
		if (source.speakerId !== cue.speakerId) {
			missing.push({
				trailerCueId: cue.id,
				festivalCueId: sourceId,
				reason: `speaker-mismatch:${cue.speakerId}!=${source.speakerId}`
			});
			continue;
		}

		const en = cue.content?.variants?.en;
		if (!en) {
			missing.push({ trailerCueId: cue.id, festivalCueId: sourceId, reason: 'missing-trailer-en' });
			continue;
		}
		en.audioAssetId = srcEn.audioAssetId;
		en.estimatedDurationMs = srcEn.estimatedDurationMs;
		if (srcEn.delivery && !en.delivery) en.delivery = srcEn.delivery;
		if (srcEn.voiceProfileId && !en.voiceProfileId) en.voiceProfileId = srcEn.voiceProfileId;

		const refs = Array.isArray(cue.sourceRefs) ? cue.sourceRefs : [];
		if (!refs.some((/** @type {CueSourceRef} */ ref) => ref.cueId === sourceId)) {
			cue.sourceRefs = [
				...refs,
				{
					scriptId: 'script:light-delay-festival-master',
					cueId: sourceId
				}
			];
		}

		linked.push({
			trailerCueId: cue.id,
			festivalCueId: sourceId,
			audioAssetId: srcEn.audioAssetId,
			wavMs: srcEn.estimatedDurationMs,
			condensed: normalizeSpoken(en.spokenText) !== normalizeSpoken(srcEn.spokenText)
		});
	}

	return { linked, missing };
}

/** @param {unknown} text */
function normalizeSpoken(text) {
	return String(text || '')
		.replace(/[’‘]/g, "'")
		.replace(/[—–]/g, '-')
		.replace(/\s+/g, ' ')
		.trim()
		.toLowerCase();
}
