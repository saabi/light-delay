/**
 * Build §8 run-file handoffs for visual-stretch jobs (preview / nonExecutable only in this slice).
 */
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join, normalize, relative, sep } from 'node:path';
import { sha256 } from './generation-planning.mjs';
import { compileStretchVideoPrompt } from './visual-stretch-video-prompt.mjs';
import { collectVideoStretchReferences, isStretchJobRunnable } from './visual-stretch-jobs.mjs';

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
	'This file is a preview only. Paid smoke requires a future freeze CLI that sets status ready and nonExecutable false, then human cost confirmation immediately before submit.',
	'Keep this exact run file if a future ready run is submitted; do not re-run handoff between submit and register (inputDigest covers the prompt).',
	'Before any future paid submit: run node scripts/higgsfield-preflight.mjs --probe; confirm live concurrency and credits; ask for credit cost and wait for human confirmation.',
	'executionPolicy.smoke_test: submit exactly one job, then stop. No retries, no queue continuation, no auto-accept.',
	'Upload references ONLY in the order of references[] in this file. Do not reconstruct or reorder from the generation plan.',
	'After completion: download the generated video from Higgsfield Assets into the repo under static/ (agreed stretch path), record remote upload handles per assetId, write data/production/runs/*-results.json, then npm run register:visual-stretch-video -- --from <results> --run <this-ready-run.json> [--video <downloaded>].',
	'Register at job level only (no take binding).'
].join(' ');

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
	const { references: rawRefs } = collectVideoStretchReferences({
		stretch,
		members,
		shotsById,
		keyframeByShotId,
		entityReferenceIds: opts.entityReferenceIds ?? new Map(),
		cuesById,
		voiceProfiles: opts.voiceProfiles ?? [],
		language: opts.language ?? 'en'
	});

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
	for (const ref of rawRefs) {
		if (ref.role === 'keyframe') continue;
		ordered.push({
			kind: ref.kind,
			role: ref.role || 'visual_reference',
			assetId: ref.id
		});
	}

	const missing = [];
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
			repoPath,
			localStagingPath
		});
	}
	return { references: resolved, missing };
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

	if (!allowPreviewPrompt) {
		throw new Error(
			'Refused: plan compiledPrompt is null and freeze is not available in this slice. Re-run with --allow-preview-prompt to emit a nonExecutable preview run (never submit to Higgsfield).'
		);
	}

	if (job.compiledPrompt) {
		// Future: ready path. This slice still forces nonExecutable preview semantics when flag is used without freeze.
	}

	const { references, missing } = buildEffectiveReferences(job, stretch, script, assetsById, {
		root,
		entityReferenceIds,
		voiceProfiles,
		language: plan.plan?.promptLanguage || 'en'
	});

	const promptResult =
		job.medium === 'video'
			? compileStretchVideoPrompt({
					stretch,
					job,
					script,
					effectiveReferences: references.map((r) => ({
						role: r.role,
						assetId: r.assetId || undefined,
						kind: r.kind
					})),
					blockers: job.blockers
				})
			: {
					sections: {},
					preview: '[still preview: use compile:visual-stretch stdout; not inlined here]',
					blockers: job.blockers || [],
					negativeEn: 'No logos, watermark, or redesigned sheets.'
				};

	const durationMs = job.durationMs ?? 0;
	const aspectRatio = '16:9';
	const digestPayload = {
		prompt: promptResult.preview,
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
	const promptDigest = sha256(promptResult.preview);

	const runId = `run:${job.id}:preview`;
	const blockers = [...new Set([...(job.blockers || []), ...missing, ...promptResult.blockers])];
	const resolution =
		snapshot?.preferredResolution ||
		snapshot?.limits?.defaultResolution ||
		snapshot?.defaultResolution ||
		null;

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
			compiledEn: promptResult.preview,
			negativeEn: promptResult.negativeEn
		},
		parameters: {
			aspectRatio,
			durationSeconds: Math.round(durationMs / 1000),
			durationMs,
			...(resolution ? { resolution } : {}),
			generateAudio: references.some((r) => r.kind === 'audio')
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
			notes:
				'MCP always spends credits. Preview runs must not be submitted. Confirm concurrency from account dashboard before any future paid batch.'
		},
		nonExecutable: true,
		status: 'preview',
		blockers,
		runnablePlanJob: isStretchJobRunnable(job),
		agentInstructions: AGENT_INSTRUCTIONS_PREVIEW
	};
}

/**
 * @param {Buffer | Uint8Array | string} buf
 */
export function sha256HexFileBuffer(buf) {
	return createHash('sha256').update(buf).digest('hex');
}
