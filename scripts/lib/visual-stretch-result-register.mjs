/**
 * Job-level visual-stretch video result validation and helpers.
 * Separated from the CLI so refuse paths are unit-testable.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, join, normalize, sep } from 'node:path';

export const DURATION_TOLERANCE_MS = 500;

/**
 * @param {string} runId
 */
export function sanitizeRunResultFilename(runId) {
	return `${String(runId).replace(/[^a-zA-Z0-9._-]+/g, '-')}-results.json`;
}

/**
 * @param {any} result
 * @returns {string[]}
 */
export function collectResultRequiredFieldErrors(result) {
	const errors = [];
	for (const key of [
		'jobId',
		'scriptId',
		'stretchId',
		'providerSnapshotId',
		'inputDigest',
		'artifact',
		'status',
		'sourceRunId',
		'output'
	]) {
		if (result?.[key] == null) errors.push(`missing_field:${key}`);
	}
	if (result?.artifact != null && result.artifact !== 'video') errors.push('artifact_must_be_video');
	if (result?.status != null && !['pending_review', 'rejected'].includes(result.status)) {
		errors.push('invalid_status');
	}
	return errors;
}

/**
 * @param {any} result
 * @param {any} job
 * @returns {string[]}
 */
export function collectResultJobIdentityErrors(result, job) {
	const errors = [];
	if (!job) {
		errors.push('job_not_found');
		return errors;
	}
	if (job.stretchId !== result.stretchId) errors.push('stretchId_mismatch');
	if (job.providerSnapshotId !== result.providerSnapshotId) errors.push('providerSnapshotId_mismatch');
	if (job.id !== result.jobId) errors.push('jobId_mismatch');
	return errors;
}

/**
 * @param {any} result
 * @param {any} run
 * @returns {string[]}
 */
export function collectResultRunMatchErrors(result, run) {
	const errors = [];
	if (!run) {
		errors.push('source_run_missing');
		return errors;
	}
	if (run.runId && result.sourceRunId && run.runId !== result.sourceRunId) {
		errors.push('sourceRunId_mismatch');
	}
	if (run.jobId !== result.jobId) errors.push('run_jobId_mismatch');
	if (run.scriptId !== result.scriptId) errors.push('run_scriptId_mismatch');
	if (run.stretchId && result.stretchId && run.stretchId !== result.stretchId) {
		errors.push('run_stretchId_mismatch');
	}
	if (run.providerSnapshotId !== result.providerSnapshotId) {
		errors.push('run_providerSnapshotId_mismatch');
	}
	if (run.inputDigest !== result.inputDigest) errors.push('inputDigest_mismatch');
	if (run.nonExecutable === true) errors.push('source_run_nonExecutable');
	if (run.status && run.status !== 'ready') errors.push('source_run_not_ready');
	return errors;
}

/**
 * @param {any} result
 * @param {Array<any>} priorResults
 * @param {string} [currentAbs]
 * @returns {string[]}
 */
export function collectResultDuplicateErrors(result, priorResults, currentAbs) {
	const errors = [];
	for (const prior of priorResults || []) {
		if (prior.abs && currentAbs && normalize(prior.abs) === normalize(currentAbs)) continue;
		if (prior.providerJobId && result.providerJobId && prior.providerJobId === result.providerJobId) {
			errors.push(`duplicate_providerJobId:${result.providerJobId}`);
		}
		if (
			prior.jobId === result.jobId &&
			prior.inputDigest &&
			result.inputDigest &&
			prior.inputDigest !== result.inputDigest
		) {
			errors.push('inputDigest_mismatch_vs_prior');
		}
	}
	return errors;
}

/**
 * @param {string} root
 * @param {string} repoPath
 * @returns {{ ok: boolean, abs?: string, errors: string[] }}
 */
export function validateOutputRepoPath(root, repoPath) {
	/** @type {string[]} */
	const errors = [];
	const outRel = String(repoPath || '').split(sep).join('/');
	if (!outRel || outRel.includes('..') || isAbsolute(outRel) || !outRel.startsWith('static/')) {
		errors.push('output_path_invalid');
		return { ok: false, errors };
	}
	const abs = join(root, ...outRel.split('/'));
	const staticRoot = normalize(join(root, 'static'));
	if (!normalize(abs).startsWith(staticRoot)) {
		errors.push('output_path_escapes_static');
		return { ok: false, errors };
	}
	return { ok: true, abs, errors };
}

/**
 * @param {Buffer | Uint8Array} buf
 * @param {string | null | undefined} expected
 * @returns {string[]}
 */
export function collectHashMismatchErrors(buf, expected) {
	const hash = createHash('sha256').update(buf).digest('hex');
	if (expected && expected !== hash) return [`sha256_mismatch:${expected}!=${hash}`];
	return [];
}

/**
 * @param {number | null | undefined} declared
 * @param {number | null | undefined} measured
 * @param {number} [toleranceMs]
 * @returns {string[]}
 */
export function collectDurationDriftErrors(declared, measured, toleranceMs = DURATION_TOLERANCE_MS) {
	if (declared == null || measured == null) return [];
	if (Math.abs(Number(measured) - Number(declared)) > toleranceMs) {
		return [`duration_drift:${declared}!=${measured}`];
	}
	return [];
}

/**
 * @param {string} root
 * @param {string | null | undefined} sourceRunPath
 * @param {string | null | undefined} explicitRunPath
 * @returns {{ run: any | null, abs: string | null, errors: string[] }}
 */
export function loadSourceRunFile(root, sourceRunPath, explicitRunPath) {
	const candidates = [explicitRunPath, sourceRunPath].filter(Boolean);
	for (const candidate of candidates) {
		const abs = isAbsolute(/** @type {string} */ (candidate))
			? /** @type {string} */ (candidate)
			: join(root, /** @type {string} */ (candidate));
		if (!existsSync(abs)) continue;
		try {
			const run = JSON.parse(readFileSync(abs, 'utf8'));
			return { run, abs, errors: [] };
		} catch {
			return { run: null, abs, errors: ['source_run_unreadable'] };
		}
	}
	return { run: null, abs: null, errors: ['source_run_missing'] };
}

/**
 * Full validation for a pending_review registration (not rejected).
 * @param {{
 *   root: string,
 *   result: any,
 *   job: any,
 *   priorResults?: Array<{ abs?: string, providerJobId?: string, jobId?: string, inputDigest?: string }>,
 *   resultAbs?: string,
 *   videoBuf: Buffer | Uint8Array,
 *   run?: any | null,
 *   requireReadyRun?: boolean
 * }} args
 */
export function validateVisualStretchVideoRegistration(args) {
	const {
		root,
		result,
		job,
		priorResults = [],
		resultAbs,
		videoBuf,
		run = null,
		requireReadyRun = true
	} = args;
	/** @type {string[]} */
	const errors = [
		...collectResultRequiredFieldErrors(result),
		...collectResultJobIdentityErrors(result, job),
		...collectResultDuplicateErrors(result, priorResults, resultAbs)
	];
	if (requireReadyRun) {
		errors.push(...collectResultRunMatchErrors(result, run));
	}
	const pathCheck = validateOutputRepoPath(root, result.output?.repoPath);
	errors.push(...pathCheck.errors);
	errors.push(...collectHashMismatchErrors(videoBuf, result.output?.sha256));
	const declared = result.declaredDurationMs ?? job?.durationMs;
	errors.push(...collectDurationDriftErrors(declared, result.output?.durationMs));
	return { ok: errors.length === 0, errors, outputAbs: pathCheck.abs };
}
