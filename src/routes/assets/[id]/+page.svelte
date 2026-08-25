<script lang="ts">
	import PageHeader from '$lib/components/app/PageHeader.svelte';

	let { data } = $props();
	const asset = $derived(data.asset);
</script>

<main class="page">
	<PageHeader
		eyebrow="Asset"
		title={asset.title ?? asset.id}
		lede={asset.description}
		meta={[asset.kind, asset.role, asset.path]}
	/>

	{#if asset.kind === 'image'}
		<figure>
			<img src={asset.path} alt={asset.title ?? asset.id} />
			<figcaption>{asset.path}</figcaption>
		</figure>
	{:else}
		<p class="path"><code>{asset.path}</code></p>
	{/if}

	<dl>
		<div>
			<dt>ID</dt>
			<dd>{asset.id}</dd>
		</div>
		<div>
			<dt>Tipo</dt>
			<dd>{asset.kind}</dd>
		</div>
		<div>
			<dt>Rol</dt>
			<dd>{asset.role}</dd>
		</div>
		{#if asset.width && asset.height}
			<div>
				<dt>Dimensiones</dt>
				<dd>{asset.width} × {asset.height}</dd>
			</div>
		{/if}
		{#if asset.mimeType}
			<div>
				<dt>MIME</dt>
				<dd>{asset.mimeType}</dd>
			</div>
		{/if}
	</dl>
</main>

<style>
	.page {
		max-width: var(--content-max);
		margin: 0 auto;
		padding: 2.5rem 1.75rem 4rem;
	}

	figure {
		margin: 0 0 1.5rem;
		border: 1px solid var(--line);
		border-radius: 12px;
		overflow: hidden;
		background: #000;
	}

	img {
		width: 100%;
		max-height: 70vh;
		object-fit: contain;
		margin: 0 auto;
	}

	figcaption {
		padding: 0.65rem 0.85rem;
		background: var(--panel);
		color: var(--muted);
		font-family: var(--font-mono);
		font-size: 0.8rem;
	}

	.path {
		color: var(--muted);
	}

	dl {
		display: grid;
		gap: 0.65rem;
		margin: 0;
	}

	dl div {
		display: grid;
		grid-template-columns: 8rem 1fr;
		gap: 0.75rem;
		padding: 0.55rem 0;
		border-bottom: 1px solid var(--line);
	}

	dt {
		color: var(--muted);
		font-size: 0.85rem;
	}

	dd {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 0.9rem;
	}
</style>
