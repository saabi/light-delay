/**
 * Format the general narrative outline for hexgrad Kokoro TTS.
 *
 * Kokoro prosody comes from punctuation and blank-line chunks (split_pattern /\n+/).
 * Do not inject Misaki IPA overrides ([Word](/ipa/)); Kokoro ONNX reads those spans literally.
 * Do not use SSML, emotion tags, or ALL CAPS for emphasis.
 *
 * Reads Markdown with # headers; writes the speakable outline.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = join(ROOT, 'docs', 'wip', 'general-narrative-outline.en.md');
const outputPath = join(ROOT, 'docs', 'wip', 'outiline-for-kokoro-tts.md');
const raw = readFileSync(sourcePath, 'utf8').replace(/^\uFEFF/, '');
const revision = raw.match(/^Working draft, English, revision (\d+)\.$/m)?.[1];

if (!revision) {
	console.error('Refusing to format: source has no declared working-draft revision.');
	process.exit(1);
}

const speakerLabels = new Map([
	['zao', 'Zao'],
	['elin rao', 'Elin'],
	['elin', 'Elin'],
	['rylen harlan', 'Harlan'],
	['harlan', 'Harlan'],
	['elias voss', 'Voss'],
	['voss', 'Voss'],
	['lian sorell', 'Sorell'],
	['sorell', 'Sorell'],
	['dara okoye', 'Okoye'],
	['okoye', 'Okoye']
]);

if (!/^#\s/m.test(raw)) {
	console.error('Refusing to format: source does not look like Markdown outline (no # headers).');
	process.exit(1);
}

/** Strip legacy Misaki IPA spans to plain labels before other transforms. */
function stripPhonemeMarkup(text) {
	return text.replace(/\[[^\]]+\]\(\/[^)]+\/\)/g, (m) => {
		const label = m.match(/^\[([^\]]+)\]/);
		return label ? label[1] : m;
	});
}

function numberWords(n) {
	const ones = [
		'zero',
		'one',
		'two',
		'three',
		'four',
		'five',
		'six',
		'seven',
		'eight',
		'nine',
		'ten',
		'eleven',
		'twelve',
		'thirteen',
		'fourteen',
		'fifteen',
		'sixteen',
		'seventeen',
		'eighteen',
		'nineteen'
	];
	const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
	if (!Number.isFinite(n)) return String(n);
	n = Math.round(n);
	if (n < 20) return ones[n];
	if (n < 100) {
		const t = Math.floor(n / 10);
		const o = n % 10;
		return o ? `${tens[t]} ${ones[o]}` : tens[t];
	}
	if (n < 1000) {
		const h = Math.floor(n / 100);
		const r = n % 100;
		return r ? `${ones[h]} hundred ${numberWords(r)}` : `${ones[h]} hundred`;
	}
	if (n < 1_000_000) {
		const th = Math.floor(n / 1000);
		const r = n % 1000;
		return r ? `${numberWords(th)} thousand ${numberWords(r)}` : `${numberWords(th)} thousand`;
	}
	return String(n);
}

function decimalWords(raw) {
	const s = String(raw).replace(/,/g, '');
	if (!s.includes('.')) return numberWords(Number(s));
	const [a, b] = s.split('.');
	return `${numberWords(Number(a))} point ${[...b].map((d) => numberWords(Number(d))).join(' ')}`;
}

const NATO = {
	A: 'Alpha',
	B: 'Bravo',
	C: 'Charlie',
	D: 'Delta',
	E: 'Echo',
	F: 'Foxtrot',
	G: 'Golf',
	P: 'Papa'
};

function speakLetter(letter) {
	const key = String(letter).toUpperCase();
	return NATO[key] || key;
}

function speakBeatId(id) {
	const m = id.match(/^([A-GP])(\d+)([a-z]?)$/i);
	if (!m) return id;
	const suffix = m[3] ? ` ${speakLetter(m[3])}` : '';
	return `${speakLetter(m[1])} ${numberWords(Number(m[2]))}${suffix}`;
}

function stripMdInline(text) {
	let t = text;
	for (let i = 0; i < 3; i++) {
		t = t.replace(/\*\*([^*]+)\*\*/g, '$1');
		t = t.replace(/\*([^*]+)\*/g, '$1');
	}
	t = t.replace(/`([^`]+)`/g, '$1');
	t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label) => label);
	return t;
}

function expandTimesAndUnits(text) {
	let t = stripPhonemeMarkup(text);

	// Countdown displays before numeric range expansion
	t = t.replace(
		/\b4\s*[—–−-]\s*3\s*[—–−-]\s*2\s*[—–−-]\s*1\b/g,
		'Four. Three. Two. One'
	);

	// Numeric ranges with units (before bare ranges)
	t = t.replace(
		/(\d[\d,]*(?:\.\d+)?)\s*[–—−-]\s*(\d[\d,]*(?:\.\d+)?)\s*million\s*km\b/gi,
		(_, a, b) => `${decimalWords(a)} to ${decimalWords(b)} million kilometers`
	);
	t = t.replace(
		/(\d[\d,]*(?:\.\d+)?)\s*[–—−-]\s*(\d[\d,]*(?:\.\d+)?)\s*km\b/gi,
		(_, a, b) => `${decimalWords(a)} to ${decimalWords(b)} kilometers`
	);
	t = t.replace(
		/(\d[\d,]*(?:\.\d+)?)\s*[–—−-]\s*(\d[\d,]*(?:\.\d+)?)\s*m\b(?!\w)/g,
		(_, a, b) => `${decimalWords(a)} to ${decimalWords(b)} meters`
	);
	t = t.replace(
		/(\d[\d,]*(?:\.\d+)?)\s*[–—−-]\s*(\d[\d,]*(?:\.\d+)?)\s*tonnes?\b/gi,
		(_, a, b) => `${decimalWords(a)} to ${decimalWords(b)} tonnes`
	);
	t = t.replace(
		/(\d[\d,]*(?:\.\d+)?)\s*[–—−-]\s*(\d[\d,]*(?:\.\d+)?)/g,
		(_, a, b) => `${decimalWords(a)} to ${decimalWords(b)}`
	);

	t = t.replace(/\b(\d+)\s*[Hh]\s+(\d+)\s*[Mm][Ii]?[Nn]\b/g, (_, h, m) => {
		return `${numberWords(Number(h))} hours ${numberWords(Number(m))} minutes`;
	});
	t = t.replace(/\b(\d+)\s*[Mm][Ii]?[Nn]\s+(\d+)\s*[Ss]\b/g, (_, m, s) => {
		return `${numberWords(Number(m))} minutes ${numberWords(Number(s))} seconds`;
	});
	t = t.replace(/\b(\d+)\s*hours?\b/gi, (_, h) => `${numberWords(Number(h))} hours`);
	t = t.replace(/\b(\d+)\s*h\b/gi, (_, h) => `${numberWords(Number(h))} hours`);
	t = t.replace(
		/\b(\d[\d,]*(?:\.\d+)?)\s*million\s*km\b/gi,
		(_, n) => `${decimalWords(n)} million kilometers`
	);
	t = t.replace(/\b(\d[\d,]*(?:\.\d+)?)\s*AU\b/g, (_, n) => `${decimalWords(n)} astronomical units`);
	t = t.replace(/\b(\d[\d,]*(?:\.\d+)?)\s*km\b/gi, (_, n) => `${decimalWords(n)} kilometers`);
	t = t.replace(/\b(\d[\d,]*(?:\.\d+)?)\s*m\b(?!\w)/g, (_, n) => `${decimalWords(n)} meters`);
	t = t.replace(/\b(\d[\d,]*(?:\.\d+)?)\s*tonnes?\b/gi, (_, n) => `${decimalWords(n)} tonnes`);
	t = t.replace(/\b(\d+(?:\.\d+)?)\s*g\b(?!\w)/g, (_, n) => `${decimalWords(n)} g`);
	t = t.replace(/\b(\d+)\s*[×x]\s*(\d+)\s*meters\b/gi, (_, a, b) => {
		return `${numberWords(Number(a))} meters by ${numberWords(Number(b))} meters`;
	});
	t = t.replace(/\b(\d+)\s*[×x]\s*(\d+)\b/g, (_, a, b) => {
		return `${numberWords(Number(a))} by ${numberWords(Number(b))}`;
	});
	t = t.replace(/\s*[×]\s*/g, ' by ');
	t = t.replace(/\bmeters by (?=\w)/g, 'meters by ');

	t = t.replace(/\bL([12])\b/g, (_, n) => `L ${n === '1' ? 'one' : 'two'}`);
	t = t.replace(/D\s*[–—−-]\s*³He/g, 'deuterium to helium three');
	t = t.replace(/³He/g, 'helium three');
	t = t.replace(/\bHe-3\b/g, 'helium three');
	t = t.replace(/\bhelium-3\b/gi, 'helium three');
	t = t.replace(/\bCOM\b/g, 'communications');
	t = t.replace(/\bAI\b/g, 'artificial intelligence');

	t = t.replace(
		/\b([A-GP]\d+[a-z]?)\s*[–—−-]\s*([A-GP]\d+[a-z]?)\b/g,
		(_, a, b) => `${speakBeatId(a)} through ${speakBeatId(b)}`
	);
	t = t.replace(/\b([A-GP]\d+[a-z]?)\b/g, (m, id, offset, whole) => {
		const before = whole.slice(Math.max(0, offset - 3), offset);
		if (before.includes('[') || before.includes('/')) return m;
		return speakBeatId(id);
	});

	// Word-number leftovers of unit abbreviations (never bare "m" — that breaks "I'm")
	t = t.replace(/\bkm\b/g, 'kilometers');

	return t;
}

function headerToSpeech(line) {
	const m = line.match(/^(#{1,6})\s+(.*)$/);
	if (!m) return null;
	let title = stripMdInline(m[2].trim());
	title = title.replace(/\s*[—–−]\s*/g, '. ');
	title = title.replace(/^([A-GP]\d+[a-z]?)\b\.?\s*/i, (_, id) => `Sequence ${speakBeatId(id)}. `);
	title = title.replace(/^Sequence ([A-GP])\b/i, (_, L) => `Sequence ${speakLetter(L)}`);
	title = title.replace(/\s+\./g, '.').replace(/\.{2,}/g, '.');
	if (/^purpose of this document$/i.test(title)) return 'Why this outline exists.';
	if (!/[.!?]$/.test(title)) title += '.';
	return title;
}

function normalizeDashes(text) {
	return text
		.replace(/[—–−]/g, ' - ')
		.replace(/\s+-\s+/g, ' - ')
		.replace(/\s{2,}/g, ' ')
		.trim();
}

function polishParagraph(para) {
	let t = stripPhonemeMarkup(stripMdInline(para));
	t = normalizeDashes(t);
	t = expandTimesAndUnits(t);
	t = t.replace(/\s+([,.;:!?])/g, '$1');
	t = t.replace(/:\s*\./g, '.');
	// Preserve anticipatory lead-ins before converting leftover colons to periods
	t = t.replace(/\bAnd:\s*$/i, 'And...');
	t = t.replace(/\b(include|includes|are|is|follows|following):\s*$/i, '$1...');
	t = t.replace(/:\s*$/g, '.');
	// Collapse accidental double periods, but never eat ellipses.
	t = t.replace(/(?<!\.)\.\.(?!\.)/g, '.');
	// Lead-ins that ended in a colon become anticipatory ellipses
	t = t.replace(
		/\b(says|reads|responds|continues|answers|asks|replies|whispers|shouts)\.$/gi,
		'$1...'
	);
	t = t.replace(/\b(quietly|explicit|trust|formulation is)\.$/gi, '$1...');
	t = t.replace(/\bThe display reads\.$/g, 'The display reads...');
	t = t.replace(/\bzao\b/g, 'Zao');
	// Attributive measures before a noun: "five kilometers station" → "five-kilometer station"
	t = t.replace(
		/\b(one|two|three|four|five|six|seven|eight|nine|ten|\w+ point \w+(?: \w+)*) to (one|two|three|four|five|six|seven|eight|nine|ten|\w+ point \w+(?: \w+)*) kilometers (?=[A-Za-z])/gi,
		'$1 to $2-kilometer '
	);
	t = t.replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten) kilometers (?=[A-Za-z])/gi, '$1-kilometer ');
	t = t.replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten) meters (?=[A-Za-z])/gi, '$1-meter ');
	t = t.replace(/\bone meters\b/gi, 'one meter');
	t = t.replace(/\s{2,}/g, ' ').trim();
	if (!/[.!?…]"?$/.test(t) && !t.endsWith('...')) t += '.';
	return t;
}

function splitLong(para) {
	if (para.length <= 500) return [para];
	const sentences = para.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [para];
	const out = [];
	let chunk = '';
	for (const s of sentences) {
		const piece = s.trim();
		const next = chunk ? `${chunk} ${piece}` : piece;
		if (chunk && next.length > 480) {
			out.push(chunk);
			chunk = piece;
		} else {
			chunk = next;
		}
	}
	if (chunk) out.push(chunk);
	return out;
}

/** @type {string[]} */
const paragraphs = [];
let textBuf = [];
/** @type {string[]} */
let listBuf = [];
/** @type {string[]} */
let quoteBuf = [];

function flushText() {
	if (!textBuf.length) return;
	paragraphs.push(textBuf.join(' ').replace(/\s+/g, ' ').trim());
	textBuf = [];
}

function flushList() {
	if (!listBuf.length) return;
	const items = listBuf.map((s) => s.replace(/[.]*$/, '').trim());
	listBuf = [];
	const lowered = items.map((item, i) => {
		if (i === 0) return item;
		// Keep capitalized proper names when joining list items into one spoken sentence.
		if (/^[A-Z][a-z]/.test(item) && /^(Zao|Elin|Harlan|Voss|Sorell|Okoye|Cael|Ardor|Velari|Proxima)\b/.test(item)) {
			return item;
		}
		return item.charAt(0).toLowerCase() + item.slice(1);
	});
	let spoken;
	if (lowered.length === 1) spoken = `${lowered[0]}.`;
	else if (lowered.length === 2) spoken = `${lowered[0]}; and ${lowered[1]}.`;
	else spoken = `${lowered.slice(0, -1).join('; ')}; and ${lowered.at(-1)}.`;

	// Merge a preceding colon lead-in ("The possible consequences include:") with the list.
	if (textBuf.length) {
		const lead = textBuf.join(' ').replace(/\s+/g, ' ').trim().replace(/:\s*$/, '');
		textBuf = [];
		spoken = `${lead}: ${spoken.charAt(0).toLowerCase()}${spoken.slice(1)}`;
	}
	paragraphs.push(spoken);
}

function flushQuote() {
	if (!quoteBuf.length) return;
	let q = quoteBuf.join(' ').replace(/\s+/g, ' ').trim();
	quoteBuf = [];
	q = stripMdInline(q);

	let speaker = null;
	const labeled = q.match(/^([^:]+)\s*:\s*[“"]?(.*)[”"]?$/i);
	if (labeled) {
		speaker = speakerLabels.get(labeled[1].trim().toLowerCase()) ?? null;
		q = labeled[2];
	}

	q = q.replace(/^[“"]|[”"]$/g, '').trim();
	const spoken = speaker ? `${speaker} says, "${q}"` : `"${q}"`;
	paragraphs.push(spoken);
}

const lines = raw.split(/\r?\n/);
for (const line of lines) {
	const trimmed = line.trim();
	if (!trimmed) {
		flushQuote();
		flushList();
		// Keep a trailing colon lead-in across a blank line so the following list can merge.
		if (textBuf.length) {
			const soFar = textBuf.join(' ').replace(/\s+/g, ' ').trim();
			if (/:\s*$/.test(soFar)) continue;
		}
		flushText();
		continue;
	}
	if (/^---+$/.test(trimmed)) {
		flushQuote();
		flushList();
		flushText();
		paragraphs.push('...');
		continue;
	}

	const header = headerToSpeech(trimmed);
	if (header) {
		flushQuote();
		flushList();
		flushText();
		paragraphs.push(header);
		continue;
	}

	if (trimmed.startsWith('>')) {
		flushList();
		flushText();
		quoteBuf.push(trimmed.replace(/^>\s*/, ''));
		continue;
	}

	flushQuote();

	const bullet = trimmed.match(/^[-*]\s+(.*)$/);
	const numbered = trimmed.match(/^\d+\.\s+(.*)$/);

	// Soft-wrapped continuation of the current list item (indented line in source).
	if (
		listBuf.length &&
		/^\s+/.test(line) &&
		!bullet &&
		!numbered &&
		!trimmed.startsWith('#') &&
		!trimmed.startsWith('>')
	) {
		listBuf[listBuf.length - 1] = `${listBuf[listBuf.length - 1]} ${stripMdInline(trimmed)}`.replace(
			/\s+/g,
			' '
		);
		continue;
	}

	if (bullet || numbered) {
		// Keep a colon lead-in in textBuf so flushList can merge it with the list.
		if (textBuf.length) {
			const soFar = textBuf.join(' ').replace(/\s+/g, ' ').trim();
			if (!/:\s*$/.test(soFar)) flushText();
		}
		listBuf.push(stripMdInline((bullet || numbered)[1]));
		continue;
	}

	flushList();
	textBuf.push(stripMdInline(trimmed));
}
flushQuote();
flushList();
flushText();

const preamble = [`Light Delay. General narrative outline. Revision ${numberWords(Number(revision))}.`];

const body = [];
for (const para of paragraphs) {
	if (/^Light Delay/i.test(para) || /^Working draft/i.test(para)) continue;
	if (para === '...') {
		body.push('...');
		continue;
	}
	const polished = polishParagraph(para);
	body.push(...splitLong(polished));
}

const out = [...preamble, ...body].join('\n\n') + '\n';
writeFileSync(outputPath, out, 'utf8');

const lengths = [...preamble, ...body].map((p) => p.length);
console.log(
	JSON.stringify(
		{
			source: sourcePath,
			output: outputPath,
			paragraphs: lengths.length,
			chars: out.length,
			avg: Math.round(out.length / lengths.length),
			max: Math.max(...lengths),
			over500: lengths.filter((n) => n > 500).length
		},
		null,
		2
	)
);
