/**
 * Mark every take in scripts-with-shots as needs_regeneration (canon_mismatch).
 *
 * Usage: node scripts/mark-takes-needs-regeneration.mjs [--dry-run]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REGEN_IMAGE_STATUS } from './lib/editorial-reports.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROJECT_JSON = join(ROOT, 'data', 'project.json');

const dryRun = process.argv.includes('--dry-run');

function loadScript(scriptId) {
	const slug = scriptId.replace(/^script:/, '');
	return JSON.parse(readFileSync(join(ROOT, 'data', 'scripts', `${slug}.json`), 'utf8'));
}

function saveScript(scriptId, script) {
	const slug = scriptId.replace(/^script:/, '');
	writeFileSync(join(ROOT, 'data', 'scripts', `${slug}.json`), `${JSON.stringify(script, null, '\t')}\n`, 'utf8');
}

const project = JSON.parse(readFileSync(PROJECT_JSON, 'utf8'));
let total = 0;

for (const entry of project.project.scripts) {
	const script = loadScript(entry.id);
	if (!script.shots?.length) continue;
	let marked = 0;
	for (const take of script.takes) {
		take.imageStatus = { ...REGEN_IMAGE_STATUS };
		marked += 1;
	}
	total += marked;
	console.log(`${entry.id}: marked ${marked} takes`);
	if (!dryRun) saveScript(entry.id, script);
}

console.log(dryRun ? `dry-run: would mark ${total} takes` : `marked ${total} takes total`);
