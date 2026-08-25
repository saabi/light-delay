<script lang="ts">
	import type { Cue } from '$lib/types/script';
	import { getCharacterById } from '$lib/data/repositories/lookups';
	import { resolveLocalized } from '$lib/data/selectors/index';
	import { getLanguageState } from '$lib/state/language.svelte';

	let { cue }: { cue: Cue } = $props();

	const lang = $derived(getLanguageState());
</script>

{#if cue.type === 'action'}
	<p class="action">{cue.text}</p>
{:else if cue.type === 'dialogue'}
	{@const speaker = getCharacterById(cue.speakerId)}
	{@const resolved = resolveLocalized(cue.content, lang.dialogueLanguage, 'es')}
	<div class="dialogue">
		<p class="speaker">
			{speaker?.shortName ?? speaker?.name ?? cue.speakerId}
			{#if cue.presentation !== 'on_screen'}
				<span class="presentation">({cue.presentation})</span>
			{/if}
		</p>
		{#if resolved}
			<p class="line">{resolved.value.spokenText}</p>
			{#if resolved.usedFallback}
				<p class="fallback">Traducción no disponible; mostrando {resolved.resolvedLanguage}</p>
			{/if}
		{:else}
			<p class="fallback">Sin variante de diálogo</p>
		{/if}
	</div>
{:else if cue.type === 'sound'}
	<p class="meta">SFX — {cue.description}</p>
{:else if cue.type === 'music'}
	<p class="meta">Música — {cue.operation}: {cue.description}</p>
{:else if cue.type === 'silence'}
	<p class="meta">
		Silencio{#if cue.purpose}
			— {cue.purpose}{/if}
	</p>
{:else if cue.type === 'transition'}
	<p class="meta">
		Transición — {cue.transition}{#if cue.description}: {cue.description}{/if}
	</p>
{:else if cue.type === 'text'}
	{@const resolved = resolveLocalized(cue.content, lang.dialogueLanguage, 'es')}
	<p class="text-cue">[{cue.presentation}] {resolved?.value.text ?? '—'}</p>
{/if}

<style>
	.action {
		margin: 0.85rem 0;
		color: var(--ink);
	}

	.dialogue {
		margin: 1rem auto;
		max-width: 28rem;
		text-align: center;
	}

	.speaker {
		margin: 0 0 0.25rem;
		color: var(--gold);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-size: 0.9rem;
	}

	.presentation {
		color: var(--muted);
		font-weight: 500;
		text-transform: none;
	}

	.line {
		margin: 0;
		font-family: var(--font-serif);
	}

	.fallback,
	.meta,
	.text-cue {
		margin: 0.65rem 0;
		color: var(--muted);
		font-size: 0.9rem;
		font-style: italic;
	}
</style>
