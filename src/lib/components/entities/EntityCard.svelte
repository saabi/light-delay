<script lang="ts">
	import ImageCarousel from '$lib/components/media/ImageCarousel.svelte';
	import { withBase, withLocale } from '$lib/utils/paths';

	let {
		href,
		title,
		description,
		imageSrc,
		imageSrcs,
		eyebrow
	}: {
		href: string;
		title: string;
		description?: string;
		imageSrc?: string;
		imageSrcs?: string[];
		eyebrow?: string;
	} = $props();

	const resolvedHref = $derived(withLocale(href));
	const sources = $derived(
		imageSrcs && imageSrcs.length > 0 ? imageSrcs : imageSrc ? [imageSrc] : []
	);
	const singleSrc = $derived(sources.length === 1 ? withBase(sources[0]) : undefined);
	const slides = $derived(
		sources.map((src, i) => ({
			id: `${src}-${i}`,
			src,
			alt: ''
		}))
	);
</script>

<a class="entity-card" href={resolvedHref}>
	{#if sources.length > 1}
		<div class="media">
			<ImageCarousel mode="auto" objectFit="cover" {slides} />
		</div>
	{:else if singleSrc}
		<img src={singleSrc} alt="" loading="lazy" />
	{:else}
		<div class="placeholder" aria-hidden="true"></div>
	{/if}
	<div class="body">
		{#if eyebrow}
			<span class="eyebrow">{eyebrow}</span>
		{/if}
		<h2>{title}</h2>
		{#if description}
			<p>{description}</p>
		{/if}
	</div>
</a>

<style>
	.entity-card {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--line);
		border-radius: 14px;
		background: linear-gradient(145deg, #112638, #0b1722);
		text-decoration: none;
		overflow: hidden;
		min-height: 220px;
		transition:
			transform 0.2s,
			border-color 0.2s;
	}

	.entity-card:hover {
		transform: translateY(-3px);
		border-color: var(--cyan);
	}

	.media,
	img,
	.placeholder {
		aspect-ratio: 16 / 10;
		width: 100%;
		object-fit: cover;
		background: var(--panel2);
	}

	.media {
		overflow: hidden;
	}

	.media :global(.carousel),
	.media :global(.frame),
	.media :global(.frame img) {
		height: 100%;
	}

	.media :global(.frame) {
		aspect-ratio: auto;
	}

	.body {
		padding: 1rem 1.1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		flex: 1;
	}

	.eyebrow {
		color: var(--cyan);
		font: 800 0.72rem var(--font-mono);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	h2 {
		margin: 0;
		font: 700 1.1rem/1.25 var(--font-serif);
	}

	p {
		margin: 0;
		color: var(--muted);
		font-size: 0.85rem;
		display: -webkit-box;
		line-clamp: 3;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
