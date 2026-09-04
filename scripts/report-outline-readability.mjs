import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..'),
	issues = [];
const text = (v) => (typeof v === 'string' ? v : (v?.es ?? v?.en ?? ''));
const bodyText = (blocks = []) =>
	blocks
		.flatMap((block) => (block.type === 'list' ? block.items.map(text) : [text(block.text)]))
		.join(' ');
for (const name of readdirSync(join(root, 'data', 'outlines')).filter((n) => n.endsWith('.json'))) {
	const file = JSON.parse(readFileSync(join(root, 'data', 'outlines', name), 'utf8')),
		children = new Map(),
		hasDetailLayer = file.steps.some((step) => step.level === 'detail');
	for (const step of file.steps)
		if (step.parentStepId)
			children.set(step.parentStepId, (children.get(step.parentStepId) ?? 0) + 1);
	for (const step of file.steps) {
		const title = text(step.title).trim(),
			storyText = (step.body ? bodyText(step.body) : text(step.summary)).trim(),
			storyField = step.body ? 'body' : 'summary',
			words = storyText.split(/\s+/).filter(Boolean).length;
		if (title.toLocaleLowerCase() === storyText.toLocaleLowerCase())
			issues.push({
				file: name,
				stepId: step.id,
				severity: 'error',
				issue: `title repeats ${storyField}`
			});
		if (words < 12)
			issues.push({
				file: name,
				stepId: step.id,
				severity: 'warning',
				issue: `${storyField} is only ${words} words`
			});
		if (hasDetailLayer && step.level === 'story' && !children.get(step.id))
			issues.push({
				file: name,
				stepId: step.id,
				severity: 'error',
				issue: 'story beat has no detail children'
			});
		if (step.level === 'story' && step.order > 1 && !step.causalLinks?.length)
			issues.push({
				file: name,
				stepId: step.id,
				severity: 'error',
				issue: 'story beat has no explicit causal link'
			});
		if (/\b(propuesto|pendiente|to be proposed|pending)\b/i.test(`${title} ${storyText}`))
			issues.push({
				file: name,
				stepId: step.id,
				severity: 'warning',
				issue: 'stale planning language in narrative text'
			});
	}
}
const report = {
	reportId: 'outline-readability',
	generatedAt: new Date().toISOString(),
	summary: {
		issues: issues.length,
		errors: issues.filter((r) => r.severity === 'error').length,
		warnings: issues.filter((r) => r.severity === 'warning').length
	},
	issues
};
const out = join(root, 'reports', 'outline-readability');
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'project.json'), `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(
	join(out, 'project.md'),
	[
		'# Outline readability',
		'',
		`Errors: **${report.summary.errors}** · warnings: **${report.summary.warnings}**`,
		'',
		...issues.map((r) => `- **${r.severity}** \`${r.stepId}\` (${r.file}): ${r.issue}`),
		''
	].join('\n')
);
console.log(
	`outline-readability: ${report.summary.errors} errors; ${report.summary.warnings} warnings`
);
if (report.summary.errors) process.exitCode = 1;
