<script lang="ts">
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import EntityGallery from '$lib/components/entities/EntityGallery.svelte';

	let { data } = $props();
</script>

<main class="page">
	<PageHeader
		eyebrow="Entidades"
		title={data.label}
		lede={`Índice de ${data.label.toLowerCase()} del proyecto.`}
		meta={[`${data.items.length} registros`]}
	/>
	<nav class="kinds" aria-label="Tipos de entidad">
		<a href="/entities/characters">Personajes</a>
		<a href="/entities/locations">Localizaciones</a>
		<a href="/entities/objects">Objetos</a>
		<a href="/entities/vehicles">Vehículos</a>
		<a href="/entities/factions">Facciones</a>
	</nav>
	<EntityGallery items={data.items} />
</main>

<style>
	.page {
		max-width: var(--content-max);
		margin: 0 auto;
		padding: 2.5rem 1.75rem 4rem;
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
