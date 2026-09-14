<script lang="ts">
	import type { GenerationPackage } from '$lib/data/selectors/generationPackages';
	import {
		packageManifestPayload,
		packageOutputStatus
	} from '$lib/data/selectors/generationPackages';
	import {
		generationAssetStatusLabel,
		generationBlockerLabel,
		generationOutputBadgeLabel,
		generationPromptBadgeLabel,
		generationRefsBadgeLabel,
		generationRefsBadgeTone,
		generationSourceLabel,
		packageDomId
	} from '$lib/data/selectors/generationPresentation';
	import ReferenceList from './ReferenceList.svelte';
	import OutputPreview from './OutputPreview.svelte';
	import * as m from '$lib/paraglide/messages.js';

	let {
		pkg,
		expanded,
		ontoggle
	}: {
		pkg: GenerationPackage;
		expanded: boolean;
		ontoggle: () => void;
	} = $props();

	const refsTone = $derived(generationRefsBadgeTone(pkg));
	const outputStatus = $derived(packageOutputStatus(pkg));
	const bodyId = $derived(`${packageDomId(pkg.id)}-body`);
	const expandLabel = $derived(expanded ? m.generation_collapse() : m.generation_expand());
	let copied = $state(false);

	async function copyPrompt() {
		if (!pkg.promptPreview) return;
		try {
			await navigator.clipboard.writeText(pkg.promptPreview);
			copied = true;
			window.setTimeout(() => {
				copied = false;
			}, 1600);
		} catch {
			copied = false;
		}
	}

	function downloadManifest() {
		const payload = JSON.stringify(packageManifestPayload(pkg), null, 2);
		const blob = new Blob([payload], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `${pkg.id.replace(/[^a-zA-Z0-9._-]+/g, '-')}-manifest.json`;
		link.rel = 'noopener';
		document.body.append(link);
		link.click();
		link.remove();
		window.setTimeout(() => {
			URL.revokeObjectURL(url);
		}, 1000);
	}
</script>

<article class="card" class:blocked={pkg.blockers.length > 0}>
	<button
		type="button"
		class="head"
		id={`${packageDomId(pkg.id)}-toggle`}
		aria-expanded={expanded}
		aria-controls={bodyId}
		aria-label={expandLabel}
		data-generation-package
		onclick={ontoggle}
	>
		<div class="titles">
			<h2>{pkg.title}</h2>
			<p class="source">{generationSourceLabel(pkg.source)}</p>
		</div>
		<ul class="badges" aria-label={m.generation_readiness()}>
			<li class:ok={pkg.promptReady} class:bad={!pkg.promptReady}>
				{generationPromptBadgeLabel(pkg)}
			</li>
			<li class:ok={refsTone === 'ok'} class:warn={refsTone === 'warn'} class:bad={refsTone === 'bad'}>
				{generationRefsBadgeLabel(pkg)}
			</li>
			<li class:ok={outputStatus === 'current'} class:warn={outputStatus === 'needs_review' || outputStatus === 'needs_regeneration'} class:bad={outputStatus === 'none' || outputStatus === 'missing_file'}>
				{generationOutputBadgeLabel(outputStatus)}
			</li>
			{#if pkg.runnable != null}
				<li
					class:ok={pkg.runnable}
					class:bad={!pkg.runnable}
					title={m.generation_runnable_hint()}
				>
					{pkg.runnable ? m.generation_runnable() : m.generation_not_runnable()}
				</li>
			{/if}
		</ul>
	</button>

	{#if expanded}
		<div class="body" id={bodyId} role="region" aria-labelledby={`${packageDomId(pkg.id)}-toggle`}>
			{#if pkg.promptStatus}
				<p class="prompt-status">{m.generation_prompt_status()}: <code>{pkg.promptStatus}</code></p>
			{/if}
			<section>
				<h3>{m.generation_prompt_section()}</h3>
				{#if pkg.promptPreview}
					<pre class="prompt">{pkg.promptPreview}</pre>
					<div class="actions">
						<button type="button" onclick={copyPrompt}>
							{copied ? m.generation_copied_prompt() : m.generation_copy_prompt()}
						</button>
						<button type="button" onclick={downloadManifest}>{m.generation_export_manifest()}</button>
					</div>
				{:else}
					<p class="muted">{m.generation_prompt_empty()}</p>
					<div class="actions">
						<button type="button" onclick={downloadManifest}>{m.generation_export_manifest()}</button>
					</div>
				{/if}
			</section>

			{#if pkg.blockers.length}
				<section>
					<h3>{m.generation_blockers()}</h3>
					<ul class="blockers">
						{#each pkg.blockers as blocker (blocker)}
							<li>{generationBlockerLabel(blocker)}</li>
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
									<span class="badge" class:ok={out.present && out.status === 'current'} class:warn={out.status === 'needs_review' || out.status === 'needs_regeneration' || out.status === 'needs_replacement'} class:bad={!out.present}>
										{generationAssetStatusLabel(out.status)}
									</span>
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

			<details class="tech">
				<summary>{m.generation_technical_details()}</summary>
				<dl>
					<div><dt>id</dt><dd><code>{pkg.id}</code></dd></div>
					<div><dt>source</dt><dd><code>{pkg.source}</code></dd></div>
					{#if pkg.blockers.length}
						<div>
							<dt>blockers</dt>
							<dd>
								{#each pkg.blockers as blocker (blocker)}
									<code>{blocker}</code>
								{/each}
							</dd>
						</div>
					{/if}
					{#each pkg.refs as ref (`tech-ref:${ref.role}:${ref.assetId}`)}
						<div>
							<dt>{ref.role}</dt>
							<dd><code>{ref.assetId || '—'}</code></dd>
						</div>
					{/each}
					{#each pkg.outputs as out (`tech-out:${out.label}:${out.assetId}`)}
						<div>
							<dt>{out.label}</dt>
							<dd><code>{out.assetId || '—'}</code></dd>
						</div>
					{/each}
				</dl>
			</details>
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

	.badges li,
	.badge {
		padding: 0.2rem 0.55rem;
		border-radius: 999px;
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		background: color-mix(in srgb, var(--line) 55%, transparent);
		color: var(--muted);
	}

	.badges li.ok,
	.badge.ok {
		background: color-mix(in srgb, #3d9a6a 28%, transparent);
		color: #b6f0d0;
	}

	.badges li.warn,
	.badge.warn {
		background: color-mix(in srgb, #d4a017 28%, transparent);
		color: #ffe9a8;
	}

	.badges li.bad,
	.badge.bad {
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

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
		margin-top: 0.55rem;
	}

	.actions button {
		padding: 0.3rem 0.65rem;
		border: 1px solid var(--line);
		border-radius: 999px;
		background: transparent;
		color: var(--ink);
		cursor: pointer;
		font-size: 0.8rem;
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
		align-items: center;
		margin-bottom: 0.4rem;
		font-size: 0.85rem;
	}

	.tech {
		border-top: 1px dashed var(--line);
		padding-top: 0.65rem;
		color: var(--muted);
		font-size: 0.82rem;
	}

	.tech summary {
		cursor: pointer;
	}

	.tech dl {
		margin: 0.55rem 0 0;
		display: grid;
		gap: 0.35rem;
	}

	.tech div {
		display: grid;
		grid-template-columns: minmax(6rem, 9rem) 1fr;
		gap: 0.5rem;
	}

	.tech dt {
		font-family: var(--font-mono);
		font-size: 0.75rem;
	}

	.tech dd {
		margin: 0;
	}

	.tech code {
		margin-right: 0.4rem;
	}
</style>
