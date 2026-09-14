import type { GenerationPlanFile } from '$lib/types/generated/production';
import type { DialogueCue, ScriptFile } from '$lib/types/script';
import type { ScriptId } from '$lib/types/ids';
import { getGenerationPlan, resolveRefPresence } from '$lib/data/repositories/generationPlans';
import { getScript, getVoiceProfiles } from '$lib/data/repositories/index';

export type GenerationMedium = 'image' | 'video' | 'audio';

export type GenerationPackageRef = {
	assetId: string;
	role: string;
	present: boolean;
	path: string | null;
	kind: string;
	required?: boolean;
};

export type GenerationPackageOutput = {
	label: string;
	assetId: string;
	present: boolean;
	path: string | null;
	kind: string;
};

export type GenerationPackage = {
	id: string;
	title: string;
	medium: GenerationMedium;
	source: 'stretch_still' | 'shot_still' | 'stretch_video' | 'shot_segment' | 'dialogue_cue';
	promptReady: boolean;
	promptPreview: string | null;
	promptStatus?: string | null;
	blockers: string[];
	refs: GenerationPackageRef[];
	outputs: GenerationPackageOutput[];
	runnable: boolean | null;
	memberShotIds?: string[];
	hrefs?: { animaticShot?: string };
};

type StretchJob = NonNullable<GenerationPlanFile['visualStretchJobs']>[number];
type PlanShot = GenerationPlanFile['shots'][number];

function refFromAssetId(
	assetId: string | null | undefined,
	role: string,
	required = true
): GenerationPackageRef {
	const resolved = resolveRefPresence(assetId);
	return {
		assetId: assetId || `(missing:${role})`,
		role,
		present: resolved.present,
		path: resolved.path,
		kind: resolved.kind,
		required
	};
}

function outputFromAssetId(
	assetId: string | null | undefined,
	label: string
): GenerationPackageOutput | null {
	if (!assetId) return null;
	const resolved = resolveRefPresence(assetId);
	return {
		label,
		assetId,
		present: resolved.present,
		path: resolved.path,
		kind: resolved.kind
	};
}

function promptReadyFromCompiled(
	compiledPrompt: string | null | undefined,
	blockers: string[]
): boolean {
	if (compiledPrompt == null || !String(compiledPrompt).trim()) return false;
	if (blockers.includes('editorial_prompt_freeze_not_approved')) return false;
	return true;
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
			const row = outputFromAssetId(output.assetId, output.artifact);
			if (row) outs.push(row);
		}
		for (const panel of output.panels || []) {
			if (panel.derivedAssetId) {
				const row = outputFromAssetId(
					panel.derivedAssetId,
					`panel:${panel.order}:${panel.shotId}`
				);
				if (row) outs.push(row);
			}
		}
	}
	return outs;
}

function imagePackageFromStretch(job: StretchJob): GenerationPackage {
	const blockers = [...(job.blockers || [])];
	const refs = (job.stillReferenceAssetIds || []).map((id) => refFromAssetId(id, 'still_reference'));
	return {
		id: job.id,
		title: job.stretchId,
		medium: 'image',
		source: 'stretch_still',
		promptReady: promptReadyFromCompiled(job.compiledPrompt, blockers),
		promptPreview: job.compiledPrompt,
		blockers,
		refs,
		outputs: stillOutputsFromJob(job),
		runnable: job.runnable ?? null,
		memberShotIds: (job.memberInputs || []).map((m) => m.shotId)
	};
}

function imagePackageFromShot(shot: PlanShot, script: ScriptFile): GenerationPackage {
	const blockers = [...(shot.blockers || [])];
	const freeze = blockers.includes('editorial_prompt_freeze_not_approved');
	const refs = (shot.requiredReferences || [])
		.filter((r) => r.kind === 'image')
		.map((r) => refFromAssetId(r.id, r.role || 'reference', r.required !== false));
	const scriptShot = script.shots.find((s) => s.id === shot.shotId);
	const selectedTake = scriptShot
		? script.takes.find((t) => t.id === scriptShot.selectedTakeId)
		: undefined;
	const outputs: GenerationPackageOutput[] = [];
	const still = outputFromAssetId(
		shot.artifacts?.animaticStill?.assetId || selectedTake?.imageAssetId,
		'animaticStill'
	);
	if (still) outputs.push(still);
	const promptReady = !freeze && refs.every((r) => !r.required || r.present);
	return {
		id: `shot-still:${shot.shotId}`,
		title: shot.shotId,
		medium: 'image',
		source: 'shot_still',
		promptReady,
		promptPreview: null,
		blockers,
		refs,
		outputs,
		runnable: shot.status === 'ready' || shot.status === 'frozen' ? blockers.length === 0 : false,
		memberShotIds: [shot.shotId]
	};
}

function videoPackageFromStretch(job: StretchJob): GenerationPackage {
	const blockers = [...(job.blockers || [])];
	const refs: GenerationPackageRef[] = [];
	for (const member of job.memberInputs || []) {
		refs.push(
			refFromAssetId(
				member.keyframeAssetId,
				`keyframe:${member.order}:${member.shotId}`,
				true
			)
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
				const row = outputFromAssetId(output.assetId, 'video');
				if (row) outputs.push(row);
			} else {
				outputs.push({
					label: 'video',
					assetId: '',
					present: false,
					path: null,
					kind: 'video'
				});
			}
		}
	}
	return {
		id: job.id,
		title: job.stretchId,
		medium: 'video',
		source: 'stretch_video',
		promptReady: promptReadyFromCompiled(job.compiledPrompt, blockers),
		promptPreview: job.compiledPrompt,
		blockers,
		refs,
		outputs,
		runnable: job.runnable ?? null,
		memberShotIds: (job.memberInputs || []).map((m) => m.shotId)
	};
}

function videoPackageFromSegment(shot: PlanShot, segment: PlanShot['segments'][number]): GenerationPackage {
	const blockers = [
		...(shot.blockers || []),
		...((segment.blockers as string[] | undefined) || [])
	];
	const freeze = blockers.includes('editorial_prompt_freeze_not_approved');
	const refs = (shot.requiredReferences || []).map((r) =>
		refFromAssetId(r.id, r.role || r.kind, r.required !== false)
	);
	const outputs: GenerationPackageOutput[] = [];
	const first = outputFromAssetId(shot.artifacts?.firstFrame?.assetId, 'firstFrame');
	const last = outputFromAssetId(shot.artifacts?.lastFrame?.assetId, 'lastFrame');
	if (first) outputs.push(first);
	if (last) outputs.push(last);
	const promptReady =
		!freeze &&
		segment.compiledPrompt != null &&
		String(segment.compiledPrompt).trim().length > 0 &&
		(segment.promptStatus === 'ready' || segment.promptStatus === 'frozen');
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
		runnable: promptReady && blockers.length === 0,
		memberShotIds: [shot.shotId]
	};
}

function voiceSampleIdsForSpeaker(
	characterId: string,
	language: string
): string[] {
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
	const audioOut = outputFromAssetId(variant?.audioAssetId, `dialogue:${language}`);
	if (audioOut) outputs.push(audioOut);
	else if (language === 'en') {
		outputs.push({
			label: `dialogue:${language}`,
			assetId: '',
			present: false,
			path: null,
			kind: 'audio'
		});
	}
	const promptReady = Boolean(enText || (language === 'es' && text));
	return {
		id: `cue:${cue.id}:${language}`,
		title: `${cue.id} · ${cue.speakerId} · ${language}`,
		medium: 'audio',
		source: 'dialogue_cue',
		promptReady,
		promptPreview: text || enText || null,
		blockers: promptReady ? [] : ['missing_dialogue_text'],
		refs,
		outputs,
		runnable: null,
		memberShotIds: shotIds
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
	const jobs = plan.visualStretchJobs || [];
	const covered = stretchCoveredShotIds(jobs, 'video');
	const packages: GenerationPackage[] = [];
	for (const job of jobs) {
		if (job.medium === 'video') packages.push(videoPackageFromStretch(job));
	}
	for (const shot of plan.shots || []) {
		if (covered.has(shot.shotId)) continue;
		for (const segment of shot.segments || []) {
			packages.push(videoPackageFromSegment(shot, segment));
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
		const en = audioPackageFromCue(cue, 'en', shotIds);
		if (en) packages.push(en);
		const es = audioPackageFromCue(cue, 'es', shotIds);
		if (es && (es.promptPreview || es.outputs.some((o) => o.assetId))) packages.push(es);
	}
	return packages;
}

export function packageRefsComplete(pkg: GenerationPackage): boolean {
	return pkg.refs.every((r) => !r.required || r.present);
}

export function packageHasOutput(pkg: GenerationPackage): boolean {
	return pkg.outputs.some((o) => o.present);
}

export function summarizePackages(packages: GenerationPackage[]) {
	return {
		total: packages.length,
		promptReady: packages.filter((p) => p.promptReady).length,
		refsComplete: packages.filter((p) => packageRefsComplete(p)).length,
		hasOutput: packages.filter((p) => packageHasOutput(p)).length,
		blocked: packages.filter((p) => p.blockers.length > 0).length
	};
}
