import { afterEach, describe, expect, it } from 'vitest';
import {
	applyReadability,
	readabilityBootScript,
	readabilityConfig,
	readabilityStorageKey
} from './readability';

function fakeBrowser(stored?: string) {
	const properties: Record<string, string> = {};
	const dataset: Record<string, string> = {};
	const storage = new Map<string, string>(stored ? [[readabilityStorageKey, stored]] : []);
	Object.assign(globalThis, {
		document: {
			documentElement: {
				style: { setProperty: (k: string, v: string) => (properties[k] = v) },
				dataset
			}
		},
		localStorage: { getItem: (k: string) => storage.get(k) ?? null }
	});
	return { properties, dataset };
}

afterEach(() => {
	delete (globalThis as Record<string, unknown>).document;
	delete (globalThis as Record<string, unknown>).localStorage;
});

describe('readability boot script', () => {
	it('is self-contained and applies stored preferences', () => {
		const { properties, dataset } = fakeBrowser(
			JSON.stringify({ scale: 1.5, contrast: 'high', lineHeight: 1.65, face: 'atkinson' })
		);
		new Function(readabilityBootScript)();
		expect(properties).toEqual({ '--studio-font-scale': '1.5', '--studio-line-height': '1.65' });
		expect(dataset).toEqual({ contrast: 'high', face: 'atkinson' });
	});

	it('falls back to the defaults for missing, invalid or unparsable values', () => {
		for (const stored of [undefined, '{"scale":3,"contrast":"neon","face":"comic"}', '{nope']) {
			const { properties, dataset } = fakeBrowser(stored);
			new Function(readabilityBootScript)();
			expect(properties).toEqual({ '--studio-font-scale': '1', '--studio-line-height': '1.45' });
			expect(dataset).toEqual({});
		}
	});

	it('applies explicit preferences at runtime and returns what was applied', () => {
		const { dataset } = fakeBrowser();
		expect(applyReadability({ scale: 1.25, face: 'opendyslexic' }, readabilityConfig)).toEqual({
			scale: 1.25,
			lineHeight: 1.45,
			face: 'opendyslexic'
		});
		expect(dataset).toEqual({ face: 'opendyslexic' });
	});
});
