<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { StudioCue } from '$lib/studio/types';

	let {
		cue,
		candidateTakeId = null,
		acceptDisabled = true,
		restoreDisabled = true,
		listenDisabled = true,
		listeningTakeId = null,
		onaccept,
		onrestore,
		onlisten
	}: {
		cue: StudioCue | null;
		candidateTakeId?: string | null;
		acceptDisabled?: boolean;
		restoreDisabled?: boolean;
		listenDisabled?: boolean;
		listeningTakeId?: string | null;
		onaccept: (takeId: string) => void;
		onrestore: () => void;
		onlisten: (takeId: string) => void;
	} = $props();

	const staleReplacement = $derived(Boolean(cue?.replacement?.stale));
	const staleCandidate = $derived(
		Boolean(cue?.takes.some((take) => take.takeId === candidateTakeId && take.stale))
	);
</script>

<section class="line" aria-label={m.studio_line()}>
	<h2>{m.studio_line()}</h2>
	{#if cue}
		{#if !cue.recordable}
			<p class="notice">{m.studio_not_recordable()}</p>
		{/if}
		{#if staleReplacement || staleCandidate}
			<p class="warning">{m.studio_stale_take()}</p>
		{/if}
		<p class="label">{m.studio_spoken()}</p>
		<p class="spoken">{cue.text}</p>
		{#if cue.instruct}
			<p class="label">{m.studio_instruct()}</p>
			<p class="instruct">{cue.instruct}</p>
		{:else}
			<p class="muted">{m.studio_instruct_none()}</p>
		{/if}
		<h3>{m.studio_takes()}</h3>
		<ul>
			{#each cue.takes as take (take.takeId)}
				<li class={['take', { stale: take.stale }]}>
					<span>{m.studio_take({ id: take.takeId })}</span>
					{#if take.stale}
						<span class="warning">{m.studio_stale_take()}</span>
					{:else}
						<button
							type="button"
							disabled={listenDisabled}
							aria-pressed={listeningTakeId === take.takeId}
							onclick={() => onlisten(take.takeId)}>{m.studio_listen()}</button
						>
					{/if}
					<button
						type="button"
						disabled={take.stale || acceptDisabled}
						onclick={() => onaccept(take.takeId)}>{m.studio_accept()}</button
					>
				</li>
			{/each}
		</ul>
		<div class="actions">
			<button
				type="button"
				disabled={acceptDisabled || !candidateTakeId || staleCandidate}
				onclick={() => candidateTakeId && onaccept(candidateTakeId)}>{m.studio_accept()}</button
			>
			<button type="button" disabled={restoreDisabled} onclick={onrestore}>{m.studio_restore()}</button>
		</div>
	{/if}
</section>

<style>
	.line {
		display: grid;
		gap: 0.65rem;
		padding: 1rem;
		border: 1px solid var(--line);
		border-radius: 12px;
		background: var(--panel);
		color: var(--ink);
	}

	h2,
	h3 {
		margin: 0;
	}

	h2 {
		font-size: 1.05rem;
	}

	h3 {
		margin-top: 0.5rem;
		font-size: 0.92rem;
	}

	.label {
		margin: 0;
		color: var(--cyan);
		font-size: 0.75rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.spoken,
	.instruct {
		margin: 0;
		white-space: pre-wrap;
	}

	.muted,
	.notice {
		margin: 0;
		color: var(--muted);
	}

	.warning {
		margin: 0;
		color: var(--red);
	}

	ul {
		display: grid;
		gap: 0.4rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.take {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem;
		padding: 0.45rem 0;
		border-top: 1px solid var(--line);
		font-size: 0.85rem;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	button {
		padding: 0.4rem 0.7rem;
		border: 1px solid var(--line);
		border-radius: 8px;
		background: transparent;
		color: var(--ink);
		cursor: pointer;
	}

	button[aria-pressed='true'] {
		border-color: var(--cyan);
		color: var(--cyan);
	}

	button:disabled {
		color: var(--muted);
		cursor: not-allowed;
	}
</style>
