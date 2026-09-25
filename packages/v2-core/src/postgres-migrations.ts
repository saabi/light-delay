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
