/**
 * Shared CLI helpers for editorial reports.
 */
// @ts-nocheck
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
 * @param {string} reportName
 * @param {(script: unknown, ctx: unknown, projectCtx: unknown) => unknown} buildReport
 * @param {(report: unknown) => string} formatMarkdown
 * @param {string[]} [argv]
 */
export function runSingleReport(reportName, buildReport, formatMarkdown, argv = process.argv.slice(2)) {
	const options = parseReportArgs(argv);
	const project = loadProject();
	const projectCtx = loadProjectContext();
	const scriptIds = getScriptIds(project, options);

	for (const scriptId of scriptIds) {
		const script = loadScript(scriptId);
		if (!script.shots?.length && reportName !== 'visual-art') {
			console.log(`${scriptId}: no shots, skipping`);
			continue;
		}
		const ctx = createScriptContext(script);
		const report = buildReport(script, ctx, projectCtx, options.language);
		const line = writeReport(reportName, scriptId, options.language, report, formatMarkdown, options);
		if (line) console.log(`  ${line}`);
	}
}

export function loadProjectContext() {
	const readJson = (/** @type {string} */ path) =>
		JSON.parse(readFileSync(join(ROOT, 'data', path), 'utf8'));
	const assetsFile = readJson('assets.json');
	const assets = assetsFile.assets ?? [];
	const assetById = new Map(assets.map((/** @type {{ id: string }} */ a) => [a.id, a]));
	const entities = [];
	for (const [file, key, kind] of [
		['characters.json', 'characters', 'character'],
		['locations.json', 'locations', 'location'],
		['objects.json', 'objects', 'object'],
		['vehicles.json', 'vehicles', 'vehicle'],
		['factions.json', 'factions', 'faction']
	]) {
		for (const entity of readJson(file)[key] ?? []) {
			entities.push({ kind, ...entity });
		}
	}
	const project = loadProject();
	const supportedLangs =
		project.project.languages?.supported?.map((/** @type {{ tag: string }} */ l) => l.tag) ??
		['es', 'en'];
	const locations = readJson('locations.json').locations ?? [];
	const locationById = new Map(locations.map((l) => [l.id, l]));
	return {
		assets,
		assetById,
		entities,
		staticRoot: join(ROOT, 'static'),
		supportedLangs,
		sourceLanguage: project.project.languages?.sourceLanguage ?? 'es',
		allScripts: project.project.scripts.map((/** @type {{ id: string }} */ s) => s.id),
		locationById
	};
}

/**
 * @param {import('../../src/lib/types/script.ts').ScriptFile} script
 */
export function createScriptContext(script) {
	const sceneById = new Map(script.scenes.map((s) => [s.id, s]));
	const shotById = new Map(script.shots.map((s) => [s.id, s]));
	const takeById = new Map(script.takes.map((t) => [t.id, t]));
	const cueById = new Map(script.cues.map((c) => [c.id, c]));
	const beatById = new Map(script.beats.map((b) => [b.id, b]));
	const beatSceneId = new Map(script.beats.map((b) => [b.id, b.sceneId]));

	/** @param {import('../../src/lib/types/script.ts').Shot} shot */
	const shotScene = (shot) => sceneById.get(shot.sceneId);

	/** @param {import('../../src/lib/types/script.ts').Shot} shot */
	const selectedTake = (shot) =>
		shot.selectedTakeId ? takeById.get(shot.selectedTakeId) : undefined;

	const shotsByScene = new Map();
	for (const shot of script.shots) {
		const list = shotsByScene.get(shot.sceneId) ?? [];
		list.push(shot);
		shotsByScene.set(shot.sceneId, list);
	}
	for (const list of shotsByScene.values()) list.sort((a, b) => a.order - b.order);

	const dialogueCueIdsInScene = new Map();
	for (const cue of script.cues) {
		if (cue.type !== 'dialogue') continue;
		const sceneId = beatSceneId.get(cue.beatId);
		if (!sceneId) continue;
		const set = dialogueCueIdsInScene.get(sceneId) ?? new Set();
		set.add(cue.id);
		dialogueCueIdsInScene.set(sceneId, set);
	}

	const placedCueIds = new Set();
	for (const shot of script.shots) {
		for (const p of shot.cuePlacements) placedCueIds.add(p.cueId);
	}

	return {
		script,
		sceneById,
		shotById,
		takeById,
		cueById,
		beatById,
		beatSceneId,
		shotScene,
		selectedTake,
		shotsByScene,
		dialogueCueIdsInScene,
		placedCueIds
	};
}
