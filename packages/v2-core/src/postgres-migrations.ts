import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { Pool, PoolClient } from 'pg';

const migrationsDirectory = fileURLToPath(new URL('../migrations/', import.meta.url));

export async function migrateAuthoringDatabase(pool: Pool): Promise<readonly string[]> {
	const client: PoolClient = await pool.connect();
	try {
		await client.query('BEGIN');
		await client.query(
			"SELECT pg_advisory_xact_lock(hashtext('light-delay-authoring-migrations-v1'))"
		);
		await client.query(`CREATE TABLE IF NOT EXISTS authoring_schema_migrations (
			version text PRIMARY KEY,
			sha256 text NOT NULL,
			applied_at timestamptz NOT NULL DEFAULT now()
		)`);
		const files = (await readdir(migrationsDirectory))
			.filter((name) => /^\d{3}_[a-z0-9_]+\.sql$/.test(name))
			.sort();
		const applied = await client.query<{ version: string; sha256: string }>(
			'SELECT version, sha256 FROM authoring_schema_migrations ORDER BY version'
		);
		const known = new Map(applied.rows.map((row) => [row.version, row.sha256]));
		for (const version of known.keys()) {
			if (!files.includes(version))
				throw new Error(`Unknown applied authoring migration: ${version}`);
		}
		for (const file of files) {
			const sql = await readFile(new URL(`../migrations/${file}`, import.meta.url), 'utf8');
			const sha256 = createHash('sha256').update(sql).digest('hex');
			const previous = known.get(file);
			if (previous && previous !== sha256) throw new Error(`Authoring migration changed: ${file}`);
			if (previous) continue;
			await client.query(sql);
			await client.query(
				'INSERT INTO authoring_schema_migrations (version, sha256) VALUES ($1, $2)',
				[file, sha256]
			);
		}
		await client.query('COMMIT');
		return files;
	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	} finally {
		client.release();
	}
}

export interface AuthoringSchemaStatus {
	/**
	 * `current`: every bundled migration is applied, unchanged, and nothing else is.
	 * `ahead`: as current, plus migrations this build does not know (a newer release migrated;
	 * additive migrations keep older builds compatible, so rollback stays possible).
	 * `behind`: a bundled migration is not applied yet. `changed`: an applied migration's file
	 * differs from this build's. `uninitialized`: no migrations table.
	 */
	status: 'current' | 'ahead' | 'behind' | 'changed' | 'uninitialized';
	expected: string[];
	applied: string[];
	missing: string[];
	unknown: string[];
	changed: string[];
}

/** Compares the database's applied migrations with this build's, without changing anything. */
export async function authoringSchemaStatus(
	pool: Pick<Pool, 'query'>
): Promise<AuthoringSchemaStatus> {
	const files = (await readdir(migrationsDirectory))
		.filter((name) => /^\d{3}_[a-z0-9_]+\.sql$/.test(name))
		.sort();
	const hashes = new Map<string, string>();
	for (const file of files) {
		const sql = await readFile(new URL(`../migrations/${file}`, import.meta.url), 'utf8');
		hashes.set(file, createHash('sha256').update(sql).digest('hex'));
	}
	const empty = { expected: files, applied: [], missing: files, unknown: [], changed: [] };
	const table = await pool.query<{ name: string | null }>(
		"SELECT to_regclass('authoring_schema_migrations')::text AS name"
	);
	if (!table.rows[0]?.name) return { status: 'uninitialized', ...empty };
	const rows = (
		await pool.query<{ version: string; sha256: string }>(
			'SELECT version, sha256 FROM authoring_schema_migrations ORDER BY version'
		)
	).rows;
	const applied = rows.map((row) => row.version);
	const missing = files.filter((file) => !applied.includes(file));
	const unknown = applied.filter((version) => !hashes.has(version));
	const changed = rows
		.filter((row) => hashes.has(row.version) && hashes.get(row.version) !== row.sha256)
		.map((row) => row.version);
	const status = changed.length
		? 'changed'
		: missing.length
			? 'behind'
			: unknown.length
				? 'ahead'
				: 'current';
	return { status, expected: files, applied, missing, unknown, changed };
}
