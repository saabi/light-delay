import type { DocumentRecord, ResolvedDocumentRecord } from '$lib/types/document';
import type { LanguageTag } from '$lib/types/i18n';
import type { LocalizedValue, LocalizedResolution } from '$lib/types/i18n';

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
