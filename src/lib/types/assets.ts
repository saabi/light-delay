import type { AssetId } from './ids.ts';

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
		| 'production'
		| 'voice_sample'
		| 'music'
		| 'sound_effect'
		| 'source'
		| 'other';
	path: string;
	mimeType?: string;
	title?: string;
	description?: string;
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
}
