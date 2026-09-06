<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { StudioMachineState } from '$lib/studio/types';

	let {
		machine,
		canRecord,
		onplay,
		onpause,
		onstop,
		onrecord,
		onprev,
		onnext
	}: {
		machine: StudioMachineState;
		canRecord: boolean;
		onplay: () => void;
		onpause: () => void;
		onstop: () => void;
		onrecord: () => void;
		onprev: () => void;
		onnext: () => void;
	} = $props();

	const idle = $derived(machine === 'offline' || machine === 'loading');
	const locked = $derived(
		idle || machine === 'converting' || machine === 'assembling'
	);
</script>

<div class="transport" role="group" aria-label={m.studio_transport()}>
	<button type="button" disabled={locked || machine === 'playing'} onclick={onplay}
		>{m.studio_play()}</button
	>
	<button type="button" disabled={machine !== 'playing'} onclick={onpause}>{m.studio_pause()}</button>
	<button
		type="button"
		disabled={idle || (machine !== 'playing' && machine !== 'recording')}
		onclick={onstop}>{m.studio_stop()}</button
	>
	<button
		type="button"
		disabled={!canRecord || locked}
		class={{ recording: machine === 'recording' }}
		onclick={onrecord}>{m.studio_record()}</button
	>
	<button type="button" disabled={locked || machine === 'recording'} onclick={onprev}
		>{m.studio_prev()}</button
	>
	<button type="button" disabled={locked || machine === 'recording'} onclick={onnext}
		>{m.studio_next()}</button
	>
</div>

<style>
	.transport {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
		padding: 0.75rem;
		border: 1px solid var(--line);
		border-radius: 12px;
		background: var(--panel);
	}

	button {
		padding: 0.45rem 0.75rem;
		border: 1px solid var(--line);
		border-radius: 8px;
		background: transparent;
		color: var(--ink);
		cursor: pointer;
	}

	button:disabled {
		color: var(--muted);
		cursor: not-allowed;
	}

	button.recording {
		border-color: var(--red);
		color: var(--red);
	}
</style>
