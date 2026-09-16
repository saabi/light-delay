#!/usr/bin/env node
/**
 * Festival-master: no-video shot inventory, custody/integrity audit, orphan video ledger.
 * Read-only. Writes reports/festival-master-no-video-integrity.md (+ .json).
 *
 * Usage: node scripts/report-festival-master-no-video-integrity.mjs
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT_SLUG = 'light-delay-festival-master';
const OUT_DIR = join(ROOT, 'reports');
const OUT_MD = join(OUT_DIR, 'festival-master-no-video-integrity.md');
const OUT_JSON = join(OUT_DIR, 'festival-master-no-video-integrity.json');

const script = JSON.parse(readFileSync(join(ROOT, 'data/scripts', `${SCRIPT_SLUG}.json`), 'utf8'));
const assetsFile = JSON.parse(readFileSync(join(ROOT, 'data/assets.json'), 'utf8'));
const plan = JSON.parse(
	readFileSync(join(ROOT, 'data/production/plans', `${SCRIPT_SLUG}.json`), 'utf8')
);

const assets = assetsFile.assets || [];
const assetsById = new Map(assets.map((a) => [a.id, a]));
const takesById = new Map((script.takes || []).map((t) => [t.id, t]));
const scenesById = new Map((script.scenes || []).map((s) => [s.id, s]));
const stretches = script.visualStretches || [];
const stretchByShot = new Map();
for (const st of stretches) {
	for (const m of st.members || []) stretchByShot.set(m.shotId, st);
}

const PLAYABLE = new Set(['current', 'needs_review']);

function catalogExists(path) {
	if (!path || typeof path !== 'string') return false;
	const rel = path.replace(/^\//, '');
	return existsSync(join(ROOT, 'static', rel));
}

function isPlayableVideo(asset) {
	if (!asset || asset.kind !== 'video') return false;
	if (!asset.path || !catalogExists(asset.path)) return false;
	const status = asset.imageStatus?.status ?? 'current';
	return PLAYABLE.has(status);
}

/** Shot has registered playable video via stretch job member or selected-take videoAssetId. */
function videoCoverageForShot(shot) {
	const take = takesById.get(shot.selectedTakeId);
	if (take?.videoAssetId) {
		const asset = assetsById.get(take.videoAssetId);
		if (isPlayableVideo(asset)) {
			return { covered: true, via: 'selectedTake', assetId: take.videoAssetId, jobId: null };
		}
		if (take.videoAssetId) {
			return {
				covered: false,
				via: 'danglingTakeVideo',
				assetId: take.videoAssetId,
				jobId: null,
				note: asset ? 'asset unplayable (missing file or bad status)' : 'assetId missing from assets.json'
			};
		}
	}

	for (const job of plan.visualStretchJobs || []) {
		if (job.medium !== 'video') continue;
		const members = job.memberInputs || [];
		if (!members.some((m) => m.shotId === shot.id)) continue;
		const out = (job.outputs || []).find((o) => o.artifact === 'video' && o.assetId);
		if (!out?.assetId) {
			return {
				covered: false,
				via: 'stretchJobNoOutput',
				assetId: null,
				jobId: job.id,
				note: 'plan video job exists but no outputs.assetId'
			};
		}
		const asset = assetsById.get(out.assetId);
		if (isPlayableVideo(asset)) {
			return { covered: true, via: 'stretchJob', assetId: out.assetId, jobId: job.id };
		}
		return {
			covered: false,
			via: 'stretchJobUnplayable',
			assetId: out.assetId,
			jobId: job.id,
			note: 'registered asset not playable'
		};
	}

	return { covered: false, via: 'none', assetId: null, jobId: null };
}

function textBlob(...parts) {
	return parts
		.flat()
		.map((p) => {
			if (!p) return '';
			if (typeof p === 'string') return p;
			if (typeof p === 'object' && p.en) return p.en;
			return JSON.stringify(p);
		})
		.join('\n')
		.toLowerCase();
}

/** Canon windows for Sorell / Harlan on the bridge. */
const SORELL_RETAINED_FROM_SHOT = 'festival-master:shot-plan-046';
const SORELL_RELEASED_AT_SHOT = 'festival-master:shot-plan-068';
const HARLAN_HELD_FROM_SHOT = 'festival-master:shot-plan-064';

function shotSortKey(id) {
	const m = /shot-plan-(\d+)([a-z])?/.exec(id);
	if (!m) return 99999;
	return Number(m[1]) * 100 + (m[2] ? m[2].charCodeAt(0) - 96 : 0);
}

function sorellCanonStatus(shotId) {
	const k = shotSortKey(shotId);
	if (k < shotSortKey(SORELL_RETAINED_FROM_SHOT)) return 'free';
	if (k < shotSortKey(SORELL_RELEASED_AT_SHOT)) return 'retained';
	return 'released';
}

function harlanCanonStatus(shotId) {
	if (shotSortKey(shotId) >= shotSortKey(HARLAN_HELD_FROM_SHOT)) return 'held_or_escaped_arc';
	return 'crew';
}

const FREE_CREW_PATTERNS = [
	/translator\/?crew station/i,
	/crew station/i,
	/seated, listening/i,
	/standing, listening/i,
	/full crew still at the blocked stations/i,
	/voss and sorell attend/i,
	/bridge crew/i,
	/present, listening/i
];

const CUSTODY_PATTERNS = [
	/\bunder watch\b/i,
	/\bretained\b/i,
	/\bdetain/i,
	/\bcustody\b/i,
	/\bheld\b/i,
	/\bprisoner\b/i,
	/\bguard(ed|ing)?\b/i,
	/\brestraint\b/i,
	/\bhands where\b/i,
	/\bsupervision\b/i
];

function auditSorellOnStretch(stretch, shotIds) {
	const findings = [];
	const present = new Set(stretch.presentCharacterIds || []);
	const retainedShots = shotIds.filter((id) => sorellCanonStatus(id) === 'retained');
	if (!retainedShots.length) {
		return { severity: 'ok', findings: ['No retained-window shots in this stretch.'] };
	}
	if (!present.has('character:sorell')) {
		return {
			severity: 'ok',
			findings: ['Sorell not in presentCharacterIds — custody staging N/A for this stretch.']
		};
	}

	const sorellBlocking = (stretch.blocking || []).find((b) => b.characterId === 'character:sorell');
	const okoyeBlocking = (stretch.blocking || []).find((b) => b.characterId === 'character:okoye');
	const blob = textBlob(
		stretch.sharedDescription,
		stretch.physics,
		...(stretch.members || []).flatMap((m) => [m.startState, m.event, m.endState]),
		sorellBlocking,
		okoyeBlocking
	);

	const hasCustodyLanguage = CUSTODY_PATTERNS.some((re) => re.test(blob));
	const freeSignals = [];
	for (const re of FREE_CREW_PATTERNS) {
		if (!re.test(blob)) continue;
		// "bridge crew" alone is too weak when custody language is already present.
		if (re.source === 'bridge crew' && hasCustodyLanguage) continue;
		freeSignals.push(re.source);
	}

	if (sorellBlocking) {
		const zone = `${sorellBlocking.zoneOrSeat || ''} ${sorellBlocking.posture || ''}`;
		if (/translator|crew station/i.test(zone) && !/watch|detain|held|custody|guard/i.test(zone)) {
			findings.push(
				`Sorell blocking reads free crew: zoneOrSeat="${sorellBlocking.zoneOrSeat}", posture="${sorellBlocking.posture}"`
			);
		}
	} else {
		findings.push('Sorell missing from stretch.blocking while present and retained.');
	}

	if (!hasCustodyLanguage) {
		findings.push('No custody/under-watch language in sharedDescription, stages, or blocking.');
	}
	if (freeSignals.length) {
		findings.push(`Free-crew wording matches: ${freeSignals.join('; ')}`);
	}

	// Okoye should often be near Sorell while she is retained (until Harlan hold dominates).
	const preHarlanHold = retainedShots.every((id) => shotSortKey(id) < shotSortKey(HARLAN_HELD_FROM_SHOT));
	if (preHarlanHold && okoyeBlocking) {
		const oz = `${okoyeBlocking.zoneOrSeat || ''} ${okoyeBlocking.eyelineTarget || ''}`;
		if (!/sorell|watch|guard|detain|custody/i.test(oz) && !/character:sorell/i.test(oz)) {
			findings.push(
				`Okoye blocking does not reference guarding Sorell (zone="${okoyeBlocking.zoneOrSeat}", eyeline="${okoyeBlocking.eyelineTarget}")`
			);
		}
	}

	const severity = findings.length ? 'blocking' : 'ok';
	return { severity, findings, sorellBlocking, hasCustodyLanguage };
}

function auditShotIntegrity(shot) {
	const issues = [];
	let severity = 'ok';
	const stretch = stretchByShot.get(shot.id);
	const take = takesById.get(shot.selectedTakeId);
	const imgAsset = take?.imageAssetId ? assetsById.get(take.imageAssetId) : null;
	const desc = shot.description?.en || '';

	const sorellStatus = sorellCanonStatus(shot.id);
	if (sorellStatus === 'retained') {
		const shotBlob = textBlob(desc, shot.visibleRefs);
		const stretchAudit = stretch
			? auditSorellOnStretch(stretch, (stretch.members || []).map((m) => m.shotId))
			: null;
		if (stretchAudit?.severity === 'blocking') {
			severity = 'blocking';
			issues.push(...stretchAudit.findings.map((f) => `stretch:${stretch.id}: ${f}`));
		}
		if (
			/\bsorell\b/i.test(desc) &&
			!CUSTODY_PATTERNS.some((re) => re.test(desc)) &&
			FREE_CREW_PATTERNS.some((re) => re.test(desc))
		) {
			severity = 'blocking';
			issues.push('Shot.description stages Sorell as free crew during retained window.');
		}
	}

	if (!stretch) {
		severity = severity === 'blocking' ? 'blocking' : 'debt';
		issues.push('No visualStretch covering this shot.');
	} else {
		if (!stretch.combinedStillAssetId && stretch.generationProfile?.stillMode === 'combined_storyboard_sheet') {
			severity = severity === 'blocking' ? 'blocking' : 'debt';
			issues.push('combinedStillAssetId missing.');
		}
		const placeholder = textBlob(
			stretch.sharedDescription,
			...(stretch.members || []).flatMap((m) => [m.startState, m.event, m.endState]),
			...(stretch.blocking || [])
		);
		if (/established-\d+/i.test(placeholder) || /\bother\b/.test(JSON.stringify(stretch.blocking || []))) {
			severity = severity === 'blocking' ? 'blocking' : 'debt';
			issues.push('Placeholder blocking/stages (established-N or posture other).');
		}
	}

	if (imgAsset?.imageStatus?.status === 'needs_regeneration') {
		if (severity === 'ok') severity = 'debt';
		issues.push(`Selected still ${imgAsset.id} marked needs_regeneration.`);
	}

	// Selection debt: selected take image from obsolete stretch path while newer candidate exists
	if (take?.imageAssetId && /064-067-panel/.test(take.imageAssetId)) {
		severity = severity === 'blocking' ? 'blocking' : 'debt';
		issues.push(
			`Selected take still uses pre-split panel ${take.imageAssetId}; newer split stretch candidates may exist.`
		);
	}

	return { severity, issues, stretchId: stretch?.id || null, sorellStatus, imageAssetId: take?.imageAssetId || null };
}

function walkMp4s(dir, acc = []) {
	if (!existsSync(dir)) return acc;
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		const st = statSync(p);
		if (st.isDirectory()) walkMp4s(p, acc);
		else if (name.toLowerCase().endsWith('.mp4')) acc.push(p);
	}
	return acc;
}

function buildOrphanLedger() {
	const fmRoot = join(ROOT, 'static/assets/animatic/frames/festival-master');
	const diskMp4s = walkMp4s(fmRoot).map((abs) => ({
		abs,
		rel: relative(ROOT, abs).replace(/\\/g, '/'),
		catalogPath: '/' + relative(join(ROOT, 'static'), abs).replace(/\\/g, '/')
	}));

	const videoAssets = assets.filter(
		(a) =>
			a.kind === 'video' &&
			(a.id.includes('festival-master') || (a.path || '').includes('festival-master'))
	);

	const boundAssetIds = new Set();
	for (const job of plan.visualStretchJobs || []) {
		if (job.medium !== 'video') continue;
		for (const o of job.outputs || []) {
			if (o.assetId) boundAssetIds.add(o.assetId);
		}
	}
	for (const shot of script.shots || []) {
		const take = takesById.get(shot.selectedTakeId);
		if (take?.videoAssetId) boundAssetIds.add(take.videoAssetId);
	}

	const liveStretchIds = new Set(stretches.map((s) => s.id));
	const liveJobIds = new Set((plan.visualStretchJobs || []).map((j) => j.id));

	const intentionalKeep = [];
	const accidental = [];
	const gaps = [];

	for (const asset of videoAssets) {
		const sj = asset.metadata?.stretchJobId || '';
		const stretchIdFromMeta = sj.replace(/:rev-\d+.*$/, '');
		const bound = boundAssetIds.has(asset.id);
		const pathOk = catalogExists(asset.path);

		if (bound && pathOk) continue;

		if (sj.includes('reactor-record-033-036')) {
			intentionalKeep.push({
				kind: 'asset',
				id: asset.id,
				path: asset.path,
				reason: 'Post-split supersession; stretch removed (033-035 + confront-036-038). Keep orphaned.'
			});
			continue;
		}
		if (asset.id.includes('shot-plan-title-rev-1')) {
			intentionalKeep.push({
				kind: 'asset',
				id: asset.id,
				path: asset.path,
				reason: 'Superseded by title rev-2. Keep orphaned.'
			});
			continue;
		}
		if (!bound && stretchIdFromMeta && !liveStretchIds.has(stretchIdFromMeta)) {
			intentionalKeep.push({
				kind: 'asset',
				id: asset.id,
				path: asset.path,
				reason: `Stretch ${stretchIdFromMeta} no longer live. Keep orphaned.`
			});
			continue;
		}
		if (!bound) {
			accidental.push({
				kind: 'asset',
				id: asset.id,
				path: asset.path,
				reason: 'Video asset not bound to plan outputs or selected take.'
			});
		} else if (!pathOk) {
			accidental.push({
				kind: 'asset',
				id: asset.id,
				path: asset.path,
				reason: 'Bound asset path missing on disk.'
			});
		}
	}

	const assetPaths = new Set(videoAssets.map((a) => (a.path || '').replace(/\\/g, '/')));
	for (const file of diskMp4s) {
		if (assetPaths.has(file.catalogPath)) continue;
		if (file.rel.includes('040b-rev-1')) {
			intentionalKeep.push({
				kind: 'disk',
				path: file.rel,
				reason: 'Superseded by 040b rev-2 asset. Keep orphaned.'
			});
			continue;
		}
		if (file.rel.includes('preamble-raw')) {
			intentionalKeep.push({
				kind: 'disk',
				path: file.rel,
				reason: 'Intermediate raw. Keep orphaned.'
			});
			continue;
		}
		if (file.rel.includes('013b-rev-1-video-1')) {
			intentionalKeep.push({
				kind: 'disk',
				path: file.rel,
				reason: 'Superseded by 013b rev-2 bound take video. Keep orphaned on disk.'
			});
			continue;
		}
		if (file.rel.includes('reactor-record-033-036')) {
			intentionalKeep.push({
				kind: 'disk',
				path: file.rel,
				reason: 'Disk file for superseded 033-036 stretch videos. Keep orphaned.'
			});
			continue;
		}
		accidental.push({
			kind: 'disk',
			path: file.rel,
			reason: 'MP4 on disk with no matching assets.json video path.'
		});
	}

	// Plan gaps: video jobs with members but no assetId
	for (const job of plan.visualStretchJobs || []) {
		if (job.medium !== 'video') continue;
		const out = (job.outputs || []).find((o) => o.artifact === 'video');
		if (out?.assetId) continue;
		gaps.push({
			jobId: job.id,
			stretchId: job.stretchId,
			memberShotIds: (job.memberInputs || []).map((m) => m.shotId),
			reason: 'Plan video job has no outputs.assetId (unregistered or failed).'
		});
	}

	// Wrong-range check: bound video job members must be subset of live stretch members
	const wrongRange = [];
	for (const job of plan.visualStretchJobs || []) {
		if (job.medium !== 'video') continue;
		const out = (job.outputs || []).find((o) => o.artifact === 'video' && o.assetId);
		if (!out?.assetId) continue;
		const stretch = stretches.find((s) => s.id === job.stretchId);
		if (!stretch) {
			wrongRange.push({ jobId: job.id, issue: 'Job stretchId not in script.visualStretches' });
			continue;
		}
		const liveMembers = new Set((stretch.members || []).map((m) => m.shotId));
		for (const m of job.memberInputs || []) {
			if (!liveMembers.has(m.shotId)) {
				wrongRange.push({
					jobId: job.id,
					shotId: m.shotId,
					issue: 'memberInputs shot not in current stretch membership'
				});
			}
		}
	}

	return {
		diskMp4Count: diskMp4s.length,
		festivalVideoAssetCount: videoAssets.length,
		boundPlanOrTakeVideos: boundAssetIds.size,
		intentionalKeep,
		accidental,
		gaps,
		wrongRange,
		liveJobIds: [...liveJobIds].length
	};
}

function buildRemediationProposal(noVideoRows, stretchCustody) {
	const failing = stretchCustody.filter((s) => s.severity === 'blocking');
	const assetIds = new Set();
	for (const row of failing) {
		const stretch = stretches.find((s) => s.id === row.stretchId);
		if (stretch?.combinedStillAssetId) assetIds.add(stretch.combinedStillAssetId);
		for (const a of assets) {
			if (a.metadata?.visualStretchId === row.stretchId && a.kind === 'image') {
				assetIds.add(a.id);
			}
		}
	}

	const edits = failing.map((row) => {
		const stretch = stretches.find((s) => s.id === row.stretchId);
		return {
			stretchId: row.stretchId,
			memberShotIds: (stretch?.members || []).map((m) => m.shotId),
			requiredChanges: [
				'Rewrite Sorell blocking: provisional custody / under watch (not free translator-crew station).',
				'Add custody language to sharedDescription and member stages where she is visible.',
				'Until shot 064, Okoye (or explicit watch geography) should read as guarding Sorell; from 064, Harlan is held but Sorell remains retained until 068 — do not stage her as collaborating free crew.',
				'Align shot.description / visibleRefs roles for Sorell (retained / under watch).',
				'Do not change release dialogue/beat at shot-plan-068.'
			],
			findings: row.findings
		};
	});

	return {
		doNotRegenerateUntilApproval: true,
		authorshipTargets: edits,
		markNeedsRegenerationAssetIds: [...assetIds].sort(),
		selectionNotes: [
			'064/065–067: selected takes may still point at pre-split …-064-067-panel-*; after custody-fixed regen, promote new candidates only with explicit approval.',
			'013b: register missing video asset or clear dangling videoAssetId (accidental orphan).'
		],
		doNotTouchOrphans: [
			'asset:festival-master-stretch-reactor-record-033-036-rev-1-video-1-video',
			'asset:festival-master-stretch-reactor-record-033-036-rev-1-video-2-video',
			'asset:festival-master-shot-plan-title-rev-1-video-1-video',
			'static/.../shot-plan-040b-rev-1-video-1.mp4',
			'static/.../shot-plan-title-rev-2-preamble-raw.mp4'
		]
	};
}

// --- assemble ---
const coverage = [];
const noVideo = [];
for (const shot of script.shots || []) {
	const cov = videoCoverageForShot(shot);
	const scene = scenesById.get(shot.sceneId);
	const row = {
		shotId: shot.id,
		sceneId: shot.sceneId,
		sceneTitle: scene?.title?.en || scene?.id || '',
		stretchId: stretchByShot.get(shot.id)?.id || null,
		...cov
	};
	coverage.push(row);
	if (!cov.covered) noVideo.push(row);
}

const integrityByShot = noVideo.map((row) => {
	const shot = script.shots.find((s) => s.id === row.shotId);
	const audit = auditShotIntegrity(shot);
	return { ...row, ...audit };
});

const stretchIdsInNoVideo = [
	...new Set(integrityByShot.map((r) => r.stretchId).filter(Boolean))
];
const stretchCustody = stretchIdsInNoVideo.map((stretchId) => {
	const stretch = stretches.find((s) => s.id === stretchId);
	const memberShotIds = (stretch.members || []).map((m) => m.shotId);
	const retainedMembers = memberShotIds.filter((id) => sorellCanonStatus(id) === 'retained');
	if (!retainedMembers.length) {
		return { stretchId, severity: 'ok', findings: ['Outside Sorell retained window.'], memberShotIds };
	}
	const audit = auditSorellOnStretch(stretch, memberShotIds);
	return { stretchId, memberShotIds, ...audit };
});

const orphans = buildOrphanLedger();
const remediation = buildRemediationProposal(integrityByShot, stretchCustody);

const summary = {
	generatedAt: new Date().toISOString(),
	scriptId: script.script?.id || `script:${SCRIPT_SLUG}`,
	shotCount: script.shots?.length || 0,
	withVideo: coverage.filter((r) => r.covered).length,
	noVideo: noVideo.length,
	integrityBlocking: integrityByShot.filter((r) => r.severity === 'blocking').length,
	integrityDebt: integrityByShot.filter((r) => r.severity === 'debt').length,
	integrityOk: integrityByShot.filter((r) => r.severity === 'ok').length,
	stretchCustodyBlocking: stretchCustody.filter((s) => s.severity === 'blocking').length,
	orphanIntentional: orphans.intentionalKeep.length,
	orphanAccidental: orphans.accidental.length,
	planVideoGaps: orphans.gaps.length,
	wrongRange: orphans.wrongRange.length
};

const report = {
	summary,
	noVideoShots: integrityByShot,
	stretchCustody,
	orphans,
	remediation
};

function mdEscape(s) {
	return String(s || '').replace(/\|/g, '\\|');
}

function formatMd(reportData) {
	const lines = [];
	const s = reportData.summary;
	lines.push('# Festival-master no-video integrity + orphan video audit');
	lines.push('');
	lines.push(`Generated: ${s.generatedAt}`);
	lines.push('');
	lines.push('## Summary');
	lines.push('');
	lines.push(`- Shots: **${s.shotCount}**`);
	lines.push(`- With registered playable video: **${s.withVideo}**`);
	lines.push(`- Without video (audit set): **${s.noVideo}**`);
	lines.push(
		`- Integrity: blocking **${s.integrityBlocking}**, debt **${s.integrityDebt}**, ok **${s.integrityOk}**`
	);
	lines.push(`- Stretches with Sorell custody blocking findings: **${s.stretchCustodyBlocking}**`);
	lines.push(
		`- Orphans: intentional keep **${s.orphanIntentional}**, accidental **${s.orphanAccidental}**, plan gaps **${s.planVideoGaps}**, wrong-range **${s.wrongRange}**`
	);
	lines.push('');
	lines.push('## Canon windows');
	lines.push('');
	lines.push(
		'- **Sorell free:** before scene 17 (`046`). **Retained / under watch:** `046`–`067`. **Released:** `068`.'
	);
	lines.push('- **Harlan held:** command-break from `064` (Sorell remains retained until `068`).');
	lines.push('');
	lines.push('## Sorell custody findings (no-video stretches)');
	lines.push('');
	for (const row of reportData.stretchCustody) {
		lines.push(`### \`${row.stretchId}\` — **${row.severity}**`);
		lines.push('');
		lines.push(`Members: ${row.memberShotIds.map((id) => `\`${id}\``).join(', ')}`);
		lines.push('');
		for (const f of row.findings || []) lines.push(`- ${f}`);
		lines.push('');
	}
	lines.push('## No-video inventory');
	lines.push('');
	lines.push('| Shot | Scene | Stretch | Severity | Via / note |');
	lines.push('|---|---|---|---|---|');
	for (const row of reportData.noVideoShots) {
		const note = row.note || row.via || '';
		lines.push(
			`| \`${row.shotId.replace('festival-master:', '')}\` | ${mdEscape(row.sceneTitle)} | \`${(row.stretchId || '—').replace('festival-master:', '')}\` | **${row.severity}** | ${mdEscape(note)} |`
		);
	}
	lines.push('');
	lines.push('### Per-shot issues (non-ok)');
	lines.push('');
	for (const row of reportData.noVideoShots.filter((r) => r.severity !== 'ok')) {
		lines.push(`- **\`${row.shotId}\`** (${row.severity}):`);
		for (const issue of row.issues || []) lines.push(`  - ${issue}`);
	}
	lines.push('');
	lines.push('## Orphan video ledger');
	lines.push('');
	lines.push(
		`Disk MP4s under festival-master: **${reportData.orphans.diskMp4Count}**; video assets: **${reportData.orphans.festivalVideoAssetCount}**.`
	);
	lines.push('');
	lines.push('### Keep orphaned (do not delete / do not rebind)');
	lines.push('');
	for (const item of reportData.orphans.intentionalKeep) {
		lines.push(`- \`${item.id || item.path}\` — ${item.reason}`);
	}
	lines.push('');
	lines.push('### Accidental (fix)');
	lines.push('');
	if (!reportData.orphans.accidental.length) lines.push('- None.');
	for (const item of reportData.orphans.accidental) {
		lines.push(`- \`${item.id || item.path}\` — ${item.reason}`);
	}
	lines.push('');
	lines.push('### Plan video gaps (unregistered / failed)');
	lines.push('');
	for (const g of reportData.orphans.gaps) {
		lines.push(
			`- \`${g.jobId}\` members ${g.memberShotIds.map((id) => id.replace('festival-master:', '')).join(', ')} — ${g.reason}`
		);
	}
	lines.push('');
	lines.push('### Wrong-range bound videos');
	lines.push('');
	if (!reportData.orphans.wrongRange.length) lines.push('- None.');
	for (const w of reportData.orphans.wrongRange) {
		lines.push(`- \`${w.jobId}\` ${w.shotId || ''} — ${w.issue}`);
	}
	lines.push('');
	lines.push('## Remediation proposal (no regen until approval)');
	lines.push('');
	lines.push(
		'Do **not** regenerate stills or submit Seedance until authorship below is applied and you approve generation.'
	);
	lines.push('');
	for (const edit of reportData.remediation.authorshipTargets) {
		lines.push(`### Authorship: \`${edit.stretchId}\``);
		lines.push('');
		for (const c of edit.requiredChanges) lines.push(`- ${c}`);
		lines.push('');
	}
	lines.push('### Assets to mark `needs_regeneration` + `continuity_error` after authorship');
	lines.push('');
	for (const id of reportData.remediation.markNeedsRegenerationAssetIds) {
		lines.push(`- \`${id}\``);
	}
	lines.push('');
	lines.push('### Selection / registration notes');
	lines.push('');
	for (const n of reportData.remediation.selectionNotes) lines.push(`- ${n}`);
	lines.push('');
	lines.push('### Do-not-touch orphans');
	lines.push('');
	for (const id of reportData.remediation.doNotTouchOrphans) lines.push(`- \`${id}\``);
	lines.push('');
	return lines.join('\n');
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
writeFileSync(OUT_MD, `${formatMd(report)}\n`, 'utf8');
console.log(
	JSON.stringify(
		{
			ok: true,
			summary,
			outMd: relative(ROOT, OUT_MD).replace(/\\/g, '/'),
			outJson: relative(ROOT, OUT_JSON).replace(/\\/g, '/')
		},
		null,
		2
	)
);
