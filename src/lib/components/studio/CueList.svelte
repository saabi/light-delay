<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { StudioCue } from '$lib/studio/types';

	let {
		cues,
		selectedId,
		onselect
	}: {
		cues: StudioCue[];
		selectedId: string | null;
		onselect: (id: string) => void;
	} = $props();

	function statusLabel(cue: StudioCue): string {
		if (cue.replacement?.stale || cue.replacement?.status === 'stale') {
			return m.studio_stale_take();
		}
		if (cue.replacement?.status === 'accepted') {
			return m.studio_accepted();
		}
		return m.studio_original();
	}
</script>

<ul class="cue-list">
	{#each cues as cue (cue.id)}
		<li>
			<button
				type="button"
				class={['cue', { selected: cue.id === selectedId }]}
				onclick={() => onselect(cue.id)}
			>
				<span class="meta">
					<strong>{cue.speaker}</strong>
					<span class="status">{statusLabel(cue)}</span>
				</span>
				<span class="text">{cue.text}</span>
			</button>
		</li>
	{/each}
</ul>

<style>
	.cue-list {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		height: 70vh;
		margin: 0;
		padding: 0;
		overflow: auto;
		list-style: none;
	}

	.cue {
		display: grid;
		gap: 0.2rem;
		width: 100%;
		padding: 0.55rem 0.65rem;
		border: 1px solid var(--line);
		border-radius: 8px;
		background: var(--panel);
		color: var(--ink);
		text-align: left;
		cursor: pointer;
	}

	.cue.selected {
		border-color: var(--cyan);
		color: var(--cyan);
	}

	.meta {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		font-size: 0.78rem;
	}

	.status {
		color: var(--muted);
		font-weight: 400;
	}

	.cue.selected .status {
		color: var(--cyan);
	}

	.text {
		overflow: hidden;
		color: var(--muted);
		font-size: 0.82rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
