/**
 * Blocker-tolerant Seedance stretch video preview compiler.
 * Assembles the 11 compilePrompt sections without calling strict compilePrompt
 * (which throws on blockers). Frozen plan jobs use compileStretchVideoPromptForPlan
 * when freeze + executable gates are clear.
 */
import { compilePrompt } from './generation-planning.mjs';
import { formatBlockingForPrompt } from './visual-stretch.mjs';

const SECTION_ORDER = [
	'style',
	'actionTiming',
	'subjects',
	'location',
	'camera',
	'lighting',
	'physics',
	'interfaceVfx',
	'continuity',
	'audio',
	'negative'
];

export const VIDEO_PROMPT_BLOCKED_TOKEN = '[blocked: unavailable until stretch blockers clear]';
const BLOCKED = VIDEO_PROMPT_BLOCKED_TOKEN;

/**
 * @param {string | null | undefined} value
 * @param {string} [fallback]
 */
function textOrBlocked(value, fallback = BLOCKED) {
	const trimmed = typeof value === 'string' ? value.trim() : '';
	return trimmed || fallback;
}

/**
 * @param {{ role?: string, id?: string, assetId?: string, kind?: string, entityIds?: string[] }} ref
 * @param {number} index
 */
function roleLabel(ref, index) {
	const role = ref.role || 'reference';
	const id = ref.assetId || ref.id || `ref-${index + 1}`;
	const entities = Array.isArray(ref.entityIds) && ref.entityIds.length ? `, entity map: ${ref.entityIds.join(', ')}` : '';
	if (role === 'voice_sample' || ref.kind === 'audio') return `@Audio (${id}, voice sample${entities})`;
	if (role === 'keyframe' || role.startsWith('keyframe')) return `@Image${index + 1} (${id}, ordered keyframe)`;
	return `@Image${index + 1} (${id}, ${role}${entities})`;
}

const CHARACTER_NAMES = {
	'character:voss': 'Captain Elias Voss',
	'character:harlan': 'Commander Rylen Harlan',
	'character:sorell': 'Dr. Lian Sorell',
	'character:rao': 'Elin Rao',
	'character:zao': 'Chief Engineer Zao',
	'character:okoye': 'Lt. Commander Dara Okoye',
	'character:periodista': 'the Earth reporter'
};

function displayName(id) { return CHARACTER_NAMES[id] || id; }

/** @param {Array<any>} refs */
function makeReferenceMap(refs) {
	const imageRefs = refs.filter((r) => r.kind !== 'audio');
	const audioRefs = refs.filter((r) => r.kind === 'audio');
	const byEntity = new Map();
	for (const ref of imageRefs) for (const entityId of ref.entityIds || []) byEntity.set(entityId, ref);
	const voiceByEntity = new Map();
	for (const ref of audioRefs) for (const entityId of ref.entityIds || []) voiceByEntity.set(entityId, ref);
	return { imageRefs, audioRefs, byEntity, voiceByEntity };
}

/**
 * Preview compiler for grouped_seedance stretch buckets.
 * @param {{
 *   stretch: any,
 *   job: any,
 *   script: any,
 *   effectiveReferences?: Array<{ role?: string, id?: string, assetId?: string, kind?: string, entityIds?: string[] }>,
 *   blockers?: string[]
 * }} args
 * @returns {{ sections: Record<string, string>, preview: string, blockers: string[], negativeEn: string }}
 */
export function compileStretchVideoPrompt({
	stretch,
	job,
	script,
	effectiveReferences = [],
	blockers = []
}) {
	const shotsById = new Map((script.shots || []).map(/** @param {any} s */ (s) => [s.id, s]));
	const cuesById = new Map((script.cues || []).map(/** @param {any} c */ (c) => [c.id, c]));
	const members = [...(stretch.members || [])]
		.filter(/** @param {any} m */ (m) => (job.memberInputs || []).some(/** @param {any} mi */ (mi) => mi.shotId === m.shotId))
		.sort(/** @param {any} a @param {any} b */ (a, b) => a.order - b.order);
	const referenceMap = makeReferenceMap(effectiveReferences);

	const stageLines = members.map((member, index) => {
		const shot = shotsById.get(member.shotId);
		const durationMs = shot?.durationMs ?? 0;
		const start = member.startState?.en?.trim();
		const event = member.event?.en?.trim();
		const end = member.endState?.en?.trim();
		const description = shot?.description?.en?.trim();
		const previous = index > 0 ? members[index - 1].endState?.en?.trim() : null;
		const delta = member.visualDelta?.en?.trim();
		const camera = member.camera?.en?.trim() || shot?.camera?.movementDescription?.en?.trim() || shot?.camera?.movement;
		return [
			`Stage ${index + 1} (${member.shotId}, ~${Math.round(durationMs / 1000)}s):`,
			previous ? `continue from prior settled state: ${previous}` : null,
			start ? `start: ${start}` : null,
			event ? `event: ${event}` : null,
			delta ? `visual change: ${delta}` : null,
			camera ? `camera progression: ${camera}` : null,
			end ? `end: ${end}` : null,
			description ? `shot description: ${description}` : null
		]
			.filter(Boolean)
			.join(' ');
	});

	const dialogueLines = [];
	const dialogueBlockers = [];
	for (const member of members) {
		const shot = shotsById.get(member.shotId);
		for (const placement of shot?.cuePlacements || []) {
			const cue = cuesById.get(placement.cueId);
			if (cue?.type !== 'dialogue') continue;
			const line =
				cue.content?.variants?.en?.spokenText?.trim() ||
				cue.content?.variants?.en?.text?.trim();
			if (!line) continue;
			const speakerId = cue.speakerId || 'speaker';
			const imageRef = referenceMap.byEntity.get(speakerId);
			const voiceRef = referenceMap.voiceByEntity.get(speakerId);
			if (!imageRef) dialogueBlockers.push(`unmapped_dialogue_character:${speakerId}`);
			if (!voiceRef) dialogueBlockers.push(`unmapped_dialogue_voice:${speakerId}`);
			const performance = cue.performance?.en || cue.delivery?.en || cue.content?.variants?.en?.performance;
			dialogueLines.push(
				`${displayName(speakerId)} [${speakerId}] at ~${placement.atMs ?? 0}ms in ${member.shotId} (image ${imageRef?.assetId || 'UNMAPPED'}, voice ${voiceRef?.assetId || 'UNMAPPED'}${performance ? `, performance: ${performance}` : ''}): {${line}}`
			);
		}
	}

	const refMap = effectiveReferences.length
		? effectiveReferences.map((ref, index) => roleLabel(ref, index)).join('; ')
		: BLOCKED;

	const cameraBits = members
		.map((member) => {
			const shot = shotsById.get(member.shotId);
			const movement =
				shot?.camera?.movementDescription?.en?.trim() ||
				shot?.camera?.movement ||
				shot?.composition?.size;
			return movement ? `${member.shotId}: ${movement}` : null;
		})
		.filter(Boolean)
		.join('; ');

	/** Visible cast for this video bucket only (not the whole stretch). */
	const presentIds = new Set();
	for (const member of members) {
		const shot = shotsById.get(member.shotId);
		for (const ref of shot?.visibleRefs || []) {
			if (ref?.kind === 'character' && ref.id) presentIds.add(ref.id);
		}
	}
	const present =
		[...presentIds].sort().join(', ') ||
		(stretch.presentCharacterIds || []).join(', ') ||
		BLOCKED;
	const presentSet = new Set(presentIds.size ? presentIds : stretch.presentCharacterIds || []);
	const blocking = formatBlockingForPrompt(
		(stretch.blocking || []).filter((row) => presentSet.has(row.characterId))
	);

	/** @type {Record<string, string>} */
	const sections = {
		style: textOrBlocked(
			'Grounded cinematic hard-science-fiction continuous take, photorealistic VFX, Seedance 2.5. Attached keyframes establish composition; attached character sheets establish identity.',
			BLOCKED
		),
		actionTiming: textOrBlocked(stageLines.join(' | '), BLOCKED),
		subjects: textOrBlocked(
			`Present cast: ${present}. Reference map: ${refMap}. For every spoken cue, match the named speaker to that speaker's individual image reference and voice sample; do not infer identity from keyframes alone.`,
			BLOCKED
		),
		location: textOrBlocked(
			stretch.locationId
				? `Location ${stretch.locationId}. Ignore people in location stills.`
				: null,
			BLOCKED
		),
		camera: textOrBlocked(
			cameraBits || 'Hold the attached ordered-keyframe compositions; no unmotivated axis jump.',
			BLOCKED
		),
		lighting: textOrBlocked(stretch.lighting?.en, BLOCKED),
		physics: textOrBlocked(stretch.physics?.en, BLOCKED),
		interfaceVfx: textOrBlocked(
			'English-only diegetic UI when visible; no subtitle burn-in; no logos or watermark.',
			BLOCKED
		),
		continuity: textOrBlocked(
			[
				stretch.sharedDescription?.en,
				blocking ? `Blocking:\n${blocking}` : null,
				'Preserve screen direction, seating, eyelines, wardrobe, props, lighting, gravity/thrust, and motion direction across stages. Continue each stage from the previous settled end state; preserve momentum and camera-axis continuity without teleporting, resetting blocking, or inventing transitions.'
			]
				.filter(Boolean)
				.join(' '),
			BLOCKED
		),
		audio: textOrBlocked(
			dialogueLines.length
				? `Voice samples attached; perform cues from samples + text. ${dialogueLines.join(' ')}`
				: 'No dialogue cues in this bucket; ambient bridge only unless samples attached.',
			BLOCKED
		),
			negative: textOrBlocked(
			'No identity swaps, ambiguous speaker assignment, extra cast, discontinuous motion, camera-axis jump, teleporting, gravity error, zero-g drift during thrust, invented dialogue, spoken-line subtitle burn-in, logos, watermark, or background music.',
			BLOCKED
		)
	};

	const preview = SECTION_ORDER.map((key) => `${key}: ${sections[key]}`).join('\n');
	const mergedBlockers = [...new Set([...(blockers || []), ...(job.blockers || []), ...dialogueBlockers])];

	return {
		sections,
		preview,
		blockers: mergedBlockers,
		negativeEn: sections.negative
	};
}

/**
 * Plan/handoff compile: add section-blocked codes and only compile when nothing is blocked.
 * @param {Parameters<typeof compileStretchVideoPrompt>[0]} args
 */
export function compileStretchVideoPromptForPlan(args) {
	const result = compileStretchVideoPrompt(args);
	const blockedSections = SECTION_ORDER.filter((key) =>
		String(result.sections[key] || '').includes('[blocked:')
	);
	const blockers = [
		...new Set([
			...result.blockers,
			...blockedSections.map((key) => `video_prompt_section_blocked:${key}`)
		])
	];
	if (blockers.length) {
		return { ...result, blockers, compiled: null };
	}
	return {
		...result,
		blockers,
		compiled: compilePrompt(result.sections, [])
	};
}

/**
 * Strict path — throws if blockers remain or sections are empty / still placeholders.
 * @param {Parameters<typeof compileStretchVideoPrompt>[0]} args
 */
export function compileStretchVideoPromptStrict(args) {
	const result = compileStretchVideoPromptForPlan(args);
	const compiled = compilePrompt(result.sections, result.blockers);
	return {
		...result,
		compiled
	};
}
