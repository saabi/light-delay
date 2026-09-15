/**
 * Register a grouped Seedance stretch video at job level only (no member takes).
 * Usage:
 *   node scripts/register-visual-stretch-video.mjs --from <result.json> --run <ready-run.json> [--video <path>]
 *
 * Pending_review registration requires a ready, executable source run (--run or result.sourceRunPath)
 * whose inputDigest/job/snapshot match the result. Download the provider video into the repo first
 * (see HIGGSFIELD_MCP.md §8b), then point --video or output.repoPath at that file.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { atomicCopyFile } from './lib/atomic-fs.mjs';
import { readArgValue, scriptAnimaticFramesSegment } from './lib/visual-stretch.mjs';
import {
	loadSourceRunFile,
	sanitizeRunResultFilename,
	validateVisualStretchVideoRegistration
} from './lib/visual-stretch-result-register.mjs';
import { upsertResultUploadHandles } from './lib/visual-stretch-handoff.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const fromPath = readArgValue(args, '--from');
const runPathArg = readArgValue(args, '--run');
const videoArg = readArgValue(args, '--video');
if (!fromPath) {
	console.error(
		'Usage: node scripts/register-visual-stretch-video.mjs --from <result.json> --run <ready-run.json> [--video <path>]'
	);
	process.exit(1);
}

const resultAbs = isAbsolute(fromPath) ? fromPath : join(ROOT, fromPath);
if (!existsSync(resultAbs)) {
	console.error(`Result file missing: ${resultAbs}`);
	process.exit(1);
}

const result = JSON.parse(readFileSync(resultAbs, 'utf8'));
const plansDir = join(ROOT, 'data/production/plans');
let plan = null;
let planPath = null;
for (const name of readdirSync(plansDir).filter((n) => n.endsWith('.json'))) {
	const candidatePath = join(plansDir, name);
	const parsed = JSON.parse(readFileSync(candidatePath, 'utf8'));
	if (parsed.plan?.scriptId === result.scriptId) {
		plan = parsed;
		planPath = candidatePath;
		break;
	}
}
if (!plan || !planPath) {
	console.error(`Generation plan not found for scriptId ${result.scriptId}`);
	process.exit(1);
}

const jobs = (plan.visualStretchJobs || []).filter((j) => j.id === result.jobId);
const job = jobs.length === 1 ? jobs[0] : null;

const runsDir = join(ROOT, 'data/production/runs');
mkdirSync(runsDir, { recursive: true });
const priorResults = readdirSync(runsDir)
	.filter((n) => n.endsWith('-results.json'))
	.map((name) => {
		const abs = join(runsDir, name);
		const prior = JSON.parse(readFileSync(abs, 'utf8'));
		return { abs, ...prior };
	});

const trackedPath = join(runsDir, sanitizeRunResultFilename(result.sourceRunId || result.jobId));

if (result.status === 'rejected') {
	const fieldErrors = [];
	for (const key of ['jobId', 'scriptId', 'stretchId', 'providerSnapshotId', 'inputDigest', 'sourceRunId']) {
		if (result[key] == null) fieldErrors.push(key);
	}
	if (fieldErrors.length) {
		console.error(`Rejected result missing fields: ${fieldErrors.join(', ')}`);
		process.exit(1);
	}
	writeFileSync(trackedPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
	console.log(JSON.stringify({ ok: true, status: 'rejected', registered: false, resultPath: trackedPath }, null, 2));
	process.exit(0);
}

const { run, errors: runLoadErrors } = loadSourceRunFile(ROOT, result.sourceRunPath, runPathArg);
const pathProbe = result.output?.repoPath
	? isAbsolute(result.output.repoPath)
		? result.output.repoPath
		: join(ROOT, result.output.repoPath)
	: null;
const sourceVideo = videoArg
	? isAbsolute(videoArg)
		? videoArg
		: join(ROOT, videoArg)
	: pathProbe;
if (!sourceVideo || !existsSync(sourceVideo)) {
	console.error(
		`Video file missing. Download the Higgsfield output into the repo, then pass --video <path> or set output.repoPath under static/. Tried: ${sourceVideo || '(none)'}`
	);
	process.exit(1);
}

const videoBuf = readFileSync(sourceVideo);
const validation = validateVisualStretchVideoRegistration({
	root: ROOT,
	result,
	job,
	priorResults,
	resultAbs,
	videoBuf,
	run,
	requireReadyRun: true
});
if (runLoadErrors.length && !run) {
	validation.errors.push(...runLoadErrors);
	validation.ok = false;
}
if (!validation.ok) {
	console.error(`Registration refused:\n${[...new Set(validation.errors)].join('\n')}`);
	process.exit(1);
}

const hash = createHash('sha256').update(videoBuf).digest('hex');
const scriptSlug = String(result.scriptId).replace(/^script:/, '');
const framesSegment = scriptAnimaticFramesSegment(scriptSlug);
const stretchSlug = String(result.stretchId).replace(/[^a-zA-Z0-9_-]+/g, '-');
const jobSlug = String(result.jobId).replace(/[^a-zA-Z0-9_-]+/g, '-');
const destRel = `static/assets/animatic/frames/${framesSegment}/stretches/${stretchSlug}/${jobSlug}.mp4`;
const destAbs = join(ROOT, ...destRel.split('/'));
mkdirSync(dirname(destAbs), { recursive: true });
await atomicCopyFile(sourceVideo, destAbs);

const assetId = `asset:${jobSlug}-video`;
const assetsPath = join(ROOT, 'data/assets.json');
const assetsFile = JSON.parse(readFileSync(assetsPath, 'utf8'));
const webPath = `/${destRel.replace(/^static\//, '')}`;
const measured = result.output.durationMs;
const declared = result.declaredDurationMs ?? job.durationMs;
const record = {
	id: assetId,
	kind: 'video',
	role: 'production',
	path: webPath,
	mimeType: result.output.mimeType || 'video/mp4',
	durationMs: measured ?? declared ?? undefined,
	width: result.output.width ?? undefined,
	height: result.output.height ?? undefined,
	source: {
		provider: result.provider || 'higgsfield',
		model: result.model || 'seedance-2.5',
		generatedAt: result.completedAt || new Date().toISOString(),
		externalId: result.providerJobId
	},
	metadata: {
		visualStretchId: result.stretchId,
		stretchJobId: result.jobId,
		scriptId: result.scriptId,
		inputDigest: result.inputDigest,
		sourceRunId: result.sourceRunId
	},
	imageStatus: {
		status: 'needs_review',
		reasons: ['quality'],
		explanation: {
			en: 'Grouped Seedance stretch video pending editorial review (job-level; not bound to member takes).',
			es: 'Video Seedance del stretch pendiente de revisión editorial (nivel job; no ligado a tomas miembro).'
		}
	}
};
const existing = assetsFile.assets.find((a) => a.id === assetId);
if (existing) Object.assign(existing, record);
else assetsFile.assets.push(record);
writeFileSync(assetsPath, `${JSON.stringify(assetsFile, null, 2)}\n`, 'utf8');

const outputs = job.outputs || [];
const videoOut = outputs.find((o) => o.artifact === 'video') || { order: 1, artifact: 'video' };
videoOut.assetId = assetId;
job.outputs = [videoOut, ...outputs.filter((o) => o.artifact !== 'video')];
writeFileSync(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');

const tracked = {
	...result,
	output: {
		...result.output,
		repoPath: destRel,
		sha256: hash
	},
	registeredAssetId: assetId,
	status: 'pending_review'
};
writeFileSync(trackedPath, `${JSON.stringify(tracked, null, 2)}\n`, 'utf8');

const assetsById = new Map((assetsFile.assets || []).map((a) => [a.id, a]));
const ledgerUpdate = upsertResultUploadHandles(ROOT, tracked, assetsById);

console.log(
	JSON.stringify(
		{
			ok: true,
			assetId,
			path: webPath,
			planPath: relative(ROOT, planPath).split(sep).join('/'),
			resultPath: relative(ROOT, trackedPath).split(sep).join('/'),
			selectedTakesUnchanged: true,
			ledgerUpserted: ledgerUpdate.upserted,
			ledgerSkipped: ledgerUpdate.skipped
		},
		null,
		2
	)
);
