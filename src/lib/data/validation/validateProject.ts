import type { ValidationResult } from '$lib/types/common';
import type { ProjectFile } from '$lib/types/project';
import type { ScriptFile } from '$lib/types/script';
import type { ScriptId } from '$lib/types/ids';
import { sourceStoryText } from './localizedString.ts';

const SPANISH_SOURCE = /^(es)(-[A-Za-z0-9]+)?$/;

export function validateProject(
	file: ProjectFile,
	options: { scripts?: ScriptFile[] } = {}
): ValidationResult {
	const errors: string[] = [];

	if (!file || typeof file !== 'object') {
		return { ok: false, errors: ['project: missing file'] };
	}
	if (!file.schemaVersion) errors.push('project: missing schemaVersion');
	if (!file.project) {
		errors.push('project: missing project object');
		return { ok: errors.length === 0, errors };
	}

	const p = file.project;
	if (!p.id) errors.push('project: missing id');
	if (!p.title) errors.push('project: missing title');
	if (!p.canonicalScriptId) errors.push('project: missing canonicalScriptId');
	if (!Array.isArray(p.scripts) || p.scripts.length === 0) {
		errors.push('project: scripts registry must be a non-empty array');
	}
	if (!Array.isArray(p.continuities) || p.continuities.length === 0) {
		errors.push('project: continuities must be a non-empty array');
	}
	if (!p.languages) {
		errors.push('project: missing languages');
	} else {
		const langs = p.languages;
		if (!SPANISH_SOURCE.test(langs.sourceLanguage ?? '')) {
			errors.push(
				`project: sourceLanguage must be Spanish (es / es-XX), got "${langs.sourceLanguage}"`
			);
		}
		if (!langs.defaultDialogueLanguage) errors.push('project: missing defaultDialogueLanguage');
		if (!langs.fallbackLanguage) errors.push('project: missing fallbackLanguage');
		if (!Array.isArray(langs.supported) || langs.supported.length === 0) {
			errors.push('project: languages.supported must be a non-empty array');
		} else {
			const tags = new Set(langs.supported.map((s) => s.tag));
			if (!tags.has(langs.sourceLanguage)) {
				errors.push('project: sourceLanguage not listed in supported');
			}
		}
	}

	const continuityIds = new Set((p.continuities ?? []).map((c) => c.id));
	for (const continuity of p.continuities ?? []) {
		if (!continuity.id) errors.push('project.continuities: entry missing id');
		if (!sourceStoryText(continuity.name)?.trim())
			errors.push(`project.continuities ${continuity.id}: missing name`);
		if (continuity.description != null && !sourceStoryText(continuity.description)?.trim())
			errors.push(`project.continuities ${continuity.id}: empty description`);
		if (
			continuity.derivedFromContinuityId &&
			!continuityIds.has(continuity.derivedFromContinuityId)
		)
			errors.push(`project.continuities ${continuity.id}: invalid derivedFromContinuityId`);
		if (continuity.derivedFromContinuityId === continuity.id)
			errors.push(`project.continuities ${continuity.id}: cannot derive from itself`);
	}
	const registryIds = new Set<ScriptId>();
	for (const entry of p.scripts ?? []) {
		if (!entry.id) errors.push('project.scripts: entry missing id');
		else if (registryIds.has(entry.id)) errors.push(`project.scripts: duplicate ${entry.id}`);
		else registryIds.add(entry.id);
		if (!entry.continuityId || !continuityIds.has(entry.continuityId)) {
			errors.push(`project.scripts ${entry.id}: invalid continuityId`);
		}
		if (entry.lineage?.sourceScriptId && !registryIds.has(entry.lineage.sourceScriptId)) {
			// source may appear later in array; check after loop
		}
	}

	if (p.canonicalScriptId && !registryIds.has(p.canonicalScriptId)) {
		errors.push(`project: canonicalScriptId "${p.canonicalScriptId}" not in scripts registry`);
	}

	for (const entry of p.scripts ?? []) {
		if (entry.lineage?.sourceScriptId && !registryIds.has(entry.lineage.sourceScriptId)) {
			errors.push(
				`project.scripts ${entry.id}: lineage.sourceScriptId "${entry.lineage.sourceScriptId}" not registered`
			);
		}
		if (entry.lineage?.sourceScriptId === entry.id) {
			errors.push(`project.scripts ${entry.id}: lineage cannot reference itself`);
		}
	}

	const scripts = options.scripts ?? [];
	const scriptById = new Map(scripts.map((s) => [s.script.id, s]));
	for (const entry of p.scripts ?? []) {
		const fileScript = scriptById.get(entry.id);
		if (!fileScript) {
			errors.push(`project.scripts ${entry.id}: script file not loaded`);
			continue;
		}
		if (fileScript.script.id !== entry.id) {
			errors.push(`project.scripts ${entry.id}: file script.id mismatch`);
		}
		if (fileScript.script.kind !== entry.kind) {
			errors.push(`project.scripts ${entry.id}: kind mismatch registry vs file`);
		}
		if (fileScript.script.continuityId !== entry.continuityId) {
			errors.push(`project.scripts ${entry.id}: continuityId mismatch registry vs file`);
		}
	}

	return { ok: errors.length === 0, errors };
}
