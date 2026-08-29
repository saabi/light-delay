import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data');
const OUTPUT = join(ROOT, 'docs', 'PENDING_AUTHOR_NOTES.md');
const checkOnly = process.argv.includes('--check');
const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

function filesUnder(path) {
	const output = [];
	for (const name of readdirSync(path)) {
		const child = join(path, name);
		if (statSync(child).isDirectory()) output.push(...filesUnder(child));
		else if (name.endsWith('.json') && !child.includes(`${join('data', 'schemas')}`)) output.push(child);
	}
	return output;
}

function sourceText(value) {
	if (typeof value === 'string') return value;
	return value?.es ?? value?.en ?? '';
}

const notes = [];
function visit(value, file, path = '$') {
	if (Array.isArray(value)) {
		value.forEach((child, index) => visit(child, file, `${path}[${index}]`));
		return;
	}
	if (!value || typeof value !== 'object') return;
	if (Array.isArray(value.notes)) {
		value.notes.forEach((note, index) => {
			const status = note.status ?? (note.resolved === true ? 'resolved' : 'open');
			if (status === 'resolved' || status === 'wont_fix') return;
			notes.push({
				id: note.id ?? `${relative(ROOT, file).replaceAll('\\', '/')}:${path}.notes[${index}]`,
				type: note.type,
				priority: note.priority ?? 'medium',
				status,
				text: sourceText(note.text),
				action: sourceText(note.suggestedAction),
				acceptance: sourceText(note.acceptanceCriteria),
				file: relative(ROOT, file).replaceAll('\\', '/'),
				path: `${path}.notes[${index}]`
			});
		});
	}
	for (const [key, child] of Object.entries(value)) {
		if (key !== 'notes') visit(child, file, `${path}.${key}`);
	}
}

for (const file of filesUnder(DATA)) visit(JSON.parse(readFileSync(file, 'utf8')), file);
notes.sort(
	(a, b) =>
		(priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2) ||
		a.file.localeCompare(b.file) ||
		a.path.localeCompare(b.path)
);
const lines = [
	'# Notas de autor pendientes',
	'',
	'> Archivo generado por `npm run notes:build`. Editar las notas en sus JSON de origen, no este informe.',
	'',
	`Pendientes: **${notes.length}**`,
	''
];
for (const priority of ['critical', 'high', 'medium', 'low']) {
	const group = notes.filter((note) => note.priority === priority);
	if (!group.length) continue;
	lines.push(`## ${priority}`, '');
	for (const note of group) {
		lines.push(`- **${note.id}** [${note.type} · ${note.status}] — ${note.text}`);
		lines.push(`  - Origen: \`${note.file}\` · \`${note.path}\``);
		if (note.action) lines.push(`  - Acción: ${note.action}`);
		if (note.acceptance) lines.push(`  - Aceptación: ${note.acceptance}`);
	}
	lines.push('');
}
const output = `${lines.join('\n')}\n`;
if (checkOnly) {
	if (!existsSync(OUTPUT) || readFileSync(OUTPUT, 'utf8') !== output) {
		throw new Error('docs/PENDING_AUTHOR_NOTES.md is stale; run npm run notes:build');
	}
} else writeFileSync(OUTPUT, output, 'utf8');
console.log(`notes:${checkOnly ? 'check' : 'build'} OK pending=${notes.length}`);
