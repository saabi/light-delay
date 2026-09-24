<script lang="ts">
	import { withBase } from '$lib/utils/paths';

	let {
		src,
		alt = '',
		aspect = '16/9'
	}: {
		src?: string;
		alt?: string;
		aspect?: string;
	} = $props();

	const resolvedSrc = $derived(src ? withBase(src) : undefined);
</script>

{#if resolvedSrc}
	<img class="thumb" src={resolvedSrc} {alt} style:aspect-ratio={aspect} loading="lazy" />
{:else}
	<div class="thumb missing" style:aspect-ratio={aspect} aria-hidden="true"></div>
{/if}

<style>
	.thumb {
		width: 100%;
		object-fit: cover;
		border-radius: 8px;
		border: 1px solid var(--line);
		background: var(--panel2);
	}

	.missing {
		background: repeating-linear-gradient(
			-45deg,
			var(--panel2),
			var(--panel2) 8px,
			var(--panel) 8px,
			var(--panel) 16px
		);
	}
</style>
