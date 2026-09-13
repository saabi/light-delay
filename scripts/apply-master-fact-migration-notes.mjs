/**
 * Apply author-signed MASTER_FACT_MIGRATION_NOTES.md onto the master outline
 * and remap Festival-master cue implementsFactIds.
 *
 * Usage: node scripts/apply-master-fact-migration-notes.mjs --write
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const write = process.argv.includes('--write');
const load = (rel) => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));

const loc = (en, es) => ({
	en,
	es: es || `Traducción pendiente (needs_revision): ${en}`
});

/** @type {Array<{
 *  id: string,
 *  description: {en: string, es: string},
 *  introducedInStepId: string,
 *  dependsOnFactIds?: string[],
 *  audienceVisibility?: string,
 *  legacyIds?: string[],
 *  status?: string
 * }>} */
const ACTIVE = [
	{
		id: 'master:fact-voss-misread-motives',
		introducedInStepId: 'master:story-p2',
		dependsOnFactIds: [],
		audienceVisibility: 'overt',
		legacyIds: ['festival-master:fact-01'],
		description: loc(
			'Voss has misread Harlan’s fear as hope and Sorell’s caution as reluctance.'
		)
	},
	{
		id: 'master:fact-harlan-loading-access-open',
		introducedInStepId: 'master:story-a2',
		dependsOnFactIds: ['master:fact-voss-misread-motives'],
		audienceVisibility: 'overt',
		legacyIds: ['festival-master:fact-02'],
		description: loc(
			'Harlan’s authority over loading and ship preparation is established; Zao’s independent recheck remains open.'
		)
	},
	{
		id: 'master:fact-first-thrust-cutoff-done',
		introducedInStepId: 'master:story-a3b',
		dependsOnFactIds: ['master:fact-harlan-loading-access-open'],
		audienceVisibility: 'overt',
		legacyIds: ['festival-master:fact-03'],
		description: loc('The Ardor has completed its first thrust cutoff and turnover.')
	},
	{
		id: 'master:fact-fuel-mass-discrepancy',
		introducedInStepId: 'master:story-a4',
		dependsOnFactIds: ['master:fact-first-thrust-cutoff-done'],
		audienceVisibility: 'overt',
		legacyIds: ['festival-master:fact-04'],
		description: loc(
			'Propellant audit shows a precise excess burn consistent with undeclared mass.'
		)
	},
	{
		id: 'master:fact-neutron-excess-detected',
		introducedInStepId: 'master:story-a5',
		dependsOnFactIds: ['master:fact-fuel-mass-discrepancy'],
		audienceVisibility: 'overt',
		description: loc(
			'A neutron excess is detected aft; the reading cannot yet distinguish an off-ratio burn from a compact shielded source.'
		)
	},
	{
		id: 'master:fact-impulse-package-identified',
		introducedInStepId: 'master:story-b1b',
		dependsOnFactIds: ['master:fact-neutron-excess-detected'],
		audienceVisibility: 'overt',
		legacyIds: ['festival-master:fact-05'],
		description: loc(
			'Zao has identified the timed geophysical impulse package; Harlan knows she may find it.'
		)
	},
	{
		id: 'master:fact-bridge-hears-cutoff-warning',
		introducedInStepId: 'master:story-b2',
		dependsOnFactIds: ['master:fact-impulse-package-identified'],
		audienceVisibility: 'overt',
		legacyIds: ['festival-master:fact-06'],
		description: loc(
			'The bridge hears Zao’s sabotage warning cut off mid-sentence; no culprit is identified.'
		)
	},
	{
		id: 'master:fact-harlan-jams-wireless',
		introducedInStepId: 'master:story-b2',
		dependsOnFactIds: ['master:fact-impulse-package-identified'],
		audienceVisibility: 'withheld',
		description: loc('Harlan jams Zao’s wireless from the service shaft behind the bridge.')
	},
	{
		id: 'master:fact-harlan-cuts-wired-comms-cameras',
		introducedInStepId: 'master:story-b3',
		dependsOnFactIds: ['master:fact-harlan-jams-wireless'],
		audienceVisibility: 'withheld',
		description: loc(
			'Harlan physically disconnects wired communications and camera trunks at the bridge tray.'
		)
	},
	{
		id: 'master:fact-only-moving-intercept-left',
		introducedInStepId: 'master:story-b5',
		dependsOnFactIds: ['master:fact-bridge-hears-cutoff-warning'],
		audienceVisibility: 'overt',
		legacyIds: ['festival-master:fact-07'],
		description: loc(
			'Zao has eliminated every useful warning route except an undisclosed moving intercept.'
		)
	},
	{
		id: 'master:fact-harlan-believes-burst-reached-earth',
		introducedInStepId: 'master:story-c2',
		dependsOnFactIds: ['master:fact-only-moving-intercept-left'],
		audienceVisibility: 'implied',
		legacyIds: ['festival-master:fact-08'],
		description: loc(
			'Harlan believes Zao’s burst targeted Earth and that the double delay makes abort unlikely.'
		)
	},
	{
		id: 'master:fact-zao-murdered',
		introducedInStepId: 'master:story-c3',
		dependsOnFactIds: ['master:fact-harlan-believes-burst-reached-earth'],
		audienceVisibility: 'withheld',
		legacyIds: ['festival-master:fact-09'],
		description: loc('Harlan murders Zao in the outer reactor service bay.')
	},
	{
		id: 'master:fact-harlan-secures-vault',
		introducedInStepId: 'master:story-c3a',
		dependsOnFactIds: ['master:fact-zao-murdered'],
		audienceVisibility: 'withheld',
		description: loc(
			'Harlan closes the inner shielding vault and keys its local lock to his wrist device.'
		)
	},
	{
		id: 'master:fact-flight-controls-cut',
		introducedInStepId: 'master:story-c3a',
		dependsOnFactIds: ['master:fact-zao-murdered'],
		audienceVisibility: 'withheld',
		description: loc(
			'Harlan physically disables bridge flight commands at the adjacent local console after the murder.'
		)
	},
	{
		id: 'master:fact-sorell-found-zao',
		introducedInStepId: 'master:story-c4',
		dependsOnFactIds: ['master:fact-zao-murdered'],
		audienceVisibility: 'overt',
		legacyIds: ['festival-master:fact-10'],
		description: loc('Sorell finds Zao drifting in the outer bay and attempts aid.')
	},
	{
		id: 'master:fact-cameras-show-only-rescue',
		introducedInStepId: 'master:story-c5',
		dependsOnFactIds: ['master:fact-sorell-found-zao'],
		audienceVisibility: 'overt',
		description: loc(
			'Restored cameras show Sorell with Zao’s body during the rescue attempt; they do not show the murder.'
		)
	},
	{
		id: 'master:fact-harlan-accuses-sorell',
		introducedInStepId: 'master:story-c7',
		dependsOnFactIds: ['master:fact-cameras-show-only-rescue'],
		audienceVisibility: 'overt',
		legacyIds: ['festival-master:fact-11'],
		description: loc('Harlan publicly accuses Sorell over Zao’s body.')
	},
	{
		id: 'master:fact-harlan-accusation-not-proof',
		introducedInStepId: 'master:story-c9',
		dependsOnFactIds: ['master:fact-harlan-accuses-sorell'],
		audienceVisibility: 'overt',
		description: loc(
			'The restored image and blackout create suspicion of Sorell but do not prove she killed Zao.'
		)
	},
	{
		id: 'master:fact-case-open-station-leg',
		introducedInStepId: 'master:story-c10',
		dependsOnFactIds: ['master:fact-harlan-accusation-not-proof'],
		audienceVisibility: 'overt',
		legacyIds: ['festival-master:fact-12'],
		description: loc(
			'Voss kept the case open during the twenty-three-and-a-half-hour station leg.'
		)
	},
	{
		id: 'master:fact-engine-healthy-separate-causes',
		introducedInStepId: 'master:story-d2b',
		dependsOnFactIds: ['master:fact-case-open-station-leg'],
		audienceVisibility: 'overt',
		legacyIds: ['festival-master:fact-13'],
		description: loc(
			'The engine was healthy; hidden mass and neutrons require separate causes.'
		)
	},
	{
		id: 'master:fact-vault-lock-rejects-timing-diagnostic',
		introducedInStepId: 'master:story-d4',
		dependsOnFactIds: [
			'master:fact-engine-healthy-separate-causes',
			'master:fact-harlan-secures-vault'
		],
		audienceVisibility: 'overt',
		legacyIds: ['festival-master:fact-14'],
		description: loc(
			'The local vault lock rejects command authority; a compact neutron source remains behind the sealed vault.'
		)
	},
	{
		id: 'master:fact-burst-corridor-signal-incoming',
		introducedInStepId: 'master:story-d7',
		dependsOnFactIds: ['master:fact-vault-lock-rejects-timing-diagnostic'],
		audienceVisibility: 'overt',
		legacyIds: ['festival-master:fact-15'],
		description: loc(
			'The burst targeted a moving receiver; an incoming signal now follows its corridor.'
		)
	},
	{
		id: 'master:fact-recording-identifies-bomb-harlan',
		introducedInStepId: 'master:story-e2',
		dependsOnFactIds: ['master:fact-burst-corridor-signal-incoming'],
		audienceVisibility: 'overt',
		legacyIds: ['festival-master:fact-16'],
		description: loc(
			'Zao’s recording identifies the bomb, Harlan, the protected controller, and the future intercept (not yet cryptographically settled).'
		)
	},
	{
		id: 'master:fact-recording-authenticated',
		introducedInStepId: 'master:story-e5',
		dependsOnFactIds: ['master:fact-recording-identifies-bomb-harlan'],
		audienceVisibility: 'overt',
		description: loc(
			'Elin verifies Zao’s cryptographic signature; authentication answers Harlan’s objection.'
		)
	},
	{
		id: 'master:fact-evidence-converges-revoke-harlan',
		introducedInStepId: 'master:story-e6',
		dependsOnFactIds: ['master:fact-recording-authenticated'],
		audienceVisibility: 'overt',
		legacyIds: ['festival-master:fact-17'],
		description: loc(
			'Independent evidence converges on Harlan strongly enough to isolate him and release Sorell.'
		)
	},
	{
		id: 'master:fact-aft-console-only-interrupt',
		introducedInStepId: 'master:story-e6',
		dependsOnFactIds: ['master:fact-recording-authenticated'],
		audienceVisibility: 'overt',
		legacyIds: ['festival-master:fact-18'],
		description: loc(
			'Only the aft local console can interrupt the automatic plan; three minutes remain.'
		)
	},
	{
		id: 'master:fact-harlan-escaped-with-wrist',
		introducedInStepId: 'master:story-f2',
		dependsOnFactIds: ['master:fact-aft-console-only-interrupt'],
		audienceVisibility: 'overt',
		legacyIds: ['festival-master:fact-19'],
		description: loc(
			'Harlan escaped toward Elin with the wrist device still controlling the local lock.'
		)
	},
	{
		id: 'master:fact-fourth-cutoff-bypass-stairs',
		introducedInStepId: 'master:story-f4',
		dependsOnFactIds: ['master:fact-harlan-escaped-with-wrist'],
		audienceVisibility: 'overt',
		legacyIds: ['festival-master:fact-20'],
		description: loc(
			'The fourth gravity cutoff lets Okoye and Voss bypass the stairs and contain Harlan.'
		)
	},
	{
		id: 'master:fact-bomb-delayable-scientific-input',
		introducedInStepId: 'master:story-f5',
		dependsOnFactIds: ['master:fact-fourth-cutoff-bypass-stairs'],
		audienceVisibility: 'overt',
		legacyIds: ['festival-master:fact-21'],
		description: loc(
			'The bomb can be delayed through its scientific timing input but is not disarmed.'
		)
	},
	{
		id: 'master:fact-greeting-completed',
		introducedInStepId: 'master:story-f6',
		dependsOnFactIds: ['master:fact-bomb-delayable-scientific-input'],
		audienceVisibility: 'overt',
		legacyIds: ['festival-master:fact-22'],
		description: loc('Sorell completes the clean hull-light greeting offline.')
	},
	{
		id: 'master:fact-greeting-authorized-sent',
		introducedInStepId: 'master:story-g1',
		dependsOnFactIds: ['master:fact-greeting-completed'],
		audienceVisibility: 'overt',
		description: loc('Voss authorizes only Sorell’s clean greeting for transmission at contact.')
	},
	{
		id: 'master:fact-station-answered-emissary',
		introducedInStepId: 'master:story-g2b',
		dependsOnFactIds: ['master:fact-greeting-authorized-sent'],
		audienceVisibility: 'overt',
		legacyIds: ['festival-master:fact-23'],
		description: loc(
			'The station answered and sent a protected Velari emissary to meet Sorell.'
		)
	},
	{
		id: 'master:fact-voss-earth-record-credits-zao',
		introducedInStepId: 'master:story-g3',
		dependsOnFactIds: ['master:fact-station-answered-emissary'],
		audienceVisibility: 'overt',
		legacyIds: ['festival-master:fact-24'],
		description: loc(
			'Voss sent Earth an independent record crediting Zao while repair and bomb watch continue.'
		)
	}
];

const RETIRED = [
	'master:fact-undeclared-mass-neutron-aft',
	'master:fact-sabotage-heard-comms-cut',
	'master:fact-burst-sent-earth-wrong-inference',
	'master:fact-zao-dead-flight-cut-after-murder',
	'master:fact-sorell-found-body-cameras',
	'master:fact-recording-ids-bomb-harlan',
	'master:fact-clean-greeting-prepared'
];

const CREW = [
	'character:harlan',
	'character:zao',
	'character:voss',
	'character:rao',
	'character:sorell',
	'character:okoye'
];

function ke(stepId, factId, characterIds) {
	return { stepId, factId, characterIds: [...characterIds] };
}

/** Corrected knowledgeEvents (not a mechanical port of the buggy fact-06 everyone-knows rows). */
function buildKnowledgeEvents() {
	const events = [];
	const addAll = (stepId, factId, ids = CREW) => {
		for (const id of ids) events.push(ke(stepId, factId, [id]));
	};

	addAll('master:story-p2', 'master:fact-voss-misread-motives', [
		'character:voss',
		'character:harlan',
		'character:sorell',
		'character:okoye',
		'character:rao',
		'character:zao'
	]);
	addAll('master:story-a2', 'master:fact-harlan-loading-access-open');
	addAll('master:story-a3b', 'master:fact-first-thrust-cutoff-done');
	addAll('master:story-a4', 'master:fact-fuel-mass-discrepancy', [
		'character:zao',
		'character:rao',
		'character:voss'
	]);
	addAll('master:story-a5', 'master:fact-neutron-excess-detected', [
		'character:zao',
		'character:rao',
		'character:voss'
	]);
	addAll('master:story-b1b', 'master:fact-impulse-package-identified', [
		'character:zao',
		'character:harlan'
	]);

	// Overt cutoff vs withheld Harlan acts
	addAll('master:story-b2', 'master:fact-bridge-hears-cutoff-warning', [
		'character:voss',
		'character:rao',
		'character:okoye',
		'character:sorell',
		'character:harlan',
		'character:zao'
	]);
	events.push(ke('master:story-b2', 'master:fact-harlan-jams-wireless', ['character:harlan']));
	events.push(
		ke('master:story-b3', 'master:fact-harlan-cuts-wired-comms-cameras', ['character:harlan'])
	);

	addAll('master:story-b5', 'master:fact-only-moving-intercept-left', ['character:zao']);
	events.push(
		ke('master:story-c2', 'master:fact-harlan-believes-burst-reached-earth', ['character:harlan'])
	);
	events.push(ke('master:story-c3', 'master:fact-zao-murdered', ['character:harlan']));
	events.push(ke('master:story-c3a', 'master:fact-harlan-secures-vault', ['character:harlan']));
	events.push(ke('master:story-c3a', 'master:fact-flight-controls-cut', ['character:harlan']));
	events.push(ke('master:story-c4', 'master:fact-sorell-found-zao', ['character:sorell']));
	addAll('master:story-c5', 'master:fact-cameras-show-only-rescue', [
		'character:voss',
		'character:rao',
		'character:okoye',
		'character:harlan',
		'character:sorell'
	]);
	// Crew learns Zao is dead when cameras / discovery converge
	addAll('master:story-c5', 'master:fact-zao-murdered', [
		'character:voss',
		'character:rao',
		'character:okoye',
		'character:sorell'
	]);
	addAll('master:story-c7', 'master:fact-harlan-accuses-sorell');
	addAll('master:story-c9', 'master:fact-harlan-accusation-not-proof', [
		'character:voss',
		'character:rao',
		'character:okoye',
		'character:sorell',
		'character:harlan'
	]);
	addAll('master:story-c10', 'master:fact-case-open-station-leg', [
		'character:voss',
		'character:rao',
		'character:okoye',
		'character:sorell',
		'character:harlan'
	]);
	addAll('master:story-d2b', 'master:fact-engine-healthy-separate-causes', [
		'character:voss',
		'character:rao',
		'character:okoye',
		'character:sorell'
	]);
	addAll('master:story-d4', 'master:fact-vault-lock-rejects-timing-diagnostic', [
		'character:voss',
		'character:rao',
		'character:okoye',
		'character:sorell'
	]);
	addAll('master:story-d7', 'master:fact-burst-corridor-signal-incoming');
	addAll('master:story-e2', 'master:fact-recording-identifies-bomb-harlan');
	// Recording reveals Harlan’s withheld acts to the crew
	addAll('master:story-e2', 'master:fact-harlan-jams-wireless', [
		'character:voss',
		'character:rao',
		'character:okoye',
		'character:sorell'
	]);
	addAll('master:story-e2', 'master:fact-harlan-cuts-wired-comms-cameras', [
		'character:voss',
		'character:rao',
		'character:okoye',
		'character:sorell'
	]);
	addAll('master:story-e2', 'master:fact-harlan-secures-vault', [
		'character:voss',
		'character:rao',
		'character:okoye',
		'character:sorell'
	]);
	addAll('master:story-e2', 'master:fact-flight-controls-cut', [
		'character:voss',
		'character:rao',
		'character:okoye',
		'character:sorell'
	]);
	addAll('master:story-e5', 'master:fact-recording-authenticated');
	addAll('master:story-e6', 'master:fact-evidence-converges-revoke-harlan');
	addAll('master:story-e6', 'master:fact-aft-console-only-interrupt');
	addAll('master:story-f2', 'master:fact-harlan-escaped-with-wrist');
	addAll('master:story-f4', 'master:fact-fourth-cutoff-bypass-stairs');
	addAll('master:story-f5', 'master:fact-bomb-delayable-scientific-input', [
		'character:rao',
		'character:voss',
		'character:okoye',
		'character:sorell'
	]);
	addAll('master:story-f6', 'master:fact-greeting-completed', [
		'character:sorell',
		'character:rao',
		'character:voss'
	]);
	addAll('master:story-g1', 'master:fact-greeting-authorized-sent', [
		'character:voss',
		'character:sorell',
		'character:rao',
		'character:okoye'
	]);
	addAll('master:story-g2b', 'master:fact-station-answered-emissary');
	addAll('master:story-g3', 'master:fact-voss-earth-record-credits-zao', [
		'character:voss',
		'character:rao',
		'character:okoye',
		'character:sorell'
	]);

	return events;
}

const ACTION_REQUIREMENTS = [
	{
		stepId: 'master:story-b2',
		actorId: 'character:harlan',
		action: loc('Jam Zao only after hearing that she found sabotage.'),
		requiresKnownFactIds: ['master:fact-impulse-package-identified']
	},
	{
		stepId: 'master:story-b5',
		actorId: 'character:zao',
		action: loc('Choose a concealed future intercept after eliminating the obvious destinations.'),
		requiresKnownFactIds: ['master:fact-bridge-hears-cutoff-warning']
	},
	{
		stepId: 'master:story-c3a',
		actorId: 'character:harlan',
		action: loc(
			'Disable bridge flight commands only after Zao’s warning creates a foreseeable abort.'
		),
		requiresKnownFactIds: ['master:fact-harlan-believes-burst-reached-earth']
	},
	{
		stepId: 'master:story-e5',
		actorId: 'character:voss',
		action: loc('Order an abort only after hearing the authenticated warning.'),
		requiresKnownFactIds: ['master:fact-recording-authenticated']
	},
	{
		stepId: 'master:story-f5',
		actorId: 'character:rao',
		action: loc(
			'Use the timing input instead of cutting power because Zao warned that tampering could trigger the weapon.'
		),
		requiresKnownFactIds: [
			'master:fact-recording-identifies-bomb-harlan',
			'master:fact-fourth-cutoff-bypass-stairs'
		]
	},
	{
		stepId: 'master:story-g1',
		actorId: 'character:voss',
		action: loc('Authorize only Sorell’s clean greeting after the bomb is delayed.'),
		requiresKnownFactIds: ['master:fact-bomb-delayable-scientific-input']
	}
];

/** Cue remaps: old fact id → replacement fact ids to attach on the same cue(s). */
const CUE_FACT_REPLACE = {
	'master:fact-voss-misread-motives': ['master:fact-voss-misread-motives'],
	'master:fact-harlan-loading-access-open': ['master:fact-harlan-loading-access-open'],
	'master:fact-first-thrust-cutoff-done': ['master:fact-first-thrust-cutoff-done'],
	'master:fact-undeclared-mass-neutron-aft': [
		'master:fact-fuel-mass-discrepancy',
		'master:fact-neutron-excess-detected'
	],
	'master:fact-impulse-package-identified': ['master:fact-impulse-package-identified'],
	'master:fact-sabotage-heard-comms-cut': ['master:fact-bridge-hears-cutoff-warning'],
	'master:fact-only-moving-intercept-left': ['master:fact-only-moving-intercept-left'],
	'master:fact-burst-sent-earth-wrong-inference': [
		'master:fact-harlan-believes-burst-reached-earth'
	],
	'master:fact-zao-dead-flight-cut-after-murder': [
		'master:fact-zao-murdered',
		'master:fact-flight-controls-cut'
	],
	'master:fact-sorell-found-body-cameras': [
		'master:fact-sorell-found-zao',
		'master:fact-cameras-show-only-rescue'
	],
	'master:fact-harlan-accusation-not-proof': [
		'master:fact-harlan-accuses-sorell',
		'master:fact-harlan-accusation-not-proof'
	],
	'master:fact-case-open-station-leg': ['master:fact-case-open-station-leg'],
	'master:fact-engine-healthy-separate-causes': ['master:fact-engine-healthy-separate-causes'],
	'master:fact-vault-lock-rejects-timing-diagnostic': [
		'master:fact-vault-lock-rejects-timing-diagnostic'
	],
	'master:fact-burst-corridor-signal-incoming': ['master:fact-burst-corridor-signal-incoming'],
	'master:fact-recording-ids-bomb-harlan': ['master:fact-recording-identifies-bomb-harlan'],
	'master:fact-evidence-converges-revoke-harlan': ['master:fact-evidence-converges-revoke-harlan'],
	'master:fact-aft-console-only-interrupt': ['master:fact-aft-console-only-interrupt'],
	'master:fact-harlan-escaped-with-wrist': ['master:fact-harlan-escaped-with-wrist'],
	'master:fact-fourth-cutoff-bypass-stairs': ['master:fact-fourth-cutoff-bypass-stairs'],
	'master:fact-bomb-delayable-scientific-input': ['master:fact-bomb-delayable-scientific-input'],
	'master:fact-clean-greeting-prepared': [
		'master:fact-greeting-completed',
		'master:fact-greeting-authorized-sent'
	],
	'master:fact-station-answered-emissary': ['master:fact-station-answered-emissary'],
	'master:fact-voss-earth-record-credits-zao': ['master:fact-voss-earth-record-credits-zao']
};

const ANCHOR_CUES = [
	['festival-master:cue-0066', 'master:fact-harlan-believes-burst-reached-earth'],
	['festival-master:cue-0076', 'master:fact-zao-murdered'],
	['festival-master:cue-0077', 'master:fact-flight-controls-cut'],
	['festival-master:cue-0126', 'master:fact-recording-identifies-bomb-harlan'],
	['festival-master:cue-0126', 'master:fact-recording-authenticated']
];

const master = load('data/outlines/light-delay-master-narrative.json');
const script = load('data/scripts/light-delay-festival-master.json');
const festOutline = load('data/outlines/light-delay-festival-master.json');

const retiredFacts = RETIRED.map((id) => {
	const prev = (master.facts || []).find((f) => f.id === id);
	return {
		id,
		description: prev?.description || loc(`Retired: ${id}`),
		status: 'retired',
		legacyIds: prev?.legacyIds,
		introducedInStepId: prev?.introducedInStepId,
		dependsOnFactIds: prev?.dependsOnFactIds,
		audienceVisibility: prev?.audienceVisibility
	};
});

const facts = [
	...ACTIVE.map((f) => ({
		id: f.id,
		description: f.description,
		dependsOnFactIds: f.dependsOnFactIds || [],
		introducedInStepId: f.introducedInStepId,
		audienceVisibility: f.audienceVisibility || 'overt',
		status: 'active',
		...(f.legacyIds ? { legacyIds: f.legacyIds } : {})
	})),
	...retiredFacts
];

const knowledgeEvents = buildKnowledgeEvents();
const actionRequirements = ACTION_REQUIREMENTS;

// Clear + rewire step requires/reveals
const byIntro = new Map();
for (const f of ACTIVE) {
	if (!byIntro.has(f.introducedInStepId)) {
		byIntro.set(f.introducedInStepId, { reveals: [], requires: new Set() });
	}
	byIntro.get(f.introducedInStepId).reveals.push(f.id);
	for (const dep of f.dependsOnFactIds || []) byIntro.get(f.introducedInStepId).requires.add(dep);
}

for (const step of master.steps) {
	delete step.requiresFactIds;
	delete step.revealsFactIds;
	const meta = byIntro.get(step.id);
	if (!meta) continue;
	step.revealsFactIds = meta.reveals;
	const requires = [...meta.requires].filter((id) => !meta.reveals.includes(id));
	if (requires.length) step.requiresFactIds = requires;
}

master.facts = facts;
master.knowledgeEvents = knowledgeEvents;
master.actionRequirements = actionRequirements;
master.outline.revision = (master.outline.revision || 20) + 1;
if (master.outline.localization?.translations?.es) {
	master.outline.localization.translations.es.status = 'needs_revision';
}

// Remap cue implementsFactIds
for (const cue of script.cues || []) {
	const old = cue.implementsFactIds || [];
	if (!old.length) continue;
	const next = new Set();
	for (const id of old) {
		const mapped = CUE_FACT_REPLACE[id] || [id];
		for (const m of mapped) next.add(m);
	}
	cue.implementsFactIds = [...next];
}

const cueById = new Map(script.cues.map((c) => [c.id, c]));
function addCueFact(cueId, factId) {
	const cue = cueById.get(cueId);
	if (!cue) throw new Error(`Missing cue ${cueId}`);
	const set = new Set(cue.implementsFactIds || []);
	set.add(factId);
	cue.implementsFactIds = [...set];
}
for (const [cueId, factId] of ANCHOR_CUES) addCueFact(cueId, factId);

// Ensure every active fact that Festival covers has at least one cue: fill gaps by story intro mapping
const festStories = festOutline.steps.filter((s) => s.level === 'story');
const coveredMasterSteps = new Set();
for (const story of festStories) {
	for (const ref of story.sourceRefs || []) {
		if (ref.kind === 'outline' && ref.outlineId === 'outline:light-delay-master-narrative') {
			coveredMasterSteps.add(ref.stepId);
		}
	}
}
const implemented = new Set();
for (const cue of script.cues) {
	for (const id of cue.implementsFactIds || []) implemented.add(id);
}

const storyByMasterLast = [];
for (const story of festStories) {
	const masters = (story.sourceRefs || [])
		.filter((r) => r.kind === 'outline' && r.outlineId === 'outline:light-delay-master-narrative')
		.map((r) => r.stepId);
	if (!masters.length) continue;
	storyByMasterLast.push({ masters, cueIds: story.cueIds || [] });
}

function findCuesForMasterStep(stepId) {
	const hits = storyByMasterLast.filter((s) => s.masters.includes(stepId));
	const cues = [];
	for (const h of hits) cues.push(...h.cueIds);
	return cues;
}

const cueIndex = new Map(script.cues.map((c, i) => [c.id, i]));
for (const fact of ACTIVE) {
	if (!coveredMasterSteps.has(fact.introducedInStepId)) continue;
	if (implemented.has(fact.id)) continue;
	const candidates = findCuesForMasterStep(fact.introducedInStepId);
	if (!candidates.length) {
		console.warn(`No festival cue candidates for ${fact.id} @ ${fact.introducedInStepId}`);
		continue;
	}
	// Prefer latest cue in the covering stories
	const chosen = [...candidates].sort(
		(a, b) => (cueIndex.get(a) ?? 0) - (cueIndex.get(b) ?? 0)
	)[candidates.length - 1];
	addCueFact(chosen, fact.id);
	implemented.add(fact.id);
	console.log(`Bound gap ${fact.id} → ${chosen}`);
}

console.log(
	JSON.stringify(
		{
			revision: master.outline.revision,
			active: ACTIVE.length,
			retired: RETIRED.length,
			knowledgeEvents: knowledgeEvents.length,
			actionRequirements: actionRequirements.length,
			cuesWithFacts: script.cues.filter((c) => c.implementsFactIds?.length).length
		},
		null,
		2
	)
);

if (!write) {
	console.log('Dry run only. Re-run with --write to persist.');
	process.exit(0);
}

writeFileSync(
	join(ROOT, 'data/outlines/light-delay-master-narrative.json'),
	JSON.stringify(master, null, 2) + '\n',
	'utf8'
);
writeFileSync(
	join(ROOT, 'data/scripts/light-delay-festival-master.json'),
	JSON.stringify(script, null, 2) + '\n',
	'utf8'
);
console.log('Wrote master outline + Festival script cue bindings.');
