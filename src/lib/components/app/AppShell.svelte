<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		rail
	}: {
		children: Snippet;
		rail?: Snippet;
	} = $props();
</script>

<div class="shell" class:has-rail={!!rail}>
	{#if rail}
		<aside class="rail">
			{@render rail()}
		</aside>
	{/if}
	<div class="main">
		{@render children()}
	</div>
</div>

<style>
	.shell {
		min-height: 100vh;
		display: grid;
		grid-template-columns: 1fr;
	}

	.shell.has-rail {
		grid-template-columns: 260px minmax(0, 1fr);
	}

	.rail {
		position: sticky;
		top: 0;
		height: 100vh;
		padding: 1.75rem 1.35rem;
		border-right: 1px solid var(--line);
		background: var(--rail);
		backdrop-filter: blur(14px);
		overflow: auto;
	}

	.main {
		min-width: 0;
	}

	@media (max-width: 850px) {
		.shell.has-rail {
			grid-template-columns: 1fr;
		}

		.rail {
			position: relative;
			height: auto;
			border-right: 0;
			border-bottom: 1px solid var(--line);
		}
	}
</style>
