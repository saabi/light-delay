<script lang="ts">
	import { Bell, ChevronDown, ChevronUp, CircleCheck, Clock3, Users } from '@lucide/svelte';
	import AdaptiveRegion from '../AdaptiveRegion.svelte';
	import type { CollectionState, Profile, StageLayout, StageUnit } from '../../types';

	let {
		layout,
		onChange,
		profile,
		state,
		strategy
	}: {
		layout: StageLayout;
		onChange: (next: CollectionState) => void;
		profile: Profile;
		state: CollectionState;
		strategy: StageUnit;
	} = $props();

	const items = [
		{
			id: 'signal',
			title: 'Signal review',
			meta: '6 contributors',
			status: 'On track',
			detail: 'Cross-team review of service boundaries and event ownership.'
		},
		{
			id: 'ledger',
			title: 'Ledger cleanup',
			meta: 'Due Friday',
			status: 'Needs input',
			detail: 'Resolve duplicated account mappings before the next import.'
		},
		{
			id: 'access',
			title: 'Access audit',
			meta: '18 checks',
			status: 'Complete',
			detail: 'Quarterly role and permission review completed with no blockers.'
		},
		{
			id: 'release',
			title: 'Release notes',
			meta: '3 editors',
			status: 'Draft',
			detail: 'Prepare concise release notes for the customer-facing update.'
		}
	];

	function toggle(key: 'expanded' | 'following', id: string) {
		const values = state[key];
		onChange({
			...state,
			[key]: values.includes(id) ? values.filter((value) => value !== id) : [...values, id]
		});
	}
</script>

<div class={`collection layout-${layout}`} data-scenario="collection">
	<header>
		<div>
			<p>Local adaptation</p>
			<h2>Work streams</h2>
		</div>
		<span>{items.length} active</span>
	</header>
	<div class="collection-grid">
		{#each items as item, index}
			<AdaptiveRegion
				{strategy}
				{profile}
				policy="collection-item"
				class={`collection-region item-${index + 1}`}
			>
				{#snippet children(mode)}
					<article
						class={`collection-item mode-${mode}`}
						data-item={item.id}
						data-adaptive-mode={mode}
					>
						<div class="item-main">
							<div class="item-title">
								<span class="status-mark"><CircleCheck size="1.125rem" /></span>
								<div>
									<h3>{item.title}</h3>
									{#if mode !== 'minimal'}<p>{item.detail}</p>{/if}
								</div>
							</div>
							<span class="status">{item.status}</span>
						</div>
						{#if mode === 'full' || (mode === 'reduced' && state.expanded.includes(item.id))}<div
								class="item-meta"
							>
								<span><Users size="0.9375rem" />{item.meta}</span><span
									><Clock3 size="0.9375rem" />Updated today</span
								>
							</div>{/if}
						<div class="item-actions">
							<button
								aria-label={state.following.includes(item.id)
									? `Stop following ${item.title}`
									: `Follow ${item.title}`}
								aria-pressed={state.following.includes(item.id)}
								onclick={() => toggle('following', item.id)}
								><Bell size="1rem" />{#if mode === 'full'}{state.following.includes(item.id)
										? 'Following'
										: 'Follow'}{/if}</button
							>{#if mode !== 'minimal'}<button onclick={() => toggle('expanded', item.id)}
									>{#if state.expanded.includes(item.id)}<ChevronUp
											size="1rem"
										/>{:else}<ChevronDown size="1rem" />{/if}<span
										>{state.expanded.includes(item.id) ? 'Less' : 'More'}</span
									></button
								>{/if}
						</div>
					</article>
				{/snippet}
			</AdaptiveRegion>
		{/each}
	</div>
</div>

<style>
	.collection {
		position: absolute;
		inset: 0;
		overflow: auto;
		padding: 0.875rem;
		box-sizing: border-box;
		background: #f1f3f4;
		color: #182028;
	}
	.collection > header {
		display: flex;
		align-items: end;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}
	.collection > header p {
		margin: 0 0 0.125rem;
		color: #65717c;
		font-size: 0.6875em;
		text-transform: uppercase;
	}
	.collection > header h2 {
		margin: 0;
		font-size: 1.1875em;
	}
	.collection > header > span {
		font-size: 0.75em;
	}
	.collection-grid {
		display: grid;
		grid-template-columns: 1.35fr 0.65fr;
		grid-auto-rows: minmax(9.375rem, auto);
		gap: 0.625rem;
	}
	.collection.layout-narrow .collection-grid {
		grid-template-columns: 1fr;
	}
	.collection.layout-compact .collection-grid {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
	.collection-region {
		min-height: 9.375rem;
	}
	.item-3 {
		grid-column: span 2;
	}
	.collection.layout-narrow .item-3 {
		grid-column: auto;
	}
	.collection-item {
		height: 100%;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		gap: 0.5625rem;
		padding: 0.75rem;
		border: 1px solid #b8c2cb;
		border-radius: 0.375rem;
		background: #fff;
	}
	.item-main {
		display: flex;
		justify-content: space-between;
		gap: 0.625rem;
	}
	.item-title {
		display: flex;
		gap: 0.5rem;
		min-width: 0;
	}
	.status-mark {
		color: #087267;
	}
	h3 {
		margin: 0;
		font-size: 0.875em;
	}
	.item-title p {
		margin: 0.3125rem 0 0;
		max-width: 52ch;
		color: #52606c;
		font-size: 0.75em;
		line-height: 1.35;
	}
	.status {
		flex: 0 0 auto;
		color: #5c6872;
		font-size: 0.6875em;
	}
	.item-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.625rem;
		color: #5d6974;
		font-size: 0.6875em;
	}
	.item-meta span {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}
	.item-actions {
		display: flex;
		gap: 0.375rem;
		margin-top: auto;
	}
	.item-actions button {
		min-width: 2.75rem;
		min-height: 2.375rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.3125rem;
		padding: 0.3125rem 0.5625rem;
		border: 1px solid #8794a0;
		border-radius: 0.25rem;
		background: #f8fafb;
	}
	.mode-minimal {
		flex-direction: row;
		align-items: center;
	}
	.mode-minimal .item-main {
		flex: 1;
		align-items: center;
	}
	.mode-minimal .item-actions {
		margin: 0;
	}
	.mode-minimal .item-actions button {
		min-height: 2.75rem;
	}
	button:focus-visible {
		outline: 0.1875rem solid #0b6bcb;
		outline-offset: 0.125rem;
	}
</style>
