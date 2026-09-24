import type { TranslationStatus } from './i18n.ts';

export interface StringTranslationFile {
	schemaVersion: string;
	sourceLanguage: string;
	language: string;
	status: TranslationStatus;
	translations: Record<string, string>;
}
