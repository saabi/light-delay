import type { GenerationPlanFile } from '$lib/types/generated/production';
import type { Asset } from '$lib/types/assets';
import type { DialogueCue, ScriptFile, Take } from '$lib/types/script';
import type { ScriptId } from '$lib/types/ids';
import {
	getGenerationPlan,
	resolveRefPresence,
	type AssetPresenceStatus
} from '$lib/data/repositories/generationPlans';
import { getScript, getVoiceProfiles } from '$lib/data/repositories/index';
import { storyText } from '$lib/data/selectors/localized';
import { getLocale } from '$lib/paraglide/runtime.js';
import type { GenerationPackageFilter } from '$lib/utils/generationFilter';

export type GenerationMedium = 'image' | 'video' | 'audio';

export type GenerationRefCategory = 'keyframe' | 'visual' | 'voice_sample' | 'other';

export type GenerationPackageRef = {
	assetId: string;
	role: string;
	category: GenerationRefCategory;
	present: boolean;
	path: string | null;
	kind: string;
	status: AssetPresenceStatus;
	required?: boolean;
};

export type GenerationPackageOutput = {
	label: string;
	assetId: string;
	present: boolean;
	path: string | null;
	kind: string;
	status: AssetPresenceStatus;
};

export type GenerationPackageSource =
	| 'stretch_still'
	| 'shot_still'
	| 'stretch_video'
	| 'shot_segment'
	| 'dialogue_cue';

export type GenerationPackage = {
	id: string;
	title: string;
	medium: GenerationMedium;
	source: GenerationPackageSource;
	promptReady: boolean;
	promptPreview: string | null;
	promptStatus?: string | null;
	blockers: string[];
	refs: GenerationPackageRef[];
	outputs: GenerationPackageOutput[];
	runnable: boolean | null;
	memberShotIds?: string[];
	groupId: string;
	groupLabel: string;
	hrefs?: { animaticShot?: string };
};

export type GenerationOutputBadge =
	| 'none'
	| 'current'
	| 'needs_review'
	| 'needs_regeneration'
	| 'missing_file';

type StretchJob = NonNullable<GenerationPlanFile['visualStretchJobs']>[number];
type PlanShot = GenerationPlanFile['shots'][number];

export function refCategoryFromRole(role: string): GenerationRefCategory {
	if (role === 'voice_sample' || role.startsWith('voice_sample')) return 'voice_sample';
	if (role.startsWith('keyframe:')) return 'keyframe';
	if (
		role === 'still_reference' ||
		role === 'visual_reference' ||
		role === 'reference' ||
		role === 'image'
	) {
		return 'visual';
	}
	return 'other';
}

export function expectedKindForRole(role: string): Asset['kind'] | undefined {
	const category = refCategoryFromRole(role);
	if (category === 'voice_sample') return 'audio';
	if (category === 'keyframe' || category === 'visual') return 'image';
	return undefined;
}

export function expectedKindForOutput(label: string, medium: GenerationMedium): Asset['kind'] {
	if (label.startsWith('dialogue:')) return 'audio';
	if (label === 'video') return 'video';
	if (medium === 'audio') return 'audio';
	if (
		label === 'animaticStill' ||
		label === 'firstFrame' ||
		label === 'lastFrame' ||
		label.startsWith('panel:')
	) {
		return 'image';
	}
	if (medium === 'video') return 'video';
	return 'image';
}

export function independentStillPrompt(take: Take | undefined): string | null {
	const prompt = take?.generation?.prompt;
	if (prompt == null) return null;
	const trimmed = String(prompt).trim();
	return trimmed || null;
}

function emptyPresence(status: AssetPresenceStatus, kind: string): Pick<
	GenerationPackageOutput,
	'present' | 'path' | 'kind' | 'status'
> {
	return { present: false, path: null, kind, status };
}

function refFromAssetId(
	assetId: string | null | undefined,
	role: string,
	required = true
): GenerationPackageRef {
	const expectedKind = expectedKindForRole(role);
	const resolved = resolveRefPresence(assetId, expectedKind ? { expectedKind } : {});
	return {
		assetId: assetId || `(missing:${role})`,
		role,
		category: refCategoryFromRole(role),
		present: resolved.present,
		path: resolved.path,
		kind: resolved.kind,
		status: resolved.status,
		required
	};
}

function outputFromAssetId(
	assetId: string | null | undefined,
	label: string,
	medium: GenerationMedium,
	imageStatusOverride?: Take['imageStatus']
): GenerationPackageOutput | null {
	if (!assetId) return null;
	const expectedKind = expectedKindForOutput(label, medium);
	const resolved = resolveRefPresence(assetId, {
		expectedKind,
		imageStatusOverride
	});
	return {
		label,
		assetId,
		present: resolved.present,
		path: resolved.path,
		kind: resolved.kind,
		status: resolved.status
	};
}

/**
 * Prompt-ready is compiled/dialogue text only (plus editorial freeze).
 * Stale or missing references do not belong here — use {@link packageRefReadiness}
 * and {@link derivePackageRunnable} for generation eligibility.
 */
export function promptReadyFromCompiled(
	compiledPrompt: string | null | undefined,
	blockers: string[]
): boolean {
	if (compiledPrompt == null || !String(compiledPrompt).trim()) return false;
	if (blockers.includes('editorial_prompt_freeze_not_approved')) return false;
	return true;
}

export const STALE_REF_STATUSES: readonly AssetPresenceStatus[] = [
	'needs_review',
	'needs_regeneration',
	'needs_replacement'
];

function requiredRefs(refs: GenerationPackageRef[]): GenerationPackageRef[] {
	return refs.filter((ref) => ref.required !== false);
}

export function isRefCurrent(ref: GenerationPackageRef): boolean {
	return ref.present && ref.status === 'current';
}

export function isRefStale(ref: GenerationPackageRef): boolean {
	return ref.present && (STALE_REF_STATUSES as readonly string[]).includes(ref.status);
}

export type GenerationRefReadiness = {
	refsPresent: boolean;
	refsCurrent: boolean;
	refsReady: boolean;
};

export function packageRefReadiness(pkg: { refs: GenerationPackageRef[] }): GenerationRefReadiness {
	const required = requiredRefs(pkg.refs);
	const refsPresent = required.every((ref) => ref.present);
	const refsCurrent = required.every((ref) => isRefCurrent(ref));
	return { refsPresent, refsCurrent, refsReady: refsPresent && refsCurrent };
}

export function packageRefsPresent(pkg: { refs: GenerationPackageRef[] }): boolean {
	return packageRefReadiness(pkg).refsPresent;
}

export function packageRefsCurrent(pkg: { refs: GenerationPackageRef[] }): boolean {
	return packageRefReadiness(pkg).refsCurrent;
}

export function packageRefsReady(pkg: { refs: GenerationPackageRef[] }): boolean {
	return packageRefReadiness(pkg).refsReady;
}

/**
 * Files exist for every required ref. Does not mean they are current.
 * Prefer {@link packageRefsReady} for generation eligibility.
 */
export function packageRefsComplete(pkg: GenerationPackage): boolean {
	return packageRefsPresent(pkg);
}

/**
 * Can generate a replacement: prompt/text ready, required refs present and
 * current, no blockers. Existing output review/regeneration does not block this.
 * An explicit plan `runnable: false` (production gate) still wins.
 */
export function derivePackageRunnable(
	parts: {
		promptReady: boolean;
		refs: GenerationPackageRef[];
		blockers: string[];
	},
	planRunnable?: boolean | null
): boolean {
	if (planRunnable === false) return false;
	return (
		parts.promptReady &&
		packageRefsReady(parts) &&
		parts.blockers.length === 0
	);
}

function stretchCoveredShotIds(jobs: StretchJob[], medium: 'still' | 'video'): Set<string> {
	const ids = new Set<string>();
	for (const job of jobs) {
		if (job.medium !== medium) continue;
		for (const member of job.memberInputs || []) {
			if (member.shotId) ids.add(member.shotId);
		}
	}
	return ids;
}

function stillOutputsFromJob(job: StretchJob): GenerationPackageOutput[] {
	const outs: GenerationPackageOutput[] = [];
	for (const output of job.outputs || []) {
		if (output.assetId) {
			const row = outputFromAssetId(output.assetId, output.artifact, 'image');
			if (row) outs.push(row);
		}
		for (const panel of output.panels || []) {
			if (panel.derivedAssetId) {
				const row = outputFromAssetId(
					panel.derivedAssetId,
					`panel:${panel.order}:${panel.shotId}`,
					'image'
				);
				if (row) outs.push(row);
			}
		}
	}
	return outs;
}

function sceneGroupForShot(
	script: ScriptFile,
	shotId: string
): { groupId: string; groupLabel: string } {
	const shot = script.shots.find((item) => item.id === shotId);
	if (!shot) return { groupId: shotId, groupLabel: shotId };
	const scene = script.scenes.find((item) => item.id === shot.sceneId);
	if (!scene) return { groupId: shot.sceneId, groupLabel: shot.sceneId };
	const label = storyText(scene.title, getLocale(), { sourceLanguage: 'en' });
	return { groupId: scene.id, groupLabel: label || scene.id };
}

function sceneGroupForSceneId(
	script: ScriptFile,
	sceneId: string | undefined
): { groupId: string; groupLabel: string } {
	if (!sceneId) return { groupId: 'ungrouped', groupLabel: 'ungrouped' };
	const scene = script.scenes.find((item) => item.id === sceneId);
	if (!scene) return { groupId: sceneId, groupLabel: sceneId };
	const label = storyText(scene.title, getLocale(), { sourceLanguage: 'en' });
	return { groupId: scene.id, groupLabel: label || scene.id };
}

function imagePackageFromStretch(job: StretchJob): GenerationPackage {
	const blockers = [...(job.blockers || [])];
	const refs = (job.stillReferenceAssetIds || []).map((id) => refFromAssetId(id, 'still_reference'));
	const promptReady = promptReadyFromCompiled(job.compiledPrompt, blockers);
	return {
		id: job.id,
		title: job.stretchId,
		medium: 'image',
		source: 'stretch_still',
		promptReady,
		promptPreview: job.compiledPrompt,
		blockers,
		refs,
		outputs: stillOutputsFromJob(job),
		runnable: derivePackageRunnable({ promptReady, refs, blockers }, job.runnable),
		memberShotIds: (job.memberInputs || []).map((m) => m.shotId),
		groupId: job.stretchId,
		groupLabel: job.stretchId
	};
}

function imagePackageFromShot(shot: PlanShot, script: ScriptFile): GenerationPackage {
	const blockers = [...(shot.blockers || [])];
	const refs = (shot.requiredReferences || [])
		.filter((r) => r.kind === 'image')
		.map((r) => refFromAssetId(r.id, r.role || 'reference', r.required !== false));
	const scriptShot = script.shots.find((s) => s.id === shot.shotId);
	const selectedTake = scriptShot
		? script.takes.find((t) => t.id === scriptShot.selectedTakeId)
		: undefined;
	const promptPreview = independentStillPrompt(selectedTake);
	const outputs: GenerationPackageOutput[] = [];
	const still = outputFromAssetId(
		shot.artifacts?.animaticStill?.assetId || selectedTake?.imageAssetId,
		'animaticStill',
		'image',
		selectedTake?.imageStatus
	);
	if (still) outputs.push(still);
	const group = sceneGroupForShot(script, shot.shotId);
	const promptReady = promptReadyFromCompiled(promptPreview, blockers);
	return {
		id: `shot-still:${shot.shotId}`,
		title: shot.shotId,
		medium: 'image',
		source: 'shot_still',
		promptReady,
		promptPreview,
		blockers,
		refs,
		outputs,
		runnable: derivePackageRunnable({ promptReady, refs, blockers }),
		memberShotIds: [shot.shotId],
		groupId: group.groupId,
		groupLabel: group.groupLabel
	};
}

function videoPackageFromStretch(job: StretchJob): GenerationPackage {
	const blockers = [...(job.blockers || [])];
	const refs: GenerationPackageRef[] = [];
	for (const member of job.memberInputs || []) {
		refs.push(
			refFromAssetId(member.keyframeAssetId, `keyframe:${member.order}:${member.shotId}`, true)
		);
	}
	for (const id of job.effectiveVideoReferenceAssetIds || []) {
		refs.push(refFromAssetId(id, 'visual_reference'));
	}
	for (const id of job.voiceSampleAssetIds || []) {
		refs.push(refFromAssetId(id, 'voice_sample'));
	}
	const outputs: GenerationPackageOutput[] = [];
	for (const output of job.outputs || []) {
		if (output.artifact === 'video') {
			if (output.assetId) {
				const row = outputFromAssetId(output.assetId, 'video', 'video');
				if (row) outputs.push(row);
			} else {
				outputs.push({
					label: 'video',
					assetId: '',
					...emptyPresence('missing_catalog_entry', 'video')
				});
			}
		}
	}
	const promptReady = promptReadyFromCompiled(job.compiledPrompt, blockers);
	return {
		id: job.id,
		title: job.stretchId,
		medium: 'video',
		source: 'stretch_video',
		promptReady,
		promptPreview: job.compiledPrompt,
		blockers,
		refs,
		outputs,
		runnable: derivePackageRunnable({ promptReady, refs, blockers }, job.runnable),
		memberShotIds: (job.memberInputs || []).map((m) => m.shotId),
		groupId: job.stretchId,
		groupLabel: job.stretchId
	};
}

function videoPackageFromSegment(
	shot: PlanShot,
	segment: PlanShot['segments'][number],
	script: ScriptFile
): GenerationPackage {
	const blockers = [
		...(shot.blockers || []),
		...((segment.blockers as string[] | undefined) || [])
	];
	const freeze = blockers.includes('editorial_prompt_freeze_not_approved');
	const refs = (shot.requiredReferences || []).map((r) =>
		refFromAssetId(r.id, r.role || r.kind, r.required !== false)
	);
	const outputs: GenerationPackageOutput[] = [];
	const first = outputFromAssetId(shot.artifacts?.firstFrame?.assetId, 'firstFrame', 'image');
	const last = outputFromAssetId(shot.artifacts?.lastFrame?.assetId, 'lastFrame', 'image');
	if (first) outputs.push(first);
	if (last) outputs.push(last);
	const promptReady =
		!freeze &&
		segment.compiledPrompt != null &&
		String(segment.compiledPrompt).trim().length > 0 &&
		(segment.promptStatus === 'ready' || segment.promptStatus === 'frozen');
	const group = sceneGroupForShot(script, shot.shotId);
	return {
		id: `segment:${segment.id}`,
		title: `${shot.shotId} · ${segment.id}`,
		medium: 'video',
		source: 'shot_segment',
		promptReady,
		promptPreview: segment.compiledPrompt,
		promptStatus: segment.promptStatus,
		blockers,
		refs,
		outputs,
		runnable: derivePackageRunnable({ promptReady, refs, blockers }),
		memberShotIds: [shot.shotId],
		groupId: group.groupId,
		groupLabel: group.groupLabel
	};
}

function voiceSampleIdsForSpeaker(characterId: string, language: string): string[] {
	const profiles = getVoiceProfiles().voiceProfiles || [];
	const profile = profiles.find((p) => p.characterId === characterId);
	if (!profile) return [];
	const variant =
		profile.variants?.find((v) => v.language === language) ||
		profile.variants?.find((v) => v.language === 'en');
	return [...(variant?.sampleAssetIds || [])];
}

function audioPackageFromCue(
	cue: DialogueCue,
	language: 'en' | 'es',
	script: ScriptFile,
	sceneId: string | undefined,
	shotIds: string[] | undefined
): GenerationPackage | null {
	const variant = cue.content?.variants?.[language];
	const enText = cue.content?.variants?.en?.spokenText?.trim() || '';
	const text = variant?.spokenText?.trim() || '';
	if (language === 'es' && !text && !variant?.audioAssetId) return null;
	const sampleIds = voiceSampleIdsForSpeaker(cue.speakerId, language === 'es' ? 'es' : 'en');
	const refs = sampleIds.length
		? sampleIds.map((id) => refFromAssetId(id, 'voice_sample'))
		: [refFromAssetId(null, 'voice_sample')];
	const outputs: GenerationPackageOutput[] = [];
	const audioOut = outputFromAssetId(variant?.audioAssetId, `dialogue:${language}`, 'audio');
	if (audioOut) outputs.push(audioOut);
	else if (language === 'en') {
		outputs.push({
			label: `dialogue:${language}`,
			assetId: '',
			...emptyPresence('missing_catalog_entry', 'audio')
		});
	}
	const promptReady = Boolean(enText || (language === 'es' && text));
	const blockers: string[] = [];
	if (!promptReady) blockers.push('missing_dialogue_text');
	if (refs.some((ref) => ref.required !== false && !ref.present)) {
		blockers.push('missing_voice_sample');
	}
	const group = sceneGroupForSceneId(script, sceneId);
	return {
		id: `cue:${cue.id}:${language}`,
		title: `${cue.id} · ${cue.speakerId} · ${language}`,
		medium: 'audio',
		source: 'dialogue_cue',
		promptReady,
		promptPreview: text || enText || null,
		blockers,
		refs,
		outputs,
		runnable: derivePackageRunnable({ promptReady, refs, blockers }),
		memberShotIds: shotIds,
		groupId: group.groupId,
		groupLabel: group.groupLabel
	};
}

export function listImagePackages(scriptId: ScriptId | string): GenerationPackage[] {
	const plan = getGenerationPlan(scriptId);
	if (!plan) return [];
	const script = getScript(scriptId as ScriptId);
	const jobs = plan.visualStretchJobs || [];
	const covered = stretchCoveredShotIds(jobs, 'still');
	const packages: GenerationPackage[] = [];
	for (const job of jobs) {
		if (job.medium === 'still') packages.push(imagePackageFromStretch(job));
	}
	for (const shot of plan.shots || []) {
		if (covered.has(shot.shotId)) continue;
		packages.push(imagePackageFromShot(shot, script));
	}
	return packages;
}

export function listVideoPackages(scriptId: ScriptId | string): GenerationPackage[] {
	const plan = getGenerationPlan(scriptId);
	if (!plan) return [];
	const script = getScript(scriptId as ScriptId);
	const jobs = plan.visualStretchJobs || [];
	const covered = stretchCoveredShotIds(jobs, 'video');
	const packages: GenerationPackage[] = [];
	for (const job of jobs) {
		if (job.medium === 'video') packages.push(videoPackageFromStretch(job));
	}
	for (const shot of plan.shots || []) {
		if (covered.has(shot.shotId)) continue;
		for (const segment of shot.segments || []) {
			packages.push(videoPackageFromSegment(shot, segment, script));
		}
	}
	return packages;
}

export function listAudioPackages(scriptId: ScriptId | string): GenerationPackage[] {
	const script = getScript(scriptId as ScriptId);
	const beatToScene = new Map((script.beats || []).map((b) => [b.id, b.sceneId] as const));
	const sceneShotIds = new Map(
		(script.scenes || []).map((scene) => {
			const shots = (script.shots || [])
				.filter((shot) => shot.sceneId === scene.id)
				.map((shot) => shot.id);
			return [scene.id, shots] as const;
		})
	);
	const packages: GenerationPackage[] = [];
	for (const cue of script.cues || []) {
		if (cue.type !== 'dialogue') continue;
		const sceneId = beatToScene.get(cue.beatId);
		const shotIds = sceneId ? sceneShotIds.get(sceneId) : undefined;
		const en = audioPackageFromCue(cue, 'en', script, sceneId, shotIds);
		if (en) packages.push(en);
		const es = audioPackageFromCue(cue, 'es', script, sceneId, shotIds);
		if (es && (es.promptPreview || es.outputs.some((o) => o.assetId))) packages.push(es);
	}
	return packages;
}

export function packageHasOutput(pkg: GenerationPackage): boolean {
	return pkg.outputs.some((o) => o.present);
}

export function packageOutputStatus(pkg: GenerationPackage): GenerationOutputBadge {
	if (!pkg.outputs.length) return 'none';
	const catalogued = pkg.outputs.filter((o) => o.assetId);
	if (catalogued.some((o) => !o.present)) return 'missing_file';
	if (!pkg.outputs.some((o) => o.present)) return 'none';
	if (
		pkg.outputs.some(
			(o) => o.status === 'needs_regeneration' || o.status === 'needs_replacement'
		)
	) {
		return 'needs_regeneration';
	}
	if (pkg.outputs.some((o) => o.status === 'needs_review')) return 'needs_review';
	return 'current';
}

export function filterPackages(
	packages: GenerationPackage[],
	filter: GenerationPackageFilter
): GenerationPackage[] {
	switch (filter) {
		case 'prompt_ready':
			return packages.filter((p) => p.promptReady);
		case 'refs_complete':
			return packages.filter((p) => packageRefsPresent(p));
		case 'refs_ready':
			return packages.filter((p) => packageRefsReady(p));
		case 'has_output':
			return packages.filter((p) => packageHasOutput(p));
		case 'blocked':
			return packages.filter((p) => p.blockers.length > 0);
		default:
			return packages;
	}
}

export function groupPackages(packages: GenerationPackage[]): {
	id: string;
	label: string;
	packages: GenerationPackage[];
}[] {
	const groups: { id: string; label: string; packages: GenerationPackage[] }[] = [];
	const index = new Map<string, number>();
	for (const pkg of packages) {
		const existing = index.get(pkg.groupId);
		if (existing == null) {
			index.set(pkg.groupId, groups.length);
			groups.push({ id: pkg.groupId, label: pkg.groupLabel, packages: [pkg] });
		} else {
			groups[existing].packages.push(pkg);
		}
	}
	return groups;
}

export function summarizePackages(packages: GenerationPackage[]) {
	const outputStatuses = packages.map(packageOutputStatus);
	return {
		total: packages.length,
		promptReady: packages.filter((p) => p.promptReady).length,
		refsPresent: packages.filter((p) => packageRefsPresent(p)).length,
		refsComplete: packages.filter((p) => packageRefsPresent(p)).length,
		refsReady: packages.filter((p) => packageRefsReady(p)).length,
		canGenerate: packages.filter((p) => p.runnable === true).length,
		hasOutput: packages.filter((p) => packageHasOutput(p)).length,
		outputCurrent: outputStatuses.filter((s) => s === 'current').length,
		outputNeedsReview: outputStatuses.filter((s) => s === 'needs_review').length,
		outputNeedsRegeneration: outputStatuses.filter((s) => s === 'needs_regeneration').length,
		outputMissingFile: outputStatuses.filter((s) => s === 'missing_file').length,
		blocked: packages.filter((p) => p.blockers.length > 0).length
	};
}

export function packageManifestPayload(pkg: GenerationPackage) {
	const refs = packageRefReadiness(pkg);
	return {
		id: pkg.id,
		title: pkg.title,
		medium: pkg.medium,
		source: pkg.source,
		prompt: pkg.promptPreview,
		promptReady: pkg.promptReady,
		refsPresent: refs.refsPresent,
		refsCurrent: refs.refsCurrent,
		refsReady: refs.refsReady,
		canGenerate: pkg.runnable === true,
		runnable: pkg.runnable,
		blockers: pkg.blockers,
		refs: pkg.refs.map((ref) => ({
			assetId: ref.assetId,
			role: ref.role,
			category: ref.category,
			present: ref.present,
			status: ref.status,
			path: ref.path,
			kind: ref.kind,
			required: ref.required !== false
		})),
		outputs: pkg.outputs.map((out) => ({
			label: out.label,
			assetId: out.assetId,
			present: out.present,
			status: out.status,
			path: out.path,
			kind: out.kind
		}))
	};
}
