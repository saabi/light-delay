<script lang="ts">
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import AnimaticEditor from '$lib/components/animatic/AnimaticEditor.svelte';
	import { getScript } from '$lib/data/repositories/index';
	import { getShotImagePath } from '$lib/data/repositories/lookups';
	import { decodeScriptId, encodeScriptId } from '$lib/utils/scriptId';
	import type { Scene, Shot } from '$lib/types/script';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	const scriptId = $derived(decodeScriptId(page.params.scriptId ?? ''));
	const script = $derived(getScript(scriptId));
	const encoded = $derived(encodeScriptId(scriptId));

	const groups = $derived.by(() => {
		const scenes = [...script.scenes].sort((a, b) => a.order - b.order);
		const shotsByScene: Record<string, Shot[]> = {};
		for (const shot of script.shots) {
			(shotsByScene[shot.sceneId] ??= []).push(shot);
		}
		for (const list of Object.values(shotsByScene)) {
			list.sort((a, b) => a.order - b.order);
		}
		return scenes.map((scene: Scene) => {
			const shots = shotsByScene[scene.id] ?? [];
			const imageByShotId: Record<string, string | undefined> = {};
			for (const shot of shots) {
				imageByShotId[shot.id] = getShotImagePath(script, shot);
			}
			return { scene, shots, imageByShotId };
		});
	});

	const warnings = $derived.by(() => {
		const list: string[] = [];
		for (const shot of script.shots) {
			if (!getShotImagePath(script, shot)) {
				list.push(`Toma ${shot.id} sin imagen de take seleccionado.`);
			}
		}
		const extra = list.length - 8;
		if (extra > 0) {
			list.length = 8;
			list.push(`…y ${extra} avisos más.`);
		}
		return list;
	});

	onMount(() => {
		const shotId = page.url.searchParams.get('shot');
		if (!shotId) return;
		requestAnimationFrame(() => {
			const card = document.getElementById(shotId);
			if (!card) return;
			card.scrollIntoView({ block: 'center' });
			card.focus({ preventScroll: true });
		});
	});
</script>

<main class="page">
	<PageHeader
		eyebrow="Animatic"
		title={script.script.title}
		lede="Duraciones editables se guardan en este navegador (por script y versión); el JSON canónico no se modifica."
		meta={[`${script.shots.length} tomas`, `${script.scenes.length} escenas`, script.script.kind]}
	/>
	{#key `${script.script.id}:${script.script.version}`}
		<AnimaticEditor
			{groups}
			scriptId={script.script.id}
			scriptVersion={script.script.version}
			playerHref={`/animatic/${encoded}/player`}
			targetDurationMs={script.script.targetDurationMs}
			{warnings}
		/>
	{/key}
</main>

<style>
	.page {
		max-width: 1320px;
		margin: 0 auto;
		padding: 2.5rem 1.5rem 4rem;
	}
</style>
