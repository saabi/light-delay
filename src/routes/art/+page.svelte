<script lang="ts">
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import EntityGallery from '$lib/components/entities/EntityGallery.svelte';
	import {
		getEntityPrimaryThumbnailPath,
		listEntities,
		type EntityKind
	} from '$lib/data/repositories/lookups';
	import { withLocale } from '$lib/utils/paths';
	import { encodeRouteId } from '$lib/utils/routeId';
	import * as m from '$lib/paraglide/messages.js';

	const kinds: EntityKind[] = ['characters', 'locations', 'objects', 'vehicles'];

	const sections = kinds.map((kind) => ({
		kind,
		label: {
			characters: m.entities_characters(),
			locations: m.entities_locations(),
			objects: m.entities_objects(),
			vehicles: m.entities_vehicles(),
			factions: m.entities_factions()
		}[kind],
		items: listEntities(kind).map((e) => ({
			id: e.id,
			href: `/entities/${kind}/${encodeRouteId(e.id)}`,
			title: e.name,
			description: e.description,
			imageSrc: getEntityPrimaryThumbnailPath(e.referenceAssetIds),
			eyebrow: {
				characters: m.entities_characters(),
				locations: m.entities_locations(),
				objects: m.entities_objects(),
				vehicles: m.entities_vehicles(),
				factions: m.entities_factions()
			}[kind]
		}))
	}));
</script>

<main class="page">
	<PageHeader eyebrow={m.art_eyebrow()} title={m.art_title()} lede={m.art_lede()} />

	{#each sections as section (section.kind)}
		<section class="section">
			<div class="section-head">
				<h2>{section.label}</h2>
				<a href={withLocale(`/entities/${section.kind}`)}>{m.action_view_index()}</a>
			</div>
			<EntityGallery items={section.items} />
		</section>
	{/each}
</main>

<style>
	.page {
		max-width: var(--content-max);
		margin: 0 auto;
		padding: 2.5rem var(--page-gutter) 4rem;
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

	@media (max-width: 480px) {
		.section-head {
			align-items: flex-start;
			flex-direction: column;
			gap: 0.35rem;
		}
	}
</style>
