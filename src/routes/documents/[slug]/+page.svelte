<script lang="ts">
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import DocumentViewer from '$lib/components/document/DocumentViewer.svelte';

	let { data } = $props();
	const doc = $derived(data.document);
</script>

<main class="page">
	<PageHeader
		eyebrow="Documento"
		title={doc.title}
		lede={doc.summary}
		meta={[doc.status, doc.language ?? 'es']}
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
