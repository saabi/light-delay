/**
 * CLI: list registered scripts without outline JSON.
 * Usage: node scripts/report-outline-missing.mjs [--format md|json|both]
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	buildOutlineMissingReport,
	formatOutlineMissingMarkdown
} from './lib/outline-missing.mjs';

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
const report = buildOutlineMissingReport(ROOT);
const outDir = join(ROOT, 'reports', 'outline-missing');
mkdirSync(outDir, { recursive: true });

if (format === 'json' || format === 'both') {
	const jsonPath = join(outDir, 'project.json');
	writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
	console.log(`wrote ${jsonPath}`);
}
if (format === 'md' || format === 'both') {
	const mdPath = join(outDir, 'project.md');
	writeFileSync(mdPath, formatOutlineMissingMarkdown(report), 'utf8');
	console.log(`wrote ${mdPath}`);
}

console.log(
	`outline-missing: ${report.summary.missing}/${report.summary.scripts} scripts without outline`
);
if (report.summary.missing > 0) {
	for (const row of report.missing) {
		console.log(` - ${row.scriptId} → ${row.outlinePath}`);
	}
}
