/**
 * Spoiler gate for the live trailer product, `script:light-delay-trailer-master` (the
 * deprecated `script:light-delay-trailer` keeps its own separate `check:trailer-spoilers`).
 *
 * Two layers:
 *  1. Fact-based: any `master:fact-*` a trailer cue implements (inherited from its
 *     Festival-master source via `npm run fit:trailer-master-facts`, or authored directly)
 *     must not be in the trailer's declared omitted-facts list.
 *  2. Text-based companion: the phrasing rules from `scripts/lib/trailer-spoilers.mjs`
 *     (send/reception/death/containment/outcome — everything except the old continuity's
 *     name-based `culprit-identity` rule) scanned against script + outline prose, since
 *     shot-level fact bindings are still deferred per
 *     `docs/production/CAUSAL_AND_MEANING_PIPELINE.md` and a spoiler can live only in a
 *     `Shot.description` with no cue behind it.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RULES, scanWithRules } from './lib/trailer-spoilers.mjs';
import { TRAILER_MASTER_OMITTED_FACT_IDS } from './lib/trailer-master-omitted-facts.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const scriptPath = join(root, 'data', 'scripts', 'light-delay-trailer-master.json');
const outlinePath = join(root, 'data', 'outlines', 'light-delay-trailer-master.json');

const script = JSON.parse(readFileSync(scriptPath, 'utf8'));
const outline = JSON.parse(readFileSync(outlinePath, 'utf8'));

const omitted = new Set(TRAILER_MASTER_OMITTED_FACT_IDS);
/** @type {{ cueId: string, factId: string }[]} */
const factHits = [];
for (const cue of script.cues || []) {
	for (const factId of cue.implementsFactIds || []) {
		if (omitted.has(factId)) factHits.push({ cueId: cue.id, factId });
	}
}

const textRules = RULES.filter((rule) => rule.id !== 'culprit-identity');
const textHits = scanWithRules(textRules, [script, outline]);
const documentPaths = [scriptPath, outlinePath];

const failed = factHits.length > 0 || textHits.length > 0;
if (failed) {
	console.error(`check:trailer-master-spoilers FAILED (${factHits.length + textHits.length})`);
	for (const hit of factHits) {
		console.error(` - fact ${hit.cueId} implements omitted fact [${hit.factId}]`);
	}
	for (const hit of textHits) {
		console.error(` - text ${documentPaths[hit.documentIndex]} ${hit.path} [${hit.ruleId}]: ${hit.text}`);
	}
	process.exitCode = 1;
} else {
	console.log('check:trailer-master-spoilers OK');
}
