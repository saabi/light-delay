import type { AssetId } from './ids.ts';
import type { StoryText } from './i18n.ts';

export type ImageEditorialState =
	'current' | 'needs_review' | 'needs_replacement' | 'needs_regeneration';

export type ImageEditorialReason =
	| 'canon_mismatch'
	| 'wrong_composition'
	| 'continuity_error'
	| 'placeholder'
	| 'quality'
	| 'missing_subject';

export interface ImageEditorialStatus {
	status: ImageEditorialState;
	reasons: ImageEditorialReason[];
	explanation?: StoryText;
	replacementBrief?: StoryText;
}

export interface AssetsFile {
	schemaVersion: string;
	assets: Asset[];
}

export interface Asset {
	id: AssetId;
	kind:
		| 'image'
		| 'video'
		| 'audio'
		| 'voice_model'
		| 'three_d_model'
		| 'document'
		| 'subtitle'
		| 'other';
	role:
		| 'reference'
		| 'animatic'
		| 'animatic_placeholder'
		| 'production'
		| 'voice_sample'
		| 'music'
		| 'sound_effect'
		| 'source'
		| 'other';
	path: string;
	mimeType?: string;
	title?: StoryText;
	description?: StoryText;
	width?: number;
	height?: number;
	durationMs?: number;
	source?: {
		provider?: string;
		model?: string;
		generatedAt?: string;
		originalAssetId?: AssetId;
		externalId?: string;
	};
	metadata?: Record<string, string | number | boolean | null>;
	imageStatus?: ImageEditorialStatus;
}
