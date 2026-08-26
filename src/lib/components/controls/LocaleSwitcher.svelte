<script lang="ts">
	import { page } from '$app/state';
	import { getLocale, locales, type Locale } from '$lib/paraglide/runtime.js';
	import * as m from '$lib/paraglide/messages.js';
	import { localeSwitchHref } from '$lib/utils/paths';

	let { compact = false }: { compact?: boolean } = $props();
	const current = $derived(getLocale());

	function label(locale: Locale): string {
		return locale === 'es' ? m.language_spanish() : m.language_english();
	}
</script>

<nav class:compact class="locale-switcher" aria-label={m.language_label()}>
	{#each locales as locale (locale)}
		<a
			href={localeSwitchHref(page.url, locale)}
			hreflang={locale}
			lang={locale}
			aria-current={current === locale ? 'page' : undefined}
			data-sveltekit-reload>{compact ? locale.toUpperCase() : label(locale)}</a
		>
	{/each}
</nav>

<style>
	.locale-switcher {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		padding: 0.2rem;
		border: 1px solid var(--line);
		border-radius: 0.65rem;
		background: var(--panel2);
	}

	a {
		padding: 0.35rem 0.55rem;
		border-radius: 0.45rem;
		color: var(--muted);
		font: 700 0.72rem var(--font-mono);
		text-decoration: none;
	}

	a[aria-current='page'] {
		background: var(--cyan);
		color: #031019;
	}

	.compact a {
		padding-inline: 0.42rem;
	}
</style>
