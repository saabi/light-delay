import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const registryPath = path.join(root, 'data/production/audio/audience-narratives.json');
const voiceProfilesPath = path.join(root, 'data/voice-profiles.json');
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
const warnings = [];
const fail = (message) => failures.push(message);
const warn = (message) => warnings.push(message);
const read = (file) => fs.readFileSync(file, 'utf8');

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function englishComplete(value) {
	return value && typeof value === 'object' && typeof value.en === 'string' && value.en.trim();
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

function normalizeQuote(value) {
	return value
		.normalize('NFC')
		.replace(/\*([^*]+)\*/g, '$1')
		.replace(/[«»“”"]/g, '')
		.replace(/[’‘]/g, "'")
		.replace(/\s+/g, ' ')
		.trim();
}

function parseAudience(markdown, label) {
	const lines = markdown.split(/\r?\n/);
	const blocks = [];
	const dialogues = [];
	const sourceSteps = [];
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
			if (pendingId) fail(`${label}: ${pendingId} is not followed by dialogue`);
			flushParagraph();
			section += 1;
			blocks.push({ kind: 'section', section });
			continue;
		}
		if (line.startsWith('# ')) {
			flushParagraph();
			blocks.push({ kind: 'title', section });
			continue;
		}
		const sourceMatch = line.match(/^<!--\s*audience-source-step:\s*([^\s]+)\s*-->$/);
		if (sourceMatch) {
			flushParagraph();
			sourceSteps.push(sourceMatch[1]);
			continue;
		}
		const idMatch = line.match(/^<!--\s*audience-dialogue-id:\s*([^\s]+)\s*-->$/);
		if (idMatch) {
			flushParagraph();
			if (pendingId) fail(`${label}: ${pendingId} is not followed by dialogue`);
			pendingId = idMatch[1];
			continue;
		}
		if (line.startsWith('>')) {
			flushParagraph();
			const match = line.match(/^>\s*\*\*([^*]+):\*\*\s*[«“"](.+)[»”"]\.?$/u);
			if (!match) {
				fail(`${label}: malformed attributed dialogue: ${line}`);
				continue;
			}
			if (!pendingId) fail(`${label}: dialogue has no stable audience-dialogue-id: ${line}`);
			dialogues.push({
				id: pendingId,
				speaker: match[1],
				quote: match[2].replace(/\*([^*]+)\*/g, '$1'),
				section
			});
			blocks.push({ kind: 'dialogue', section });
			pendingId = undefined;
			continue;
		}
		if (line.trim().startsWith('<!--')) continue;
		if (pendingId) fail(`${label}: ${pendingId} is not followed by dialogue`);
		paragraph.push(line);
	}
	flushParagraph();
	if (pendingId) fail(`${label}: ${pendingId} has no dialogue block`);
	return { blocks, dialogues, sections: section + 1, sourceSteps };
}

function parseGeneratedVoices(markdown, label) {
	const lines = markdown.split(/\r?\n/);
	const dialogues = [];
	const actorTag = /^\[(Zao|Voss|Harlan|Elin|Sorell|Okoye)\]$/;
	const idComment = /^<!--\s*audience-dialogue-id:\s*([^\s]+)\s*-->$/;
	for (let index = 0; index < lines.length; index += 1) {
		const tag = lines[index].match(actorTag);
		if (!tag) continue;
		let dialogueId = null;
		for (let look = index - 1; look >= 0; look -= 1) {
			const previous = lines[look].trim();
			if (!previous) continue;
			const match = previous.match(idComment);
			if (match) dialogueId = match[1];
			break;
		}
		if (!dialogueId) fail(`${label}: missing audience-dialogue-id before [${tag[1]}]`);
		const instruct = lines[index + 1] ?? '';
		const quote = lines[index + 2] ?? '';
		if (
			!instruct.startsWith('[QwenInstruct] Speak ') ||
			!instruct.includes(' Dramatic situation: ') ||
			!instruct.includes(' Performance and delivery: ')
		) {
			fail(`${label}: missing performance instruction after [${tag[1]}]`);
		}
		if (!quote.trim()) fail(`${label}: missing dialogue text after [${tag[1]}]`);
		dialogues.push({ id: dialogueId, speaker: tag[1], instruct, quote });
	}
	return dialogues;
}

function loadOutline(outlineId) {
	const directory = path.join(root, 'data/outlines');
	for (const name of fs.readdirSync(directory)) {
		if (!name.endsWith('.json')) continue;
		const candidate = JSON.parse(read(path.join(directory, name)));
		if (candidate.outline?.id === outlineId) return candidate;
	}
	return undefined;
}

function expectedRevision(outline, language, status) {
	if (language === 'en' || status === 'current') return outline.outline?.revision;
	return outline.outline?.localization?.translations?.[language]?.lastSyncedRevision;
}

function wordCount(markdown) {
	return markdown
		.replace(/<!--.*?-->/gs, '')
		.replace(/^#+\s+.*$/gm, '')
		.trim()
		.split(/\s+/)
		.filter(Boolean).length;
}

function validateFestivalContinuity(markdown, label) {
	const reveal = markdown.indexOf('<!-- audience-source-step: festival-master:story-16 -->');
	if (reveal < 0) return;
	const hidden = markdown.slice(0, reveal).toLowerCase();
	for (const phrase of ['future position', 'twenty-three light-hours', 'beam spent']) {
		if (hidden.includes(phrase))
			fail(`${label}: deferred targeting reveal leaked before story-16 (${phrase})`);
	}
	for (const ordinal of ['first', 'second', 'third', 'fourth']) {
		const phrase = `microgravity for the ${ordinal} time`;
		if (markdown.split(phrase).length !== 2)
			fail(`${label}: expected exactly one transition marked ${phrase}`);
	}
	const impact = markdown.indexOf('A single thump lands in darkness.');
	const flightBreak = markdown.indexOf('he disconnects bridge flight commands');
	if (impact < 0 || flightBreak < 0 || impact >= flightBreak)
		fail(`${label}: flight-control sabotage must occur after the fatal impact`);
}

function validateProfile(profile, voiceProfiles) {
	const outline = loadOutline(profile.sourceOutlineId);
	if (!outline) {
		fail(`${profile.key}: source outline ${profile.sourceOutlineId} does not exist`);
		return;
	}
	const performancePath = path.join(root, profile.performancePath);
	if (!fs.existsSync(performancePath)) {
		fail(`${profile.key}: performance file does not exist`);
		return;
	}
	const performance = JSON.parse(read(performancePath));
	if (performance.narrativeId !== profile.id) fail(`${profile.key}: narrativeId mismatch`);
	if (performance.sourceOutlineId !== profile.sourceOutlineId)
		fail(`${profile.key}: performance sourceOutlineId mismatch`);
	const storySteps = (outline.steps ?? []).filter((step) => step.level === 'story');
	const storyIds = new Set(storySteps.map((step) => step.id));
	const knownSpeakers = new Set(
		(voiceProfiles.voiceProfiles ?? []).map((profile) => profile.characterId)
	);
	const performanceIds = new Set();
	for (const entry of performance.entries ?? []) {
		if (performanceIds.has(entry.id)) fail(`${profile.key}: duplicate performance ID ${entry.id}`);
		performanceIds.add(entry.id);
		if (!storyIds.has(entry.sourceStepId))
			fail(`${profile.key}: ${entry.id} references unknown story step ${entry.sourceStepId}`);
		if (!knownSpeakers.has(entry.speakerId))
			fail(`${profile.key}: ${entry.id} references unknown speaker ${entry.speakerId}`);
		if (!englishComplete(entry.intent)) fail(`${profile.key}: ${entry.id} has no English intent`);
		if (!englishComplete(entry.delivery?.en))
			fail(`${profile.key}: ${entry.id} has no English delivery`);
	}

	const parsedByLanguage = new Map();
	for (const [language, output] of Object.entries(profile.languages)) {
		if (output.status === 'not_started') continue;
		const prosePath = path.join(root, output.prosePath);
		const voicesPath = path.join(root, output.voicesPath);
		if (!fs.existsSync(prosePath) || !fs.existsSync(voicesPath)) {
			fail(`${profile.key}/${language}: prose or generated voices file does not exist`);
			continue;
		}
		const prose = read(prosePath);
		const label = `${profile.key}/${language}`;
		const parsed = parseAudience(prose, label);
		parsedByLanguage.set(language, parsed);
		if (parsed.sections !== profile.chapterCount)
			fail(`${label}: expected ${profile.chapterCount} chapters, found ${parsed.sections}`);
		const ids = parsed.dialogues.map((entry) => entry.id);
		if (new Set(ids).size !== ids.length) fail(`${label}: duplicate dialogue IDs`);
		if (ids.length !== performanceIds.size || ids.some((id) => !performanceIds.has(id)))
			fail(`${label}: prose dialogue IDs do not match the performance ledger`);
		const revision = expectedRevision(outline, language, output.status);
		const revisionLabel = language === 'es' ? 'Revisión' : 'Revision';
		if (!Number.isInteger(revision) || !prose.includes(`${revisionLabel} ${revision}`))
			fail(`${label}: revision label does not match source revision ${revision}`);
		if (/Soréll|Sorél/u.test(prose)) fail(`${label}: phonetic spelling leaked into prose`);
		if (language === 'es' && /\bProxima\b/u.test(prose))
			fail(`${label}: Proxima must be written Próxima in Spanish`);

		for (const dialogue of parsed.dialogues) {
			const entry = (performance.entries ?? []).find((item) => item.id === dialogue.id);
			const expectedSpeakerId = speakerIds[dialogue.speaker];
			if (!expectedSpeakerId || entry?.speakerId !== expectedSpeakerId)
				fail(`${label}: speaker mismatch at ${dialogue.id}`);
		}

		const pronunciations = pronunciationMap(voiceProfiles, language);
		const generated = parseGeneratedVoices(read(voicesPath), `${label} voices`);
		if (generated.length !== parsed.dialogues.length)
			fail(
				`${label} voices: expected ${parsed.dialogues.length} actor cues, found ${generated.length}`
			);
		for (let index = 0; index < Math.min(generated.length, parsed.dialogues.length); index += 1) {
			const source = parsed.dialogues[index];
			const voice = generated[index];
			const entry = (performance.entries ?? []).find((item) => item.id === source.id);
			if (voice.id !== source.id) fail(`${label} voices: ID mismatch at ${source.id}`);
			if (voice.speaker !== ttsLabels[source.speaker])
				fail(`${label} voices: speaker mismatch at ${source.id}`);
			if (entry && englishComplete(entry.delivery?.[language])) {
				const spokenLanguage = language === 'es' ? 'Spanish' : 'English';
				const instruction = `Speak ${spokenLanguage}. Dramatic situation: ${entry.intent.en.trim()} Performance and delivery: ${entry.delivery[language].en.trim()}`;
				if (voice.instruct !== `[QwenInstruct] ${applyPronunciations(instruction, pronunciations)}`)
					fail(`${label} voices: performance direction is stale at ${source.id}`);
			}
			if (
				normalizeQuote(voice.quote) !==
				normalizeQuote(applyPronunciations(source.quote, pronunciations))
			)
				fail(`${label} voices: spoken text is stale at ${source.id}`);
		}

		const voices = read(voicesPath);
		const chapterWord = language === 'es' ? 'Capítulo' : 'Chapter';
		const chapterPauses = [
			...voices.matchAll(
				new RegExp(
					`\\[Narrator\\]\\r?\\n${chapterWord} (\\d+)\\.\\r?\\n\\r?\\n\\[Narrator\\]\\r?\\n\\[PAUSE 1200\\] `,
					'gu'
				)
			)
		];
		const expectedNumbered =
			prose.includes('## Prologue') || prose.includes('## Prólogo')
				? profile.chapterCount - 1
				: profile.chapterCount;
		if (chapterPauses.length !== expectedNumbered)
			fail(
				`${label} voices: expected ${expectedNumbered} numbered chapter pauses, found ${chapterPauses.length}`
			);
		if (expectedNumbered !== profile.chapterCount) {
			const prologue = language === 'es' ? 'Prólogo' : 'Prologue';
			const prologuePattern = new RegExp(
				`\\[Narrator\\]\\r?\\n${prologue}\\.\\r?\\n\\r?\\n\\[Narrator\\]\\r?\\n\\[PAUSE 1200\\] `,
				'u'
			);
			if (!prologuePattern.test(voices)) fail(`${label} voices: prologue pause is missing`);
		}
		const spokenTitle = applyPronunciations(
			profile.title[language] ?? profile.title.en,
			pronunciations
		);
		const spokenRevision = language === 'es' ? 'Revisión' : 'Revision';
		if (!voices.includes(`[PAUSE 1200] ${spokenTitle}. ${spokenRevision} ${revision}.`)) {
			fail(`${label} voices: spoken title or source revision is stale`);
		}

		if (language === 'en' && profile.wordTarget) {
			const words = wordCount(prose);
			if (words < profile.wordTarget.minimum || words > profile.wordTarget.hardMaximum)
				fail(
					`${label}: ${words} words falls outside ${profile.wordTarget.minimum}–${profile.wordTarget.hardMaximum}`
				);
			else if (words > profile.wordTarget.preferredMaximum)
				warn(
					`${label}: ${words} words exceeds preferred maximum ${profile.wordTarget.preferredMaximum}`
				);
		}
		if (profile.sourceStepCoverage === 'complete' && language === 'en') {
			const expected = storySteps.map((step) => step.id);
			if (JSON.stringify(parsed.sourceSteps) !== JSON.stringify(expected))
				fail(`${label}: source-step markers do not cover every story beat once and in order`);
		}
		if (profile.key === 'festival-master' && language === 'en')
			validateFestivalContinuity(prose, label);
	}

	const en = parsedByLanguage.get('en');
	const es = parsedByLanguage.get('es');
	if (en && es && profile.languages.es?.status === 'current') {
		const enShape = en.blocks.map(({ kind, section }) => `${section}:${kind}`);
		const esShape = es.blocks.map(({ kind, section }) => `${section}:${kind}`);
		if (JSON.stringify(enShape) !== JSON.stringify(esShape))
			fail(`${profile.key}: current English and Spanish prose have different structures`);
	}
	return {
		dialogues: performanceIds.size,
		provisional: (performance.entries ?? []).filter((entry) => entry.lineStatus === 'provisional')
			.length
	};
}

const requestedArg = process.argv.find((argument) => argument.startsWith('--audience='));
const requested = requestedArg?.split('=')[1] ?? 'all';
const registry = JSON.parse(read(registryPath));
const voiceProfiles = JSON.parse(read(voiceProfilesPath));
const profiles = (registry.narratives ?? []).filter(
	(profile) => requested === 'all' || profile.key === requested
);
if (!profiles.length) fail(`Unknown audience profile: ${requested}`);
const results = [];
for (const profile of profiles) {
	const result = validateProfile(profile, voiceProfiles);
	if (result)
		results.push(`${profile.key}=${result.dialogues} dialogues/${result.provisional} provisional`);
}
for (const warning of warnings) console.warn(`Audience narrative warning: ${warning}`);
if (failures.length) {
	console.error(`Audience narrative validation failed (${failures.length}):`);
	for (const failure of failures) console.error(`- ${failure}`);
	process.exit(1);
}
console.log(`Audience narratives valid: ${results.join('; ')}`);
