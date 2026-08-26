<script lang="ts">
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import LanguageControls from '$lib/components/controls/LanguageControls.svelte';
	import ScriptViewer from '$lib/components/script/ScriptViewer.svelte';
	import { getScript } from '$lib/data/repositories/index';
	import { decodeScriptId } from '$lib/utils/scriptId';
	import type { Beat, Cue, Scene } from '$lib/types/script';
	import { page } from '$app/state';

	const scriptId = $derived(decodeScriptId(page.params.scriptId ?? ''));
	const script = $derived(getScript(scriptId));

	const scenesById = $derived(
		Object.fromEntries(script.scenes.map((s) => [s.id, s])) as Record<string, Scene>
	);

	const beatsBySceneId = $derived.by(() => {
		const map: Record<string, Beat[]> = {};
		for (const beat of script.beats) {
			(map[beat.sceneId] ??= []).push(beat);
		}
		for (const list of Object.values(map)) {
			list.sort((a, b) => a.order - b.order);
		}
		return map;
	});

	const cuesByBeatId = $derived.by(() => {
		const map: Record<string, Cue[]> = {};
		for (const cue of script.cues) {
			(map[cue.beatId] ??= []).push(cue);
		}
		for (const list of Object.values(map)) {
			list.sort((a, b) => a.order - b.order);
		}
		return map;
	});
</script>

<main class="page">
	<div class="head-row">
		<PageHeader
			eyebrow={script.script.kind === 'festival_cut' ? 'Festival Cut' : 'Guion'}
			title={script.script.title}
			lede="Renderizado desde datos estructurados. El diálogo en español es la fuente de verdad."
			meta={[
				`v${script.script.version}`,
				`${script.scenes.length} escenas`,
				script.script.status,
				script.script.kind
			]}
		/>
		<LanguageControls />
	</div>
	<ScriptViewer
		acts={script.acts}
		{scenesById}
		{beatsBySceneId}
		{cuesByBeatId}
		characterFunctionAssignments={script.script.characterFunctionAssignments}
	/>
</main>

<style>
	.page {
		max-width: var(--content-max);
		margin: 0 auto;
		padding: 2.5rem var(--page-gutter) 4rem;
	}

	.head-row {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 1.25rem;
		align-items: start;
		margin-bottom: 0.5rem;
	}

	@media (max-width: 560px) {
		.head-row > :global(*) {
			width: 100%;
		}
	}
</style>
