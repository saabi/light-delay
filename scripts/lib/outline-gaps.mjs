// @ts-nocheck
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const text = (value) => (typeof value === 'string' ? value : (value?.es ?? value?.en ?? ''));
export function buildOutlineGapsReport(root, options = {}) {
	const target = options.target ?? 'script';
	const project =
		options.project ?? JSON.parse(readFileSync(join(root, 'data', 'project.json'), 'utf8'));
	const gaps = [],
		unmetDeps = [],
		withoutOutline = [];
	const dir = join(root, 'data', 'outlines');
	for (const entry of project.project?.scripts ?? []) {
		const outlinePath = `data/outlines/${String(entry.id).replace(/^script:/, '')}.json`,
			abs = join(root, outlinePath);
		if (!existsSync(abs)) {
			withoutOutline.push(entry.id);
			continue;
		}
		const outline = JSON.parse(readFileSync(abs, 'utf8')),
			byId = new Map(outline.steps.map((s) => [s.id, s]));
		for (const step of outline.steps.filter((s) => s.level === 'detail')) {
			const state = step.coverage?.[target]?.status ?? 'not_started';
			if (step.importance === 'required' && !['covered', 'not_applicable'].includes(state))
				gaps.push({
					scriptId: entry.id,
					label: text(entry.label),
					outlinePath,
					stepId: step.id,
					parentStepId: step.parentStepId,
					title: text(step.title),
					status: state,
					importance: step.importance
				});
			if (state === 'covered') {
				const unmet = (step.causalLinks ?? [])
					.map((l) => l.sourceStepId)
					.filter(
						(id) =>
							!['covered', 'not_applicable'].includes(byId.get(id)?.coverage?.[target]?.status)
					);
				if (unmet.length)
					unmetDeps.push({
						scriptId: entry.id,
						label: text(entry.label),
						outlinePath,
						stepId: step.id,
						title: text(step.title),
						unmetDependsOn: unmet
					});
			}
		}
	}
	let count = 0;
	try {
		count = readdirSync(dir).filter((n) => n.endsWith('.json')).length;
	} catch {}
	return {
		reportId: 'outline-gaps',
		generatedAt: new Date().toISOString(),
		target,
		summary: {
			scripts: project.project?.scripts?.length ?? 0,
			outlinesPresent: count,
			withoutOutline: withoutOutline.length,
			requiredGaps: gaps.length,
			unmetDependencies: unmetDeps.length
		},
		withoutOutline,
		gaps,
		unmetDeps
	};
}
export function formatOutlineGapsMarkdown(report) {
	const lines = [
		'# Outline gaps',
		'',
		`Generated: ${report.generatedAt}`,
		`Target: **${report.target}**`,
		'',
		`Scripts: **${report.summary.scripts}** · outlines present: **${report.summary.outlinesPresent}** · without file: **${report.summary.withoutOutline}** · required gaps: **${report.summary.requiredGaps}** · unmet causal prerequisites: **${report.summary.unmetDependencies}**`,
		'',
		'## Required detail steps not covered',
		''
	];
	if (!report.gaps.length) lines.push('_None._', '');
	else {
		lines.push(
			'| Script | Story parent | Detail | Status | Title |',
			'| --- | --- | --- | --- | --- |'
		);
		for (const r of report.gaps)
			lines.push(
				`| \`${r.scriptId}\` | \`${r.parentStepId ?? ''}\` | \`${r.stepId}\` | ${r.status} | ${r.title.replace(/\|/g, '\\|')} |`
			);
		lines.push('');
	}
	lines.push('## Covered details with unmet causal prerequisites', '');
	if (!report.unmetDeps.length) lines.push('_None._', '');
	else
		for (const r of report.unmetDeps)
			lines.push(`- \`${r.stepId}\`: ${r.unmetDependsOn.map((id) => `\`${id}\``).join(', ')}`);
	if (report.withoutOutline.length) {
		lines.push(
			'',
			'## Scripts without outline',
			'',
			...report.withoutOutline.map((id) => `- \`${id}\``),
			''
		);
	}
	return lines.join('\n');
}
