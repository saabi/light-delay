/**
 * Assign Festival-master implementsFactIds with content-verified cue bindings
 * (not story-window adjacency). Re-run after apply-master-fact-migration-notes.mjs
 * or when meaning-audit finds mis-anchored facts.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const script = JSON.parse(
	readFileSync(join(ROOT, 'data/scripts/light-delay-festival-master.json'), 'utf8')
);
const cueById = new Map(script.cues.map((c) => [c.id, c]));

for (const cue of script.cues) delete cue.implementsFactIds;

function add(cueId, factId) {
	const cue = cueById.get(cueId);
	if (!cue) throw new Error(`Missing ${cueId}`);
	const set = new Set(cue.implementsFactIds || []);
	set.add(factId);
	cue.implementsFactIds = [...set];
}

/**
 * Content-verified assignments (meaning-audit 2026-09-13).
 * Dependency facts must appear on earlier cue indices than dependents.
 */
const ASSIGNMENTS = [
	['festival-master:cue-0011', 'master:fact-voss-misread-motives'],
	['festival-master:cue-0018', 'master:fact-harlan-loading-access-open'],
	['festival-master:cue-0029', 'master:fact-first-thrust-cutoff-done'],
	['festival-master:cue-0032', 'master:fact-fuel-mass-discrepancy'],
	['festival-master:cue-0035', 'master:fact-neutron-excess-detected'],
	['festival-master:cue-0045', 'master:fact-impulse-package-identified'],
	['festival-master:cue-0047', 'master:fact-bridge-hears-cutoff-warning'],
	['festival-master:cue-0048', 'master:fact-harlan-jams-wireless'],
	['festival-master:cue-0052', 'master:fact-harlan-cuts-wired-comms-cameras'],
	['festival-master:cue-0064', 'master:fact-only-moving-intercept-left'],
	['festival-master:cue-0066', 'master:fact-harlan-believes-burst-reached-earth'],
	['festival-master:cue-0076', 'master:fact-zao-murdered'],
	['festival-master:cue-0077', 'master:fact-harlan-secures-vault'],
	['festival-master:cue-0077', 'master:fact-flight-controls-cut'],
	['festival-master:cue-0083', 'master:fact-sorell-found-zao'],
	['festival-master:cue-0090', 'master:fact-cameras-show-only-rescue'],
	['festival-master:cue-0092', 'master:fact-harlan-accuses-sorell'],
	['festival-master:cue-0096', 'master:fact-harlan-accusation-not-proof'],
	['festival-master:cue-0098', 'master:fact-case-open-station-leg'],
	['festival-master:cue-0106', 'master:fact-engine-healthy-separate-causes'],
	['festival-master:cue-0113', 'master:fact-vault-lock-rejects-timing-diagnostic'],
	['festival-master:cue-0122', 'master:fact-burst-corridor-signal-incoming'],
	['festival-master:cue-0126', 'master:fact-recording-identifies-bomb-harlan'],
	['festival-master:cue-0133', 'master:fact-recording-authenticated'],
	['festival-master:cue-0136', 'master:fact-evidence-converges-revoke-harlan'],
	['festival-master:cue-0143', 'master:fact-aft-console-only-interrupt'],
	['festival-master:cue-0156', 'master:fact-harlan-escaped-with-wrist'],
	['festival-master:cue-0163', 'master:fact-fourth-cutoff-bypass-stairs'],
	['festival-master:cue-0168', 'master:fact-bomb-delayable-scientific-input'],
	['festival-master:cue-0172', 'master:fact-greeting-completed'],
	['festival-master:cue-0176', 'master:fact-greeting-authorized-sent'],
	['festival-master:cue-0187', 'master:fact-station-answered-emissary'],
	['festival-master:cue-0196', 'master:fact-voss-earth-record-credits-zao']
];

for (const [cueId, factId] of ASSIGNMENTS) add(cueId, factId);

writeFileSync(
	join(ROOT, 'data/scripts/light-delay-festival-master.json'),
	JSON.stringify(script, null, 2) + '\n',
	'utf8'
);
console.log(`Assigned ${ASSIGNMENTS.length} fact→cue bindings`);
