<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { tick } from 'svelte';
	import type { GenerationPackage } from '$lib/data/selectors/generationPackages';
	import {
		filterPackages,
		groupPackages,
		packagesForShot,
		summarizePackages
	} from '$lib/data/selectors/generationPackages';
	import { packageDomId } from '$lib/data/selectors/generationPresentation';
	import { getScript } from '$lib/data/repositories/index';
	import GenerationPackageCard from './GenerationPackageCard.svelte';
	import {
		collapseNextLevel,
		expandNextLevel
	} from '$lib/utils/generationExpand';
	import {
		parseGenerationFilter,
		parseGenerationShot,
		type GenerationPackageFilter
	} from '$lib/utils/generationFilter';
	import type { ScriptId } from '$lib/types/ids';
	import { SvelteSet } from 'svelte/reactivity';
	import * as m from '$lib/paraglide/messages.js';

	let { packages, scriptId }: { packages: GenerationPackage[]; scriptId: string } = $props();

	const requestedFilter = $derived(
		parseGenerationFilter(browser ? page.url.searchParams.get('filter') : null)
	);
	const focusShotId = $derived(
		parseGenerationShot(browser ? page.url.searchParams.get('shot') : null)
	);
	const script = $derived(getScript(scriptId as ScriptId));
	const focusPackages = $derived(
		focusShotId ? packagesForShot(packages, focusShotId, script) : []
	);
	const filter = $derived.by(() => {
		if (!focusPackages.length) return requestedFilter;
		if (filterPackages(focusPackages, requestedFilter).length === 0) return 'all';
		return requestedFilter;
	});
	const summary = $derived(summarizePackages(packages));
	const filtered = $derived(filterPackages(packages, filter));
	const groups = $derived(groupPackages(filtered));
	let userExpandedIds = new SvelteSet<string>();
	let userOpenGroupIds = $state<SvelteSet<string> | null>(null);
	const openGroupIds = $derived.by(() => {
		const base = userOpenGroupIds
			? new SvelteSet(
					[...userOpenGroupIds].filter((id) => groups.some((group) => group.id === id))
				)
			: groups[0]
				? new SvelteSet([groups[0].id])
				: new SvelteSet<string>();
		for (const pkg of focusPackages) {
			if (groups.some((group) => group.id === pkg.groupId)) base.add(pkg.groupId);
		}
		return base;
	});
	const expandedIds = $derived.by(() => {
		const next = new SvelteSet(userExpandedIds);
		for (const pkg of focusPackages) next.add(pkg.id);
		return next;
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
		if (userExpandedIds.has(id)) userExpandedIds.delete(id);
		else userExpandedIds.add(id);
	}

	function toggleGroup(id: string) {
		const current = new SvelteSet(openGroupIds);
		if (current.has(id)) current.delete(id);
		else current.add(id);
		userOpenGroupIds = current;
	}

	function applyExpandPatch(patch: { openGroupIds: Set<string>; expandedCardIds: Set<string> }) {
		userOpenGroupIds = new SvelteSet(patch.openGroupIds);
		for (const id of [...userExpandedIds]) {
			if (!patch.expandedCardIds.has(id)) userExpandedIds.delete(id);
		}
		for (const id of patch.expandedCardIds) userExpandedIds.add(id);
	}

	function expandAll() {
		applyExpandPatch(
			expandNextLevel({
				groupIds: groups.map((group) => group.id),
				cardIds: filtered.map((pkg) => pkg.id),
				openGroupIds: new Set(openGroupIds),
				expandedCardIds: new Set(expandedIds)
			})
		);
	}

	function collapseAll() {
		applyExpandPatch(
			collapseNextLevel({
				groupIds: groups.map((group) => group.id),
				cardIds: filtered.map((pkg) => pkg.id),
				openGroupIds: new Set(openGroupIds),
				expandedCardIds: new Set(expandedIds)
			})
		);
	}

	function groupAnchor(id: string) {
		return `generation-group-${id.replace(/[^a-zA-Z0-9_-]+/g, '-')}`;
	}

	let lastFocusKey = '';
	$effect(() => {
		const first = focusPackages[0];
		const key = first && focusShotId ? `${focusShotId}:${first.id}` : '';
		if (!browser || !first || !key || key === lastFocusKey) return;
		lastFocusKey = key;
		const id = packageDomId(first.id);
		void tick().then(() => {
			requestAnimationFrame(() => {
				const el = document.getElementById(id);
				if (!el) return;
				el.scrollIntoView({ block: 'center' });
				if (el instanceof HTMLElement) el.focus({ preventScroll: true });
			});
		});
	});
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
