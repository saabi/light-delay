<script lang="ts">
	import { emptyGlyphCapacityValue, type GlyphCapacityBox, type GlyphCapacityValue } from '$lib';
	import AdaptiveRegion from './AdaptiveRegion.svelte';
	import ScenarioHost from './scenarios/ScenarioHost.svelte';
	import type {
		CapacityMetrics,
		Profile,
		ScenarioId,
		ScenarioStateMap,
		StageLayout,
		StageUnit,
		Typeface
	} from '../types';

	type ActionReturn = { update?: (arg: string) => void; destroy?: () => void } | void;
	type StageActionReturn = { destroy?: () => void } | void;

	let {
		capacity,
		height,
		layout = $bindable<StageLayout>('desktop'),
		measureCh,
		measureStage,
		measureUnits,
		onStateChange,
		profile,
		scenario,
		sensorCapacityBox,
		sensorValue = $bindable<GlyphCapacityValue>(emptyGlyphCapacityValue),
		state,
		strategy,
		typeface,
		unitLabel,
		unitMeasureKey,
		useLoremCopy,
		width
	}: {
		capacity: CapacityMetrics;
		height: number;
		layout?: StageLayout;
		measureCh: (node: HTMLElement) => StageActionReturn;
		measureStage: (node: HTMLElement, unit: StageUnit) => StageActionReturn;
		measureUnits: (node: HTMLElement, key: string) => ActionReturn;
		onStateChange: (next: ScenarioStateMap[ScenarioId]) => void;
		profile: Profile;
		scenario: ScenarioId;
		sensorCapacityBox: GlyphCapacityBox;
		sensorValue?: GlyphCapacityValue;
		state: ScenarioStateMap[ScenarioId];
		strategy: StageUnit;
		typeface: Typeface;
		unitLabel: string;
		unitMeasureKey: string;
		useLoremCopy: boolean;
		width: number;
	} = $props();

	function runMeasureStage(node: HTMLElement) {
		if (strategy === 'sensor') return;
		return measureStage(node, strategy);
	}

	function runMeasureUnits(node: HTMLElement, key: string) {
		return measureUnits(node, key);
	}
</script>

<article
	class={`stage face-${typeface} profile-${profile} layout-${layout} ${strategy === 'sensor' ? `sensor-${layout}` : ''}`}
	data-unit={strategy}
	data-layout={layout}
	use:runMeasureStage
	use:runMeasureUnits={unitMeasureKey}
>
	{#if strategy === 'emch'}<span class="ch-probe" use:measureCh aria-hidden="true">0</span>{/if}
	<AdaptiveRegion
		class="stage-adaptive-region sensor-measurer"
		{strategy}
		policy="stage"
		{profile}
		capacityBox={sensorCapacityBox}
		bind:mode={layout}
		bind:value={sensorValue}
	>
		{#snippet children()}
			<ScenarioHost
				{capacity}
				{height}
				{layout}
				{onStateChange}
				{profile}
				{scenario}
				sensor={sensorValue}
				{state}
				{strategy}
				{typeface}
				{unitLabel}
				{useLoremCopy}
				{width}
			/>
		{/snippet}
	</AdaptiveRegion>
</article>

<style>
	.stage {
		position: relative;
		width: 100%;
		height: 100%;
		min-width: 240px;
		min-height: 200px;
		container-type: size;
		overflow: hidden;
		background: #111923;
		border: 1px solid #3a4d6e;
		border-radius: 6px;
		color: #f2f5fb;
	}

	.stage[data-unit='px'] {
		container-name: stage-px;
	}
	.stage[data-unit='rem'] {
		container-name: stage-rem;
	}
	.stage[data-unit='em'] {
		container-name: stage-em;
	}
	.stage[data-unit='emch'] {
		container-name: stage-emch;
	}

	.stage.face-narrow {
		font-family: 'Archivo CQ', sans-serif;
		font-stretch: 75%;
		letter-spacing: 0;
	}
	.stage.face-normal {
		font-family: 'Archivo CQ', sans-serif;
		font-stretch: 100%;
		letter-spacing: 0;
	}
	.stage.face-wide {
		font-family: 'Archivo CQ', sans-serif;
		font-stretch: 125%;
		letter-spacing: 0;
	}

	:global(.stage-adaptive-region) {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}
	.ch-probe {
		position: absolute;
		left: -9999px;
		top: -9999px;
		display: block;
		width: 1ch;
		height: 1px;
		overflow: hidden;
		white-space: nowrap;
	}
</style>
