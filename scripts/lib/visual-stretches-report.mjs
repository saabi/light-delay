/**
 * Visual stretches debt / membership report + advisory stretch candidates.
 * Candidate detection never writes ScriptFile JSON.
 */
// @ts-nocheck
import { findAdjacentUnstretchedPairs, stretchBlockingBlockers } from './visual-stretch.mjs';
import {
	findVisualStretchCandidates,
	formatVisualStretchCandidate
} from './visual-stretch-candidates.mjs';
import { computeStretchDigest } from './visual-stretch-digest.mjs';

/**
 * @param {{ visualStretches?: any[], takes?: any[], shots?: any[], scenes?: any[], script?: { id?: string } }} script
 * @param {object} [_ctx]
 * @param {{ locationById?: Map<string, any>, locationsById?: Map<string, any>, locations?: any[] }} [projectCtx]
 * @param {string} [language]
 */
export function buildVisualStretchesReport(script, _ctx, projectCtx = {}, language = 'en') {
	const lang = language === 'es' ? 'es' : 'en';
	const stretches = script.visualStretches || [];
	const locationsById =
		projectCtx.locationsById ||
		projectCtx.locationById ||
		new Map((projectCtx.locations || []).map((loc) => [loc.id, loc]));

	const rows = stretches.map((stretch) => {
		const members = [...(stretch.members || [])].sort((a, b) => a.order - b.order);
		const blockers = [
			...stretchBlockingBlockers(stretch),
			...(!stretch.generationProfile?.gridLayout &&
			stretch.generationProfile?.stillMode === 'combined_storyboard_sheet'
				? ['missing_grid_layout']
				: [])
		];
		const currentDigest = computeStretchDigest(stretch, script);
		const derivedTakes = (script.takes || []).filter(
			(t) => t.generation?.visualStretchId === stretch.id
		);
		const staleDerived = derivedTakes.filter((t) => {
			if (!t.generation?.stretchDigest) return false;
			return t.generation.stretchDigest !== currentDigest;
		});
		const videoPolicy = Object.prototype.hasOwnProperty.call(stretch, 'videoReferenceAssetIds')
			? 'explicit'
			: 'fallback';
		return {
			id: stretch.id,
			title: stretch.title?.[lang] || stretch.title?.en || stretch.id,
			status: stretch.status,
			revision: stretch.revision,
			memberCount: members.length,
			memberShotIds: members.map((m) => m.shotId),
			stillMode: stretch.generationProfile?.stillMode,
			gridLayout: stretch.generationProfile?.gridLayout || null,
			combinedStillAssetId: stretch.combinedStillAssetId || null,
			stillReferenceAssetIds: stretch.referenceAssetIds || [],
			videoReferencePolicy: videoPolicy,
			videoReferenceAssetIds:
				videoPolicy === 'explicit' ? stretch.videoReferenceAssetIds || [] : null,
			incompleteBlocking: blockers.includes('missing_stretch_blocking'),
			derivedTakeCount: derivedTakes.length,
			staleDerivedTakeIds: staleDerived.map((t) => t.id),
			blockers
		};
	});

	const adjacentWarnings = findAdjacentUnstretchedPairs(script, { locationsById }).slice(0, 50);
	const { candidates, suppressedAdjacencies } = findVisualStretchCandidates(script, {
		locationsById
	});

	return {
		scriptId: script.script?.id,
		language: lang,
		generatedAt: new Date().toISOString(),
		stretchCount: stretches.length,
		rows,
		adjacentWarnings,
		candidates,
		suppressedAdjacencies: suppressedAdjacencies.slice(0, 100),
		candidateDetectionNote:
			'Advisory only — editorial review suggestions, not pending production tasks. Candidate detection never writes visualStretches or other JSON; editorial approval is required before authoring a stretch.',
		summary: {
			draft: rows.filter((r) => r.status === 'draft').length,
			withBlockers: rows.filter((r) => r.blockers.length).length,
			staleDerived: rows.reduce((n, r) => n + r.staleDerivedTakeIds.length, 0),
			candidateCount: candidates.length,
			suggestedCandidates: candidates.filter((c) => c.status === 'suggested').length
		}
	};
}

export function formatVisualStretchesMarkdown(report) {
	const lines = [
		`# Visual stretches — ${report.scriptId}`,
		'',
		report.candidateDetectionNote ||
			'Advisory only. Candidate detection never writes visualStretches or other JSON.',
		'',
		`Stretches: ${report.stretchCount}. Draft: ${report.summary.draft}. With blockers: ${report.summary.withBlockers}. Stale derived takes: ${report.summary.staleDerived}. Candidates: ${report.summary.candidateCount ?? 0} (suggested: ${report.summary.suggestedCandidates ?? 0}).`,
		''
	];
	for (const row of report.rows) {
		lines.push(`## ${row.id}`);
		lines.push(`- title: ${row.title}`);
		lines.push(`- status: ${row.status} · revision ${row.revision}`);
		lines.push(`- members (${row.memberCount}): ${row.memberShotIds.join(', ')}`);
		lines.push(`- stillMode: ${row.stillMode}`);
		lines.push(`- sheet: ${row.combinedStillAssetId || '—'}`);
		lines.push(
			`- still refs (${row.stillReferenceAssetIds.length}): ${row.stillReferenceAssetIds.join(', ') || '—'}`
		);
		lines.push(`- videoReferencePolicy: ${row.videoReferencePolicy}`);
		if (row.videoReferencePolicy === 'explicit') {
			lines.push(
				`- video refs (${row.videoReferenceAssetIds.length}): ${row.videoReferenceAssetIds.join(', ') || '—'}`
			);
		}
		lines.push(`- blockers: ${row.blockers.length ? row.blockers.join(', ') : 'none'}`);
		if (row.staleDerivedTakeIds.length) {
			lines.push(`- stale derived: ${row.staleDerivedTakeIds.join(', ')}`);
		}
		lines.push('');
	}
	if (report.candidates?.length) {
		lines.push('## Editorial stretch candidates (advisory — not production tasks)');
		lines.push('');
		lines.push(
			'These are review suggestions only. Do not treat them as pending generation work; authoring a stretch requires explicit editorial approval.'
		);
		lines.push('');
		for (const candidate of report.candidates) {
			lines.push('```');
			lines.push(formatVisualStretchCandidate(candidate));
			lines.push('```');
			lines.push('');
		}
	}
	if (report.suppressedAdjacencies?.length) {
		lines.push('## Suppressed adjacencies (sample)');
		for (const row of report.suppressedAdjacencies.slice(0, 40)) {
			lines.push(`- ${row.shotA} ↔ ${row.shotB}: ${row.reason}`);
		}
		lines.push('');
	}
	if (report.adjacentWarnings?.length) {
		lines.push('## Adjacent same-location pairs not in a stretch (legacy sample)');
		for (const pair of report.adjacentWarnings) {
			lines.push(`- ${pair.shotA} ↔ ${pair.shotB} @ ${pair.locationId}`);
		}
		lines.push('');
	}
	return lines.join('\n');
}
