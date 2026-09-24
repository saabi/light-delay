<script lang="ts">
	import OutlineProseBlocks from './OutlineProseBlocks.svelte';
	import { storyText } from '$lib/data/selectors/localized';
	import type { OutlineFramingSection } from '$lib/types/outline';

	let {
		section,
		language,
		initiallyOpen = false
	}: { section: OutlineFramingSection; language: string; initiallyOpen?: boolean } = $props();
</script>

<details id={section.id} open={initiallyOpen} class="framing-section">
	<summary>{storyText(section.title, language)}</summary>
	<div class="content">
		<OutlineProseBlocks blocks={section.blocks} {language} />
	</div>
</details>

<style>
	.framing-section {
		scroll-margin-top: 5.5rem;
		border: 1px solid var(--line);
		border-radius: 12px;
		background: var(--panel);
	}
	summary {
		cursor: pointer;
		padding: 1rem 1.2rem;
		color: var(--gold);
		font: 650 1.08rem/1.3 var(--font-serif);
	}
	.content {
		padding: 0 1.2rem 1.15rem;
	}
	@media (max-width: 640px) {
		summary {
			padding: 0.9rem 1rem;
		}
		.content {
			padding: 0 1rem 1rem;
		}
	}
</style>
