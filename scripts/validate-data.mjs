/**
 * Load data/*.json and run structural checks (JS twin of TS validators).
 * Usage: node scripts/validate-data.mjs
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sourceLocalizedString } from './lib/localized-string.mjs';
import { collectProductionGateValidation } from './lib/production-gate.mjs';
import { resolveStillProvider } from './lib/provider-capabilities.mjs';
import {
	providerAllowsFourByFour,
	stretchBlockingBlockers,
	validateGridLayout
} from './lib/visual-stretch.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data');
const SCRIPTS_DIR = join(DATA, 'scripts');
const OUTLINES_DIR = join(DATA, 'outlines');
const stillProvider = (() => {
	try {
		const file = JSON.parse(
			readFileSync(join(DATA, 'production', 'provider-capabilities.json'), 'utf8')
		);
		return resolveStillProvider(file, { campaignId: 'campaign:higgsfield-trial-24h' });
	} catch {
		return null;
	}
})();
const allowFourByFour = providerAllowsFourByFour(stillProvider);
const IMAGE_STATES = new Set([
	'current',
	'needs_review',
	'needs_replacement',
	'needs_regeneration'
]);
const IMAGE_REASONS = new Set([
	'canon_mismatch',
	'wrong_composition',
	'continuity_error',
	'placeholder',
	'quality',
	'missing_subject'
]);
const OUTLINE_IMPORTANCE = new Set(['required', 'optional']);
const OUTLINE_LEVEL = new Set(['story', 'detail']);
const OUTLINE_RELATION = new Set([
	'enables',
	'motivates',
	'reveals',
	'forces',
	'prevents',
	'pays_off'
]);
const OUTLINE_COVERAGE_STATUS = new Set([
	'not_started',
	'partial',
	'covered',
	'deferred',
	'not_applicable'
]);
const OUTLINE_FILE_STATUS = new Set(['draft', 'reviewed', 'locked', 'deprecated']);
const OUTLINE_FRAMING_PLACEMENT = new Set(['before_story', 'after_story']);
const OUTLINE_FRAMING_KIND = new Set([
	'purpose',
	'terminology',
	'premise',
	'setting',
	'physics',
	'gravity',
	'cast',
	'motivation',
	'stakes',
	'throughlines',
	'production_choices',
	'other'
]);

function validateOutlineBlocks(blocks, label, errors) {
	if (!Array.isArray(blocks) || blocks.length === 0) {
		errors.push(`${label}: requires at least one block`);
		return;
	}
	for (const [index, block] of blocks.entries()) {
		const blockLabel = `${label}[${index}]`;
		if (block?.type === 'list') {
			if (!Array.isArray(block.items) || block.items.length === 0)
				errors.push(`${blockLabel}: list requires items`);
			for (const item of block.items || [])
				if (!sourceLocalizedString(item)?.trim()) errors.push(`${blockLabel}: empty list item`);
		} else if (['paragraph', 'blockquote', 'heading'].includes(block?.type)) {
			if (!sourceLocalizedString(block.text)?.trim()) errors.push(`${blockLabel}: empty text`);
			if (block.type === 'heading' && ![3, 4].includes(block.level))
				errors.push(`${blockLabel}: heading level must be 3 or 4`);
		} else errors.push(`${blockLabel}: invalid block type ${block?.type}`);
	}
}

function validateContinuousOrders(values, label, errors) {
	const sorted = [...values].sort((a, b) => a - b);
	if (sorted.some((value, index) => !Number.isInteger(value) || value !== index + 1))
		errors.push(`${label}: orders must be unique and continuous from 1`);
}

function validateImageStatus(status, label, errors) {
	if (!status || typeof status !== 'object') {
		errors.push(`${label}: imageStatus must be an object`);
		return;
	}
	if (!IMAGE_STATES.has(status.status)) {
		errors.push(`${label}: invalid imageStatus.status ${status.status}`);
	}
	if (!Array.isArray(status.reasons) || status.reasons.length === 0) {
		errors.push(`${label}: imageStatus.reasons must be a non-empty array`);
	} else {
		for (const reason of status.reasons) {
			if (!IMAGE_REASONS.has(reason)) {
				errors.push(`${label}: invalid imageStatus reason ${reason}`);
			}
		}
	}
	if (status.status !== 'current' && !sourceLocalizedString(status.explanation)?.trim()) {
		errors.push(`${label}: non-current imageStatus requires explanation`);
	}
}

function validateVisualStretches(script, { label, shotIds, takeIds, characterIds, errors, assetIds, assetsById }) {
	const stretches = script.visualStretches || [];
	if (!stretches.length) return;
	unique(
		`${label}.visualStretches`,
		stretches.map((s) => s.id),
		errors
	);
	const membership = new Map();
	const shotsById = new Map((script.shots || []).map((s) => [s.id, s]));
	const playbackIndex = new Map((script.shots || []).map((s, i) => [s.id, i]));

	const validateAssetRefList = (sLabel, field, ids) => {
		if (!Array.isArray(ids)) return;
		const seen = new Set();
		for (const id of ids) {
			if (!id) {
				errors.push(`${sLabel}: empty id in ${field}`);
				continue;
			}
			if (seen.has(id)) errors.push(`${sLabel}: duplicate ${field} ${id}`);
			seen.add(id);
			if (assetIds?.size && !assetIds.has(id)) {
				errors.push(`${sLabel}: unknown ${field} asset ${id}`);
				continue;
			}
			const asset = assetsById?.get?.(id);
			if (!asset) continue;
			if (!asset.path) errors.push(`${sLabel}: ${field} asset ${id} missing path`);
			const status = asset.imageStatus?.status;
			if (status && status !== 'current') {
				errors.push(`${sLabel}: ${field} asset ${id} imageStatus ${status} (must be current or absent)`);
			}
		}
	};
	for (const stretch of stretches) {
		const sLabel = `${label} stretch ${stretch.id}`;
		if (!stretch.revision || !Number.isInteger(stretch.revision) || stretch.revision < 1) {
			errors.push(`${sLabel}: revision must be a positive integer`);
		}
		if (!['draft', 'reviewed', 'locked'].includes(stretch.status)) {
			errors.push(`${sLabel}: invalid status ${stretch.status}`);
		}
		if (!Array.isArray(stretch.absentCharacterIds)) {
			errors.push(`${sLabel}: absentCharacterIds must be an array`);
		}
		if (!Array.isArray(stretch.presentCharacterIds) || !stretch.presentCharacterIds.length) {
			errors.push(`${sLabel}: presentCharacterIds required`);
		}
		const present = new Set(stretch.presentCharacterIds || []);
		const absent = new Set(stretch.absentCharacterIds || []);
		for (const id of present) {
			if (absent.has(id)) errors.push(`${sLabel}: character ${id} in both present and absent`);
			if (characterIds.size && !characterIds.has(id)) {
				errors.push(`${sLabel}: unknown present character ${id}`);
			}
		}
		for (const id of absent) {
			if (characterIds.size && !characterIds.has(id)) {
				errors.push(`${sLabel}: unknown absent character ${id}`);
			}
		}
		const stillMode = stretch.generationProfile?.stillMode;
		if (!stillMode) errors.push(`${sLabel}: generationProfile.stillMode required`);
		const gridLayout = stretch.generationProfile?.gridLayout;
		if (stillMode === 'combined_storyboard_sheet') {
			if (!gridLayout) errors.push(`${sLabel}: gridLayout required for combined_storyboard_sheet`);
			else {
				for (const err of validateGridLayout(gridLayout, (stretch.members || []).length, {
					allowFourByFour
				})) {
					errors.push(`${sLabel}: ${err}`);
				}
			}
		} else if (stillMode === 'independent_shared_authority' && gridLayout) {
			errors.push(`${sLabel}: gridLayout must be absent for independent_shared_authority`);
		}
		const maxMembersPerVideoJob = stretch.generationProfile?.maxMembersPerVideoJob;
		if (maxMembersPerVideoJob != null) {
			if (!Number.isInteger(maxMembersPerVideoJob) || maxMembersPerVideoJob < 1) {
				errors.push(`${sLabel}: generationProfile.maxMembersPerVideoJob must be a positive integer`);
			}
		}

		const members = [...(stretch.members || [])].sort((a, b) => a.order - b.order);
		if (!members.length) errors.push(`${sLabel}: members required`);
		const orders = new Set();
		for (const member of members) {
			if (orders.has(member.order)) errors.push(`${sLabel}: duplicate member order ${member.order}`);
			orders.add(member.order);
			if (!shotIds.has(member.shotId)) {
				errors.push(`${sLabel}: unknown member shot ${member.shotId}`);
				continue;
			}
			if (membership.has(member.shotId)) {
				errors.push(
					`${sLabel}: shot ${member.shotId} already in stretch ${membership.get(member.shotId)}`
				);
			} else {
				membership.set(member.shotId, stretch.id);
			}
			const shot = shotsById.get(member.shotId);
			if (shot?.locationId && stretch.locationId && shot.locationId !== stretch.locationId) {
				errors.push(`${sLabel}: shot ${member.shotId} location mismatch`);
			}
			if (member.takeScope === 'explicit') {
				if (!member.takeIds?.length) {
					errors.push(`${sLabel}: explicit takeScope requires takeIds`);
				}
				for (const takeId of member.takeIds || []) {
					if (!takeIds.has(takeId)) errors.push(`${sLabel}: unknown take ${takeId}`);
				}
			}
			if (Object.prototype.hasOwnProperty.call(member, 'videoReferenceAssetIds')) {
				validateAssetRefList(
					`${sLabel}.member[${member.shotId}]`,
					'videoReferenceAssetIds',
					member.videoReferenceAssetIds || []
				);
			}
			for (const ref of shot?.visibleRefs || []) {
				if (ref.kind !== 'character') continue;
				if (absent.has(ref.id)) {
					errors.push(`${sLabel}: absent character ${ref.id} visible on ${member.shotId}`);
				}
				if (!present.has(ref.id)) {
					errors.push(`${sLabel}: visible character ${ref.id} not in presentCharacterIds`);
				}
			}
		}

		for (let i = 1; i < members.length; i += 1) {
			const prev = playbackIndex.get(members[i - 1].shotId);
			const next = playbackIndex.get(members[i].shotId);
			if (prev == null || next == null) continue;
			if (next !== prev + 1) {
				errors.push(
					`${sLabel}: members not contiguous in playback order (${members[i - 1].shotId} → ${members[i].shotId})`
				);
			}
		}

		if (
			['reviewed', 'locked'].includes(stretch.status) &&
			stretchBlockingBlockers(stretch).length
		) {
			errors.push(`${sLabel}: reviewed/locked requires complete blocking for present cast`);
		}

		validateAssetRefList(sLabel, 'referenceAssetIds', stretch.referenceAssetIds || []);
		if (Object.prototype.hasOwnProperty.call(stretch, 'videoReferenceAssetIds')) {
			validateAssetRefList(sLabel, 'videoReferenceAssetIds', stretch.videoReferenceAssetIds || []);
		}

		for (const take of script.takes || []) {
			if (take.generation?.visualStretchId !== stretch.id) continue;
			if (take.imageAssetId && take.imageAssetId === stretch.combinedStillAssetId) {
				errors.push(
					`${sLabel}: take ${take.id} must not use unsplit sheet as imageAssetId`
				);
			}
		}
	}
}

function load(name) {
	return JSON.parse(readFileSync(join(DATA, name), 'utf8'));
}

function loadScript(filename) {
	return JSON.parse(readFileSync(join(SCRIPTS_DIR, filename), 'utf8'));
}

function unique(label, ids, errors) {
	const seen = new Set();
	for (const id of ids) {
		if (!id) errors.push(`${label}: empty id`);
		else if (seen.has(id)) errors.push(`${label}: duplicate ${id}`);
		seen.add(id);
	}
}

function slugFromScriptId(scriptId) {
	const i = scriptId.indexOf(':');
	return i >= 0 ? scriptId.slice(i + 1) : scriptId;
}

function validateScriptFile(
	script,
	{
		sourceLang,
		expectScenes,
		expectShots,
		functionIds,
		characterIds,
		taxonomy,
		scriptsById,
		outlineStepIdsById,
		documentIds,
		errors,
		warnings,
		assetIds,
		assetsById,
		manifestIds,
		manifestById
	}
) {
	const label = `script(${script.script?.id})`;
	if (!script.script?.id) errors.push(`${label}: missing id`);
	if (!script.script?.kind) errors.push(`${label}: missing kind`);
	if (!script.script?.continuityId) errors.push(`${label}: missing continuityId`);
	if (script.script?.localization) {
		if (script.script.localization.sourceLanguage !== 'en')
			errors.push(`${label}: localization.sourceLanguage must be en`);
		for (const [language, translation] of Object.entries(
			script.script.localization.translations || {}
		)) {
			if (!['current', 'needs_revision', 'not_started'].includes(translation?.status))
				errors.push(`${label}: invalid ${language} translation status ${translation?.status}`);
		}
	}

	unique(
		`${label}.scenes`,
		(script.scenes || []).map((s) => s.id),
		errors
	);
	unique(
		`${label}.shots`,
		(script.shots || []).map((s) => s.id),
		errors
	);
	unique(
		`${label}.takes`,
		(script.takes || []).map((t) => t.id),
		errors
	);
	unique(
		`${label}.cues`,
		(script.cues || []).map((c) => c.id),
		errors
	);

	if (expectScenes != null && script.scenes.length !== expectScenes) {
		errors.push(`${label}: expected ${expectScenes} scenes, got ${script.scenes.length}`);
	}
	if (expectShots != null && script.shots.length !== expectShots) {
		errors.push(`${label}: expected ${expectShots} shots, got ${script.shots.length}`);
	}

	for (const cue of script.cues || []) {
		if (cue.type !== 'dialogue') continue;
		const expectedSource = sourceLang ?? cue.content?.sourceLanguage;
		if (cue.content?.sourceLanguage !== expectedSource) {
			errors.push(`${label} cue ${cue.id}: content.sourceLanguage must be ${expectedSource}`);
		}
		const v = cue.content?.variants?.[expectedSource];
		if (!v || v.status !== 'source') {
			errors.push(`${label} cue ${cue.id}: source variant missing or status != source`);
		}
		if (!v?.spokenText?.trim()) errors.push(`${label} cue ${cue.id}: empty spokenText`);
	}

	const takeIds = new Set((script.takes || []).map((t) => t.id));
	const shotIds = new Set((script.shots || []).map((shot) => shot.id));
	const takesByShot = new Map();
	for (const take of script.takes || []) {
		if (!takesByShot.has(take.shotId)) takesByShot.set(take.shotId, []);
		takesByShot.get(take.shotId).push(take);
		if (!shotIds.has(take.shotId)) {
			errors.push(`${label} take ${take.id}: unknown shotId ${take.shotId}`);
		}
	}
	if ((script.shots || []).length > 0) {
		for (const shot of script.shots) {
			if (!shot.selectedTakeId || !takeIds.has(shot.selectedTakeId)) {
				errors.push(`${label} shot ${shot.id}: invalid selectedTakeId`);
			}
			for (const takeId of shot.takeIds || []) {
				if (!takeIds.has(takeId)) {
					errors.push(`${label} shot ${shot.id}: unknown takeId ${takeId}`);
				}
			}
			for (const take of takesByShot.get(shot.id) || []) {
				if (!(shot.takeIds || []).includes(take.id)) {
					errors.push(`${label} shot ${shot.id}: take ${take.id} missing from takeIds`);
				}
			}
		}
	}
	for (const take of script.takes || []) {
		if (take.imageAssetId && !assetIds.has(take.imageAssetId)) {
			errors.push(`${label} take ${take.id}: unknown image asset ${take.imageAssetId}`);
		}
		const gateResult = collectProductionGateValidation(take, `${label} take ${take.id}`, {
			assetIds,
			assetsById,
			manifestIds,
			manifestById
		});
		errors.push(...gateResult.errors);
		warnings.push(...gateResult.warnings);
		if (!take.imageStatus) continue;
		validateImageStatus(take.imageStatus, `${label} take ${take.id}`, errors);
		if (take.imageStatus.reasons?.includes('placeholder') && !take.imageStatus.sourceShotId) {
			errors.push(`${label} take ${take.id}: placeholder requires sourceShotId`);
		}
		if (take.imageStatus.sourceShotId && !shotIds.has(take.imageStatus.sourceShotId)) {
			errors.push(
				`${label} take ${take.id}: unknown sourceShotId ${take.imageStatus.sourceShotId}`
			);
		}
	}

	validateVisualStretches(script, {
		label,
		shotIds,
		takeIds,
		characterIds,
		errors,
		assetIds,
		assetsById
	});

	for (const a of script.script?.characterFunctionAssignments || []) {
		if (functionIds.size && !functionIds.has(a.functionId)) {
			errors.push(`${label}: unknown functionId ${a.functionId}`);
		}
		if (characterIds.size && !characterIds.has(a.characterId)) {
			errors.push(`${label}: unknown character ${a.characterId}`);
		}
		for (const src of a.sourceCharacterIds || []) {
			if (characterIds.size && !characterIds.has(src)) {
				errors.push(`${label}: unknown sourceCharacter ${src}`);
			}
		}
	}

	if (script.script?.lineage?.sourceScriptId === script.script?.id) {
		errors.push(`${label}: lineage cannot reference self`);
	}

	const profile = script.script?.comparisonProfile;
	if (profile) {
		if (profile.version !== taxonomy.profileVersion) {
			errors.push(`${label}: comparison profile version mismatch`);
		}
		unique(
			`${label}.canonClaims`,
			profile.canonClaims.map((item) => item.dimensionId),
			errors
		);
		unique(
			`${label}.eventCoverage`,
			profile.eventCoverage.map((item) => item.eventId),
			errors
		);
		const dimensionIds = new Set(taxonomy.canonDimensions.map((item) => item.id));
		const eventIds = new Set(taxonomy.majorEvents.map((item) => item.id));
		const sceneIds = new Set(script.scenes.map((item) => item.id));
		for (const claim of profile.canonClaims) {
			if (!dimensionIds.has(claim.dimensionId))
				errors.push(`${label}: unknown canon dimension ${claim.dimensionId}`);
			if (!sourceLocalizedString(claim.statement)?.trim())
				errors.push(`${label}: empty canon statement ${claim.dimensionId}`);
		}
		for (const coverage of profile.eventCoverage) {
			if (!eventIds.has(coverage.eventId))
				errors.push(`${label}: unknown event ${coverage.eventId}`);
			for (const sceneId of coverage.sceneIds || []) {
				if (!sceneIds.has(sceneId))
					errors.push(`${label}: event ${coverage.eventId} unknown scene ${sceneId}`);
			}
		}
	}

	for (const collection of [script.scenes, script.beats, script.cues, script.shots]) {
		for (const item of collection || []) {
			for (const ref of item.sourceRefs || []) {
				if (ref.kind === 'document') {
					if (!documentIds.has(ref.documentId))
						errors.push(`${label}: unknown source document ${ref.documentId}`);
					continue;
				}
				if (ref.kind === 'outline') {
					const stepIds = outlineStepIdsById.get(ref.outlineId);
					if (!stepIds) errors.push(`${label}: unknown source outline ${ref.outlineId}`);
					else if (ref.stepId && !stepIds.has(ref.stepId))
						errors.push(`${label}: unknown source outline step ${ref.stepId}`);
					continue;
				}
				const source = scriptsById.get(ref.scriptId);
				if (!source) errors.push(`${label}: unknown source script ${ref.scriptId}`);
				else {
					if (ref.sceneId && !source.scenes.some((x) => x.id === ref.sceneId))
						errors.push(`${label}: unknown source scene ${ref.sceneId}`);
					if (ref.beatId && !source.beats.some((x) => x.id === ref.beatId))
						errors.push(`${label}: unknown source beat ${ref.beatId}`);
					if (ref.cueId && !source.cues.some((x) => x.id === ref.cueId))
						errors.push(`${label}: unknown source cue ${ref.cueId}`);
					if (ref.shotId && !source.shots.some((x) => x.id === ref.shotId))
						errors.push(`${label}: unknown source shot ${ref.shotId}`);
				}
			}
		}
	}
}

function main() {
	const errors = [];
	const warnings = [];
	const project = load('project.json');
	const assets = load('assets.json');
	const characters = load('characters.json');
	const locations = load('locations.json');
	const objects = load('objects.json');
	const vehicles = load('vehicles.json');
	const factions = load('factions.json');
	const voiceProfiles = load('voice-profiles.json');
	const documents = load('documents.json');
	const legacyMigration = load('legacy-text-migration.json');
	const narrativeFunctions = load('narrative-functions.json');
	const entityVariants = load('entity-variants.json');
	const taxonomy = load('comparison-taxonomy.json');

	if (!project.schemaVersion) errors.push('project: missing schemaVersion');
	const langs = project.project?.languages;
	if (!langs) errors.push('project: missing languages');
	else if (!langs.supported?.some((language) => language.tag === langs.sourceLanguage))
		errors.push(`project: sourceLanguage is not listed as supported: ${langs.sourceLanguage}`);

	const registry = project.project?.scripts || [];
	const continuities = project.project?.continuities || [];
	if (!registry.length) errors.push('project: empty scripts registry');
	if (!continuities.length) errors.push('project: empty continuities');

	const continuityIds = new Set(continuities.map((c) => c.id));
	for (const continuity of continuities) {
		if (!sourceLocalizedString(continuity.name)?.trim())
			errors.push(`continuity ${continuity.id}: missing localized name`);
		if (continuity.description != null && !sourceLocalizedString(continuity.description)?.trim())
			errors.push(`continuity ${continuity.id}: empty localized description`);
		if (
			continuity.derivedFromContinuityId &&
			!continuityIds.has(continuity.derivedFromContinuityId)
		)
			errors.push(`continuity ${continuity.id}: bad derivedFromContinuityId`);
		if (continuity.derivedFromContinuityId === continuity.id)
			errors.push(`continuity ${continuity.id}: cannot derive from itself`);
	}
	const registryIds = new Set(registry.map((e) => e.id));
	if (!registryIds.has(project.project?.canonicalScriptId)) {
		errors.push('project: canonicalScriptId not in registry');
	}
	const authority = project.project?.narrativeAuthority;
	if (!authority) errors.push('project: missing narrativeAuthority');
	else {
		if (authority.scriptId !== project.project.canonicalScriptId)
			errors.push('project: narrativeAuthority.scriptId must equal canonicalScriptId');
		if (!registryIds.has(authority.scriptId))
			errors.push('project: narrativeAuthority script not registered');
		if (!continuityIds.has(authority.continuityId))
			errors.push('project: narrativeAuthority continuity not registered');
	}

	const scriptFilesOnDisk = readdirSync(SCRIPTS_DIR).filter((f) => f.endsWith('.json'));
	const scriptsById = new Map();
	for (const entry of registry) {
		if (!continuityIds.has(entry.continuityId)) {
			errors.push(`registry ${entry.id}: bad continuityId`);
		}
		if (entry.lineage?.sourceScriptId && !registryIds.has(entry.lineage.sourceScriptId)) {
			errors.push(`registry ${entry.id}: lineage.sourceScriptId not registered`);
		}
		const filename = `${slugFromScriptId(entry.id)}.json`;
		if (!scriptFilesOnDisk.includes(filename)) {
			errors.push(`registry ${entry.id}: missing file scripts/${filename}`);
			continue;
		}
		const script = loadScript(filename);
		scriptsById.set(entry.id, script);
		if (script.script?.id !== entry.id) {
			errors.push(`registry ${entry.id}: file id mismatch (${script.script?.id})`);
		}
		if (script.script?.kind !== entry.kind) {
			errors.push(`registry ${entry.id}: kind mismatch`);
		}
	}

	unique(
		'assets',
		assets.assets.map((a) => a.id),
		errors
	);
	unique(
		'characters',
		characters.characters.map((c) => c.id),
		errors
	);
	unique(
		'locations',
		locations.locations.map((l) => l.id),
		errors
	);
	unique(
		'objects',
		objects.objects.map((o) => o.id),
		errors
	);
	unique(
		'vehicles',
		vehicles.vehicles.map((v) => v.id),
		errors
	);
	unique(
		'factions',
		factions.factions.map((f) => f.id),
		errors
	);
	unique(
		'voiceProfiles',
		voiceProfiles.voiceProfiles.map((v) => v.id),
		errors
	);
	unique(
		'documents',
		documents.documents.map((d) => d.id),
		errors
	);
	const entityCollections = [
		...characters.characters,
		...locations.locations,
		...objects.objects,
		...vehicles.vehicles,
		...factions.factions
	];
	for (const entity of entityCollections) {
		if (!entity.description?.es?.trim() || !entity.description?.en?.trim()) {
			errors.push(`entities: ${entity.id} requires inline ES/EN description`);
		}
		if (!entity.name?.es?.trim() || !entity.name?.en?.trim()) {
			errors.push(`entities: ${entity.id} requires inline ES/EN name`);
		}
		if ('role' in entity && (!entity.role?.es?.trim() || !entity.role?.en?.trim())) {
			errors.push(`entities: ${entity.id} requires inline ES/EN role`);
		}
	}
	for (const document of documents.documents) {
		const source = document.content?.variants?.[document.sourceLanguage];
		if (!Array.isArray(source)) {
			errors.push(`documents: ${document.id} missing ${document.sourceLanguage} source blocks`);
			continue;
		}
		const english = document.content.variants.en;
		if (document.translationStatus?.en && !Array.isArray(english)) {
			errors.push(`documents: ${document.id} declares EN status without EN content`);
		}
		if (Array.isArray(english)) {
			if (english.length !== source.length)
				errors.push(`documents: ${document.id} ES/EN block count mismatch`);
			for (let index = 0; index < Math.min(source.length, english.length); index += 1) {
				if (source[index].type !== english[index].type || source[index].id !== english[index].id) {
					errors.push(`documents: ${document.id} block ${index + 1} topology mismatch`);
				}
			}
		}
	}
	if (
		!legacyMigration.pages?.length ||
		legacyMigration.pages.some(
			(page) => !page.destination || !page.disposition || !page.translation
		)
	) {
		errors.push(
			'legacy-text-migration: every legacy page needs destination, disposition, and translation status'
		);
	}
	unique(
		'narrativeFunctions',
		narrativeFunctions.functions.map((f) => f.id),
		errors
	);
	unique(
		'entityVariants',
		entityVariants.variants.map((v) => v.id),
		errors
	);
	unique(
		'canonDimensions',
		taxonomy.canonDimensions.map((v) => v.id),
		errors
	);
	unique(
		'majorEvents',
		taxonomy.majorEvents.map((v) => v.id),
		errors
	);

	for (const asset of assets.assets) {
		if (!asset.path?.startsWith('/assets/')) {
			errors.push(`asset ${asset.id} path must start with /assets/: ${asset.path}`);
		}
		if (asset.role === 'animatic_placeholder' && asset.kind !== 'image') {
			errors.push(`asset ${asset.id}: animatic_placeholder must be an image`);
		}
		if (asset.imageStatus) validateImageStatus(asset.imageStatus, `asset ${asset.id}`, errors);
	}

	const sourceLang = langs?.sourceLanguage || 'en';
	const functionIds = new Set(narrativeFunctions.functions.map((f) => f.id));
	const characterIds = new Set(characters.characters.map((c) => c.id));
	const documentIds = new Set(documents.documents.map((d) => d.id));
	const assetIds = new Set(assets.assets.map((asset) => asset.id));
	const assetsById = new Map(assets.assets.map((asset) => [asset.id, asset]));
	const assetGenerationManifest = load('production/asset-generation-manifest.json');
	const manifestById = new Map(
		(assetGenerationManifest.assets || []).map((row) => [row.assetId, row])
	);
	const manifestIds = new Set(manifestById.keys());
	const ownedIds = new Set();
	const outlineFiles = readdirSync(OUTLINES_DIR).filter((name) => name.endsWith('.json'));
	const loadedOutlines = outlineFiles.map((filename) => ({
		filename,
		outline: JSON.parse(readFileSync(join(OUTLINES_DIR, filename), 'utf8'))
	}));
	const outlineStepIdsById = new Map(
		loadedOutlines
			.filter((record) => record.outline.outline?.id)
			.map((record) => [
				record.outline.outline.id,
				new Set((record.outline.steps || []).map((step) => step.id))
			])
	);

	for (const [id, script] of scriptsById) {
		const isArchivedMain = id === 'script:light-delay-main-short';
		validateScriptFile(script, {
			sourceLang: script.script?.status === 'deprecated' ? undefined : sourceLang,
			expectScenes: isArchivedMain ? 19 : undefined,
			expectShots: isArchivedMain ? 128 : undefined,
			functionIds,
			characterIds,
			taxonomy,
			scriptsById,
			documentIds,
			errors,
			warnings,
			assetIds,
			assetsById,
			manifestIds,
			manifestById,
			outlineStepIdsById
		});
		for (const collection of [
			script.acts,
			script.scenes,
			script.beats,
			script.cues,
			script.shots,
			script.takes
		]) {
			for (const item of collection || []) {
				if (ownedIds.has(item.id)) errors.push(`cross-script duplicate id ${item.id}`);
				ownedIds.add(item.id);
			}
		}
	}

	let outlineCount = 0;
	const outlinesById = new Map();
	try {
		for (const record of loadedOutlines) {
			const id = record.outline.outline?.id;
			if (!id) continue;
			if (outlinesById.has(id)) errors.push(`outlines: duplicate outline id ${id}`);
			outlinesById.set(id, record);
		}
		const eventIds = new Set(taxonomy.majorEvents.map((event) => event.id));
		for (const { filename, outline } of loadedOutlines) {
			outlineCount += 1;
			const label = `outline(${filename})`;
			if (!outline.schemaVersion) errors.push(`${label}: missing schemaVersion`);
			if (!outline.outline?.id) errors.push(`${label}: missing outline.id`);
			if (!outline.outline?.scriptId) errors.push(`${label}: missing outline.scriptId`);
			else if (!registryIds.has(outline.outline.scriptId)) {
				errors.push(`${label}: unknown scriptId ${outline.outline.scriptId}`);
			}
			if (!sourceLocalizedString(outline.outline?.title)?.trim())
				errors.push(`${label}: missing title`);
			if (!sourceLocalizedString(outline.outline?.synopsis)?.trim())
				errors.push(`${label}: missing synopsis`);
			if (!outline.outline?.version) errors.push(`${label}: missing version`);
			if (!OUTLINE_FILE_STATUS.has(outline.outline?.status)) {
				errors.push(`${label}: invalid status ${outline.outline?.status}`);
			}
			if (
				outline.outline?.editorialNotice != null &&
				!sourceLocalizedString(outline.outline.editorialNotice)?.trim()
			)
				errors.push(`${label}: empty editorialNotice`);
			if (outline.outline?.source) {
				const source = outline.outline.source;
				if (!source.path?.trim() || !source.revision?.trim() || !source.language?.trim())
					errors.push(`${label}: incomplete source metadata`);
				if (source.sha256 && !/^[a-f0-9]{64}$/.test(source.sha256))
					errors.push(`${label}: invalid source SHA-256`);
			}
			const derivation = outline.outline?.derivation;
			if (derivation) {
				const sourceRecord = outlinesById.get(derivation.sourceOutlineId);
				if (!sourceRecord)
					errors.push(`${label}: unknown derivation source ${derivation.sourceOutlineId}`);
				else {
					const sourceMeta = sourceRecord.outline.outline;
					if (
						derivation.reviewStatus === 'current' &&
						sourceMeta.revision !== derivation.sourceRevision
					)
						errors.push(
							`${label}: claims current against ${derivation.sourceOutlineId} r${derivation.sourceRevision}, but source is r${sourceMeta.revision}`
						);
					if (derivation.sourceVersion && sourceMeta.version !== derivation.sourceVersion)
						warnings.push(
							`${label}: source version ${sourceMeta.version} differs from pinned ${derivation.sourceVersion}`
						);
				}
			}
			const framingIds = new Set();
			const framingOrders = new Map();
			for (const section of outline.framing || []) {
				const sectionLabel = `${label}.framing(${section?.id || '?'})`;
				if (!section?.id || framingIds.has(section.id))
					errors.push(`${sectionLabel}: missing or duplicate id`);
				framingIds.add(section?.id);
				if (!OUTLINE_FRAMING_PLACEMENT.has(section?.placement))
					errors.push(`${sectionLabel}: invalid placement ${section?.placement}`);
				if (!OUTLINE_FRAMING_KIND.has(section?.kind))
					errors.push(`${sectionLabel}: invalid kind ${section?.kind}`);
				if (!sourceLocalizedString(section?.title)?.trim())
					errors.push(`${sectionLabel}: missing title`);
				validateOutlineBlocks(section?.blocks, `${sectionLabel}.blocks`, errors);
				const orders = framingOrders.get(section?.placement) || [];
				orders.push(section?.order);
				framingOrders.set(section?.placement, orders);
			}
			for (const [placement, orders] of framingOrders)
				validateContinuousOrders(orders, `${label}.framing.${placement}`, errors);
			const storySectionIds = new Set();
			const storySectionOrders = [];
			for (const section of outline.storySections || []) {
				if (!section?.id || storySectionIds.has(section.id))
					errors.push(`${label}: missing or duplicate story section id ${section?.id}`);
				storySectionIds.add(section?.id);
				storySectionOrders.push(section?.order);
				if (!sourceLocalizedString(section?.title)?.trim())
					errors.push(`${label}.storySection(${section?.id}): missing title`);
			}
			if (storySectionOrders.length)
				validateContinuousOrders(storySectionOrders, `${label}.storySections`, errors);
			const script = scriptsById.get(outline.outline?.scriptId);
			const sceneIds = new Set((script?.scenes || []).map((scene) => scene.id));
			const beatIds = new Set((script?.beats || []).map((beat) => beat.id));
			const stepIds = new Set();
			const ordersByLevel = new Map();
			for (const step of outline.steps || []) {
				const stepLabel = `${label}.step(${step?.id || '?'})`;
				if (!step?.id) {
					errors.push(`${stepLabel}: missing id`);
					continue;
				}
				if (stepIds.has(step.id)) errors.push(`${label}: duplicate step id ${step.id}`);
				stepIds.add(step.id);
				if (!OUTLINE_LEVEL.has(step.level))
					errors.push(`${stepLabel}: invalid level ${step.level}`);
				if (typeof step.order !== 'number') errors.push(`${stepLabel}: order must be a number`);
				else {
					const orders = ordersByLevel.get(step.level) || new Set();
					if (orders.has(step.order))
						errors.push(`${stepLabel}: duplicate ${step.level} order ${step.order}`);
					orders.add(step.order);
					ordersByLevel.set(step.level, orders);
				}
				if (!sourceLocalizedString(step.title)?.trim()) errors.push(`${stepLabel}: missing title`);
				const hasSummary = Boolean(sourceLocalizedString(step.summary)?.trim());
				const hasBody = Array.isArray(step.body) && step.body.length > 0;
				if (hasSummary === hasBody)
					errors.push(`${stepLabel}: requires exactly one of summary or body`);
				if (step.body) {
					if (step.level !== 'story') errors.push(`${stepLabel}: body requires story level`);
					validateOutlineBlocks(step.body, `${stepLabel}.body`, errors);
				}
				if ((outline.storySections || []).length && step.level === 'story') {
					if (!storySectionIds.has(step.sectionId))
						errors.push(`${stepLabel}: invalid sectionId ${step.sectionId}`);
				}
				if (step.level === 'detail' && step.sectionId)
					errors.push(`${stepLabel}: detail cannot declare sectionId`);
				if (!OUTLINE_IMPORTANCE.has(step.importance)) {
					errors.push(`${stepLabel}: invalid importance ${step.importance}`);
				}
				for (const [target, evidence] of Object.entries(step.coverage || {})) {
					if (!OUTLINE_COVERAGE_STATUS.has(evidence?.status))
						errors.push(`${stepLabel}: invalid ${target} coverage ${evidence?.status}`);
				}
				if (step.majorEventId && !eventIds.has(step.majorEventId)) {
					errors.push(`${stepLabel}: unknown majorEventId ${step.majorEventId}`);
				}
				if (script) {
					for (const sceneId of step.sceneIds || []) {
						if (!sceneIds.has(sceneId)) errors.push(`${stepLabel}: unknown sceneId ${sceneId}`);
					}
					for (const beatId of step.beatIds || []) {
						if (!beatIds.has(beatId)) errors.push(`${stepLabel}: unknown beatId ${beatId}`);
					}
				}
				for (const ref of step.sourceRefs || []) {
					if (ref.kind !== 'outline') continue;
					const sourceRecord = outlinesById.get(ref.outlineId);
					if (!sourceRecord) {
						errors.push(`${stepLabel}: unknown source outline ${ref.outlineId}`);
						continue;
					}
					if (
						ref.stepId &&
						!sourceRecord.outline.steps.some((candidate) => candidate.id === ref.stepId)
					)
						errors.push(`${stepLabel}: unknown source outline step ${ref.stepId}`);
				}
			}
			if (derivation?.fidelity === 'complete_causal_chain') {
				const source = outlinesById.get(derivation.sourceOutlineId)?.outline;
				if (source) {
					const expected = source.steps
						.filter((step) => step.level === 'story')
						.map((step) => step.id);
					const mapped = (outline.steps || []).flatMap((step) =>
						(step.sourceRefs || [])
							.filter(
								(ref) => ref.kind === 'outline' && ref.outlineId === derivation.sourceOutlineId
							)
							.map((ref) => ref.stepId)
							.filter(Boolean)
					);
					const missing = expected.filter((id) => !mapped.includes(id));
					const duplicates = [
						...new Set(mapped.filter((id, index) => mapped.indexOf(id) !== index))
					];
					if (missing.length)
						errors.push(`${label}: unmapped source story steps ${missing.join(', ')}`);
					if (duplicates.length)
						warnings.push(
							`${label}: source story steps mapped more than once ${duplicates.join(', ')}`
						);
				}
			}
			for (const sectionId of storySectionIds) {
				if (
					!(outline.steps || []).some(
						(step) => step.level === 'story' && step.sectionId === sectionId
					)
				)
					errors.push(`${label}: story section ${sectionId} has no story steps`);
			}
			for (const step of outline.steps || []) {
				if (!step?.id) continue;
				const stepLabel = `${label}.step(${step.id})`;
				if (step.level === 'detail' && !step.parentStepId)
					errors.push(`${stepLabel}: detail requires parentStepId`);
				if (step.level === 'story' && step.parentStepId)
					errors.push(`${stepLabel}: story cannot have parentStepId`);
				if (step.parentStepId) {
					const parent = (outline.steps || []).find(
						(candidate) => candidate.id === step.parentStepId
					);
					if (!parent || parent.level !== 'story')
						errors.push(`${stepLabel}: invalid parentStepId ${step.parentStepId}`);
				}
				for (const link of step.causalLinks || []) {
					if (!stepIds.has(link.sourceStepId))
						errors.push(`${stepLabel}: unknown causal source ${link.sourceStepId}`);
					if (!OUTLINE_RELATION.has(link.relation))
						errors.push(`${stepLabel}: invalid causal relation ${link.relation}`);
					if (!sourceLocalizedString(link.explanation)?.trim())
						errors.push(`${stepLabel}: causal explanation required`);
				}
				for (const depId of step.dependsOnStepIds || []) {
					if (depId === step.id) {
						errors.push(`${stepLabel}: dependsOnStepIds cannot reference itself`);
					} else if (!stepIds.has(depId)) {
						errors.push(`${stepLabel}: unknown dependsOnStepId ${depId}`);
					}
				}
			}
		}
	} catch (error) {
		if (error && typeof error === 'object' && 'code' in error && error.code !== 'ENOENT') {
			errors.push(`outlines: failed to read directory (${String(error)})`);
		}
	}
	for (const entry of registry) {
		const lineage = entry.lineage;
		if (!lineage?.sourceOutlineId) continue;
		const sourceRecord = outlinesById.get(lineage.sourceOutlineId);
		if (!sourceRecord)
			errors.push(`registry ${entry.id}: unknown sourceOutlineId ${lineage.sourceOutlineId}`);
		else if (
			lineage.sourceOutlineRevision &&
			sourceRecord.outline.outline?.revision !== lineage.sourceOutlineRevision
		)
			warnings.push(
				`registry ${entry.id}: source outline is r${sourceRecord.outline.outline?.revision}, lineage pins r${lineage.sourceOutlineRevision}`
			);
	}

	for (const variant of entityVariants.variants) {
		if (variant.entity?.kind === 'character' && !characterIds.has(variant.entity.id)) {
			errors.push(`entityVariant ${variant.id}: unknown character ${variant.entity.id}`);
		}
		for (const scriptId of variant.scriptIds || []) {
			if (!registryIds.has(scriptId))
				errors.push(`entityVariant ${variant.id}: unknown script ${scriptId}`);
		}
		for (const assetId of variant.referenceAssetIds || []) {
			if (!assets.assets.some((asset) => asset.id === assetId))
				errors.push(`entityVariant ${variant.id}: unknown asset ${assetId}`);
		}
	}

	const variantsById = new Map(entityVariants.variants.map((variant) => [variant.id, variant]));
	for (const [scriptId, script] of scriptsById) {
		for (const [kind, selections] of Object.entries(script.script?.entityVariantSelections || {})) {
			for (const [entityId, variantId] of Object.entries(selections || {})) {
				const variant = variantsById.get(variantId);
				if (!variant) {
					errors.push(`${scriptId}: unknown selected variant ${variantId}`);
					continue;
				}
				if (variant.entity?.kind !== kind || variant.entity?.id !== entityId) {
					errors.push(`${scriptId}: variant ${variantId} does not belong to ${kind}:${entityId}`);
				}
				if (variant.scriptIds?.length && !variant.scriptIds.includes(scriptId)) {
					errors.push(`${scriptId}: variant ${variantId} is not enabled for this script`);
				}
				if (variant.continuityId && variant.continuityId !== script.script.continuityId) {
					errors.push(`${scriptId}: variant ${variantId} has incompatible continuity`);
				}
			}
		}
	}

	const foundational = new Set(
		taxonomy.canonDimensions.filter((item) => item.foundational).map((item) => item.id)
	);
	const loadedScripts = [...scriptsById.values()];
	for (let leftIndex = 0; leftIndex < loadedScripts.length; leftIndex += 1) {
		for (let rightIndex = leftIndex + 1; rightIndex < loadedScripts.length; rightIndex += 1) {
			const left = loadedScripts[leftIndex];
			const right = loadedScripts[rightIndex];
			if (left.script.continuityId !== right.script.continuityId) continue;
			const rightClaims = new Map(
				(right.script.comparisonProfile?.canonClaims || []).map((claim) => [
					claim.dimensionId,
					claim
				])
			);
			for (const claim of left.script.comparisonProfile?.canonClaims || []) {
				if (!foundational.has(claim.dimensionId) || claim.status !== 'established') continue;
				const other = rightClaims.get(claim.dimensionId);
				if (
					other?.status === 'established' &&
					(claim.valueId || claim.statement) !== (other.valueId || other.statement)
				) {
					warnings.push(
						`${left.script.id} / ${right.script.id}: foundational conflict ${claim.dimensionId}`
					);
				}
			}
		}
	}

	if (errors.length) {
		console.error('validate:data FAILED');
		for (const e of errors) console.error(' -', e);
		process.exit(1);
	}
	console.log('validate:data OK');
	for (const warning of warnings) console.warn(' warning:', warning);
	const main = scriptsById.get(project.project.canonicalScriptId);
	console.log(
		`scripts=${scriptsById.size} scenes(authority)=${main?.scenes?.length} shots(authority)=${main?.shots?.length} assets=${assets.assets.length} outlines=${outlineCount}`
	);
}

main();
