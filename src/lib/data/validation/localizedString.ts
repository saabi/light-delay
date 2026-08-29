import type { StoryText } from '$lib/types/i18n';
import { isLocalizedString } from '$lib/types/i18n';
import { sourceLocalizedString } from '../selectors/localized.ts';

/** Require a LocalizedString map with non-empty source language text. */
export function assertLocalizedString(
	value: StoryText | undefined | null,
	label: string,
	errors: string[],
	sourceLanguage = 'es',
	{ required = true }: { required?: boolean } = {}
): string | undefined {
	if (value == null) {
		if (required) errors.push(`${label}: missing LocalizedString`);
		return undefined;
	}
	if (typeof value === 'string') {
		errors.push(`${label}: expected LocalizedString map, got plain string`);
		return value;
	}
	if (!isLocalizedString(value)) {
		errors.push(`${label}: expected LocalizedString map`);
		return undefined;
	}
	const source = sourceLocalizedString(value, sourceLanguage);
	if (!source?.trim()) errors.push(`${label}: missing ${sourceLanguage} text`);
	return source;
}

export function sourceStoryText(
	value: StoryText | undefined | null,
	sourceLanguage = 'es'
): string | undefined {
	return sourceLocalizedString(value, sourceLanguage);
}
