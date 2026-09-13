/**
 * Visual stretches debt / membership report.
 */
// @ts-nocheck
import { findAdjacentUnstretchedPairs, stretchBlockingBlockers } from './visual-stretch.mjs';
import { computeStretchDigest } from './visual-stretch-digest.mjs';

/**
 * @param {{ visualStretches?: any[], takes?: any[], shots?: any[], script?: { id?: string } }} script
 * @param {object} [_ctx]
 * @param {object} [_projectCtx]
 * @param {string} [language]
 */
export function buildVisualStretchesReport(script, _ctx, _projectCtx, language = 'en') {
	const lang = language === 'es' ? 'es' : 'en';
	const stretches = script.visualStretches || [];
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

	const adjacentWarnings = findAdjacentUnstretchedPairs(script).slice(0, 50);

	return {
		scriptId: script.script?.id,
		stretchCount: stretches.length,
		rows,
		adjacentWarnings,
		summary: {
			draft: rows.filter((r) => r.status === 'draft').length,
			withBlockers: rows.filter((r) => r.blockers.length).length,
			staleDerived: rows.reduce((n, r) => n + r.staleDerivedTakeIds.length, 0)
		}
	};
}

export function formatVisualStretchesMarkdown(report) {
	const lines = [
		`# Visual stretches — ${report.scriptId}`,
		'',
		`Stretches: ${report.stretchCount}. Draft: ${report.summary.draft}. With blockers: ${report.summary.withBlockers}. Stale derived takes: ${report.summary.staleDerived}.`,
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
	if (report.adjacentWarnings.length) {
		lines.push('## Adjacent same-location pairs not in a stretch (sample)');
		for (const pair of report.adjacentWarnings) {
			lines.push(`- ${pair.shotA} ↔ ${pair.shotB} @ ${pair.locationId}`);
		}
		lines.push('');
	}
	return lines.join('\n');
}
