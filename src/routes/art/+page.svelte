<script lang="ts">
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import EntityGallery from '$lib/components/entities/EntityGallery.svelte';
	import {
		ENTITY_KIND_LABELS,
		getEntityPrimaryImagePath,
		listEntities,
		type EntityKind
	} from '$lib/data/repositories/lookups';
	import { withBase } from '$lib/utils/paths';

	const kinds: EntityKind[] = ['characters', 'locations', 'objects', 'vehicles'];

	const sections = kinds.map((kind) => ({
		kind,
		label: ENTITY_KIND_LABELS[kind],
		items: listEntities(kind).map((e) => ({
			id: e.id,
			href: `/entities/${kind}/${e.id}`,
			title: e.name,
			description: e.description,
			imageSrc: getEntityPrimaryImagePath(e.referenceAssetIds),
			eyebrow: ENTITY_KIND_LABELS[kind]
		}))
	}));
</script>

<main class="page">
	<PageHeader
		eyebrow="Biblia visual"
		title="Arte"
		lede="Referencias visuales servidas desde /assets/ (migradas a static/assets)."
	/>

	{#each sections as section (section.kind)}
		<section class="section">
			<div class="section-head">
				<h2>{section.label}</h2>
				<a href={withBase(`/entities/${section.kind}`)}>Ver índice →</a>
			</div>
			<EntityGallery items={section.items} />
		</section>
	{/each}
</main>

<style>
	.page {
		max-width: var(--content-max);
		margin: 0 auto;
		padding: 2.5rem 1.75rem 4rem;
	}

	.section {
		margin: 2.25rem 0;
	}

	.section-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.section-head h2 {
		margin: 0;
		font: 700 1.35rem var(--font-serif);
	}

	.section-head a {
		color: var(--cyan);
		text-decoration: none;
		font-size: 0.9rem;
	}
</style>
