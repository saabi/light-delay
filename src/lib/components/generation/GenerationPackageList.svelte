<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { GenerationPackage } from '$lib/data/selectors/generationPackages';
	import {
		filterPackages,
		groupPackages,
		summarizePackages
	} from '$lib/data/selectors/generationPackages';
	import GenerationPackageCard from './GenerationPackageCard.svelte';
	import {
		collapseNextLevel,
		expandNextLevel
	} from '$lib/utils/generationExpand';
	import {
		parseGenerationFilter,
		type GenerationPackageFilter
	} from '$lib/utils/generationFilter';
	import { SvelteSet } from 'svelte/reactivity';
	import * as m from '$lib/paraglide/messages.js';

	let { packages }: { packages: GenerationPackage[] } = $props();

	const filter = $derived(parseGenerationFilter(page.url.searchParams.get('filter')));
	const summary = $derived(summarizePackages(packages));
	const filtered = $derived(filterPackages(packages, filter));
	const groups = $derived(groupPackages(filtered));
	let expandedIds = new SvelteSet<string>();
	let userOpenGroupIds = $state<SvelteSet<string> | null>(null);
	const openGroupIds = $derived.by(() => {
		if (userOpenGroupIds) {
			return new SvelteSet(
				[...userOpenGroupIds].filter((id) => groups.some((group) => group.id === id))
			);
		}
		return groups[0] ? new SvelteSet([groups[0].id]) : new SvelteSet<string>();
	});

	const filterOptions = $derived([
		{ id: 'all' as const, label: m.generation_filter_all() },
		{ id: 'prompt_ready' as const, label: m.generation_filter_prompt_ready() },
		{ id: 'refs_complete' as const, label: m.generation_filter_refs() },
		{ id: 'refs_ready' as const, label: m.generation_filter_refs_ready() },
		{ id: 'has_output' as const, label: m.generation_filter_output() },
		{ id: 'blocked' as const, label: m.generation_filter_blocked() }
	]);

	function setFilter(next: GenerationPackageFilter) {
		const url = new URL(page.url);
		if (next === 'all') url.searchParams.delete('filter');
		else url.searchParams.set('filter', next);
		void goto(resolve(`${url.pathname}${url.search}${url.hash}` as '/'), {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}

	function toggleCard(id: string) {
		if (expandedIds.has(id)) expandedIds.delete(id);
		else expandedIds.add(id);
	}

	function toggleGroup(id: string) {
		const current = new SvelteSet(openGroupIds);
		if (current.has(id)) current.delete(id);
		else current.add(id);
		userOpenGroupIds = current;
	}

	function applyExpandPatch(patch: { openGroupIds: Set<string>; expandedCardIds: Set<string> }) {
		userOpenGroupIds = new SvelteSet(patch.openGroupIds);
		for (const id of [...expandedIds]) {
			if (!patch.expandedCardIds.has(id)) expandedIds.delete(id);
		}
		for (const id of patch.expandedCardIds) expandedIds.add(id);
	}

	function expandAll() {
		applyExpandPatch(
			expandNextLevel({
				groupIds: groups.map((group) => group.id),
				cardIds: filtered.map((pkg) => pkg.id),
				openGroupIds,
				expandedCardIds: expandedIds
			})
		);
	}

	function collapseAll() {
		applyExpandPatch(
			collapseNextLevel({
				groupIds: groups.map((group) => group.id),
				cardIds: filtered.map((pkg) => pkg.id),
				openGroupIds,
				expandedCardIds: expandedIds
			})
		);
	}

	function groupAnchor(id: string) {
		return `generation-group-${id.replace(/[^a-zA-Z0-9_-]+/g, '-')}`;
	}
</script>

<div class="summary" role="status">
	<span>{m.generation_count_total({ n: summary.total })}</span>
	<span>{m.generation_count_prompt_ready({ n: summary.promptReady })}</span>
	<span>{m.generation_count_refs({ n: summary.refsPresent })}</span>
	<span>{m.generation_count_refs_ready({ n: summary.refsReady })}</span>
	<span>{m.generation_count_runnable({ n: summary.canGenerate })}</span>
	<span>{m.generation_count_output({ n: summary.hasOutput })}</span>
	<span>{m.generation_count_output_current({ n: summary.outputCurrent })}</span>
	<span>{m.generation_count_output_review({ n: summary.outputNeedsReview })}</span>
	<span>{m.generation_count_output_regen({ n: summary.outputNeedsRegeneration })}</span>
	<span>{m.generation_count_blocked({ n: summary.blocked })}</span>
</div>

<div class="filters" role="group" aria-label={m.generation_filters()}>
	{#each filterOptions as opt (opt.id)}
		<button type="button" class:active={filter === opt.id} onclick={() => setFilter(opt.id)}>
			{opt.label}
		</button>
	{/each}
</div>

{#if !packages.length}
	<p class="empty">{m.generation_empty_packages()}</p>
{:else if !filtered.length}
	<p class="empty">{m.generation_empty_filter()}</p>
{:else}
	<div class="toolbar">
		<button
			type="button"
			title={m.generation_expand_all_hint()}
			data-generation-expand-all
			onclick={expandAll}>{m.generation_expand_all()}</button
		>
		<button
			type="button"
			title={m.generation_collapse_all_hint()}
			data-generation-collapse-all
			onclick={collapseAll}>{m.generation_collapse_all()}</button
		>
	</div>
	{#if groups.length > 1}
		<nav class="jump" aria-label={m.generation_jump_to_group()}>
			{#each groups as group (group.id)}
				<a href={`#${groupAnchor(group.id)}`}>{group.label}</a>
			{/each}
		</nav>
	{/if}
	<div class="list">
		{#each groups as group (group.id)}
			<section class="group" id={groupAnchor(group.id)}>
				<button
					type="button"
					class="group-head"
					data-generation-group
					aria-expanded={openGroupIds.has(group.id)}
					aria-controls={`${groupAnchor(group.id)}-body`}
					onclick={() => toggleGroup(group.id)}
				>
					{group.label}
					<span class="count">{group.packages.length}</span>
				</button>
				{#if openGroupIds.has(group.id)}
					<div class="group-body" id={`${groupAnchor(group.id)}-body`}>
						{#each group.packages as pkg (pkg.id)}
							<GenerationPackageCard
								{pkg}
								expanded={expandedIds.has(pkg.id)}
								ontoggle={() => toggleCard(pkg.id)}
							/>
						{/each}
					</div>
				{/if}
			</section>
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

	.filters,
	.toolbar,
	.jump {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-bottom: 1rem;
	}

	.filters button,
	.toolbar button,
	.jump a {
		padding: 0.35rem 0.7rem;
		border: 1px solid var(--line);
		border-radius: 999px;
		background: transparent;
		color: var(--muted);
		cursor: pointer;
		font-size: 0.82rem;
		text-decoration: none;
	}

	.filters button.active {
		color: var(--ink);
		border-color: var(--cyan);
		background: color-mix(in srgb, var(--cyan) 16%, transparent);
	}

	.list {
		display: grid;
		gap: 1rem;
	}

	.group {
		display: grid;
		gap: 0.65rem;
	}

	.group-head {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.55rem 0.15rem;
		border: 0;
		border-bottom: 1px solid var(--line);
		background: transparent;
		color: inherit;
		text-align: left;
		cursor: pointer;
		font-size: 0.95rem;
	}

	.count {
		color: var(--muted);
		font-size: 0.8rem;
	}

	.group-body {
		display: grid;
		gap: 0.85rem;
	}

	.empty {
		color: var(--muted);
	}
</style>
