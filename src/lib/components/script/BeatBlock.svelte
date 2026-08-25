<script lang="ts">
	import type { Beat, Cue } from '$lib/types/script';
	import CueRenderer from './CueRenderer.svelte';

	let { beat, cues }: { beat: Beat; cues: Cue[] } = $props();
</script>

<section class="beat">
	{#if beat.title}
		<h4>{beat.title}</h4>
	{/if}
	<p class="purpose">{beat.purpose}</p>
	{#each cues as cue (cue.id)}
		<CueRenderer {cue} />
	{/each}
</section>

<style>
	.beat {
		margin: 1.5rem 0;
		padding: 1rem 1.15rem;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--panel);
	}

	h4 {
		margin: 0 0 0.35rem;
		color: var(--cyan);
		font-size: 0.95rem;
	}

	.purpose {
		margin: 0 0 0.75rem;
		color: var(--muted);
		font-size: 0.88rem;
	}
</style>
