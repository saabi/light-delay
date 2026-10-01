<script lang="ts">
	import type { Snippet } from 'svelte';
	import {
		GlyphCapacitySensor,
		emptyGlyphCapacityValue,
		type GlyphCapacityBox,
		type GlyphCapacityValue
	} from '$lib';
	import {
		ADAPTIVE_POLICIES,
		AVG_CHARS,
		COMPACT_CHARS,
		HEIGHT_CUTOFF,
		type AdaptiveMode,
		type AdaptivePolicyId,
		type Profile,
		type StageLayout,
		type StageUnit
	} from '../types';

	type RegionMode = AdaptiveMode | StageLayout;

	let {
		capacityBox = 'glyph-area',
		children,
		class: className = '',
		mode = $bindable<RegionMode>('full'),
		policy,
		profile,
		strategy,
		value = $bindable<GlyphCapacityValue>(emptyGlyphCapacityValue)
	}: {
		capacityBox?: GlyphCapacityBox;
		children: Snippet<[RegionMode, GlyphCapacityValue]>;
		class?: string;
		mode?: RegionMode;
		policy: AdaptivePolicyId;
		profile: Profile;
		strategy: StageUnit;
		value?: GlyphCapacityValue;
	} = $props();

	let reporter: HTMLSpanElement | undefined = $state();

	function sensorMode(measurement: GlyphCapacityValue): RegionMode {
		if (policy === 'stage') {
			const compact =
				measurement.text.maxChars < COMPACT_CHARS &&
				measurement.orientations.pixelLandscape &&
				measurement.text.maxLines <= HEIGHT_CUTOFF;
			if (compact) return 'compact';
			if (measurement.text.maxChars < AVG_CHARS) return 'narrow';
			return 'desktop';
		}

		const budget = ADAPTIVE_POLICIES[policy];
		if (
			measurement.text.maxChars >= budget.full.maxChars &&
			measurement.text.maxLines >= budget.full.maxLines
		)
			return 'full';
		if (
			measurement.text.maxChars >= budget.reduced.maxChars &&
			measurement.text.maxLines >= budget.reduced.maxLines
		)
			return 'reduced';
		return 'minimal';
	}

	$effect(() => {
		if (strategy !== 'sensor' || value.container.width <= 0) return;
		mode = sensorMode(value);
	});

	$effect(() => {
		if (strategy === 'sensor' || !reporter) return;
		const target = reporter;
		let frame = 0;
		const apply = () => {
			const code = Math.round(target.getBoundingClientRect().width);
			if (policy === 'stage') {
				mode = code === 1 ? 'compact' : code === 2 ? 'narrow' : 'desktop';
			} else {
				mode = code === 1 ? 'minimal' : code === 2 ? 'reduced' : 'full';
			}
		};
		const schedule = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(apply);
		};
		const observer = new ResizeObserver(schedule);
		observer.observe(target);
		apply();
		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
		};
	});
</script>

{#if strategy === 'sensor'}
	<GlyphCapacitySensor
		class={`adaptive-region ${className}`}
		dataUnit={strategy}
		{capacityBox}
		bind:value
	>
		{@render children(mode, value)}
	</GlyphCapacitySensor>
{:else}
	<div
		class={`adaptive-region ${className}`}
		data-policy={policy}
		data-profile={profile}
		data-unit={strategy}
	>
		<span
			aria-hidden="true"
			bind:this={reporter}
			class={`adaptive-reporter policy-${policy} strategy-${strategy} profile-${profile}`}
		></span>
		{@render children(mode, value)}
	</div>
{/if}

<style>
	:global(.adaptive-region) {
		box-sizing: border-box;
		container-name: adaptive-region;
		container-type: size;
		min-height: 0;
		min-width: 0;
		position: relative;
	}

	.adaptive-reporter {
		position: absolute;
		inset: 0 auto auto 0;
		width: 3px;
		height: 1px;
		overflow: hidden;
		visibility: hidden;
		pointer-events: none;
	}

	/* Outer stage policy. Later compact rules intentionally win over narrow rules. */
	@container adaptive-region (max-width: 768px) {
		.policy-stage.strategy-px {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: 48rem) {
		.policy-stage.strategy-rem {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: 48em) {
		.policy-stage.strategy-em {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: calc(12.6em + 24.75ch)) {
		.policy-stage.strategy-emch.profile-latin {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: calc(9.9em + 22.5ch)) {
		.policy-stage.strategy-emch.profile-ui {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: calc(16.2em + 27.9ch)) {
		.policy-stage.strategy-emch.profile-headings {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: 1200px) and (max-height: 512px) and (orientation: landscape) {
		.policy-stage.strategy-px {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: 75rem) and (max-height: 32rem) and (orientation: landscape) {
		.policy-stage.strategy-rem {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: 75em) and (max-height: 32em) and (orientation: landscape) {
		.policy-stage.strategy-em {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: calc(21em + 41.25ch)) and (max-height: 32em) and (orientation: landscape) {
		.policy-stage.strategy-emch.profile-latin {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: calc(16.5em + 37.5ch)) and (max-height: 32em) and (orientation: landscape) {
		.policy-stage.strategy-emch.profile-ui {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: calc(27em + 46.5ch)) and (max-height: 32em) and (orientation: landscape) {
		.policy-stage.strategy-emch.profile-headings {
			width: 1px;
		}
	}

	/* px proxy: one semantic unit is the fixed 16px baseline. */
	@container adaptive-region (max-width: 704px) {
		.policy-choice.strategy-px {
			width: 2px;
		}
	}
	@container adaptive-region (max-height: 144px) {
		.policy-choice.strategy-px {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: 448px) {
		.policy-choice.strategy-px {
			width: 1px;
		}
	}
	@container adaptive-region (max-height: 96px) {
		.policy-choice.strategy-px {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: 640px) {
		.policy-numeric.strategy-px,
		.policy-collection-item.strategy-px {
			width: 2px;
		}
	}
	@container adaptive-region (max-height: 112px) {
		.policy-numeric.strategy-px {
			width: 2px;
		}
	}
	@container adaptive-region (max-height: 128px) {
		.policy-collection-item.strategy-px {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: 416px) {
		.policy-numeric.strategy-px {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: 400px) {
		.policy-collection-item.strategy-px {
			width: 1px;
		}
	}
	@container adaptive-region (max-height: 80px) {
		.policy-numeric.strategy-px,
		.policy-collection-item.strategy-px {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: 768px) {
		.policy-toolbar.strategy-px,
		.policy-search.strategy-px {
			width: 2px;
		}
	}
	@container adaptive-region (max-height: 80px) {
		.policy-toolbar.strategy-px {
			width: 2px;
		}
	}
	@container adaptive-region (max-height: 112px) {
		.policy-search.strategy-px {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: 512px) {
		.policy-toolbar.strategy-px {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: 480px) {
		.policy-search.strategy-px {
			width: 1px;
		}
	}
	@container adaptive-region (max-height: 64px) {
		.policy-toolbar.strategy-px {
			width: 1px;
		}
	}
	@container adaptive-region (max-height: 80px) {
		.policy-search.strategy-px {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: 864px) {
		.policy-tabs.strategy-px {
			width: 2px;
		}
	}
	@container adaptive-region (max-height: 64px) {
		.policy-tabs.strategy-px {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: 544px) {
		.policy-tabs.strategy-px {
			width: 1px;
		}
	}
	@container adaptive-region (max-height: 48px) {
		.policy-tabs.strategy-px {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: 608px) {
		.policy-form-actions.strategy-px {
			width: 2px;
		}
	}
	@container adaptive-region (max-height: 96px) {
		.policy-form-actions.strategy-px,
		.policy-detail-tools.strategy-px {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: 672px) {
		.policy-detail-tools.strategy-px {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: 416px) {
		.policy-form-actions.strategy-px {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: 448px) {
		.policy-detail-tools.strategy-px {
			width: 1px;
		}
	}
	@container adaptive-region (max-height: 64px) {
		.policy-form-actions.strategy-px,
		.policy-detail-tools.strategy-px {
			width: 1px;
		}
	}

	/* rem and em proxies intentionally use their respective CSS units. */
	@container adaptive-region (max-width: 44rem) {
		.policy-choice.strategy-rem {
			width: 2px;
		}
	}
	@container adaptive-region (max-height: 9rem) {
		.policy-choice.strategy-rem {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: 28rem) {
		.policy-choice.strategy-rem {
			width: 1px;
		}
	}
	@container adaptive-region (max-height: 6rem) {
		.policy-choice.strategy-rem {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: 40rem) {
		.policy-numeric.strategy-rem,
		.policy-collection-item.strategy-rem {
			width: 2px;
		}
	}
	@container adaptive-region (max-height: 7rem) {
		.policy-numeric.strategy-rem {
			width: 2px;
		}
	}
	@container adaptive-region (max-height: 8rem) {
		.policy-collection-item.strategy-rem {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: 26rem) {
		.policy-numeric.strategy-rem {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: 25rem) {
		.policy-collection-item.strategy-rem {
			width: 1px;
		}
	}
	@container adaptive-region (max-height: 5rem) {
		.policy-numeric.strategy-rem,
		.policy-collection-item.strategy-rem {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: 48rem) {
		.policy-toolbar.strategy-rem,
		.policy-search.strategy-rem {
			width: 2px;
		}
	}
	@container adaptive-region (max-height: 5rem) {
		.policy-toolbar.strategy-rem {
			width: 2px;
		}
	}
	@container adaptive-region (max-height: 7rem) {
		.policy-search.strategy-rem {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: 32rem) {
		.policy-toolbar.strategy-rem {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: 30rem) {
		.policy-search.strategy-rem {
			width: 1px;
		}
	}
	@container adaptive-region (max-height: 4rem) {
		.policy-toolbar.strategy-rem {
			width: 1px;
		}
	}
	@container adaptive-region (max-height: 5rem) {
		.policy-search.strategy-rem {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: 54rem) {
		.policy-tabs.strategy-rem {
			width: 2px;
		}
	}
	@container adaptive-region (max-height: 4rem) {
		.policy-tabs.strategy-rem {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: 34rem) {
		.policy-tabs.strategy-rem {
			width: 1px;
		}
	}
	@container adaptive-region (max-height: 3rem) {
		.policy-tabs.strategy-rem {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: 38rem) {
		.policy-form-actions.strategy-rem {
			width: 2px;
		}
	}
	@container adaptive-region (max-height: 6rem) {
		.policy-form-actions.strategy-rem,
		.policy-detail-tools.strategy-rem {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: 42rem) {
		.policy-detail-tools.strategy-rem {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: 26rem) {
		.policy-form-actions.strategy-rem {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: 28rem) {
		.policy-detail-tools.strategy-rem {
			width: 1px;
		}
	}
	@container adaptive-region (max-height: 4rem) {
		.policy-form-actions.strategy-rem,
		.policy-detail-tools.strategy-rem {
			width: 1px;
		}
	}

	@container adaptive-region (max-width: 44em) {
		.policy-choice.strategy-em {
			width: 2px;
		}
	}
	@container adaptive-region (max-height: 9em) {
		.policy-choice.strategy-em {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: 28em) {
		.policy-choice.strategy-em {
			width: 1px;
		}
	}
	@container adaptive-region (max-height: 6em) {
		.policy-choice.strategy-em {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: 40em) {
		.policy-numeric.strategy-em,
		.policy-collection-item.strategy-em {
			width: 2px;
		}
	}
	@container adaptive-region (max-height: 7em) {
		.policy-numeric.strategy-em {
			width: 2px;
		}
	}
	@container adaptive-region (max-height: 8em) {
		.policy-collection-item.strategy-em {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: 26em) {
		.policy-numeric.strategy-em {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: 25em) {
		.policy-collection-item.strategy-em {
			width: 1px;
		}
	}
	@container adaptive-region (max-height: 5em) {
		.policy-numeric.strategy-em,
		.policy-collection-item.strategy-em {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: 48em) {
		.policy-toolbar.strategy-em,
		.policy-search.strategy-em {
			width: 2px;
		}
	}
	@container adaptive-region (max-height: 5em) {
		.policy-toolbar.strategy-em {
			width: 2px;
		}
	}
	@container adaptive-region (max-height: 7em) {
		.policy-search.strategy-em {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: 32em) {
		.policy-toolbar.strategy-em {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: 30em) {
		.policy-search.strategy-em {
			width: 1px;
		}
	}
	@container adaptive-region (max-height: 4em) {
		.policy-toolbar.strategy-em {
			width: 1px;
		}
	}
	@container adaptive-region (max-height: 5em) {
		.policy-search.strategy-em {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: 54em) {
		.policy-tabs.strategy-em {
			width: 2px;
		}
	}
	@container adaptive-region (max-height: 4em) {
		.policy-tabs.strategy-em {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: 34em) {
		.policy-tabs.strategy-em {
			width: 1px;
		}
	}
	@container adaptive-region (max-height: 3em) {
		.policy-tabs.strategy-em {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: 38em) {
		.policy-form-actions.strategy-em {
			width: 2px;
		}
	}
	@container adaptive-region (max-height: 6em) {
		.policy-form-actions.strategy-em,
		.policy-detail-tools.strategy-em {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: 42em) {
		.policy-detail-tools.strategy-em {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: 26em) {
		.policy-form-actions.strategy-em {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: 28em) {
		.policy-detail-tools.strategy-em {
			width: 1px;
		}
	}
	@container adaptive-region (max-height: 4em) {
		.policy-form-actions.strategy-em,
		.policy-detail-tools.strategy-em {
			width: 1px;
		}
	}

	/* em/ch inline proxies, calibrated per profile. Block thresholds remain em proxies. */
	@container adaptive-region (max-width: calc(12.32em + 24.2ch)) {
		.policy-choice.strategy-emch.profile-latin {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: calc(9.68em + 22ch)) {
		.policy-choice.strategy-emch.profile-ui {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: calc(15.84em + 27.28ch)) {
		.policy-choice.strategy-emch.profile-headings {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: calc(7.84em + 15.4ch)) {
		.policy-choice.strategy-emch.profile-latin {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: calc(6.16em + 14ch)) {
		.policy-choice.strategy-emch.profile-ui {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: calc(10.08em + 17.36ch)) {
		.policy-choice.strategy-emch.profile-headings {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: calc(11.2em + 22ch)) {
		.policy-numeric.strategy-emch.profile-latin,
		.policy-collection-item.strategy-emch.profile-latin {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: calc(8.8em + 20ch)) {
		.policy-numeric.strategy-emch.profile-ui,
		.policy-collection-item.strategy-emch.profile-ui {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: calc(14.4em + 24.8ch)) {
		.policy-numeric.strategy-emch.profile-headings,
		.policy-collection-item.strategy-emch.profile-headings {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: calc(7.28em + 14.3ch)) {
		.policy-numeric.strategy-emch.profile-latin {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: calc(5.72em + 13ch)) {
		.policy-numeric.strategy-emch.profile-ui {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: calc(9.36em + 16.12ch)) {
		.policy-numeric.strategy-emch.profile-headings {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: calc(7em + 13.75ch)) {
		.policy-collection-item.strategy-emch.profile-latin {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: calc(5.5em + 12.5ch)) {
		.policy-collection-item.strategy-emch.profile-ui {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: calc(9em + 15.5ch)) {
		.policy-collection-item.strategy-emch.profile-headings {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: calc(13.44em + 26.4ch)) {
		.policy-toolbar.strategy-emch.profile-latin,
		.policy-search.strategy-emch.profile-latin {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: calc(10.56em + 24ch)) {
		.policy-toolbar.strategy-emch.profile-ui,
		.policy-search.strategy-emch.profile-ui {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: calc(17.28em + 29.76ch)) {
		.policy-toolbar.strategy-emch.profile-headings,
		.policy-search.strategy-emch.profile-headings {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: calc(8.96em + 17.6ch)) {
		.policy-toolbar.strategy-emch.profile-latin {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: calc(7.04em + 16ch)) {
		.policy-toolbar.strategy-emch.profile-ui {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: calc(11.52em + 19.84ch)) {
		.policy-toolbar.strategy-emch.profile-headings {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: calc(8.4em + 16.5ch)) {
		.policy-search.strategy-emch.profile-latin {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: calc(6.6em + 15ch)) {
		.policy-search.strategy-emch.profile-ui {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: calc(10.8em + 18.6ch)) {
		.policy-search.strategy-emch.profile-headings {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: calc(15.12em + 29.7ch)) {
		.policy-tabs.strategy-emch.profile-latin {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: calc(11.88em + 27ch)) {
		.policy-tabs.strategy-emch.profile-ui {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: calc(19.44em + 33.48ch)) {
		.policy-tabs.strategy-emch.profile-headings {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: calc(9.52em + 18.7ch)) {
		.policy-tabs.strategy-emch.profile-latin {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: calc(7.48em + 17ch)) {
		.policy-tabs.strategy-emch.profile-ui {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: calc(12.24em + 21.08ch)) {
		.policy-tabs.strategy-emch.profile-headings {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: calc(10.64em + 20.9ch)) {
		.policy-form-actions.strategy-emch.profile-latin {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: calc(8.36em + 19ch)) {
		.policy-form-actions.strategy-emch.profile-ui {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: calc(13.68em + 23.56ch)) {
		.policy-form-actions.strategy-emch.profile-headings {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: calc(11.76em + 23.1ch)) {
		.policy-detail-tools.strategy-emch.profile-latin {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: calc(9.24em + 21ch)) {
		.policy-detail-tools.strategy-emch.profile-ui {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: calc(15.12em + 26.04ch)) {
		.policy-detail-tools.strategy-emch.profile-headings {
			width: 2px;
		}
	}
	@container adaptive-region (max-width: calc(7.28em + 14.3ch)) {
		.policy-form-actions.strategy-emch.profile-latin {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: calc(5.72em + 13ch)) {
		.policy-form-actions.strategy-emch.profile-ui {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: calc(9.36em + 16.12ch)) {
		.policy-form-actions.strategy-emch.profile-headings {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: calc(7.84em + 15.4ch)) {
		.policy-detail-tools.strategy-emch.profile-latin {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: calc(6.16em + 14ch)) {
		.policy-detail-tools.strategy-emch.profile-ui {
			width: 1px;
		}
	}
	@container adaptive-region (max-width: calc(10.08em + 17.36ch)) {
		.policy-detail-tools.strategy-emch.profile-headings {
			width: 1px;
		}
	}

	@container adaptive-region (max-height: 9em) {
		.policy-choice.strategy-emch {
			width: 2px;
		}
	}
	@container adaptive-region (max-height: 6em) {
		.policy-choice.strategy-emch {
			width: 1px;
		}
	}
	@container adaptive-region (max-height: 7em) {
		.policy-numeric.strategy-emch,
		.policy-search.strategy-emch {
			width: 2px;
		}
	}
	@container adaptive-region (max-height: 8em) {
		.policy-collection-item.strategy-emch {
			width: 2px;
		}
	}
	@container adaptive-region (max-height: 5em) {
		.policy-toolbar.strategy-emch {
			width: 2px;
		}
	}
	@container adaptive-region (max-height: 4em) {
		.policy-tabs.strategy-emch {
			width: 2px;
		}
	}
	@container adaptive-region (max-height: 6em) {
		.policy-form-actions.strategy-emch,
		.policy-detail-tools.strategy-emch {
			width: 2px;
		}
	}
	@container adaptive-region (max-height: 5em) {
		.policy-numeric.strategy-emch,
		.policy-search.strategy-emch,
		.policy-collection-item.strategy-emch {
			width: 1px;
		}
	}
	@container adaptive-region (max-height: 4em) {
		.policy-toolbar.strategy-emch,
		.policy-tabs.strategy-emch,
		.policy-form-actions.strategy-emch,
		.policy-detail-tools.strategy-emch {
			width: 1px;
		}
	}
</style>
