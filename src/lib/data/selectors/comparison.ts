import type { Character } from '$lib/types/entities';
import type {
	CharacterParticipation,
	ComparisonTaxonomyFile,
	PairwiseComparison
} from '$lib/types/comparison';
import type { CanonClaim, EventCoverage } from '$lib/types/comparison';
import type { CharacterFunctionAssignment, EntityVariant, ScriptFile } from '$lib/types/script';

function compareDeclared<T extends { status: string }>(a?: T, b?: T, value?: (item: T) => string) {
	if (!a || !b) return 'unspecified' satisfies PairwiseComparison;
	const normalized = value ?? ((item: T) => JSON.stringify(item));
	return normalized(a) === normalized(b) ? 'same' : 'different';
}

function collectUsedCharacterIds(script: ScriptFile): Set<string> {
	const ids = new Set<string>();
	for (const scene of script.scenes) for (const id of scene.characterIds) ids.add(id);
	for (const cue of script.cues) {
		if (cue.type === 'dialogue') {
			ids.add(cue.speakerId);
			for (const id of cue.addresseeIds ?? []) ids.add(id);
		} else if (cue.type === 'action') {
			for (const ref of cue.participantRefs ?? []) if (ref.kind === 'character') ids.add(ref.id);
		}
	}
	for (const shot of script.shots) {
		for (const ref of shot.visibleRefs ?? []) if (ref.kind === 'character') ids.add(ref.id);
		for (const id of shot.offScreenCharacterIds ?? []) ids.add(id);
	}
	return ids;
}

function characterParticipation(script: ScriptFile): Map<string, CharacterParticipation> {
	const result = new Map<string, CharacterParticipation>();
	const ensure = (characterId: string) => {
		const current = result.get(characterId);
		if (current) return current;
		const next = { characterId, declared: false, used: false, functionAssigned: false };
		result.set(characterId, next);
		return next;
	};
	for (const ref of script.script.declaredEntityRefs ?? []) {
		if (ref.kind === 'character') ensure(ref.id).declared = true;
	}
	for (const id of collectUsedCharacterIds(script)) ensure(id).used = true;
	for (const assignment of script.script.characterFunctionAssignments ?? []) {
		ensure(assignment.characterId).functionAssigned = true;
	}
	return result;
}

function selectedVariant(script: ScriptFile, characterId: string, variants: EntityVariant[]) {
	const id = script.script.entityVariantSelections?.character?.[characterId];
	return id ? variants.find((variant) => variant.id === id) : undefined;
}

export function compareScripts(options: {
	primary: ScriptFile;
	against: ScriptFile;
	taxonomy: ComparisonTaxonomyFile;
	characters: Character[];
	variants: EntityVariant[];
}) {
	const { primary, against, taxonomy, characters, variants } = options;
	const primaryClaims = new Map(
		(primary.script.comparisonProfile?.canonClaims ?? []).map((item) => [item.dimensionId, item])
	);
	const againstClaims = new Map(
		(against.script.comparisonProfile?.canonClaims ?? []).map((item) => [item.dimensionId, item])
	);
	const primaryEvents = new Map(
		(primary.script.comparisonProfile?.eventCoverage ?? []).map((item) => [item.eventId, item])
	);
	const againstEvents = new Map(
		(against.script.comparisonProfile?.eventCoverage ?? []).map((item) => [item.eventId, item])
	);

	const canon = taxonomy.canonDimensions.map((definition) => {
		const left = primaryClaims.get(definition.id) as CanonClaim | undefined;
		const right = againstClaims.get(definition.id) as CanonClaim | undefined;
		return {
			definition,
			primary: left,
			against: right,
			comparison: compareDeclared(
				left,
				right,
				(item) => `${item.status}|${item.valueId ?? item.statement}`
			)
		};
	});

	const events = taxonomy.majorEvents.map((definition) => {
		const left = primaryEvents.get(definition.id) as EventCoverage | undefined;
		const right = againstEvents.get(definition.id) as EventCoverage | undefined;
		return {
			definition,
			primary: left,
			against: right,
			comparison: compareDeclared(left, right, (item) => item.status)
		};
	});

	const primaryParticipation = characterParticipation(primary);
	const againstParticipation = characterParticipation(against);
	const characterIds = new Set([...primaryParticipation.keys(), ...againstParticipation.keys()]);
	const cast = [...characterIds]
		.map((characterId) => ({
			character: characters.find((character) => character.id === characterId),
			characterId,
			primary: primaryParticipation.get(characterId),
			against: againstParticipation.get(characterId),
			primaryVariant: selectedVariant(primary, characterId, variants),
			againstVariant: selectedVariant(against, characterId, variants)
		}))
		.sort((a, b) =>
			(a.character?.name ?? a.characterId).localeCompare(b.character?.name ?? b.characterId)
		);

	const functions = new Map<
		string,
		{ primary: CharacterFunctionAssignment[]; against: CharacterFunctionAssignment[] }
	>();
	for (const assignment of primary.script.characterFunctionAssignments ?? []) {
		const row = functions.get(assignment.functionId) ?? { primary: [], against: [] };
		row.primary.push(assignment);
		functions.set(assignment.functionId, row);
	}
	for (const assignment of against.script.characterFunctionAssignments ?? []) {
		const row = functions.get(assignment.functionId) ?? { primary: [], against: [] };
		row.against.push(assignment);
		functions.set(assignment.functionId, row);
	}

	return { canon, events, cast, functions };
}
