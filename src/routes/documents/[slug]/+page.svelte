<script lang="ts">
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import DocumentViewer from '$lib/components/document/DocumentViewer.svelte';
	import { resolveDocument } from '$lib/data/selectors/localized';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import * as m from '$lib/paraglide/messages.js';

	let { data } = $props();
	const doc = $derived(resolveDocument(data.document, getLocale()));
</script>

<main class="page">
	<PageHeader
		eyebrow={m.documents_eyebrow()}
		title={doc.title}
		lede={doc.summary}
		meta={[
			doc.status,
			doc.resolvedLanguage.toUpperCase(),
			...(doc.translationStatus?.en === 'draft' && getLocale() === 'en'
				? [m.documents_translation_draft()]
				: [])
		]}
	/>
	<DocumentViewer blocks={doc.blocks} />
</main>

<style>
	.page {
		max-width: var(--content-max);
		margin: 0 auto;
		padding: 2.5rem var(--page-gutter) 4rem;
	}
</style>
