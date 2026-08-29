<script lang="ts">
	import { withLocale } from '$lib/utils/paths';
	import { encodeScriptId } from '$lib/utils/scriptId';
	import { scriptLabel } from '$lib/data/selectors/scriptPresentation';
	import type { ScriptRegistryEntry } from '$lib/types/project';
	import * as m from '$lib/paraglide/messages.js';

	let {
		scripts,
		reportId,
		summaries = {}
	}: {
		scripts: ScriptRegistryEntry[];
		reportId: string;
		summaries?: Record<string, string>;
	} = $props();
</script>

<ul class="script-links">
	{#each scripts as entry (entry.id)}
		<li>
			<div>
				<a href={withLocale(`/reports/${reportId}/${encodeScriptId(entry.id)}`)}>
					{scriptLabel(entry)}
				</a>
				{#if summaries[entry.id]}
					<small>{summaries[entry.id]}</small>
				{/if}
			</div>
			<div class="actions">
				<a href={withLocale(`/script/${encodeScriptId(entry.id)}`)}>{m.reports_open_script()}</a>
				<a href={withLocale(`/animatic/${encodeScriptId(entry.id)}`)}>{m.reports_open_animatic()}</a>
			</div>
		</li>
	{/each}
</ul>

<style>
	.script-links {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.5rem;
	}

	li {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 1rem;
		border: 1px solid var(--line);
		border-radius: 10px;
		background: var(--panel);
	}

	li a {
		color: var(--ink);
		text-decoration: none;
	}

	.actions {
		display: flex;
		gap: 0.75rem;
		flex-shrink: 0;
	}

	.actions a {
		color: var(--gold);
		font-size: 0.85rem;
	}

	small {
		display: block;
		margin-top: 0.25rem;
		color: var(--muted);
		font-size: 0.78rem;
	}
</style>
