<script lang="ts">
	import { storyText } from '$lib/data/selectors/localized';
	import type { ResolvedLifecycle } from '$lib/data/repositories/index';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import * as m from '$lib/paraglide/messages.js';

	let { lifecycle }: { lifecycle: ResolvedLifecycle } = $props();
	const title = $derived(
		lifecycle.relevance === 'authoritative'
			? m.lifecycle_authoritative()
			: lifecycle.status === 'obsolete'
				? m.lifecycle_obsolete()
				: lifecycle.status === 'deprecated'
					? m.lifecycle_deprecated()
					: m.lifecycle_review_required()
	);
	const reason = $derived(lifecycle.reason ? storyText(lifecycle.reason, getLocale()) : '');
</script>

{#if lifecycle.status !== 'active' || lifecycle.relevance === 'authoritative'}
	<aside class="notice" data-status={lifecycle.status} role="note">
		<strong>{title}</strong>
		{#if reason}<p>{reason}</p>{/if}
		{#if lifecycle.disposition === 'delete_after_gates'}
			<p class="disposition">{m.lifecycle_delete_after_gates()}</p>
		{:else if lifecycle.disposition === 'retain_for_salvage'}
			<p class="disposition">{m.lifecycle_retain_for_salvage()}</p>
		{/if}
	</aside>
{/if}

<style>
	.notice {
		margin: 0 0 1.25rem;
		padding: 0.9rem 1rem;
		border: 1px solid color-mix(in srgb, var(--cyan) 50%, var(--line));
		border-radius: 10px;
		background: color-mix(in srgb, var(--cyan) 7%, var(--panel));
	}
	.notice[data-status='deprecated'],
	.notice[data-status='obsolete'] {
		border-color: color-mix(in srgb, var(--gold) 65%, var(--line));
		background: color-mix(in srgb, var(--gold) 8%, var(--panel));
	}
	strong {
		color: var(--cyan);
		font: 750 0.75rem/1 var(--font-mono);
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	.notice[data-status='deprecated'] strong,
	.notice[data-status='obsolete'] strong {
		color: var(--gold);
	}
	p {
		margin: 0.45rem 0 0;
		line-height: 1.45;
	}
	.disposition {
		color: var(--muted);
		font-size: 0.84rem;
	}
</style>
