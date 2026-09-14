/**
 * Facts `script:light-delay-trailer-master` must never disclose, even though it reuses
 * `script:light-delay-festival-master` frames/dialogue that do carry them once the full
 * story reaches that point.
 *
 * Source of truth for the facts themselves: `data/outlines/light-delay-master-narrative.json`
 * (`master:fact-*`). This file only says *which* of those facts are off-limits for the
 * trailer cut specifically, per AGENTS.md's durable rule: "the trailer does not identify
 * the culprit or confirm the send, receipt, or death of Zao; it may only imply that she
 * discovered a responsible person and was left in danger."
 *
 * This list encodes editorial judgment, not something mechanically derivable from
 * `audienceVisibility` alone (several forbidden facts are `overt` at the master level —
 * the full story does eventually reveal them, just after where the trailer cuts off).
 * Review it alongside any change to the trailer's own omissions.
 */
export const TRAILER_MASTER_OMITTED_FACT_IDS = Object.freeze([
	// Zao's death, confirmed.
	'master:fact-zao-murdered',
	'master:fact-zao-dead-flight-cut-after-murder',

	// Harlan's culprit actions / identity, at any point they become explicit.
	'master:fact-harlan-jams-wireless',
	'master:fact-harlan-cuts-wired-comms-cameras',
	'master:fact-harlan-secures-vault',
	'master:fact-flight-controls-cut',
	'master:fact-sabotage-heard-comms-cut',
	'master:fact-recording-identifies-bomb-harlan',
	'master:fact-recording-ids-bomb-harlan',
	'master:fact-recording-authenticated',
	'master:fact-evidence-converges-revoke-harlan',
	'master:fact-harlan-escaped-with-wrist',

	// Containment / resolution beyond the trailer's stated restraint (it ends before the
	// defusal outcome or first-contact result resolve on screen).
	'master:fact-fourth-cutoff-bypass-stairs',

	// Confirms Zao's burst was actually sent (only the sending attempt may be implied).
	'master:fact-burst-sent-earth-wrong-inference'

	// Deliberately NOT included, even though they're adjacent:
	// - master:fact-bridge-hears-cutoff-warning: "no culprit is identified" — this *is*
	//   the trailer's own restraint (the warning cutting off mid-word).
	// - master:fact-impulse-package-identified: Zao finding the weapon is a trailer beat
	//   the outline explicitly wants shown; only naming Harlan alongside it is forbidden.
	// - master:fact-harlan-accusation-not-proof: "suspicion, not proof" matches the
	//   trailer's own synopsis ("does not reveal who is right").
]);
