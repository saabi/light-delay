import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = join(root, 'data', 'outlines');
const files = readdirSync(sourceDir)
	.filter((name) => name.endsWith('.json'))
	.map((name) => ({ name, value: JSON.parse(readFileSync(join(sourceDir, name), 'utf8')) }));
const byId = new Map(files.map((record) => [record.value.outline.id, record]));
const derivatives = [];

for (const record of files) {
	const derivation = record.value.outline.derivation;
	if (!derivation) continue;
	const source = byId.get(derivation.sourceOutlineId)?.value;
	const expected = (source?.steps ?? [])
		.filter((step) => step.level === 'story')
		.map((step) => step.id);
	const mapped = record.value.steps.flatMap((step) =>
		(step.sourceRefs ?? [])
			.filter((ref) => ref.kind === 'outline' && ref.outlineId === derivation.sourceOutlineId)
			.map((ref) => ref.stepId)
			.filter(Boolean)
	);
	const missing = expected.filter((id) => !mapped.includes(id));
	const duplicate = [...new Set(mapped.filter((id, index) => mapped.indexOf(id) !== index))];
	const unknown = mapped.filter((id) => !expected.includes(id));
	const currentSourceRevision = source?.outline.revision ?? null;
	const current = currentSourceRevision === derivation.sourceRevision;
	derivatives.push({
		outlineId: record.value.outline.id,
		scriptId: record.value.outline.scriptId,
		sourceOutlineId: derivation.sourceOutlineId,
		pinnedSourceRevision: derivation.sourceRevision,
		currentSourceRevision,
		reviewStatus: derivation.reviewStatus,
		fidelity: derivation.fidelity,
		sourceStorySteps: expected.length,
		mappedSourceSteps: mapped.length,
		missing,
		duplicate,
		unknown,
		valid: Boolean(source) && current && !missing.length && !unknown.length
	});
}

const report = {
	reportId: 'outline-derivation',
	generatedAt: new Date().toISOString(),
	derivatives
};
const markdown = [
	'# Outline derivation',
	'',
	...derivatives.flatMap((item) => [
		`## ${item.outlineId}`,
		'',
		`- Source: \`${item.sourceOutlineId}\` r${item.pinnedSourceRevision} (current r${item.currentSourceRevision ?? '?'})`,
		`- Status: **${item.reviewStatus}** · fidelity: \`${item.fidelity}\``,
		`- Coverage: **${item.mappedSourceSteps}/${item.sourceStorySteps}** source story steps`,
		`- Result: **${item.valid ? 'valid' : 'review required'}**`,
		...(item.missing.length
			? [`- Missing: ${item.missing.map((id) => `\`${id}\``).join(', ')}`]
			: []),
		...(item.duplicate.length
			? [`- Mapped more than once: ${item.duplicate.map((id) => `\`${id}\``).join(', ')}`]
			: []),
		...(item.unknown.length
			? [`- Unknown: ${item.unknown.map((id) => `\`${id}\``).join(', ')}`]
			: []),
		''
	])
];
const out = join(root, 'reports', 'outline-derivation');
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'project.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
writeFileSync(join(out, 'project.md'), `${markdown.join('\n').trim()}\n`, 'utf8');

const failed = derivatives.filter((item) => !item.valid || item.reviewStatus !== 'current');
console.log(
	`outline-derivation: ${derivatives.length} derivative(s); ${failed.length} require review`
);
if (failed.length) process.exitCode = 1;
