import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();

vi.stubGlobal('localStorage', {
	getItem: (key: string) => store.get(key) ?? null,
	setItem: (key: string, value: string) => {
		store.set(key, value);
	},
	removeItem: (key: string) => {
		store.delete(key);
	},
	clear: () => {
		store.clear();
	}
});

vi.mock('$app/environment', () => ({
	browser: true
}));

vi.mock('$lib/paraglide/runtime.js', () => ({
	getLocale: () => 'en'
}));

describe('language state fine-grained updates', () => {
	beforeEach(() => {
		vi.resetModules();
		store.clear();
	});

	it('setSubtitleLanguage does not change dialogueLanguage', async () => {
		const mod = await import('./language.svelte.ts');
		mod.setDialogueLanguage('en');
		mod.setSubtitleLanguage('es');
		const state = mod.getLanguageState();
		expect(state.dialogueLanguage).toBe('en');
		expect(state.subtitleLanguage).toBe('es');
		mod.setSubtitleLanguage('en');
		expect(mod.getLanguageState().dialogueLanguage).toBe('en');
		expect(mod.getLanguageState().subtitleLanguage).toBe('en');
	});

	it('getLanguageState returns a stable reactive object identity across subtitle changes', async () => {
		const mod = await import('./language.svelte.ts');
		mod.setDialogueLanguage('en');
		mod.setSubtitleLanguage('en');
		const first = mod.getLanguageState();
		mod.setSubtitleLanguage('es');
		const second = mod.getLanguageState();
		expect(second).toBe(first);
		expect(second.subtitleLanguage).toBe('es');
		expect(second.dialogueLanguage).toBe('en');
	});
});
