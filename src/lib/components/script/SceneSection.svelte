<script lang="ts">
	import type { Beat, Cue, Scene } from '$lib/types/script';
	import BeatBlock from './BeatBlock.svelte';
	import * as m from '$lib/paraglide/messages.js';

	let {
		scene,
		beats,
		cuesByBeatId
	}: {
		scene: Scene;
		beats: Beat[];
		cuesByBeatId: Record<string, Cue[]>;
	} = $props();
</script>

<section class="scene" id={scene.id}>
	<header>
		<p class="num">{m.script_scene()} {scene.number}</p>
		<h3>{scene.title}</h3>
		{#if scene.summary}
			<p class="summary">{scene.summary}</p>
		{/if}
	</header>
	{#each beats as beat (beat.id)}
		<BeatBlock {beat} cues={cuesByBeatId[beat.id] ?? []} />
	{/each}
</section>

<style>
	.scene {
		margin: 2.5rem 0;
		scroll-margin-top: calc(var(--site-top-offset) + 1rem);
	}

	.num {
		margin: 0 0 0.35rem;
		color: var(--cyan);
		font: 800 0.72rem var(--font-mono);
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	h3 {
		margin: 0 0 0.5rem;
		font: 700 1.35rem/1.25 var(--font-serif);
	}

	.summary {
		margin: 0;
		color: var(--muted);
	}

	@media (max-width: 480px) {
		.scene {
			margin: 2rem 0;
		}

		h3 {
			overflow-wrap: anywhere;
		}
	}
</style>
