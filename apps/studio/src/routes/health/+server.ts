import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

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
	const release = await readReleaseInfo();
	return json({
		ok: true,
		service: 'studio',
		revision: release.revision ?? process.env.STUDIO_BUILD_SHA ?? 'unknown',
		builtAt: release.builtAt ?? null
	});
};
