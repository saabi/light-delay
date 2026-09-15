/**
 * Surgical authorship fix for Festival-master scenes 20–22 (shots 057–067).
 * Locks the script JSON during the write; marks stale panels; stamps videoPromptFreeze.
 *
 * Run: node scripts/_fix-scene-20-22-authorship.mjs
 * Agent: Auto (Composer) — scenes 20–22 still + video prep
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOCK_DIR = join(ROOT, '.locks');
const LOCK_PATH = join(LOCK_DIR, 'festival-master-script.lock');
const scriptPath = join(ROOT, 'data/scripts/light-delay-festival-master.json');
const assetsPath = join(ROOT, 'data/assets.json');

const AGENT = 'Auto (Composer agent) — scenes 20-22 authorship';
const FREEZE = {
	status: 'approved',
	approvedAt: '2026-09-15',
	source:
		'agent authorship prep scenes 20-22; submit Seedance only after still regen + human go'
};

const BRIDGE_IDENTITY =
	'Harlan is the younger clean-shaven dark-haired officer (right panel of the Voss–Harlan pair sheet); Voss is the older silver-bearded captain (left panel of that sheet)—never swap them. Rao is the East-Asian woman in the lighter gray jacket (Rao–Sorell pair sheet); Sorell is the other woman on that sheet; Okoye is the Black woman with short natural hair (Okoye–Voss pair sheet). Ignore studio/pair-sheet backgrounds; use only the bridge location reference for architecture. No burned-in spoken dialogue or subtitles; English-only diegetic UI when visible.';

const PHYSICS_1G = {
	en: 'Steady 1 g artificial gravity on the bridge after thrust restore: feet planted, normal weight, seated or standing as blocked, no floating debris or drifting hair.',
	es: 'needs_revision'
};

const LIGHTING_BRIDGE = {
	en: 'Bridge practicals and English-only console glow; matte panels; no smoke or haze.',
	es: 'needs_revision'
};

const BRIDGE_BLOCKING = [
	{
		characterId: 'character:voss',
		zoneOrSeat: 'command station / meeting-table captain side',
		screenSide: 'center',
		facing: 'the active exchange and displays',
		posture: 'standing or braced at command',
		eyelineTarget: 'the active exchange'
	},
	{
		characterId: 'character:rao',
		zoneOrSeat: 'science/analysis console along the station arc',
		screenSide: 'left',
		facing: 'her display and the crew',
		posture: 'standing or seated at console',
		eyelineTarget: 'the display'
	},
	{
		characterId: 'character:harlan',
		zoneOrSeat: 'secondary console / aft security approach, screen right',
		screenSide: 'right',
		facing: 'the displays and command',
		posture: 'standing',
		eyelineTarget: 'the display'
	},
	{
		characterId: 'character:okoye',
		zoneOrSeat: 'security station deep left along the arc',
		screenSide: 'left',
		facing: 'Harlan and command',
		posture: 'standing, ready to interpose',
		eyelineTarget: 'character:harlan'
	},
	{
		characterId: 'character:sorell',
		zoneOrSeat: 'translator/crew station deep right background',
		screenSide: 'right',
		facing: 'the active display',
		posture: 'standing, listening',
		eyelineTarget: 'the display'
	}
];

function acquireLock() {
	mkdirSync(LOCK_DIR, { recursive: true });
	if (existsSync(LOCK_PATH)) {
		const existing = readFileSync(LOCK_PATH, 'utf8');
		throw new Error(`Lock held:\n${existing}\nAborting to avoid concurrent edit.`);
	}
	writeFileSync(
		LOCK_PATH,
		JSON.stringify(
			{
				holder: AGENT,
				file: 'data/scripts/light-delay-festival-master.json',
				purpose: 'scenes 20-22 stretch/shot authorship + video freeze',
				startedAt: new Date().toISOString()
			},
			null,
			2
		),
		'utf8'
	);
}

function releaseLock() {
	if (existsSync(LOCK_PATH)) unlinkSync(LOCK_PATH);
}

function patchStretch(script, id, patch) {
	const vs = script.visualStretches.find((s) => s.id === id);
	if (!vs) throw new Error(`Missing stretch ${id}`);
	Object.assign(vs, patch);
	return vs;
}

function setShot(script, id, fields) {
	const shot = script.shots.find((s) => s.id === id);
	if (!shot) throw new Error(`Missing shot ${id}`);
	if (fields.description) shot.description = fields.description;
	if (fields.visibleRefs) shot.visibleRefs = fields.visibleRefs;
	if (fields.framingEn) {
		shot.composition = shot.composition || {};
		shot.composition.framing = {
			...(shot.composition.framing || {}),
			en: fields.framingEn,
			es: shot.composition.framing?.es || 'needs_revision'
		};
	}
	if (fields.offScreenCharacterIds !== undefined) {
		shot.offScreenCharacterIds = fields.offScreenCharacterIds;
	}
	if (fields.durationMs !== undefined) shot.durationMs = fields.durationMs;
}

acquireLock();
try {
	const script = JSON.parse(readFileSync(scriptPath, 'utf8'));
	const assetsDoc = JSON.parse(readFileSync(assetsPath, 'utf8'));

	// --- Scene 20: vector 057–059 ---
	patchStretch(script, 'festival-master:stretch-bridge-vector-057-059', {
		members: [
			{
				shotId: 'festival-master:shot-plan-057',
				order: 1,
				takeScope: 'selected',
				keyframeRole: 'establish',
				startState: {
					en: 'Thrust has restored steady 1 g; Rao is planted at her analysis console reading the reconstructed firing-angle display.',
					es: 'needs_revision'
				},
				event: {
					en: 'On the English-only display, the plotted vector aims at empty future intercept space—no planet, station, or beacon—while Voss listens center-frame and Harlan watches from screen right.',
					es: 'needs_revision'
				},
				endState: {
					en: 'The empty-direction problem is readable on Rao’s console; Sorell and Okoye stay deep in background depth.',
					es: 'needs_revision'
				}
			},
			{
				shotId: 'festival-master:shot-plan-058',
				order: 2,
				takeScope: 'selected',
				keyframeRole: 'develop',
				startState: {
					en: 'Same 1 g bridge geography; full crew still at the blocked stations.',
					es: 'needs_revision'
				},
				event: {
					en: 'Voss (silver beard—never Harlan) leans in and authorizes further comparison—curious, decisive—while Rao stays ready at the console to test a moving-receiver hypothesis.',
					es: 'needs_revision'
				},
				endState: {
					en: 'The bridge is primed to chase the unexplained optical packet; identities and seats unchanged.',
					es: 'needs_revision'
				}
			},
			{
				shotId: 'festival-master:shot-plan-059',
				order: 3,
				takeScope: 'selected',
				keyframeRole: 'payoff',
				startState: {
					en: 'Brief insert: Harlan alone at the secondary console under 1 g; other crew out of frame.',
					es: 'needs_revision'
				},
				event: {
					en: 'Harlan (younger, clean-shaven) watches the unrecoverable burst record with private mourning, hand near chin—no floating, feet planted.',
					es: 'needs_revision'
				},
				endState: {
					en: 'His private reaction closes the vector beat before the incoming packet.',
					es: 'needs_revision'
				}
			}
		],
		physics: PHYSICS_1G,
		lighting: {
			en: 'Bridge practicals with the reconstructed vector display glowing English-only; no smoke.',
			es: 'needs_revision'
		},
		blocking: BRIDGE_BLOCKING,
		sharedDescription: {
			en: `Continuous bridge vector beat under steady 1 g. ${BRIDGE_IDENTITY} Panel 1 favors Rao at the vector display; panel 2 keeps the five-person geography; panel 3 is Harlan alone.`,
			es: 'needs_revision'
		},
		videoPromptFreeze: FREEZE
	});

	setShot(script, 'festival-master:shot-plan-057', {
		description: {
			en: 'Thrust restores and weight settles Elin Rao at her station as she reads the display: only firing angles and ship attitude survive from Zao’s reconstructed burst; the plotted vector points at no planet, station, or beacon.',
			es: 'needs_revision'
		},
		visibleRefs: [
			{ kind: 'character', id: 'character:rao', role: 'in focus at analysis console, reading the vector' },
			{ kind: 'character', id: 'character:voss', role: 'present at command, listening' },
			{ kind: 'character', id: 'character:harlan', role: 'present screen-right, watching the display' },
			{ kind: 'character', id: 'character:okoye', role: 'deep background left, listening' }
		],
		framingEn:
			'Medium close-up favoring Elin Rao at the vector display with Voss and Harlan readable; Okoye deep left; Sorell out of frame; Locked; establishes geography and screen direction.',
		offScreenCharacterIds: ['character:sorell']
	});
	setShot(script, 'festival-master:shot-plan-058', {
		description: {
			en: 'Voss, curious, authorizes further comparison—what did the burst hit—while Rao stays ready to test a moving receiver.',
			es: 'needs_revision'
		},
		visibleRefs: [
			{ kind: 'character', id: 'character:voss', role: 'speaking, in focus' },
			{ kind: 'character', id: 'character:rao', role: 'at console, ready to compare' },
			{ kind: 'character', id: 'character:harlan', role: 'present, listening' },
			{ kind: 'character', id: 'character:sorell', role: 'present, listening' },
			{ kind: 'character', id: 'character:okoye', role: 'present, listening' }
		],
		framingEn:
			'Over-the-shoulder on Voss toward Rao and the crew under 1 g; Tracking; preserves eyeline and action-axis continuity.',
		offScreenCharacterIds: []
	});
	setShot(script, 'festival-master:shot-plan-059', {
		description: {
			en: 'Alone for a moment, Harlan watches the unrecoverable burst record, mourning that they will never know who saved them.',
			es: 'needs_revision'
		},
		visibleRefs: [
			{ kind: 'character', id: 'character:harlan', role: 'center, alone, at the console, hand to chin' }
		],
		framingEn: 'Medium close-up on Harlan alone; Dolly; orthogonal, legible insert framing.',
		offScreenCharacterIds: ['character:rao', 'character:voss', 'character:sorell', 'character:okoye']
	});

	// --- Scene 21: packet open 060–061 ---
	patchStretch(script, 'festival-master:stretch-bridge-packet-open-060-061', {
		members: [
			{
				shotId: 'festival-master:shot-plan-060',
				order: 1,
				takeScope: 'selected',
				keyframeRole: 'establish',
				startState: {
					en: 'Same 1 g bridge; Rao at analysis left, Voss center, Sorell near-right; Harlan and Okoye readable in depth.',
					es: 'needs_revision'
				},
				event: {
					en: 'An incoming optical packet resolves on Rao’s English-only display; she urgently identifies Zao’s personal format and pre-crossing signature.',
					es: 'needs_revision'
				},
				endState: {
					en: 'Authenticity is established on the display; Voss and Sorell attend.',
					es: 'needs_revision'
				}
			},
			{
				shotId: 'festival-master:shot-plan-061',
				order: 2,
				takeScope: 'selected',
				keyframeRole: 'payoff',
				startState: {
					en: 'Crew still planted under 1 g, attention on Rao’s packet display.',
					es: 'needs_revision'
				},
				event: {
					en: 'Voss orders the packet opened/played at once—decisive, no floating—while Rao confirms readiness at the console.',
					es: 'needs_revision'
				},
				endState: {
					en: 'The bridge is ready for Zao’s recorded vault flashback.',
					es: 'needs_revision'
				}
			}
		],
		physics: {
			en: 'Steady 1 g on the bridge; all five remain at their blocked stations with feet planted—no microgravity.',
			es: 'needs_revision'
		},
		lighting: {
			en: 'Bridge practicals with the incoming optical packet bright on Rao’s English-only display.',
			es: 'needs_revision'
		},
		blocking: [
			{
				characterId: 'character:rao',
				zoneOrSeat: 'analysis station',
				screenSide: 'left',
				facing: 'her display',
				posture: 'standing at console',
				eyelineTarget: 'the incoming packet'
			},
			{
				characterId: 'character:voss',
				zoneOrSeat: 'command station',
				screenSide: 'center',
				facing: 'Rao',
				posture: 'standing',
				eyelineTarget: 'character:rao'
			},
			{
				characterId: 'character:sorell',
				zoneOrSeat: 'translator station near-right',
				screenSide: 'right',
				facing: 'Rao’s display',
				posture: 'standing',
				eyelineTarget: 'character:rao'
			},
			{
				characterId: 'character:harlan',
				zoneOrSeat: 'aft secondary console, far right depth',
				screenSide: 'right',
				facing: 'Rao and the packet',
				posture: 'standing',
				eyelineTarget: 'character:rao'
			},
			{
				characterId: 'character:okoye',
				zoneOrSeat: 'security station, far left depth',
				screenSide: 'left',
				facing: 'command',
				posture: 'standing',
				eyelineTarget: 'character:voss'
			}
		],
		sharedDescription: {
			en: `Two-panel bridge packet reception under steady 1 g. ${BRIDGE_IDENTITY} Focus is Rao authenticating Zao’s delayed optical packet, then Voss ordering playback; Harlan and Okoye remain in depth.`,
			es: 'needs_revision'
		},
		videoPromptFreeze: FREEZE
	});

	setShot(script, 'festival-master:shot-plan-060', {
		description: {
			en: 'An incoming optical signal resolves on Elin’s display; urgent, she identifies Zao’s packet format, personal signature, and pre-crossing send.',
			es: 'needs_revision'
		},
		visibleRefs: [
			{ kind: 'character', id: 'character:rao', role: 'speaking, in focus, at her bridge station' },
			{ kind: 'character', id: 'character:voss', role: 'at frame edge, listening' },
			{ kind: 'character', id: 'character:sorell', role: 'at frame edge, listening' }
		],
		framingEn:
			'Medium close-up on Elin Rao with Voss and Sorell at frame edges under 1 g; Pan; establishes geography and screen direction.'
	});
	setShot(script, 'festival-master:shot-plan-061', {
		description: {
			en: 'Voss orders the authenticated packet opened at once while Rao stays at the console ready to play it.',
			es: 'needs_revision'
		}
	});

	// --- Scene 21: vault flashback 062–063 ---
	patchStretch(script, 'festival-master:stretch-vault-flashback-062-063', {
		members: [
			{
				shotId: 'festival-master:shot-plan-062',
				order: 1,
				takeScope: 'selected',
				keyframeRole: 'establish',
				startState: {
					en: 'Delayed flashback: microgravity vault; Zao braced/handhold beside the armed impulse package and controller.',
					es: 'needs_revision'
				},
				event: {
					en: 'She records the warning beside the device—determined, secured to structure—identifying the Proxima geophysical impulse package as the threat.',
					es: 'needs_revision'
				},
				endState: {
					en: 'Package and Zao remain vault-anchored; no bridge architecture.',
					es: 'needs_revision'
				}
			},
			{
				shotId: 'festival-master:shot-plan-063',
				order: 2,
				takeScope: 'selected',
				keyframeRole: 'payoff',
				startState: {
					en: 'Same MG vault footing; Zao still secured beside the package.',
					es: 'needs_revision'
				},
				event: {
					en: 'She explains Jupiter occlusion and forward intercept; a faint English-only diagram of the wormhole and a lead point ahead may superimpose near her.',
					es: 'needs_revision'
				},
				endState: {
					en: 'The aimed-ahead optical warning is visually motivated; still microgravity, still vault only.',
					es: 'needs_revision'
				}
			}
		],
		physics: {
			en: 'Microgravity flashback in the inner shielding vault: no usable floor; Zao and the package are secured to vault structure with handholds—nothing rests as if under 1 g.',
			es: 'needs_revision'
		},
		lighting: {
			en: 'Vault service lighting and the package controller’s diagnostic glow; English-only diegetic UI if any.',
			es: 'needs_revision'
		},
		blocking: [
			{
				characterId: 'character:zao',
				zoneOrSeat: 'package service panel, handhold braced',
				screenSide: 'center',
				facing: 'the package and recorder',
				posture: 'braced / handhold in microgravity',
				eyelineTarget: 'the package'
			}
		],
		sharedDescription: {
			en: 'Two-panel delayed vault flashback in microgravity only—ignore any bridge background. Zao alone with the armed Proxima geophysical impulse package per the attached sheets. No burned-in spoken dialogue or subtitles; English-only diegetic diagram/UI if shown.',
			es: 'needs_revision'
		},
		videoPromptFreeze: FREEZE
	});

	setShot(script, 'festival-master:shot-plan-062', {
		description: {
			en: 'Flashback: Zao, determined and braced in microgravity, records her warning beside the armed Proxima impulse package in the shielding vault—identifying mass, timer, neutron signature, and the protected controller.',
			es: 'needs_revision'
		},
		visibleRefs: [
			{ kind: 'character', id: 'character:zao', role: 'in focus, center frame, handhold braced' },
			{
				kind: 'object',
				id: 'object:proxima-geophysical-impulse-package',
				role: 'the armed device and its controller, in frame'
			}
		]
	});
	setShot(script, 'festival-master:shot-plan-063', {
		description: {
			en: 'Zao, resolved and still vault-braced in microgravity, continues the recorded explanation as a faint English-only diagram of the wormhole and a lead point ahead of it appears superimposed.',
			es: 'needs_revision'
		}
	});

	// --- Scene 21: command break 064 (convert to combined sheet) ---
	patchStretch(script, 'festival-master:stretch-bridge-command-break-064', {
		members: [
			{
				shotId: 'festival-master:shot-plan-064',
				order: 1,
				takeScope: 'selected',
				keyframeRole: 'establish',
				startState: {
					en: 'Back on the 1 g bridge after the flashback; five crew in the shared geography.',
					es: 'needs_revision'
				},
				event: {
					en: 'Voss urgently aborts the approach and orders Harlan held; Okoye moves in to block Harlan’s exit while Harlan’s wrist device remains visible on his arm.',
					es: 'needs_revision'
				},
				endState: {
					en: 'Harlan is stopped in place; Okoye interposed; command break begins.',
					es: 'needs_revision'
				}
			}
		],
		physics: PHYSICS_1G,
		lighting: LIGHTING_BRIDGE,
		blocking: [
			{
				characterId: 'character:voss',
				zoneOrSeat: 'command station',
				screenSide: 'center',
				facing: 'Harlan and Okoye',
				posture: 'standing, urgent',
				eyelineTarget: 'character:harlan'
			},
			{
				characterId: 'character:okoye',
				zoneOrSeat: 'between Harlan and the exit / hatch line',
				screenSide: 'left',
				facing: 'Harlan',
				posture: 'standing, blocking',
				eyelineTarget: 'character:harlan'
			},
			{
				characterId: 'character:harlan',
				zoneOrSeat: 'aft approach, stopped',
				screenSide: 'right',
				facing: 'Voss / Okoye',
				posture: 'standing, halted',
				eyelineTarget: 'character:voss'
			},
			{
				characterId: 'character:rao',
				zoneOrSeat: 'analysis console',
				screenSide: 'left',
				facing: 'the confrontation',
				posture: 'standing',
				eyelineTarget: 'character:voss'
			},
			{
				characterId: 'character:sorell',
				zoneOrSeat: 'translator station depth',
				screenSide: 'right',
				facing: 'the confrontation',
				posture: 'standing',
				eyelineTarget: 'character:harlan'
			}
		],
		sharedDescription: {
			en: `Single-panel command-break under steady 1 g. ${BRIDGE_IDENTITY} Okoye physically interposes to hold Harlan; Harlan’s wrist device matches the prop sheet. Ignore pair-sheet backgrounds.`,
			es: 'needs_revision'
		},
		generationProfile: {
			stillMode: 'combined_storyboard_sheet',
			videoMode: 'grouped_seedance',
			gridLayout: {
				rows: 2,
				cols: 2,
				gutterFraction: 0.02,
				panelAspect: '16:9',
				blankCells: [2, 3, 4]
			},
			maxMembersPerVideoJob: 1
		},
		combinedStillAssetId: 'asset:festival-master-stretch-bridge-command-break-064-sheet',
		videoPromptFreeze: FREEZE
	});

	setShot(script, 'festival-master:shot-plan-064', {
		description: {
			en: 'Back on the bridge under 1 g, Voss urgently aborts the approach and orders Harlan held; Okoye moves to block him.',
			es: 'needs_revision'
		},
		// Seedance minimum duration floor (4s); was 4060 — keep ≥4000 with slight headroom for cue span.
		durationMs: 4200
	});

	// --- Scene 22: command break 065–067 ---
	patchStretch(script, 'festival-master:stretch-bridge-command-break-065-067', {
		members: [
			{
				shotId: 'festival-master:shot-plan-065',
				order: 1,
				takeScope: 'selected',
				keyframeRole: 'establish',
				startState: {
					en: 'Same 1 g bridge confrontation geography; Okoye still interposed near Harlan.',
					es: 'needs_revision'
				},
				event: {
					en: 'Harlan, defensive, tries to separate accusation from proof—voice and face could be built from ship archives—while Rao listens ready to deny the premise.',
					es: 'needs_revision'
				},
				endState: {
					en: 'Doubt is planted; Harlan remains held in place.',
					es: 'needs_revision'
				}
			},
			{
				shotId: 'festival-master:shot-plan-066',
				order: 2,
				takeScope: 'selected',
				keyframeRole: 'develop',
				startState: {
					en: 'Continuous 1 g blocking; Rao steps the evidence forward at her console / toward Harlan.',
					es: 'needs_revision'
				},
				event: {
					en: 'Rao, analytical, lists converging independent evidence (signature, timestamp, mass, neutrons, vector, lock, missing location, accusation) without relying on the voice; Harlan counters that agreement is not proof.',
					es: 'needs_revision'
				},
				endState: {
					en: 'The case against Harlan is stronger but not closed.',
					es: 'needs_revision'
				}
			},
			{
				shotId: 'festival-master:shot-plan-067',
				order: 3,
				takeScope: 'selected',
				keyframeRole: 'payoff',
				startState: {
					en: 'Wide bridge under 1 g; five still in the same geography.',
					es: 'needs_revision'
				},
				event: {
					en: 'Rao sets the proportionate standard—enough to isolate Harlan, enough to release Zao; Voss looks between Harlan and Sorell, recognizing how much of his case came from his own first mistake.',
					es: 'needs_revision'
				},
				endState: {
					en: 'Isolation of Harlan and the path to releasing Zao are established.',
					es: 'needs_revision'
				}
			}
		],
		physics: PHYSICS_1G,
		lighting: LIGHTING_BRIDGE,
		blocking: [
			{
				characterId: 'character:harlan',
				zoneOrSeat: 'held position screen-right',
				screenSide: 'right',
				facing: 'Rao and Voss',
				posture: 'standing, defensive',
				eyelineTarget: 'character:rao'
			},
			{
				characterId: 'character:rao',
				zoneOrSeat: 'analysis / confrontation mid-left',
				screenSide: 'left',
				facing: 'Harlan',
				posture: 'standing, analytical then firm',
				eyelineTarget: 'character:harlan'
			},
			{
				characterId: 'character:voss',
				zoneOrSeat: 'command center',
				screenSide: 'center',
				facing: 'Harlan and Sorell',
				posture: 'standing',
				eyelineTarget: 'character:harlan'
			},
			{
				characterId: 'character:okoye',
				zoneOrSeat: 'interposed near Harlan',
				screenSide: 'right',
				facing: 'Harlan',
				posture: 'standing, securing',
				eyelineTarget: 'character:harlan'
			},
			{
				characterId: 'character:sorell',
				zoneOrSeat: 'depth near translator station',
				screenSide: 'left',
				facing: 'Voss and Harlan',
				posture: 'standing',
				eyelineTarget: 'character:voss'
			}
		],
		sharedDescription: {
			en: `Three-panel command-break argument under steady 1 g. ${BRIDGE_IDENTITY} Harlan remains held; Okoye stays interposed; Rao drives the evidence; Voss absorbs the cost of his first mistake. Wrist device visible on Harlan when framed. Ignore pair-sheet backgrounds.`,
			es: 'needs_revision'
		},
		generationProfile: {
			stillMode: 'combined_storyboard_sheet',
			videoMode: 'grouped_seedance',
			gridLayout: {
				rows: 2,
				cols: 2,
				gutterFraction: 0.02,
				panelAspect: '16:9',
				blankCells: [4]
			},
			maxMembersPerVideoJob: 1
		},
		combinedStillAssetId: 'asset:festival-master-stretch-bridge-command-break-065-067-sheet',
		videoPromptFreeze: FREEZE
	});

	setShot(script, 'festival-master:shot-plan-065', {
		description: {
			en: 'Harlan, defensive and still held, tries to separate accusation from proof—arguing a voice and face could be built from ship archives.',
			es: 'needs_revision'
		}
	});
	setShot(script, 'festival-master:shot-plan-066', {
		description: {
			en: 'Elin Rao, analytical, denies his premise and lists converging evidence—signature, timestamp, mass, neutrons, vector, lock, missing location, accusation—while Harlan counters that agreement is not proof.',
			es: 'needs_revision'
		}
	});
	setShot(script, 'festival-master:shot-plan-067', {
		description: {
			en: 'Elin Rao, firm, sets the proportionate standard: enough to isolate Harlan, enough to release Zao. Voss looks between Harlan and Sorell, seeing how much of his case came from his own first mistake.',
			es: 'needs_revision'
		}
	});

	// Align cue span for 064 if we bumped duration (keep last cue within shot).
	const shot064 = script.shots.find((s) => s.id === 'festival-master:shot-plan-064');
	if (shot064?.cuePlacements?.length) {
		const last = shot064.cuePlacements[shot064.cuePlacements.length - 1];
		const end = (last.atMs || 0) + (last.durationMs || 0);
		if (end > shot064.durationMs) {
			last.durationMs = Math.max(500, shot064.durationMs - (last.atMs || 0));
		}
	}

	writeFileSync(scriptPath, `${JSON.stringify(script, null, 2)}\n`, 'utf8');

	const stalePanelIds = [
		'asset:festival-master-stretch-bridge-vector-057-059-panel-01',
		'asset:festival-master-stretch-bridge-vector-057-059-panel-02',
		'asset:festival-master-stretch-bridge-vector-057-059-panel-03',
		'asset:festival-master-stretch-bridge-packet-open-060-061-panel-01',
		'asset:festival-master-stretch-bridge-packet-open-060-061-panel-02',
		'asset:festival-master-stretch-vault-flashback-062-063-panel-01',
		'asset:festival-master-stretch-vault-flashback-062-063-panel-02',
		'asset:festival-master-stretch-bridge-command-break-064-067-panel-01',
		'asset:festival-master-stretch-bridge-command-break-064-067-panel-02',
		'asset:festival-master-stretch-bridge-command-break-064-067-panel-03',
		'asset:festival-master-stretch-bridge-command-break-064-067-panel-04'
	];
	const explanation = {
		en: 'Stale after scenes 20–22 stretch authorship fix (gravity/identity/blocking/scrub-safe). Needs regeneration; do not use for Seedance until replaced.',
		es: 'needs_revision'
	};
	let marked = 0;
	for (const asset of assetsDoc.assets) {
		if (!stalePanelIds.includes(asset.id)) continue;
		asset.imageStatus = {
			status: 'needs_regeneration',
			reasons: ['continuity'],
			explanation
		};
		marked += 1;
	}
	writeFileSync(assetsPath, `${JSON.stringify(assetsDoc, null, 2)}\n`, 'utf8');

	console.log(
		JSON.stringify(
			{
				ok: true,
				agent: AGENT,
				script: scriptPath,
				stretchesPatched: 5,
				panelsMarkedNeedsRegen: marked,
				videoPromptFreeze: FREEZE
			},
			null,
			2
		)
	);
} finally {
	releaseLock();
}
