<script lang="ts">
	import { withBase } from '$lib/utils/paths';
	import * as m from '$lib/paraglide/messages.js';

	type CarouselSlide = {
		id: string;
		src: string;
		alt: string;
		href?: string;
		caption?: string;
	};

	let {
		slides
	}: {
		slides: CarouselSlide[];
	} = $props();

	let index = $state(0);

	const count = $derived(slides.length);
	const hasMultiple = $derived(count > 1);
	const safeIndex = $derived(count === 0 ? 0 : ((index % count) + count) % count);
	const current = $derived(count > 0 ? slides[safeIndex] : undefined);
	const resolvedSrc = $derived(current ? withBase(current.src) : undefined);
	const statusLabel = $derived(
		count > 0 ? m.carousel_slide({ current: safeIndex + 1, total: count }) : ''
	);

	function go(delta: number) {
		if (!hasMultiple) return;
		index = safeIndex + delta;
	}

	function goTo(i: number) {
		if (i < 0 || i >= count) return;
		index = i;
	}

	function onNavKeydown(event: KeyboardEvent) {
		if (!hasMultiple) return;
		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			go(-1);
		} else if (event.key === 'ArrowRight') {
			event.preventDefault();
			go(1);
		}
	}
</script>

{#if current && resolvedSrc}
	<div class="carousel" role="region" aria-roledescription="carousel" aria-label={m.carousel_label()}>
		<div class="stage">
			{#if hasMultiple}
				<button
					type="button"
					class="nav prev"
					onclick={() => go(-1)}
					onkeydown={onNavKeydown}
					aria-label={m.carousel_prev()}
				>
					‹
				</button>
			{/if}

			<figure class="slide">
				{#if current.href}
					<a class="frame" href={current.href}>
						<img src={resolvedSrc} alt={current.alt} loading="lazy" />
					</a>
				{:else}
					<div class="frame">
						<img src={resolvedSrc} alt={current.alt} loading="lazy" />
					</div>
				{/if}
				{#if current.caption || hasMultiple}
					<figcaption>
						<span class="caption">{current.caption ?? current.alt}</span>
						{#if hasMultiple}
							<span class="status" aria-live="polite">{statusLabel}</span>
						{/if}
					</figcaption>
				{/if}
			</figure>

			{#if hasMultiple}
				<button
					type="button"
					class="nav next"
					onclick={() => go(1)}
					onkeydown={onNavKeydown}
					aria-label={m.carousel_next()}
				>
					›
				</button>
			{/if}
		</div>

		{#if hasMultiple}
			<div class="dots" role="group" aria-label={m.carousel_label()}>
				{#each slides as slide, i (slide.id)}
					<button
						type="button"
						class="dot"
						class:active={i === safeIndex}
						aria-current={i === safeIndex ? 'true' : undefined}
						aria-label={m.carousel_goto_slide({ n: i + 1 })}
						onclick={() => goTo(i)}
						onkeydown={onNavKeydown}
					></button>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	.stage {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 0.5rem;
	}

	.slide {
		margin: 0;
		min-width: 0;
	}

	.frame {
		display: flex;
		align-items: center;
		justify-content: center;
		aspect-ratio: 16 / 10;
		max-height: min(70vh, 560px);
		background: var(--panel2);
		border: 1px solid var(--line);
		border-radius: 12px;
		overflow: hidden;
		text-decoration: none;
	}

	.frame img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		display: block;
	}

	figcaption {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
		margin-top: 0.65rem;
		padding: 0 0.15rem;
	}

	.caption {
		font-size: 0.9rem;
		color: var(--muted);
	}

	.status {
		font-size: 0.8rem;
		color: var(--muted);
		white-space: nowrap;
	}

	.nav {
		appearance: none;
		border: 1px solid var(--line);
		background: var(--panel);
		color: var(--ink);
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 999px;
		font-size: 1.35rem;
		line-height: 1;
		cursor: pointer;
		display: grid;
		place-items: center;
		padding: 0;
	}

	.nav:hover {
		border-color: var(--cyan);
		color: var(--cyan);
	}

	.dots {
		display: flex;
		justify-content: center;
		gap: 0.45rem;
		margin-top: 0.85rem;
	}

	.dot {
		appearance: none;
		width: 0.55rem;
		height: 0.55rem;
		border-radius: 999px;
		border: 1px solid var(--line);
		background: var(--panel);
		padding: 0;
		cursor: pointer;
	}

	.dot.active {
		background: var(--cyan);
		border-color: var(--cyan);
	}

	@media (max-width: 560px) {
		.stage {
			display: flex;
			flex-wrap: wrap;
			justify-content: center;
			gap: 0.65rem;
		}

		.slide {
			flex: 1 1 100%;
			order: 1;
		}

		.nav.prev {
			order: 2;
		}

		.nav.next {
			order: 3;
		}
	}
</style>
