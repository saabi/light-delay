import { json, type RequestHandler } from '@sveltejs/kit';
import { getAuthoringApplication, serverAuthoringContext } from '$lib/server/authoring';

const methods = new Set([
	'getProjectHead',
	'getRevision',
	'listHistory',
	'getDraft',
	'listDrafts',
	'getProposal',
	'listProposals',
	'getScreenplayView',
	'handle'
]);

export const POST: RequestHandler = async ({ request }) => {
	let input: { method?: string; args?: unknown[] };
	try {
		input = await request.json();
	} catch {
		return json({ message: 'Malformed authoring request' }, { status: 400 });
	}
	if (!input || !input.method || !methods.has(input.method) || !Array.isArray(input.args))
		return json({ message: 'Unsupported authoring request' }, { status: 400 });
	try {
		const app = await getAuthoringApplication();
		let result: unknown;
		switch (input.method) {
			case 'getProjectHead':
				result = await app.getProjectHead(input.args[0] as string);
				break;
			case 'getRevision':
				result = await app.getRevision(input.args[0] as string, input.args[1] as number);
				break;
			case 'listHistory':
				result = await app.listHistory(input.args[0] as string);
				break;
			case 'getDraft':
				result = await app.getDraft(input.args[0] as string, input.args[1] as string);
				break;
			case 'listDrafts':
				result = await app.listDrafts(input.args[0] as string);
				break;
			case 'getProposal':
				result = await app.getProposal(input.args[0] as string, input.args[1] as string);
				break;
			case 'listProposals':
				result = await app.listProposals(input.args[0] as string);
				break;
			case 'getScreenplayView':
				result = await app.getScreenplayView(
					input.args[0] as string,
					input.args[1] as never,
					input.args[2] as number | undefined
				);
				break;
			case 'handle':
				result = await app.handle(input.args[0], serverAuthoringContext);
				break;
		}
		return json(result ?? null);
	} catch (error) {
		const message =
			error instanceof Error && error.message.startsWith('DATABASE_URL is required')
				? error.message
				: 'Studio authoring is temporarily unavailable';
		return json({ message }, { status: 503 });
	}
};
