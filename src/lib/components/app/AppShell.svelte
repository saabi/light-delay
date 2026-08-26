<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { withBase, withLocale } from '$lib/utils/paths';
	import * as m from '$lib/paraglide/messages.js';
	import LocaleSwitcher from '$lib/components/controls/LocaleSwitcher.svelte';
	import { onMount, type Snippet } from 'svelte';

	let {
		children,
		navigation
	}: {
		children: Snippet;
		navigation?: Snippet;
	} = $props();

	let drawer: HTMLDialogElement | undefined = $state();
	let menuButton: HTMLButtonElement | undefined = $state();
	let menuOpen = $state(false);

	function openMenu() {
		if (!drawer || drawer.open) return;
		drawer.showModal();
		menuOpen = true;
	}

	function closeMenu({ restoreFocus = true } = {}) {
		if (!drawer?.open) {
			menuOpen = false;
			return;
		}
		drawer.close();
		menuOpen = false;
		if (restoreFocus) requestAnimationFrame(() => menuButton?.focus());
	}

	function onDrawerClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (target === drawer || target.closest('a')) closeMenu({ restoreFocus: false });
	}

	afterNavigate(() => closeMenu({ restoreFocus: false }));

	onMount(() => {
		const onResize = () => {
			if (drawer?.open) closeMenu({ restoreFocus: false });
		};
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	});

	$effect(() => {
		if (!menuOpen || typeof document === 'undefined') return;
		const previous = document.documentElement.style.overflow;
		document.documentElement.style.overflow = 'hidden';
		return () => {
			document.documentElement.style.overflow = previous;
		};
	});
</script>

<div class="shell-container">
	<div class="shell">
		<header class="desktop-header">
			<a class="brand" href={withLocale('/')}>
				<img src={withBase('/brand/light-delay-mark.svg')} alt="" aria-hidden="true" />
				<span>Light Delay</span>
			</a>
			<div class="header-actions">
				<LocaleSwitcher compact />
				<a
					class="github-link"
					href="https://github.com/saabi/light-delay"
					target="_blank"
					rel="noopener noreferrer">{m.nav_github()}</a
				>
			</div>
		</header>

		{#if navigation}
			<aside class="desktop-rail" aria-label={m.nav_primary()}>
				{@render navigation()}
			</aside>
		{/if}

		<div class="main">
			{@render children()}
		</div>

		<nav class="mobile-bar" aria-label={m.nav_primary()}>
			<a class="brand mobile-brand" href={withLocale('/')} aria-label={m.nav_home()}>
				<img src={withBase('/brand/light-delay-mark.svg')} alt="" aria-hidden="true" />
				<span>Light Delay</span>
			</a>
			<a
				class="github-link mobile-github"
				href="https://github.com/saabi/light-delay"
				target="_blank"
				rel="noopener noreferrer">{m.nav_github()}</a
			>
			{#if navigation}
				<button
					bind:this={menuButton}
					type="button"
					class="menu-button"
					aria-label={m.nav_open_menu()}
					aria-expanded={menuOpen}
					aria-controls="project-navigation"
					onclick={openMenu}
				>
					<span class="hamburger" aria-hidden="true"><i></i><i></i><i></i></span>
					<span>{m.nav_primary()}</span>
				</button>
			{/if}
		</nav>

		{#if navigation}
			<dialog
				bind:this={drawer}
				class="navigation-dialog"
				id="project-navigation"
				aria-labelledby="navigation-title"
				onclose={() => (menuOpen = false)}
				onclick={onDrawerClick}
			>
				<div class="drawer-panel">
					<header>
						<div>
							<span class="eyebrow">{m.nav_project()}</span>
							<h2 id="navigation-title">{m.nav_primary()}</h2>
						</div>
						<button
							type="button"
							class="close-button"
							aria-label={m.nav_close_menu()}
							onclick={() => closeMenu()}>×</button
						>
					</header>
					<div class="drawer-body">
						<LocaleSwitcher />
						{@render navigation()}
					</div>
				</div>
			</dialog>
		{/if}
	</div>
</div>

<style>
	.shell-container {
		container: app-shell / inline-size;
		min-height: 100vh;
		font-family: var(--font-sans);
	}

	.shell {
		--site-top-offset: 0rem;
		--site-bottom-offset: calc(var(--mobile-bar-height) + env(safe-area-inset-bottom));
		min-height: 100vh;
		display: grid;
		grid-template-columns: minmax(0, 1fr);
	}

	.desktop-header,
	.desktop-rail {
		display: none;
	}

	.main {
		min-width: 0;
		padding-bottom: var(--site-bottom-offset);
	}

	.desktop-header,
	.mobile-bar {
		background: var(--rail);
		backdrop-filter: blur(14px);
	}

	.desktop-header {
		position: sticky;
		top: 0;
		z-index: 40;
		min-height: var(--header-height);
		padding: 0 var(--page-gutter);
		border-bottom: 1px solid var(--line);
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.65rem;
		min-height: var(--header-height);
		color: var(--cyan);
		font-weight: 800;
		letter-spacing: 0.18em;
		font-size: 0.73rem;
		text-decoration: none;
		text-transform: uppercase;
		white-space: nowrap;
	}

	.brand img {
		width: 1.25rem;
		height: 1.25rem;
		flex: none;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}

	.github-link {
		padding: 0.45rem 0.7rem;
		border: 1px solid var(--line);
		border-radius: 0.5rem;
		color: var(--muted);
		font-size: 0.78rem;
		font-weight: 700;
		text-decoration: none;
	}

	.github-link:hover {
		border-color: var(--cyan);
		color: var(--cyan);
	}

	.mobile-bar {
		position: fixed;
		inset: auto 0 0;
		z-index: 40;
		min-height: calc(var(--mobile-bar-height) + env(safe-area-inset-bottom));
		padding: 0.35rem var(--page-gutter) max(0.35rem, env(safe-area-inset-bottom));
		border-top: 1px solid var(--line);
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto auto;
		align-items: center;
		gap: 0.45rem;
	}

	.mobile-brand {
		min-height: 2.75rem;
		min-width: 0;
		overflow: hidden;
	}

	.mobile-brand > span:last-child {
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.mobile-github {
		white-space: nowrap;
	}

	.menu-button,
	.close-button {
		border: 1px solid var(--line);
		background: var(--panel2);
		color: var(--ink);
		cursor: pointer;
	}

	.menu-button {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		padding: 0.5rem 0.7rem;
		border-radius: 0.5rem;
		font-size: 0.82rem;
		font-weight: 700;
	}

	.hamburger {
		display: grid;
		gap: 0.1875rem;
		width: 1.0625rem;
	}

	.hamburger i {
		display: block;
		height: 0.125rem;
		border-radius: 0.125rem;
		background: currentColor;
	}

	.navigation-dialog {
		position: fixed;
		inset: auto 0 0;
		width: min(100%, 36rem);
		max-width: none;
		max-height: min(80dvh, 42rem);
		margin: auto auto 0;
		padding: 0;
		border: 1px solid var(--line);
		border-bottom: 0;
		border-radius: 1rem 1rem 0 0;
		background: var(--rail);
		color: var(--ink);
	}

	.navigation-dialog::backdrop {
		background: #01070dcc;
		backdrop-filter: blur(3px);
	}

	.drawer-panel {
		display: flex;
		flex-direction: column;
		max-height: inherit;
	}

	.drawer-panel::before {
		content: '';
		width: 2.75rem;
		height: 0.25rem;
		margin: 0.55rem auto 0;
		border-radius: 999px;
		background: var(--line);
	}

	.drawer-panel > header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.65rem 1.25rem 0.85rem;
		border-bottom: 1px solid var(--line);
	}

	.eyebrow {
		color: var(--cyan);
		font: 700 0.68rem var(--font-mono);
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	h2 {
		margin: 0.15rem 0 0;
		font: 700 1.25rem var(--font-serif);
	}

	.close-button {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		font-size: 1.5rem;
		line-height: 1;
	}

	.drawer-body {
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 1.25rem;
		padding-bottom: max(1.25rem, env(safe-area-inset-bottom));
	}

	.drawer-body :global(.locale-switcher) {
		margin-bottom: 1rem;
	}

	@container app-shell (min-width: calc(26.88em + 52.8ch)) {
		.shell {
			--site-top-offset: var(--header-height);
			--site-bottom-offset: 0rem;
			grid-template-columns: 16.25rem minmax(0, 1fr);
			grid-template-rows: var(--header-height) minmax(0, 1fr);
		}

		.desktop-header {
			display: flex;
			grid-column: 1 / -1;
			grid-row: 1;
		}

		.desktop-rail {
			display: block;
			grid-column: 1;
			grid-row: 2;
			position: sticky;
			top: var(--header-height);
			height: calc(100vh - var(--header-height));
			height: calc(100dvh - var(--header-height));
			padding: 1.75rem 1.35rem;
			border-right: 1px solid var(--line);
			background: var(--rail);
			backdrop-filter: blur(14px);
			overflow: auto;
		}

		.main {
			grid-column: 2;
			grid-row: 2;
		}

		.mobile-bar,
		.navigation-dialog {
			display: none;
		}
	}
</style>
