import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { classifyInventory } from './lib/editorial-lifecycle.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (path) => JSON.parse(readFileSync(join(ROOT, path), 'utf8'));
const { lifecycle, inventory, classified, duplicates, explicit } = classifyInventory(ROOT);
const errors = [];
const authority = lifecycle.authority;
const requiredGateIds = [
	'master_outline_complete',
	'salvage_review_complete',
	'replacement_derivatives_approved',
	'no_active_dependants'
];
if (inventory.project.canonicalScriptId !== authority.scriptId)
	errors.push('canonicalScriptId must point to the master authority stub');
if (inventory.project.narrativeAuthority?.outlineId !== authority.outlineId)
	errors.push('project narrativeAuthority outline mismatch');
if (inventory.project.narrativeAuthority?.scriptId !== authority.scriptId)
	errors.push('project narrativeAuthority script mismatch');
if (duplicates.length) errors.push(`duplicate lifecycle refs: ${duplicates.join(', ')}`);
if (new Set(lifecycle.deletionGates.map((gate) => gate.id)).size !== requiredGateIds.length) {
	errors.push('lifecycle must declare each deletion gate exactly once');
}
if (
	authority.status === 'wip_authoritative' &&
	lifecycle.deletionGates.find((gate) => gate.id === 'master_outline_complete')?.status !== 'open'
) {
	errors.push('master_outline_complete gate must remain open while authority is WIP');
}
for (const scriptId of [
	'script:light-delay-main-short',
	'script:light-delay-festival',
	'script:light-delay-trailer',
	'script:light-delay-long'
]) {
	const slug = scriptId.replace('script:', '');
	const entry = inventory.project.scripts.find((item) => item.id === scriptId);
	if (entry?.status !== 'deprecated')
		errors.push(`${scriptId}: registry status must be deprecated`);
	if (readJson(`data/scripts/${slug}.json`).script.status !== 'deprecated')
		errors.push(`${scriptId}: ScriptFile status must be deprecated`);
	if (readJson(`data/outlines/${slug}.json`).outline.status !== 'deprecated')
		errors.push(`${scriptId}: outline status must be deprecated`);
	if (readJson(`data/production/plans/${slug}.json`).plan.status !== 'obsolete')
		errors.push(`${scriptId}: generation plan status must be obsolete`);
	if (readJson(`data/continuity/${slug}.json`).ledger.status !== 'obsolete')
		errors.push(`${scriptId}: continuity ledger status must be obsolete`);
	const status = explicit('script', scriptId)?.status;
	if (status !== 'deprecated') errors.push(`${scriptId}: lifecycle status must be deprecated`);
}
for (const entry of inventory.project.scripts.filter((item) => item.status !== 'deprecated')) {
	const slug = entry.id.replace('script:', '');
	const script = readJson(`data/scripts/${slug}.json`);
	for (const scene of script.scenes ?? []) {
		for (const locationId of [scene.locationId, ...(scene.secondaryLocationIds ?? [])].filter(
			Boolean
		)) {
			if (explicit('entity', locationId)?.status === 'obsolete') {
				errors.push(
					`${entry.id}: active scene ${scene.id} references obsolete location ${locationId}`
				);
			}
		}
	}
}
for (const record of classified) {
	if (!record.lifecycle?.status || !record.lifecycle?.relevance || !record.lifecycle?.disposition) {
		errors.push(`${record.kind}:${record.id}: missing derived lifecycle classification`);
	}
	if (
		record.lifecycle.disposition === 'delete_after_gates' &&
		lifecycle.deletionGates.length !== 4
	) {
		errors.push(`${record.kind}:${record.id}: deletion candidate lacks complete global gates`);
	}
}
if (errors.length) {
	console.error('validate:lifecycle FAILED');
	for (const error of errors) console.error(' -', error);
	process.exit(1);
}
const counts = Object.fromEntries(
	['active', 'review_required', 'deprecated', 'obsolete'].map((status) => [
		status,
		classified.filter((item) => item.lifecycle.status === status).length
	])
);
console.log(`validate:lifecycle OK ${JSON.stringify(counts)}`);
