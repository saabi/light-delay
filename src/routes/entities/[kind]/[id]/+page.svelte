<script lang="ts">
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import ImageCarousel from '$lib/components/media/ImageCarousel.svelte';
	import { withLocale } from '$lib/utils/paths';
	import { encodeRouteId } from '$lib/utils/routeId';
	import * as m from '$lib/paraglide/messages.js';

	let { data } = $props();
	const entity = $derived(data.entity);
	const labels = {
		characters: m.entities_characters(),
		locations: m.entities_locations(),
		objects: m.entities_objects(),
		vehicles: m.entities_vehicles(),
		factions: m.entities_factions()
	};
	const label = $derived(labels[data.kind as keyof typeof labels]);

	const slides = $derived(
		data.assets
			.filter(
				(asset) =>
					asset.kind === 'image' && !asset.path.toLowerCase().endsWith('.svg')
			)
			.map((asset) => ({
				id: asset.id,
				src: asset.path,
				alt: asset.title ?? asset.id,
				caption: asset.title ?? asset.id,
				href: withLocale(`/assets/${encodeRouteId(asset.id)}`)
			}))
	);
</script>

<main class="page">
	<p class="crumb">
		<a href={withLocale(`/entities/${data.kind}`)}>{label}</a>
		<span>/</span>
		<span>{entity.name}</span>
	</p>
	<PageHeader eyebrow={label} title={entity.name} lede={entity.description} meta={[entity.id]} />

	{#if slides.length}
		<section>
			<h2>{m.entities_related_assets()}</h2>
			<ImageCarousel {slides} />
		</section>
	{/if}
</main>

<style>
	.page {
		max-width: var(--content-max);
		margin: 0 auto;
		padding: 2.5rem var(--page-gutter) 4rem;
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

	@media (max-width: 480px) {
		.crumb {
			flex-wrap: wrap;
		}
	}
</style>
