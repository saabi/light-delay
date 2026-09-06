/** Check speaker attribution and bilingual voice-direction coverage for the master outline. */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data');
const MASTER_CHARACTERS = new Set([
	'character:zao',
	'character:rao',
	'character:harlan',
	'character:voss',
	'character:sorell',
	'character:okoye'
]);

const load = (path) => JSON.parse(readFileSync(join(DATA, path), 'utf8'));
const outline = load('outlines/light-delay-master-narrative.json');
const profiles = load('voice-profiles.json').voiceProfiles;
const characters = load('characters.json').characters;
const characterIds = new Set(characters.map((character) => character.id));
const profileByCharacter = new Map(
	profiles.filter((profile) => profile.characterId).map((profile) => [profile.characterId, profile])
);
const errors = [];
const quotes = [];

for (const owner of [...(outline.framing ?? []), ...(outline.steps ?? [])]) {
	for (const block of owner.blocks ?? owner.body ?? []) {
		if (block.type === 'blockquote') quotes.push({ ownerId: owner.id, ...block });
	}
}

if (!Number.isInteger(outline.outline?.revision)) {
	errors.push('master outline must declare an integer outline.revision');
}
if (quotes.length < 37) errors.push(`expected at least 37 master quotations; found ${quotes.length}`);

for (const quote of quotes) {
	if (!quote.speakerId) {
		errors.push(`${quote.ownerId}: blockquote has no speakerId`);
		continue;
	}
	if (!characterIds.has(quote.speakerId)) {
		errors.push(`${quote.ownerId}: unknown speakerId ${quote.speakerId}`);
	}
	if (!MASTER_CHARACTERS.has(quote.speakerId)) {
		errors.push(`${quote.ownerId}: ${quote.speakerId} is outside the master cast`);
	}
}

for (const characterId of MASTER_CHARACTERS) {
	const profile = profileByCharacter.get(characterId);
	if (!profile) {
		errors.push(`${characterId}: missing voice profile`);
		continue;
	}
	for (const language of ['es', 'en']) {
		const variant = profile.variants?.find((item) => item.language === language);
		if (!variant) {
			errors.push(`${characterId}: missing ${language} voice variant`);
			continue;
		}
		if (!variant.locale?.startsWith(`${language}-`))
			errors.push(`${characterId}.${language}: missing matching locale`);
		for (const [field, value] of [
			['languageFormation.place', variant.languageFormation?.place],
			['languageFormation.variety', variant.languageFormation?.variety],
			['prosody', variant.prosody],
			['dialogueStyle', variant.dialogueStyle]
		]) {
			if (!value?.es?.trim() || !value?.en?.trim())
				errors.push(`${characterId}.${language}.${field}: requires ES/EN copy`);
		}
	}
}

const warning = outline.steps
	.flatMap((step) => (step.body ?? []).map((block) => ({ stepId: step.id, block })))
	.filter(({ stepId, block }) =>
		['master:story-b7', 'master:story-e2'].includes(stepId) && block.type === 'blockquote'
	);
if (
	warning.length !== 2 ||
	warning[0].block.text.es !== warning[1].block.text.es ||
	warning[0].block.text.en !== warning[1].block.text.en
) {
	errors.push('B7 and E2 must repeat Zao’s delayed warning verbatim in both languages');
}

const bySpeaker = Object.fromEntries(
	[...MASTER_CHARACTERS].map((id) => [id, quotes.filter((quote) => quote.speakerId === id).length])
);

if (errors.length) {
	console.error(`dialogue-style: ${errors.length} error(s)`);
	for (const error of errors) console.error(`- ${error}`);
	process.exit(1);
}

console.log(
	`dialogue-style: ${quotes.length} attributed master quotations; 6/6 characters have complete ES/EN direction`
);
console.log(JSON.stringify(bySpeaker));
