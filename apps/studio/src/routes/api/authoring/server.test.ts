import { beforeEach, describe, expect, it, vi } from 'vitest';

const getAuthoringApplication = vi.hoisted(() => vi.fn());
vi.mock('$lib/server/authoring', () => ({
	getAuthoringApplication,
	serverAuthoringContext: {
		principal: { kind: 'human', id: 'user:test' },
		requestId: 'request:test'
	}
}));
import { POST } from './+server';

const event = () =>
	({
		request: new Request('http://localhost/api/authoring', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ method: 'getProjectHead', args: ['project:test'] })
		})
	}) as Parameters<typeof POST>[0];

describe('Studio authoring HTTP errors', () => {
	beforeEach(() => vi.restoreAllMocks());
	it('returns a safe retryable 503 for PostgreSQL connection loss', async () => {
		getAuthoringApplication.mockRejectedValue(
			Object.assign(new Error('password=private'), { code: '57P01' })
		);
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const response = await POST(event());
		expect(response.status).toBe(503);
		expect(response.headers.get('Retry-After')).toBe('1');
		expect(await response.json()).toEqual({
			code: 'STORE_UNAVAILABLE',
			message: 'Database connection is temporarily unavailable'
		});
	});
	it.each([
		'Client has encountered a connection error and is not queryable',
		'Client was closed and is not queryable',
		'Query read timeout'
	])('maps %s to safe HTTP 503', async (message) => {
		getAuthoringApplication.mockRejectedValue(new Error(message));
		const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
		const response = await POST(event());
		expect(response.status).toBe(503);
		expect(response.headers.get('Retry-After')).toBe('1');
		expect(await response.json()).toEqual({
			code: 'STORE_UNAVAILABLE',
			message: 'Database connection is temporarily unavailable'
		});
		expect(JSON.stringify(logged.mock.calls)).not.toContain(message);
	});
	it.each(['23505', '42501', '22P02'])(
		'keeps PostgreSQL SQLSTATE %s non-retryable',
		async (code) => {
			getAuthoringApplication.mockRejectedValue(Object.assign(new Error('private SQL'), { code }));
			vi.spyOn(console, 'error').mockImplementation(() => {});
			const response = await POST(event());
			expect(response.status).toBe(500);
			expect(response.headers.get('Retry-After')).toBeNull();
			expect(await response.json()).toMatchObject({ code: 'STORE_REJECTED' });
		}
	);
	it('does not label arbitrary SQL errors as retryable', async () => {
		getAuthoringApplication.mockRejectedValue(
			Object.assign(new Error('private SQL text'), { code: '23505' })
		);
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const response = await POST(event());
		expect(response.status).toBe(500);
		expect(response.headers.get('Retry-After')).toBeNull();
		expect(await response.json()).toEqual({
			code: 'STORE_REJECTED',
			message: 'Studio authoring request failed'
		});
	});
});
