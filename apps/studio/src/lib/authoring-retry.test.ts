import { describe, expect, it, vi } from 'vitest';
import {
	createRetriedRequest,
	AuthoringRequestError,
	type ConnectionState
} from './authoring-retry';

const reply = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json', ...headers }
	});
const command = { type: 'AcceptProposal', projectId: 'project:test', proposalId: 'proposal:test' };

describe('Studio transient requests', () => {
	it('retries network failures exactly three times with bounded backoff', async () => {
		const fetcher = vi
			.fn()
			.mockRejectedValueOnce(new Error('offline'))
			.mockRejectedValueOnce(new Error('offline'))
			.mockRejectedValueOnce(new Error('offline'))
			.mockResolvedValueOnce(reply({ number: 1 }));
		const waits: number[] = [];
		const request = createRetriedRequest({
			fetcher: fetcher as typeof fetch,
			random: () => 0.5,
			sleep: async (ms) => {
				waits.push(ms);
			}
		});
		expect(await request('getProjectHead', ['project:test'])).toEqual({ number: 1 });
		expect(fetcher).toHaveBeenCalledTimes(4);
		expect(waits).toEqual([500, 1500, 4000]);
	});
	it('honors a longer Retry-After and does not retry semantic failures', async () => {
		const fetcher = vi
			.fn()
			.mockResolvedValueOnce(reply({ code: 'STORE_UNAVAILABLE' }, 503, { 'Retry-After': '3' }))
			.mockResolvedValueOnce(reply([]))
			.mockResolvedValueOnce(reply({ ok: false, error: { code: 'CONFLICT', message: 'Changed' } }));
		const waits: number[] = [];
		const request = createRetriedRequest({
			fetcher: fetcher as typeof fetch,
			random: () => 0.5,
			sleep: async (ms) => {
				waits.push(ms);
			}
		});
		expect(
			await request('handle', [
				{
					type: 'RestoreScreenplay',
					projectId: 'project:test',
					scope: { documentId: 'document:test', versionId: 'version:test' },
					targetRevision: 0,
					expectedDocumentVersion: 2
				}
			])
		).toMatchObject({ ok: false, error: { code: 'CONFLICT' } });
		expect(waits).toEqual([3000]);
	});
	it('accepts an HTTP-date Retry-After', async () => {
		const date = new Date(Date.now() + 10_000).toUTCString();
		const fetcher = vi
			.fn()
			.mockResolvedValueOnce(reply({ code: 'STORE_UNAVAILABLE' }, 503, { 'Retry-After': date }))
			.mockResolvedValueOnce(reply({ number: 1 }));
		const waits: number[] = [];
		const request = createRetriedRequest({
			fetcher: fetcher as typeof fetch,
			sleep: async (ms) => {
				waits.push(ms);
			}
		});
		await request('getProjectHead', ['project:test']);
		expect(waits[0]).toBeGreaterThanOrEqual(8_000);
	});
	it('reconciles a lost acceptance acknowledgement before sending another mutation', async () => {
		const changeSet = { id: 'changeset:test', resultingRevision: 1 };
		const fetcher = vi
			.fn()
			.mockRejectedValueOnce(new Error('lost response'))
			.mockResolvedValueOnce(
				reply({ id: command.proposalId, status: 'accepted', changeSetId: changeSet.id })
			)
			.mockResolvedValueOnce(reply([changeSet]))
			.mockResolvedValueOnce(reply({ number: 1, changeSetId: changeSet.id }));
		const request = createRetriedRequest({
			fetcher: fetcher as typeof fetch,
			sleep: async () => {},
			random: () => 0.5
		});
		expect(await request('handle', [command])).toMatchObject({
			ok: true,
			kind: 'proposal-accepted',
			changeSet,
			revision: { number: 1 }
		});
		expect(
			fetcher.mock.calls.filter(
				([_, init]) => JSON.parse((init as RequestInit).body as string).method === 'handle'
			)
		).toHaveLength(1);
	});
	it('retries STORE_BUSY within the same four-attempt budget', async () => {
		const fetcher = vi
			.fn()
			.mockImplementation(async () =>
				reply({ ok: false, error: { code: 'STORE_BUSY', message: 'Try again' } })
			);
		const request = createRetriedRequest({
			fetcher: fetcher as typeof fetch,
			sleep: async () => {}
		});
		expect(await request('handle', [command])).toMatchObject({
			ok: false,
			error: { code: 'STORE_BUSY' }
		});
		expect(fetcher).toHaveBeenCalledTimes(4);
	});
	it('reconciles rejected proposals and scoped restores', async () => {
		const restore = {
			type: 'RestoreScreenplay',
			projectId: 'project:test',
			scope: { documentId: 'document:test', versionId: 'version:test' },
			targetRevision: 0,
			expectedDocumentVersion: 1
		};
		const restored = {
			id: 'changeset:restore',
			resultingRevision: 2,
			provenance: { kind: 'scoped-restore', targetRevision: 0, scope: restore.scope },
			preconditions: [{ type: 'DocumentVersionEquals', expectedDocumentVersion: 1 }]
		};
		const fetcher = vi
			.fn()
			.mockRejectedValueOnce(new Error('lost reject response'))
			.mockResolvedValueOnce(reply({ id: command.proposalId, status: 'rejected' }))
			.mockRejectedValueOnce(new Error('lost restore response'))
			.mockResolvedValueOnce(reply([restored]))
			.mockResolvedValueOnce(reply({ number: 2, changeSetId: restored.id }));
		const request = createRetriedRequest({
			fetcher: fetcher as typeof fetch,
			sleep: async () => {}
		});
		expect(await request('handle', [{ ...command, type: 'RejectProposal' }])).toMatchObject({
			ok: true,
			kind: 'proposal-rejected'
		});
		expect(await request('handle', [restore])).toMatchObject({
			ok: true,
			kind: 'screenplay-restored',
			revision: { number: 2 }
		});
	});
	it('exhausts retries and permits an explicit later request', async () => {
		const states: ConnectionState[] = [];
		const fetcher = vi
			.fn()
			.mockRejectedValueOnce(new Error('offline'))
			.mockRejectedValueOnce(new Error('offline'))
			.mockRejectedValueOnce(new Error('offline'))
			.mockRejectedValueOnce(new Error('offline'))
			.mockResolvedValueOnce(reply({ number: 2 }));
		const request = createRetriedRequest({
			fetcher: fetcher as typeof fetch,
			sleep: async () => {},
			onState: (state) => states.push(state)
		});
		await expect(request('getProjectHead', ['project:test'])).rejects.toBeInstanceOf(
			AuthoringRequestError
		);
		expect(states.at(-1)).toEqual({ kind: 'unavailable', reason: 'database' });
		expect(await request('getProjectHead', ['project:test'])).toEqual({ number: 2 });
		expect(states.at(-1)).toEqual({ kind: 'ready' });
	});
	it('does not replay an ambiguous CreateProposal without an explicit manual retry', async () => {
		const states: ConnectionState[] = [];
		const proposalCommand = {
			type: 'CreateProposal',
			projectId: 'project:test',
			draftId: 'draft:test'
		};
		const fetcher = vi
			.fn()
			.mockRejectedValueOnce(new Error('lost acknowledgement'))
			.mockResolvedValueOnce(reply([]))
			.mockResolvedValueOnce(reply([]))
			.mockResolvedValueOnce(reply([]))
			.mockResolvedValueOnce(reply([]))
			.mockResolvedValueOnce(
				reply({ ok: true, kind: 'proposal-created', proposal: { id: 'proposal:new' } })
			);
		const request = createRetriedRequest({
			fetcher: fetcher as typeof fetch,
			sleep: async () => {},
			onState: (state) => states.push(state)
		});
		await expect(request('handle', [proposalCommand])).rejects.toMatchObject({
			code: 'OUTCOME_UNKNOWN'
		});
		expect(states.at(-1)).toEqual({ kind: 'unavailable', reason: 'unknown' });
		expect(
			fetcher.mock.calls.filter(
				([_, init]) => JSON.parse((init as RequestInit).body as string).method === 'handle'
			)
		).toHaveLength(1);
		request.authorizeManualRetry();
		expect(await request('handle', [proposalCommand])).toMatchObject({
			ok: true,
			kind: 'proposal-created'
		});
	});
});
