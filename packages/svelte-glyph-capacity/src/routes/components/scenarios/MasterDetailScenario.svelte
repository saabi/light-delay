<script lang="ts">
	import { Archive, CalendarDays, List, PanelRight, Star, UserRound } from '@lucide/svelte';
	import AdaptiveRegion from '../AdaptiveRegion.svelte';
	import type { MasterDetailState, Profile, StageLayout, StageUnit } from '../../types';

	let {
		layout,
		onChange,
		profile,
		state,
		strategy
	}: {
		layout: StageLayout;
		onChange: (next: MasterDetailState) => void;
		profile: Profile;
		state: MasterDetailState;
		strategy: StageUnit;
	} = $props();

	const records = [
		{
			id: 'atlas',
			title: 'Atlas migration',
			owner: 'Mina Park',
			status: 'In review',
			date: 'Aug 14',
			summary: 'Move the shared catalog onto a versioned schema without interrupting publishing.'
		},
		{
			id: 'compass',
			title: 'Compass audit',
			owner: 'Leo Silva',
			status: 'Active',
			date: 'Aug 18',
			summary: 'Review navigation and information scent across the operational workspace.'
		},
		{
			id: 'harbor',
			title: 'Harbor launch',
			owner: 'Noa Chen',
			status: 'Planned',
			date: 'Sep 02',
			summary: 'Coordinate release readiness, documentation, and customer communication.'
		}
	] as const;

	const selected = $derived(records.find((record) => record.id === state.selectedId) ?? records[0]);
	const isTabbed = $derived(layout !== 'desktop');

	function patch(next: Partial<MasterDetailState>) {
		onChange({ ...state, ...next });
	}

	function selectRecord(id: MasterDetailState['selectedId']) {
		patch({ selectedId: id, activePane: isTabbed ? 'detail' : state.activePane });
	}
</script>

<div class={`master-detail layout-${layout}`} data-scenario="master-detail">
	<aside
		id={`${strategy}-master-panel`}
		class:hidden-pane={isTabbed && state.activePane !== 'master'}
		aria-label="Project list"
	>
		<header>
			<p>Workspace</p>
			<h2>Projects</h2>
		</header>
		<div class="record-list">
			{#each records as record}
				<button
					class:selected={state.selectedId === record.id}
					onclick={() => selectRecord(record.id)}
				>
					<span><strong>{record.title}</strong><small>{record.owner}</small></span><span
						class="status">{record.status}</span
					>
				</button>
			{/each}
		</div>
	</aside>

	<article
		id={`${strategy}-detail-panel`}
		class:hidden-pane={isTabbed && state.activePane !== 'detail'}
		aria-live="polite"
	>
		<header class="detail-header">
			<div>
				<p>{selected.status}</p>
				<h2>{selected.title}</h2>
			</div>
			<button
				aria-label={state.starred ? 'Remove star' : 'Add star'}
				aria-pressed={state.starred}
				onclick={() => patch({ starred: !state.starred })}
				><Star size="1.125rem" fill={state.starred ? 'currentColor' : 'none'} /></button
			>
		</header>
		<div class="detail-body">
			<p class="summary">{selected.summary}</p>
			<dl>
				<div>
					<dt><UserRound size="0.9375rem" />Owner</dt>
					<dd>{selected.owner}</dd>
				</div>
				<div>
					<dt><CalendarDays size="0.9375rem" />Due</dt>
					<dd>{selected.date}</dd>
				</div>
				<div>
					<dt><Archive size="0.9375rem" />Status</dt>
					<dd>{selected.status}</dd>
				</div>
			</dl>
			<div class="detail-tools-slot">
				<AdaptiveRegion {strategy} {profile} policy="detail-tools" class="detail-tools-region">
					{#snippet children(mode)}
						<div class={`detail-tools mode-${mode}`} data-adaptive-mode={mode}>
							{#if mode === 'full'}<button>Assign owner</button><button>Change status</button
								><button class="primary">Open project</button>
							{:else if mode === 'reduced'}<button>Assign</button><button>Status</button><button
									class="primary">Open</button
								>
							{:else}<button class="primary">Open</button><button aria-label="More project actions"
									>•••</button
								>{/if}
						</div>
					{/snippet}
				</AdaptiveRegion>
			</div>
			<section class="activity">
				<h3>Recent activity</h3>
				<p>Review notes were consolidated and the delivery checklist was updated.</p>
			</section>
		</div>
	</article>

	{#if isTabbed}
		<div class="bottom-tabs" role="tablist" aria-label="Master detail panels" tabindex="-1">
			<button
				role="tab"
				aria-selected={state.activePane === 'master'}
				aria-controls={`${strategy}-master-panel`}
				onclick={() => patch({ activePane: 'master' })}><List size="1.1875rem" />Master</button
			>
			<button
				role="tab"
				aria-selected={state.activePane === 'detail'}
				aria-controls={`${strategy}-detail-panel`}
				onclick={() => patch({ activePane: 'detail' })}
				><PanelRight size="1.1875rem" />Detail</button
			>
		</div>
	{/if}
</div>

<style>
	.master-detail {
		position: absolute;
		inset: 0;
		display: grid;
		grid-template-columns: minmax(11.875rem, 34%) minmax(0, 1fr);
		min-height: 0;
		background: #edf1f4;
		color: #17202a;
	}
	aside,
	article {
		min-width: 0;
		min-height: 0;
		overflow: auto;
	}
	aside {
		border-right: 1px solid #bbc4cc;
		background: #f8fafb;
	}
	aside > header,
	.detail-header {
		padding: 1rem;
		border-bottom: 1px solid #d1d8de;
	}
	header p {
		margin: 0 0 0.1875rem;
		color: #5c6873;
		font-size: 0.6875em;
		text-transform: uppercase;
	}
	h2 {
		margin: 0;
		font-size: 1.125em;
	}
	.record-list {
		display: grid;
		padding: 0.5rem;
		gap: 0.3125rem;
	}
	.record-list button {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		width: 100%;
		min-height: 3.625rem;
		padding: 0.5625rem;
		border: 1px solid transparent;
		border-radius: 0.3125rem;
		background: transparent;
		color: inherit;
		text-align: left;
		cursor: pointer;
	}
	.record-list button.selected {
		border-color: #24756c;
		background: #e2f0ed;
	}
	.record-list button span:first-child {
		display: grid;
		gap: 0.1875rem;
		min-width: 0;
	}
	.record-list strong,
	.record-list small {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.record-list small,
	.status {
		color: #65717d;
		font-size: 0.6875em;
	}
	.detail-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		background: #fff;
	}
	.detail-header button {
		width: 2.75rem;
		height: 2.75rem;
		border: 1px solid #9aa6b1;
		border-radius: 0.25rem;
		background: #fff;
		color: #7c4f00;
	}
	.detail-body {
		padding: 1.125rem;
	}
	.summary {
		max-width: 58ch;
		margin: 0 0 1.125rem;
		line-height: 1.45;
	}
	dl {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.5rem;
		margin: 0 0 1.125rem;
	}
	dl div {
		padding: 0.625rem;
		border: 1px solid #c7cfd6;
		border-radius: 0.25rem;
		background: #fff;
	}
	dt {
		display: flex;
		align-items: center;
		gap: 0.3125rem;
		color: #66727d;
		font-size: 0.6875em;
	}
	dd {
		margin: 0.3125rem 0 0;
		font-weight: 700;
	}
	.detail-tools-slot {
		width: 100%;
		height: 5.125rem;
	}
	.detail-tools-slot :global(.adaptive-region) {
		width: 100%;
		height: 100%;
	}
	.detail-tools {
		height: 100%;
		display: flex;
		flex-wrap: nowrap;
		align-items: center;
		justify-content: flex-end;
		gap: 0.4375rem;
		padding: 0.5rem;
		box-sizing: border-box;
		overflow: auto;
		border-block: 1px solid #c7cfd6;
	}
	.detail-tools button {
		min-height: 2.375rem;
		padding: 0.375rem 0.6875rem;
		border: 1px solid #7f8d99;
		border-radius: 0.25rem;
		background: #fff;
	}
	.detail-tools.mode-minimal button {
		min-width: 2.75rem;
		min-height: 2.75rem;
	}
	.detail-tools .primary {
		border-color: #075e54;
		background: #075e54;
		color: #fff;
	}
	.activity h3 {
		margin: 1.125rem 0 0.3125rem;
		font-size: 0.875em;
	}
	.activity p {
		margin: 0;
		line-height: 1.45;
	}
	.master-detail:not(.layout-desktop) {
		display: block;
		padding-bottom: 3.625rem;
	}
	.master-detail:not(.layout-desktop) aside,
	.master-detail:not(.layout-desktop) article {
		height: 100%;
		border: 0;
	}
	.hidden-pane {
		display: none;
	}
	.bottom-tabs {
		position: absolute;
		z-index: 10;
		inset: auto 0 0;
		display: grid;
		grid-template-columns: 1fr 1fr;
		min-height: 3.625rem;
		border-top: 1px solid #8996a2;
		background: #fff;
	}
	.bottom-tabs button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4375rem;
		min-height: 3.25rem;
		border: 0;
		background: #fff;
		color: #32404c;
	}
	.bottom-tabs button[aria-selected='true'] {
		background: #dcebe8;
		color: #075e54;
		font-weight: 700;
	}
	button:focus-visible {
		outline: 0.1875rem solid #0b6bcb;
		outline-offset: -0.1875rem;
	}
	@container adaptive-region (max-width: 26.875rem) {
		dl {
			grid-template-columns: 1fr;
		}
	}
</style>
