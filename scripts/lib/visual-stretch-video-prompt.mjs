/**
 * Blocker-tolerant Seedance stretch video preview compiler.
 * Assembles the 11 compilePrompt sections without calling strict compilePrompt
 * (which throws on blockers). Future freeze path should call compilePrompt when blockers are empty.
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

const BLOCKED = '[blocked: unavailable until stretch blockers clear]';

/**
 * @param {string | null | undefined} value
 * @param {string} [fallback]
 */
function textOrBlocked(value, fallback = BLOCKED) {
	const trimmed = typeof value === 'string' ? value.trim() : '';
	return trimmed || fallback;
}

/**
 * @param {{ role?: string, id?: string, assetId?: string, kind?: string }} ref
 * @param {number} index
 */
function roleLabel(ref, index) {
	const role = ref.role || 'reference';
	const id = ref.assetId || ref.id || `ref-${index + 1}`;
	if (role === 'keyframe' || role.startsWith('keyframe')) return `@Image${index + 1} (${id}, ordered keyframe)`;
	if (role === 'voice_sample' || ref.kind === 'audio') return `@Audio (${id}, voice sample)`;
	return `@Image (${id}, ${role})`;
}

/**
 * Preview compiler for grouped_seedance stretch buckets.
 * @param {{
 *   stretch: any,
 *   job: any,
 *   script: any,
 *   effectiveReferences?: Array<{ role?: string, id?: string, assetId?: string, kind?: string }>,
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

	const stageLines = members.map((member, index) => {
		const shot = shotsById.get(member.shotId);
		const durationMs = shot?.durationMs ?? 0;
		const start = member.startState?.en?.trim();
		const event = member.event?.en?.trim();
		const end = member.endState?.en?.trim();
		const description = shot?.description?.en?.trim();
		return [
			`Stage ${index + 1} (${member.shotId}, ~${Math.round(durationMs / 1000)}s):`,
			start ? `start: ${start}` : null,
			event ? `event: ${event}` : null,
			end ? `end: ${end}` : null,
			description ? `shot description: ${description}` : null
		]
			.filter(Boolean)
			.join(' ');
	});

	const dialogueLines = [];
	for (const member of members) {
		const shot = shotsById.get(member.shotId);
		for (const placement of shot?.cuePlacements || []) {
			const cue = cuesById.get(placement.cueId);
			if (cue?.type !== 'dialogue') continue;
			const line = cue.content?.variants?.en?.text?.trim();
			if (!line) continue;
			dialogueLines.push(
				`${cue.speakerId || 'speaker'} at ~${placement.atMs ?? 0}ms in ${member.shotId}: {${line}}`
			);
		}
	}

	const refMap = effectiveReferences.length
		? effectiveReferences.map((ref, index) => roleLabel(ref, index)).join('; ')
		: BLOCKED;

	const cameraBits = members
		.map((member) => {
			const shot = shotsById.get(member.shotId);
			const move = shot?.camera?.move || shot?.composition?.size;
			return move ? `${member.shotId}: ${move}` : null;
		})
		.filter(Boolean)
		.join('; ');

	const blocking = formatBlockingForPrompt(stretch.blocking);
	const present = (stretch.presentCharacterIds || []).join(', ') || BLOCKED;

	/** @type {Record<string, string>} */
	const sections = {
		style: textOrBlocked(
			'Grounded cinematic hard-science-fiction continuous take, photorealistic VFX, Seedance 2.5.',
			BLOCKED
		),
		actionTiming: textOrBlocked(stageLines.join(' | '), BLOCKED),
		subjects: textOrBlocked(
			`Present cast: ${present}. Reference map: ${refMap}. Lock identity to attached sheets.`,
			BLOCKED
		),
		location: textOrBlocked(
			stretch.locationId
				? `Location ${stretch.locationId}. Ignore people in location stills.`
				: null,
			BLOCKED
		),
		camera: textOrBlocked(cameraBits, BLOCKED),
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
				'Preserve screen direction and seating across stages.'
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
			'No redesign of attached character/location sheets; no extra cast; no zero-g drift while gravity is 1g; no spoken-line subtitle burn-in.',
			BLOCKED
		)
	};

	const preview = SECTION_ORDER.map((key) => `${key}: ${sections[key]}`).join('\n');
	const mergedBlockers = [...new Set([...(blockers || []), ...(job.blockers || [])])];

	return {
		sections,
		preview,
		blockers: mergedBlockers,
		negativeEn: sections.negative
	};
}

/**
 * Strict path for a future freeze CLI — throws if blockers remain or sections are empty.
 * @param {Parameters<typeof compileStretchVideoPrompt>[0]} args
 */
export function compileStretchVideoPromptStrict(args) {
	const result = compileStretchVideoPrompt(args);
	const compiled = compilePrompt(result.sections, result.blockers);
	return {
		...result,
		compiled
	};
}
