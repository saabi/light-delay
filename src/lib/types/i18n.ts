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

/**
 * Co-located per-language story copy in JSON files.
 * At least `es` (project sourceLanguage) must be present and non-empty on disk.
 */
export type LocalizedString = {
	es: string;
	en?: string;
};

/** On disk LocalizedString; after presentation resolve may be a flat string. */
export type StoryText = LocalizedString | string;

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

export function isLocalizedString(value: unknown): value is LocalizedString {
	return (
		Boolean(value) &&
		typeof value === 'object' &&
		!Array.isArray(value) &&
		typeof (value as LocalizedString).es === 'string'
	);
}
