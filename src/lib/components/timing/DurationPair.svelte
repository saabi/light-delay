<script lang="ts">
	import { formatClock } from '$lib/utils/duration';
	import * as m from '$lib/paraglide/messages.js';

	let {
		montageMs,
		spokenMs,
		compact = false,
		showDelta = true
	}: {
		montageMs: number;
		spokenMs: number;
		compact?: boolean;
		showDelta?: boolean;
	} = $props();

	const surplus = $derived(showDelta && spokenMs > montageMs);
</script>

<span class="duration-pair" class:compact>
	<span class="montage" title={m.timing_montage()}>
		{#if !compact}<span class="label">{m.timing_montage()}</span>{/if}
		<span class="clock">{formatClock(montageMs)}</span>
	</span>
	<span class="sep" aria-hidden="true">·</span>
	<span class="spoken" title={m.timing_spoken_dialogue()}>
		{#if !compact}<span class="label">{m.timing_spoken_short()}</span>{/if}
		<span class="clock">~{formatClock(spokenMs)}</span>
	</span>
	{#if surplus}
		<span class="surplus" title={m.timing_spoken_over_montage()}>+{formatClock(spokenMs - montageMs)}</span>
	{/if}
</span>

<style>
	.duration-pair {
		display: inline-flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 0.35rem 0.5rem;
		font-family: var(--font-mono);
		font-size: 0.85rem;
		color: var(--gold);
	}

	.duration-pair.compact {
		font-size: 0.78rem;
	}

	.label {
		color: var(--muted);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-size: 0.72em;
		margin-right: 0.25rem;
	}

	.clock {
		color: inherit;
	}

	.sep {
		color: var(--muted);
	}

	.surplus {
		color: #e8a87c;
		font-size: 0.85em;
	}
</style>
