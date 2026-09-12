import { browser } from '$app/environment';
import { getLocale } from '$lib/paraglide/runtime.js';

const STORAGE_KEY = 'light-delay.language';

export type LanguageState = {
	interfaceLanguage: string;
	dialogueLanguage: string;
	subtitleLanguage: string | null;
};

function load(): LanguageState {
	const routeLanguage = getLocale();
	if (!browser) {
		return {
			interfaceLanguage: routeLanguage,
			dialogueLanguage: routeLanguage,
			subtitleLanguage: routeLanguage
		};
	}
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			return {
				interfaceLanguage: routeLanguage,
				dialogueLanguage: routeLanguage,
				subtitleLanguage: routeLanguage
			};
		}
		const parsed = JSON.parse(raw) as Partial<LanguageState>;
		return {
			interfaceLanguage: getLocale(),
			dialogueLanguage: parsed.dialogueLanguage ?? routeLanguage,
			subtitleLanguage:
				parsed.subtitleLanguage === undefined ? routeLanguage : parsed.subtitleLanguage
		};
	} catch {
		return {
			interfaceLanguage: routeLanguage,
			dialogueLanguage: routeLanguage,
			subtitleLanguage: routeLanguage
		};
	}
}

function persist(state: LanguageState) {
	if (!browser) return;
	localStorage.setItem(
		STORAGE_KEY,
		JSON.stringify({
			dialogueLanguage: state.dialogueLanguage,
			subtitleLanguage: state.subtitleLanguage
		})
	);
}

let language = $state<LanguageState>(load());

/**
 * Return the reactive language proxy (not a snapshot).
 * Callers that read only `dialogueLanguage` or only `subtitleLanguage` keep
 * fine-grained subscriptions — switching subtitles must not invalidate dialogue
 * consumers (e.g. getLocalizedScript structuredClone) or the audio timeline.
 */
export function getLanguageState(): LanguageState {
	if (!browser) {
		const routeLanguage = getLocale();
		return {
			interfaceLanguage: routeLanguage,
			dialogueLanguage: routeLanguage,
			subtitleLanguage: routeLanguage
		};
	}
	return language;
}

export function setDialogueLanguage(tag: string) {
	language.dialogueLanguage = tag;
	language.interfaceLanguage = getLocale();
	persist(language);
}

export function setSubtitleLanguage(tag: string | null) {
	language.subtitleLanguage = tag;
	language.interfaceLanguage = getLocale();
	persist(language);
}
