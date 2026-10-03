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

type StoreMode = 'memory' | 'postgres';

function storeMode(): StoreMode {
	const mode =
		process.env.STUDIO_AUTHORING_STORE ??
		(process.env.NODE_ENV === 'production' ? 'postgres' : 'memory');
	if (mode !== 'memory' && mode !== 'postgres')
		throw new Error(`Unknown STUDIO_AUTHORING_STORE mode: ${mode}`);
	return mode;
}

/* One pool per process, shared by the application and the health check. */
let poolPromise: Promise<import('pg').Pool> | undefined;
function getPool() {
	poolPromise ??= (async () => {
		const connectionString = process.env.DATABASE_URL;
		if (!connectionString)
			throw new Error('DATABASE_URL is required for PostgreSQL Studio authoring');
		const { createPostgresPool } = await import('@light-delay/v2-core/postgres');
		return createPostgresPool(connectionString);
	})().catch((error) => {
		poolPromise = undefined;
		throw error;
	});
	return poolPromise;
}

async function createApplication(): Promise<AuthoringApplication> {
	if (storeMode() === 'memory')
		return new AuthoringApplication(new InMemoryProjectStoreResolver([harborLightInitialRevision]));
	const { PostgresProjectStoreResolver } = await import('@light-delay/v2-core/postgres');
	const resolver = new PostgresProjectStoreResolver(await getPool());
	await resolver.seedProject(harborLightInitialRevision);
	return new AuthoringApplication(resolver);
}

export interface AuthoringHealth {
	ok: boolean;
	store: StoreMode;
	/** PostgreSQL only: whether this build's migrations are applied (`ahead` stays compatible). */
	schema?: 'current' | 'ahead' | 'behind' | 'changed' | 'uninitialized' | 'unavailable';
	migrations?: { missing: string[]; unknown: string[]; changed: string[] };
}

/**
 * Whether this release can serve authoring against its store. Fails closed: a database that cannot
 * be reached, or whose schema does not match this build, is not healthy, so a deployment that
 * would activate against it is rolled back. Never includes connection details.
 */
export async function authoringHealth(): Promise<AuthoringHealth> {
	const store = storeMode();
	if (store === 'memory') return { ok: true, store };
	try {
		const { authoringSchemaStatus } = await import('@light-delay/v2-core/postgres');
		const status = await authoringSchemaStatus(await getPool());
		return {
			ok: status.status === 'current' || status.status === 'ahead',
			store,
			schema: status.status,
			migrations: { missing: status.missing, unknown: status.unknown, changed: status.changed }
		};
	} catch {
		return { ok: false, store, schema: 'unavailable' };
	}
}
