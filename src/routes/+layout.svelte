<script lang="ts">
	import AppShell from '$lib/components/app/AppShell.svelte';
	import ProjectNav from '$lib/components/app/ProjectNav.svelte';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import '../app.css';

	let { children } = $props();

	const isPlayer = $derived(/\/animatic\/.+\/player\/?$/.test(page.url.pathname));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Light Delay / Luz Tardía</title>
</svelte:head>

{#if isPlayer}
	{@render children()}
{:else}
	<AppShell>
		{#snippet rail()}
			<ProjectNav />
		{/snippet}
		{@render children()}
	</AppShell>
{/if}
