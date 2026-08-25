<script lang="ts">
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import AnimaticEditor from '$lib/components/animatic/AnimaticEditor.svelte';
	import { getProject, getScript } from '$lib/data/repositories/index';
	import { getShotImagePath } from '$lib/data/repositories/lookups';
	import type { Scene, Shot } from '$lib/types/script';

	const script = getScript();
	const project = getProject().project;

	const scenes = [...script.scenes].sort((a, b) => a.order - b.order);
	const shotsByScene: Record<string, Shot[]> = {};
	for (const shot of script.shots) {
		(shotsByScene[shot.sceneId] ??= []).push(shot);
	}
	for (const list of Object.values(shotsByScene)) {
		list.sort((a, b) => a.order - b.order);
	}

	const groups = scenes.map((scene: Scene) => {
		const shots = shotsByScene[scene.id] ?? [];
		const imageByShotId: Record<string, string | undefined> = {};
		for (const shot of shots) {
			imageByShotId[shot.id] = getShotImagePath(shot);
		}
		return { scene, shots, imageByShotId };
	});

	const warnings: string[] = [];
	for (const shot of script.shots) {
		if (!getShotImagePath(shot)) {
			warnings.push(`Toma ${shot.id} sin imagen de take seleccionado.`);
		}
	}
	const extraWarnings = warnings.length - 8;
	if (extraWarnings > 0) {
		warnings.length = 8;
		warnings.push(`…y ${extraWarnings} avisos más.`);
	}
</script>

<main class="page">
	<PageHeader
		eyebrow="Animatic"
		title="Desglose de tomas"
		lede="Duraciones editables se guardan en este navegador; el JSON canónico no se modifica."
		meta={[`${script.shots.length} tomas`, `${script.scenes.length} escenas`]}
	/>
	<AnimaticEditor {groups} targetDurationMs={project.targetDurationMs} {warnings} />
</main>

<style>
	.page {
		max-width: 1320px;
		margin: 0 auto;
		padding: 2.5rem 1.5rem 4rem;
	}
</style>
