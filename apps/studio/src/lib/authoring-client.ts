import {
	AuthoringApplication,
	InMemoryProjectStoreResolver,
	authoringFixtureIds,
	harborLightInitialRevision,
	type TrustedExecutionContext
} from '@light-delay/v2-core';

const resolver = new InMemoryProjectStoreResolver([harborLightInitialRevision]);

export const authoringApplication = new AuthoringApplication(resolver);
export const studioAuthoringContext: TrustedExecutionContext = {
	principal: { kind: 'human', id: 'user:local-filmmaker' },
	requestId: 'request:studio-write'
};
export { authoringFixtureIds };
