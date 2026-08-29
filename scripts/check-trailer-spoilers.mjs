import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findTrailerSpoilers } from './lib/trailer-spoilers.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const paths = [
	join(root, 'data', 'scripts', 'light-delay-trailer.json'),
	join(root, 'data', 'outlines', 'light-delay-trailer.json')
];
const hits = findTrailerSpoilers(...paths.map((path) => JSON.parse(readFileSync(path, 'utf8'))));

if (hits.length) {
	console.error(`check:trailer-spoilers FAILED (${hits.length})`);
	for (const hit of hits) {
		console.error(` - ${paths[hit.documentIndex]} ${hit.path} [${hit.ruleId}]: ${hit.text}`);
	}
	process.exitCode = 1;
} else {
	console.log('check:trailer-spoilers OK');
}
