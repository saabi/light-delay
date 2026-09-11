/** Export the authoritative bilingual master outline to generated Markdown views. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const INPUT = join(ROOT, 'data/outlines/light-delay-master-narrative.json');
const CHARACTERS = join(ROOT, 'data/characters.json');
const LANGUAGES = ['es', 'en'];
const check = process.argv.includes('--check');
const characterNames = new Map(
	JSON.parse(readFileSync(CHARACTERS, 'utf8')).characters.map((character) => [
		character.id,
		character.name
	])
);

function value(localized, language) {
	const text = localized?.[language];
	if (typeof text !== 'string' || !text.trim()) {
		throw new Error(`Missing ${language} master-outline text`);
	}
	return text;
}

function renderBlock(block, language) {
	if (block.type === 'paragraph') return value(block.text, language);
	if (block.type === 'heading') return `${'#'.repeat(block.level)} ${value(block.text, language)}`;
	if (block.type === 'blockquote') {
		const lines = value(block.text, language).split('\n');
		const speaker = block.speakerId ? characterNames.get(block.speakerId) : undefined;
		const label = speaker ? value(speaker, language) : undefined;
		return lines
			.map((line, index) => `> ${index === 0 && label ? `**${label}:** ` : ''}${line}`)
			.join('\n');
	}
	if (block.type === 'list') {
		return block.items
			.map((item, index) => `${block.ordered ? `${index + 1}.` : '-'} ${value(item, language)}`)
			.join('\n');
	}
	throw new Error(`Unsupported prose block ${block.type}`);
}

function renderBlocks(blocks, language) {
	return blocks.map((block) => renderBlock(block, language)).join('\n\n');
}

function render(file, language) {
	const title =
		language === 'es'
			? 'Lúz Tardía — Escaleta narrativa general'
			: 'Light Delay — General Narrative Outline';
	const generated =
		language === 'es'
			? '<!-- GENERADO desde data/outlines/light-delay-master-narrative.json. NO EDITAR. -->'
			: '<!-- GENERATED from data/outlines/light-delay-master-narrative.json. DO NOT EDIT. -->';
	const revision =
		file.outline.revision ??
		file.outline.provenance?.importedFrom?.[0]?.revision ??
		file.outline.version;
	const revisionLine =
		language === 'es'
			? `Borrador de trabajo, español, revisión ${revision}.`
			: `Working draft, English, revision ${revision}.`;
	const authorityLine =
		language === 'es'
			? '**Estado editorial:** traducción de la fuente narrativa inglesa; continúa WIP.'
			: '**Editorial status:** current narrative source of truth; still WIP.';
	const lines = [generated, '', `# ${title}`, '', revisionLine, '', authorityLine, ''];
	const before = (file.framing ?? [])
		.filter((section) => section.placement === 'before_story')
		.sort((a, b) => a.order - b.order);
	const after = (file.framing ?? [])
		.filter((section) => section.placement === 'after_story')
		.sort((a, b) => a.order - b.order);
	for (const section of before) {
		lines.push(
			`## ${value(section.title, language)}`,
			'',
			renderBlocks(section.blocks, language),
			'',
			'---',
			''
		);
	}
	const stepsBySection = new Map();
	for (const step of (file.steps ?? [])
		.filter((item) => item.level === 'story')
		.sort((a, b) => a.order - b.order)) {
		const list = stepsBySection.get(step.sectionId) ?? [];
		list.push(step);
		stepsBySection.set(step.sectionId, list);
	}
	for (const section of [...(file.storySections ?? [])].sort((a, b) => a.order - b.order)) {
		lines.push(`## ${value(section.title, language)}`, '');
		for (const step of stepsBySection.get(section.id) ?? []) {
			lines.push(
				`### ${value(step.title, language)}`,
				'',
				renderBlocks(step.body ?? [], language),
				''
			);
		}
		lines.push('---', '');
	}
	for (const section of after) {
		lines.push(
			`## ${value(section.title, language)}`,
			'',
			renderBlocks(section.blocks, language),
			'',
			'---',
			''
		);
	}
	return `${lines
		.join('\n')
		.replace(/\n{4,}/g, '\n\n\n')
		.trim()}\n`;
}

const file = JSON.parse(readFileSync(INPUT, 'utf8'));
for (const language of LANGUAGES) {
	const declaration = file.outline.exports?.find(
		(item) => item.language === language && item.format === 'markdown'
	);
	if (!declaration) throw new Error(`Missing ${language} Markdown export declaration`);
	const output = join(ROOT, declaration.path);
	const translation = file.outline.localization?.translations?.[language];
	if (language !== (file.outline.localization?.sourceLanguage ?? 'en') && translation?.status !== 'current') {
		if (!existsSync(output)) throw new Error(`Missing stale translation export ${declaration.path}`);
		const existing = readFileSync(output, 'utf8');
		if (
			translation?.lastSyncedRevision &&
			!existing.includes(`revisión ${translation.lastSyncedRevision}.`)
		)
			throw new Error(`${declaration.path} does not match its recorded synchronized revision`);
		console.log(
			`master-outline: retained ${declaration.path} at revision ${translation?.lastSyncedRevision ?? 'unknown'} (${translation?.status ?? 'not_started'})`
		);
		continue;
	}
	const expected = render(file, language);
	if (check) {
		if (!existsSync(output) || readFileSync(output, 'utf8').replaceAll('\r\n', '\n') !== expected) {
			throw new Error(`${declaration.path} is stale; run npm run master-outline:export`);
		}
	} else {
		writeFileSync(output, expected, 'utf8');
		console.log(`master-outline: exported ${declaration.path}`);
	}
}

if (check) console.log('master-outline: generated Markdown exports are current');
