<script lang="ts">
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import GenerationMediumTabs from './GenerationMediumTabs.svelte';
	import GenerationPackageList from './GenerationPackageList.svelte';
	import type { GenerationMedium, GenerationPackage } from '$lib/data/selectors/generationPackages';
	import { listScripts } from '$lib/data/repositories/index';
	import { scriptLabel } from '$lib/data/selectors/scriptPresentation';
	import * as m from '$lib/paraglide/messages.js';

	let {
		scriptId,
		medium,
		packages,
		hasPlan
	}: {
		scriptId: string;
		medium: GenerationMedium;
		packages: GenerationPackage[];
		hasPlan: boolean;
	} = $props();

	const title = $derived(
		medium === 'image'
			? m.generation_title_image()
			: medium === 'video'
				? m.generation_title_video()
				: m.generation_title_audio()
	);
	const scriptEntry = $derived(listScripts().find((entry) => entry.id === scriptId));
	const scriptName = $derived(scriptEntry ? scriptLabel(scriptEntry) : scriptId);
</script>

<main class="page">
	<PageHeader
		eyebrow={m.generation_eyebrow()}
		{title}
		lede={m.generation_lede()}
		meta={[scriptName, `${packages.length}`]}
	/>
	<GenerationMediumTabs {scriptId} {medium} />
	{#if !hasPlan}
		<p class="empty">{m.generation_plan_missing()}</p>
	{:else}
		<GenerationPackageList {packages} />
	{/if}
</main>

<style>
	.page {
		max-width: var(--content-max);
		margin: 0 auto;
		padding: 2.5rem var(--page-gutter) 4rem;
	}

	.empty {
		color: var(--muted);
	}
</style>
