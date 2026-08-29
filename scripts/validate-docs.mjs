/**
 * Validate data-derived claims and local Markdown links in active documentation.
 * Historical baselines are checked for an explicit status banner instead of
 * being rewritten to current counts.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const errors = [];

function readJson(path) {
	return JSON.parse(readFileSync(join(ROOT, path), 'utf8'));
}

function read(path) {
	return readFileSync(join(ROOT, path), 'utf8');
}

function requireText(path, expected) {
	const text = read(path);
	if (!text.includes(expected)) errors.push(`${path}: expected current statement: ${expected}`);
}

function forbidText(path, forbidden) {
	const text = read(path);
	if (text.includes(forbidden)) errors.push(`${path}: obsolete active statement: ${forbidden}`);
}

function markdownFiles(directory) {
	const files = [];
	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) files.push(...markdownFiles(path));
		else if (extname(entry.name).toLowerCase() === '.md') files.push(path);
	}
	return files;
}

const main = readJson('data/scripts/light-delay-main-short.json');
const assets = readJson('data/assets.json').assets;
const animaticAssets = assets.filter((asset) => asset.role === 'animatic').length;
const referenceAssets = assets.filter((asset) => asset.role === 'reference').length;
const placeholders = assets.filter((asset) => asset.role === 'animatic_placeholder').length;
const withoutSource = assets.filter((asset) => !asset.source).length;
const withExactModel = assets.filter(
	(asset) => asset.source?.model || asset.generation?.model
).length;

if (main.scenes.length !== 17)
	errors.push(`main script: expected 17 scenes, got ${main.scenes.length}`);
if (main.shots.length !== 124)
	errors.push(`main script: expected 124 shots, got ${main.shots.length}`);
if (main.takes.length !== 124)
	errors.push(`main script: expected 124 takes, got ${main.takes.length}`);
if (animaticAssets !== 100)
	errors.push(`assets: expected 100 legacy animatic frames, got ${animaticAssets}`);
if (referenceAssets !== 31)
	errors.push(`assets: expected 31 reference images, got ${referenceAssets}`);
if (placeholders !== 1) errors.push(`assets: expected 1 animatic placeholder, got ${placeholders}`);
if (assets.length !== 132) errors.push(`assets: expected current total 132, got ${assets.length}`);
if (withoutSource !== 131)
	errors.push(`assets: expected 131 records without source, got ${withoutSource}`);
if (withExactModel !== 0)
	errors.push(`assets: expected exact model metadata to remain unknown, got ${withExactModel}`);

requireText('AGENTS.md', '17 escenas y el animatic principal 124 tomas');
requireText('README.md', 'animatic textual de 124 tomas');
requireText('docs/ASSET_PROVENANCE.md', '**132 imágenes registradas**');
requireText('docs/ASSET_PROVENANCE.md', '31 imágenes de referencia');
requireText('docs/PROJECT_STATUS.md', '17 escenas, 124 tomas y 30:39,5');
requireText(
	'docs/SCRIPT_ANIMATIC_SYNC.md',
	'| Tomas / takes | — | 124 tomas | 124 shots / 124 takes |'
);
requireText('docs/PRODUCTION_PLAN.md', 'animatic de 124 tomas que reutiliza 100 frames');
requireText('docs/technical/EXTERNAL_SCENES_AND_ANIMATION.md', '| Júpiter | ✅ bloqueo 3D |');

forbidText('docs/WORKFLOW.md', '`data/canon.json`');
forbidText('docs/WORKFLOW.md', '`data/props.json`');
forbidText('docs/WORKFLOW.md', '`data/shots.json`');

const historicalBanners = new Map([
	['docs/MIGRATION_PLAN.md', 'historical architecture baseline'],
	['docs/SVELTEKIT_SETUP.md', 'Documento histórico de bootstrap'],
	['docs/light-delay-long-full-feature-cut.md', 'FUENTE HISTÓRICA NO CANÓNICA'],
	['docs/light-delay-full-feature-overview.md', 'HISTORICAL, NON-CANONICAL SOURCE']
]);
for (const [path, marker] of historicalBanners) requireText(path, marker);

const markdown = [
	join(ROOT, 'README.md'),
	join(ROOT, 'TODO.md'),
	join(ROOT, 'RIGHTS.md'),
	...markdownFiles(DOCS)
].filter(existsSync);
const linkPattern = /\[[^\]]*\]\(([^)]+)\)/g;
for (const file of markdown) {
	const text = readFileSync(file, 'utf8');
	for (const match of text.matchAll(linkPattern)) {
		let target = match[1].trim();
		if (target.startsWith('<') && target.endsWith('>')) target = target.slice(1, -1);
		target = target.split('#')[0].split('?')[0];
		if (!target || /^(?:https?:|mailto:|data:)/i.test(target)) continue;
		try {
			target = decodeURIComponent(target);
		} catch {
			errors.push(`${relative(ROOT, file)}: invalid encoded link ${target}`);
			continue;
		}
		const resolved = resolve(dirname(file), target);
		if (!existsSync(resolved)) {
			errors.push(`${relative(ROOT, file)}: broken local link ${match[1]}`);
		}
	}
}

if (errors.length) {
	console.error('validate:docs failed');
	for (const error of errors) console.error(`- ${error}`);
	process.exit(1);
}

console.log('validate:docs OK');
console.log(
	`main=${main.scenes.length} scenes/${main.shots.length} shots/${main.takes.length} takes assets=${assets.length} (${animaticAssets} frames + ${referenceAssets} references + ${placeholders} placeholder)`
);
