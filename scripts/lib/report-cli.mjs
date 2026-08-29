/**
 * Shared CLI helpers for editorial reports.
 */
// @ts-nocheck
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { localizeScriptDialogue } from './dialogue-timing.mjs';
import { createProjectContext } from './project-context.mjs';
import { buildReport, formatReportMarkdown } from './report-runner.mjs';
import { createScriptContext } from './script-context.mjs';

export { createScriptContext, createProjectContext };

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const PROJECT_JSON = join(ROOT, 'data', 'project.json');

/**
 * @param {string[]} argv
 */
export function parseReportArgs(argv) {
	const options = {
		scriptId: undefined,
		language: 'es',
		all: false,
		format: 'both'
	};
	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (arg === '--script') options.scriptId = argv[++i];
		else if (arg === '--lang') options.language = argv[++i] ?? 'es';
		else if (arg === '--all') options.all = true;
		else if (arg === '--format') {
			const value = argv[++i] ?? 'both';
			if (value === 'md' || value === 'json' || value === 'both') options.format = value;
		}
	}
	return options;
}

/**
 * @param {string} scriptId
 */
export function loadScript(scriptId) {
	const slug = scriptId.replace(/^script:/, '');
	return JSON.parse(readFileSync(join(ROOT, 'data', 'scripts', `${slug}.json`), 'utf8'));
}

export function loadProject() {
	return JSON.parse(readFileSync(PROJECT_JSON, 'utf8'));
}

/**
 * @param {ReturnType<typeof loadProject>} project
 * @param {{ scriptId?: string; all?: boolean }} options
 */
export function getScriptIds(project, options) {
	if (options.all) {
		return project.project.scripts.map((/** @type {{ id: string }} */ e) => e.id);
	}
	return [options.scriptId ?? project.project.canonicalScriptId];
}

/**
 * @param {unknown} script
 * @param {string} language
 */
export function prepareScriptForReport(script, language) {
	return localizeScriptDialogue(script, language);
}

export function createCliProjectContext() {
	const staticRoot = join(ROOT, 'static');
	return createProjectContext({
		checkDisk: (publicPath) => {
			if (!publicPath?.startsWith('/')) return false;
			return existsSync(join(staticRoot, publicPath));
		}
	});
}

/**
 * @param {string} reportName
 * @param {string} scriptId
 * @param {string} language
 * @param {unknown} report
 * @param {(report: unknown) => string} formatMarkdown
 * @param {{ format: string }} options
 * @returns {string} one-line summary for console
 */
export function writeReport(reportName, scriptId, language, report, formatMarkdown, options) {
	const reportDir = join(ROOT, 'reports', reportName);
	mkdirSync(reportDir, { recursive: true });
	const baseName = `${scriptId.replace(/^script:/, '')}.${language}`;

	if (options.format === 'json' || options.format === 'both') {
		const jsonPath = join(reportDir, `${baseName}.json`);
		writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
		console.log(`Wrote ${jsonPath}`);
	}
	if (options.format === 'md' || options.format === 'both') {
		const mdPath = join(reportDir, `${baseName}.md`);
		writeFileSync(mdPath, `${formatMarkdown(report)}\n`, 'utf8');
		console.log(`Wrote ${mdPath}`);
	}

	return report.summary?.consoleLine ?? '';
}

/**
 * @param {string} reportId
 * @param {string[]} [argv]
 */
export function runReportFromRegistry(reportId, argv = process.argv.slice(2)) {
	const options = parseReportArgs(argv);
	const project = loadProject();
	const projectCtx = createCliProjectContext();
	const scriptIds = getScriptIds(project, options);

	for (const scriptId of scriptIds) {
		const raw = loadScript(scriptId);
		const script = prepareScriptForReport(raw, options.language);
		const report = buildReport(reportId, script, options.language, projectCtx);
		const line = writeReport(
			reportId,
			scriptId,
			options.language,
			report,
			(r) => formatReportMarkdown(reportId, r),
			options
		);
		if (line) console.log(`  ${line}`);
	}
}

/** @deprecated Use runReportFromRegistry */
export function runSingleReport(reportName, buildReportFn, formatMarkdown, argv = process.argv.slice(2)) {
	runReportFromRegistry(reportName, argv);
}

export function loadProjectContext() {
	return createCliProjectContext();
}
