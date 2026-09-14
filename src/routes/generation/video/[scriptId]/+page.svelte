<script lang="ts">
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import GenerationMediumTabs from '$lib/components/generation/GenerationMediumTabs.svelte';
	import GenerationPackageList from '$lib/components/generation/GenerationPackageList.svelte';
	import * as m from '$lib/paraglide/messages.js';

	let { data } = $props();
</script>

<main class="page">
	<PageHeader
		eyebrow={m.generation_eyebrow()}
		title={m.generation_title_video()}
		lede={m.generation_lede()}
		meta={[data.scriptId, `${data.packages.length}`]}
	/>
	<GenerationMediumTabs scriptId={data.scriptId} medium="video" />
	<GenerationPackageList packages={data.packages} />
</main>

<style>
	.page {
		max-width: var(--content-max);
		margin: 0 auto;
		padding: 2.5rem var(--page-gutter) 4rem;
	}
</style>
