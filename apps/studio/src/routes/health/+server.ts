import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authoringHealth } from '$lib/server/authoring';

type ReleaseInfo = {
	revision?: string;
	builtAt?: string;
};

async function readReleaseInfo(): Promise<ReleaseInfo> {
	try {
		const contents = await readFile(join(process.cwd(), 'release.json'), 'utf8');
		return JSON.parse(contents) as ReleaseInfo;
	} catch {
		return {};
	}
}

export const GET: RequestHandler = async () => {
	const [release, authoring] = await Promise.all([readReleaseInfo(), authoringHealth()]);
	/* 503 when this release cannot serve authoring, so deploy checks and monitors fail closed. */
	return json(
		{
			ok: authoring.ok,
			service: 'studio',
			revision: release.revision ?? process.env.STUDIO_BUILD_SHA ?? 'unknown',
			builtAt: release.builtAt ?? null,
			store: authoring.store,
			...(authoring.schema ? { schema: authoring.schema, migrations: authoring.migrations } : {})
		},
		{ status: authoring.ok ? 200 : 503, headers: { 'cache-control': 'no-store' } }
	);
};
