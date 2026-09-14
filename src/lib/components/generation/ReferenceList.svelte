<script lang="ts">
	import type { GenerationPackageRef } from '$lib/data/selectors/generationPackages';
	import OutputPreview from './OutputPreview.svelte';
	import * as m from '$lib/paraglide/messages.js';

	let { refs }: { refs: GenerationPackageRef[] } = $props();
</script>

{#if !refs.length}
	<p class="empty">{m.generation_no_refs()}</p>
{:else}
	<ul class="refs">
		{#each refs as ref (`${ref.role}:${ref.assetId}`)}
			<li class:missing={!ref.present}>
				<div class="meta">
					<span class="badge" class:ok={ref.present} class:bad={!ref.present}>
						{ref.present ? m.generation_ref_present() : m.generation_ref_missing()}
					</span>
					<code class="role">{ref.role}</code>
					<code class="id">{ref.assetId || '—'}</code>
				</div>
				{#if ref.present && ref.path}
					<div class="preview">
						<OutputPreview kind={ref.kind} path={ref.path} label={ref.role} present={true} />
					</div>
				{/if}
			</li>
		{/each}
	</ul>
{/if}

<style>
	.empty {
		color: var(--muted);
		font-size: 0.9rem;
	}

	.refs {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.75rem;
	}

	.refs li {
		padding: 0.75rem;
		border: 1px solid var(--line);
		border-radius: 10px;
		background: color-mix(in srgb, #112638 80%, transparent);
	}

	.refs li.missing {
		border-style: dashed;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem 0.75rem;
		align-items: center;
		margin-bottom: 0.5rem;
		font-size: 0.82rem;
	}

	.badge {
		padding: 0.15rem 0.45rem;
		border-radius: 999px;
		font-weight: 700;
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.badge.ok {
		background: color-mix(in srgb, #3d9a6a 28%, transparent);
		color: #b6f0d0;
	}

	.badge.bad {
		background: color-mix(in srgb, #c45c5c 28%, transparent);
		color: #ffd0d0;
	}

	.role,
	.id {
		font-family: var(--font-mono);
		color: var(--muted);
	}

	.preview {
		max-width: 320px;
	}
</style>
