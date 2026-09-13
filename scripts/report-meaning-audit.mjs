/**
 * Meaning-audit packet for a master-derived cut (default: Festival-master).
 * Deterministic structure must already be green (`report:causal-structure`).
 * This packet feeds agent/LLM meaning review — it does not re-prove the graph.
 *
 * Package: npm run report:meaning-audit [-- --script <slug>]
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = (rel) => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));

function parseArgs(argv) {
	const out = { script: 'light-delay-festival-master' };
	for (let i = 0; i < argv.length; i += 1) {
		if (argv[i] === '--script' && argv[i + 1]) {
			out.script = argv[++i];
		}
	}
	return out;
}

function cueText(cue) {
	if (!cue) return null;
	if (cue.type === 'dialogue') {
		const en = cue.content?.variants?.en?.spokenText ?? cue.text;
		return { type: cue.type, speakerId: cue.speakerId, text: en ?? null };
	}
	if (typeof cue.text === 'string') return { type: cue.type, text: cue.text };
	if (cue.text?.en) return { type: cue.type, text: cue.text.en };
	if (cue.description?.en) return { type: cue.type, text: cue.description.en };
	return { type: cue.type, text: null };
}

function buildBeliefAtStep(master, stepOrder) {
	/** @type {Map<string, Set<string>>} factId -> characterIds who know by this order */
	const known = new Map();
	const stepById = new Map(
		(master.steps || []).filter((s) => s.level === 'story').map((s) => [s.id, s])
	);
	for (const event of master.knowledgeEvents || []) {
		const order = stepById.get(event.stepId)?.order;
		if (order == null || order > stepOrder) continue;
		if (!known.has(event.factId)) known.set(event.factId, new Set());
		for (const characterId of event.characterIds || []) known.get(event.factId).add(characterId);
	}
	return Object.fromEntries([...known.entries()].map(([factId, set]) => [factId, [...set].sort()]));
}

function main() {
	const { script: slug } = parseArgs(process.argv.slice(2));
	const master = load('data/outlines/light-delay-master-narrative.json');
	const outlinePath = join(ROOT, `data/outlines/${slug}.json`);
	const scriptPath = join(ROOT, `data/scripts/${slug}.json`);
	if (!existsSync(outlinePath) || !existsSync(scriptPath)) {
		console.error(`meaning-audit: missing outline or script for ${slug}`);
		process.exitCode = 1;
		return;
	}
	const outline = load(`data/outlines/${slug}.json`);
	const script = load(`data/scripts/${slug}.json`);
	const activeFacts = (master.facts || []).filter((f) => f.status === 'active');
	const factById = new Map(activeFacts.map((f) => [f.id, f]));
	const stepById = new Map(
		(master.steps || []).filter((s) => s.level === 'story').map((s) => [s.id, s])
	);
	const cueById = new Map((script.cues || []).map((c) => [c.id, c]));
	const shotById = new Map((script.shots || []).map((s) => [s.id, s]));

	const packets = [];
	const flags = [];

	for (const fact of activeFacts) {
		const intro = stepById.get(fact.introducedInStepId);
		const implementingCues = (script.cues || []).filter((c) =>
			(c.implementsFactIds || []).includes(fact.id)
		);
		const beliefState = intro ? buildBeliefAtStep(master, intro.order) : {};
		const knowersOfFact = beliefState[fact.id] || [];
		const actionGates = (master.actionRequirements || []).filter((a) =>
			(a.requiresKnownFactIds || []).includes(fact.id)
		);

		const cuePayloads = implementingCues.map((cue) => {
			const placementShots = (script.shots || [])
				.filter((shot) =>
					(shot.takes || []).some((take) =>
						(take.cuePlacements || []).some((p) => p.cueId === cue.id)
					)
				)
				.map((shot) => shot.id);
			const prompts = [];
			for (const shotId of placementShots) {
				const shot = shotById.get(shotId);
				for (const take of shot?.takes || []) {
					const prompt = take.generation?.prompt;
					if (prompt) {
						prompts.push({
							shotId,
							takeId: take.id,
							prompt: typeof prompt === 'string' ? prompt : prompt.en || null,
							shotDescription: shot?.description?.en ?? shot?.description ?? null
						});
					}
				}
			}
			return {
				cueId: cue.id,
				...cueText(cue),
				shotIds: placementShots,
				prompts
			};
		});

		if (fact.audienceVisibility === 'withheld' && implementingCues.every((c) => c.type === 'dialogue')) {
			flags.push({
				kind: 'beliefState',
				severity: 'high',
				factId: fact.id,
				message: 'withheld fact bound only to dialogue cues — confirm silence/action staging'
			});
		}
		if (implementingCues.length === 0) {
			flags.push({
				kind: 'coverage',
				severity: 'medium',
				factId: fact.id,
				message: 'no cue implementsFactIds for this active fact (ok if cut omits deliberately)'
			});
		}

		packets.push({
			factId: fact.id,
			description: fact.description?.en ?? fact.description,
			dependsOnFactIds: fact.dependsOnFactIds || [],
			introducedInStepId: fact.introducedInStepId,
			audienceVisibility: fact.audienceVisibility || null,
			knowersAtIntroduction: knowersOfFact,
			beliefStateAtIntroduction: beliefState,
			actionRequirements: actionGates.map((a) => ({
				stepId: a.stepId,
				actorId: a.actorId,
				action: a.action?.en ?? a.action,
				requiresKnownFactIds: a.requiresKnownFactIds
			})),
			implementations: cuePayloads
		});
	}

	const report = {
		schemaHint: 'meaning-audit/v1',
		cut: {
			scriptId: script.script?.id ?? `script:${slug}`,
			outlineId: outline.outline?.id ?? `outline:${slug}`,
			sourceOutlineId: outline.outline?.derivation?.sourceOutlineId ?? null,
			sourceRevision: outline.outline?.derivation?.sourceRevision ?? null
		},
		master: {
			outlineId: master.outline?.id,
			revision: master.outline?.revision,
			factCount: activeFacts.length,
			knowledgeEventCount: (master.knowledgeEvents || []).length,
			actionRequirementCount: (master.actionRequirements || []).length
		},
		instructions: [
			'Do not re-prove the fact DAG; run report:causal-structure first.',
			'Judge whether cue wording, silence, and still prompts carry each fact’s meaning for the intended knowers.',
			'Use beliefStateAtIntroduction / knowersAtIntroduction from knowledgeEvents — not a single static knower list.',
			'Preserve deliberate cut omissions (especially trailer).',
			'Report structured findings; do not auto-rewrite dialogue or prompts.'
		],
		flags,
		facts: packets
	};

	console.log(JSON.stringify(report, null, 2));
	console.log(
		`meaning-audit: ${slug}; facts=${packets.length}; flags=${flags.length}; write stdout packet for agent review`
	);
}

main();
