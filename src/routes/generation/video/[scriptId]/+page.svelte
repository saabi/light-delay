<script lang="ts">
	import GenerationMediumPage from '$lib/components/generation/GenerationMediumPage.svelte';

	let { data } = $props();
</script>

<GenerationMediumPage
	scriptId={data.scriptId}
	medium="video"
	packages={data.packages}
	hasPlan={data.hasPlan}
/>
