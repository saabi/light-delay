import type { ValidationResult } from '$lib/types/common';
import type { OutlineCoverageEvidence, OutlineFile, OutlineStep } from '$lib/types/outline';
import type { ScriptFile } from '$lib/types/script';
import type { ComparisonTaxonomyFile } from '$lib/types/comparison';
import type { ScriptId } from '$lib/types/ids';
import { sourceStoryText } from './localizedString.ts';

const IMPORTANCE = new Set(['required', 'optional']);
const LEVELS = new Set(['story', 'detail']);
const RELATIONS = new Set(['enables', 'motivates', 'reveals', 'forces', 'prevents', 'pays_off']);
const COVERAGE = new Set(['not_started', 'partial', 'covered', 'deferred', 'not_applicable']);
const FILE_STATUS = new Set(['draft', 'reviewed', 'locked']);

export function validateOutline(
	file: OutlineFile,
	options: {
		registeredScriptIds: ReadonlySet<ScriptId>;
		script?: ScriptFile;
		taxonomy?: ComparisonTaxonomyFile;
	}
): ValidationResult {
	const errors: string[] = [];
	if (!file || typeof file !== 'object') return { ok: false, errors: ['outline: missing file'] };
	if (!file.schemaVersion) errors.push('outline: missing schemaVersion');
	if (!file.outline) return { ok: false, errors: [...errors, 'outline: missing outline object'] };
	const meta = file.outline;
	const label = `outline(${meta.id || meta.scriptId || '?'})`;
	if (!meta.id) errors.push(`${label}: missing id`);
	if (!meta.scriptId) errors.push(`${label}: missing scriptId`);
	else if (!options.registeredScriptIds.has(meta.scriptId))
		errors.push(`${label}: unknown scriptId ${meta.scriptId}`);
	if (!sourceStoryText(meta.title)?.trim()) errors.push(`${label}: missing title`);
	if (!sourceStoryText(meta.synopsis)?.trim()) errors.push(`${label}: missing synopsis`);
	if (!meta.version) errors.push(`${label}: missing version`);
	if (!FILE_STATUS.has(meta.status)) errors.push(`${label}: invalid status ${meta.status}`);
	if (!Array.isArray(file.steps))
		return { ok: false, errors: [...errors, `${label}: steps must be an array`] };

	const stepIds = new Set<string>();
	const orders = new Map<string, Set<number>>();
	const sceneIds = new Set(options.script?.scenes.map((s) => s.id) ?? []);
	const beatIds = new Set(options.script?.beats.map((b) => b.id) ?? []);
	const cueIds = new Set(options.script?.cues.map((c) => c.id) ?? []);
	const shotIds = new Set(options.script?.shots.map((s) => s.id) ?? []);
	const refs = { sceneIds, beatIds, cueIds, shotIds };
	const eventIds = new Set(options.taxonomy?.majorEvents.map((e) => e.id) ?? []);
	for (const step of file.steps) {
		const stepLabel = `${label}.step(${step?.id || '?'})`;
		if (!step?.id) {
			errors.push(`${stepLabel}: missing id`);
			continue;
		}
		if (stepIds.has(step.id)) errors.push(`${label}: duplicate step id ${step.id}`);
		stepIds.add(step.id);
		if (!LEVELS.has(step.level)) errors.push(`${stepLabel}: invalid level ${step.level}`);
		if (typeof step.order !== 'number' || !Number.isFinite(step.order))
			errors.push(`${stepLabel}: order must be a number`);
		else {
			const set = orders.get(step.level) ?? new Set<number>();
			if (set.has(step.order))
				errors.push(`${stepLabel}: duplicate ${step.level} order ${step.order}`);
			set.add(step.order);
			orders.set(step.level, set);
		}
		if (!sourceStoryText(step.title)?.trim()) errors.push(`${stepLabel}: missing title`);
		if (!sourceStoryText(step.summary)?.trim()) errors.push(`${stepLabel}: missing summary`);
		if (!IMPORTANCE.has(step.importance))
			errors.push(`${stepLabel}: invalid importance ${step.importance}`);
		if (step.majorEventId && options.taxonomy && !eventIds.has(step.majorEventId))
			errors.push(`${stepLabel}: unknown majorEventId ${step.majorEventId}`);
		if (options.script) validateRefs(stepLabel, step, refs, errors);
		for (const [target, evidence] of Object.entries(step.coverage ?? {}))
			validateEvidence(stepLabel, target, evidence, refs, errors);
	}
	const byId = new Map(file.steps.map((step) => [step.id, step]));
	for (const step of file.steps) {
		const stepLabel = `${label}.step(${step.id})`;
		if (step.level === 'detail' && !step.parentStepId)
			errors.push(`${stepLabel}: detail step requires parentStepId`);
		if (step.level === 'story' && step.parentStepId)
			errors.push(`${stepLabel}: story step cannot have parentStepId`);
		if (step.parentStepId) {
			const parent = byId.get(step.parentStepId);
			if (!parent) errors.push(`${stepLabel}: unknown parentStepId ${step.parentStepId}`);
			else if (parent.level !== 'story')
				errors.push(`${stepLabel}: parentStepId must reference a story step`);
		}
		for (const link of step.causalLinks ?? []) {
			const source = byId.get(link.sourceStepId);
			if (!source) errors.push(`${stepLabel}: unknown causal source ${link.sourceStepId}`);
			else {
				if (source.id === step.id) errors.push(`${stepLabel}: causal link cannot reference itself`);
				if (source.level !== step.level)
					errors.push(`${stepLabel}: causal links must connect steps at the same level`);
				if (source.order >= step.order)
					errors.push(`${stepLabel}: causal source must precede its consequence`);
			}
			if (!RELATIONS.has(link.relation))
				errors.push(`${stepLabel}: invalid causal relation ${link.relation}`);
			if (!sourceStoryText(link.explanation)?.trim())
				errors.push(`${stepLabel}: causal link requires explanation`);
		}
		for (const depId of step.dependsOnStepIds ?? [])
			if (!stepIds.has(depId) || depId === step.id)
				errors.push(`${stepLabel}: invalid legacy dependsOnStepId ${depId}`);
	}
	return { ok: errors.length === 0, errors };
}

type Refs = {
	sceneIds: Set<string>;
	beatIds: Set<string>;
	cueIds: Set<string>;
	shotIds: Set<string>;
};
function validateRefs(
	label: string,
	value: Partial<OutlineStep | OutlineCoverageEvidence>,
	refs: Refs,
	errors: string[]
) {
	for (const key of ['sceneIds', 'beatIds', 'cueIds', 'shotIds'] as const)
		for (const id of value[key] ?? [])
			if (!refs[key].has(id)) errors.push(`${label}: unknown ${key.slice(0, -1)} ${id}`);
}
function validateEvidence(
	label: string,
	target: string,
	evidence: OutlineCoverageEvidence,
	refs: Refs,
	errors: string[]
) {
	if (!['treatment', 'script', 'animatic'].includes(target))
		errors.push(`${label}: invalid coverage target ${target}`);
	if (!evidence || !COVERAGE.has(evidence.status)) {
		errors.push(`${label}: invalid ${target} coverage status ${evidence?.status}`);
		return;
	}
	validateRefs(`${label}.coverage.${target}`, evidence, refs, errors);
	if (evidence.status === 'covered') {
		const narrative = Boolean(
			evidence.sourceRefs?.length ||
			evidence.sceneIds?.length ||
			evidence.beatIds?.length ||
			evidence.cueIds?.length
		);
		if (target === 'animatic' ? !evidence.shotIds?.length : !narrative)
			errors.push(`${label}: covered ${target} requires evidence`);
	}
}
