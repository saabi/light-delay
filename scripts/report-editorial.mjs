/**
 * Run all editorial reports (1→11) in priority order.
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const reports = [
	'visual-art',
	'image-debt',
	'shot-completeness',
	'cue-placement',
	'dialogue-performance',
	'entity-binding',
	'scene-polish',
	'cue-coverage',
	'take-workflow',
	'dialogue-i18n',
	'regen-briefs'
];

const extra = process.argv.slice(2);

for (const name of reports) {
	console.log(`\n=== report:${name} ===`);
	const result = spawnSync('node', [join(ROOT, 'scripts', `report-${name}.mjs`), ...extra], {
		stdio: 'inherit',
		shell: process.platform === 'win32'
	});
	if (result.status !== 0) process.exit(result.status ?? 1);
}
