import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { authoringMigrationManifest } from './generated/migration-manifest.js';

describe('authoring migration manifest', () => {
	it('lists every migration file with its current SHA-256 (run npm run build to regenerate)', () => {
		const directory = new URL('../migrations/', import.meta.url);
		const files = readdirSync(directory)
			.filter((name) => /^\d{3}_[a-z0-9_]+\.sql$/.test(name))
			.sort();
		expect(authoringMigrationManifest).toEqual(
			files.map((version) => ({
				version,
				sha256: createHash('sha256')
					.update(readFileSync(new URL(version, directory), 'utf8'))
					.digest('hex')
			}))
		);
	});
});
