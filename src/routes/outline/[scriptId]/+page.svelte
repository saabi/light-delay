<script lang="ts">
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import {
		getLocalizedOutline,
		getProject,
		listLocalizedScripts,
		outlinePathForScript
	} from '$lib/data/repositories/index';
	import { getLanguageState } from '$lib/state/language.svelte';
	import { scriptKindLabel, scriptLabel, scriptStatusLabel } from '$lib/data/selectors/scriptPresentation';
	import { decodeScriptId, encodeScriptId } from '$lib/utils/scriptId';
	import { withLocale } from '$lib/utils/paths';
	import { page } from '$app/state';
	import * as m from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import type { OutlineStep } from '$lib/types/outline';
	import StoryLanguageNotice from '$lib/components/controls/StoryLanguageNotice.svelte';

	const locale = getLocale();
	const registry = listLocalizedScripts(locale);
	const language = $derived(getLanguageState());
	const scriptId = $derived(decodeScriptId(page.params.scriptId ?? ''));
	const entry = $derived(registry.find((item) => item.id === scriptId));
	const outline = $derived(getLocalizedOutline(scriptId, language.dialogueLanguage));
	const steps = $derived(outline ? [...outline.steps].sort((a, b) => a.order - b.order) : []);
	const expectedPath = $derived(outlinePathForScript(scriptId));
	const scriptHref = $derived(withLocale(`/script/${encodeScriptId(scriptId)}`));
	const canonicalId = getProject().project.canonicalScriptId;

	const groups = $derived.by(() => {
		const order: string[] = [];
		const buckets: Record<string, OutlineStep[]> = {};
		for (const step of steps) {
			const key = step.sceneIds?.[0] ?? '';
			if (!(key in buckets)) {
				order.push(key);
				buckets[key] = [];
			}
			buckets[key].push(step);
		}
		return order.map((sceneId) => ({ sceneId, steps: buckets[sceneId] }));
	});

	function importanceLabel(value: string) {
		return value === 'required' ? m.outline_importance_required() : m.outline_importance_optional();
	}

	function statusLabel(value: string) {
		switch (value) {
			case 'covered':
				return m.outline_status_covered();
			case 'missing':
				return m.outline_status_missing();
			case 'deferred':
				return m.outline_status_deferred();
			default:
				return m.outline_status_planned();
		}
	}

	function isCriticalGap(step: OutlineStep) {
		return step.importance === 'required' && step.status === 'missing';
	}

	function groupHeading(sceneId: string) {
		return sceneId ? sceneId : m.outline_group_no_scene();
	}
</script>

<main class="page">
	{#if outline}
		<PageHeader
			eyebrow={m.outline_eyebrow()}
			title={outline.outline.title}
			lede={m.outline_lede()}
			meta={[
				`v${outline.outline.version}`,
				outline.outline.status,
				entry ? scriptKindLabel(entry.kind) : scriptId,
				`${steps.length} ${m.outline_steps()}`
			]}
		/>
		<StoryLanguageNotice />
		{#each groups as group (group.sceneId || '__none')}
			<section class="group">
				<h2 class="group-title">{groupHeading(group.sceneId)}</h2>
				<ol class="steps">
					{#each group.steps as step (step.id)}
						<li
							class="step"
							class:critical={isCriticalGap(step)}
							data-importance={step.importance}
							data-status={step.status}
						>
							<div class="step-head">
								<span class="order">{step.order}</span>
								<h3>{step.title}</h3>
							</div>
							<p class="summary">{step.summary}</p>
							<ul class="badges">
								<li>{importanceLabel(step.importance)}</li>
								<li>{statusLabel(step.status)}</li>
								{#if step.majorEventId}
									<li>{step.majorEventId}</li>
								{/if}
							</ul>
							{#if step.dependsOnStepIds?.length}
								<p class="refs">
									{m.outline_depends_on()}:
									{step.dependsOnStepIds.join(', ')}
								</p>
							{/if}
							{#if step.sceneIds?.length}
								<p class="refs">
									{m.outline_scenes()}:
									{#each step.sceneIds as sceneId, index (sceneId)}
										{index > 0 ? ', ' : ''}
										<a href={`${scriptHref}#${sceneId}`}>{sceneId}</a>
									{/each}
								</p>
							{/if}
						</li>
					{/each}
				</ol>
			</section>
		{/each}
		{#if steps.length === 0}
			<p class="empty-steps">{m.outline_empty_steps()}</p>
		{/if}
	{:else}
		<PageHeader
			eyebrow={m.outline_eyebrow()}
			title={entry ? scriptLabel(entry) : m.outline_missing_title()}
			lede={m.outline_missing_lede()}
			meta={entry
				? [scriptKindLabel(entry.kind), scriptStatusLabel(entry.status), scriptId]
				: [scriptId || canonicalId]}
		/>
		<div class="missing" role="status">
			<p>{m.outline_missing_body({ path: expectedPath })}</p>
			<p class="actions">
				<a href={scriptHref}>{m.outline_open_script()}</a>
			</p>
		</div>
	{/if}
</main>

<style>
	.page {
		max-width: var(--content-max);
		margin: 0 auto;
		padding: 2.5rem var(--page-gutter) 4rem;
	}

	.group {
		margin: 0 0 1.75rem;
	}

	.group-title {
		margin: 0 0 0.75rem;
		font: 700 0.78rem/1.2 var(--font-mono);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.steps {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.step {
		padding: 1rem 1.1rem;
		border: 1px solid var(--line);
		border-radius: 10px;
		background: var(--panel);
	}

	.step.critical {
		border-color: var(--gold);
		box-shadow: inset 3px 0 0 var(--gold);
	}

	.step-head {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		margin-bottom: 0.45rem;
	}

	.order {
		font: 700 0.8rem/1 var(--font-mono);
		color: var(--cyan);
		min-width: 1.5rem;
	}

	.step h3 {
		margin: 0;
		font: 650 1.1rem/1.25 var(--font-serif);
	}

	.summary {
		margin: 0 0 0.65rem;
		color: var(--muted);
		max-width: 44rem;
	}

	.badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.badges li {
		padding: 0.2rem 0.55rem;
		border: 1px solid var(--line);
		border-radius: 999px;
		font-size: 0.75rem;
		color: var(--gold);
	}

	.refs {
		margin: 0.65rem 0 0;
		font-size: 0.85rem;
		color: var(--muted);
	}

	.refs a {
		color: var(--cyan);
	}

	.empty-steps,
	.missing {
		margin-top: 1rem;
		padding: 1.1rem 1.2rem;
		border: 1px dashed var(--line);
		border-radius: 10px;
		background: var(--panel2);
		color: var(--muted);
		max-width: 40rem;
	}

	.missing p {
		margin: 0 0 0.75rem;
	}

	.actions {
		margin: 0;
	}

	.actions a {
		color: var(--cyan);
	}
</style>
