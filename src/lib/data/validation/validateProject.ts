import type { ValidationResult } from '$lib/types/common';
import type { ProjectFile } from '$lib/types/project';

const SPANISH_SOURCE = /^(es)(-[A-Za-z0-9]+)?$/;

export function validateProject(file: ProjectFile): ValidationResult {
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

	return { ok: errors.length === 0, errors };
}
