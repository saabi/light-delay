import type { DocumentRecord, ResolvedDocumentRecord } from '$lib/types/document';
import type {
	LanguageTag,
	LocalizedString,
	LocalizedValue,
	LocalizedResolution,
	StoryText
} from '$lib/types/i18n';
import { isLocalizedString } from '$lib/types/i18n';

export function resolveLocalized<T>(
	value: LocalizedValue<T>,
	requestedLanguage: LanguageTag
): LocalizedResolution<T> {
	const requested = value.variants[requestedLanguage];
	if (requested !== undefined)
		return {
			requestedLanguage,
			resolvedLanguage: requestedLanguage,
			value: requested,
			usedFallback: false
		};
	const source = value.variants[value.sourceLanguage];
	if (source === undefined)
		throw new Error(`Localized value has no source variant: ${value.sourceLanguage}`);
	return {
		requestedLanguage,
		resolvedLanguage: value.sourceLanguage,
		value: source,
		usedFallback: true
	};
}

export function resolveLocalizedString(
	value: StoryText | undefined | null,
	requestedLanguage: LanguageTag,
	options: { sourceLanguage?: LanguageTag; fallbackLanguage?: LanguageTag } = {}
): string | undefined {
	if (value == null) return undefined;
	if (typeof value === 'string') return value;
	if (!isLocalizedString(value)) return undefined;
	const sourceLanguage = options.sourceLanguage ?? 'es';
	const fallbackLanguage = options.fallbackLanguage ?? sourceLanguage;
	const map = value as Record<string, string | undefined>;
	const requested = map[requestedLanguage];
	if (typeof requested === 'string' && requested.length > 0) return requested;
	const fallback = map[fallbackLanguage];
	if (typeof fallback === 'string' && fallback.length > 0) return fallback;
	const source = map[sourceLanguage];
	if (typeof source === 'string') return source;
	for (const candidate of Object.values(map)) {
		if (typeof candidate === 'string' && candidate.length > 0) return candidate;
	}
	return undefined;
}

/** Flatten story text for UI props that require string. */
export function storyText(
	value: StoryText | undefined | null,
	requestedLanguage: LanguageTag = 'es',
	options: { sourceLanguage?: LanguageTag; fallbackLanguage?: LanguageTag } = {}
): string {
	return resolveLocalizedString(value, requestedLanguage, options) ?? '';
}

export function sourceLocalizedString(
	value: StoryText | undefined | null,
	sourceLanguage: LanguageTag = 'es'
): string | undefined {
	return resolveLocalizedString(value, sourceLanguage, { sourceLanguage });
}

export function resolveDocument(
	document: DocumentRecord,
	requestedLanguage: LanguageTag
): ResolvedDocumentRecord {
	const title = resolveLocalized(document.title, requestedLanguage);
	const content = resolveLocalized(document.content, requestedLanguage);
	const summary = document.summary
		? resolveLocalized(document.summary, requestedLanguage)
		: undefined;
	return {
		...document,
		title: title.value,
		summary: summary?.value,
		blocks: content.value,
		resolvedLanguage: content.resolvedLanguage,
		usedFallback: title.usedFallback || content.usedFallback || Boolean(summary?.usedFallback)
	};
}

export type { LocalizedString };
