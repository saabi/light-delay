import { describe, expect, it } from 'vitest';
import {
	checkReferenceBudget,
	compilePrompt,
	planSegments,
	resolveDiegeticText
} from '../../../scripts/lib/generation-planning.mjs';

describe('generation planning', () => {
	it('splits at useful cue boundaries without exceeding campaign duration', () => {
		const segments = planSegments({ id: 'main:shot-x', durationMs: 17000, cuePlacements: [{ atMs: 7000 }, { atMs: 15000 }] }, 8000);
		expect(segments.map(({ startMs, endMs }) => [startMs, endMs])).toEqual([[0, 7000], [7000, 15000], [15000, 17000]]);
		expect(segments.every((segment) => segment.endMs - segment.startMs <= 8000)).toBe(true);
	});

	it('detects per-kind and total reference overflow', () => {
		/** @type {Array<{ kind: 'image' | 'video' | 'audio', id: string }>} */
		const refs = [];
		for (let i = 0; i < 10; i += 1) refs.push({ kind: 'image', id: `i${i}` });
		refs.push({ kind: 'audio', id: 'a' }, { kind: 'video', id: 'v' });
		expect(checkReferenceBudget(refs, { maxImages: 9, maxVideos: 3, maxAudios: 3, maxTotalReferences: 12 })).toMatchObject({ ok: false, violations: ['images:10>9'] });
	});

	it('selects only the English interface variant for diegetic display generation', () => {
		const cue = {
			type: 'text',
			presentation: 'interface',
			content: {
				variants: {
					es: { text: 'CANAL VELARI · APERTURA EN 00:48' },
					en: { text: 'VELARI CHANNEL · OPENS IN 00:48' }
				}
			}
		};
		expect(resolveDiegeticText(cue)).toBe('VELARI CHANNEL · OPENS IN 00:48');
		expect(resolveDiegeticText(cue)).not.toContain('CANAL VELARI');
	});

	it('refuses to compile blocked or incomplete prompts', () => {
		expect(() => compilePrompt({}, ['editorial_freeze'])).toThrow(/blocked/);
		expect(() => compilePrompt({ style: 'hard science fiction' })).toThrow(/missing/);
	});
});
