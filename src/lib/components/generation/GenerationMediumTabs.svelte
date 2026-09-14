<script lang="ts">
	import { page } from '$app/state';
	import { withLocale } from '$lib/utils/paths';
	import { encodeScriptId } from '$lib/utils/scriptId';
	import { generationSearchFromUrl } from '$lib/utils/generationFilter';
	import type { GenerationMedium } from '$lib/data/selectors/generationPackages';
	import * as m from '$lib/paraglide/messages.js';

	let {
		scriptId,
		medium
	}: {
		scriptId: string;
		medium: GenerationMedium;
	} = $props();

	const encoded = $derived(encodeScriptId(scriptId));
	const search = $derived(generationSearchFromUrl(page.url.search));
	const tabs = $derived([
		{
			id: 'image' as const,
			href: `${withLocale(`/generation/image/${encoded}`)}${search}`,
			label: m.generation_tab_image()
		},
		{
			id: 'video' as const,
			href: `${withLocale(`/generation/video/${encoded}`)}${search}`,
			label: m.generation_tab_video()
		},
		{
			id: 'audio' as const,
			href: `${withLocale(`/generation/audio/${encoded}`)}${search}`,
			label: m.generation_tab_audio()
		}
	]);
</script>

<nav class="tabs" aria-label={m.generation_tabs_label()}>
	{#each tabs as tab (tab.id)}
		<a href={tab.href} class:active={tab.id === medium} aria-current={tab.id === medium ? 'page' : undefined}
			>{tab.label}</a
		>
	{/each}
</nav>

<style>
	.tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 0 0 1.5rem;
	}

	.tabs a {
		padding: 0.45rem 0.85rem;
		border: 1px solid var(--line);
		border-radius: 999px;
		text-decoration: none;
		color: var(--muted);
		font-size: 0.9rem;
	}

	.tabs a.active {
		color: var(--ink);
		border-color: var(--cyan);
		background: color-mix(in srgb, var(--cyan) 18%, transparent);
	}
</style>
