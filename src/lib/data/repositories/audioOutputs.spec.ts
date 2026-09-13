import { describe, expect, it } from 'vitest';
import {
	getAudioOutput,
	listAudioOutputs,
	looksAbsoluteOrTraversal
} from './audioOutputs';

describe('audio output catalog', () => {
	it('lists the registered audio outputs with relative keys', () => {
		const rows = listAudioOutputs();
		expect(rows.map((row) => row.id).sort()).toEqual([
			'animatic-light-delay-festival-master-en',
			'animatic-light-delay-main-short-en',
			'audience-en',
			'audience-es',
			'audience-festival-en'
		]);
		const expectedById: Record<
			string,
			{ cueCount: number; revision: number; outlineId: string }
		> = {
			'audience-en': {
				cueCount: 287,
				revision: 19,
				outlineId: 'outline:light-delay-master-narrative'
			},
			'audience-es': {
				cueCount: 287,
				revision: 19,
				outlineId: 'outline:light-delay-master-narrative'
			},
			'audience-festival-en': {
				cueCount: 114,
				revision: 1,
				outlineId: 'outline:light-delay-festival-master'
			},
			'animatic-light-delay-main-short-en': {
				cueCount: 98,
				revision: 0,
				outlineId: 'script:light-delay-main-short'
			},
			'animatic-light-delay-festival-master-en': {
				cueCount: 132,
				revision: 0,
				outlineId: 'script:light-delay-festival-master'
			}
		};
		for (const row of rows) {
			expect(row.label.es.length).toBeGreaterThan(0);
			expect(row.label.en.length).toBeGreaterThan(0);
			expect(row.description.es.length).toBeGreaterThan(0);
			expect(row.description.en.length).toBeGreaterThan(0);
			expect(row.expectedCueCount).toBe(expectedById[row.id].cueCount);
			expect(row.expectedSampleRate).toBe(24000);
			expect(row.sourceOutlineId).toBe(expectedById[row.id].outlineId);
			expect(row.sourceOutlineRevision).toBe(expectedById[row.id].revision);
			expect(looksAbsoluteOrTraversal(row.chunksKey)).toBe(false);
			expect(looksAbsoluteOrTraversal(row.canonicalMp3Key)).toBe(false);
			expect(looksAbsoluteOrTraversal(row.assembledKey)).toBe(false);
			const blob = JSON.stringify(row);
			expect(blob).not.toMatch(/E:[/\\]/);
			expect(blob).not.toContain('/Models');
		}
		expect(getAudioOutput('audience-es').lang).toBe('es');
		expect(getAudioOutput('audience-festival-en').lang).toBe('en');
	});

	it('rejects absolute and traversal keys', () => {
		expect(looksAbsoluteOrTraversal('E:/Models/Qwen3-TTS/output')).toBe(true);
		expect(looksAbsoluteOrTraversal('../secret')).toBe(true);
		expect(looksAbsoluteOrTraversal('outline-chunks/es-audience')).toBe(false);
	});
});
