<script lang="ts">
	import { generationHrefsForShot } from '$lib/data/selectors/generationPackages';
	import * as m from '$lib/paraglide/messages.js';

	let {
		scriptId,
		shotId
	}: {
		scriptId: string;
		shotId: string;
	} = $props();

	const hrefs = $derived(generationHrefsForShot(scriptId, shotId));
</script>

<nav class="gen-links" aria-label={m.generation_shot_package_links()} data-shot-generation-links>
	<a
		href={hrefs.image}
		data-generation-medium="image"
		aria-label={m.generation_open_image_package()}>{m.generation_tab_image()}</a
	>
	<a
		href={hrefs.video}
		data-generation-medium="video"
		aria-label={m.generation_open_video_package()}>{m.generation_tab_video()}</a
	>
	{#if hrefs.audio}
		<a
			href={hrefs.audio}
			data-generation-medium="audio"
			aria-label={m.generation_open_audio_package()}>{m.generation_tab_audio()}</a
		>
	{/if}
</nav>

<style>
	.gen-links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin: 0 0 0.65rem;
	}

	.gen-links a {
		padding: 0.15rem 0.5rem;
		border: 1px solid var(--line);
		border-radius: 999px;
		color: var(--cyan);
		font: 700 0.68rem var(--font-mono);
		text-transform: uppercase;
		letter-spacing: 0.03em;
		text-decoration: none;
	}

	.gen-links a:hover {
		border-color: var(--cyan);
	}
</style>
