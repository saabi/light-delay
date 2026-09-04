import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = join(root, 'data', 'outlines');
const local = (value, language) =>
	typeof value === 'string' ? value : (value?.[language] ?? value?.es ?? value?.en ?? '');

function markdownBlocks(blocks, language) {
	const lines = [];
	for (const block of blocks ?? []) {
		if (block.type === 'heading')
			lines.push(`${'#'.repeat(block.level)} ${local(block.text, language)}`, '');
		else if (block.type === 'blockquote') lines.push(`> ${local(block.text, language)}`, '');
		else if (block.type === 'list') {
			for (const [index, item] of block.items.entries())
				lines.push(`${block.ordered ? `${index + 1}.` : '-'} ${local(item, language)}`);
			lines.push('');
		} else lines.push(local(block.text, language), '');
	}
	return lines;
}

const outlines = readdirSync(sourceDir)
	.filter((name) => name.endsWith('.json'))
	.map((name) => JSON.parse(readFileSync(join(sourceDir, name), 'utf8')))
	.map((file) => ({
		outlineId: file.outline.id,
		scriptId: file.outline.scriptId,
		title: file.outline.title,
		synopsis: file.outline.synopsis,
		editorialNotice: file.outline.editorialNotice,
		source: file.outline.source,
		framing: file.framing ?? [],
		storySections: file.storySections ?? [],
		story: file.steps
			.filter((step) => step.level === 'story')
			.sort((a, b) => a.order - b.order)
			.map((step) => ({
				id: step.id,
				sectionId: step.sectionId,
				order: step.order,
				title: step.title,
				...(step.body ? { body: step.body } : { summary: step.summary }),
				causalLinks: step.causalLinks ?? []
			}))
	}))
	.sort((a, b) => a.scriptId.localeCompare(b.scriptId));

const report = {
	reportId: 'outline-story',
	generatedAt: new Date().toISOString(),
	note: 'Story-only review surface. Framing is preserved before and after the narrative spine; detail steps are deliberately excluded.',
	outlines
};
const markdown = ['# Escaletas — lectura de historia', ''];
for (const outline of outlines) {
	markdown.push(`## ${local(outline.title, 'es')}`, '', local(outline.synopsis, 'es'), '');
	if (outline.editorialNotice) markdown.push(`> ${local(outline.editorialNotice, 'es')}`, '');
	for (const framing of outline.framing
		.filter((item) => item.placement === 'before_story')
		.sort((a, b) => a.order - b.order)) {
		markdown.push(`### ${local(framing.title, 'es')}`, '', ...markdownBlocks(framing.blocks, 'es'));
	}
	const sections = [...outline.storySections].sort((a, b) => a.order - b.order);
	const groups = sections.length ? sections : [{ id: undefined, title: { es: 'Historia' } }];
	for (const section of groups) {
		if (sections.length) markdown.push(`### ${local(section.title, 'es')}`, '');
		for (const step of outline.story.filter(
			(item) => item.sectionId === section.id || !sections.length
		)) {
			markdown.push(`#### ${step.order}. ${local(step.title, 'es')}`, '');
			if (step.body) markdown.push(...markdownBlocks(step.body, 'es'));
			else markdown.push(local(step.summary, 'es'), '');
			for (const link of step.causalLinks) {
				markdown.push(
					`Causa desde \`${link.sourceStepId}\` (${link.relation}): ${local(link.explanation, 'es')}`,
					''
				);
			}
		}
	}
	for (const framing of outline.framing
		.filter((item) => item.placement === 'after_story')
		.sort((a, b) => a.order - b.order)) {
		markdown.push(`### ${local(framing.title, 'es')}`, '', ...markdownBlocks(framing.blocks, 'es'));
	}
}
const out = join(root, 'reports', 'outline-story');
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'project.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
writeFileSync(join(out, 'project.md'), `${markdown.join('\n').trim()}\n`, 'utf8');
console.log(`outline-story: wrote ${outlines.length} story spines`);
