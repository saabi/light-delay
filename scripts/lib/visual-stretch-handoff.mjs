/**
 * Build §8 run-file handoffs for visual-stretch jobs (preview or ready).
 */
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join, normalize, relative, sep } from 'node:path';
import { sha256 } from './generation-planning.mjs';
import { compileStretchVideoPrompt } from './visual-stretch-video-prompt.mjs';
import {
	collectVideoStretchReferences,
	isStretchJobRunnable,
	mergeAuthoredIdentityVideoAssetIds
} from './visual-stretch-jobs.mjs';

export const DEFAULT_SMOKE_EXECUTION_POLICY = Object.freeze({
	mode: 'smoke_test',
	maxJobs: 1,
	stopAfterFirst: true,
	autoRetry: false,
	autoContinue: false,
	autoAccept: false
});

export const AGENT_INSTRUCTIONS_PREVIEW = [
	'HARD GATE: nonExecutable is true. Do NOT submit this run to Higgsfield MCP or any paid API.',
	'This file is a preview only. Paid smoke requires a frozen plan job (compiledPrompt, runnable, Seedance executable) then handoff without --allow-preview-prompt, then human cost confirmation immediately before submit.',
	'Also refuse submit when the source plan job has runnable false or generationGate / generation_deferred / generation_blocked blockers; clear Take.productionGate on the script take and rebuild plans first — do not hand-edit plan generationGate.',
	'Refuse submit on reference_budget:* blockers. Prefer structured job.referenceBudget (required/covered/uncovered/attached/wouldOmit/violations) over reparsing strings.',
	'reference_pack_required means uncovered entities — attach or author packs/sheets declaring those entityIds (compatiblePackAssetIds / packsNeeded). Do not add packs for pure covered overflow.',
	'reference_consolidation_required means too many attached refs while fully covered — merge/consolidate consolidateCandidateAssetIds; do not add more packs.',
	'Keep this exact run file if a future ready run is submitted; do not re-run handoff between submit and register (inputDigest covers the prompt).',
	'Before any future paid submit: run node scripts/higgsfield-preflight.mjs --probe; confirm live concurrency and credits; ask for credit cost and wait for human confirmation.',
	'Video jobs pass generate_audio true (Seedance native sound) unless the author asked for a silent clip.',
	'executionPolicy.smoke_test: submit exactly one job, then stop. No retries, no queue continuation, no auto-accept.',
	'Upload references ONLY in the order of references[] in this file. Do not reconstruct or reorder from the generation plan.',
	'After completion: download the generated video from Higgsfield Assets into the repo under static/ (agreed stretch path), record remote upload handles per assetId, write data/production/runs/*-results.json, then npm run register:visual-stretch-video -- --from <results> --run <this-ready-run.json> [--video <downloaded>].',
	'Register at job level only (no take binding).'
].join(' ');

export const AGENT_INSTRUCTIONS_READY = [
	'This run is status ready and nonExecutable false. Do NOT submit to Higgsfield MCP or any paid API until a human confirms the credit cost from generate_video get_cost:true immediately before submit.',
	'Refuse submit when the source plan job has runnable false or generationGate / generation_deferred / generation_blocked blockers; clear Take.productionGate on the script take and rebuild plans first — do not hand-edit plan generationGate.',
	'Refuse submit on reference_budget:* blockers. Prefer structured job.referenceBudget (required/covered/uncovered/attached/wouldOmit/violations) over reparsing strings.',
	'Keep this exact run file for submit and register; do not re-run handoff between submit and register (inputDigest covers the prompt).',
	'Before paid submit: run node scripts/higgsfield-preflight.mjs --probe; confirm live concurrency and credits; call generate_video with get_cost true; state the credit cost and wait for human confirmation.',
	'Video jobs pass generate_audio true (Seedance native sound) unless the author asked for a silent clip.',
	'executionPolicy.smoke_test: submit exactly one job, then stop. No retries, no queue continuation, no auto-accept.',
	'Upload references ONLY in the order of references[] in this file. Do not reconstruct or reorder from the generation plan.',
	'After completion: download the generated video from Higgsfield Assets into the repo under static/ (agreed stretch path), record remote upload handles per assetId, write data/production/runs/*-results.json, then npm run register:visual-stretch-video -- --from <results> --run <this-ready-run.json> [--video <downloaded>].',
	'Register at job level only (no take binding).'
].join(' ');

/**
 * Ready handoff requires a runnable frozen plan job, compiled prompt text, and an executable snapshot.
 * --allow-preview-prompt always forces preview even when those are true.
 * @param {any} job
 * @param {any} snapshot
 * @param {boolean} allowPreviewPrompt
 */
export function isReadyHandoffEligible(job, snapshot, allowPreviewPrompt = false) {
	if (allowPreviewPrompt) return false;
	const compiled =
		typeof job?.compiledPrompt === 'string' ? job.compiledPrompt.trim() : '';
	return (
		isStretchJobRunnable(job) && compiled.length > 0 && snapshot?.executable === true
	);
}

/**
 * @param {string} assetId
 * @param {string} [ext]
 */
export function stagingFilenameForAssetId(assetId, ext = 'png') {
	const safe = String(assetId).replace(/^asset:/, 'asset-').replace(/[^a-zA-Z0-9._-]+/g, '-');
	return `${safe}.${ext.replace(/^\./, '')}`;
}

/**
 * @param {string} root
 * @param {string} assetPath web path like /assets/...
 */
export function repoRelativeFromAssetPath(root, assetPath) {
	if (!assetPath || typeof assetPath !== 'string') {
		throw new Error('Asset path missing');
	}
	// Refuse OS absolute paths (Windows drive / UNC). Web paths like `/assets/...` are OK.
	if (/^[a-zA-Z]:[\\/]/.test(assetPath) || assetPath.startsWith('\\\\')) {
		throw new Error(`Absolute-only asset paths are refused: ${assetPath}`);
	}
	const cleaned = assetPath.replace(/^\/+/, '');
	const underStatic = cleaned.startsWith('assets/') ? join('static', cleaned) : cleaned;
	const abs = join(root, underStatic);
	const rel = relative(root, abs).split(sep).join('/');
	if (rel.startsWith('..') || /^[a-zA-Z]:[\\/]/.test(rel)) {
		throw new Error(`Path escapes repository root: ${assetPath}`);
	}
	if (!rel.startsWith('static/')) {
		throw new Error(`Asset path must resolve under static/: ${assetPath}`);
	}
	return rel;
}

/**
 * @param {string} root
 * @param {string} relPath
 */
export function assertRepoRelativeFileExists(root, relPath) {
	const abs = join(root, ...relPath.split('/'));
	if (!existsSync(abs)) throw new Error(`Missing file: ${relPath}`);
	const normalized = normalize(abs);
	const staticRoot = normalize(join(root, 'static'));
	if (!normalized.startsWith(staticRoot)) {
		throw new Error(`Path outside static/: ${relPath}`);
	}
	return abs;
}

/**
 * Ordered present asset ids for staging (keyframe → visual → voice), matching handoff order.
 * Skips null keyframe slots; does not dedupe beyond first occurrence.
 * @param {{ memberInputs?: Array<{ order?: number, keyframeAssetId?: string }>, effectiveVideoReferenceAssetIds?: string[], voiceSampleAssetIds?: string[], sharedReferenceAssetIds?: string[] }} job
 * @returns {string[]}
 */
export function orderedStretchStagingAssetIds(job) {
	/** @type {string[]} */
	const ordered = [];
	const seen = new Set();
	/** @param {string | undefined | null} id */
	const push = (id) => {
		if (!id || seen.has(id)) return;
		seen.add(id);
		ordered.push(id);
	};
	for (const mi of [...(job.memberInputs || [])].sort(
		/** @param {any} a @param {any} b */ (a, b) => (a.order ?? 0) - (b.order ?? 0)
	)) {
		push(mi.keyframeAssetId);
	}
	for (const id of job.effectiveVideoReferenceAssetIds ?? job.sharedReferenceAssetIds ?? []) {
		push(id);
	}
	for (const id of job.voiceSampleAssetIds || []) push(id);
	return ordered;
}

/**
 * @param {any} job
 * @param {any} stretch
 * @param {any} script
 * @param {Map<string, any>} assetsById
 * @param {{
 *   entityReferenceIds?: Map<string, string[]>,
 *   voiceProfiles?: any[],
 *   language?: string,
 *   root: string
 * }} opts
 */
export function buildEffectiveReferences(job, stretch, script, assetsById, opts) {
	const shotsById = new Map((script.shots || []).map(/** @param {any} s */ (s) => [s.id, s]));
	const cuesById = new Map((script.cues || []).map(/** @param {any} c */ (c) => [c.id, c]));
	const keyframeByShotId = new Map();
	for (const mi of job.memberInputs || []) {
		if (mi.keyframeAssetId) keyframeByShotId.set(mi.shotId, mi.keyframeAssetId);
	}
	const members = (stretch.members || []).filter(/** @param {any} m */ (m) =>
		(job.memberInputs || []).some(/** @param {any} mi */ (mi) => mi.shotId === m.shotId)
	);
	const collected = collectVideoStretchReferences({
		stretch,
		members,
		shotsById,
		keyframeByShotId,
		entityReferenceIds: opts.entityReferenceIds ?? new Map(),
		cuesById,
		voiceProfiles: opts.voiceProfiles ?? [],
		language: opts.language ?? 'en'
	});

	const storedEffective = job.effectiveVideoReferenceAssetIds;
	const authoredVideoIds = Array.isArray(job.videoReferenceAssetIds)
		? job.videoReferenceAssetIds
		: Array.isArray(stretch.videoReferenceAssetIds)
			? stretch.videoReferenceAssetIds
			: [];
	// The plan's effective list is budget-oriented and may omit entities already
	// covered by keyframes. Spoken-character identity is a separate Seedance
	// requirement, so retain explicit authored identity sheets in the handoff.
	const effectiveVisualIds = mergeAuthoredIdentityVideoAssetIds(
		Array.isArray(storedEffective) ? storedEffective : collected.effectiveVideoReferenceAssetIds,
		authoredVideoIds
	);
	const voiceIds = Array.isArray(job.voiceSampleAssetIds)
		? job.voiceSampleAssetIds
		: collected.voiceSampleAssetIds;

	/** @type {Array<any>} */
	const ordered = [];
	for (const mi of [...(job.memberInputs || [])].sort(
		/** @param {any} a @param {any} b */ (a, b) => a.order - b.order
	)) {
		ordered.push({
			kind: 'image',
			role: 'keyframe',
			assetId: mi.keyframeAssetId || null,
			shotId: mi.shotId,
			order: mi.order
		});
	}
	for (const id of effectiveVisualIds) {
		ordered.push({ kind: 'image', role: 'visual_reference', assetId: id });
	}
	for (const id of voiceIds) {
		ordered.push({ kind: 'audio', role: 'voice_sample', assetId: id });
	}

	const missing = [...collected.blockers.filter((b) => b.startsWith('missing_keyframe:'))];
	const resolved = [];
	for (const entry of ordered) {
		if (!entry.assetId) {
			missing.push(`missing_keyframe:${entry.shotId || entry.role}`);
			resolved.push({
				...entry,
				repoPath: null,
				localStagingPath: null
			});
			continue;
		}
		const asset = assetsById.get(entry.assetId);
		if (!asset?.path) {
			missing.push(`missing_asset:${entry.assetId}`);
			resolved.push({
				role: entry.role,
				assetId: entry.assetId,
				kind: entry.kind,
				repoPath: null,
				localStagingPath: null
			});
			continue;
		}
		const ext = asset.path.split('.').pop() || (entry.kind === 'audio' ? 'wav' : 'png');
		const stagingName = stagingFilenameForAssetId(entry.assetId, ext);
		const localStagingPath = `higgsfield-uploads/stretch/${stagingName}`;
		let repoPath = null;
		try {
			repoPath = repoRelativeFromAssetPath(opts.root, asset.path);
			assertRepoRelativeFileExists(opts.root, repoPath);
		} catch (err) {
			missing.push(`path:${entry.assetId}:${err instanceof Error ? err.message : String(err)}`);
		}
			resolved.push({
				role: entry.role,
				assetId: entry.assetId,
				kind: entry.kind,
				entityIds: asset.metadata?.entityIds || (asset.metadata?.characterId ? [asset.metadata.characterId] : []),
				repoPath,
			localStagingPath
		});
	}
	return {
		references: resolved,
		missing: [...new Set(missing)],
		recomputedEffectiveVideoReferenceAssetIds: collected.effectiveVideoReferenceAssetIds
	};
}

/**
 * @param {{
 *   root: string,
 *   script: any,
 *   plan: any,
 *   job: any,
 *   stretch: any,
 *   snapshot: any,
 *   assetsById: Map<string, any>,
 *   entityReferenceIds?: Map<string, string[]>,
 *   voiceProfiles?: any[],
 *   allowPreviewPrompt?: boolean,
 *   mediumFlag?: string | null
 * }} args
 */
export function buildVisualStretchRunHandoff(args) {
	const {
		root,
		script,
		plan,
		job,
		stretch,
		snapshot,
		assetsById,
		entityReferenceIds,
		voiceProfiles,
		allowPreviewPrompt = false,
		mediumFlag = null
	} = args;

	if (mediumFlag && mediumFlag !== job.medium) {
		throw new Error(`--medium ${mediumFlag} does not match job.medium ${job.medium}`);
	}

	const ready = isReadyHandoffEligible(job, snapshot, allowPreviewPrompt);

	if (!ready && !allowPreviewPrompt) {
		throw new Error(
			'Refused: plan job is not ready for an executable run (need runnable compiledPrompt and an executable provider snapshot). Re-run with --allow-preview-prompt to emit a nonExecutable preview run (never submit to Higgsfield).'
		);
	}

	const { references, missing } = buildEffectiveReferences(job, stretch, script, assetsById, {
		root,
		entityReferenceIds,
		voiceProfiles,
		language: plan.plan?.promptLanguage || 'en'
	});

	const compiledPrompt =
		typeof job.compiledPrompt === 'string' ? job.compiledPrompt.trim() : '';
	const promptResult =
		ready && compiledPrompt
			? {
					sections: {},
					preview: compiledPrompt,
					compiled: compiledPrompt,
					blockers: [],
					negativeEn:
						'No identity swaps, ambiguous speaker assignment, extra cast, discontinuous motion, camera-axis jump, teleporting, gravity error, zero-g drift during thrust, invented dialogue, spoken-line subtitle burn-in, logos, watermark, or background music.'
				}
			: job.medium === 'video'
				? compileStretchVideoPrompt({
						stretch,
						job,
						script,
						effectiveReferences: references.map((r) => ({
							role: r.role,
							assetId: r.assetId || undefined,
							kind: r.kind,
							entityIds:
								r.entityIds ||
								assetsById.get(r.assetId)?.metadata?.entityIds ||
								(assetsById.get(r.assetId)?.metadata?.characterId
									? [assetsById.get(r.assetId).metadata.characterId]
									: [])
						})),
						blockers: job.blockers
					})
				: {
						sections: {},
						preview: '[still preview: use compile:visual-stretch stdout; not inlined here]',
						blockers: job.blockers || [],
						negativeEn: 'No logos, watermark, or redesigned sheets.'
					};

	const promptText = ready ? compiledPrompt : promptResult.preview;
	const durationMs = job.durationMs ?? 0;
	const aspectRatio = '16:9';
	const digestPayload = {
		prompt: promptText,
		providerSnapshotId: job.providerSnapshotId,
		references: references.map((r) => ({
			role: r.role,
			assetId: r.assetId,
			kind: r.kind
		})),
		durationMs,
		aspectRatio,
		dependsOnStillJobId: job.dependsOnStillJobId ?? null
	};
	const inputDigest = sha256(digestPayload);
	const effectiveReferencesDigest = sha256(digestPayload.references);
	const promptDigest = sha256(promptText);

	const runId = ready ? `run:${job.id}:ready` : `run:${job.id}:preview`;
	const blockers = [...new Set([...(job.blockers || []), ...missing, ...promptResult.blockers])];
	if (ready && blockers.length) {
		throw new Error(
			`Refused ready handoff: remaining blockers ${blockers.join(', ')}. Re-run with --allow-preview-prompt for a nonExecutable preview.`
		);
	}
	// Seedance 2.5 MCP catalog defaults to 720p; Festival smoke policy is 480p via
	// snapshot.preferredResolution. Fail closed to 480p for Seedance video so omit
	// never silently upgrades cost/quality.
	const resolution =
		snapshot?.preferredResolution ||
		snapshot?.limits?.defaultResolution ||
		snapshot?.defaultResolution ||
		(job.medium === 'video' && String(snapshot?.model || '').includes('seedance')
			? '480p'
			: null);

	return {
		schemaVersion: '1.0.0',
		runId,
		scriptId: plan.plan?.scriptId || script.script?.id,
		stretchId: job.stretchId,
		jobId: job.id,
		kind: job.medium === 'video' ? 'video' : 'image',
		provider: snapshot?.provider === 'higgsfield' ? 'higgsfield-mcp-official' : snapshot?.provider || 'unknown',
		model: snapshot?.model || 'unknown',
		providerSnapshotId: job.providerSnapshotId,
		dependsOnStillJobId: job.dependsOnStillJobId,
		prompt: {
			compiledEn: promptText,
			negativeEn: promptResult.negativeEn
		},
		parameters: {
			aspectRatio,
			durationSeconds: Math.round(durationMs / 1000),
			durationMs,
			...(resolution ? { resolution } : {}),
			generateAudio: job.medium === 'video'
		},
		references: references.map((r) => ({
			role: r.role,
			assetId: r.assetId,
			kind: r.kind,
			localStagingPath: r.localStagingPath,
			repoPath: r.repoPath
		})),
		effectiveReferencesDigest,
		promptDigest,
		inputDigest,
		executionPolicy: { ...DEFAULT_SMOKE_EXECUTION_POLICY },
		preflight: {
			requiresHumanApproval: true,
			requiresEntitlementPreflight: true,
			maxCredits: null,
			notes: ready
				? 'MCP always spends credits. Confirm concurrency from the account dashboard. Call generate_video get_cost:true and wait for human confirmation before submit.'
				: 'MCP always spends credits. Preview runs must not be submitted. Confirm concurrency from account dashboard before any future paid batch.'
		},
		nonExecutable: !ready,
		status: ready ? 'ready' : 'preview',
		blockers,
		runnablePlanJob: isStretchJobRunnable(job),
		agentInstructions: ready ? AGENT_INSTRUCTIONS_READY : AGENT_INSTRUCTIONS_PREVIEW
	};
}

/**
 * @param {Buffer | Uint8Array | string} buf
 */
export function sha256HexFileBuffer(buf) {
	return createHash('sha256').update(buf).digest('hex');
}
