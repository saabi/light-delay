/**
 * Report required outline steps that are still missing/deferred,
 * and covered steps whose dependencies are not yet covered.
 */
// @ts-nocheck
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function storyText(value) {
	if (typeof value === 'string') return value;
	return value?.es ?? value?.en ?? '';
}

/**
 * @param {string} root
 * @param {{ project?: unknown }} [options]
 */
export function buildOutlineGapsReport(root, options = {}) {
	const project =
		options.project ??
		JSON.parse(readFileSync(join(root, 'data', 'project.json'), 'utf8'));
	const scripts = project.project?.scripts ?? [];
	const generatedAt = new Date().toISOString();
	const outlinesDir = join(root, 'data', 'outlines');

	/** @type {Array<{ scriptId: string; label: string; outlinePath: string; stepId: string; title: string; status: string; importance: string }>} */
	const gaps = [];
	/** @type {Array<{ scriptId: string; label: string; outlinePath: string; stepId: string; title: string; unmetDependsOn: string[] }>} */
	const unmetDeps = [];
	/** @type {string[]} */
	const withoutOutline = [];

	for (const entry of scripts) {
		const slug = String(entry.id).replace(/^script:/, '');
		const outlinePath = `data/outlines/${slug}.json`;
		const abs = join(root, outlinePath);
		if (!existsSync(abs)) {
			withoutOutline.push(entry.id);
			continue;
		}
		const outline = JSON.parse(readFileSync(abs, 'utf8'));
		const byId = new Map((outline.steps || []).map((step) => [step.id, step]));
		for (const step of outline.steps || []) {
			if (
				step.importance === 'required' &&
				(step.status === 'planned' || step.status === 'missing' || step.status === 'deferred')
			) {
				gaps.push({
					scriptId: entry.id,
					label: storyText(entry.label),
					outlinePath,
					stepId: step.id,
					title: storyText(step.title),
					status: step.status,
					importance: step.importance
				});
			}
			if (step.status === 'covered' && Array.isArray(step.dependsOnStepIds)) {
				const unmet = step.dependsOnStepIds.filter((id) => {
					const dep = byId.get(id);
					return !dep || dep.status !== 'covered';
				});
				if (unmet.length) {
					unmetDeps.push({
						scriptId: entry.id,
						label: storyText(entry.label),
						outlinePath,
						stepId: step.id,
						title: storyText(step.title),
						unmetDependsOn: unmet
					});
				}
			}
		}
	}

	let outlineFileCount = 0;
	try {
		outlineFileCount = readdirSync(outlinesDir).filter((name) => name.endsWith('.json')).length;
	} catch {
		outlineFileCount = 0;
	}

	return {
		reportId: 'outline-gaps',
		generatedAt,
		summary: {
			scripts: scripts.length,
			outlinesPresent: outlineFileCount,
			withoutOutline: withoutOutline.length,
			requiredGaps: gaps.length,
			unmetDependencies: unmetDeps.length
		},
		withoutOutline,
		gaps,
		unmetDeps
	};
}

/**
 * @param {ReturnType<typeof buildOutlineGapsReport>} report
 */
export function formatOutlineGapsMarkdown(report) {
	const lines = [
		'# Outline gaps',
		'',
		`Generated: ${report.generatedAt}`,
		'',
		`Scripts: **${report.summary.scripts}** · outlines present: **${report.summary.outlinesPresent}** · without file: **${report.summary.withoutOutline}** · required gaps: **${report.summary.requiredGaps}** · unmet deps on covered steps: **${report.summary.unmetDependencies}**`,
		'',
		'## Required steps not covered',
		''
	];

	if (report.gaps.length === 0) {
		lines.push('_None._', '');
	} else {
		lines.push('| Script | Step | Status | Title |', '| --- | --- | --- | --- |');
		for (const row of report.gaps) {
			lines.push(
				`| \`${row.scriptId}\` | \`${row.stepId}\` | ${row.status} | ${row.title.replace(/\|/g, '\\|')} |`
			);
		}
		lines.push('');
	}

	lines.push('## Covered steps with unmet dependsOnStepIds', '');
	if (report.unmetDeps.length === 0) {
		lines.push('_None._', '');
	} else {
		lines.push('| Script | Step | Unmet deps |', '| --- | --- | --- |');
		for (const row of report.unmetDeps) {
			lines.push(
				`| \`${row.scriptId}\` | \`${row.stepId}\` | ${row.unmetDependsOn.map((id) => `\`${id}\``).join(', ')} |`
			);
		}
		lines.push('');
	}

	if (report.withoutOutline.length) {
		lines.push('## Scripts without outline file', '');
		for (const id of report.withoutOutline) lines.push(`- \`${id}\``);
		lines.push('');
	}

	return lines.join('\n');
}
