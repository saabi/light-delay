<script lang="ts">
	import AppShell from '$lib/components/app/AppShell.svelte';
	import ProjectNav from '$lib/components/app/ProjectNav.svelte';
	import SeoHead from '$lib/components/app/SeoHead.svelte';
	import { page } from '$app/state';
	import { canonicalPathname, withBase } from '$lib/utils/paths';
	import '../app.css';

	let { children } = $props();

	const path = $derived(canonicalPathname(page.url));
	const isPlayer = $derived(/\/animatic\/.+\/player\/?$/.test(path));
	const isLanding = $derived(path === '/');
</script>

<SeoHead />
<svelte:head>
	<link rel="icon" href={withBase('/favicon.svg')} type="image/svg+xml" />
	<link rel="icon" href={withBase('/favicon-32x32.png')} sizes="32x32" type="image/png" />
	<link rel="apple-touch-icon" href={withBase('/apple-touch-icon.png')} />
	<link rel="manifest" href={withBase('/site.webmanifest')} />
</svelte:head>

{#if isPlayer || isLanding}
	{@render children()}
{:else}
	<AppShell>
		{#snippet navigation()}
			<ProjectNav />
		{/snippet}
		{@render children()}
	</AppShell>
{/if}
