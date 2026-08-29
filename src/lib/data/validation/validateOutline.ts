import type { ValidationResult } from '$lib/types/common';
import type { OutlineFile } from '$lib/types/outline';
import type { ScriptFile } from '$lib/types/script';
import type { ComparisonTaxonomyFile } from '$lib/types/comparison';
import type { ScriptId } from '$lib/types/ids';

const IMPORTANCE = new Set(['required', 'optional']);
const STEP_STATUS = new Set(['planned', 'covered', 'missing', 'deferred']);
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
	if (!file || typeof file !== 'object') {
		return { ok: false, errors: ['outline: missing file'] };
	}
	if (!file.schemaVersion) errors.push('outline: missing schemaVersion');
	if (!file.outline) {
		errors.push('outline: missing outline object');
		return { ok: errors.length === 0, errors };
	}

	const meta = file.outline;
	const label = `outline(${meta.id || meta.scriptId || '?'})`;
	if (!meta.id) errors.push(`${label}: missing id`);
	if (!meta.scriptId) errors.push(`${label}: missing scriptId`);
	else if (!options.registeredScriptIds.has(meta.scriptId)) {
		errors.push(`${label}: unknown scriptId ${meta.scriptId}`);
	}
	if (!meta.title?.trim()) errors.push(`${label}: missing title`);
	if (!meta.version) errors.push(`${label}: missing version`);
	if (!FILE_STATUS.has(meta.status)) errors.push(`${label}: invalid status ${meta.status}`);

	if (!Array.isArray(file.steps)) {
		errors.push(`${label}: steps must be an array`);
		return { ok: errors.length === 0, errors };
	}

	const stepIds = new Set<string>();
	let previousOrder = -Infinity;
	const sceneIds = new Set(options.script?.scenes.map((s) => s.id) ?? []);
	const beatIds = new Set(options.script?.beats.map((b) => b.id) ?? []);
	const eventIds = new Set(options.taxonomy?.majorEvents.map((e) => e.id) ?? []);

	for (const step of file.steps) {
		const stepLabel = `${label}.step(${step?.id || '?'})`;
		if (!step?.id) {
			errors.push(`${stepLabel}: missing id`);
			continue;
		}
		if (stepIds.has(step.id)) errors.push(`${label}: duplicate step id ${step.id}`);
		stepIds.add(step.id);
		if (typeof step.order !== 'number' || !Number.isFinite(step.order)) {
			errors.push(`${stepLabel}: order must be a number`);
		} else if (step.order <= previousOrder) {
			errors.push(`${stepLabel}: order must be strictly increasing`);
		} else {
			previousOrder = step.order;
		}
		if (!step.title?.trim()) errors.push(`${stepLabel}: missing title`);
		if (!step.summary?.trim()) errors.push(`${stepLabel}: missing summary`);
		if (!IMPORTANCE.has(step.importance)) {
			errors.push(`${stepLabel}: invalid importance ${step.importance}`);
		}
		if (!STEP_STATUS.has(step.status)) {
			errors.push(`${stepLabel}: invalid status ${step.status}`);
		}
		if (step.majorEventId && options.taxonomy && !eventIds.has(step.majorEventId)) {
			errors.push(`${stepLabel}: unknown majorEventId ${step.majorEventId}`);
		}
		if (options.script) {
			for (const sceneId of step.sceneIds ?? []) {
				if (!sceneIds.has(sceneId)) errors.push(`${stepLabel}: unknown sceneId ${sceneId}`);
			}
			for (const beatId of step.beatIds ?? []) {
				if (!beatIds.has(beatId)) errors.push(`${stepLabel}: unknown beatId ${beatId}`);
			}
		}
	}

	for (const step of file.steps) {
		if (!step?.id) continue;
		const stepLabel = `${label}.step(${step.id})`;
		for (const depId of step.dependsOnStepIds ?? []) {
			if (depId === step.id) {
				errors.push(`${stepLabel}: dependsOnStepIds cannot reference itself`);
			} else if (!stepIds.has(depId)) {
				errors.push(`${stepLabel}: unknown dependsOnStepId ${depId}`);
			}
		}
	}

	return { ok: errors.length === 0, errors };
}
