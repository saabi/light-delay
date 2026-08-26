import type { ValidationResult } from '$lib/types/common';
import type { ComparisonTaxonomyFile } from '$lib/types/comparison';
import type { DocumentsFile } from '$lib/types/document';
import type { EntityVariantsFile, ScriptFile, SourceReference } from '$lib/types/script';

function unique(label: string, ids: string[], errors: string[]) {
	const seen = new Set<string>();
	for (const id of ids) {
		if (!id) errors.push(`${label}: empty id`);
		else if (seen.has(id)) errors.push(`${label}: duplicate ${id}`);
		seen.add(id);
	}
}

export function validateComparisonTaxonomy(file: ComparisonTaxonomyFile): ValidationResult {
	const errors: string[] = [];
	if (!file?.schemaVersion) errors.push('comparison-taxonomy: missing schemaVersion');
	if (!file?.profileVersion) errors.push('comparison-taxonomy: missing profileVersion');
	unique(
		'canonDimensions',
		(file?.canonDimensions ?? []).map((item) => item.id),
		errors
	);
	unique(
		'majorEvents',
		(file?.majorEvents ?? []).map((item) => item.id),
		errors
	);
	return { ok: errors.length === 0, errors };
}

function validateSourceReference(
	ref: SourceReference,
	scriptsById: Map<string, ScriptFile>,
	documentIds: Set<string>,
	errors: string[],
	label: string
) {
	if (ref.kind === 'document') {
		if (!documentIds.has(ref.documentId))
			errors.push(`${label}: unknown document ${ref.documentId}`);
		return;
	}
	const source = scriptsById.get(ref.scriptId);
	if (!source) {
		errors.push(`${label}: unknown source script ${ref.scriptId}`);
		return;
	}
	if (ref.sceneId && !source.scenes.some((item) => item.id === ref.sceneId))
		errors.push(`${label}: unknown source scene ${ref.sceneId}`);
	if (ref.beatId && !source.beats.some((item) => item.id === ref.beatId))
		errors.push(`${label}: unknown source beat ${ref.beatId}`);
	if (ref.cueId && !source.cues.some((item) => item.id === ref.cueId))
		errors.push(`${label}: unknown source cue ${ref.cueId}`);
	if (ref.shotId && !source.shots.some((item) => item.id === ref.shotId))
		errors.push(`${label}: unknown source shot ${ref.shotId}`);
}

export function validateScriptComparison(options: {
	script: ScriptFile;
	taxonomy: ComparisonTaxonomyFile;
	scripts: ScriptFile[];
	documents?: DocumentsFile;
}): ValidationResult {
	const { script, taxonomy, scripts, documents } = options;
	const errors: string[] = [];
	const profile = script.script.comparisonProfile;
	if (!profile) return { ok: true, errors };
	if (profile.version !== taxonomy.profileVersion) {
		errors.push(
			`script(${script.script.id}): comparison profile ${profile.version} != taxonomy ${taxonomy.profileVersion}`
		);
	}
	const dimensions = new Set(taxonomy.canonDimensions.map((item) => item.id));
	const events = new Set(taxonomy.majorEvents.map((item) => item.id));
	unique(
		`${script.script.id}.canonClaims`,
		profile.canonClaims.map((item) => item.dimensionId),
		errors
	);
	unique(
		`${script.script.id}.eventCoverage`,
		profile.eventCoverage.map((item) => item.eventId),
		errors
	);
	for (const claim of profile.canonClaims) {
		if (!dimensions.has(claim.dimensionId))
			errors.push(`script(${script.script.id}): unknown canon dimension ${claim.dimensionId}`);
		if (!claim.statement.trim())
			errors.push(`script(${script.script.id}): empty canon statement ${claim.dimensionId}`);
	}
	const sceneIds = new Set(script.scenes.map((scene) => scene.id));
	for (const coverage of profile.eventCoverage) {
		if (!events.has(coverage.eventId))
			errors.push(`script(${script.script.id}): unknown event ${coverage.eventId}`);
		for (const sceneId of coverage.sceneIds ?? []) {
			if (!sceneIds.has(sceneId))
				errors.push(
					`script(${script.script.id}): event ${coverage.eventId} references unknown scene ${sceneId}`
				);
		}
	}

	const scriptsById = new Map(scripts.map((item) => [item.script.id, item]));
	const documentIds = new Set((documents?.documents ?? []).map((item) => item.id));
	for (const collection of [script.scenes, script.beats, script.cues, script.shots]) {
		for (const item of collection) {
			for (const ref of item.sourceRefs ?? []) {
				validateSourceReference(
					ref,
					scriptsById,
					documentIds,
					errors,
					`${script.script.id}:${item.id}`
				);
			}
		}
	}
	return { ok: errors.length === 0, errors };
}

export function validateEntityVariants(options: {
	file: EntityVariantsFile;
	scripts: ScriptFile[];
	entityIds: Record<string, Set<string>>;
	assetIds: Set<string>;
}): ValidationResult {
	const { file, scripts, entityIds, assetIds } = options;
	const errors: string[] = [];
	unique(
		'entityVariants',
		file.variants.map((item) => item.id),
		errors
	);
	const scriptsById = new Map(scripts.map((script) => [script.script.id, script]));
	const variantsById = new Map(file.variants.map((variant) => [variant.id, variant]));

	for (const variant of file.variants) {
		if (!entityIds[variant.entity.kind]?.has(variant.entity.id)) {
			errors.push(
				`entityVariant(${variant.id}): unknown ${variant.entity.kind} ${variant.entity.id}`
			);
		}
		for (const scriptId of variant.scriptIds ?? []) {
			if (!scriptsById.has(scriptId))
				errors.push(`entityVariant(${variant.id}): unknown script ${scriptId}`);
		}
		for (const assetId of variant.referenceAssetIds) {
			if (!assetIds.has(assetId))
				errors.push(`entityVariant(${variant.id}): unknown asset ${assetId}`);
		}
	}

	for (const script of scripts) {
		for (const [kind, selections] of Object.entries(script.script.entityVariantSelections ?? {})) {
			for (const [entityId, variantId] of Object.entries(
				(selections ?? {}) as Record<string, string>
			)) {
				const variant = variantsById.get(variantId);
				if (!variant) {
					errors.push(`script(${script.script.id}): unknown selected variant ${variantId}`);
					continue;
				}
				if (variant.entity.kind !== kind || variant.entity.id !== entityId) {
					errors.push(
						`script(${script.script.id}): variant ${variantId} does not belong to ${kind}:${entityId}`
					);
				}
				if (variant.scriptIds?.length && !variant.scriptIds.includes(script.script.id)) {
					errors.push(
						`script(${script.script.id}): variant ${variantId} is not enabled for this script`
					);
				}
				if (variant.continuityId && variant.continuityId !== script.script.continuityId) {
					errors.push(
						`script(${script.script.id}): variant ${variantId} has incompatible continuity`
					);
				}
			}
		}
	}

	return { ok: errors.length === 0, errors };
}

export function getFoundationalConflictWarnings(
	left: ScriptFile,
	right: ScriptFile,
	taxonomy: ComparisonTaxonomyFile
): string[] {
	if (left.script.continuityId !== right.script.continuityId) return [];
	const foundational = new Set(
		taxonomy.canonDimensions.filter((item) => item.foundational).map((item) => item.id)
	);
	const rightById = new Map(
		(right.script.comparisonProfile?.canonClaims ?? []).map((item) => [item.dimensionId, item])
	);
	const warnings: string[] = [];
	for (const claim of left.script.comparisonProfile?.canonClaims ?? []) {
		if (!foundational.has(claim.dimensionId) || claim.status !== 'established') continue;
		const other = rightById.get(claim.dimensionId);
		if (!other || other.status !== 'established') continue;
		const a = claim.valueId ?? claim.statement;
		const b = other.valueId ?? other.statement;
		if (a !== b)
			warnings.push(
				`${left.script.id} / ${right.script.id}: foundational conflict ${claim.dimensionId}`
			);
	}
	return warnings;
}
