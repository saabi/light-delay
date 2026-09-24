<script lang="ts">
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import StudioApp from '$lib/components/studio/StudioApp.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { studioUnavailable } from '$lib/studio/gating';

	const blocked = !import.meta.env.DEV || studioUnavailable();
</script>

{#if blocked}
	<main class="page">
		<PageHeader title={m.studio_unavailable_title()} lede={m.studio_unavailable_body()} />
	</main>
{:else}
	<StudioApp />
{/if}

<style>
	.page {
		max-width: var(--content-max);
		margin: 0 auto;
		padding: 2.5rem var(--page-gutter) 4rem;
	}
</style>
