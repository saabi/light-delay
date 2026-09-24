<script lang="ts">
	import { page } from '$app/state';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import * as m from '$lib/paraglide/messages.js';
	import { localeSwitchHref, withBase } from '$lib/utils/paths';

	let {
		title = m.site_title_full(),
		description = m.site_description(),
		noindex = false
	}: { title?: string; description?: string; noindex?: boolean } = $props();
	const origin = 'https://saabi.github.io';
	const canonical = $derived(new URL(page.url.pathname, origin).href);
	const english = $derived(new URL(localeSwitchHref(page.url, 'en'), origin).href);
	const spanish = $derived(new URL(localeSwitchHref(page.url, 'es'), origin).href);
	const socialImage = $derived(new URL(withBase('/brand/social-card.png'), origin).href);
	const locale = $derived(getLocale());
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta name="theme-color" content="#07131d" />
	{#if noindex}<meta name="robots" content="noindex,follow" />{/if}
	<link rel="canonical" href={canonical} />
	<link rel="alternate" hreflang="en" href={english} />
	<link rel="alternate" hreflang="es" href={spanish} />
	<link rel="alternate" hreflang="x-default" href={english} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Light Delay" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={socialImage} />
	<meta property="og:locale" content={locale === 'es' ? 'es_AR' : 'en_US'} />
	<meta property="og:locale:alternate" content={locale === 'es' ? 'en_US' : 'es_AR'} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={socialImage} />
</svelte:head>
