/**
 * Re-exports thumbnail path helpers from the shared Node module.
 * @see scripts/lib/thumbnail-path.mjs
 */
export {
	thumbnailPathForAsset,
	isThumbAssetPath,
	publicAssetToStaticRelative,
	THUMB_MAX_EDGE,
	THUMB_WEBP_QUALITY
} from '../../../scripts/lib/thumbnail-path.mjs';
