<script lang="ts">
	import type { Act, Beat, Cue, Scene } from '$lib/types/script';
	import SceneSection from './SceneSection.svelte';

	let {
		acts,
		scenesById,
		beatsBySceneId,
		cuesByBeatId
	}: {
		acts: Act[];
		scenesById: Record<string, Scene>;
		beatsBySceneId: Record<string, Beat[]>;
		cuesByBeatId: Record<string, Cue[]>;
	} = $props();
</script>

<div class="script-viewer">
	{#each acts as act (act.id)}
		<section class="act">
			<header>
				<p class="eyebrow">Acto {act.number}</p>
				<h2>{act.title ?? `Acto ${act.number}`}</h2>
				{#if act.dramaticPurpose}
					<p>{act.dramaticPurpose}</p>
				{/if}
			</header>
			{#each act.sceneIds as sceneId (sceneId)}
				{@const scene = scenesById[sceneId]}
				{#if scene}
					<SceneSection {scene} beats={beatsBySceneId[scene.id] ?? []} {cuesByBeatId} />
				{/if}
			{/each}
		</section>
	{/each}
</div>

<style>
	.script-viewer {
		max-width: var(--max);
	}

	.act {
		margin-bottom: 3rem;
	}

	.eyebrow {
		margin: 0 0 0.35rem;
		color: var(--gold);
		font: 800 0.72rem var(--font-mono);
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	h2 {
		margin: 0 0 0.5rem;
		font: 700 1.85rem/1.1 var(--font-serif);
	}

	.act > header p:last-child {
		margin: 0;
		color: var(--muted);
	}
</style>
