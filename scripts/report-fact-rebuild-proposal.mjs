/**
 * Assisted proposal after master outline prose edits: orphan facts, steps without reveals,
 * knowledge/action rows pointing at missing steps/facts.
 * Does not write the outline — agents apply with stable-ID rules after author review.
 *
 * Package: npm run report:fact-rebuild-proposal
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const master = JSON.parse(
	readFileSync(join(ROOT, 'data/outlines/light-delay-master-narrative.json'), 'utf8')
);

const stories = [...(master.steps || [])]
	.filter((s) => s.level === 'story')
	.sort((a, b) => a.order - b.order);
const storyIds = new Set(stories.map((s) => s.id));
const facts = master.facts || [];
const active = facts.filter((f) => f.status === 'active');
const factIds = new Set(active.map((f) => f.id));

const revealed = new Set();
for (const step of stories) {
	for (const id of step.revealsFactIds || []) revealed.add(id);
}

const proposals = [];

for (const fact of active) {
	if (fact.introducedInStepId && !storyIds.has(fact.introducedInStepId)) {
		proposals.push({
			kind: 'orphan_intro_step',
			factId: fact.id,
			detail: `introducedInStepId ${fact.introducedInStepId} missing from story steps`
		});
	}
	if (fact.introducedInStepId && !revealed.has(fact.id)) {
		const step = stories.find((s) => s.id === fact.introducedInStepId);
		if (step && !(step.revealsFactIds || []).includes(fact.id)) {
			proposals.push({
				kind: 'step_missing_reveal',
				factId: fact.id,
				stepId: fact.introducedInStepId,
				detail: 'active fact not listed in introduced step revealsFactIds'
			});
		}
	}
	for (const dep of fact.dependsOnFactIds || []) {
		if (!factIds.has(dep)) {
			proposals.push({
				kind: 'missing_dependency',
				factId: fact.id,
				detail: `dependsOnFactIds references unknown/retired ${dep}`
			});
		}
	}
}

for (const step of stories) {
	const hasReveal = (step.revealsFactIds || []).length > 0;
	const introduces = active.filter((f) => f.introducedInStepId === step.id);
	if (!hasReveal && introduces.length === 0) {
		proposals.push({
			kind: 'story_without_fact',
			stepId: step.id,
			detail: 'story step has no revealsFactIds and no fact introducedInStepId — ok if sparse by design'
		});
	}
}

for (const event of master.knowledgeEvents || []) {
	if (!storyIds.has(event.stepId)) {
		proposals.push({
			kind: 'knowledge_bad_step',
			detail: `knowledgeEvent stepId ${event.stepId} not a story step`,
			factId: event.factId
		});
	}
	if (!factIds.has(event.factId)) {
		proposals.push({
			kind: 'knowledge_bad_fact',
			detail: `knowledgeEvent factId ${event.factId} not active`,
			factId: event.factId
		});
	}
}

for (const req of master.actionRequirements || []) {
	if (!storyIds.has(req.stepId)) {
		proposals.push({
			kind: 'action_bad_step',
			detail: `actionRequirement stepId ${req.stepId} not a story step`,
			actorId: req.actorId
		});
	}
	for (const factId of req.requiresKnownFactIds || []) {
		if (!factIds.has(factId)) {
			proposals.push({
				kind: 'action_bad_fact',
				detail: `actionRequirement requires unknown ${factId}`,
				actorId: req.actorId,
				factId
			});
		}
	}
}

const report = {
	schemaHint: 'fact-rebuild-proposal/v1',
	masterRevision: master.outline?.revision,
	activeFacts: active.length,
	storySteps: stories.length,
	proposalCount: proposals.length,
	guidance: [
		'Mint new facts as master:fact-<kebab>; never reuse a retired id for new meaning.',
		'Update knowledgeEvents when who-learns-when changes; wrong beliefs are distinct facts.',
		'Update actionRequirements when an act needs prior knowledge.',
		'Propagate Festival (and later) cue implementsFactIds; never mint cut-local fact SoT ids.',
		'Author must sign off ID splits/merges before lock.'
	],
	proposals
};

console.log(JSON.stringify(report, null, 2));
console.log(`fact-rebuild-proposal: proposals=${proposals.length}`);
