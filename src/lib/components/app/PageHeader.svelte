<script lang="ts">
	let {
		eyebrow,
		title,
		lede,
		meta
	}: {
		eyebrow?: string;
		title: string;
		lede?: string;
		meta?: string[];
	} = $props();
</script>

<header class="page-header">
	{#if eyebrow}
		<p class="eyebrow">{eyebrow}</p>
	{/if}
	<h1>{title}</h1>
	{#if lede}
		<p class="lede">{lede}</p>
	{/if}
	{#if meta?.length}
		<ul class="meta">
			{#each meta as item (item)}
				<li>{item}</li>
			{/each}
		</ul>
	{/if}
</header>

<style>
	.page-header {
		margin-bottom: 2rem;
	}

	.eyebrow {
		margin: 0 0 0.5rem;
		color: var(--cyan);
		font: 800 0.73rem/1.2 var(--font-mono);
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0 0 0.75rem;
		font: 700 clamp(1.85rem, 4vw, 3rem) / 1.05 var(--font-serif);
		letter-spacing: -0.03em;
	}

	.lede {
		margin: 0;
		max-width: 42rem;
		color: var(--muted);
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 1rem 0 0;
		padding: 0;
		list-style: none;
	}

	.meta li {
		padding: 0.25rem 0.65rem;
		border: 1px solid var(--line);
		border-radius: 999px;
		font-size: 0.78rem;
		color: var(--gold);
	}
</style>
