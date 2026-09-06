import { describe, expect, it } from 'vitest';
import { IMITATION_API, chunkAudioUrl, takeAudioUrl } from './api';

describe('studio API urls', () => {
	it('keeps the /v1/imitation prefix once and cache-busts chunks', () => {
		expect(IMITATION_API).toBe('/v1/imitation');
		expect(chunkAudioUrl('audience-es', '00042_Zao_ab', 'take-1')).toBe(
			'/v1/imitation/outputs/audience-es/chunks/00042_Zao_ab?v=take-1'
		);
		expect(takeAudioUrl('audience-en', 'take-9')).toBe(
			'/v1/imitation/outputs/audience-en/takes/take-9/audio'
		);
		expect(chunkAudioUrl('audience-es', '00042_Zao_ab', 'take-1')).not.toContain(
			'/v1/imitation/v1/imitation'
		);
	});
});
