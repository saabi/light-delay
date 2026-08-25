<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		variant = 'default',
		onclick,
		disabled = false,
		type = 'button',
		ariaLabel
	}: {
		children: Snippet;
		variant?: 'default' | 'primary';
		onclick?: (e: MouseEvent) => void;
		disabled?: boolean;
		type?: 'button' | 'submit';
		ariaLabel?: string;
	} = $props();
</script>

<button
	class="btn"
	class:primary={variant === 'primary'}
	{type}
	{disabled}
	{onclick}
	aria-label={ariaLabel}
>
	{@render children()}
</button>

<style>
	.btn {
		border: 1px solid var(--line);
		border-radius: 8px;
		background: #132837;
		color: var(--ink);
		padding: 0.55rem 0.85rem;
		cursor: pointer;
	}

	.btn:hover:not(:disabled),
	.btn:focus-visible {
		border-color: var(--cyan);
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn.primary {
		background: var(--cyan);
		color: #03111a;
		border-color: var(--cyan);
		font-weight: 800;
	}
</style>
