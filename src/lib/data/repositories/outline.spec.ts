import { describe, expect, it } from 'vitest';
import {
	getLocalizedOutline,
	getOutline,
	hasOutline,
	listOutlineCoverage,
	listScripts,
	outlinePathForScript
} from '$lib/data/repositories/index';
import { validateOutline } from '$lib/data/validation/validateOutline';
import type { OutlineFile } from '$lib/types/outline';
import { localizeOutline } from '$lib/data/selectors/publicTranslations';
import { buildOutlineMissingReport } from '../../../../scripts/lib/outline-missing.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
const festivalId = 'script:light-delay-festival';
const festivalMasterId = 'script:light-delay-festival-master';
const masterId = 'script:light-delay-master-narrative';

describe('outlines (optional)', () => {
	it('returns an outline for every registered script', () => {
		for (const entry of listScripts()) {
			expect(outlinePathForScript(entry.id)).toBe(
				`data/outlines/${entry.id.replace(/^script:/, '')}.json`
			);
			expect(getOutline(entry.id)?.steps.length).toBeGreaterThan(0);
			expect(hasOutline(entry.id)).toBe(true);
		}
	});

	it('lists coverage for every registered script', () => {
		const coverage = listOutlineCoverage();
		expect(coverage.length).toBe(listScripts().length);
		const festival = coverage.find((row) => row.scriptId === festivalId);
		expect(festival?.present).toBe(true);
		expect(festival?.stepCount).toBeGreaterThan(0);
		expect(coverage.filter((row) => !row.present)).toHaveLength(0);
	});

	it('localizes festival outline titles from inline LocalizedString maps', () => {
		const source = getOutline(festivalId)!;
		const localized = localizeOutline(source, 'en');
		const es = getLocalizedOutline(festivalId, 'es')!;
		expect(typeof source.outline.title).toBe('object');
		expect(es.outline.title).toBe('Escaleta — Light Delay: Festival Cut');
		expect(localized.outline.title).toBe('Outline — Light Delay: Festival Cut');
		expect(localized.steps[0]?.title).not.toBe(source.steps[0]?.title);
		expect(typeof localized.steps[0]?.title).toBe('string');
	});

	it('loads the complete story-only master outline with structured framing', () => {
		const source = getOutline(masterId)!;
		expect(source.outline.provenance?.importedFrom?.[0]?.revision).toBe('13');
		expect(source.outline.revision).toBe(19);
		expect(source.outline.version).toBe('0.8.0-wip');
		expect(source.outline.localization).toEqual({
			sourceLanguage: 'en',
			translations: { es: { status: 'needs_revision', lastSyncedRevision: 19 } }
		});
		expect(source.outline.status).toBe('draft');
		expect(source.outline.exports?.map((item) => item.path)).toEqual([
			'docs/wip/general-narrative-outline.es.md',
			'docs/wip/general-narrative-outline.en.md'
		]);
		expect(source.framing).toHaveLength(11);
		expect(source.storySections).toHaveLength(8);
		expect(source.steps).toHaveLength(58);
		expect(source.steps.every((step) => step.level === 'story' && step.body?.length)).toBe(true);
		expect(source.steps.some((step) => step.summary != null)).toBe(false);
		expect(source.steps.some((step) => step.coverage != null)).toBe(false);
		expect(getLocalizedOutline(masterId, 'es')?.outline.title).toBe(
			'Escaleta — Lúz Tardía: narrativa maestra sin límite (WIP)'
		);
		const quotations = [...(source.framing ?? []), ...source.steps].flatMap((item) =>
			('blocks' in item ? item.blocks : (item.body ?? [])).filter(
				(block) => block.type === 'blockquote'
			)
		);
		expect(quotations).toHaveLength(39);
		expect(quotations.every((block) => block.type === 'blockquote' && block.speakerId)).toBe(true);
		const gravity = source.framing?.find((section) => section.id === 'master:framing-gravity');
		const gravityList = gravity?.blocks.find((block) => block.type === 'list');
		expect(gravityList?.type === 'list' ? gravityList.items : []).toHaveLength(4);
		const c10 = source.steps.find((step) => step.id === 'master:story-c10');
		const c10b = source.steps.find((step) => step.id === 'master:story-c10b');
		const b1 = source.steps.find((step) => step.id === 'master:story-b1');
		const c3a = source.steps.find((step) => step.id === 'master:story-c3a');
		const d1 = source.steps.find((step) => step.id === 'master:story-d1');
		const e3 = source.steps.find((step) => step.id === 'master:story-e3');
		const e5 = source.steps.find((step) => step.id === 'master:story-e5');
		const e4 = source.steps.find((step) => step.id === 'master:story-e4');
		const e6 = source.steps.find((step) => step.id === 'master:story-e6');
		const f3 = source.steps.find((step) => step.id === 'master:story-f3');
		expect([c10?.order, d1?.order, c10b?.order]).toEqual([31, 32, 35]);
		expect(c10b?.sectionId).toBe('master:section-d');
		expect(c10b?.causalLinks?.[0]?.sourceStepId).toBe('master:story-c10'); // The flight profile, not investigation, requires the turn.
		expect(d1?.causalLinks?.[0]?.sourceStepId).toBe('master:story-c10');
		const englishBody = (step: typeof b1) =>
			(step?.body ?? [])
				.flatMap((block) =>
					block.type === 'list'
						? block.items.map((item) => (typeof item === 'string' ? item : (item.en ?? '')))
						: [typeof block.text === 'string' ? block.text : (block.text?.en ?? '')]
				)
				.join(' ');
		expect(englishBody(b1)).not.toContain('disables the bridge command inputs');
		expect(englishBody(c3a)).toContain('physically disconnects the bridge command inputs');
		expect(englishBody(c3a)).toContain('independent aft control intact');
		expect([e3?.order, e5?.order, e4?.order, e6?.order]).toEqual([44, 45, 46, 47]);
		expect(e5?.causalLinks?.[0]?.sourceStepId).toBe('master:story-e3');
		expect(e4?.causalLinks?.[0]?.sourceStepId).toBe('master:story-e5');
		expect(typeof f3?.title === 'string' ? f3.title : f3?.title.en).toContain('Fourth gravity dip');
		const localized = getLocalizedOutline(masterId, 'en')!;
		expect(localized.steps[0]?.body?.[0]?.type).toBe('paragraph');
		const first = localized.steps[0]?.body?.[0];
		expect(first && first.type !== 'list' ? first.text : '').toBe('Overlay: 43 MIN 18 S.');
		const terminology = source.framing?.find(
			(section) => section.id === 'master:framing-terminology'
		);
		expect(terminology?.blocks).toHaveLength(12);
		const velariHeading = terminology?.blocks.find(
			(block) =>
				block.type === 'heading' &&
				typeof block.text !== 'string' &&
				block.text.en === 'Velari biology and communication'
		);
		expect(velariHeading).toMatchObject({
			type: 'heading',
			level: 3,
			text: { es: 'Biología y comunicación Velari', en: 'Velari biology and communication' }
		});
		expect(
			terminology?.blocks.some(
				(block) =>
					block.type === 'paragraph' &&
					typeof block.text !== 'string' &&
					block.text.en?.includes('voluntarily controlled three-dimensional network') &&
					block.text.es?.includes('red tridimensional de neuronas emisoras de luz')
			)
		).toBe(true);
		const cast = source.framing?.find((section) => section.id === 'master:framing-cast');
		expect(
			cast?.blocks.some(
				(block) =>
					block.type === 'paragraph' &&
					typeof block.text !== 'string' &&
					block.text.en?.includes('Nigerian security officer') &&
					block.text.es?.includes('Oficial de seguridad nigeriana')
			)
		).toBe(true);
		expect(
			cast?.blocks.some(
				(block) =>
					block.type === 'paragraph' &&
					typeof block.text !== 'string' &&
					block.text.en?.includes('formed her English in Enugu') &&
					block.text.es?.includes('su español formal en Caracas')
			)
		).toBe(true);
		const meeting = source.steps.find((step) => step.id === 'master:story-g2b');
		expect(
			meeting?.body?.some(
				(block) =>
					block.type === 'paragraph' &&
					typeof block.text !== 'string' &&
					block.text.en?.includes('does not prove benevolence') &&
					block.text.es?.includes('no demuestra benevolencia')
			)
		).toBe(true);
	});

	it('maps the master-derived Festival outline to every revision-19 story beat', () => {
		const master = getOutline(masterId)!;
		const festival = getOutline(festivalMasterId)!;
		expect(festival.outline.derivation).toEqual({
			sourceOutlineId: 'outline:light-delay-master-narrative',
			sourceRevision: 19,
			sourceVersion: '0.8.0-wip',
			relationship: 'adaptation',
			fidelity: 'complete_causal_chain',
			reviewStatus: 'current'
		});
		expect(festival.storySections).toHaveLength(11);
		expect(festival.steps).toHaveLength(24);
		expect(festival.steps.every((step) => step.level === 'story')).toBe(true);
		const mapped = festival.steps.flatMap((step) =>
			(step.sourceRefs ?? [])
				.filter((ref) => ref.kind === 'outline')
				.map((ref) => (ref.kind === 'outline' ? ref.stepId : undefined))
				.filter(Boolean)
		);
		const sourceIds = master.steps.filter((step) => step.level === 'story').map((step) => step.id);
		expect(mapped).toHaveLength(58);
		expect(new Set(mapped)).toEqual(new Set(sourceIds));
	});

	it('validateOutline accepts hierarchy, causal explanations, and optional coverage', () => {
		const file: OutlineFile = {
			schemaVersion: '1.2.0',
			outline: {
				id: 'outline:light-delay-main-short',
				scriptId: 'script:light-delay-main-short',
				title: { es: 'Test', en: 'Test' },
				synopsis: { es: 'Una cadena causal verificable.', en: 'A verifiable causal chain.' },
				status: 'draft',
				version: '0.0.1'
			},
			steps: [
				{
					id: 'main:story-01',
					level: 'story',
					order: 1,
					title: { es: 'Arrival', en: 'Arrival' },
					summary: { es: 'Crew arrives', en: 'Crew arrives' },
					importance: 'required'
				},
				{
					id: 'main:story-02',
					level: 'story',
					order: 2,
					title: { es: 'Payoff', en: 'Payoff' },
					summary: { es: 'Depends on arrival', en: 'Depends on arrival' },
					importance: 'required',
					causalLinks: [
						{
							sourceStepId: 'main:story-01',
							relation: 'enables',
							explanation: {
								es: 'La llegada habilita la acción.',
								en: 'Arrival enables the action.'
							}
						}
					]
				},
				{
					id: 'main:outline-01',
					level: 'detail',
					parentStepId: 'main:story-01',
					order: 1,
					title: { es: 'Detalle', en: 'Detail' },
					summary: { es: 'La tripulación desembarca.', en: 'The crew disembarks.' },
					importance: 'required'
				},
				{
					id: 'main:outline-02',
					level: 'detail',
					parentStepId: 'main:story-02',
					order: 2,
					title: { es: 'Evidencia', en: 'Evidence' },
					summary: { es: 'La llegada deja evidencia.', en: 'Arrival leaves evidence.' },
					importance: 'required'
				}
			]
		};
		const result = validateOutline(file, {
			registeredScriptIds: new Set(listScripts().map((s) => s.id))
		});
		expect(result.ok).toBe(true);
	});

	it('rejects detail steps without a story parent', () => {
		const source = structuredClone(getOutline(festivalId)!);
		const detail = source.steps.find((step) => step.level === 'detail')!;
		delete detail.parentStepId;
		const result = validateOutline(source, {
			registeredScriptIds: new Set(listScripts().map((s) => s.id))
		});
		expect(result.ok).toBe(false);
		expect(result.errors.some((error) => error.includes('requires parentStepId'))).toBe(true);
	});
});

describe('report:outline-missing', () => {
	it('reports complete outline coverage', () => {
		const report = buildOutlineMissingReport(ROOT);
		expect(report.summary.scripts).toBe(6);
		expect(report.summary.missing).toBe(0);
		expect(report.missing).toEqual([]);
	});
});

describe('master narrative continuity', () => {
	it('keeps investigation across the turn without future causal prerequisites', () => {
		const source = getOutline(masterId)!;
		const order = new Map(source.steps.map((step) => [step.id, step.order]));
		for (const step of source.steps) {
			for (const link of step.causalLinks ?? []) {
				expect(order.has(link.sourceStepId)).toBe(true);
				expect(order.get(link.sourceStepId)!).toBeLessThan(step.order);
			}
		}
		expect(order.get('master:story-d2b')!).toBeLessThan(order.get('master:story-c10b')!);
		expect(order.get('master:story-c10b')!).toBeLessThan(order.get('master:story-d3')!);
	});

	it('preserves the audience gravity count, crew count, and investigation chronology in both languages', () => {
		for (const lang of ['es', 'en']) {
			const text = readFileSync(join(ROOT, `docs/wip/audience-narrative.${lang}.md`), 'utf8');
			const sections = text.split(/^## /m);
			const investigation = sections[9];
			const revelation = sections[10];
			const climax = sections[11];
			const third = lang === 'es' ? 'por tercera vez' : 'for the third time';
			const fourth = lang === 'es' ? 'por cuarta vez' : 'for the fourth time';
			expect(text.split(third)).toHaveLength(2);
			expect(text.split(fourth)).toHaveLength(2);
			expect(investigation.indexOf('audience:dialogue:d2-harlan-fuel')).toBeLessThan(
				investigation.indexOf(third)
			);
			expect(investigation).toContain(third);
			expect(climax).toContain(fourth);
			expect(revelation).toContain(
				lang === 'es' ? 'Cuatro personas se vuelven hacia Harlan' : 'Four people turn toward Harlan'
			);
			expect(text).not.toMatch(
				/Five people turn toward Harlan|Earth will not know until|Weight vanishes for the third time|salta a una fecha absurdamente/
			);
		}
	});
});

describe('master-derived Festival audience narrative', () => {
	it('covers every Festival story beat once and preserves deferred causality', () => {
		const outline = getOutline(festivalMasterId)!;
		const text = readFileSync(join(ROOT, 'docs/wip/festival-cut-audience-narrative.en.md'), 'utf8');
		const sourceSteps = [...text.matchAll(/<!--\s*audience-source-step:\s*([^\s]+)\s*-->/g)].map(
			(match) => match[1]
		);
		expect(sourceSteps).toEqual(
			outline.steps.filter((step) => step.level === 'story').map((step) => step.id)
		);
		expect(text.match(/^## /gm)).toHaveLength(11);

		const reveal = text.indexOf('festival-master:story-16');
		expect(reveal).toBeGreaterThan(0);
		expect(text.slice(0, reveal)).not.toMatch(/future position|twenty-three light-hours/i);
		expect(text.slice(reveal)).toContain('twenty-three light-hours ahead');
		expect(text.indexOf('A single thump lands in darkness.')).toBeLessThan(
			text.indexOf('he disconnects bridge flight commands')
		);
		for (const ordinal of ['first', 'second', 'third', 'fourth']) {
			expect(text.split(`microgravity for the ${ordinal} time`)).toHaveLength(2);
		}
	});

	it('keeps provisional dialogue distinct from future screenplay canon', () => {
		const performance = JSON.parse(
			readFileSync(
				join(ROOT, 'data/production/audio/festival-audience-dialogue-performance.json'),
				'utf8'
			)
		) as { entries: Array<{ lineStatus?: string }> };
		expect(performance.entries).toHaveLength(25);
		expect(performance.entries.filter((entry) => entry.lineStatus === 'provisional')).toHaveLength(
			9
		);
	});
});
