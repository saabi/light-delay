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
	import { untrack, type Snippet } from 'svelte';

	type Props = {
		breakpoints?: number[];
		/**
		 * Box used for capacity. `glyph-area` is the content box: the area where glyphs can be laid
		 * out, excluding borders, padding and scrollbars. Margins never reduce it. `measured-box` is the
		 * border box.
		 */
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
	let contentWidth = $state(0);
	let contentHeight = $state(0);
	let sampleWidth = $state(0);
	let sampleHeight = $state(0);
	let measuredLineBoxHeight = $state(0);

	const sampleLength = $derived(Math.max(1, sampleText.length));

	let warnedBreakpoints = false;
	/** Four finite, strictly ascending, positive thresholds; otherwise the defaults. */
	const validBreakpoints = $derived.by(() => {
		const valid =
			Array.isArray(breakpoints) &&
			breakpoints.length === 4 &&
			breakpoints.every(
				(threshold, index) =>
					Number.isFinite(threshold) &&
					threshold > 0 &&
					(index === 0 || threshold > breakpoints[index - 1])
			);
		if (!valid && !warnedBreakpoints) {
			warnedBreakpoints = true;
			console.warn(
				'GlyphCapacitySensor: `breakpoints` must be four positive, strictly ascending numbers; using the defaults.',
				breakpoints
			);
		}
		return valid ? breakpoints : defaultGlyphCapacityBreakpoints;
	});

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

	/** Content box: excludes borders, padding and scrollbars, which all reduce glyph capacity. */
	function readContentBox(entry: ResizeObserverEntry) {
		const box = entry.contentBoxSize?.[0];
		if (!box) return { width: entry.contentRect.width, height: entry.contentRect.height };
		return { width: box.inlineSize, height: box.blockSize };
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

	/** Used line-box height in px for maxLines (observed used LH, or unitless override x glyph). */
	function resolveLineBoxHeight(glyphHeight: number) {
		if (lineHeight != null && lineHeight > 0) {
			return glyphHeight * lineHeight;
		}
		return measuredLineBoxHeight;
	}

	function resolveCapacityBox() {
		return capacityBox === 'measured-box'
			? { width: containerWidth, height: containerHeight }
			: { width: contentWidth, height: contentHeight };
	}

	/* Two observers on the container, because padding, border and scrollbar changes can alter the
	   content box without changing the border box (and vice versa). Both feed one deferred frame so
	   the capacity is recomputed once per layout change, never from a half-updated pair. */
	$effect(() => {
		if (!containerEl) return;

		let frame = 0;
		let borderBox: { width: number; height: number } | undefined;
		let contentBox: { width: number; height: number } | undefined;
		const schedule = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				if (borderBox) {
					containerWidth = borderBox.width;
					containerHeight = borderBox.height;
				}
				if (contentBox) {
					contentWidth = contentBox.width;
					contentHeight = contentBox.height;
				}
			});
		};
		const borderObserver = new ResizeObserver((entries) => {
			borderBox = readBorderBox(entries[0], containerEl!);
			schedule();
		});
		const contentObserver = new ResizeObserver((entries) => {
			contentBox = readContentBox(entries[0]);
			schedule();
		});
		borderObserver.observe(containerEl, { box: 'border-box' });
		contentObserver.observe(containerEl, { box: 'content-box' });

		return () => {
			cancelAnimationFrame(frame);
			borderObserver.disconnect();
			contentObserver.disconnect();
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

	/* Oscillation guard: a container whose size depends on content that changes with its own
	   capacity flips between two measurements every frame. Warn once; the fix is in the layout. */
	let recentCapacities: string[] = [];
	let recentTimes: number[] = [];
	let alternations = 0;
	let warnedOscillation = false;
	function noteCapacity(key: string) {
		/* Only capacity transitions count; other fields (pixel size, aspect) may change in between. */
		if (key === recentCapacities[recentCapacities.length - 1]) return;
		const now = performance.now();
		recentCapacities = [...recentCapacities, key].slice(-4);
		recentTimes = [...recentTimes, now].slice(-4);
		if (recentCapacities.length < 4) return;
		const [a, b, c, d] = recentCapacities;
		const alternating = a === c && b === d && a !== b && now - recentTimes[0] < 500;
		alternations = alternating ? alternations + 1 : 0;
		if (alternations >= 3 && !warnedOscillation) {
			warnedOscillation = true;
			console.warn(
				`GlyphCapacitySensor: capacity is oscillating between ${a} and ${b} characters × lines. ` +
					'The container is sized by content that changes with its own capacity. Give it a ' +
					'layout-determined size (for example container-type: inline-size or size, or explicit dimensions).',
				containerEl
			);
		}
	}

	function sameValue(a: GlyphCapacityValue, b: GlyphCapacityValue) {
		return (
			a.classes === b.classes &&
			a.container.width === b.container.width &&
			a.container.height === b.container.height &&
			a.capacityBox.width === b.capacityBox.width &&
			a.capacityBox.height === b.capacityBox.height &&
			a.glyph.width === b.glyph.width &&
			a.glyph.height === b.glyph.height &&
			a.text.maxChars === b.text.maxChars &&
			a.text.maxLines === b.text.maxLines
		);
	}

	$effect(() => {
		/* Track props + probes so capacity recomputes when they change. */
		void lineHeight;
		void measuredLineBoxHeight;
		void capacityBox;
		void contentWidth;
		void contentHeight;
		const glyphWidth = sampleWidth / sampleLength;
		const glyphHeight = sampleHeight;
		const hasMeasurement =
			containerWidth > 0 && containerHeight > 0 && glyphWidth > 0 && glyphHeight > 0;

		if (!hasMeasurement) {
			if (!untrack(() => sameValue(value, emptyGlyphCapacityValue)))
				value = emptyGlyphCapacityValue;
			return;
		}

		const lineBoxHeight = resolveLineBoxHeight(glyphHeight);
		if (!(lineBoxHeight > 0)) {
			if (!untrack(() => sameValue(value, emptyGlyphCapacityValue)))
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
			xSmall: maxChars < validBreakpoints[0],
			small: true,
			medium: maxChars >= validBreakpoints[1],
			large: maxChars >= validBreakpoints[2],
			xLarge: maxChars >= validBreakpoints[3]
		};

		const next: GlyphCapacityValue = {
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

		/* Skip no-op updates so subscribers do not re-run on every resize frame. */
		if (untrack(() => sameValue(value, next))) return;
		noteCapacity(`${maxChars}×${maxLines}`);
		value = next;
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
