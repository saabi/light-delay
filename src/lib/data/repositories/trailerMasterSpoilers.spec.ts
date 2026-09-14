import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RULES, scanWithRules } from '../../../../scripts/lib/trailer-spoilers.mjs';
import { TRAILER_MASTER_OMITTED_FACT_IDS } from '../../../../scripts/lib/trailer-master-omitted-facts.mjs';
import { getScript, getOutline } from './index.ts';

const scriptId = 'script:light-delay-trailer-master';

describe('master-derived trailer spoiler gate', () => {
	it('never implements a fact on the omitted-facts list', () => {
		const script = getScript(scriptId);
		const omitted = new Set(TRAILER_MASTER_OMITTED_FACT_IDS);
		const hits = script.cues.flatMap((cue) =>
			(cue.implementsFactIds ?? []).filter((factId) => omitted.has(factId)).map((factId) => ({
				cueId: cue.id,
				factId
			}))
		);
		expect(hits).toEqual([]);
	});

	it('passes the phrasing rules (send/reception/death/containment/outcome) in script and outline prose', () => {
		const script = getScript(scriptId);
		const outline = getOutline(scriptId);
		const textRules = RULES.filter((rule) => rule.id !== 'culprit-identity');
		const hits = scanWithRules(textRules, [script, outline]);
		expect(hits).toEqual([]);
	});

	it('still catches a real disclosure (regression guard for the gate itself)', () => {
		const textRules = RULES.filter((rule) => rule.id !== 'culprit-identity');
		const hits = scanWithRules(textRules, [
			{ description: { en: "Sorell, shaken, found beside Zao's body." } }
		]);
		expect(hits.map((hit) => hit.ruleId)).toEqual(['death-confirmed']);
	});

	it('every trailer cue sourced from a fact-tagged Festival-master cue has an inherited binding applied', () => {
		// Guards against silently losing coverage if a source cue gets tagged after the
		// fact and `npm run fit:trailer-master-facts` isn't re-run.
		const script = getScript(scriptId);
		const festivalPath = join(process.cwd(), 'data/scripts/light-delay-festival-master.json');
		const festival = JSON.parse(readFileSync(festivalPath, 'utf8'));
		const festivalCueById = new Map(festival.cues.map((cue: { id: string }) => [cue.id, cue]));
		for (const cue of script.cues) {
			const ref = (cue.sourceRefs ?? []).find(
				(candidate) =>
					'scriptId' in candidate &&
					candidate.scriptId === 'script:light-delay-festival-master' &&
					'cueId' in candidate &&
					candidate.cueId
			);
			if (!ref || !('cueId' in ref)) continue;
			const source = festivalCueById.get(ref.cueId) as { implementsFactIds?: string[] } | undefined;
			if (!source?.implementsFactIds?.length) continue;
			expect(cue.implementsFactIds, cue.id).toBeTruthy();
		}
	});
});
