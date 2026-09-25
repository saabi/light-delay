import {
	authoringFixtureIds,
	type AuthoringApplication,
	type TrustedExecutionContext
} from '@light-delay/v2-core';

type ClientMethods = Pick<
	AuthoringApplication,
	| 'getProjectHead'
	| 'getRevision'
	| 'listHistory'
	| 'getDraft'
	| 'listDrafts'
	| 'getProposal'
	| 'listProposals'
	| 'getScreenplayView'
	| 'handle'
>;

async function call<T>(method: string, args: unknown[]): Promise<T> {
	const response = await fetch('/api/authoring', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ method, args })
	});
	if (!response.ok) {
		const body = await response.json().catch(() => ({}));
		throw new Error(body.message ?? `Studio authoring request failed (${response.status})`);
	}
	return (await response.json()) as T;
}

export const authoringApplication: ClientMethods = {
	getProjectHead: (projectId) => call('getProjectHead', [projectId]),
	getRevision: (projectId, revision) => call('getRevision', [projectId, revision]),
	listHistory: (projectId) => call('listHistory', [projectId]),
	getDraft: (projectId, draftId) => call('getDraft', [projectId, draftId]),
	listDrafts: (projectId) => call('listDrafts', [projectId]),
	getProposal: (projectId, proposalId) => call('getProposal', [projectId, proposalId]),
	listProposals: (projectId) => call('listProposals', [projectId]),
	getScreenplayView: (projectId, scope, revision) =>
		call(
			'getScreenplayView',
			revision === undefined ? [projectId, scope] : [projectId, scope, revision]
		),
	handle: (command) => call('handle', [command])
};

// The server supplies trusted context; this value is retained for the Studio call surface.
export const studioAuthoringContext: TrustedExecutionContext = {
	principal: { kind: 'human', id: 'user:local-filmmaker' },
	requestId: 'request:studio-write'
};
export { authoringFixtureIds };
