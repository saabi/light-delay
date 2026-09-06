<script lang="ts">
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import LifecycleNotice from '$lib/components/app/LifecycleNotice.svelte';
	import DocumentViewer from '$lib/components/document/DocumentViewer.svelte';
	import { getLifecycleForRef } from '$lib/data/repositories/index';
	import { resolveDocument } from '$lib/data/selectors/localized';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import * as m from '$lib/paraglide/messages.js';
	import { editorialValueLabel } from '$lib/data/selectors/editorialPresentation';

	let { data } = $props();
	const doc = $derived(resolveDocument(data.document, getLocale()));
	const lifecycle = $derived(getLifecycleForRef('document', data.document.id));
</script>

<svelte:head>
	{#if lifecycle.status !== 'active'}<meta name="robots" content="noindex,follow" />{/if}
</svelte:head>

<main class="page">
	<PageHeader
		eyebrow={m.documents_eyebrow()}
		title={doc.title}
		lede={doc.summary}
		meta={[
			editorialValueLabel(doc.status, getLocale()),
			doc.resolvedLanguage.toUpperCase(),
			...(doc.translationStatus?.en === 'draft' && getLocale() === 'en'
				? [m.documents_translation_draft()]
				: [])
		]}
	/>
	<LifecycleNotice {lifecycle} />
	<DocumentViewer blocks={doc.blocks} />
</main>

<style>
	.page {
		max-width: var(--content-max);
		margin: 0 auto;
		padding: 2.5rem var(--page-gutter) 4rem;
	}
</style>
