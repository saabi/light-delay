/**
 * Editorial dialogue timing report (montage vs spoken estimates).
 *
 * Usage:
 *   node scripts/report-dialogue-timing.mjs
 *   node scripts/report-dialogue-timing.mjs --script script:light-delay-main-short --lang en
 *   node scripts/report-dialogue-timing.mjs --all --format md
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	buildDialogueTimingReport,
	formatDialogueTimingMarkdown,
	localizeScriptDialogue
} from './lib/dialogue-timing.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROJECT_JSON = join(ROOT, 'data', 'project.json');
const REPORT_DIR = join(ROOT, 'reports', 'dialogue-timing');
const PUBLIC_EN = join(ROOT, 'data', 'translations', 'public.en.json');

/**
 * @param {string[]} argv
 */
function parseArgs(argv) {
	const options = {
		scriptId: undefined,
		language: 'es',
		all: false,
		format: 'both'
	};
	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (arg === '--script') {
			options.scriptId = argv[++i];
		} else if (arg === '--lang') {
			options.language = argv[++i] ?? 'es';
		} else if (arg === '--all') {
			options.all = true;
		} else if (arg === '--format') {
			const value = argv[++i] ?? 'both';
			if (value === 'md' || value === 'json' || value === 'both') {
				options.format = value;
			}
		}
	}
	return options;
}

/**
 * @param {string} scriptId
 */
function loadScript(scriptId) {
	const slug = scriptId.replace(/^script:/, '');
	const path = join(ROOT, 'data', 'scripts', `${slug}.json`);
	return JSON.parse(readFileSync(path, 'utf8'));
}

function main() {
	const options = parseArgs(process.argv.slice(2));
	const project = JSON.parse(readFileSync(PROJECT_JSON, 'utf8'));
	const translations = JSON.parse(readFileSync(PUBLIC_EN, 'utf8')).translations ?? {};
	const scriptIds = options.all
		? project.project.scripts.map((/** @type {{ id: string }} */ entry) => entry.id)
		: [options.scriptId ?? project.project.canonicalScriptId];

	mkdirSync(REPORT_DIR, { recursive: true });

	for (const scriptId of scriptIds) {
		const raw = loadScript(scriptId);
		const script = localizeScriptDialogue(raw, translations, options.language);
		const report = buildDialogueTimingReport(script, options.language);
		const baseName = `${scriptId.replace(/^script:/, '')}.${options.language}`;

		if (options.format === 'json' || options.format === 'both') {
			const jsonPath = join(REPORT_DIR, `${baseName}.json`);
			writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
			console.log(`Wrote ${jsonPath}`);
		}
		if (options.format === 'md' || options.format === 'both') {
			const mdPath = join(REPORT_DIR, `${baseName}.md`);
			writeFileSync(mdPath, `${formatDialogueTimingMarkdown(report)}\n`, 'utf8');
			console.log(`Wrote ${mdPath}`);
		}

		console.log(
			`  surplus shots: ${report.summary.spokenSurplusShotCount}, multi-speaker: ${report.summary.multiSpeakerShotCount}, off-camera: ${report.summary.offCameraShotCount}, loose scenes: ${report.summary.montageSurplusSceneCount}, silent long: ${report.summary.silentLongShotCount}`
		);
	}
}

main();
