<script lang="ts">
	import {
		getLanguageState,
		setDialogueLanguage,
		setSubtitleLanguage
	} from '$lib/state/language.svelte';

	const languages = [
		{ tag: 'es', label: 'Español' },
		{ tag: 'en', label: 'English' }
	];

	const lang = $derived(getLanguageState());
</script>

<div class="lang-controls" role="group" aria-label="Idioma de diálogo y subtítulos">
	<label>
		Diálogo
		<select
			value={lang.dialogueLanguage}
			onchange={(e) => setDialogueLanguage((e.currentTarget as HTMLSelectElement).value)}
		>
			{#each languages as option (option.tag)}
				<option value={option.tag}>{option.label}</option>
			{/each}
		</select>
	</label>
	<label>
		Subtítulos
		<select
			value={lang.subtitleLanguage ?? 'off'}
			onchange={(e) => {
				const v = (e.currentTarget as HTMLSelectElement).value;
				setSubtitleLanguage(v === 'off' ? null : v);
			}}
		>
			<option value="off">Desactivados</option>
			{#each languages as option (option.tag)}
				<option value={option.tag}>{option.label}</option>
			{/each}
		</select>
	</label>
</div>

<style>
	.lang-controls {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: end;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.78rem;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-weight: 700;
	}

	select {
		min-width: 9rem;
		padding: 0.45rem 0.6rem;
		border: 1px solid var(--line);
		border-radius: 8px;
		background: var(--panel2);
		color: var(--ink);
		text-transform: none;
		letter-spacing: normal;
		font-weight: 500;
	}
</style>
