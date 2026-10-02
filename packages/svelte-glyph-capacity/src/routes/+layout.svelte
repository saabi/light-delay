<script lang="ts">
	let { children } = $props();
</script>

<svelte:head>
	<link rel="stylesheet" href="/fonts/archivo/faces.css" />
	<title>Svelte Glyph Capacity</title>
	<meta
		name="description"
		content="Compare responsive layout strategies with measured rendered glyph capacity."
	/>
</svelte:head>

{@render children()}
