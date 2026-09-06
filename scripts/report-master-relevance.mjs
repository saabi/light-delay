import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyInventory } from './lib/editorial-lifecycle.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = join(ROOT, 'docs/MASTER_RELEVANCE_REPORT.md');
const { lifecycle, classified } = classifyInventory(ROOT);
const order = ['active', 'review_required', 'deprecated', 'obsolete'];
const labels = {
	active: 'Vigente o compatible',
	review_required: 'Revisión requerida',
	deprecated: 'Deprecado para rescate',
	obsolete: 'Obsoleto'
};
const lines = [
	'<!-- GENERADO por scripts/report-master-relevance.mjs. NO EDITAR. -->',
	'',
	'# Relevancia respecto de la escaleta maestra',
	'',
	`Autoridad: \`${lifecycle.authority.outlineId}\` (${lifecycle.authority.status}).`,
	'',
	'Los elementos inciertos se conservan. Ningún candidato puede borrarse hasta cerrar todos los gates globales.',
	'',
	`Gates: ${lifecycle.deletionGates.map((item) => `\`${item.id}\` (${item.status})`).join(', ')}.`,
	''
];
for (const status of order) {
	const records = classified.filter((item) => item.lifecycle.status === status);
	lines.push(`## ${labels[status]} (${records.length})`, '', '| Tipo | ID | Base | Disposición |', '| --- | --- | --- | --- |');
	for (const record of records.sort((a, b) => `${a.kind}:${a.id}`.localeCompare(`${b.kind}:${b.id}`))) {
		lines.push(`| ${record.kind} | \`${record.id}\` | ${record.lifecycle.basis} | ${record.lifecycle.disposition} |`);
	}
	lines.push('');
}
const expected = `${lines.join('\n').trim()}\n`;
if (process.argv.includes('--check')) {
	if (!existsSync(OUTPUT) || readFileSync(OUTPUT, 'utf8').replaceAll('\r\n', '\n') !== expected) {
		throw new Error('docs/MASTER_RELEVANCE_REPORT.md is stale; run npm run report:master-relevance');
	}
	console.log(`master-relevance: current (${classified.length} records)`);
} else {
	writeFileSync(OUTPUT, expected, 'utf8');
	console.log(`master-relevance: wrote ${classified.length} classified records`);
}
