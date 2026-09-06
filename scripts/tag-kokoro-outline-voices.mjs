/**
 * Tag docs/wip/outiline-for-kokoro-tts.md with [Speaker] lines for multi-voice Kokoro.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const inputPath = join(ROOT, 'docs', 'wip', 'outiline-for-kokoro-tts.md');
const outputPath = join(ROOT, 'docs', 'wip', 'outiline-for-kokoro-tts.voices.md');

const NAMES = ['Zao', 'Voss', 'Harlan', 'Elin', 'Sorell', 'Okoye', 'Cael'];

/** Exact quote → speaker overrides (normalized without smart quotes). */
const QUOTE_SPEAKER = new Map([
	['we know what the mouth told us. that isn’t the same as knowing who told it to speak.', 'Harlan'],
	["we know what the mouth told us. that isn't the same as knowing who told it to speak.", 'Harlan'],
	['i wish they were right.', 'Harlan'],
	['they built a door in our system before we knew they existed. now the door tells us when to walk through.', 'Harlan'],
	['we studied everything they gave us before we agreed to send a single ship out there. that isn’t fear. it’s respect.', 'Sorell'],
	["we studied everything they gave us before we agreed to send a single ship out there. that isn't fear. it's respect.", 'Sorell'],
	['he wasn’t hoping.', 'Zao'],
	["he wasn't hoping.", 'Zao'],
	['you find faults for a living. that doesn’t make everyone a fault.', 'Voss'],
	["you find faults for a living. that doesn't make everyone a fault.", 'Voss'],
	['if zao says we’re on time, we’re on time.', 'Voss'],
	["if zao says we're on time, we're on time.", 'Voss'],
	['the outbound throat closes behind us. until the return window, there’s no turning around.', 'Sorell'],
	["the outbound throat closes behind us. until the return window, there's no turning around.", 'Sorell'],
	['they think the mission looks too aggressive.', 'Okoye'],
	['we’re making first contact in a ninety-metre phallus called celestial ardor.', 'Elin'],
	["we're making first contact in a ninety-metre phallus called celestial ardor.", 'Elin'],
	['i didn’t name it.', 'Elin'],
	["i didn't name it.", 'Elin'],
	['let’s make the greeting less ambiguous.', 'Sorell'],
	["let's make the greeting less ambiguous.", 'Sorell'],
	['how do you say hello to something you’ve never heard answer?', 'Okoye'],
	["how do you say hello to something you've never heard answer?", 'Okoye'],
	['they wrote the primer. we haven’t spoken back.', 'Sorell'],
	["they wrote the primer. we haven't spoken back.", 'Sorell'],
	['when the mouth goes quiet, that isn’t nothing. silence is still a choice.', 'Sorell'],
	["when the mouth goes quiet, that isn't nothing. silence is still a choice.", 'Sorell'],
	["when the mouth goes quiet, that isn’t nothing. silence is still a choice.", 'Sorell'],
	['and if the artificial intelligence learned it wrong?', 'Zao'],
	['and what if we’re the ones being read wrong?', 'Harlan'],
	["and what if we're the ones being read wrong?", 'Harlan'],
	['i’ve found a grave attempt to sabotage the mission—', 'Zao'],
	["i've found a grave attempt to sabotage the mission—", 'Zao'],
	['i’ve found a grave attempt to sabotage the mission -', 'Zao'],
	["i've found a grave attempt to sabotage the mission -", 'Zao'],
	['just in case: goodbye. harlan’s at the door.', 'Zao'],
	["just in case: goodbye. harlan's at the door.", 'Zao'],
	['who did you send that to?', 'Harlan'],
	['proxima’s behind jupiter. earth won’t know until we’re already there.', 'Zao'],
	["proxima's behind jupiter. earth won't know until we're already there.", 'Zao'],
	['how could you? why?', 'Harlan'],
	['before launch she asked me what it would take to delay the crossing. i thought it was professional caution.', 'Harlan'],
	['you’re treating the first explanation as if it were the only one. that’s exactly what i warned you not to do out there.', 'Sorell'],
	["you're treating the first explanation as if it were the only one. that's exactly what i warned you not to do out there.", 'Sorell'],
	['lose helium-three and the mix goes deuterium-rich. more side-reaction neutrons, more fuel to hold thrust. keep bleeding it and we miss the window.', 'Harlan'],
	['she was trying to finish the report she started - to earth. the guidance trunk was down, so she entered the aim manually. she missed.', 'Harlan'],
	['zao didn’t miss.', 'Elin'],
	["zao didn't miss.", 'Elin'],
	['she was frightened. she knew someone was coming.', 'Harlan'],
	['now they’ll never know who saved them.', 'Harlan'],
	["now they'll never know who saved them.", 'Harlan'],
	['you don’t know what they are. you don’t get to answer for earth.', 'Harlan'],
	["you don't know what they are. you don't get to answer for earth.", 'Harlan'],
	['if they think we’re harmless, they come closer. if they see a species that bites, maybe they wait. we needed time.', 'Harlan'],
	["if they think we're harmless, they come closer. if they see a species that bites, maybe they wait. we needed time.", 'Harlan'],
	['it isn’t disarmed. it just isn’t going off here.', 'Elin'],
	["it isn't disarmed. it just isn't going off here.", 'Elin'],
	['they wrote the primer. this is the first time they’ll hear us read it back.', 'Sorell'],
	["they wrote the primer. this is the first time they'll hear us read it back.", 'Sorell'],
	['i’m sorry.', 'Voss'],
	["i'm sorry.", 'Voss'],
	['they’re sending someone.', 'Sorell'],
	["they're sending someone.", 'Sorell'],
	['you made it in time.', 'Voss']
]);

function normQuote(q) {
	return q
		.replace(/^[“"]|[”"]$/g, '')
		.replace(/[“”]/g, '"')
		.replace(/[’‘]/g, "'")
		.replace(/\s*[”"]\s*\.?\s*$/, '')
		.replace(/\s+/g, ' ')
		.trim()
		.toLowerCase()
		.replace(/[.]+$/, '.')
		.replace(/[—–-]+\s*$/, '')
		.trim();
}

function normalizeSpeaker(name) {
	if (!name) return null;
	const n = name.replace(/\.$/, '');
	if (n === 'Rao') return 'Elin';
	return NAMES.includes(n) ? n : null;
}

function speakerFromSpeechVerb(text) {
	const re = new RegExp(
		`\\b(${NAMES.join('|')})\\b[\\s\\S]*?\\b(says|asks|answers|responds|replies|whispers|continues|tells|begins)\\b`,
		'gi'
	);
	let last = null;
	let m;
	while ((m = re.exec(text))) last = m[1];
	return normalizeSpeaker(last);
}

function isQuote(para) {
	const t = para.trim();
	return /^[“"]/.test(t);
}

const text = readFileSync(inputPath, 'utf8').replace(/^\uFEFF/, '');
const revision = text.match(/General narrative outline\. Revision ([a-z -]+)\./i)?.[1] ?? 'unknown';
const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

/** @type {Array<{speaker: string, text: string}>} */
const cues = [];
let pendingSpeaker = null;

for (let i = 0; i < paragraphs.length; i++) {
	const para = paragraphs[i];

	const inline = para.match(
		new RegExp(`^(${NAMES.join('|')}|Rao)\\s+says,\\s*[“"](.+)[”"]\\.?\s*$`, 'is')
	);
	if (inline) {
		cues.push({
			speaker: normalizeSpeaker(inline[1]),
			text: `"${inline[2].replace(/^[“"]|[”"]$/g, '')}"`
		});
		pendingSpeaker = null;
		continue;
	}

	const lead = para.match(
		new RegExp(`^(${NAMES.join('|')}|Rao)\\s+(says|asks|answers|responds|replies|whispers|continues)\\.\\.\\.?$`, 'i')
	);
	if (lead) {
		pendingSpeaker = normalizeSpeaker(lead[1]);
		continue;
	}

	if (isQuote(para)) {
		const key = normQuote(para);
		let speaker =
			QUOTE_SPEAKER.get(key) ||
			pendingSpeaker ||
			(i > 0 ? speakerFromSpeechVerb(paragraphs[i - 1]) : null) ||
			'Narrator';
		// Strip trailing incomplete quote artifacts
		let spoken = para.replace(/\s+-\s*"\s*$/, '."').replace(/-\s*"\s*$/, '."');
		if (!/[”"]$/.test(spoken) && spoken.endsWith('-')) spoken = `${spoken.slice(0, -1).trim()}."`;
		cues.push({ speaker, text: spoken });
		pendingSpeaker = null;
		continue;
	}

	// Soft lead-ins that keep narrator text but set next quote speaker
	const soft = speakerFromSpeechVerb(para);
	if (soft && /\.\.\.$/.test(para) && para.length < 160) {
		pendingSpeaker = soft;
		cues.push({ speaker: 'Narrator', text: para.replace(/\.\.\.$/, '.') });
		continue;
	}

	pendingSpeaker = soft && /\b(says|asks|answers|responds|replies|tells|begins)\b/i.test(para) ? soft : null;
	cues.push({ speaker: 'Narrator', text: para });
}

const header = [
	'# Light Delay — Kokoro multi-voice outline',
	'',
	`Revision ${revision}. Speaker tags: [Narrator], [Zao], [Voss], [Harlan], [Elin], [Sorell], [Okoye], [Cael].`,
	'Voice cast: `docs/wip/kokoro-voice-cast.json` (closest Kokoro presets to `docs/DESCRIPCION_DE_VOCES_DE_PERSONAJES.md`).',
	'Model: `E:/Models/Kokoro/kokoro-v1.0.onnx` (FP32) + `voices-v1.0.bin`.',
	'Generate: `python scripts/generate-kokoro-outline-audio.py`',
	'',
	'---',
	''
];

const body = cues.map((c) => `[${c.speaker}]\n${c.text}`).join('\n\n');
writeFileSync(outputPath, `${header.join('\n')}${body}\n`, 'utf8');

const counts = Object.create(null);
for (const c of cues) counts[c.speaker] = (counts[c.speaker] || 0) + 1;
console.log(JSON.stringify({ cues: cues.length, bySpeaker: counts, output: outputPath }, null, 2));
