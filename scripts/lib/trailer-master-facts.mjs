/**
 * Inherit `implementsFactIds` onto trailer-master cues from the Festival-master cues
 * they're sourced from, per `docs/production/CAUSAL_AND_MEANING_PIPELINE.md`.
 *
 * A raw 1:1 copy is wrong on its own: the pipeline requires binding "by cue content, not
 * adjacency" — a condensed trailer line can depict a narrower proposition than its full
 * Festival-master source. `MANUAL_FACT_OVERRIDES` below records the one current case where
 * that's true, content-verified by hand rather than inferred.
 */
import { TRAILER_MASTER_OMITTED_FACT_IDS } from './trailer-master-omitted-facts.mjs';

const FESTIVAL_SCRIPT_ID = 'script:light-delay-festival-master';

/**
 * Content-verified overrides: the trailer cue's own (often condensed) text depicts a
 * different, narrower set of facts than its Festival-master source cue's full performance.
 *
 * - `trailer-master:cue-e-01` reuses `festival-master:cue-0126` ("If this reaches you —
 *   I found a weapon in the shielded vault."), condensed from the fuller recorded warning.
 *   The source cue is tagged `master:fact-recording-identifies-bomb-harlan` (identifies the
 *   bomb, Harlan, the controller, and the intercept) — but the trailer's shortened line
 *   only depicts Zao finding the weapon, never naming Harlan or the controller. That's the
 *   narrower `master:fact-impulse-package-identified`, which the trailer is allowed to show.
 */
const MANUAL_FACT_OVERRIDES = Object.freeze({
	'trailer-master:cue-e-01': Object.freeze(['master:fact-impulse-package-identified'])
});

/**
 * @typedef {{ id: string, implementsFactIds?: string[] }} FestivalCueLike
 * @typedef {{
 *   id: string,
 *   implementsFactIds?: string[],
 *   sourceRefs?: { scriptId?: string, cueId?: string }[]
 * }} TrailerCueLike
 * @typedef {{ cues?: FestivalCueLike[] }} FestivalScriptLike
 * @typedef {{ cues?: TrailerCueLike[] }} TrailerScriptLike
 */

/**
 * @param {TrailerScriptLike} trailer
 * @param {FestivalScriptLike} festival
 */
export function linkTrailerMasterFacts(trailer, festival) {
	const festivalCueById = new Map(
		(festival.cues || []).map((/** @type {FestivalCueLike} */ cue) => [cue.id, cue])
	);
	const omitted = new Set(TRAILER_MASTER_OMITTED_FACT_IDS);
	const linked = [];
	const needsReview = [];

	for (const cue of trailer.cues || []) {
		const ref = (cue.sourceRefs || []).find(
			(/** @type {{ scriptId?: string, cueId?: string }} */ candidate) =>
				candidate.scriptId === FESTIVAL_SCRIPT_ID && candidate.cueId
		);
		if (!ref) continue;

		const override = MANUAL_FACT_OVERRIDES[/** @type {keyof typeof MANUAL_FACT_OVERRIDES} */ (cue.id)];
		const source = festivalCueById.get(/** @type {string} */ (ref.cueId));
		const candidateFactIds = override ?? source?.implementsFactIds ?? [];
		if (!candidateFactIds.length) continue;

		const safe = candidateFactIds.filter((id) => !omitted.has(id));
		const flagged = candidateFactIds.filter((id) => omitted.has(id));

		if (safe.length) {
			const existing = new Set(cue.implementsFactIds || []);
			for (const id of safe) existing.add(id);
			cue.implementsFactIds = [...existing];
		}
		if (safe.length || flagged.length) {
			linked.push({
				trailerCueId: cue.id,
				festivalCueId: ref.cueId,
				overridden: Boolean(override),
				applied: safe,
				flagged
			});
		}
		for (const factId of flagged) {
			needsReview.push({ trailerCueId: cue.id, festivalCueId: ref.cueId, factId });
		}
	}

	return { linked, needsReview };
}
