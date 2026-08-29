/**
 * CLI: required outline steps that are missing/deferred.
 * Usage: node scripts/report-outline-gaps.mjs [--format md|json|both]
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildOutlineGapsReport, formatOutlineGapsMarkdown } from './lib/outline-gaps.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function parseFormat(argv) {
	let format = 'both';
	for (let i = 0; i < argv.length; i += 1) {
		if (argv[i] === '--format') {
			const value = argv[++i] ?? 'both';
			if (value === 'md' || value === 'json' || value === 'both') format = value;
		}
	}
	return format;
}

const format = parseFormat(process.argv.slice(2));
const report = buildOutlineGapsReport(ROOT);
const outDir = join(ROOT, 'reports', 'outline-gaps');
mkdirSync(outDir, { recursive: true });

if (format === 'json' || format === 'both') {
	const jsonPath = join(outDir, 'project.json');
	writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
	console.log(`wrote ${jsonPath}`);
}
if (format === 'md' || format === 'both') {
	const mdPath = join(outDir, 'project.md');
	writeFileSync(mdPath, formatOutlineGapsMarkdown(report), 'utf8');
	console.log(`wrote ${mdPath}`);
}

console.log(
	`outline-gaps: ${report.summary.requiredGaps} required gaps; ${report.summary.unmetDependencies} unmet deps`
);
for (const row of report.gaps) {
	console.log(` - ${row.scriptId} ${row.stepId} [${row.status}] ${row.title}`);
}
