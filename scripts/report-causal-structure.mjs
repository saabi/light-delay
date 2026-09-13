/**
 * Master causal structure + Festival-master cut bindings.
 * Package: npm run report:causal-structure
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = (rel) => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));

/**
 * Validate master outline causal objects.
 * @param {any} master
 */
export function validateMasterCausalStructure(master) {
	const errors = [];
	const facts = (master.facts || []).filter((f) => f.status !== 'retired');
	const factById = new Map(facts.map((f) => [f.id, f]));
	const steps = [...(master.steps || [])]
		.filter((s) => s.level === 'story')
		.sort((a, b) => a.order - b.order);
	const stepById = new Map(steps.map((s) => [s.id, s]));
	const available = new Set();

	for (const fact of facts) {
		if (fact.introducedInStepId && !stepById.has(fact.introducedInStepId)) {
			errors.push(`${fact.id}: unknown introducedInStepId ${fact.introducedInStepId}`);
		}
		for (const dep of fact.dependsOnFactIds || []) {
			if (!factById.has(dep)) errors.push(`${fact.id}: unknown dependsOnFactIds ${dep}`);
		}
	}

	const visiting = new Set();
	const visited = new Set();
	const visit = (id, stack) => {
		if (visited.has(id)) return;
		if (visiting.has(id)) {
			errors.push(`fact dependency cycle involving ${[...stack, id].join(' → ')}`);
			return;
		}
		visiting.add(id);
		for (const dep of factById.get(id)?.dependsOnFactIds || []) visit(dep, [...stack, id]);
		visiting.delete(id);
		visited.add(id);
	};
	for (const fact of facts) visit(fact.id, []);

	for (const step of steps) {
		for (const id of [...(step.requiresFactIds || []), ...(step.revealsFactIds || [])]) {
			if (!factById.has(id)) errors.push(`${step.id}: unknown fact ${id}`);
		}
		for (const id of step.requiresFactIds || []) {
			if (!available.has(id)) errors.push(`${step.id}: requires unavailable fact ${id}`);
		}
		for (const id of step.revealsFactIds || []) available.add(id);
	}

	for (const fact of facts) {
		const intro = stepById.get(fact.introducedInStepId);
		if (!intro) continue;
		for (const dep of fact.dependsOnFactIds || []) {
			const depFact = factById.get(dep);
			const depIntro = stepById.get(depFact?.introducedInStepId);
			if (depIntro && depIntro.order >= intro.order) {
				errors.push(`${fact.id}: depends on ${dep} introduced at same/later step order`);
			}
		}
	}

	const knowledge = new Map();
	for (const event of master.knowledgeEvents || []) {
		if (!stepById.has(event.stepId)) errors.push(`knowledge event: unknown step ${event.stepId}`);
		if (!factById.has(event.factId)) {
			errors.push(`knowledge event: unknown fact ${event.factId}`);
		}
		const order = stepById.get(event.stepId)?.order;
		for (const characterId of event.characterIds || []) {
			const key = `${characterId}|${event.factId}`;
			const previous = knowledge.get(key);
			if (order != null && (previous == null || order < previous)) knowledge.set(key, order);
		}
	}

	for (const requirement of master.actionRequirements || []) {
		const actionStep = stepById.get(requirement.stepId);
		if (!actionStep) {
			errors.push(`action by ${requirement.actorId}: unknown step ${requirement.stepId}`);
			continue;
		}
		for (const factId of requirement.requiresKnownFactIds || []) {
			if (!factById.has(factId)) errors.push(`${requirement.stepId}: action requires unknown fact ${factId}`);
			const learnedAt = knowledge.get(`${requirement.actorId}|${factId}`);
			if (learnedAt == null || learnedAt > actionStep.order) {
				errors.push(`${requirement.stepId}: ${requirement.actorId} acts without knowing ${factId}`);
			}
		}
	}

	return { errors, factCount: facts.length, knowledgeEvents: (master.knowledgeEvents || []).length };
}

/**
 * @param {any} master
 * @param {any} festOutline
 * @param {any} script
 * @param {{ omissions?: string[], ledger?: any }} opts
 */
export function validateFestivalMasterBindings(master, festOutline, script, opts = {}) {
	const errors = [];
	const omissions = new Set(opts.omissions || []);
	const activeFacts = (master.facts || []).filter((f) => f.status === 'active');
	const factById = new Map(activeFacts.map((f) => [f.id, f]));
	const festStories = (festOutline.steps || []).filter((s) => s.level === 'story');
	const coveredMasterSteps = new Set();
	for (const story of festStories) {
		for (const ref of story.sourceRefs || []) {
			if (ref.kind === 'outline' && ref.outlineId === 'outline:light-delay-master-narrative') {
				coveredMasterSteps.add(ref.stepId);
			}
		}
	}

	const requiredFacts = activeFacts.filter(
		(f) => f.introducedInStepId && coveredMasterSteps.has(f.introducedInStepId)
	);

	const implemented = new Map();
	for (const cue of script.cues || []) {
		for (const factId of cue.implementsFactIds || []) {
			if (!implemented.has(factId)) implemented.set(factId, []);
			implemented.get(factId).push(cue.id);
		}
	}

	for (const fact of requiredFacts) {
		if (omissions.has(fact.id)) continue;
		if (!implemented.has(fact.id)) {
			errors.push(`missing implementation for ${fact.id} (intro ${fact.introducedInStepId})`);
		}
	}

	const cueIndex = new Map((script.cues || []).map((c, i) => [c.id, i]));
	const cueById = new Map((script.cues || []).map((c) => [c.id, c]));

	for (const fact of activeFacts) {
		const cues = implemented.get(fact.id) || [];
		for (const dep of fact.dependsOnFactIds || []) {
			const depCues = implemented.get(dep) || [];
			if (!cues.length || !depCues.length) continue;
			// Fact's earliest binding must strictly follow dependency's earliest binding.
			const minFact = Math.min(...cues.map((id) => cueIndex.get(id) ?? Infinity));
			const minDep = Math.min(...depCues.map((id) => cueIndex.get(id) ?? Infinity));
			if (!(minFact > minDep)) {
				errors.push(`${fact.id} implemented at/before dependency ${dep} in cue order`);
			}
		}

		if (fact.audienceVisibility === 'withheld') {
			const onlyDialogue = cues.length > 0 && cues.every((id) => cueById.get(id)?.type === 'dialogue');
			if (onlyDialogue) {
				errors.push(`${fact.id}: withheld fact implemented only by dialogue cue(s)`);
			}
		}
	}

	if (opts.ledger) {
		const status = opts.ledger.ledger?.status;
		if (status !== 'obsolete' && status !== 'deprecated') {
			errors.push(
				`Festival continuity ledger status is ${status}; must be obsolete/deprecated (master outline owns facts)`
			);
		}
	}

	return { errors, requiredFacts: requiredFacts.length, implementedFacts: implemented.size };
}

function main() {
	const master = load('data/outlines/light-delay-master-narrative.json');
	const festOutline = load('data/outlines/light-delay-festival-master.json');
	const script = load('data/scripts/light-delay-festival-master.json');
	const ledgerPath = join(ROOT, 'data/continuity/light-delay-festival-master.json');
	const ledger = existsSync(ledgerPath) ? load('data/continuity/light-delay-festival-master.json') : null;

	const masterResult = validateMasterCausalStructure(master);
	const cutResult = validateFestivalMasterBindings(master, festOutline, script, { ledger });

	const errors = [...masterResult.errors, ...cutResult.errors];
	const state = errors.length ? 'debt' : 'complete';
	console.log(
		`master+festival-master: ${state}; facts=${masterResult.factCount}; knowledgeEvents=${masterResult.knowledgeEvents}; requiredCutFacts=${cutResult.requiredFacts}; implemented=${cutResult.implementedFacts}; errors=${errors.length}`
	);
	for (const error of errors) console.log(`  - ${error}`);
	if (errors.length) process.exitCode = 1;
}

const isMain =
	process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMain) main();
