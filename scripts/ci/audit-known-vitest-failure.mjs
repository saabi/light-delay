import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const [testFile, testName, expectedFailure] = process.argv.slice(2);
if (!testFile || !testName || !expectedFailure) {
	throw new Error(
		'Usage: audit-known-vitest-failure <test-file> <test-name> <expected-failure-text>'
	);
}

const temp = mkdtempSync(join(tmpdir(), 'light-delay-known-test-'));
const report = join(temp, 'vitest.json');
try {
	const vitest = join(root, 'node_modules/vitest/vitest.mjs');
	const env = { ...process.env };
	delete env.LIGHT_DELAY_COMPAT_GATE;
	const run = spawnSync(
		process.execPath,
		[
			vitest,
			'run',
			testFile,
			'--testNamePattern',
			testName,
			'--reporter=json',
			'--outputFile=' + report
		],
		{ cwd: join(root, 'apps/light-delay'), env, encoding: 'utf8' }
	);
	if (run.error) throw run.error;
	if (run.stdout) process.stdout.write(run.stdout);
	if (run.stderr) process.stderr.write(run.stderr);
	if (run.status === 0)
		throw new Error('Known data assertion unexpectedly passed; review and remove the quarantine.');
	if (run.status !== 1)
		throw new Error('Expected the known assertion to fail with exit 1; got ' + run.status + '.');

	const output = JSON.parse(readFileSync(report, 'utf8'));
	const failed = (output.testResults ?? []).flatMap((suite) =>
		(suite.assertionResults ?? []).filter((test) => test.status === 'failed')
	);
	if (
		output.numFailedTests !== 1 ||
		output.numPassedTests !== 0 ||
		failed.length !== 1 ||
		!failed[0].fullName?.includes(testName) ||
		!failed[0].failureMessages?.some((message) => message.includes(expectedFailure))
	) {
		console.error(
			'Observed known-data audit report: ' +
			JSON.stringify({
				numFailedTests: output.numFailedTests,
				numPassedTests: output.numPassedTests,
				failed: failed.map((test) => ({
					fullName: test.fullName,
					title: test.title,
					messages: (test.failureMessages ?? []).map((message) => message.slice(0, 500))
				}))
			})
		);
		throw new Error(
			'The known data audit changed unexpectedly; refusing to classify a different failure as legacy.'
		);
	}
	console.log('KNOWN PROJECT-DATA FAILURE (audited): ' + testName + ' — ' + expectedFailure);
} finally {
	rmSync(temp, { recursive: true, force: true });
}
