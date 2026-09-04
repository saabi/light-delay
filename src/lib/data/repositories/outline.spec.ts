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

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
const festivalId = 'script:light-delay-festival';
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
		expect(source.outline.source?.revision).toBe('12');
		expect(source.outline.version).toBe('0.2.0-wip');
		expect(source.framing).toHaveLength(11);
		expect(source.storySections).toHaveLength(8);
		expect(source.steps).toHaveLength(57);
		expect(source.steps.every((step) => step.level === 'story' && step.body?.length)).toBe(true);
		expect(source.steps.some((step) => step.summary != null)).toBe(false);
		expect(source.steps.some((step) => step.coverage != null)).toBe(false);
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
		expect(report.summary.scripts).toBe(5);
		expect(report.summary.missing).toBe(0);
		expect(report.missing).toEqual([]);
	});
});
