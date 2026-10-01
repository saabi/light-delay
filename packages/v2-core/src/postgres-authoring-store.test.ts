import { describe, expect, it, vi } from 'vitest';
import {
	createPostgresPool,
	isPostgresUnavailable,
	POSTGRES_CONNECTION_LIMITS
} from './postgres-authoring-store.js';

describe('PostgreSQL authoring pool', () => {
	it('handles an idle-client error without logging connection details', async () => {
		const pool = createPostgresPool('postgresql://writer:secret@localhost/studio');
		const log = vi.spyOn(console, 'error').mockImplementation(() => {});
		try {
			expect(() => pool.emit('error', new Error('secret connection details'))).not.toThrow();
			expect(log).toHaveBeenCalledWith('Studio PostgreSQL pool lost an idle connection', 'unknown');
			expect(JSON.stringify(log.mock.calls)).not.toContain('secret');
		} finally {
			log.mockRestore();
			await pool.end();
		}
	});
	it('classifies connection failures and configured timeouts narrowly', () => {
		for (const code of [
			'ECONNREFUSED',
			'ECONNRESET',
			'08006',
			'57P01',
			'57P02',
			'57P03',
			'25P03',
			'53300'
		])
			expect(isPostgresUnavailable(Object.assign(new Error('connection failed'), { code }))).toBe(
				true
			);
		expect(
			isPostgresUnavailable(
				Object.assign(new Error('canceling statement due to statement timeout'), { code: '57014' })
			)
		).toBe(true);
		expect(isPostgresUnavailable(new Error('timeout exceeded when trying to connect'))).toBe(true);
		for (const code of ['23505', '23503', '42601', '40001', '57014'])
			expect(isPostgresUnavailable(Object.assign(new Error('ordinary SQL error'), { code }))).toBe(
				false
			);
		for (const message of [
			'Client has encountered a connection error and is not queryable',
			'Client was closed and is not queryable',
			'Query read timeout'
		])
			expect(isPostgresUnavailable(new Error(message))).toBe(true);
		expect(isPostgresUnavailable(new Error('Stored authoring record is malformed'))).toBe(false);
		expect(POSTGRES_CONNECTION_LIMITS).toEqual({
			connectionTimeoutMillis: 5000,
			statement_timeout: 15000,
			query_timeout: 20000,
			idle_in_transaction_session_timeout: 30000,
			keepAlive: true,
			keepAliveInitialDelayMillis: 10000
		});
	});
});
