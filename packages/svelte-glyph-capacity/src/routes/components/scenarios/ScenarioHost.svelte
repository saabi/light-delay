<script lang="ts">
	import type { GlyphCapacityValue } from '$lib';
	import AdaptiveWidgetsScenario from './AdaptiveWidgetsScenario.svelte';
	import CollectionScenario from './CollectionScenario.svelte';
	import MasterDetailScenario from './MasterDetailScenario.svelte';
	import SiteShellScenario from './SiteShellScenario.svelte';
	import type {
		CapacityMetrics,
		Profile,
		ScenarioId,
		ScenarioStateMap,
		StageLayout,
		StageUnit,
		Typeface
	} from '../../types';

	let {
		capacity,
		height,
		layout,
		onStateChange,
		profile,
		scenario,
		sensor,
		state,
		strategy,
		typeface,
		unitLabel,
		useLoremCopy,
		width
	}: {
		capacity: CapacityMetrics;
		height: number;
		layout: StageLayout;
		onStateChange: (next: ScenarioStateMap[ScenarioId]) => void;
		profile: Profile;
		scenario: ScenarioId;
		sensor: GlyphCapacityValue;
		state: ScenarioStateMap[ScenarioId];
		strategy: StageUnit;
		typeface: Typeface;
		unitLabel: string;
		useLoremCopy: boolean;
		width: number;
	} = $props();
</script>

{#if scenario === 'site-shell'}
	<SiteShellScenario
		{capacity}
		{height}
		{sensor}
		{strategy}
		{typeface}
		{unitLabel}
		{useLoremCopy}
		{width}
	/>
{:else if scenario === 'adaptive-widgets'}
	<AdaptiveWidgetsScenario
		{layout}
		{profile}
		{strategy}
		state={state as ScenarioStateMap['adaptive-widgets']}
		onChange={(next) => onStateChange(next)}
	/>
{:else if scenario === 'master-detail'}
	<MasterDetailScenario
		{layout}
		{profile}
		{strategy}
		state={state as ScenarioStateMap['master-detail']}
		onChange={(next) => onStateChange(next)}
	/>
{:else}
	<CollectionScenario
		{layout}
		{profile}
		{strategy}
		state={state as ScenarioStateMap['collection']}
		onChange={(next) => onStateChange(next)}
	/>
{/if}
