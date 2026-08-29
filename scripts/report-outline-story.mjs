import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = join(root, 'data', 'outlines');
const local = (value, language) =>
	typeof value === 'string' ? value : (value?.[language] ?? value?.es ?? value?.en ?? '');
const outlines = readdirSync(sourceDir)
	.filter((name) => name.endsWith('.json'))
	.map((name) => JSON.parse(readFileSync(join(sourceDir, name), 'utf8')))
	.map((file) => ({
		outlineId: file.outline.id,
		scriptId: file.outline.scriptId,
		title: file.outline.title,
		synopsis: file.outline.synopsis,
		story: file.steps
			.filter((step) => step.level === 'story')
			.sort((a, b) => a.order - b.order)
			.map((step) => ({
				id: step.id,
				order: step.order,
				title: step.title,
				summary: step.summary,
				causalLinks: step.causalLinks ?? []
			}))
	}))
	.sort((a, b) => a.scriptId.localeCompare(b.scriptId));

const report = {
	reportId: 'outline-story',
	generatedAt: new Date().toISOString(),
	note: 'Story-only review surface. Detail steps are deliberately excluded.',
	outlines
};
const markdown = ['# Escaletas — lectura de historia', ''];
for (const outline of outlines) {
	markdown.push(`## ${local(outline.title, 'es')}`, '', local(outline.synopsis, 'es'), '');
	for (const step of outline.story) {
		markdown.push(
			`### ${step.order}. ${local(step.title, 'es')}`,
			'',
			local(step.summary, 'es'),
			''
		);
		for (const link of step.causalLinks) {
			markdown.push(
				`Causa desde \`${link.sourceStepId}\` (${link.relation}): ${local(link.explanation, 'es')}`,
				''
			);
		}
	}
}
const out = join(root, 'reports', 'outline-story');
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'project.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
writeFileSync(join(out, 'project.md'), `${markdown.join('\n').trim()}\n`, 'utf8');
console.log(`outline-story: wrote ${outlines.length} story spines`);
