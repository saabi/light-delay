<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	let { warnings }: { warnings: string[] } = $props();
</script>

{#if warnings.length}
	<ul class="warnings" aria-label={m.animatic_continuity()}>
		{#each warnings as warning, i (i)}
			<li>{warning}</li>
		{/each}
	</ul>
{/if}

<style>
	.warnings {
		margin: 1rem 0 0;
		padding: 0.85rem 1rem;
		list-style: none;
		border: 1px solid var(--gold);
		border-radius: var(--radius);
		background: #1a1508;
		color: var(--gold);
		font-size: 0.88rem;
	}

	li + li {
		margin-top: 0.35rem;
	}
</style>
