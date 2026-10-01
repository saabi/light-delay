import {
	authoringFixtureIds,
	type AuthoringApplication,
	type TrustedExecutionContext
} from '@light-delay/v2-core';
import { createRetriedRequest, type ConnectionState } from './authoring-retry.js';

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

const connectionListeners = new Set<(state: ConnectionState) => void>();
const call = createRetriedRequest({
	fetcher: (...args) => fetch(...args),
	onState: (state) => {
		for (const listener of connectionListeners) listener(state);
	}
});
export const authorizeManualAuthoringRetry = () => call.authorizeManualRetry();
export function onAuthoringConnectionState(listener: (state: ConnectionState) => void): () => void {
	connectionListeners.add(listener);
	return () => connectionListeners.delete(listener);
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
