import { describe, expect, it } from 'vitest';
import {
	getAudioOutput,
	listAudioOutputs,
	looksAbsoluteOrTraversal
} from './audioOutputs';

describe('audio output catalog', () => {
	it('lists only the two audience duals with relative keys', () => {
		const rows = listAudioOutputs();
		expect(rows.map((row) => row.id).sort()).toEqual(['audience-en', 'audience-es']);
		const expectedById: Record<string, { cueCount: number; revision: number }> = {
			'audience-en': { cueCount: 287, revision: 19 },
			'audience-es': { cueCount: 287, revision: 19 }
		};
		for (const row of rows) {
			expect(row.label.es.length).toBeGreaterThan(0);
			expect(row.label.en.length).toBeGreaterThan(0);
			expect(row.description.es.length).toBeGreaterThan(0);
			expect(row.description.en.length).toBeGreaterThan(0);
			expect(row.expectedCueCount).toBe(expectedById[row.id].cueCount);
			expect(row.expectedSampleRate).toBe(24000);
			expect(row.sourceOutlineId).toBe('outline:light-delay-master-narrative');
			expect(row.sourceOutlineRevision).toBe(expectedById[row.id].revision);
			expect(looksAbsoluteOrTraversal(row.chunksKey)).toBe(false);
			expect(looksAbsoluteOrTraversal(row.canonicalMp3Key)).toBe(false);
			expect(looksAbsoluteOrTraversal(row.assembledKey)).toBe(false);
			const blob = JSON.stringify(row);
			expect(blob).not.toMatch(/E:[/\\]/);
			expect(blob).not.toContain('/Models');
		}
		expect(getAudioOutput('audience-es').lang).toBe('es');
	});

	it('rejects absolute and traversal keys', () => {
		expect(looksAbsoluteOrTraversal('E:/Models/Qwen3-TTS/output')).toBe(true);
		expect(looksAbsoluteOrTraversal('../secret')).toBe(true);
		expect(looksAbsoluteOrTraversal('outline-chunks/es-audience')).toBe(false);
	});
});
