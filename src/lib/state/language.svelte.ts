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

export function getLanguageState(): LanguageState {
	if (!browser) {
		const routeLanguage = getLocale();
		return {
			interfaceLanguage: routeLanguage,
			dialogueLanguage: routeLanguage,
			subtitleLanguage: routeLanguage
		};
	}
	return { ...language, interfaceLanguage: getLocale() };
}

export function setDialogueLanguage(tag: string) {
	language = { ...language, dialogueLanguage: tag };
	persist(language);
}

export function setSubtitleLanguage(tag: string | null) {
	language = { ...language, subtitleLanguage: tag };
	persist(language);
}
