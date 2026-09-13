/**
 * Draft + apply migration of Festival-master continuity ledger causal objects
 * onto the master outline. Mapping is 1:1 pending author sign-off for splits/merges.
 *
 * Usage:
 *   node scripts/migrate-festival-ledger-to-master-facts.mjs --draft
 *   node scripts/migrate-festival-ledger-to-master-facts.mjs --write
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const write = process.argv.includes('--write');

const FACT_KEBAB = {
	'festival-master:fact-01': 'voss-misread-motives',
	'festival-master:fact-02': 'harlan-loading-access-open',
	'festival-master:fact-03': 'first-thrust-cutoff-done',
	'festival-master:fact-04': 'undeclared-mass-neutron-aft',
	'festival-master:fact-05': 'impulse-package-identified',
	'festival-master:fact-06': 'sabotage-heard-comms-cut',
	'festival-master:fact-07': 'only-moving-intercept-left',
	'festival-master:fact-08': 'burst-sent-earth-wrong-inference',
	'festival-master:fact-09': 'zao-dead-flight-cut-after-murder',
	'festival-master:fact-10': 'sorell-found-body-cameras',
	'festival-master:fact-11': 'harlan-accusation-not-proof',
	'festival-master:fact-12': 'case-open-station-leg',
	'festival-master:fact-13': 'engine-healthy-separate-causes',
	'festival-master:fact-14': 'vault-lock-rejects-timing-diagnostic',
	'festival-master:fact-15': 'burst-corridor-signal-incoming',
	'festival-master:fact-16': 'recording-ids-bomb-harlan',
	'festival-master:fact-17': 'evidence-converges-revoke-harlan',
	'festival-master:fact-18': 'aft-console-only-interrupt',
	'festival-master:fact-19': 'harlan-escaped-with-wrist',
	'festival-master:fact-20': 'fourth-cutoff-bypass-stairs',
	'festival-master:fact-21': 'bomb-delayable-scientific-input',
	'festival-master:fact-22': 'clean-greeting-prepared',
	'festival-master:fact-23': 'station-answered-emissary',
	'festival-master:fact-24': 'voss-earth-record-credits-zao'
};

const AUDIENCE = {
	'festival-master:fact-08': 'implied',
	'festival-master:fact-16': 'overt'
};

function load(rel) {
	return JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
}

function masterId(legacyFactId) {
	const kebab = FACT_KEBAB[legacyFactId];
	if (!kebab) throw new Error(`No kebab mapping for ${legacyFactId}`);
	return `master:fact-${kebab}`;
}

const ledger = load('data/continuity/light-delay-festival-master.json');
const festOutline = load('data/outlines/light-delay-festival-master.json');
const master = load('data/outlines/light-delay-master-narrative.json');

const festStoryById = new Map(
	festOutline.steps.filter((s) => s.level === 'story').map((s) => [s.id, s])
);
const ledgerStepById = new Map(ledger.steps.map((s) => [s.id, s]));

function masterStepsForFestivalStory(festivalStoryId) {
	const step = festStoryById.get(festivalStoryId);
	if (!step) throw new Error(`Missing festival story ${festivalStoryId}`);
	return (step.sourceRefs || [])
		.filter((r) => r.kind === 'outline' && r.outlineId === 'outline:light-delay-master-narrative')
		.map((r) => r.stepId);
}

function remapLedgerStepToMasterStory(ledgerStepId) {
	const ls = ledgerStepById.get(ledgerStepId);
	if (!ls) throw new Error(`Missing ledger step ${ledgerStepId}`);
	const outlineId = ls.outlineStepIds?.[0];
	const masters = masterStepsForFestivalStory(outlineId);
	if (!masters.length) throw new Error(`No master sourceRefs for ${outlineId}`);
	return masters[masters.length - 1];
}

const mappingRows = ledger.facts.map((fact) => {
	const step = ledger.steps.find((s) => s.revealsFactIds?.includes(fact.id));
	const festivalStoryId = step?.outlineStepIds?.[0];
	const masters = masterStepsForFestivalStory(festivalStoryId);
	return {
		legacyFactId: fact.id,
		masterFactId: masterId(fact.id),
		festivalStoryId,
		ledgerStepId: step?.id,
		masterSourceStepIds: masters,
		introducedInStepId: masters[masters.length - 1],
		descriptionEn: fact.description?.en,
		signOff: 'pending_author_review'
	};
});

const facts = ledger.facts.map((fact) => {
	const row = mappingRows.find((r) => r.legacyFactId === fact.id);
	const step = ledger.steps.find((s) => s.revealsFactIds?.includes(fact.id));
	const dependsOn = (step?.requiresFactIds || []).map(masterId);
	return {
		id: row.masterFactId,
		description: fact.description,
		dependsOnFactIds: dependsOn,
		introducedInStepId: row.introducedInStepId,
		audienceVisibility: AUDIENCE[fact.id] || 'overt',
		status: 'active',
		legacyIds: [fact.id]
	};
});

const knowledgeEvents = ledger.knowledgeEvents.map((ev) => ({
	stepId: remapLedgerStepToMasterStory(ev.stepId),
	factId: masterId(ev.factId),
	characterIds: ev.characterIds
}));

const actionRequirements = ledger.actionRequirements.map((req) => ({
	stepId: remapLedgerStepToMasterStory(req.stepId),
	actorId: req.actorId,
	action: req.action,
	requiresKnownFactIds: (req.requiresKnownFactIds || []).map(masterId)
}));

/** Attach requires/reveals onto master story steps that introduce facts. */
const stepFactMeta = new Map();
for (const row of mappingRows) {
	const ledgerStep = ledger.steps.find((s) => s.id === row.ledgerStepId);
	const intro = row.introducedInStepId;
	const cur = stepFactMeta.get(intro) || { requiresFactIds: new Set(), revealsFactIds: new Set() };
	for (const id of ledgerStep?.requiresFactIds || []) cur.requiresFactIds.add(masterId(id));
	cur.revealsFactIds.add(row.masterFactId);
	stepFactMeta.set(intro, cur);
}

const draftDir = join(ROOT, 'docs/production');
const draftPath = join(draftDir, 'MASTER_FACT_MIGRATION_MAP.md');
const draftMd = [
	'# Master fact migration map (Festival ledger → master outline)',
	'',
	'**Status:** pending author sign-off for splits/merges/renames. Agents drafted a 1:1 port.',
	'',
	'| Legacy id | Master id | Festival story | Introduced in master step | EN (abbrev) |',
	'| --- | --- | --- | --- | --- |',
	...mappingRows.map(
		(r) =>
			`| \`${r.legacyFactId}\` | \`${r.masterFactId}\` | \`${r.festivalStoryId}\` | \`${r.introducedInStepId}\` | ${(r.descriptionEn || '').slice(0, 72)} |`
	),
	'',
	'Sign-off: _______________ date: _______________',
	''
].join('\n');

mkdirSync(draftDir, { recursive: true });
writeFileSync(draftPath, draftMd, 'utf8');
console.log(`Wrote draft map: ${draftPath}`);

if (!write) {
	console.log('Dry run only. Re-run with --write to patch master outline + obsolete Festival ledger.');
	console.log(
		JSON.stringify(
			{ facts: facts.length, knowledgeEvents: knowledgeEvents.length, actionRequirements: actionRequirements.length },
			null,
			2
		)
	);
	process.exit(0);
}

for (const step of master.steps) {
	const meta = stepFactMeta.get(step.id);
	if (!meta) {
		delete step.requiresFactIds;
		delete step.revealsFactIds;
		continue;
	}
	step.requiresFactIds = [...meta.requiresFactIds];
	step.revealsFactIds = [...meta.revealsFactIds];
}

master.facts = facts;
master.knowledgeEvents = knowledgeEvents;
master.actionRequirements = actionRequirements;
master.outline.revision = (master.outline.revision || 19) + 1;
if (master.outline.localization?.translations?.es) {
	master.outline.localization.translations.es.status = 'needs_revision';
}

writeFileSync(
	join(ROOT, 'data/outlines/light-delay-master-narrative.json'),
	JSON.stringify(master, null, 2) + '\n',
	'utf8'
);

const retiredLedger = {
	...ledger,
	ledger: {
		...ledger.ledger,
		status: 'obsolete',
		notes: {
			es: 'Obsoleto como autoría: los hechos causales viven en la escaleta maestra (master:fact-*). Conservado sólo como procedencia de la migración.',
			en: 'Obsolete as authorship: causal facts now live on the master outline (master:fact-*). Retained only as migration provenance.'
		},
		sourceDocument: 'data/outlines/light-delay-master-narrative.json'
	}
};
writeFileSync(
	join(ROOT, 'data/continuity/light-delay-festival-master.json'),
	JSON.stringify(retiredLedger, null, 2) + '\n',
	'utf8'
);

console.log(
	`Wrote master facts=${facts.length} knowledgeEvents=${knowledgeEvents.length} actionRequirements=${actionRequirements.length}; Festival ledger → obsolete`
);
