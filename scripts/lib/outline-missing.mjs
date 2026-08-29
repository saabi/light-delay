/**
 * Project-level report: which registered scripts lack an outline JSON.
 */
// @ts-nocheck
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * @param {string} root
 * @param {{ project?: unknown }} [options]
 */
export function buildOutlineMissingReport(root, options = {}) {
	const project =
		options.project ??
		JSON.parse(readFileSync(join(root, 'data', 'project.json'), 'utf8'));
	const scripts = project.project?.scripts ?? [];
	const generatedAt = new Date().toISOString();
	/** @type {Array<{ scriptId: string; label: string; kind: string; outlinePath: string; present: boolean; stepCount: number }>} */
	const rows = [];

	for (const entry of scripts) {
		const slug = String(entry.id).replace(/^script:/, '');
		const outlinePath = `data/outlines/${slug}.json`;
		const abs = join(root, outlinePath);
		const present = existsSync(abs);
		let stepCount = 0;
		if (present) {
			try {
				const outline = JSON.parse(readFileSync(abs, 'utf8'));
				stepCount = Array.isArray(outline.steps) ? outline.steps.length : 0;
			} catch {
				stepCount = 0;
			}
		}
		rows.push({
			scriptId: entry.id,
			label: entry.label,
			kind: entry.kind,
			outlinePath,
			present,
			stepCount
		});
	}

	const missing = rows.filter((row) => !row.present);
	const empty = rows.filter((row) => row.present && row.stepCount === 0);
	const present = rows.filter((row) => row.present);

	return {
		reportId: 'outline-missing',
		generatedAt,
		summary: {
			scripts: rows.length,
			present: present.length,
			missing: missing.length,
			emptySteps: empty.length
		},
		rows,
		missing,
		empty
	};
}

/**
 * @param {ReturnType<typeof buildOutlineMissingReport>} report
 */
export function formatOutlineMissingMarkdown(report) {
	const lines = [
		'# Outline missing',
		'',
		`Generated: ${report.generatedAt}`,
		'',
		`Scripts: **${report.summary.scripts}** · with outline: **${report.summary.present}** · missing: **${report.summary.missing}** · empty steps: **${report.summary.emptySteps}**`,
		'',
		'## Missing outlines',
		''
	];

	if (report.missing.length === 0) {
		lines.push('_None._', '');
	} else {
		lines.push('| Script | Label | Kind | Expected path |', '| --- | --- | --- | --- |');
		for (const row of report.missing) {
			lines.push(`| \`${row.scriptId}\` | ${row.label} | ${row.kind} | \`${row.outlinePath}\` |`);
		}
		lines.push('');
	}

	if (report.empty.length) {
		lines.push('## Present but empty', '');
		lines.push('| Script | Path | Steps |', '| --- | --- | --- |');
		for (const row of report.empty) {
			lines.push(`| \`${row.scriptId}\` | \`${row.outlinePath}\` | ${row.stepCount} |`);
		}
		lines.push('');
	}

	lines.push('## All scripts', '');
	lines.push('| Script | Present | Steps | Path |', '| --- | --- | --- | --- |');
	for (const row of report.rows) {
		lines.push(
			`| \`${row.scriptId}\` | ${row.present ? 'yes' : 'no'} | ${row.stepCount} | \`${row.outlinePath}\` |`
		);
	}
	lines.push('');
	return lines.join('\n');
}
