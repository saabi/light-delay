<script lang="ts">
	import EntityCard from './EntityCard.svelte';

	type Item = {
		id: string;
		href: string;
		title: string;
		description?: string;
		imageSrc?: string;
		imageSrcs?: string[];
		eyebrow?: string;
	};

	let { items }: { items: Item[] } = $props();
</script>

<div class="gallery">
	{#each items as item (item.id)}
		<EntityCard
			href={item.href}
			title={item.title}
			description={item.description}
			imageSrc={item.imageSrc}
			imageSrcs={item.imageSrcs}
			eyebrow={item.eyebrow}
		/>
	{/each}
</div>

<style>
	.gallery {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr));
		gap: 1rem;
	}
</style>
