<script lang="ts">
	let {
		valueMs,
		onchange
	}: {
		valueMs: number;
		onchange: (ms: number) => void;
	} = $props();
</script>

<label class="duration">
	<span>Duración (s)</span>
	<input
		type="number"
		min="0"
		step="0.1"
		value={Math.round(valueMs) / 1000}
		onchange={(e) => {
			const n = Number((e.currentTarget as HTMLInputElement).value);
			if (!Number.isFinite(n) || n < 0) return;
			onchange(Math.round(n * 1000));
		}}
	/>
</label>

<style>
	.duration {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-weight: 700;
	}

	input {
		width: 5.5rem;
		padding: 0.4rem 0.5rem;
		border: 1px solid var(--line);
		border-radius: 8px;
		background: var(--panel2);
		color: var(--ink);
		text-transform: none;
		letter-spacing: normal;
		font-weight: 500;
	}
</style>
