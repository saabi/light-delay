<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { withBase } from '$lib/utils/paths';
	import type { Snippet } from 'svelte';

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
		if (!drawer?.open) return;
		drawer.close();
		menuOpen = false;
		if (restoreFocus) requestAnimationFrame(() => menuButton?.focus());
	}

	function onDrawerClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (target === drawer || target.closest('a')) closeMenu({ restoreFocus: false });
	}

	afterNavigate(() => closeMenu({ restoreFocus: false }));

	$effect(() => {
		if (!menuOpen || typeof document === 'undefined') return;
		const previous = document.documentElement.style.overflow;
		document.documentElement.style.overflow = 'hidden';
		return () => {
			document.documentElement.style.overflow = previous;
		};
	});
</script>

<div class="shell">
	<header class="site-header">
		<a class="brand" href={withBase('/')}>
			<span class="orb" aria-hidden="true"></span>
			<span>Light Delay</span>
		</a>
		{#if navigation}
			<button
				bind:this={menuButton}
				type="button"
				class="menu-button"
				aria-label="Abrir menú principal"
				aria-expanded={menuOpen}
				aria-controls="project-navigation"
				onclick={openMenu}
			>
				<span class="hamburger" aria-hidden="true"><i></i><i></i><i></i></span>
				<span>Menú</span>
			</button>
		{/if}
	</header>

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
						<span class="eyebrow">Proyecto</span>
						<h2 id="navigation-title">Navegación</h2>
					</div>
					<button
						type="button"
						class="close-button"
						aria-label="Cerrar menú"
						onclick={() => closeMenu()}>×</button
					>
				</header>
				<div class="drawer-body">
					{@render navigation()}
				</div>
			</div>
		</dialog>
	{/if}

	<div class="main">
		{@render children()}
	</div>
</div>

<style>
	.shell {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.site-header {
		position: sticky;
		top: 0;
		z-index: 40;
		min-height: var(--header-height);
		padding: env(safe-area-inset-top) var(--page-gutter) 0;
		border-bottom: 1px solid var(--line);
		background: var(--rail);
		backdrop-filter: blur(14px);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.main {
		flex: 1;
		min-width: 0;
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
	}

	.orb {
		width: 11px;
		height: 11px;
		border-radius: 50%;
		background: var(--cyan);
		box-shadow: 0 0 20px var(--cyan);
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
		border-radius: 8px;
		font-size: 0.82rem;
		font-weight: 700;
	}

	.hamburger {
		display: grid;
		gap: 3px;
		width: 17px;
	}

	.hamburger i {
		display: block;
		height: 2px;
		border-radius: 2px;
		background: currentColor;
	}

	.navigation-dialog {
		width: min(22rem, calc(100vw - 2rem));
		max-width: none;
		height: 100dvh;
		max-height: none;
		margin: 0;
		padding: 0;
		border: 0;
		border-right: 1px solid var(--line);
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
		height: 100%;
		padding-top: env(safe-area-inset-top);
	}

	.drawer-panel > header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 1.25rem;
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

	@media (max-width: 480px) {
		.menu-button > span:last-child {
			display: none;
		}
	}
</style>
