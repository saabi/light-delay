<script lang="ts">
	import type { DocumentBlock } from '$lib/types/document';

	let { blocks }: { blocks: DocumentBlock[] } = $props();
</script>

<div class="document-viewer">
	{#each blocks as block, i (block.id ?? `${block.type}-${i}`)}
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
		{:else if block.type === 'table'}
			<div class="table-scroll">
				<table id={block.id}>
					{#if block.caption}<caption>{block.caption}</caption>{/if}
					<thead
						><tr
							>{#each block.headers as header, column (column)}<th scope="col">{header}</th
								>{/each}</tr
						></thead
					>
					<tbody
						>{#each block.rows as row, rowIndex (rowIndex)}<tr
								>{#each row as cell, column (column)}<td>{cell}</td>{/each}</tr
							>{/each}</tbody
					>
				</table>
			</div>
		{:else if block.type === 'beat'}
			<article class="beat" id={block.id}>
				<strong>{block.title}</strong>
				<p>{block.text}</p>
			</article>
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
		scroll-margin-top: calc(var(--site-top-offset) + 1rem);
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

	.table-scroll {
		margin: 1.25rem 0;
		overflow-x: auto;
		border: 1px solid var(--line);
		border-radius: var(--radius);
	}
	table {
		width: 100%;
		border-collapse: collapse;
		min-width: 34rem;
		font-size: 0.86rem;
	}
	caption {
		padding: 0.8rem 1rem;
		color: var(--muted);
		text-align: left;
	}
	th,
	td {
		padding: 0.7rem 0.85rem;
		border-bottom: 1px solid var(--line);
		text-align: left;
		vertical-align: top;
	}
	th {
		color: var(--cyan);
		background: var(--panel2);
		font: 700 0.72rem var(--font-mono);
		text-transform: uppercase;
	}
	tr:last-child td {
		border-bottom: 0;
	}
	.beat {
		margin: 1rem 0;
		padding: 1rem 1.1rem;
		border-left: 0.2rem solid var(--gold);
		background: var(--panel);
	}
	.beat strong {
		color: var(--gold);
	}
	.beat p {
		margin: 0.35rem 0 0;
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
