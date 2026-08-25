<script lang="ts">
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import LanguageControls from '$lib/components/controls/LanguageControls.svelte';
	import ScriptViewer from '$lib/components/script/ScriptViewer.svelte';
	import { getScript } from '$lib/data/repositories/index';
	import type { Beat, Cue, Scene } from '$lib/types/script';

	const script = getScript();

	const scenesById = Object.fromEntries(script.scenes.map((s) => [s.id, s])) as Record<
		string,
		Scene
	>;

	const beatsBySceneId: Record<string, Beat[]> = {};
	for (const beat of script.beats) {
		(beatsBySceneId[beat.sceneId] ??= []).push(beat);
	}
	for (const list of Object.values(beatsBySceneId)) {
		list.sort((a, b) => a.order - b.order);
	}

	const cuesByBeatId: Record<string, Cue[]> = {};
	for (const cue of script.cues) {
		(cuesByBeatId[cue.beatId] ??= []).push(cue);
	}
	for (const list of Object.values(cuesByBeatId)) {
		list.sort((a, b) => a.order - b.order);
	}
</script>

<main class="page">
	<div class="head-row">
		<PageHeader
			eyebrow="Guion canónico"
			title={script.script.title}
			lede="Renderizado desde data/script.json. El diálogo en español es la fuente de verdad."
			meta={[`v${script.script.version}`, `${script.scenes.length} escenas`, script.script.status]}
		/>
		<LanguageControls />
	</div>
	<ScriptViewer acts={script.acts} {scenesById} {beatsBySceneId} {cuesByBeatId} />
</main>

<style>
	.page {
		max-width: var(--content-max);
		margin: 0 auto;
		padding: 2.5rem 1.75rem 4rem;
	}

	.head-row {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 1.25rem;
		align-items: start;
		margin-bottom: 0.5rem;
	}
</style>
