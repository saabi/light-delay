import type { DocumentId } from './ids.ts';

/** Minimal block vocabulary for prose documents (Phase 2 will expand). */
export type DocumentBlock =
	| { type: 'heading'; level: 1 | 2 | 3 | 4; text: string; id?: string }
	| { type: 'paragraph'; text: string }
	| { type: 'list'; ordered?: boolean; items: string[] }
	| { type: 'blockquote'; text: string }
	| { type: 'callout'; kind?: string; text: string }
	| { type: 'hr' };

export interface DocumentRecord {
	id: DocumentId;
	slug: string;
	title: string;
	status: 'stub' | 'extracted' | 'draft' | 'review' | 'locked';
	language?: string;
	sourcePath?: string;
	summary?: string;
	blocks: DocumentBlock[];
}

export interface DocumentsFile {
	schemaVersion: string;
	documents: DocumentRecord[];
}
