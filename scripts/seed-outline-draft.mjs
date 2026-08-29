import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name) => {
	const inline = process.argv.find((v) => v.startsWith(`${name}=`));
	if (inline) return inline.slice(name.length + 1);
	const i = process.argv.indexOf(name);
	return i >= 0 ? process.argv[i + 1] : undefined;
};
const scriptArg = arg('--script'),
	outputArg = arg('--output');
if (!scriptArg || !outputArg)
	throw new Error('Usage: npm run seed:outline -- --script <slug> --output <draft-path>');
const slug = scriptArg.replace(/^script:/, '');
const output = resolve(root, outputArg);
const canonical = resolve(root, 'data', 'outlines');
if (relative(canonical, output).split(/[\\/]/)[0] !== '..')
	throw new Error(
		'Refusing to write a draft inside data/outlines; canonical outlines are human-authored.'
	);
if (existsSync(output)) throw new Error(`Refusing to overwrite ${output}`);
const script = JSON.parse(readFileSync(join(root, 'data', 'scripts', `${slug}.json`), 'utf8'));
const prefix = script.script.id.replace(/^script:light-delay-/, '').replace(/-short$/, '');
const localized = (es, en) => ({ es, en });
const draft = {
	schemaVersion: '1.2.0',
	outline: {
		id: `outline:${slug}-draft`,
		scriptId: script.script.id,
		title: localized(
			`Borrador de escaleta — ${script.script.title.es}`,
			`Outline draft — ${script.script.title.en}`
		),
		synopsis: localized(
			'REEMPLAZAR: contar el conflicto, la cadena causal y la resolución.',
			'REPLACE: state the conflict, causal chain, and resolution.'
		),
		status: 'draft',
		version: '0.0.0'
	},
	steps: script.scenes.map((scene, index) => ({
		id: `${prefix}:draft-story-${String(index + 1).padStart(2, '0')}`,
		level: 'story',
		order: index + 1,
		title: scene.title,
		summary: localized(
			'REEMPLAZAR: explicar qué cambia y por qué importa.',
			'REPLACE: explain what changes and why it matters.'
		),
		importance: 'required'
	}))
};
writeFileSync(output, `${JSON.stringify(draft, null, 2)}\n`, 'utf8');
console.log(`wrote non-canonical draft ${output}`);
