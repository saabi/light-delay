import { describe, expect, it } from 'vitest';
import { findTrailerSpoilers } from '../../../scripts/lib/trailer-spoilers.mjs';

describe('trailer spoiler guard', () => {
	it('allows an incomplete transmission and unresolved fate', () => {
		const hits = findTrailerSpoilers({
			summary:
				'La transmisión avanza al 92%; el negro breve no confirma si el mensaje salió ni si Zao murió.'
		});

		expect(hits).toEqual([]);
	});

	it('rejects culprit, completed-send, reception, and fatality disclosures', () => {
		const hits = findTrailerSpoilers({
			culprit: 'Harlan activa el jammer.',
			send: '100% — TRANSMITIDO',
			reception: 'Señal humana. Origen: láser exterior.',
			death: 'Durante el negro se oye un golpe corporal seco.'
		});

		expect(hits.map((hit) => hit.ruleId).sort()).toEqual([
			'culprit-identity',
			'death-confirmed',
			'reception-confirmed',
			'send-confirmed'
		]);
	});

	it('rejects resolution and contact-outcome disclosures', () => {
		const hits = findTrailerSpoilers({
			containment: 'PAYLOAD EN CUARENTENA / CANAL SALIENTE LIMPIO / MEDIACIÓN ACTIVA',
			release: 'At T=0, the protocol automatically releases only the clean greeting.',
			acknowledgment: 'The station answers with a limited acknowledgment.'
		});

		expect(hits.map((hit) => hit.ruleId).sort()).toEqual([
			'contact-outcome-confirmed',
			'contact-outcome-confirmed',
			'containment-confirmed'
		]);
	});
});
