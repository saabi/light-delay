<script lang="ts">
	import GenerationMediumPage from '$lib/components/generation/GenerationMediumPage.svelte';

	let { data } = $props();
</script>

<GenerationMediumPage
	scriptId={data.scriptId}
	medium="image"
	packages={data.packages}
	hasPlan={data.hasPlan}
/>
