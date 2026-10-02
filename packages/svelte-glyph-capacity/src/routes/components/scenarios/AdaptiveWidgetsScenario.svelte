<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Check,
		ChevronLeft,
		ChevronRight,
		Copy,
		Download,
		Filter,
		MoreHorizontal,
		Save,
		Search,
		Share2,
		Star,
		Trash2
	} from '@lucide/svelte';
	import AdaptiveRegion from '../AdaptiveRegion.svelte';
	import type { AdaptiveMode, Profile, StageLayout, StageUnit, WidgetsState } from '../../types';

	let {
		layout,
		onChange,
		profile,
		state: widgetState,
		strategy
	}: {
		layout: StageLayout;
		onChange: (next: WidgetsState) => void;
		profile: Profile;
		state: WidgetsState;
		strategy: StageUnit;
	} = $props();

	let toolbarMenuOpen = $state(false);
	let searchExpanded = $state(false);
	let filterExpanded = $state(false);
	let supportsHover = $state(false);
	let dismissedTooltip = $state<string | null>(null);

	const themes: { value: WidgetsState['theme']; label: string; description: string }[] = [
		{ value: 'system', label: 'System', description: 'Follow this device' },
		{ value: 'light', label: 'Light', description: 'Bright surfaces' },
		{ value: 'dark', label: 'Dark', description: 'Dim surfaces' }
	];
	const digests: { value: WidgetsState['digest']; label: string }[] = [
		{ value: 'daily', label: 'Daily' },
		{ value: 'weekly', label: 'Weekly' },
		{ value: 'monthly', label: 'Monthly' }
	];
	const views: { value: WidgetsState['activeView']; label: string }[] = [
		{ value: 'overview', label: 'Overview' },
		{ value: 'activity', label: 'Activity' },
		{ value: 'files', label: 'Files' },
		{ value: 'settings', label: 'Settings' }
	];

	onMount(() => {
		const media = matchMedia('(hover: hover) and (pointer: fine)');
		const apply = () => (supportsHover = media.matches);
		apply();
		media.addEventListener('change', apply);
		return () => media.removeEventListener('change', apply);
	});

	function patch(next: Partial<WidgetsState>) {
		onChange({ ...widgetState, ...next });
	}

	function cycleDigest(direction: -1 | 1) {
		const index = digests.findIndex((item) => item.value === widgetState.digest);
		const next = digests[(index + direction + digests.length) % digests.length];
		patch({ digest: next.value });
	}

	function onTabsKeydown(event: KeyboardEvent) {
		if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
		event.preventDefault();
		const current = views.findIndex((view) => view.value === widgetState.activeView);
		const next =
			event.key === 'Home'
				? 0
				: event.key === 'End'
					? views.length - 1
					: (current + (event.key === 'ArrowRight' ? 1 : -1) + views.length) % views.length;
		patch({ activeView: views[next].value });
		(
			document.getElementById(`${strategy}-widget-tab-${views[next].value}`) as HTMLElement
		)?.focus();
	}

	function tooltipKeydown(event: KeyboardEvent, id: string) {
		if (event.key === 'Escape') dismissedTooltip = id;
	}
</script>

<div class={`widget-board layout-${layout}`} data-scenario="adaptive-widgets">
	<AdaptiveRegion {strategy} {profile} policy="choice" class="widget-region choice-region">
		{#snippet children(mode)}
			<section class="widget" data-widget="choice" data-adaptive-mode={mode}>
				<header>
					<h2>Single choice</h2>
					<span>{mode}</span>
				</header>
				{#if mode === 'minimal'}
					<label class="field-label"
						>Theme
						<select
							value={widgetState.theme}
							onchange={(event) =>
								patch({ theme: event.currentTarget.value as WidgetsState['theme'] })}
						>
							{#each themes as theme}<option value={theme.value}>{theme.label}</option>{/each}
						</select>
					</label>
					<div class="choice-stepper" aria-label="Digest frequency">
						<button aria-label="Previous digest frequency" onclick={() => cycleDigest(-1)}
							><ChevronLeft size="1.0625rem" /></button
						>
						<output aria-live="polite"
							>{digests.find((item) => item.value === widgetState.digest)?.label}</output
						>
						<button aria-label="Next digest frequency" onclick={() => cycleDigest(1)}
							><ChevronRight size="1.0625rem" /></button
						>
					</div>
				{:else}
					<fieldset class:choice-cards={mode === 'full'}>
						<legend>Theme</legend>
						{#each themes as theme}
							<label
								><input
									type="radio"
									name={`${strategy}-theme`}
									value={theme.value}
									checked={widgetState.theme === theme.value}
									onchange={() => patch({ theme: theme.value })}
								/><span
									><strong>{theme.label}</strong>{#if mode === 'full'}<small
											>{theme.description}</small
										>{/if}</span
								></label
							>
						{/each}
					</fieldset>
					<fieldset class="digest-options">
						<legend>Digest</legend>
						{#each digests as digest}<label
								><input
									type="radio"
									name={`${strategy}-digest`}
									value={digest.value}
									checked={widgetState.digest === digest.value}
									onchange={() => patch({ digest: digest.value })}
								/>{digest.label}</label
							>{/each}
					</fieldset>
				{/if}
			</section>
		{/snippet}
	</AdaptiveRegion>

	<AdaptiveRegion {strategy} {profile} policy="numeric" class="widget-region">
		{#snippet children(mode)}
			<section class="widget" data-widget="numeric" data-adaptive-mode={mode}>
				<header>
					<h2>Numeric value</h2>
					<span>{mode}</span>
				</header>
				{#if mode === 'minimal'}
					<div class="spin-control">
						<button
							aria-label="Decrease zoom"
							onclick={() => patch({ zoom: Math.max(50, widgetState.zoom - 10) })}>−</button
						>
						<label
							>Zoom <input
								type="number"
								min="50"
								max="200"
								step="10"
								value={widgetState.zoom}
								oninput={(event) => patch({ zoom: Number(event.currentTarget.value) })}
							/></label
						>
						<button
							aria-label="Increase zoom"
							onclick={() => patch({ zoom: Math.min(200, widgetState.zoom + 10) })}>+</button
						>
					</div>
				{:else}
					<label class="range-control"
						>Zoom <output>{widgetState.zoom}%</output><input
							type="range"
							min="50"
							max="200"
							step="10"
							value={widgetState.zoom}
							oninput={(event) => patch({ zoom: Number(event.currentTarget.value) })}
						/></label
					>
					{#if mode === 'full'}<div class="presets">
							{#each [75, 100, 125] as value}<button
									class:active={widgetState.zoom === value}
									onclick={() => patch({ zoom: value })}>{value}%</button
								>{/each}
						</div>{/if}
				{/if}
			</section>
		{/snippet}
	</AdaptiveRegion>

	<AdaptiveRegion {strategy} {profile} policy="toolbar" class="widget-region toolbar-region">
		{#snippet children(mode)}
			<section class="widget" data-widget="toolbar" data-adaptive-mode={mode}>
				<header>
					<h2>Action toolbar</h2>
					<span>{mode}</span>
				</header>
				<div class="toolbar" role="toolbar" aria-label="Document actions">
					{#if mode === 'full'}
						<button onclick={() => patch({ saved: true })}><Save size="1rem" />Save</button><button
							><Copy size="1rem" />Copy</button
						><button><Share2 size="1rem" />Share</button><button
							><Download size="1rem" />Export</button
						>
					{:else if mode === 'minimal' && supportsHover}
						{#each [{ id: 'save', label: 'Save', icon: Save }, { id: 'copy', label: 'Copy', icon: Copy }, { id: 'share', label: 'Share', icon: Share2 }] as action}
							{@const ActionIcon = action.icon}
							<span class="tooltip-control">
								<button
									aria-label={action.label}
									onfocus={() => (dismissedTooltip = null)}
									onkeydown={(event) => tooltipKeydown(event, action.id)}
									onclick={() => action.id === 'save' && patch({ saved: true })}
									><ActionIcon size="1.0625rem" /></button
								>
								{#if dismissedTooltip !== action.id}<span role="tooltip">{action.label}</span>{/if}
							</span>
						{/each}
					{:else}
						<button onclick={() => patch({ saved: true })}><Save size="1rem" />Save</button>
					{/if}
					{#if mode !== 'full'}
						<div class="menu-wrap">
							<button
								aria-haspopup="menu"
								aria-expanded={toolbarMenuOpen}
								onclick={() => (toolbarMenuOpen = !toolbarMenuOpen)}
								><MoreHorizontal size="1.0625rem" /><span>More</span></button
							>{#if toolbarMenuOpen}<div class="action-menu" role="menu">
									<button role="menuitem"><Copy size="0.9375rem" />Copy</button><button
										role="menuitem"><Share2 size="0.9375rem" />Share</button
									><button role="menuitem"><Download size="0.9375rem" />Export</button><button
										role="menuitem"><Trash2 size="0.9375rem" />Delete</button
									>
								</div>{/if}
						</div>
					{/if}
				</div>
				<output class="status" aria-live="polite"
					>{widgetState.saved ? 'Changes saved' : 'Unsaved changes'}</output
				>
			</section>
		{/snippet}
	</AdaptiveRegion>

	<AdaptiveRegion {strategy} {profile} policy="tabs" class="widget-region tabs-region">
		{#snippet children(mode)}
			<section class="widget" data-widget="tabs" data-adaptive-mode={mode}>
				<header>
					<h2>View navigation</h2>
					<span>{mode}</span>
				</header>
				{#if mode === 'minimal'}
					<label class="field-label"
						>View <select
							value={widgetState.activeView}
							onchange={(event) =>
								patch({ activeView: event.currentTarget.value as WidgetsState['activeView'] })}
							>{#each views as view}<option value={view.value}>{view.label}</option>{/each}</select
						></label
					>
				{:else}
					<div
						class:scroll-tabs={mode === 'reduced'}
						role="tablist"
						aria-label="Workspace view"
						tabindex="-1"
						onkeydown={onTabsKeydown}
					>
						{#each views as view}<button
								id={`${strategy}-widget-tab-${view.value}`}
								role="tab"
								aria-selected={widgetState.activeView === view.value}
								aria-controls={`${strategy}-widget-panel`}
								tabindex={widgetState.activeView === view.value ? 0 : -1}
								onclick={() => patch({ activeView: view.value })}>{view.label}</button
							>{/each}
					</div>
				{/if}
				<div id={`${strategy}-widget-panel`} role="tabpanel" aria-live="polite">
					{views.find((view) => view.value === widgetState.activeView)?.label} content
				</div>
			</section>
		{/snippet}
	</AdaptiveRegion>

	<AdaptiveRegion {strategy} {profile} policy="search" class="widget-region search-region">
		{#snippet children(mode)}
			<section class="widget" data-widget="search" data-adaptive-mode={mode}>
				<header>
					<h2>Search and filters</h2>
					<span>{mode}</span>
				</header>
				{#if mode !== 'minimal' || searchExpanded}
					<label class="search-field"
						><Search size="1rem" /><span class="sr-only">Search projects</span><input
							aria-label="Search projects"
							placeholder="Search projects"
							value={widgetState.search}
							oninput={(event) => patch({ search: event.currentTarget.value })}
						/></label
					>
				{:else}<button class="expand-action" onclick={() => (searchExpanded = true)}
						><Search size="1.0625rem" />Search</button
					>{/if}
				{#if mode === 'full'}
					<div class="filter-chips" aria-label="Project status filter">
						{#each [{ value: 'all', label: 'All' }, { value: 'open', label: 'Open' }, { value: 'complete', label: 'Complete' }] as filter}<button
								class:active={widgetState.filter === filter.value}
								aria-pressed={widgetState.filter === filter.value}
								onclick={() => patch({ filter: filter.value as WidgetsState['filter'] })}
								>{filter.label}</button
							>{/each}
					</div>
				{:else if mode === 'reduced' || filterExpanded}
					<label class="field-label"
						>Status <select
							value={widgetState.filter}
							onchange={(event) =>
								patch({ filter: event.currentTarget.value as WidgetsState['filter'] })}
							><option value="all">All</option><option value="open">Open</option><option
								value="complete">Complete</option
							></select
						></label
					>
				{:else}<button class="expand-action" onclick={() => (filterExpanded = true)}
						><Filter size="1.0625rem" />Filter: {widgetState.filter}</button
					>{/if}
			</section>
		{/snippet}
	</AdaptiveRegion>

	<AdaptiveRegion {strategy} {profile} policy="form-actions" class="widget-region form-region">
		{#snippet children(mode)}
			<section class="widget" data-widget="form-actions" data-adaptive-mode={mode}>
				<header>
					<h2>Form actions</h2>
					<span>{mode}</span>
				</header>
				<p>Review notification settings before applying them.</p>
				<div class={`form-actions mode-${mode}`}>
					<button>Cancel</button><button>Save draft</button><button
						class="primary"
						onclick={() => patch({ saved: true })}><Check size="1rem" />Apply changes</button
					>
				</div>
			</section>
		{/snippet}
	</AdaptiveRegion>
</div>

<style>
	.widget-board {
		position: absolute;
		inset: 0;
		display: grid;
		grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.75fr);
		grid-auto-rows: minmax(8.625rem, auto);
		gap: 0.625rem;
		padding: 0.625rem;
		overflow: auto;
		background: #eef2f5;
		color: #18212c;
	}
	.widget-board.layout-narrow {
		grid-template-columns: 1fr;
	}
	.widget-board.layout-compact {
		grid-template-columns: repeat(2, minmax(0, 1fr));
		grid-auto-rows: minmax(7.875rem, auto);
	}
	.widget-region {
		min-height: 8.625rem;
	}
	.choice-region,
	.search-region {
		min-height: 11.5rem;
	}
	.widget {
		box-sizing: border-box;
		height: 100%;
		min-height: 0;
		padding: 0.6875rem;
		border: 1px solid #b8c2cc;
		border-radius: 0.375rem;
		background: #fff;
		overflow: auto;
	}
	.widget > header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.625rem;
		margin-bottom: 0.5625rem;
	}
	h2 {
		margin: 0;
		font-size: 0.875em;
		line-height: 1.2;
	}
	header span,
	.status {
		color: #526271;
		font:
			0.625em/1.2 ui-monospace,
			monospace;
		text-transform: uppercase;
	}
	button,
	select,
	input {
		font: inherit;
	}
	button {
		min-height: 2.125rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		border: 1px solid #8391a0;
		border-radius: 0.25rem;
		background: #f8fafb;
		color: #18212c;
		cursor: pointer;
	}
	button:focus-visible,
	select:focus-visible,
	input:focus-visible {
		outline: 0.1875rem solid #0b6bcb;
		outline-offset: 0.125rem;
	}
	fieldset {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 0.75rem;
		margin: 0 0 0.5625rem;
		padding: 0;
		border: 0;
	}
	legend {
		margin-bottom: 0.3125rem;
		font-size: 0.6875em;
		font-weight: 700;
	}
	fieldset label {
		display: flex;
		align-items: center;
		gap: 0.3125rem;
		font-size: 0.75em;
	}
	.choice-cards label {
		flex: 1;
		min-width: 5.75rem;
		padding: 0.4375rem;
		border: 1px solid #c7d0d9;
		border-radius: 0.25rem;
		align-items: flex-start;
	}
	.choice-cards span {
		display: grid;
		gap: 0.125rem;
	}
	.choice-cards small {
		color: #596877;
	}
	.digest-options {
		margin-bottom: 0;
	}
	.field-label {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		font-size: 0.75em;
	}
	.field-label select {
		min-width: 0;
		min-height: 2.125rem;
	}
	.choice-stepper,
	.spin-control {
		display: grid;
		grid-template-columns: 2.75rem minmax(0, 1fr) 2.75rem;
		align-items: center;
		gap: 0.3125rem;
		margin-top: 0.5625rem;
	}
	.choice-stepper button,
	.spin-control button {
		min-width: 2.75rem;
		min-height: 2.75rem;
	}
	.choice-stepper output {
		text-align: center;
		font-weight: 700;
	}
	.spin-control label {
		min-width: 0;
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: center;
		gap: 0.25rem;
		font-size: 0.6875em;
	}
	.spin-control input {
		box-sizing: border-box;
		width: 100%;
		min-width: 0;
		height: 2.25rem;
	}
	.range-control {
		display: grid;
		grid-template-columns: auto auto;
		gap: 0.3125rem;
		font-size: 0.75em;
	}
	.range-control output {
		text-align: right;
		font-weight: 700;
	}
	.range-control input {
		grid-column: 1 / -1;
		width: 100%;
	}
	.presets,
	.filter-chips {
		display: flex;
		gap: 0.3125rem;
		margin-top: 0.4375rem;
	}
	.presets button,
	.filter-chips button {
		min-height: 1.875rem;
		padding: 0.1875rem 0.5625rem;
	}
	button.active,
	button[aria-selected='true'],
	.primary {
		border-color: #075e54;
		background: #075e54;
		color: #fff;
	}
	.toolbar {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.3125rem;
	}
	.toolbar > button,
	.toolbar .menu-wrap > button {
		min-width: 2.75rem;
		padding: 0.3125rem 0.5625rem;
	}
	.menu-wrap {
		position: relative;
	}
	.action-menu {
		position: absolute;
		z-index: 20;
		top: calc(100% + 0.25rem);
		right: 0;
		display: grid;
		min-width: 8.125rem;
		padding: 0.3125rem;
		border: 1px solid #8493a2;
		border-radius: 0.25rem;
		background: #fff;
		box-shadow: 0 0.3125rem 0.875rem rgba(0, 0, 0, 0.18);
	}
	.action-menu button {
		justify-content: flex-start;
		border: 0;
		background: transparent;
	}
	.status {
		display: block;
		margin-top: 0.4375rem;
		text-transform: none;
	}
	.tooltip-control {
		position: relative;
		display: inline-flex;
	}
	.tooltip-control button {
		width: 2.75rem;
		height: 2.75rem;
	}
	.tooltip-control [role='tooltip'] {
		display: none;
		position: absolute;
		z-index: 30;
		top: calc(100% + 0.3125rem);
		left: 50%;
		transform: translateX(-50%);
		padding: 0.25rem 0.4375rem;
		border-radius: 0.1875rem;
		background: #111827;
		color: #fff;
		font-size: 0.6875em;
		white-space: nowrap;
	}
	@media (hover: hover) and (pointer: fine) {
		.tooltip-control:hover [role='tooltip'],
		.tooltip-control:focus-within [role='tooltip'] {
			display: block;
		}
	}
	[role='tablist'] {
		display: flex;
		gap: 0.1875rem;
		border-bottom: 1px solid #bbc5cf;
	}
	[role='tab'] {
		flex: 0 0 auto;
		border: 0;
		border-radius: 0.1875rem 0.1875rem 0 0;
		background: transparent;
	}
	.scroll-tabs {
		overflow-x: auto;
	}
	[role='tabpanel'] {
		padding: 0.5625rem 0.1875rem;
		font-size: 0.75em;
	}
	.search-field {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		min-height: 2.375rem;
		padding: 0 0.5rem;
		border: 1px solid #8493a2;
		border-radius: 0.25rem;
	}
	.search-field input {
		flex: 1;
		min-width: 0;
		border: 0;
		outline: 0;
	}
	.expand-action {
		min-width: 2.75rem;
		min-height: 2.75rem;
		margin-right: 0.375rem;
		padding: 0.375rem 0.625rem;
	}
	.form-region p {
		margin: 0 0 0.5rem;
		font-size: 0.75em;
	}
	.form-actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 0.375rem;
	}
	.form-actions button {
		padding: 0.3125rem 0.625rem;
	}
	.form-actions.mode-minimal {
		flex-direction: column;
	}
	.form-actions.mode-minimal button {
		width: 100%;
		min-height: 2.75rem;
	}
	.form-actions.mode-minimal .primary {
		order: 3;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
	@container adaptive-region (max-width: 24rem) {
		.widget-board.layout-compact {
			grid-template-columns: 1fr;
		}
	}
</style>
