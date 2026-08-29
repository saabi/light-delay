import { spawnSync } from 'node:child_process';

const probe = process.argv.includes('--probe');
console.log('Higgsfield preflight is read-only: no media request will be submitted.');
console.log('Required before execution: live model catalog, account entitlement, credit/cost policy, concurrency, duration and reference limits.');
if (!probe) {
	console.log('Dry run only. Use --probe to query the locally installed Higgsfield CLI version/catalog without submitting generation.');
	process.exit(0);
}
const result = spawnSync('higgsfield', ['--version'], { encoding: 'utf8', shell: process.platform === 'win32' });
if (result.error || result.status !== 0) {
	console.error('Higgsfield CLI unavailable or version probe failed. Provider snapshot remains non-executable.');
	process.exitCode = 1;
} else console.log(result.stdout.trim() || result.stderr.trim());
