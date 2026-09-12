import { describe, expect, it } from 'vitest';
import { isThumbAssetPath, thumbnailPathForAsset } from './thumbnailPath';

describe('thumbnailPathForAsset', () => {
	it('maps raster assets under /assets/ to mirrored webp thumbs', () => {
		expect(thumbnailPathForAsset('/assets/locations/proxima-station/proxima-with-ardor-berthed.png')).toBe(
			'/assets/_thumbs/locations/proxima-station/proxima-with-ardor-berthed.png.webp'
		);
		expect(thumbnailPathForAsset('/assets/vehicles/celestial-ardor/celestial-ardor-with-jupiter.png')).toBe(
			'/assets/_thumbs/vehicles/celestial-ardor/celestial-ardor-with-jupiter.png.webp'
		);
		expect(thumbnailPathForAsset('/assets/animatic/frames/scene-01/shot-01.png')).toBe(
			'/assets/_thumbs/animatic/frames/scene-01/shot-01.png.webp'
		);
	});

	it('keeps SVG and PNG stems distinct', () => {
		expect(
			thumbnailPathForAsset('/assets/vehicles/celestial-ardor/specs/proportional-reference.svg')
		).toBe('/assets/_thumbs/vehicles/celestial-ardor/specs/proportional-reference.svg.webp');
		expect(
			thumbnailPathForAsset('/assets/vehicles/celestial-ardor/specs/proportional-reference.png')
		).toBe('/assets/_thumbs/vehicles/celestial-ardor/specs/proportional-reference.png.webp');
	});

	it('rejects thumbs, non-assets, and empty names', () => {
		expect(thumbnailPathForAsset('/assets/_thumbs/locations/foo/bar.webp')).toBeUndefined();
		expect(thumbnailPathForAsset('/other/path.png')).toBeUndefined();
		expect(thumbnailPathForAsset('')).toBeUndefined();
		expect(thumbnailPathForAsset('/assets/')).toBeUndefined();
	});
});

describe('isThumbAssetPath', () => {
	it('detects the thumbs prefix', () => {
		expect(isThumbAssetPath('/assets/_thumbs/foo.webp')).toBe(true);
		expect(isThumbAssetPath('/assets/foo.png')).toBe(false);
	});
});
