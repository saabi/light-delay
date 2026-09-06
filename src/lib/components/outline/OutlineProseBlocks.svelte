<script lang="ts">
	import { storyText } from '$lib/data/selectors/localized';
	import { getCharacters } from '$lib/data/repositories/index';
	import type { StoryText } from '$lib/types/i18n';
	import type { OutlineProseBlock } from '$lib/types/outline';

	let { blocks, language }: { blocks: OutlineProseBlock[]; language: string } = $props();
	const text = (value: StoryText) => storyText(value, language);
	const characters = getCharacters().characters;
	const speakerName = (speakerId: string | undefined) => {
		const character = characters.find((item) => item.id === speakerId);
		return character ? storyText(character.name, language) : undefined;
	};
</script>

<div class="prose">
	{#each blocks as block, index (`${block.type}:${index}`)}
		{#if block.type === 'paragraph'}
			<p>{text(block.text)}</p>
		{:else if block.type === 'blockquote'}
			<blockquote>
				{#if speakerName(block.speakerId)}
					<cite>{speakerName(block.speakerId)}</cite>
				{/if}
				<span>{text(block.text)}</span>
			</blockquote>
		{:else if block.type === 'heading' && block.level === 3}
			<h3>{text(block.text)}</h3>
		{:else if block.type === 'heading'}
			<h4>{text(block.text)}</h4>
		{:else if block.ordered}
			<ol>
				{#each block.items as item}<li>{text(item)}</li>{/each}
			</ol>
		{:else}
			<ul>
				{#each block.items as item}<li>{text(item)}</li>{/each}
			</ul>
		{/if}
	{/each}
</div>

<style>
	.prose {
		max-width: 58rem;
		color: var(--text);
		line-height: 1.68;
	}
	p {
		margin: 0.7rem 0;
		white-space: pre-line;
	}
	h3,
	h4 {
		margin: 1.35rem 0 0.55rem;
		font-family: var(--font-serif);
	}
	h3 {
		font-size: 1.12rem;
	}
	h4 {
		font-size: 1rem;
	}
	ul,
	ol {
		margin: 0.7rem 0;
		padding-left: 1.4rem;
	}
	li + li {
		margin-top: 0.35rem;
	}
	blockquote {
		display: grid;
		gap: 0.22rem;
		margin: 0.9rem 0;
		padding: 0.2rem 0 0.2rem 1rem;
		border-left: 3px solid var(--cyan);
		color: var(--muted);
		font-family: var(--font-serif);
		font-size: 1.04rem;
	}
	cite {
		color: var(--gold);
		font: 650 0.78rem/1.2 var(--font-sans);
		font-style: normal;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
</style>
