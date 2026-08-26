<script lang="ts">
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import { withBase } from '$lib/utils/paths';
	import { encodeRouteId } from '$lib/utils/routeId';

	let { data } = $props();
	const entity = $derived(data.entity);
</script>

<main class="page">
	<p class="crumb">
		<a href={withBase(`/entities/${data.kind}`)}>{data.label}</a>
		<span>/</span>
		<span>{entity.name}</span>
	</p>
	<PageHeader
		eyebrow={data.label}
		title={entity.name}
		lede={entity.description}
		meta={[entity.id]}
	/>

	{#if data.assets.length}
		<section>
			<h2>Assets de referencia</h2>
			<div class="assets">
				{#each data.assets as asset (asset.id)}
					<a class="asset" href={withBase(`/assets/${encodeRouteId(asset.id)}`)}>
						{#if asset.kind === 'image'}
							<img src={withBase(asset.path)} alt={asset.title ?? asset.id} loading="lazy" />
						{/if}
						<span>{asset.title ?? asset.id}</span>
					</a>
				{/each}
			</div>
		</section>
	{/if}
</main>

<style>
	.page {
		max-width: var(--content-max);
		margin: 0 auto;
		padding: 2.5rem 1.75rem 4rem;
	}

	.crumb {
		display: flex;
		gap: 0.5rem;
		color: var(--muted);
		font-size: 0.9rem;
		margin: 0 0 1rem;
	}

	.crumb a {
		color: var(--cyan);
		text-decoration: none;
	}

	h2 {
		margin: 0 0 1rem;
		font: 700 1.2rem var(--font-serif);
	}

	.assets {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 1rem;
	}

	.asset {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		text-decoration: none;
		color: var(--ink);
		border: 1px solid var(--line);
		border-radius: 12px;
		overflow: hidden;
		background: var(--panel);
		padding-bottom: 0.75rem;
	}

	.asset img {
		width: 100%;
		aspect-ratio: 16 / 10;
		object-fit: cover;
		background: var(--panel2);
	}

	.asset span {
		padding: 0 0.75rem;
		font-size: 0.88rem;
		color: var(--muted);
	}
</style>
