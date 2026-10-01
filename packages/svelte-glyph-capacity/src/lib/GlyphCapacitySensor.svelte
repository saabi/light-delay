<script module lang="ts">
	export type GlyphCapacitySizeFlags = {
		xSmall: boolean;
		small: boolean;
		medium: boolean;
		large: boolean;
		xLarge: boolean;
	};

	export type GlyphCapacityBox = 'glyph-area' | 'measured-box';

	export type GlyphCapacityValue = {
		classes: string;
		container: {
			width: number;
			height: number;
			aspectRatio: number;
		};
		capacityBox: {
			width: number;
			height: number;
		};
		glyph: {
			width: number;
			height: number;
		};
		orientations: {
			pixelLandscape: boolean;
			pixelPortrait: boolean;
			textLandscape: boolean;
			textPortrait: boolean;
		};
		sizes: GlyphCapacitySizeFlags;
		text: {
			maxChars: number;
			maxLines: number;
			aspectRatio: number;
		};
	};

	export const defaultGlyphCapacityBreakpoints = [45, 90, 135, 180];

	export const emptyGlyphCapacityValue: GlyphCapacityValue = {
		classes: '',
		container: {
			width: 0,
			height: 0,
			aspectRatio: 0
		},
		capacityBox: {
			width: 0,
			height: 0
		},
		glyph: {
			width: 0,
			height: 0
		},
		orientations: {
			pixelLandscape: false,
			pixelPortrait: false,
			textLandscape: false,
			textPortrait: false
		},
		sizes: {
			xSmall: false,
			small: true,
			medium: false,
			large: false,
			xLarge: false
		},
		text: {
			maxChars: 0,
			maxLines: 0,
			aspectRatio: 0
		}
	};
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		breakpoints?: number[];
		/** Box used for capacity. glyph-area removes margins, borders, and padding on both axes. */
		capacityBox?: GlyphCapacityBox;
		children?: Snippet<[GlyphCapacityValue]>;
		class?: string;
		dataUnit?: string;
		isDev?: boolean;
		/** Unitless override for maxLines. When omitted, use the container’s computed line-height. */
		lineHeight?: number;
		sampleText?: string;
		style?: string;
		value?: GlyphCapacityValue;
	};

	let {
		breakpoints = defaultGlyphCapacityBreakpoints,
		capacityBox = 'glyph-area',
		children,
		class: className = '',
		dataUnit,
		isDev = false,
		lineHeight,
		sampleText = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
		style,
		value = $bindable(emptyGlyphCapacityValue)
	}: Props = $props();

	let containerEl: HTMLDivElement | undefined = $state();
	let sampleEl: HTMLSpanElement | undefined = $state();
	let lineBoxEl: HTMLSpanElement | undefined = $state();
	let containerWidth = $state(0);
	let containerHeight = $state(0);
	let sampleWidth = $state(0);
	let sampleHeight = $state(0);
	let measuredLineBoxHeight = $state(0);
	let boxStyleRevision = $state(0);

	const sampleLength = $derived(Math.max(1, sampleText.length));

	function readBorderBox(entry: ResizeObserverEntry, element: Element) {
		const box = entry.borderBoxSize?.[0];
		if (!box) {
			const rect = element.getBoundingClientRect();
			return { width: rect.width, height: rect.height };
		}
		return {
			width: box.inlineSize,
			height: box.blockSize
		};
	}

	function makeClasses(
		sizes: GlyphCapacitySizeFlags,
		orientations: GlyphCapacityValue['orientations']
	) {
		const flags = {
			...sizes,
			textLandscape: orientations.textLandscape,
			textPortrait: orientations.textPortrait,
			pixelLandscape: orientations.pixelLandscape,
			pixelPortrait: orientations.pixelPortrait
		};
		return Object.entries(flags)
			.filter(([, enabled]) => enabled)
			.map(([key]) => key)
			.join(' ');
	}

	function parseCssPx(value: string) {
		const px = parseFloat(value);
		return Number.isFinite(px) ? px : 0;
	}

	/** Used line-box height in px for maxLines (observed used LH, or unitless override x glyph). */
	function resolveLineBoxHeight(glyphHeight: number) {
		if (lineHeight != null && lineHeight > 0) {
			return glyphHeight * lineHeight;
		}
		return measuredLineBoxHeight;
	}

	/** Semantic capacity box used for glyph fit, kept separate from the raw observed box. */
	function resolveCapacityBox() {
		let width = containerWidth;
		let height = containerHeight;
		if (!containerEl || capacityBox === 'measured-box') {
			return { width, height };
		}

		const cs = getComputedStyle(containerEl);
		width -=
			parseCssPx(cs.marginLeft) +
			parseCssPx(cs.marginRight) +
			parseCssPx(cs.borderLeftWidth) +
			parseCssPx(cs.borderRightWidth) +
			parseCssPx(cs.paddingLeft) +
			parseCssPx(cs.paddingRight);
		height -=
			parseCssPx(cs.marginTop) +
			parseCssPx(cs.marginBottom) +
			parseCssPx(cs.borderTopWidth) +
			parseCssPx(cs.borderBottomWidth) +
			parseCssPx(cs.paddingTop) +
			parseCssPx(cs.paddingBottom);

		return { width: Math.max(0, width), height: Math.max(0, height) };
	}

	$effect(() => {
		if (!containerEl) return;

		let frame = 0;
		const observer = new ResizeObserver((entries) => {
			const box = readBorderBox(entries[0], containerEl!);
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				containerWidth = box.width;
				containerHeight = box.height;
			});
		});
		observer.observe(containerEl, { box: 'border-box' });

		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
		};
	});

	$effect(() => {
		if (!sampleEl) return;

		let frame = 0;
		const observer = new ResizeObserver((entries) => {
			const box = readBorderBox(entries[0], sampleEl!);
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				sampleWidth = box.width;
				sampleHeight = box.height;
			});
		});
		observer.observe(sampleEl);

		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
		};
	});

	$effect(() => {
		if (!lineBoxEl) return;

		let frame = 0;
		const observer = new ResizeObserver((entries) => {
			const box = readBorderBox(entries[0], lineBoxEl!);
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				measuredLineBoxHeight = box.height;
			});
		});
		observer.observe(lineBoxEl);

		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
		};
	});

	$effect(() => {
		if (!containerEl) return;
		const observer = new MutationObserver(() => {
			boxStyleRevision += 1;
		});
		observer.observe(containerEl, { attributes: true, attributeFilter: ['class', 'style'] });
		return () => observer.disconnect();
	});

	$effect(() => {
		/* Track props + probes so capacity recomputes when they change. */
		void lineHeight;
		void measuredLineBoxHeight;
		void capacityBox;
		void boxStyleRevision;
		void className;
		void style;
		const glyphWidth = sampleWidth / sampleLength;
		const glyphHeight = sampleHeight;
		const hasMeasurement =
			containerWidth > 0 && containerHeight > 0 && glyphWidth > 0 && glyphHeight > 0;

		if (!hasMeasurement) {
			value = emptyGlyphCapacityValue;
			return;
		}

		const lineBoxHeight = resolveLineBoxHeight(glyphHeight);
		if (!(lineBoxHeight > 0)) {
			value = emptyGlyphCapacityValue;
			return;
		}

		const resolvedCapacityBox = resolveCapacityBox();
		const maxChars = Math.floor(resolvedCapacityBox.width / glyphWidth);
		const maxLines = Math.floor(resolvedCapacityBox.height / lineBoxHeight);
		const containerAspectRatio = containerWidth / containerHeight;
		const textAspectRatio = maxLines > 0 ? maxChars / maxLines : 0;
		const orientations = {
			pixelLandscape: containerAspectRatio >= 1,
			pixelPortrait: containerAspectRatio < 1,
			textLandscape: textAspectRatio >= 1,
			textPortrait: textAspectRatio < 1
		};
		const sizes = {
			xSmall: maxChars < breakpoints[0],
			small: true,
			medium: maxChars >= breakpoints[1],
			large: maxChars >= breakpoints[2],
			xLarge: maxChars >= breakpoints[3]
		};

		value = {
			classes: makeClasses(sizes, orientations),
			container: {
				width: containerWidth,
				height: containerHeight,
				aspectRatio: containerAspectRatio
			},
			capacityBox: resolvedCapacityBox,
			glyph: {
				width: glyphWidth,
				height: glyphHeight
			},
			orientations,
			sizes,
			text: {
				maxChars,
				maxLines,
				aspectRatio: textAspectRatio
			}
		};
	});
</script>

<div bind:this={containerEl} class={className} data-unit={dataUnit} {style}>
	<span class="glyph-capacity-sensor-sample" aria-hidden="true">
		<span bind:this={sampleEl}>{sampleText}</span>
	</span>
	<span class="glyph-capacity-sensor-line-box" aria-hidden="true" bind:this={lineBoxEl}>X</span>
	{@render children?.(value)}
	{#if isDev}
		<dl class="glyph-capacity-sensor-dev">
			<div>
				<dt>Container</dt>
				<dd>{value.container.width.toFixed(0)} x {value.container.height.toFixed(0)}</dd>
			</div>
			<div>
				<dt>Glyph</dt>
				<dd>{value.glyph.width.toFixed(2)} x {value.glyph.height.toFixed(2)}</dd>
			</div>
			<div>
				<dt>Capacity box</dt>
				<dd>{value.capacityBox.width.toFixed(0)} x {value.capacityBox.height.toFixed(0)}</dd>
			</div>
			<div>
				<dt>Text</dt>
				<dd>{value.text.maxChars} x {value.text.maxLines}</dd>
			</div>
		</dl>
	{/if}
</div>

<style>
	.glyph-capacity-sensor-sample {
		display: block;
		height: 0;
		left: 0;
		overflow: hidden;
		pointer-events: none;
		position: absolute;
		top: 0;
		visibility: hidden;
		width: 0;
	}

	.glyph-capacity-sensor-sample span {
		display: block;
		line-height: 1;
		width: max-content;
	}

	.glyph-capacity-sensor-line-box {
		display: block;
		font: inherit;
		height: auto;
		left: 0;
		line-height: inherit;
		overflow: hidden;
		pointer-events: none;
		position: absolute;
		top: 0;
		visibility: hidden;
		width: max-content;
	}

	.glyph-capacity-sensor-dev {
		background: rgba(255, 255, 255, 0.9);
		border: 1px solid rgba(0, 0, 0, 0.3);
		color: #000000;
		font:
			11px/1.3 ui-monospace,
			monospace;
		margin: 0;
		padding: 0.4rem;
		position: absolute;
		right: 0.5rem;
		top: 2rem;
		z-index: 20;
	}

	.glyph-capacity-sensor-dev div {
		display: flex;
		gap: 0.5rem;
		justify-content: space-between;
	}

	.glyph-capacity-sensor-dev dd {
		margin: 0;
	}
</style>
