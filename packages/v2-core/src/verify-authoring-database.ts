import { readFile, writeFile } from 'node:fs/promises';
import { Pool } from 'pg';
import {
	compareSummaries,
	summarizeAuthoringDatabase,
	summaryProblems,
	type AuthoringDatabaseSummary
} from './authoring-database-check.js';

/*
	Usage: DATABASE_URL=... node dist/verify-authoring-database.js [--out summary.json] [--compare summary.json]

	Reads the authoring database through Studio's application code and prints a summary. Exits 1 if
	the database is unfit to serve (schema not current, history does not reconstruct the head) or,
	with --compare, if it differs from the given summary. It never writes to the database.
*/
const args = process.argv.slice(2);
const option = (name: string) => {
	const index = args.indexOf(name);
	return index >= 0 ? args[index + 1] : undefined;
};
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');
const pool = new Pool({ connectionString, max: 2 });
try {
	const summary = await summarizeAuthoringDatabase(pool);
	const out = option('--out');
	if (out) await writeFile(out, `${JSON.stringify(summary, null, 2)}\n`, { mode: 0o600 });
	else console.log(JSON.stringify(summary, null, 2));
	const problems = summaryProblems(summary);
	const compare = option('--compare');
	if (compare) {
		const expected = JSON.parse(await readFile(compare, 'utf8')) as AuthoringDatabaseSummary;
		problems.push(...compareSummaries(expected, summary));
	}
	for (const problem of problems) console.error(`verify: ${problem}`);
	console.error(
		problems.length
			? `verify: FAILED (${problems.length} problem${problems.length === 1 ? '' : 's'})`
			: `verify: OK (${summary.projects.length} project${summary.projects.length === 1 ? '' : 's'}, schema ${summary.schema.status})`
	);
	process.exitCode = problems.length ? 1 : 0;
} finally {
	await pool.end();
}
