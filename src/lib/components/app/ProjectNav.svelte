<script lang="ts">
	import { page } from '$app/state';
	import { activeScriptIdFromParam } from '$lib/state/active-script.svelte';
	import { scriptSectionHref } from '$lib/utils/scriptRouting';
	import { encodeScriptId } from '$lib/utils/scriptId';
	import { withBase, withoutBase } from '$lib/utils/paths';
	import ScriptSwitcher from './ScriptSwitcher.svelte';

	const activeScriptId = $derived(activeScriptIdFromParam(page.params.scriptId));

	const links = $derived([
		{ href: withBase('/'), label: 'Inicio', match: '/' },
		{ href: scriptSectionHref('script', activeScriptId), label: 'Guion', match: '/script' },
		{
			href: scriptSectionHref('animatic', activeScriptId),
			label: 'Animatic',
			match: '/animatic'
		},
		{
			href: withBase(`/compare/${encodeScriptId(activeScriptId)}`),
			label: 'Comparar',
			match: '/compare'
		},
		{ href: withBase('/art'), label: 'Arte', match: '/art' },
		{ href: withBase('/entities/characters'), label: 'Entidades', match: '/entities' },
		{
			href: withBase('/documents/notas-tecnicas-continuidad'),
			label: 'Documentos',
			match: '/documents'
		}
	]);

	function isActive(href: string, match?: string): boolean {
		const path = withoutBase(page.url.pathname);
		const prefix = match ?? withoutBase(href);
		if (prefix === '/') return path === '/';
		return path === prefix || path.startsWith(prefix + '/');
	}
</script>

<a class="brand" href={withBase('/')}>
	<span class="orb" aria-hidden="true"></span>
	Light Delay
</a>

<ScriptSwitcher />

<nav class="nav" aria-label="Principal">
	{#each links as link (link.label)}
		<a href={link.href} class:active={isActive(link.href, link.match)}>{link.label}</a>
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
