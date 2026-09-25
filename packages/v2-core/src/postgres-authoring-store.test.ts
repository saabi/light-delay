import { describe, expect, it, vi } from 'vitest';
import { createPostgresPool } from './postgres-authoring-store.js';

describe('PostgreSQL authoring pool', () => {
	it('handles an idle-client error without logging connection details', async () => {
		const pool = createPostgresPool('postgresql://writer:secret@localhost/studio');
		const log = vi.spyOn(console, 'error').mockImplementation(() => {});
		try {
			expect(() => pool.emit('error', new Error('secret connection details'))).not.toThrow();
			expect(log).toHaveBeenCalledWith('Studio PostgreSQL pool lost an idle connection');
			expect(JSON.stringify(log.mock.calls)).not.toContain('secret');
		} finally {
			log.mockRestore();
			await pool.end();
		}
	});
});
