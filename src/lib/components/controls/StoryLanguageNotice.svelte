<script lang="ts">
	import { getLocale } from '$lib/paraglide/runtime.js';
	import * as m from '$lib/paraglide/messages.js';
</script>

{#if getLocale() === 'en'}
	<aside class="story-language-notice" role="note">
		<span aria-hidden="true">EN</span>
		<p>{m.language_story_notice()}</p>
	</aside>
{/if}

<style>
	.story-language-notice {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		margin: 0 0 1.5rem;
		padding: 0.8rem 1rem;
		border: 1px solid color-mix(in srgb, var(--gold) 45%, var(--line));
		border-radius: 0.75rem;
		background: color-mix(in srgb, var(--gold) 7%, var(--panel));
		color: var(--muted);
	}

	span {
		padding: 0.15rem 0.35rem;
		border-radius: 0.25rem;
		background: var(--gold);
		color: #111;
		font: 800 0.66rem var(--font-mono);
	}

	p {
		margin: 0;
		font-size: 0.84rem;
		line-height: 1.45;
	}
</style>
