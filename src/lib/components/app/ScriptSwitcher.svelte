<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { listScripts } from '$lib/data/repositories/index';
	import { activeScriptIdFromParam, setActiveScriptId } from '$lib/state/active-script.svelte';
	import { decodeScriptId } from '$lib/utils/scriptId';
	import { hrefAfterScriptSwitch } from '$lib/utils/scriptRouting';

	const scripts = listScripts();

	const activeScriptId = $derived(activeScriptIdFromParam(page.params.scriptId));

	$effect(() => {
		const encoded = page.params.scriptId;
		if (encoded) setActiveScriptId(decodeScriptId(encoded));
	});

	function onChange(event: Event) {
		const select = event.currentTarget as HTMLSelectElement;
		const next = select.value;
		if (!next || next === activeScriptId) return;
		setActiveScriptId(next);
		void goto(hrefAfterScriptSwitch(page.url.pathname, next));
	}
</script>

<label class="switcher">
	<span class="label">Guion / cut</span>
	<select aria-label="Seleccionar guion o cut" value={activeScriptId} onchange={onChange}>
		{#each scripts as entry (entry.id)}
			<option value={entry.id}>{entry.label} ({entry.kind})</option>
		{/each}
	</select>
</label>

<style>
	.switcher {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		margin-bottom: 1.25rem;
	}

	.label {
		color: var(--muted);
		font: 700 0.68rem/1.2 var(--font-mono);
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	select {
		width: 100%;
		padding: 0.45rem 0.55rem;
		border: 1px solid var(--line);
		border-radius: 8px;
		background: var(--panel2);
		color: var(--ink);
		font: inherit;
		font-size: 0.82rem;
	}

	select:focus-visible {
		outline: 2px solid var(--cyan);
		outline-offset: 2px;
	}
</style>
