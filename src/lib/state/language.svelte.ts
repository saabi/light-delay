const STORAGE_KEY = 'light-delay.language';

export type LanguageState = {
	interfaceLanguage: string;
	dialogueLanguage: string;
	subtitleLanguage: string | null;
};

function load(): LanguageState {
	if (typeof localStorage === 'undefined') {
		return { interfaceLanguage: 'es', dialogueLanguage: 'es', subtitleLanguage: 'es' };
	}
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			return { interfaceLanguage: 'es', dialogueLanguage: 'es', subtitleLanguage: 'es' };
		}
		const parsed = JSON.parse(raw) as Partial<LanguageState>;
		return {
			interfaceLanguage: parsed.interfaceLanguage ?? 'es',
			dialogueLanguage: parsed.dialogueLanguage ?? 'es',
			subtitleLanguage: parsed.subtitleLanguage === undefined ? 'es' : parsed.subtitleLanguage
		};
	} catch {
		return { interfaceLanguage: 'es', dialogueLanguage: 'es', subtitleLanguage: 'es' };
	}
}

function persist(state: LanguageState) {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let language = $state<LanguageState>(load());

export function getLanguageState(): LanguageState {
	return language;
}

export function setDialogueLanguage(tag: string) {
	language = { ...language, dialogueLanguage: tag };
	persist(language);
}

export function setSubtitleLanguage(tag: string | null) {
	language = { ...language, subtitleLanguage: tag };
	persist(language);
}
