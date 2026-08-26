<script lang="ts">
	import type { DocumentBlock } from '$lib/types/document';

	let { blocks }: { blocks: DocumentBlock[] } = $props();
</script>

<div class="document-viewer">
	{#each blocks as block, i (i)}
		{#if block.type === 'heading'}
			{#if block.level === 1}
				<h1 id={block.id}>{block.text}</h1>
			{:else if block.level === 2}
				<h2 id={block.id}>{block.text}</h2>
			{:else if block.level === 3}
				<h3 id={block.id}>{block.text}</h3>
			{:else}
				<h4 id={block.id}>{block.text}</h4>
			{/if}
		{:else if block.type === 'paragraph'}
			<p>{block.text}</p>
		{:else if block.type === 'list'}
			{#if block.ordered}
				<ol>
					{#each block.items as item, j (j)}
						<li>{item}</li>
					{/each}
				</ol>
			{:else}
				<ul>
					{#each block.items as item, j (j)}
						<li>{item}</li>
					{/each}
				</ul>
			{/if}
		{:else if block.type === 'blockquote'}
			<blockquote>{block.text}</blockquote>
		{:else if block.type === 'callout'}
			<aside class="callout" data-kind={block.kind ?? 'note'}>
				{block.text}
			</aside>
		{:else if block.type === 'hr'}
			<hr />
		{/if}
	{/each}
</div>

<style>
	.document-viewer {
		max-width: var(--max);
	}

	h1,
	h2,
	h3,
	h4 {
		font-family: var(--font-serif);
		line-height: 1.2;
		scroll-margin-top: calc(var(--header-height) + 1rem);
		overflow-wrap: anywhere;
	}

	h2 {
		margin-top: 2rem;
		color: var(--cyan);
	}

	h3 {
		margin-top: 1.5rem;
		color: var(--gold);
	}

	p,
	li {
		color: var(--ink);
	}

	blockquote,
	.callout {
		margin: 1.25rem 0;
		padding: 1rem 1.15rem;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--panel);
		color: var(--muted);
	}

	.callout[data-kind='warning'] {
		border-color: var(--gold);
		color: var(--ink);
	}

	hr {
		border: 0;
		border-top: 1px solid var(--line);
		margin: 2rem 0;
	}

	ul,
	ol {
		padding-left: 1.25rem;
	}

	@media (max-width: 480px) {
		blockquote,
		.callout {
			padding: 0.85rem;
		}

		ul,
		ol {
			padding-left: 1.05rem;
		}
	}
</style>
