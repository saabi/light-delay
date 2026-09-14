<script lang="ts">
	import type { GenerationPackage } from '$lib/data/selectors/generationPackages';
	import {
		packageHasOutput,
		packageRefsComplete,
		summarizePackages
	} from '$lib/data/selectors/generationPackages';
	import GenerationPackageCard from './GenerationPackageCard.svelte';
	import * as m from '$lib/paraglide/messages.js';

	let { packages }: { packages: GenerationPackage[] } = $props();

	type Filter = 'all' | 'prompt_ready' | 'refs_complete' | 'has_output' | 'blocked';
	let filter = $state<Filter>('all');

	const summary = $derived(summarizePackages(packages));
	const filtered = $derived.by(() => {
		switch (filter) {
			case 'prompt_ready':
				return packages.filter((p) => p.promptReady);
			case 'refs_complete':
				return packages.filter((p) => packageRefsComplete(p));
			case 'has_output':
				return packages.filter((p) => packageHasOutput(p));
			case 'blocked':
				return packages.filter((p) => p.blockers.length > 0);
			default:
				return packages;
		}
	});
	const filterOptions = $derived([
		{ id: 'all' as const, label: m.generation_filter_all() },
		{ id: 'prompt_ready' as const, label: m.generation_filter_prompt_ready() },
		{ id: 'refs_complete' as const, label: m.generation_filter_refs() },
		{ id: 'has_output' as const, label: m.generation_filter_output() },
		{ id: 'blocked' as const, label: m.generation_filter_blocked() }
	]);
</script>

<div class="summary" role="status">
	<span>{m.generation_count_total({ n: summary.total })}</span>
	<span>{m.generation_count_prompt_ready({ n: summary.promptReady })}</span>
	<span>{m.generation_count_refs({ n: summary.refsComplete })}</span>
	<span>{m.generation_count_output({ n: summary.hasOutput })}</span>
	<span>{m.generation_count_blocked({ n: summary.blocked })}</span>
</div>

<div class="filters" role="group" aria-label={m.generation_filters()}>
	{#each filterOptions as opt (opt.id)}
		<button type="button" class:active={filter === opt.id} onclick={() => (filter = opt.id)}>
			{opt.label}
		</button>
	{/each}
</div>

{#if !filtered.length}
	<p class="empty">{m.generation_empty_filter()}</p>
{:else}
	<div class="list">
		{#each filtered as pkg (pkg.id)}
			<GenerationPackageCard {pkg} />
		{/each}
	</div>
{/if}

<style>
	.summary {
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem 1rem;
		margin-bottom: 0.85rem;
		color: var(--muted);
		font-size: 0.88rem;
	}

	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-bottom: 1.25rem;
	}

	.filters button {
		padding: 0.35rem 0.7rem;
		border: 1px solid var(--line);
		border-radius: 999px;
		background: transparent;
		color: var(--muted);
		cursor: pointer;
		font-size: 0.82rem;
	}

	.filters button.active {
		color: var(--ink);
		border-color: var(--cyan);
		background: color-mix(in srgb, var(--cyan) 16%, transparent);
	}

	.list {
		display: grid;
		gap: 0.85rem;
	}

	.empty {
		color: var(--muted);
	}
</style>
