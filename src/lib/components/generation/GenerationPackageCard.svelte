<script lang="ts">
	import type { GenerationPackage } from '$lib/data/selectors/generationPackages';
	import { packageHasOutput, packageRefsComplete } from '$lib/data/selectors/generationPackages';
	import ReferenceList from './ReferenceList.svelte';
	import OutputPreview from './OutputPreview.svelte';
	import * as m from '$lib/paraglide/messages.js';

	let { pkg }: { pkg: GenerationPackage } = $props();

	let open = $state(false);
	const refsOk = $derived(packageRefsComplete(pkg));
	const hasOut = $derived(packageHasOutput(pkg));
</script>

<article class="card" class:blocked={pkg.blockers.length > 0}>
	<button type="button" class="head" aria-expanded={open} onclick={() => (open = !open)}>
		<div class="titles">
			<h2>{pkg.title}</h2>
			<p class="source">{pkg.source} · <code>{pkg.id}</code></p>
		</div>
		<ul class="badges" aria-label={m.generation_readiness()}>
			<li class:ok={pkg.promptReady} class:bad={!pkg.promptReady}>
				{pkg.promptReady ? m.generation_prompt_ready() : m.generation_prompt_not_ready()}
			</li>
			<li class:ok={refsOk} class:bad={!refsOk}>
				{refsOk ? m.generation_refs_complete() : m.generation_refs_incomplete()}
			</li>
			<li class:ok={hasOut} class:bad={!hasOut}>
				{hasOut ? m.generation_has_output() : m.generation_no_output()}
			</li>
			{#if pkg.runnable != null}
				<li class:ok={pkg.runnable} class:bad={!pkg.runnable}>
					{pkg.runnable ? m.generation_runnable() : m.generation_not_runnable()}
				</li>
			{/if}
		</ul>
	</button>

	{#if open}
		<div class="body">
			{#if pkg.promptStatus}
				<p class="prompt-status">{m.generation_prompt_status()}: <code>{pkg.promptStatus}</code></p>
			{/if}
			<section>
				<h3>{m.generation_prompt_section()}</h3>
				{#if pkg.promptPreview}
					<pre class="prompt">{pkg.promptPreview}</pre>
				{:else}
					<p class="muted">{m.generation_prompt_empty()}</p>
				{/if}
			</section>

			{#if pkg.blockers.length}
				<section>
					<h3>{m.generation_blockers()}</h3>
					<ul class="blockers">
						{#each pkg.blockers as blocker (blocker)}
							<li><code>{blocker}</code></li>
						{/each}
					</ul>
				</section>
			{/if}

			<section>
				<h3>{m.generation_refs_section()}</h3>
				<ReferenceList refs={pkg.refs} />
			</section>

			<section>
				<h3>{m.generation_outputs_section()}</h3>
				{#if !pkg.outputs.length}
					<p class="muted">{m.generation_no_output()}</p>
				{:else}
					<ul class="outputs">
						{#each pkg.outputs as out (`${out.label}:${out.assetId}`)}
							<li>
								<div class="out-meta">
									<strong>{out.label}</strong>
									<code>{out.assetId || '—'}</code>
								</div>
								<OutputPreview
									kind={out.kind || pkg.medium}
									path={out.path}
									label={out.label}
									present={out.present}
								/>
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		</div>
	{/if}
</article>

<style>
	.card {
		border: 1px solid var(--line);
		border-radius: 14px;
		background: linear-gradient(145deg, #112638, #0b1722);
		overflow: hidden;
	}

	.card.blocked {
		border-color: color-mix(in srgb, #c45c5c 45%, var(--line));
	}

	.head {
		width: 100%;
		display: grid;
		gap: 0.75rem;
		padding: 1rem 1.1rem;
		border: 0;
		background: transparent;
		color: inherit;
		text-align: left;
		cursor: pointer;
	}

	.titles h2 {
		margin: 0;
		font-size: 1.05rem;
	}

	.source {
		margin: 0.25rem 0 0;
		color: var(--muted);
		font-size: 0.8rem;
	}

	.badges {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.badges li {
		padding: 0.2rem 0.55rem;
		border-radius: 999px;
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		background: color-mix(in srgb, var(--line) 55%, transparent);
		color: var(--muted);
	}

	.badges li.ok {
		background: color-mix(in srgb, #3d9a6a 28%, transparent);
		color: #b6f0d0;
	}

	.badges li.bad {
		background: color-mix(in srgb, #c45c5c 28%, transparent);
		color: #ffd0d0;
	}

	.body {
		padding: 0 1.1rem 1.15rem;
		display: grid;
		gap: 1rem;
		border-top: 1px solid var(--line);
	}

	.body h3 {
		margin: 0 0 0.45rem;
		font-size: 0.85rem;
		color: var(--cyan);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.prompt {
		margin: 0;
		padding: 0.75rem;
		max-height: 220px;
		overflow: auto;
		white-space: pre-wrap;
		border-radius: 8px;
		background: #0a121a;
		font: 0.8rem/1.4 var(--font-mono);
	}

	.muted,
	.prompt-status {
		color: var(--muted);
		font-size: 0.9rem;
	}

	.blockers {
		margin: 0;
		padding-left: 1.1rem;
		display: grid;
		gap: 0.25rem;
		font-size: 0.85rem;
	}

	.outputs {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.75rem;
	}

	.out-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 0.4rem;
		font-size: 0.85rem;
	}
</style>
