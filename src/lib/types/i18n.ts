import type { LanguageTag } from './common.ts';

export type { LanguageTag } from './common.ts';

export interface LanguageDefinition {
	tag: LanguageTag;
	label: string;
	nativeLabel?: string;
	direction?: 'ltr' | 'rtl';
}

export interface ProjectLanguages {
	sourceLanguage: LanguageTag;
	defaultDialogueLanguage: LanguageTag;
	defaultSubtitleLanguage?: LanguageTag;
	fallbackLanguage: LanguageTag;
	supported: LanguageDefinition[];
}

export interface LocalizedValue<T> {
	sourceLanguage: LanguageTag;
	variants: Record<LanguageTag, T>;
}

export type TranslationStatus = 'source' | 'draft' | 'reviewed' | 'approved' | 'needs_revision';

export interface LocalizedResolution<T> {
	requestedLanguage: LanguageTag;
	resolvedLanguage: LanguageTag;
	value: T;
	usedFallback: boolean;
}

export interface LanguagePreferences {
	interfaceLanguage: LanguageTag;
	dialogueLanguage: LanguageTag;
	subtitleLanguage: LanguageTag | null;
}
