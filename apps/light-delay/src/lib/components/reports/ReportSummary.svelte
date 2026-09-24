<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';

	let { summary }: { summary: Record<string, unknown> } = $props();
</script>

<section class="summary">
	<h2>{m.reports_summary()}</h2>
	<dl>
		{#each Object.entries(summary) as [key, value] (key)}
			{#if key !== 'consoleLine'}
				<div>
					<dt>{key}</dt>
					<dd>
						{#if typeof value === 'object' && value !== null}
							<pre>{JSON.stringify(value, null, 2)}</pre>
						{:else}
							{String(value)}
						{/if}
					</dd>
				</div>
			{/if}
		{/each}
	</dl>
	{#if summary.consoleLine}
		<p class="console">{summary.consoleLine}</p>
	{/if}
</section>

<style>
	.summary {
		margin-bottom: 2rem;
		padding: 1rem 1.25rem;
		border: 1px solid var(--line);
		border-radius: 12px;
		background: var(--panel);
	}

	h2 {
		margin: 0 0 1rem;
		font: 700 1.1rem var(--font-serif);
	}

	dl {
		margin: 0;
		display: grid;
		gap: 0.5rem;
	}

	dl > div {
		display: grid;
		grid-template-columns: minmax(8rem, 12rem) 1fr;
		gap: 0.5rem 1rem;
	}

	dt {
		color: var(--muted);
		font-size: 0.78rem;
		text-transform: uppercase;
	}

	dd {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 0.85rem;
	}

	pre {
		margin: 0;
		white-space: pre-wrap;
		word-break: break-word;
		font-size: 0.78rem;
	}

	.console {
		margin: 1rem 0 0;
		padding-top: 0.75rem;
		border-top: 1px solid var(--line);
		color: var(--cyan);
		font-family: var(--font-mono);
		font-size: 0.85rem;
	}
</style>
