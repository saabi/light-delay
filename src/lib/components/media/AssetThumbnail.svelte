<script lang="ts">
	let {
		src,
		alt = '',
		aspect = '16/9'
	}: {
		src?: string;
		alt?: string;
		aspect?: string;
	} = $props();
</script>

{#if src}
	<img class="thumb" {src} {alt} style:aspect-ratio={aspect} loading="lazy" />
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
