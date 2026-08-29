import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let failed = false;
for (const name of readdirSync(join(ROOT, 'data', 'continuity')).filter((name) => name.endsWith('.json'))) {
	const ledger = JSON.parse(readFileSync(join(ROOT, 'data', 'continuity', name), 'utf8'));
	const script = JSON.parse(readFileSync(join(ROOT, 'data', 'scripts', name), 'utf8'));
	const outline = JSON.parse(readFileSync(join(ROOT, 'data', 'outlines', name), 'utf8'));
	const factIds = new Set(ledger.facts.map((fact) => fact.id));
	const available = new Set();
	const knowledge = new Map();
	const stepsById = new Map(ledger.steps.map((step) => [step.id, step]));
	const outlineIds = new Set(outline.steps.map((step) => step.id));
	const shotIds = new Set(script.shots.map((shot) => shot.id));
	const errors = [];
	for (const step of [...ledger.steps].sort((a, b) => a.order - b.order)) {
		for (const id of [...step.requiresFactIds, ...step.revealsFactIds]) if (!factIds.has(id)) errors.push(`${step.id}: unknown fact ${id}`);
		for (const id of step.requiresFactIds) if (!available.has(id)) errors.push(`${step.id}: requires unavailable fact ${id}`);
		for (const id of step.outlineStepIds) if (!outlineIds.has(id)) errors.push(`${step.id}: unknown outline step ${id}`);
		for (const id of step.shotIds ?? []) if (!shotIds.has(id)) errors.push(`${step.id}: unknown shot ${id}`);
		for (const id of step.revealsFactIds) available.add(id);
	}
	for (const event of ledger.knowledgeEvents) {
		if (!stepsById.has(event.stepId)) errors.push(`knowledge event: unknown step ${event.stepId}`);
		if (!factIds.has(event.factId)) errors.push(`knowledge event: unknown fact ${event.factId}`);
		for (const characterId of event.characterIds) {
			const key = `${characterId}|${event.factId}`;
			const previous = knowledge.get(key);
			const order = stepsById.get(event.stepId)?.order;
			if (order != null && (previous == null || order < previous)) knowledge.set(key, order);
		}
	}
	for (const requirement of ledger.actionRequirements) {
		const actionStep = stepsById.get(requirement.stepId);
		if (!actionStep) {
			errors.push(`action by ${requirement.actorId}: unknown step ${requirement.stepId}`);
			continue;
		}
		for (const factId of requirement.requiresKnownFactIds) {
			if (!factIds.has(factId)) errors.push(`${requirement.stepId}: action requires unknown fact ${factId}`);
			const learnedAt = knowledge.get(`${requirement.actorId}|${factId}`);
			if (learnedAt == null || learnedAt > actionStep.order) {
				errors.push(`${requirement.stepId}: ${requirement.actorId} acts without knowing ${factId}`);
			}
		}
	}
	const applicable = ledger.ledger.status !== 'incomplete';
	const state = errors.length ? 'debt' : applicable ? 'complete' : 'not_applicable';
	console.log(`${ledger.ledger.scriptId}: ${state}; steps=${ledger.steps.length}; actions=${ledger.actionRequirements.length}; errors=${errors.length}`);
	for (const error of errors) console.log(`  - ${error}`);
	if (errors.length) failed = true;
}
if (failed) process.exitCode = 1;
