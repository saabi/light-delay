import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const files = {
	en: path.join(root, 'docs/wip/audience-narrative.en.md'),
	es: path.join(root, 'docs/wip/audience-narrative.es.md'),
	voicesEn: path.join(root, 'docs/wip/audience-narrative.voices.en.md'),
	voicesEs: path.join(root, 'docs/wip/audience-narrative.voices.es.md'),
	performance: path.join(root, 'data/production/audio/audience-dialogue-performance.json'),
	master: path.join(root, 'data/outlines/light-delay-master-narrative.json'),
	voiceProfiles: path.join(root, 'data/voice-profiles.json')
};

const expectedSections = 12;
const expectedDialogues = 36;
const speakerIds = {
	Zao: 'character:zao',
	'Elias Voss': 'character:voss',
	'Rylen Harlan': 'character:harlan',
	'Elin Rao': 'character:rao',
	'Lian Sorell': 'character:sorell',
	'Dara Okoye': 'character:okoye'
};
const ttsLabels = {
	Zao: 'Zao',
	'Elias Voss': 'Voss',
	'Rylen Harlan': 'Harlan',
	'Elin Rao': 'Elin',
	'Lian Sorell': 'Sorell',
	'Dara Okoye': 'Okoye'
};

const failures = [];
const fail = (message) => failures.push(message);
const read = (file) => fs.readFileSync(file, 'utf8');

function localizedComplete(value) {
	return (
		value &&
		typeof value === 'object' &&
		typeof value.es === 'string' &&
		value.es.trim() &&
		typeof value.en === 'string' &&
		value.en.trim()
	);
}

function collectValues(node, key, output = new Set()) {
	if (Array.isArray(node)) {
		for (const child of node) collectValues(child, key, output);
	} else if (node && typeof node === 'object') {
		if (typeof node[key] === 'string') output.add(node[key]);
		for (const child of Object.values(node)) collectValues(child, key, output);
	}
	return output;
}

function collectLocalizedStrings(node, language, output = []) {
	if (Array.isArray(node)) {
		for (const child of node) collectLocalizedStrings(child, language, output);
	} else if (node && typeof node === 'object') {
		if (typeof node[language] === 'string') output.push(node[language]);
		for (const child of Object.values(node)) collectLocalizedStrings(child, language, output);
	}
	return output;
}

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function pronunciationMap(profiles, language) {
	const result = new Map();
	for (const profile of profiles.voiceProfiles ?? []) {
		for (const variant of profile.variants ?? []) {
			if (variant.language !== language) continue;
			for (const [written, spoken] of Object.entries(variant.pronunciationMap ?? {})) {
				if (result.has(written) && result.get(written) !== spoken) {
					fail(`${language}: conflicting pronunciation for ${written}`);
				}
				result.set(written, spoken);
			}
		}
	}
	return result;
}

function applyPronunciations(value, map) {
	let result = value;
	for (const [written, spoken] of [...map.entries()].sort((a, b) => b[0].length - a[0].length)) {
		result = result.replace(new RegExp(`(?<!\\w)${escapeRegExp(written)}(?!\\w)`, 'gu'), spoken);
	}
	return result;
}

function parseAudience(markdown, lang) {
	const lines = markdown.split(/\r?\n/);
	const blocks = [];
	const dialogues = [];
	let pendingId;
	let section = -1;
	let paragraph = [];

	const flushParagraph = () => {
		if (!paragraph.length) return;
		blocks.push({ kind: 'paragraph', section });
		paragraph = [];
	};

	for (const line of lines) {
		if (!line.trim()) {
			flushParagraph();
			continue;
		}
		if (line.startsWith('## ')) {
			if (pendingId) fail(`${lang}: ${pendingId} is not followed by dialogue`);
			flushParagraph();
			section += 1;
			blocks.push({ kind: 'section', section });
			continue;
		}
		if (line.startsWith('# ')) {
			if (pendingId) fail(`${lang}: ${pendingId} is not followed by dialogue`);
			flushParagraph();
			blocks.push({ kind: 'title', section });
			continue;
		}
		const idMatch = line.match(/^<!--\s*audience-dialogue-id:\s*([^\s]+)\s*-->$/);
		if (idMatch) {
			flushParagraph();
			if (pendingId) fail(`${lang}: ${pendingId} is not followed by dialogue`);
			pendingId = idMatch[1];
			continue;
		}
		if (line.startsWith('>')) {
			flushParagraph();
			const match = line.match(/^>\s*\*\*([^*]+):\*\*\s*[«“"](.+)[»”"]\.?$/u);
			if (!match) {
				fail(`${lang}: malformed attributed dialogue: ${line}`);
				continue;
			}
			if (!pendingId) fail(`${lang}: dialogue has no stable audience-dialogue-id: ${line}`);
			const dialogue = {
				id: pendingId,
				speaker: match[1],
				quote: match[2].replace(/\*([^*]+)\*/g, '$1'),
				section
			};
			dialogues.push(dialogue);
			blocks.push({ kind: 'dialogue', section });
			pendingId = undefined;
			continue;
		}
		if (line.trim().startsWith('<!--')) {
			if (pendingId) fail(`${lang}: ${pendingId} is not followed by dialogue`);
			continue;
		}
		if (pendingId) fail(`${lang}: ${pendingId} is not followed by dialogue`);
		paragraph.push(line);
	}
	flushParagraph();
	if (pendingId) fail(`${lang}: ${pendingId} has no dialogue block`);
	return { blocks, dialogues, sections: section + 1 };
}

function normalizeQuote(value) {
	return value
		.normalize('NFC')
		.replace(/\*([^*]+)\*/g, '$1')
		.replace(/[«»“”"]/g, '')
		.replace(/[’‘]/g, "'")
		.replace(/\s+/g, ' ')
		.trim();
}

function parseGeneratedVoices(markdown, lang) {
	const lines = markdown.split(/\r?\n/);
	const dialogues = [];
	const actorTag = /^\[(Zao|Voss|Harlan|Elin|Sorell|Okoye)\]$/;
	const idComment = /^<!--\s*audience-dialogue-id:\s*([^\s]+)\s*-->$/;
	for (let index = 0; index < lines.length; index += 1) {
		const tag = lines[index].match(actorTag);
		if (!tag) continue;
		let dialogueId = null;
		for (let look = index - 1; look >= 0; look -= 1) {
			const prev = lines[look].trim();
			if (!prev) continue;
			const idMatch = prev.match(idComment);
			if (idMatch) {
				dialogueId = idMatch[1];
				break;
			}
			break;
		}
		if (!dialogueId) {
			fail(`${lang} voices: missing audience-dialogue-id before [${tag[1]}]`);
		}
		const instruct = lines[index + 1] ?? '';
		const quote = lines[index + 2] ?? '';
		if (
			!instruct.startsWith('[QwenInstruct] Speak ') ||
			!instruct.includes(' Dramatic situation: ') ||
			!instruct.includes(' Performance and delivery: ')
		) {
			fail(`${lang} voices: missing ID-derived performance instruction after [${tag[1]}]`);
		}
		if (!quote.trim()) fail(`${lang} voices: missing dialogue text after [${tag[1]}]`);
		dialogues.push({ id: dialogueId, speaker: tag[1], instruct, quote });
	}
	return dialogues;
}

const en = parseAudience(read(files.en), 'EN');
const es = parseAudience(read(files.es), 'ES');
const performance = JSON.parse(read(files.performance));
const master = JSON.parse(read(files.master));
const voiceProfiles = JSON.parse(read(files.voiceProfiles));
const pronunciations = {
	en: pronunciationMap(voiceProfiles, 'en'),
	es: pronunciationMap(voiceProfiles, 'es')
};
const masterRevision = master.outline?.revision;

if (!Number.isInteger(masterRevision)) fail('master: outline.revision must be an integer');
if (performance.narrativeId !== 'audience:light-delay-master') {
	fail('performance: narrativeId must be stable and must not contain a revision');
}
if (performance.sourceOutlineId !== master.outline?.id) {
	fail('performance: sourceOutlineId must match the master outline');
}
if (!read(files.en).startsWith('# Light Delay\n')) fail('EN: wrong audience title');
if (!read(files.es).startsWith('# Lúz Tardía\n')) fail('ES: wrong audience title');
if (/\bProxima\b/u.test(read(files.es))) fail('ES: Proxima must be written Próxima');
if (collectLocalizedStrings(master, 'es').some((value) => /\bProxima\b/u.test(value))) {
	fail('master: an es field still contains unaccented Proxima');
}
for (const [label, text] of [
	['EN source', read(files.en)],
	['ES source', read(files.es)],
	['performance', read(files.performance)]
]) {
	if (/Soréll|Sorél/u.test(text)) fail(`${label}: phonetic spelling leaked into editorial data`);
}

for (const [lang, parsed] of [
	['EN', en],
	['ES', es]
]) {
	if (parsed.sections !== expectedSections) {
		fail(`${lang}: expected ${expectedSections} H2 sections, found ${parsed.sections}`);
	}
	if (parsed.dialogues.length !== expectedDialogues) {
		fail(`${lang}: expected ${expectedDialogues} dialogues, found ${parsed.dialogues.length}`);
	}
	const ids = parsed.dialogues.map((entry) => entry.id);
	if (new Set(ids).size !== ids.length) fail(`${lang}: duplicate dialogue IDs`);
}

const enShape = en.blocks.map(({ kind, section }) => `${section}:${kind}`);
const esShape = es.blocks.map(({ kind, section }) => `${section}:${kind}`);
if (JSON.stringify(enShape) !== JSON.stringify(esShape)) {
	fail('EN/ES audience sources do not have the same block structure and section boundaries');
}

for (let index = 0; index < Math.max(en.dialogues.length, es.dialogues.length); index += 1) {
	const left = en.dialogues[index];
	const right = es.dialogues[index];
	if (!left || !right) continue;
	if (left.id !== right.id || left.speaker !== right.speaker || left.section !== right.section) {
		fail(`EN/ES dialogue parity mismatch at index ${index}: ${left.id} / ${right.id}`);
	}
}

const masterIds = collectValues(master, 'id');
const masterSpeakers = collectValues(master, 'speakerId');
const performanceIds = new Set();
for (const entry of performance.entries ?? []) {
	if (performanceIds.has(entry.id)) fail(`performance: duplicate ID ${entry.id}`);
	performanceIds.add(entry.id);
	if (!masterIds.has(entry.sourceStepId)) {
		fail(`performance: ${entry.id} has unknown sourceStepId ${entry.sourceStepId}`);
	}
	if (!masterSpeakers.has(entry.speakerId)) {
		fail(`performance: ${entry.id} has unknown speakerId ${entry.speakerId}`);
	}
	if (!localizedComplete(entry.intent)) fail(`performance: ${entry.id} has incomplete intent`);
	for (const lang of ['en', 'es']) {
		if (!localizedComplete(entry.delivery?.[lang])) {
			fail(`performance: ${entry.id} has incomplete ${lang} delivery`);
		}
	}
}
if (performanceIds.size !== expectedDialogues) {
	fail(`performance: expected ${expectedDialogues} entries, found ${performanceIds.size}`);
}

for (const dialogue of en.dialogues) {
	const entry = performance.entries.find(({ id }) => id === dialogue.id);
	if (!entry) {
		fail(`performance: no entry for ${dialogue.id}`);
		continue;
	}
	const expectedSpeakerId = speakerIds[dialogue.speaker];
	if (!expectedSpeakerId) fail(`EN: unknown speaker label ${dialogue.speaker}`);
	if (entry.speakerId !== expectedSpeakerId) {
		fail(
			`performance: ${dialogue.id} speaker is ${entry.speakerId}, expected ${expectedSpeakerId}`
		);
	}
}
for (const id of performanceIds) {
	if (!en.dialogues.some((dialogue) => dialogue.id === id)) fail(`performance: unused entry ${id}`);
}

for (const [lang, languageCode, parsed, voiceFile] of [
	['EN', 'en', en, files.voicesEn],
	['ES', 'es', es, files.voicesEs]
]) {
	const generated = parseGeneratedVoices(read(voiceFile), lang);
	if (generated.length !== expectedDialogues) {
		fail(`${lang} voices: expected ${expectedDialogues} actor cues, found ${generated.length}`);
	}
	for (let index = 0; index < Math.min(generated.length, parsed.dialogues.length); index += 1) {
		const source = parsed.dialogues[index];
		const voice = generated[index];
		if (voice.id !== source.id) {
			fail(`${lang} voices: dialogue id mismatch at index ${index}: ${voice.id} != ${source.id}`);
		}
		if (voice.speaker !== ttsLabels[source.speaker]) {
			fail(`${lang} voices: speaker mismatch at ${source.id}`);
		}
		const entry = performance.entries.find(({ id }) => id === source.id);
		if (entry) {
			const language = languageCode === 'en' ? 'English' : 'Spanish';
			const rawInstruct = `Speak ${language}. Dramatic situation: ${entry.intent.en.trim()} Performance and delivery: ${entry.delivery[languageCode].en.trim()}`;
			const expectedInstruct = `[QwenInstruct] ${applyPronunciations(rawInstruct, pronunciations[languageCode])}`;
			if (voice.instruct !== expectedInstruct) {
				fail(`${lang} voices: performance direction is stale at ${source.id}`);
			}
		}
		const expectedQuote = applyPronunciations(source.quote, pronunciations[languageCode]);
		if (normalizeQuote(voice.quote) !== normalizeQuote(expectedQuote)) {
			fail(`${lang} voices: speakable text is stale at ${source.id}`);
		}
	}
}

for (const [lang, file, revisionLabel] of [
	['EN', files.en, 'Revision'],
	['ES', files.es, 'Revisión']
]) {
	if (!read(file).includes(`${revisionLabel} ${masterRevision}.`)) {
		fail(`${lang}: revision label does not match master revision ${masterRevision}`);
	}
}

for (const [lang, file, chapter, prologue, title, spokenName] of [
	['EN', files.voicesEn, 'Chapter', 'Prologue', 'Light Delay', 'Soréll'],
	['ES', files.voicesEs, 'Capítulo', 'Prólogo', 'Lúz Tardía', 'Sorél']
]) {
	const text = read(file);
	const chapters = [
		...text.matchAll(
			new RegExp(
				`\\[Narrator\\]\\r?\\n${chapter} (\\d+)\\.\\r?\\n\\r?\\n\\[Narrator\\]\\r?\\n\\[PAUSE 1200\\] `,
				'gu'
			)
		)
	];
	if (chapters.length !== 11)
		fail(`${lang} voices: expected 11 numbered chapter pauses, found ${chapters.length}`);
	const prologuePattern = new RegExp(
		`\\[Narrator\\]\\r?\\n${prologue}\\.\\r?\\n\\r?\\n\\[Narrator\\]\\r?\\n\\[PAUSE 1200\\] `,
		'u'
	);
	if (!prologuePattern.test(text)) {
		fail(`${lang} voices: prologue pause is missing`);
	}
	if (
		!text.includes(
			`[PAUSE 1200] ${title}. ${lang === 'EN' ? 'Revision' : 'Revisión'} ${masterRevision}.`
		)
	) {
		fail(`${lang} voices: localized spoken title or master revision is stale`);
	}
	if (!text.includes(spokenName)) fail(`${lang} voices: expected spoken form ${spokenName}`);
}

if (failures.length) {
	console.error(`Audience narrative validation failed (${failures.length}):`);
	for (const failure of failures) console.error(`- ${failure}`);
	process.exit(1);
}

console.log(
	`Audience narrative valid: ${expectedSections} sections, ${expectedDialogues} stable bilingual dialogues, performance data and TTS outputs synchronized.`
);
