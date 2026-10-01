import { Pool } from 'pg';
import { migrateAuthoringDatabase } from './postgres-migrations.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required for Studio authoring migrations');
const pool = new Pool({ connectionString });
try {
	const versions = await migrateAuthoringDatabase(pool);
	console.log(`Authoring schema is current at ${versions.at(-1) ?? 'empty'}`);
} finally {
	await pool.end();
}
