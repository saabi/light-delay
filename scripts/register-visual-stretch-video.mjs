/**
 * Register a grouped Seedance stretch video at job level only (no member takes).
 * Usage: node scripts/register-visual-stretch-video.mjs --from data/production/runs/<id>-results.json [--video <path>]
 */
import { createHash, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, normalize, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { atomicCopyFile } from './lib/atomic-fs.mjs';
import { readArgValue, scriptAnimaticFramesSegment } from './lib/visual-stretch.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DURATION_TOLERANCE_MS = 500;
const args = process.argv.slice(2);
const fromPath = readArgValue(args, '--from');
if (!fromPath) {
	console.error('Usage: node scripts/register-visual-stretch-video.mjs --from <result.json> [--video <path>]');
	process.exit(1);
}

const resultAbs = isAbsolute(fromPath) ? fromPath : join(ROOT, fromPath);
if (!existsSync(resultAbs)) {
	console.error(`Result file missing: ${resultAbs}`);
	process.exit(1);
}

const result = JSON.parse(readFileSync(resultAbs, 'utf8'));
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
	if (result[key] == null) {
		console.error(`Result missing required field: ${key}`);
		process.exit(1);
	}
}
if (result.artifact !== 'video') {
	console.error('artifact must be video');
	process.exit(1);
}
if (!['pending_review', 'rejected'].includes(result.status)) {
	console.error('status must be pending_review or rejected');
	process.exit(1);
}

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
if (jobs.length !== 1) {
	console.error(`Expected exactly one plan job ${result.jobId}, found ${jobs.length}`);
	process.exit(1);
}
const job = jobs[0];
if (job.stretchId !== result.stretchId) {
	console.error(`stretchId mismatch: result ${result.stretchId} vs job ${job.stretchId}`);
	process.exit(1);
}
if (job.providerSnapshotId !== result.providerSnapshotId) {
	console.error('providerSnapshotId mismatch');
	process.exit(1);
}

const runsDir = join(ROOT, 'data/production/runs');
mkdirSync(runsDir, { recursive: true });
for (const name of readdirSync(runsDir).filter((n) => n.endsWith('-results.json'))) {
	const priorAbs = join(runsDir, name);
	if (normalize(priorAbs) === normalize(resultAbs)) continue;
	const prior = JSON.parse(readFileSync(priorAbs, 'utf8'));
	if (prior.providerJobId && result.providerJobId && prior.providerJobId === result.providerJobId) {
		console.error(`Duplicate providerJobId ${result.providerJobId} in ${name}`);
		process.exit(1);
	}
	if (prior.jobId === result.jobId && prior.inputDigest && prior.inputDigest !== result.inputDigest) {
		console.error(
			`inputDigest mismatch vs prior result for ${result.jobId}: keep the exact run file used for submission`
		);
		process.exit(1);
	}
}

const outRel = String(result.output.repoPath || '').split(sep).join('/');
if (!outRel || outRel.includes('..') || isAbsolute(outRel) || !outRel.startsWith('static/')) {
	console.error(`output.repoPath must be repo-relative under static/: got ${result.output.repoPath}`);
	process.exit(1);
}
const stagedAbs = join(ROOT, ...outRel.split('/'));
const staticRoot = normalize(join(ROOT, 'static'));
if (!normalize(stagedAbs).startsWith(staticRoot)) {
	console.error('output path escapes static/');
	process.exit(1);
}

const sourceVideoArg = readArgValue(args, '--video');
const sourceVideo = sourceVideoArg
	? isAbsolute(sourceVideoArg)
		? sourceVideoArg
		: join(ROOT, sourceVideoArg)
	: stagedAbs;
if (!existsSync(sourceVideo)) {
	console.error(`Video file missing: ${sourceVideo}`);
	process.exit(1);
}

const buf = readFileSync(sourceVideo);
const hash = createHash('sha256').update(buf).digest('hex');
if (result.output.sha256 && result.output.sha256 !== hash) {
	console.error(`sha256 mismatch: result ${result.output.sha256} vs file ${hash}`);
	process.exit(1);
}

const declared = result.declaredDurationMs ?? job.durationMs;
const measured = result.output.durationMs;
if (
	declared != null &&
	measured != null &&
	Math.abs(Number(measured) - Number(declared)) > DURATION_TOLERANCE_MS
) {
	console.error(
		`duration drift: declared ${declared} vs measured ${measured} (tolerance ${DURATION_TOLERANCE_MS}ms)`
	);
	process.exit(1);
}

const trackedName = `${String(result.sourceRunId).replace(/[^a-zA-Z0-9._:-]+/g, '-')}-results.json`;
const trackedPath = join(runsDir, trackedName);

if (result.status === 'rejected') {
	writeFileSync(trackedPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
	console.log(JSON.stringify({ ok: true, status: 'rejected', registered: false }, null, 2));
	process.exit(0);
}

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

console.log(
	JSON.stringify(
		{
			ok: true,
			assetId,
			path: webPath,
			planPath: relative(ROOT, planPath).split(sep).join('/'),
			resultPath: relative(ROOT, trackedPath).split(sep).join('/'),
			selectedTakesUnchanged: true
		},
		null,
		2
	)
);
