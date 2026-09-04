/**
 * Import/check the English source layer of the unconstrained master outline.
 * Spanish remains authored in the JSON; --write preserves existing Spanish and editorial links.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_PATH = 'docs/wip/general-narrative-outline.en.md';
const OUTPUT_PATH = 'data/outlines/light-delay-master-narrative.json';
const EXPECTED_SOURCE_REVISION = '12';
const sourceFile = join(ROOT, SOURCE_PATH);
const outputFile = join(ROOT, OUTPUT_PATH);

const framingDefinitions = new Map([
	[
		'Purpose of this document',
		['master:framing-purpose', 'before_story', 1, 'purpose', 'Propósito de este documento']
	],
	['Terminology', ['master:framing-terminology', 'before_story', 2, 'terminology', 'Terminología']],
	['Premise', ['master:framing-premise', 'before_story', 3, 'premise', 'Premisa']],
	['Setting', ['master:framing-setting', 'before_story', 4, 'setting', 'Ambientación']],
	[
		'Confirmed physics and timing',
		['master:framing-physics', 'before_story', 5, 'physics', 'Física y tiempos confirmados']
	],
	[
		'Gravity throughline',
		['master:framing-gravity', 'before_story', 6, 'gravity', 'Línea transversal de la gravedad']
	],
	['Cast', ['master:framing-cast', 'before_story', 7, 'cast', 'Reparto']],
	[
		'Harlan’s motive',
		['master:framing-harlan-motive', 'before_story', 8, 'motivation', 'Motivación de Harlan']
	],
	[
		'Narrative stakes from Sequence D onward',
		['master:framing-stakes', 'after_story', 1, 'stakes', 'Riesgos narrativos desde la Secuencia D']
	],
	[
		'Structural throughlines',
		['master:framing-throughlines', 'after_story', 2, 'throughlines', 'Líneas estructurales']
	],
	[
		'Remaining production-level choices',
		[
			'master:framing-production-choices',
			'after_story',
			3,
			'production_choices',
			'Decisiones de producción pendientes'
		]
	]
]);

const storySectionSpanish = {
	'Prologue — Proxima watching Earth': 'Prólogo — Proxima observa la Tierra',
	'Sequence A — Embarkation and discovery': 'Secuencia A — Embarque y descubrimiento',
	'Sequence B — Warning and sabotage': 'Secuencia B — Advertencia y sabotaje',
	'Sequence C — Murder and aftermath': 'Secuencia C — Asesinato y consecuencias',
	'Sequence D — Investigation': 'Secuencia D — Investigación',
	'Sequence E — Revelation': 'Secuencia E — Revelación',
	'Sequence F — Confrontation and climax': 'Secuencia F — Confrontación y clímax',
	'Sequence G — First contact and close': 'Secuencia G — Primer contacto y cierre'
};

function cleanInline(value) {
	return value.replaceAll('**', '').trim();
}

function parseBlocks(lines) {
	const blocks = [];
	let index = 0;
	while (index < lines.length) {
		const line = lines[index];
		if (!line.trim() || line.trim() === '---') {
			index += 1;
			continue;
		}
		const heading = line.match(/^(###|####)\s+(.+)$/);
		if (heading) {
			blocks.push({ type: 'heading', level: heading[1].length, text: cleanInline(heading[2]) });
			index += 1;
			continue;
		}
		if (/^>\s?/.test(line)) {
			const parts = [];
			while (index < lines.length && /^>\s?/.test(lines[index])) {
				parts.push(lines[index].replace(/^>\s?/, '').trim());
				index += 1;
			}
			blocks.push({ type: 'blockquote', text: cleanInline(parts.join(' ')) });
			continue;
		}
		const listMatch = line.match(/^\s*(-|\d+\.)\s+(.+)$/);
		if (listMatch) {
			const ordered = /\d+\./.test(listMatch[1]);
			const items = [];
			while (index < lines.length) {
				const item = lines[index].match(/^\s*(-|\d+\.)\s+(.+)$/);
				if (!item || /\d+\./.test(item[1]) !== ordered) break;
				const parts = [item[2].trim()];
				index += 1;
				while (
					index < lines.length &&
					lines[index].trim() &&
					!/^\s*(-|\d+\.)\s+/.test(lines[index]) &&
					!/^#{2,4}\s+/.test(lines[index]) &&
					!/^>\s?/.test(lines[index])
				) {
					parts.push(lines[index].trim());
					index += 1;
				}
				items.push(cleanInline(parts.join(' ')));
				while (index < lines.length && !lines[index].trim()) index += 1;
			}
			blocks.push({ type: 'list', ...(ordered ? { ordered: true } : {}), items });
			continue;
		}
		const parts = [];
		while (
			index < lines.length &&
			lines[index].trim() &&
			lines[index].trim() !== '---' &&
			!/^#{2,4}\s+/.test(lines[index]) &&
			!/^>\s?/.test(lines[index]) &&
			!/^\s*(-|\d+\.)\s+/.test(lines[index])
		) {
			parts.push(lines[index].trim());
			index += 1;
		}
		if (parts.length) blocks.push({ type: 'paragraph', text: cleanInline(parts.join(' ')) });
	}
	return blocks;
}

function headings(lines, level) {
	const pattern = new RegExp(`^#{${level}}\\s+(.+)$`);
	return lines
		.map((line, index) => ({ index, match: line.match(pattern) }))
		.filter((entry) => entry.match)
		.map((entry) => ({ index: entry.index, title: entry.match[1].trim() }));
}

function blockSignature(block, language = null) {
	const value = (localized) => (language ? (localized?.[language] ?? '') : (localized ?? ''));
	return JSON.stringify(
		block.type === 'list'
			? {
					type: block.type,
					ordered: Boolean(block.ordered),
					items: block.items.map(value)
				}
			: {
					type: block.type,
					...(block.type === 'heading' ? { level: block.level } : {}),
					text: value(block.text)
				}
	);
}

function localizedBlock(block, previous) {
	if (block.type === 'list') {
		const previousItems = new Map();
		if (previous?.type === 'list') {
			for (const item of previous.items ?? []) {
				const queue = previousItems.get(item.en) ?? [];
				queue.push(item.es);
				previousItems.set(item.en, queue);
			}
		}
		return {
			type: 'list',
			...(block.ordered ? { ordered: true } : {}),
			items: block.items.map((text) => ({
				es: previousItems.get(text)?.shift() ?? '',
				en: text
			}))
		};
	}
	return {
		type: block.type,
		...(block.type === 'heading' ? { level: block.level } : {}),
		text: { es: previous?.type === block.type ? (previous.text?.es ?? '') : '', en: block.text }
	};
}

function localizedBlocks(blocks, previous = []) {
	const previousBySignature = new Map();
	for (const block of previous) {
		const signature = blockSignature(block, 'en');
		const queue = previousBySignature.get(signature) ?? [];
		queue.push(block);
		previousBySignature.set(signature, queue);
	}
	const claimed = new Set();
	const exactMatches = blocks.map((block) => {
		const match = previousBySignature.get(blockSignature(block))?.shift();
		if (match) claimed.add(match);
		return match;
	});
	const unmatchedPreviousLists = previous.filter(
		(block) => block.type === 'list' && !claimed.has(block)
	);
	const unmatchedNewLists = blocks.filter(
		(block, index) => block.type === 'list' && !exactMatches[index]
	);
	const fallbackList =
		unmatchedPreviousLists.length === 1 && unmatchedNewLists.length === 1
			? unmatchedPreviousLists[0]
			: undefined;
	return blocks.map((block, index) =>
		localizedBlock(block, exactMatches[index] ?? (block.type === 'list' ? fallbackList : undefined))
	);
}

function sectionId(title) {
	if (title.startsWith('Prologue')) return 'master:section-prologue';
	const match = title.match(/^Sequence ([A-G])\b/);
	if (!match) throw new Error(`Unknown story section: ${title}`);
	return `master:section-${match[1].toLowerCase()}`;
}

function buildOutline() {
	const source = readFileSync(sourceFile, 'utf8').replaceAll('\r\n', '\n');
	const revision = source.match(/^Working draft, English, revision (\d+)\.$/m)?.[1];
	if (revision !== EXPECTED_SOURCE_REVISION)
		throw new Error(
			`Expected ${SOURCE_PATH} revision ${EXPECTED_SOURCE_REVISION}, found ${revision ?? 'none'}`
		);
	const lines = source.split('\n');
	const h2 = headings(lines, 2);
	const previous = existsSync(outputFile) ? JSON.parse(readFileSync(outputFile, 'utf8')) : null;
	const previousFraming = new Map((previous?.framing ?? []).map((item) => [item.id, item]));
	const previousSteps = new Map((previous?.steps ?? []).map((item) => [item.id, item]));
	const framing = [];
	const storySections = [];
	const steps = [];
	let storyOrder = 0;

	for (let h2Index = 0; h2Index < h2.length; h2Index += 1) {
		const current = h2[h2Index];
		const end = h2[h2Index + 1]?.index ?? lines.length;
		const framingDefinition = framingDefinitions.get(current.title);
		if (framingDefinition) {
			const [id, placement, order, kind, spanishTitle] = framingDefinition;
			framing.push({
				id,
				placement,
				order,
				kind,
				title: { es: previousFraming.get(id)?.title?.es || spanishTitle, en: current.title },
				blocks: localizedBlocks(
					parseBlocks(lines.slice(current.index + 1, end)),
					previousFraming.get(id)?.blocks
				)
			});
			continue;
		}
		if (!(current.title in storySectionSpanish)) continue;
		const id = sectionId(current.title);
		storySections.push({
			id,
			order: storySections.length + 1,
			title: {
				es:
					previous?.storySections?.find((item) => item.id === id)?.title?.es ||
					storySectionSpanish[current.title],
				en: current.title
			}
		});
		const beatHeadings = headings(lines.slice(current.index + 1, end), 3).map((item) => ({
			...item,
			index: item.index + current.index + 1
		}));
		for (let beatIndex = 0; beatIndex < beatHeadings.length; beatIndex += 1) {
			const beat = beatHeadings[beatIndex];
			const beatEnd = beatHeadings[beatIndex + 1]?.index ?? end;
			const sourceLabel = beat.title.split(/\s+—\s+/)[0].toLowerCase();
			const stepId = `master:story-${sourceLabel}`;
			const old = previousSteps.get(stepId);
			storyOrder += 1;
			steps.push({
				id: stepId,
				level: 'story',
				sectionId: id,
				order: storyOrder,
				title: { es: old?.title?.es ?? '', en: beat.title },
				body: localizedBlocks(parseBlocks(lines.slice(beat.index + 1, beatEnd)), old?.body),
				importance: old?.importance ?? 'required',
				...(old?.causalLinks ? { causalLinks: old.causalLinks } : {})
			});
		}
	}

	const sha256 = createHash('sha256').update(readFileSync(sourceFile)).digest('hex');
	return {
		schemaVersion: '1.3.0',
		outline: {
			id: 'outline:light-delay-master-narrative',
			scriptId: 'script:light-delay-master-narrative',
			title: {
				es:
					previous?.outline?.title?.es ??
					'Escaleta — Light Delay: narrativa maestra sin límite (WIP)',
				en: 'Outline — Light Delay: unconstrained master narrative (WIP)'
			},
			synopsis: {
				es:
					previous?.outline?.synopsis?.es ??
					'Borrador de desarrollo no canónico y sin límite de duración. No reemplaza los guiones corto, festival, tráiler ni largo registrados.',
				en: 'Non-canonical, unconstrained development draft. It does not replace the registered short, festival, trailer, or feature scripts.'
			},
			status: 'draft',
			version: '0.2.0-wip',
			source: { path: SOURCE_PATH, revision, language: 'en', sha256 },
			editorialNotice: {
				es:
					previous?.outline?.editorialNotice?.es ??
					'Esta narrativa maestra es una rama de trabajo no canónica. Su trama no fue adoptada por ninguna de las cuatro versiones existentes.',
				en: 'This master narrative is a non-canonical development branch. Its plot has not been adopted by any of the four existing versions.'
			}
		},
		framing: framing.sort(
			(a, b) =>
				(a.placement === 'before_story' ? 0 : 1) - (b.placement === 'before_story' ? 0 : 1) ||
				a.order - b.order
		),
		storySections,
		steps
	};
}

function englishProjection(file) {
	const projectBlock = (block) =>
		block.type === 'list'
			? {
					type: block.type,
					...(block.ordered ? { ordered: true } : {}),
					items: block.items.map((item) => item.en)
				}
			: {
					type: block.type,
					...(block.type === 'heading' ? { level: block.level } : {}),
					text: block.text.en
				};
	return {
		version: file.outline.version,
		source: file.outline.source,
		framing: file.framing.map((section) => ({
			id: section.id,
			placement: section.placement,
			order: section.order,
			kind: section.kind,
			title: section.title.en,
			blocks: section.blocks.map(projectBlock)
		})),
		storySections: file.storySections.map((section) => ({
			id: section.id,
			order: section.order,
			title: section.title.en
		})),
		steps: file.steps.map((step) => ({
			id: step.id,
			sectionId: step.sectionId,
			order: step.order,
			title: step.title.en,
			body: step.body.map(projectBlock)
		}))
	};
}

const expected = buildOutline();
if (process.argv.includes('--write')) {
	writeFileSync(outputFile, `${JSON.stringify(expected, null, 2)}\n`, 'utf8');
	console.log(
		`master-outline: wrote ${expected.steps.length} story beats and ${expected.framing.length} framing sections`
	);
} else {
	if (!existsSync(outputFile)) throw new Error(`Missing ${OUTPUT_PATH}`);
	const actual = JSON.parse(readFileSync(outputFile, 'utf8'));
	const expectedJson = JSON.stringify(englishProjection(expected));
	const actualJson = JSON.stringify(englishProjection(actual));
	if (actualJson !== expectedJson) {
		console.error(
			`master-outline: English source layer differs from WIP revision ${EXPECTED_SOURCE_REVISION}; run with --write and review Spanish alignment`
		);
		process.exit(1);
	}
	if (
		actual.steps.length !== 57 ||
		actual.storySections.length !== 8 ||
		actual.framing.length !== 11
	) {
		console.error(
			'master-outline: completeness counts must be 57 story beats, 8 story sections, and 11 framing sections'
		);
		process.exit(1);
	}
	console.log(
		`master-outline: English source fidelity OK (revision ${EXPECTED_SOURCE_REVISION}; 57 beats; 11 framing sections)`
	);
}
