<script lang="ts">
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import EntityGallery from '$lib/components/entities/EntityGallery.svelte';
	import { withLocale } from '$lib/utils/paths';
	import * as m from '$lib/paraglide/messages.js';

	let { data } = $props();
	const labels = {
		characters: m.entities_characters(),
		locations: m.entities_locations(),
		objects: m.entities_objects(),
		vehicles: m.entities_vehicles(),
		factions: m.entities_factions()
	};
	const label = $derived(labels[data.kind as keyof typeof labels]);
</script>

<main class="page">
	<PageHeader
		eyebrow={m.nav_entities()}
		title={label}
		lede={m.art_lede()}
		meta={[String(data.items.length)]}
	/>
	<nav class="kinds" aria-label={m.entities_kind_navigation()}>
		<a href={withLocale('/entities/characters')}>{m.entities_characters()}</a>
		<a href={withLocale('/entities/locations')}>{m.entities_locations()}</a>
		<a href={withLocale('/entities/objects')}>{m.entities_objects()}</a>
		<a href={withLocale('/entities/vehicles')}>{m.entities_vehicles()}</a>
		<a href={withLocale('/entities/factions')}>{m.entities_factions()}</a>
	</nav>
	<EntityGallery items={data.items} />
</main>

<style>
	.page {
		max-width: var(--content-max);
		margin: 0 auto;
		padding: 2.5rem var(--page-gutter) 4rem;
	}

	.kinds {
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem;
		margin-bottom: 1.5rem;
	}

	.kinds a {
		padding: 0.35rem 0.75rem;
		border: 1px solid var(--line);
		border-radius: 999px;
		text-decoration: none;
		color: var(--muted);
		font-size: 0.85rem;
	}

	.kinds a:hover {
		color: var(--cyan);
		border-color: var(--cyan);
	}
</style>
