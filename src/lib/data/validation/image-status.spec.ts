import { describe, expect, it } from 'vitest';
import { validateImageEditorialStatus } from './validateAssets.ts';
import type { ImageEditorialStatus } from '$lib/types/assets';

describe('image editorial status', () => {
	it('accepts a documented replacement', () => {
		const errors: string[] = [];
		validateImageEditorialStatus(
			{
				status: 'needs_replacement',
				reasons: ['placeholder'],
				explanation: 'Frame reutilizado mientras se produce el still definitivo.'
			},
			'take:test',
			errors
		);
		expect(errors).toEqual([]);
	});

	it('rejects unknown values and undocumented debt', () => {
		const errors: string[] = [];
		validateImageEditorialStatus(
			{ status: 'later', reasons: ['mystery'] } as unknown as ImageEditorialStatus,
			'take:test',
			errors
		);
		expect(errors).toHaveLength(3);
	});
});
