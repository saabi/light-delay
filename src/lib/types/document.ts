import type { DocumentId } from './ids.ts';
import type { LocalizedValue, TranslationStatus } from './i18n.ts';

/** Minimal block vocabulary for prose documents (Phase 2 will expand). */
export type DocumentBlock =
	| { type: 'heading'; level: 1 | 2 | 3 | 4; text: string; id?: string }
	| { type: 'paragraph'; text: string; id?: string }
	| { type: 'list'; ordered?: boolean; items: string[]; id?: string }
	| { type: 'blockquote'; text: string; id?: string }
	| { type: 'callout'; kind?: string; text: string; id?: string }
	| { type: 'table'; headers: string[]; rows: string[][]; caption?: string; id?: string }
	| { type: 'beat'; title: string; text: string; id: string }
	| { type: 'hr'; id?: string };

export interface DocumentRecord {
	id: DocumentId;
	slug: string;
	title: LocalizedValue<string>;
	status: 'stub' | 'extracted' | 'draft' | 'review' | 'locked';
	sourceLanguage: string;
	sourcePath?: string;
	summary?: LocalizedValue<string>;
	content: LocalizedValue<DocumentBlock[]>;
	translationStatus?: Record<string, TranslationStatus>;
	provenance?: string[];
}

export interface ResolvedDocumentRecord extends Omit<
	DocumentRecord,
	'title' | 'summary' | 'content'
> {
	title: string;
	summary?: string;
	blocks: DocumentBlock[];
	resolvedLanguage: string;
	usedFallback: boolean;
}

export interface DocumentsFile {
	schemaVersion: string;
	documents: DocumentRecord[];
}
