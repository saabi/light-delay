<script lang="ts">
	import type { GlyphCapacityValue } from '$lib';
	import SandboxStageContent from '../SandboxStageContent.svelte';
	import type { CapacityMetrics, StageUnit, Typeface } from '../../types';

	let {
		capacity,
		height,
		sensor,
		strategy,
		typeface,
		unitLabel,
		useLoremCopy,
		width
	}: {
		capacity: CapacityMetrics;
		height: number;
		sensor: GlyphCapacityValue;
		strategy: StageUnit;
		typeface: Typeface;
		unitLabel: string;
		useLoremCopy: boolean;
		width: number;
	} = $props();

	const descriptions: Record<StageUnit, string> = {
		px: 'A fixed-pixel proxy tracks the box while ignoring root size, typeface, and rendered text capacity.',
		rem: 'Root-relative thresholds respond to the cloned root size, but remain a proxy for local text capacity.',
		em: 'Container-relative em thresholds follow computed font size, but not the width of the rendered glyph sample.',
		emch: 'A profile-calibrated em/ch expression estimates average glyph width while remaining a CSS proxy.',
		sensor:
			'The stage measures its rendered sample and branches from local character and line capacity.'
	};
</script>

<SandboxStageContent body={descriptions[strategy]} {typeface} {useLoremCopy}>
	{#if strategy === 'sensor'}
		<p
			class="metric-readout"
			data-container-width={sensor.container.width}
			data-container-height={sensor.container.height}
			data-capacity-width={sensor.capacityBox.width}
			data-capacity-height={sensor.capacityBox.height}
		>
			box {sensor.container.width.toFixed(0)}×{sensor.container.height.toFixed(0)} · glyph area {sensor.capacityBox.width.toFixed(
				0
			)}×{sensor.capacityBox.height.toFixed(0)}
		</p>
		<p
			class="capacity-readout"
			data-glyph-width={sensor.glyph.width}
			data-glyph-height={sensor.glyph.height}
			data-max-chars={capacity.maxChars}
			data-max-lines={capacity.maxLines}
		>
			glyph {sensor.glyph.width.toFixed(2)}×{sensor.glyph.height.toFixed(2)} · chars
			{capacity.maxChars}×{capacity.maxLines} · ar {capacity.aspectRatio.toFixed(2)}
		</p>
	{:else}
		<p class="metric-readout">px {width.toFixed(0)}×{height.toFixed(0)}</p>
		<p class="capacity-readout">
			chars {capacity.maxChars}×{capacity.maxLines} · ar {capacity.aspectRatio.toFixed(2)}
		</p>
	{/if}
	<p class="unit-readout">{unitLabel}</p>
</SandboxStageContent>
