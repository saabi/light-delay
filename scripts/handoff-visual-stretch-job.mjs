/**
 * Dry-run §8 run-file handoff for a visual-stretch plan job (preview / nonExecutable only).
 * Usage:
 *   node scripts/handoff-visual-stretch-job.mjs --script light-delay-festival-master --job <jobId> --allow-preview-prompt
 *   [--medium video|still] [--out reports/runs/<name>.json]
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import { resolveCampaignProviders, resolveSnapshotById } from './lib/provider-capabilities.mjs';
import { readArgValue } from './lib/visual-stretch.mjs';
import { buildVisualStretchRunHandoff } from './lib/visual-stretch-handoff.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const scriptSlug = readArgValue(args, '--script');
const jobId = readArgValue(args, '--job');
const mediumFlag = readArgValue(args, '--medium');
const outPath = readArgValue(args, '--out');
const allowPreviewPrompt = args.includes('--allow-preview-prompt');
const campaignId = 'campaign:higgsfield-trial-24h';

if (!scriptSlug || !jobId) {
	console.error(
		'Usage: node scripts/handoff-visual-stretch-job.mjs --script <slug> --job <jobId> [--allow-preview-prompt] [--medium video|still] [--out path]'
	);
	process.exit(1);
}

const planPath = join(ROOT, 'data/production/plans', `${scriptSlug}.json`);
const scriptPath = join(ROOT, 'data/scripts', `${scriptSlug}.json`);
const plan = JSON.parse(readFileSync(planPath, 'utf8'));
const script = JSON.parse(readFileSync(scriptPath, 'utf8'));
const matches = (plan.visualStretchJobs || []).filter((j) => j.id === jobId);
if (matches.length !== 1) {
	console.error(
		`Refused: expected exactly one plan job id=${jobId}, found ${matches.length}. Smoke requires a single resolved job.`
	);
	process.exit(1);
}
const job = matches[0];
const stretch = (script.visualStretches || []).find((s) => s.id === job.stretchId);
if (!stretch) {
	console.error(`Stretch not found for job: ${job.stretchId}`);
	process.exit(1);
}

const providerCapabilities = JSON.parse(
	readFileSync(join(ROOT, 'data/production/provider-capabilities.json'), 'utf8')
);
const { stillProvider, videoProvider } = resolveCampaignProviders(providerCapabilities, campaignId);
const snapshot =
	resolveSnapshotById(providerCapabilities, job.providerSnapshotId) ||
	(job.medium === 'video' ? videoProvider : stillProvider);

const assetsById = new Map(
	JSON.parse(readFileSync(join(ROOT, 'data/assets.json'), 'utf8')).assets.map((a) => [a.id, a])
);
const voiceProfiles = JSON.parse(readFileSync(join(ROOT, 'data/voice-profiles.json'), 'utf8'))
	.voiceProfiles;
const entityReferenceIds = new Map();
for (const file of ['characters.json', 'locations.json', 'objects.json', 'vehicles.json']) {
	const data = JSON.parse(readFileSync(join(ROOT, 'data', file), 'utf8'));
	for (const collection of Object.values(data).filter(Array.isArray)) {
		for (const entity of collection) {
			entityReferenceIds.set(entity.id, entity.referenceAssetIds ?? []);
		}
	}
}

let run;
try {
	run = buildVisualStretchRunHandoff({
		root: ROOT,
		script,
		plan,
		job,
		stretch,
		snapshot,
		assetsById,
		entityReferenceIds,
		voiceProfiles,
		allowPreviewPrompt,
		mediumFlag
	});
} catch (err) {
	console.error(err instanceof Error ? err.message : String(err));
	process.exit(1);
}

const runSchema = JSON.parse(readFileSync(join(ROOT, 'data/schemas/run.schema.json'), 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: true, validateFormats: false });
const validateRun = ajv.compile(runSchema);
if (!validateRun(run)) {
	console.error(
		`Emitted run failed run.schema.json:\n${(validateRun.errors || [])
			.map((e) => `${e.instancePath || '/'} ${e.message}`)
			.join('\n')}`
	);
	process.exit(1);
}

const defaultOut = join(
	ROOT,
	'reports/runs',
	`${run.runId.replace(/[^a-zA-Z0-9._-]+/g, '-')}.json`
);
const dest = outPath
	? isAbsolute(outPath)
		? outPath
		: join(ROOT, outPath)
	: defaultOut;
mkdirSync(dirname(dest), { recursive: true });
writeFileSync(dest, `${JSON.stringify(run, null, 2)}\n`, 'utf8');

console.log(
	JSON.stringify(
		{
			ok: true,
			path: dest.replace(/\\/g, '/'),
			runId: run.runId,
			jobId: run.jobId,
			nonExecutable: run.nonExecutable,
			status: run.status,
			blockers: run.blockers,
			referenceCount: run.references.length,
			keyframeSlots: run.references.filter((r) => r.role === 'keyframe').length,
			inputDigest: run.inputDigest,
			executionPolicy: run.executionPolicy
		},
		null,
		2
	)
);
