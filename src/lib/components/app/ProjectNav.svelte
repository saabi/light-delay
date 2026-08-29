<script lang="ts">
	import { page } from '$app/state';
	import { activeScriptIdFromParam } from '$lib/state/active-script.svelte';
	import { scriptSectionHref } from '$lib/utils/scriptRouting';
	import { encodeScriptId } from '$lib/utils/scriptId';
	import { canonicalPathname, withLocale } from '$lib/utils/paths';
	import * as m from '$lib/paraglide/messages.js';
	import ScriptSwitcher from './ScriptSwitcher.svelte';
	import LanguageControls from '$lib/components/controls/LanguageControls.svelte';

	const activeScriptId = $derived(activeScriptIdFromParam(page.params.scriptId));

	const links = $derived([
		{ href: withLocale('/'), label: m.nav_home(), match: '/' },
		{ href: withLocale('/project'), label: m.nav_project(), match: '/project' },
		{
			href: scriptSectionHref('outline', activeScriptId),
			label: m.nav_outline(),
			match: '/outline'
		},
		{ href: scriptSectionHref('script', activeScriptId), label: m.nav_script(), match: '/script' },
		{
			href: scriptSectionHref('animatic', activeScriptId),
			label: m.nav_animatic(),
			match: '/animatic'
		},
		{
			href: withLocale(`/compare/${encodeScriptId(activeScriptId)}`),
			label: m.nav_compare(),
			match: '/compare'
		},
		{
			href: withLocale('/reports'),
			label: m.nav_reports(),
			match: '/reports'
		},
		{ href: withLocale('/art'), label: m.nav_art(), match: '/art' },
		{ href: withLocale('/entities/characters'), label: m.nav_entities(), match: '/entities' },
		{
			href: withLocale('/documents/notas-tecnicas-continuidad'),
			label: m.nav_documents(),
			match: '/documents'
		}
	]);

	function isActive(href: string, match?: string): boolean {
		const path = canonicalPathname(page.url);
		const prefix = match ?? canonicalPathname(new URL(href, page.url));
		if (prefix === '/') return path === '/';
		return path === prefix || path.startsWith(prefix + '/');
	}
</script>

<ScriptSwitcher />
<LanguageControls compact />

<nav class="nav" aria-label={m.nav_primary()}>
	{#each links as link (link.label)}
		<a href={link.href} class:active={isActive(link.href, link.match)}>{link.label}</a>
	{/each}
</nav>

<style>
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
