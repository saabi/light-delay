<script lang="ts">
	import { page } from '$app/state';

	const links = [
		{ href: '/', label: 'Inicio' },
		{ href: '/script', label: 'Guion' },
		{ href: '/animatic', label: 'Animatic' },
		{ href: '/art', label: 'Arte' },
		{ href: '/entities/characters', label: 'Entidades' },
		{ href: '/documents/notas-tecnicas-continuidad', label: 'Documentos' }
	];

	function isActive(href: string): boolean {
		const path = page.url.pathname;
		if (href === '/') return path === '/';
		return path === href || path.startsWith(href + '/');
	}
</script>

<a class="brand" href="/">
	<span class="orb" aria-hidden="true"></span>
	Light Delay
</a>

<nav class="nav" aria-label="Principal">
	{#each links as link (link.href)}
		<a href={link.href} class:active={isActive(link.href)}>{link.label}</a>
	{/each}
</nav>

<style>
	.brand {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		color: var(--cyan);
		font-weight: 800;
		letter-spacing: 0.18em;
		font-size: 0.73rem;
		text-decoration: none;
		text-transform: uppercase;
		margin-bottom: 1.75rem;
	}

	.orb {
		width: 11px;
		height: 11px;
		border-radius: 50%;
		background: var(--cyan);
		box-shadow: 0 0 20px var(--cyan);
	}

	.nav {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.nav a {
		padding: 0.45rem 0.65rem;
		border-radius: 8px;
		text-decoration: none;
		color: var(--muted);
		font-size: 0.92rem;
	}

	.nav a:hover,
	.nav a.active {
		color: var(--ink);
		background: var(--panel2);
	}

	.nav a.active {
		border: 1px solid var(--line);
		color: var(--cyan);
	}
</style>
