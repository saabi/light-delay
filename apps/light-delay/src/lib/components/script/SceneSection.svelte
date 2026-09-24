<script lang="ts">
	import type { Beat, Cue, Scene, ScriptFile } from '$lib/types/script';
	import BeatBlock from './BeatBlock.svelte';
	import DurationPair from '$lib/components/timing/DurationPair.svelte';
	import {
		estimateSceneSpokenMs,
		montageSceneMs
	} from '$lib/data/selectors/dialogueTiming';
	import type { LanguageTag } from '$lib/types/i18n';
	import * as m from '$lib/paraglide/messages.js';

	let {
		scene,
		beats,
		cuesByBeatId,
		script,
		dialogueLanguage
	}: {
		scene: Scene;
		beats: Beat[];
		cuesByBeatId: Record<string, Cue[]>;
		script: ScriptFile;
		dialogueLanguage: LanguageTag;
	} = $props();

	const sceneMontageMs = $derived(montageSceneMs(script, scene.id));
	const sceneSpokenMs = $derived(estimateSceneSpokenMs(script, scene.id, dialogueLanguage));
</script>

<section class="scene" id={scene.id}>
	<header>
		<p class="num">{m.script_scene()} {scene.number}</p>
		<h3>{scene.title}</h3>
		{#if scene.summary}
			<p class="summary">{scene.summary}</p>
		{/if}
		<p class="timing">
			<DurationPair montageMs={sceneMontageMs} spokenMs={sceneSpokenMs} compact />
		</p>
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

	.timing {
		margin: 0.5rem 0 0;
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
