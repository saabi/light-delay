import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import { assertSharedReferenceAlias } from './lib/visual-stretch-jobs.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data');
const SCHEMAS = join(DATA, 'schemas');
const manifest = JSON.parse(readFileSync(join(SCHEMAS, 'schema-manifest.json'), 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: true, validateFormats: false });

for (const name of readdirSync(SCHEMAS).filter((name) => name.endsWith('.schema.json'))) {
	ajv.addSchema(JSON.parse(readFileSync(join(SCHEMAS, name), 'utf8')));
}

function jsonFiles(directory) {
	return readdirSync(directory)
		.map((name) => join(directory, name))
		.filter((path) => statSync(path).isFile() && path.endsWith('.json'));
}

let checked = 0;
const errors = [];
// This pre-digest singleton Seedance result predates the visual-stretch run contract.
// Preserve and report it; require review if this exact exception changes.
const knownExceptions = new Map([
	[
		'data/production/runs/run-festival-master-shot-plan-077-rev-1-video-1-ready-results.json',
		"/ must have required property 'inputDigest'"
	]
]);
const observedKnownExceptions = new Set();
for (const binding of manifest.bindings) {
	const schema = JSON.parse(readFileSync(join(SCHEMAS, binding.schema), 'utf8'));
	const validate = ajv.getSchema(schema.$id);
	const files = [
		...(binding.files ?? []).map((path) => join(DATA, path)),
		...(binding.directories ?? []).flatMap((path) => jsonFiles(join(DATA, path)))
	];
	for (const file of files) {
		checked += 1;
		const data = JSON.parse(readFileSync(file, 'utf8'));
		const valid = validate(data);
		if (!valid) {
			for (const error of validate.errors ?? []) {
				const path = relative(ROOT, file).replaceAll(String.fromCharCode(92), '/');
				const detail = `${error.instancePath || '/'} ${error.message}`;
				if (knownExceptions.get(path) === detail) {
					observedKnownExceptions.add(path);
					console.warn(`KNOWN PROJECT-DATA SCHEMA EXCEPTION: ${path} ${detail}`);
				} else {
					errors.push(`${path}${detail}`);
				}
			}
		}
		if (binding.schema === 'generation-plan.schema.json') {
			for (const job of data.visualStretchJobs || []) {
				try {
					assertSharedReferenceAlias(job);
				} catch (err) {
					errors.push(
						`${relative(ROOT, file)} ${err instanceof Error ? err.message : String(err)}`
					);
				}
			}
		}
	}
}

for (const path of knownExceptions.keys()) {
	if (!observedKnownExceptions.has(path)) {
		errors.push(
			`Known schema exception changed or disappeared; review and remove its quarantine: ${path}`
		);
	}
}

if (errors.length) throw new Error(`JSON Schema validation failed:\n${errors.join('\n')}`);
console.log(`validate:schemas OK files=${checked}`);
