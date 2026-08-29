import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

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
for (const binding of manifest.bindings) {
	const schema = JSON.parse(readFileSync(join(SCHEMAS, binding.schema), 'utf8'));
	const validate = ajv.getSchema(schema.$id);
	const files = [
		...(binding.files ?? []).map((path) => join(DATA, path)),
		...(binding.directories ?? []).flatMap((path) => jsonFiles(join(DATA, path)))
	];
	for (const file of files) {
		checked += 1;
		const valid = validate(JSON.parse(readFileSync(file, 'utf8')));
		if (!valid) {
			for (const error of validate.errors ?? []) {
				errors.push(`${relative(ROOT, file)}${error.instancePath || '/'} ${error.message}`);
			}
		}
	}
}

if (errors.length) throw new Error(`JSON Schema validation failed:\n${errors.join('\n')}`);
console.log(`validate:schemas OK files=${checked}`);
