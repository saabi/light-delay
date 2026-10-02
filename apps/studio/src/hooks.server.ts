import type { Handle } from '@sveltejs/kit';
import { readabilityBootScript } from '$lib/readability';

/* Inline the readability boot script so stored preferences apply before the first paint. */
export const handle: Handle = ({ event, resolve }) =>
	resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%studio.readability%', readabilityBootScript)
	});
