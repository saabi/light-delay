import { describe, expect, it } from 'vitest';
import { decodeScriptId, encodeScriptId } from './scriptId.ts';

describe('scriptId encode/decode', () => {
	it('encodes colon to tilde', () => {
		expect(encodeScriptId('script:light-delay-main-short')).toBe('script~light-delay-main-short');
	});

	it('decodes tilde to colon', () => {
		expect(decodeScriptId('script~light-delay-festival')).toBe('script:light-delay-festival');
	});

	it('round-trips', () => {
		const id = 'script:light-delay-main-short';
		expect(decodeScriptId(encodeScriptId(id))).toBe(id);
	});
});
