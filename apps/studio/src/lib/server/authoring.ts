import {
	AuthoringApplication,
	InMemoryProjectStoreResolver,
	harborLightInitialRevision,
	type TrustedExecutionContext
} from '@light-delay/v2-core';

let applicationPromise: Promise<AuthoringApplication> | undefined;

export const serverAuthoringContext: TrustedExecutionContext = {
	principal: { kind: 'human', id: 'user:local-filmmaker' },
	requestId: 'request:studio-write'
};

export function getAuthoringApplication(): Promise<AuthoringApplication> {
	applicationPromise ??= createApplication().catch((error) => {
		applicationPromise = undefined;
		throw error;
	});
	return applicationPromise;
}

async function createApplication(): Promise<AuthoringApplication> {
	const mode =
		process.env.STUDIO_AUTHORING_STORE ??
		(process.env.NODE_ENV === 'production' ? 'postgres' : 'memory');
	if (mode === 'memory')
		return new AuthoringApplication(new InMemoryProjectStoreResolver([harborLightInitialRevision]));
	if (mode !== 'postgres') throw new Error(`Unknown STUDIO_AUTHORING_STORE mode: ${mode}`);
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString)
		throw new Error('DATABASE_URL is required for PostgreSQL Studio authoring');
	const { createPostgresPool, PostgresProjectStoreResolver } =
		await import('@light-delay/v2-core/postgres');
	const resolver = new PostgresProjectStoreResolver(createPostgresPool(connectionString));
	await resolver.seedProject(harborLightInitialRevision);
	return new AuthoringApplication(resolver);
}
