import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('..', import.meta.url)));
const scriptPath = join(ROOT, 'data/scripts/light-delay-festival-master.json');
const script = JSON.parse(readFileSync(scriptPath, 'utf8'));

const targetIds = new Set([
	...(script.takes ?? []).filter((take) => !take.imageAssetId).map((take) => take.shotId),
	'festival-master:shot-plan-089',
	'festival-master:shot-plan-091'
]);
const sphere = 'asset:vehicle-velari-transport-sphere-sheet';
const envoy = 'asset:character-velari-envoy-sheet';
const refOverrides = {
	'023': ['asset:character-harlan-sheet', 'asset:character-voss-sheet', 'asset:character-sorell-sheet', 'asset:location-celestial-ardor-bridge-realistic-reference', 'asset:location-celestial-ardor-bridge-service-shaft-reference'],
	'025': ['asset:character-voss-sheet', 'asset:character-sorell-sheet', 'asset:character-rao-sheet', 'asset:character-okoye-sheet', 'asset:location-celestial-ardor-bridge-realistic-reference'],
	'046': ['asset:character-voss-sheet', 'asset:character-harlan-sheet', 'asset:character-sorell-sheet', 'asset:character-rao-sheet', 'asset:location-celestial-ardor-bridge-realistic-reference'],
	'057': ['asset:character-voss-sheet', 'asset:character-harlan-sheet', 'asset:character-rao-sheet', 'asset:character-okoye-sheet', 'asset:location-celestial-ardor-bridge-realistic-reference'],
	'080': ['asset:character-rao-sheet', 'asset:location-celestial-ardor-inner-shielding-vault-sheet', 'asset:object-harlan-wrist-device-sheet', 'asset:object-optical-contingency-transmitter-sheet', 'asset:character-voss-sheet'],
	'081': ['asset:character-rao-sheet', 'asset:location-celestial-ardor-inner-shielding-vault-sheet', 'asset:object-proxima-geophysical-impulse-package-sheet', 'asset:object-time-reference-diagnostic-unit-sheet'],
	'082': ['asset:character-rao-sheet', 'asset:location-celestial-ardor-inner-shielding-vault-sheet', 'asset:object-proxima-geophysical-impulse-package-sheet', 'asset:character-okoye-sheet', 'asset:character-harlan-sheet'],
	'083': ['asset:character-sorell-sheet', 'asset:character-voss-sheet', 'asset:character-rao-sheet', 'asset:character-okoye-sheet', 'asset:location-celestial-ardor-bridge-realistic-reference'],
	'084': ['asset:character-sorell-sheet', 'asset:character-voss-sheet', 'asset:character-rao-sheet', 'asset:character-okoye-sheet', 'asset:location-celestial-ardor-bridge-realistic-reference'],
	'085': ['asset:character-sorell-sheet', 'asset:character-voss-sheet', 'asset:character-rao-sheet', 'asset:character-okoye-sheet', 'asset:location-celestial-ardor-bridge-realistic-reference'],
	'086': ['asset:character-voss-sheet', 'asset:character-sorell-sheet', 'asset:character-rao-sheet', 'asset:location-celestial-ardor-bridge-realistic-reference', 'asset:location-velari-station-sheet'],
	'087': ['asset:character-sorell-sheet', 'asset:character-voss-sheet', 'asset:location-velari-station-sheet'],
	'088': ['asset:character-sorell-sheet', sphere],
	'089': ['asset:character-sorell-sheet', 'asset:character-voss-sheet', sphere],
	'091': ['asset:character-sorell-sheet', sphere],
	'092': ['asset:character-sorell-sheet', sphere, envoy],
	'093': ['asset:character-voss-sheet', 'asset:character-sorell-sheet', 'asset:character-okoye-sheet', 'asset:character-harlan-sheet', 'asset:location-celestial-ardor-bridge-realistic-reference'],
	'094': ['asset:character-voss-sheet', 'asset:character-sorell-sheet', 'asset:character-rao-sheet', 'asset:character-harlan-sheet', 'asset:location-celestial-ardor-bridge-realistic-reference'],
	'095': ['asset:character-voss-sheet', 'asset:character-zao-sheet', 'asset:location-celestial-ardor-reactor-service-bay-sheet', 'asset:object-optical-contingency-transmitter-sheet'],
	'096': ['asset:character-voss-sheet', 'asset:character-zao-sheet', 'asset:location-celestial-ardor-reactor-service-bay-sheet', 'asset:object-optical-contingency-transmitter-sheet']
};

const actions = {
	'018': 'Harlan emerges from the inner bay and meets Zao in the passage, guarded: "Engineer. Your readings brought you aft as well?"',
	'019': 'Harlan explains his access, then turns and walks away alone in the opposite direction from the vault while Zao remains by the door and watches him go. Preserve the established blocking; he has touched no flight control.',
	'020': 'Zao follows the markings and neutron peak to the encounter coordinates and time on the local controller.',
	'021': 'Zao reads the controller aloud, shocked and afraid: "Geophysical impulse package… one point three tonnes. Multi-megaton. Contact coordinates. Contact time."',
	'022': 'Zao compares the bomb timer with an ordinary wrist communications clock and rejects an innocent explanation: "No. No one sent this by mistake."',
	'023': 'Harlan rises unseen from the recessed service hatch as the bridge crew faces forward and hears Zao open the channel: "Bridge, Zao. I have found a grave attempt to sabotage the mission—"',
	'024': 'Harlan touches his wrist device only when the word "sabotage" lands; the channel dies mid-word and he withdraws into the service hatch before anyone turns.',
	'025': 'Elin reports the wireless outage: "Wireless just vanished across her deck." Voss urgently assigns the response: "Elin, find the break. Okoye, bridge security."',
	'029': 'Zao finishes into dead air and rapidly tests every channel in turn while the small wall countdown continues behind her.',
	'030': 'Zao names the failed routes at the comms panel: "Radio. Hardline. Emergency. All three. That’s deliberate." "Internal comms are cut. I need another way to reach someone."',
	'031': 'Zao eliminates the destinations aloud at the independent optical-array console: "Proxima’s behind Jupiter. Earth gets it, answers too late. The throat won’t listen."',
	'032': 'The crossing clock aligns with ordinary light-time. Zao begins plotting a moving intercept and says, "There you are." Only "23 H 15 MIN" is legible; destination and trajectory remain hidden.',
	'036': 'Harlan enters as Zao closes the pointing solution; he sees only that a focused transmission left and asks, "Who did you send that to?"',
	'037': 'Harlan narrows the destination aloud: "Not Proxima. Not the throat. You don’t speak Velari." Then he reassures himself: "Earth, then. They may believe you. Their answer still can’t reach us before contact."',
	'038': 'Harlan, briefly sorrowful, says, "You should never have had to find it," closes the distance, and moves in; cut to black before impact.',
	'046': 'As thrust restores, loose tools and sheets settle to the deck. Harlan plants his feet and turns accusingly toward Sorell: "How could you? Why?"',
	'057': 'Elin reads the surviving firing angles and ship attitude; the reconstructed vector points at no planet, station, or beacon.',
	'080': 'Elin opens the vault with the recovered wrist device; local indicators confirm Zao’s warning. She says, "No power cut. No damage. She was right."',
	'081': 'Elin connects the external scientific timing reference beside the bomb: "External reference. That I can move."',
	'082': 'The display counts 4—3—2—1, then jumps upward. Voss asks, "Status?" Elin answers, "It isn’t disarmed. It just isn’t going off here."',
	'083': 'Sorell finishes translating the Velari primer into branching patterns of light for the ship’s hull display.',
	'084': 'Sorell says, awed: "They wrote the primer. This is the first time they’ll hear us read it back." Voss quietly apologizes for mistaking caution for refusal.',
	'085': 'Sorell answers, pressed but not cruel: "We can be sorry later. Right now, I need to be right." Voss authorizes only the clean greeting: "One greeting. Nothing else. Send."',
	'086': 'Structured light branches across the Ardor’s hull, visible through the bridge’s small reinforced windows; the Velari station remains dark through a deliberate silence.',
	'087': 'The Velari station answers with luminous grammar across its living skin. Sorell catches fragments through her parser: "Approach. Permission… meeting."',
	'088': 'The Velari Transport Sphere separates from the station and approaches the Ardor with no visible engines or exhaust (matching its established reference). Sorell says, "They’re sending someone."',
	'089': 'Sorell exits alone on a tether in a spacesuit; her suit-camera feed appears on Voss’s distant bridge display. The Velari Transport Sphere waits, motionless, between ship and station (matching its established reference).',
	'091': 'Resolved, Sorell drifts on her tether toward the waiting Velari Transport Sphere: "That’s what makes going mean something."',
	'092': 'Still in her EVA suit and helmet, tether visible, Sorell reaches the Velari Transport Sphere in open space. The Velari envoy (matching its established reference) orients toward her through the sphere’s transparent wall, gathers its light, holds attention, then extends the human greeting back in living light. The Ardor, the Velari station, and the starfield stay visible through the sphere.',
	'093': 'Before the return window, flight commands still need repair and the armed package remains under constant watch. Okoye says, steady: "Harlan is secure. I’ll take first watch aft."',
	'094': 'Elin states the remaining obligations: "Bridge path is repairable. The bomb still gets a person beside it." Voss changes procedure: "Rotate every twenty minutes. Nobody works alone."',
	'095': 'Voss uses the restored optical array to send Earth an independent record of discovery, murder, warning, intervention, and contact, attaching Zao’s signed message and personnel file: "Proxima Control, this is Celestial Ardor. Full record follows. Chief Engineer Zao found the weapon, warned us, and preserved first contact."',
	'096': 'The console reads "TRANSMITTED." Zao’s personnel photograph remains on the display. Voss speaks to it quietly: "You made it in time."'
};

function promptFor(shot, take, id) {
	const movement = shot.camera?.movementDescription?.en ?? shot.camera?.movement ?? 'planned camera movement';
	const refs = take.generation?.referenceAssetIds ?? [];
	return `Use the supplied reference images as authoritative for the static appearance of every referenced character, location, prop, and vehicle; do not redesign or restate those references. Grounded cinematic hard-science-fiction storyboard still, photorealistic VFX concept art, 16:9. Action: ${actions[id] ?? shot.description.en} Composition: ${shot.composition?.size ?? 'production'} framing. Camera: ${movement}. Preserve the specified blocking, physics, timing, dynamic behavior, and English-only diegetic display text. Reference assets attached: ${refs.join(', ')}. Avoid off-screen characters, extra entities, redesigned referenced assets, obsolete continuity, logos, and watermark.`;
}

for (const take of script.takes ?? []) {
	if (!targetIds.has(take.shotId)) continue;
	const id = take.shotId.split('shot-plan-')[1];
	const shot = script.shots.find((candidate) => candidate.id === take.shotId);
	if (!shot) throw new Error(`Missing shot for ${take.shotId}`);
	const refs = new Set(refOverrides[id] ?? take.generation?.referenceAssetIds ?? []);
	if (!take.generation) take.generation = {};
	take.generation.referenceAssetIds = [...refs];
	take.generation.prompt = promptFor(shot, take, id);
	take.generation.negativePrompt = 'No redesign of supplied references; no off-screen characters; no obsolete emissary spacecraft; no extra people or vehicles; no text except explicitly specified English diegetic text; no watermark.';
}

writeFileSync(scriptPath, `${JSON.stringify(script, null, 2)}\n`, 'utf8');
console.log(`prepared ${targetIds.size} Festival-master takes for regeneration`);
