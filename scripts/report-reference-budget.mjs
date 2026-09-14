#!/usr/bin/env node
/**
 * Report reference-budget diagnostics from generation plans.
 * Does not mutate script or plan JSON (read-only).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const slugArg = process.argv.find((a) => a.startsWith('--script='))?.slice('--script='.length);
const slug = slugArg || 'light-delay-festival-master';
const planPath = join(ROOT, 'data', 'production', 'plans', `${slug}.json`);
const plan = JSON.parse(readFileSync(planPath, 'utf8'));

/**
 * @param {any} job
 */
function mapStretchJob(job) {
	return {
		jobId: job.id,
		stretchId: job.stretchId,
		medium: job.medium,
		videoReferencePolicy: job.videoReferencePolicy,
		runnable: job.runnable,
		violations: job.referenceBudget?.violations || [],
		uncovered: job.referenceBudget?.uncoveredEntityIds || [],
		keyframeCovered: job.referenceBudget?.keyframeCoveredEntityIds || [],
		videoExtraCovered: job.referenceBudget?.videoExtraCoveredEntityIds || [],
		uncoveredVideo: job.referenceBudget?.uncoveredVideoEntityIds || [],
		wouldOmit: job.referenceBudget?.wouldOmitEntityIds || [],
		remediation: job.remediation || [],
		blockers: (job.blockers || []).filter(
			(b) =>
				b.startsWith('reference_budget:') ||
				b.startsWith('reference_pack_required') ||
				b.startsWith('reference_consolidation_required') ||
				b.startsWith('uncovered_entity:') ||
				b.startsWith('uncovered_video_entity:')
		)
	};
}

/**
 * @param {ReturnType<typeof mapStretchJob>} row
 */
function hasBudgetIssue(row) {
	return Boolean(row.blockers.length || row.uncovered.length || row.violations.length);
}

/**
 * @param {ReturnType<typeof mapStretchJob>} row
 * @param {string[]} lines
 */
function appendStretchJobMarkdown(row, lines) {
	lines.push(`## ${row.jobId}`);
	lines.push(`- medium: ${row.medium} · runnable: ${row.runnable}`);
	if (row.videoReferencePolicy) lines.push(`- videoReferencePolicy: ${row.videoReferencePolicy}`);
	lines.push(`- violations: ${row.violations.join(', ') || '—'}`);
	lines.push(`- uncovered: ${row.uncovered.join(', ') || '—'}`);
	if (row.medium === 'video') {
		lines.push(`- keyframeCovered: ${row.keyframeCovered.join(', ') || '—'}`);
		lines.push(`- videoExtraCovered: ${row.videoExtraCovered.join(', ') || '—'}`);
		lines.push(`- uncoveredVideo: ${row.uncoveredVideo.join(', ') || '—'}`);
	}
	lines.push(`- wouldOmit (hypothetical): ${row.wouldOmit.join(', ') || '—'}`);
	lines.push(`- blockers: ${row.blockers.join(', ') || '—'}`);
	if (row.remediation.length) lines.push(`- remediation: ${JSON.stringify(row.remediation)}`);
	lines.push('');
}

const shotIssues = (plan.shots || [])
	.map((shot) => ({
		shotId: shot.shotId,
		violations: shot.referenceBudget?.violations || [],
		uncovered: shot.referenceBudget?.uncoveredEntityIds || [],
		remediation: shot.remediation || [],
		blockers: (shot.blockers || []).filter(
			(b) =>
				b.startsWith('reference_budget:') ||
				b.startsWith('reference_pack_required') ||
				b.startsWith('reference_consolidation_required') ||
				b.startsWith('uncovered_entity:')
		)
	}))
	.filter((row) => row.blockers.length || row.uncovered.length || row.violations.length);

const allStretchJobs = (plan.visualStretchJobs || []).map(mapStretchJob);
const stretchIssues = allStretchJobs.filter(hasBudgetIssue);
const videoCoverage = allStretchJobs.filter((row) => row.medium === 'video');

const report = {
	scriptId: plan.plan?.scriptId,
	planId: plan.plan?.id,
	shotIssueCount: shotIssues.length,
	stretchIssueCount: stretchIssues.length,
	shots: shotIssues,
	visualStretchJobs: stretchIssues,
	videoCoverage,
	note: 'Read-only. Attached reference lists are never silently trimmed; remediations are advisory. For video jobs, keyframeCovered / videoExtraCovered / uncoveredVideo are authoritative; panel assets need not declare metadata.entityIds. Fallback Seedance jobs do not emit reference_pack_required from missing pack metadata on keyframes.'
};

const outDir = join(ROOT, 'reports', 'reference-budget');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, `${slug}.json`);
writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

const md = [
	`# Reference budget — ${report.scriptId}`,
	'',
	report.note,
	'',
	`Shot issues: ${report.shotIssueCount}. Stretch job issues: ${report.stretchIssueCount}. Video jobs: ${videoCoverage.length}.`,
	''
];

if (videoCoverage.length) {
	md.push('# Video keyframe coverage');
	md.push('');
	for (const row of videoCoverage) appendStretchJobMarkdown(row, md);
}

if (stretchIssues.length) {
	md.push('# Stretch job issues');
	md.push('');
	for (const row of stretchIssues) appendStretchJobMarkdown(row, md);
}

writeFileSync(join(outDir, `${slug}.md`), `${md.join('\n')}\n`, 'utf8');
console.log(`Wrote ${outPath}`);
console.log(
	JSON.stringify(
		{
			shotIssueCount: report.shotIssueCount,
			stretchIssueCount: report.stretchIssueCount,
			videoJobCount: videoCoverage.length
		},
		null,
		2
	)
);
