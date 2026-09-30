import type {
	AuthoringApplication,
	AuthoringChangeSet,
	AuthoringCommand,
	AuthoringCommandResult,
	ScreenplayDraft,
	ScreenplayProposal
} from '@light-delay/v2-core';

export type ConnectionState = {
	kind: 'ready' | 'retrying' | 'unavailable';
	attempt?: number;
	reason?: 'busy' | 'database' | 'unknown';
};
export class AuthoringRequestError extends Error {
	constructor(
		message: string,
		readonly code: string,
		readonly transient: boolean,
		readonly retryAfter = 0
	) {
		super(message);
	}
}

type Request = {
	<T>(method: string, args: unknown[]): Promise<T>;
	authorizeManualRetry(): void;
};
const delays = [500, 1500, 4000];

export function createRetriedRequest(options: {
	fetcher: typeof fetch;
	sleep?: (milliseconds: number) => Promise<void>;
	random?: () => number;
	onState?: (state: ConnectionState) => void;
}): Request {
	const sleep =
		options.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
	const random = options.random ?? Math.random;
	const onState = options.onState ?? (() => {});
	const ambiguous = new Set<string>();
	let manualRetry = false;

	async function once<T>(method: string, args: unknown[]): Promise<T> {
		let response: Response;
		try {
			response = await options.fetcher('/api/authoring', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ method, args })
			});
		} catch {
			throw new AuthoringRequestError(
				'Could not reach Studio. Your work is still in this browser.',
				'NETWORK',
				true
			);
		}
		if (!response.ok) {
			const body = await response.json().catch(() => ({}));
			const code = typeof body.code === 'string' ? body.code : 'HTTP_ERROR';
			const header = response.headers.get('Retry-After');
			const seconds = header && /^\d+$/.test(header) ? Number(header) * 1000 : undefined;
			const date = header && seconds === undefined ? Date.parse(header) : NaN;
			const retryAfter = Math.min(
				60_000,
				Math.max(0, seconds ?? (Number.isFinite(date) ? date - Date.now() : 0))
			);
			const transient = response.status === 503 && code === 'STORE_UNAVAILABLE';
			throw new AuthoringRequestError(
				transient
					? 'Database connection is temporarily unavailable'
					: typeof body.message === 'string'
						? body.message
						: 'Studio request failed',
				code,
				transient,
				retryAfter
			);
		}
		return (await response.json()) as T;
	}

	async function reconcile(command: AuthoringCommand): Promise<AuthoringCommandResult | undefined> {
		const projectId = command.projectId;
		if (command.type === 'AcceptProposal' || command.type === 'RejectProposal') {
			const proposal = await once<ScreenplayProposal | undefined>('getProposal', [
				projectId,
				command.proposalId
			]);
			if (!proposal || proposal.status === 'pending') return;
			if (command.type === 'RejectProposal' && proposal.status === 'rejected')
				return { ok: true, kind: 'proposal-rejected', proposal };
			if (
				command.type === 'AcceptProposal' &&
				proposal.status === 'accepted' &&
				proposal.changeSetId
			) {
				const history = await once<AuthoringChangeSet[]>('listHistory', [projectId]);
				const changeSet = history.find((item) => item.id === proposal.changeSetId);
				if (changeSet) {
					const revision = await once<Awaited<ReturnType<AuthoringApplication['getRevision']>>>(
						'getRevision',
						[projectId, changeSet.resultingRevision]
					);
					if (revision) return { ok: true, kind: 'proposal-accepted', changeSet, revision };
				}
			}
			return {
				ok: false,
				error: {
					code: 'PROPOSAL_ALREADY_RESOLVED',
					message: 'Proposal was resolved by another action'
				}
			};
		}
		if (command.type === 'RestoreScreenplay') {
			const history = await once<AuthoringChangeSet[]>('listHistory', [projectId]);
			const changeSet = history.find(
				(item) =>
					item.provenance.kind === 'scoped-restore' &&
					item.provenance.targetRevision === command.targetRevision &&
					item.provenance.scope.documentId === command.scope.documentId &&
					item.provenance.scope.versionId === command.scope.versionId &&
					item.preconditions.some(
						(precondition) =>
							precondition.type === 'DocumentVersionEquals' &&
							precondition.expectedDocumentVersion === command.expectedDocumentVersion
					)
			);
			if (changeSet) {
				const revision = await once<Awaited<ReturnType<AuthoringApplication['getRevision']>>>(
					'getRevision',
					[projectId, changeSet.resultingRevision]
				);
				if (revision) return { ok: true, kind: 'screenplay-restored', changeSet, revision };
			}
		}
		if (command.type === 'CreateProposal' && command.proposalId) {
			const proposal = await once<ScreenplayProposal | undefined>('getProposal', [
				projectId,
				command.proposalId
			]);
			if (proposal && proposal.source.ref.id === command.draftId)
				return { ok: true, kind: 'proposal-created', proposal };
		}
		if (command.type === 'SaveDraft') {
			const drafts = await once<ScreenplayDraft[]>('listDrafts', [projectId]);
			const draft = drafts.find(
				(item) =>
					(command.draftId
						? item.id === command.draftId
						: item.scope.documentId === command.scope.documentId &&
							item.scope.versionId === command.scope.versionId &&
							item.baseProjectRevision === command.baseProjectRevision &&
							item.baseDocumentVersion === command.baseDocumentVersion) &&
					JSON.stringify(item.elements) === JSON.stringify(command.elements)
			);
			if (draft) return { ok: true, kind: 'draft-saved', draft };
		}
	}

	const request = async <T>(method: string, args: unknown[]): Promise<T> => {
		const userRetried = manualRetry;
		manualRetry = false;
		const command = method === 'handle' ? (args[0] as AuthoringCommand) : undefined;
		const key = command ? JSON.stringify(command) : '';
		let retryAfter = 0;
		for (let attempt = 0; attempt <= delays.length; attempt++) {
			if (attempt) {
				onState({ kind: 'retrying', attempt });
				await sleep(
					Math.max(retryAfter, Math.round(delays[attempt - 1] * (0.75 + random() * 0.5)))
				);
			}
			try {
				if (command && ambiguous.has(key)) {
					const prior = await reconcile(command);
					if (prior) {
						ambiguous.delete(key);
						onState({ kind: 'ready' });
						return prior as T;
					}
					// A new Draft has no stable ID. Legacy CreateProposal callers without a
					// proposalId also cannot safely resend after an ambiguous response.
					if (
						!userRetried &&
						((command.type === 'CreateProposal' && !command.proposalId) ||
							(command.type === 'SaveDraft' && !command.draftId))
					) {
						if (attempt === delays.length) {
							onState({ kind: 'unavailable', reason: 'unknown' });
							throw new AuthoringRequestError(
								'Could not confirm whether this work was saved. Retry now to check again.',
								'OUTCOME_UNKNOWN',
								true
							);
						}
						continue;
					}
				}
				const result = await once<T>(method, args);
				if (
					command &&
					result &&
					typeof result === 'object' &&
					'ok' in result &&
					result.ok === false &&
					'error' in result &&
					(result as { ok: false; error: { code: string } }).error.code === 'STORE_BUSY'
				) {
					if (attempt === delays.length) {
						onState({ kind: 'unavailable', reason: 'busy' });
						return result;
					}
					continue;
				}
				if (command) ambiguous.delete(key);
				onState({ kind: 'ready' });
				return result;
			} catch (error) {
				if (!(error instanceof AuthoringRequestError) || !error.transient) {
					onState({ kind: 'ready' });
					throw error;
				}
				if (command) ambiguous.add(key);
				retryAfter = error.retryAfter;
				if (attempt === delays.length) {
					onState({
						kind: 'unavailable',
						reason: error.code === 'OUTCOME_UNKNOWN' ? 'unknown' : 'database'
					});
					throw error;
				}
			}
		}
		throw new Error('Retry budget exhausted');
	};
	return Object.assign(request, {
		authorizeManualRetry: () => {
			manualRetry = true;
		}
	});
}
