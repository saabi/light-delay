/**
 * The one mapping from measured application capacity to the layouts Studio implements
 * (STUDIO_DESIGN_SYSTEM.md § Application layout). Components switch on the layout id, never on
 * raw sizes or pixel widths; adding a layout means changing only this function.
 *
 * Capacity is measured by the root GlyphCapacitySensor in the interface font, so raising the text
 * scale lowers maxChars and the layout steps down on its own.
 */
export type LayoutId = 'compact' | 'phone' | 'narrow' | 'regular' | 'wide';

export interface LayoutCapacity {
	maxChars: number;
	maxLines: number;
	pixelLandscape: boolean;
}

/** Thresholds follow the svelte-glyph-capacity defaults; recalibrate when the faces are final. */
export const layoutThresholds = {
	compactChars: 75,
	compactLines: 32,
	phoneChars: 45,
	narrowChars: 90,
	regularChars: 180
} as const;

/** First match wins. Pixel orientation is used only for `compact` (a phone on its side). */
export function layoutFor({ maxChars, maxLines, pixelLandscape }: LayoutCapacity): LayoutId {
	const t = layoutThresholds;
	if (maxChars < t.compactChars && pixelLandscape && maxLines <= t.compactLines) return 'compact';
	if (maxChars < t.phoneChars) return 'phone';
	if (maxChars < t.narrowChars) return 'narrow';
	if (maxChars < t.regularChars) return 'regular';
	return 'wide';
}

/** Layouts where the page drops its paper margins and compresses its indents. */
export const marginlessLayouts: readonly LayoutId[] = ['compact', 'phone', 'narrow'];
