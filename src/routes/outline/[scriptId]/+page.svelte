<script lang="ts">
	import PageHeader from '$lib/components/app/PageHeader.svelte';
	import StoryLanguageNotice from '$lib/components/controls/StoryLanguageNotice.svelte';
	import {
		getLocalizedOutline,
		getProject,
		listLocalizedScripts,
		outlinePathForScript
	} from '$lib/data/repositories/index';
	import {
		scriptKindLabel,
		scriptLabel,
		scriptStatusLabel
	} from '$lib/data/selectors/scriptPresentation';
	import { storyText } from '$lib/data/selectors/localized';
	import { getLanguageState } from '$lib/state/language.svelte';
	import type { OutlineCoverageEvidence, OutlineStep } from '$lib/types/outline';
	import { decodeScriptId, encodeScriptId } from '$lib/utils/scriptId';
	import { withLocale } from '$lib/utils/paths';
	import { page } from '$app/state';
	import * as m from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime.js';

	const locale = getLocale();
	const language = $derived(getLanguageState());
	const registry = listLocalizedScripts(locale);
	const scriptId = $derived(decodeScriptId(page.params.scriptId ?? ''));
	const entry = $derived(registry.find((item) => item.id === scriptId));
	const outline = $derived(getLocalizedOutline(scriptId, language.dialogueLanguage));
	const storySteps = $derived(
		outline
			? outline.steps.filter((step) => step.level === 'story').sort((a, b) => a.order - b.order)
			: []
	);
	const detailSteps = $derived(
		outline
			? outline.steps.filter((step) => step.level === 'detail').sort((a, b) => a.order - b.order)
			: []
	);
	const byId = $derived(new Map(outline?.steps.map((step) => [step.id, step]) ?? []));
	const expectedPath = $derived(outlinePathForScript(scriptId));
	const scriptHref = $derived(withLocale(`/script/${encodeScriptId(scriptId)}`));
	const canonicalId = getProject().project.canonicalScriptId;

	function children(parentId: string) {
		return detailSteps.filter((step) => step.parentStepId === parentId);
	}
	function coverageLabel(value: string) {
		const labels: Record<string, () => string> = {
			not_started: m.outline_coverage_not_started,
			partial: m.outline_coverage_partial,
			covered: m.outline_coverage_covered,
			deferred: m.outline_coverage_deferred,
			not_applicable: m.outline_coverage_not_applicable
		};
		return (labels[value] ?? m.outline_coverage_not_started)();
	}
	function targetLabel(value: string) {
		return value === 'treatment'
			? m.outline_coverage_treatment()
			: value === 'script'
				? m.outline_coverage_script()
				: m.outline_coverage_animatic();
	}
	function evidenceIds(evidence: OutlineCoverageEvidence) {
		return [
			...(evidence.sceneIds ?? []),
			...(evidence.beatIds ?? []),
			...(evidence.cueIds ?? []),
			...(evidence.shotIds ?? [])
		];
	}
	function text(value: OutlineStep['summary']) {
		return storyText(value, language.dialogueLanguage);
	}
</script>

<main class="page">
	{#if outline}
		<PageHeader
			eyebrow={m.outline_eyebrow()}
			title={text(outline.outline.title)}
			lede={text(outline.outline.synopsis)}
			meta={[
				`v${outline.outline.version}`,
				entry ? scriptKindLabel(entry.kind) : scriptId,
				`${storySteps.length} ${m.outline_story_beats()}`,
				`${detailSteps.length} ${m.outline_detail_steps()}`
			]}
		/>
		<StoryLanguageNotice />
		<ol class="story-list">
			{#each storySteps as step (step.id)}
				{@const detail = children(step.id)}
				<li class="story-step" id={step.id}>
					<header>
						<span>{step.order}</span>
						<h2>{text(step.title)}</h2>
					</header>
					<p class="summary">{text(step.summary)}</p>
					{#if step.causalLinks?.length}
						<div class="causes">
							<strong>{m.outline_why()}</strong>
							{#each step.causalLinks as link}
								<p>
									<a href={`#${link.sourceStepId}`}
										>{text(byId.get(link.sourceStepId)?.title ?? link.sourceStepId)}</a
									>: {text(link.explanation)}
								</p>
							{/each}
						</div>
					{/if}
					{#if detail.length}
						<details class="details">
							<summary>{m.outline_details_show({ count: String(detail.length) })}</summary>
							<ol>
								{#each detail as item (item.id)}<li id={item.id}>
										<h3><span>{item.order}</span> {text(item.title)}</h3>
										<p>{text(item.summary)}</p>
										{#if item.coverage}<div class="coverage" aria-label={m.outline_coverage()}>
												{#each Object.entries(item.coverage) as [target, evidence]}<span
														data-status={evidence.status}
														>{targetLabel(target)}: {coverageLabel(evidence.status)}</span
													>{/each}
											</div>{/if}
										{#each Object.entries(item.coverage ?? {}) as [target, evidence]}{@const ids =
												evidenceIds(evidence)}{#if ids.length}<p class="refs">
													<strong>{targetLabel(target)} · {m.outline_evidence()}:</strong>
													{#each ids as id, index}{index ? ', ' : ''}{#if id.includes(':scene-')}<a
																href={`${scriptHref}#${id}`}>{id}</a
															>{:else}{id}{/if}{/each}
												</p>{/if}{/each}
									</li>{/each}
							</ol>
						</details>
					{/if}
				</li>
			{/each}
		</ol>
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
			<a href={scriptHref}>{m.outline_open_script()}</a>
		</div>
	{/if}
</main>

<style>
	.page {
		max-width: var(--content-max);
		margin: 0 auto;
		padding: 2.5rem var(--page-gutter) 4rem;
	}
	.story-list {
		list-style: none;
		margin: 1.5rem 0 0;
		padding: 0;
		display: grid;
		gap: 1.25rem;
	}
	.story-step {
		scroll-margin-top: 2rem;
		padding: 1.2rem 1.3rem;
		border: 1px solid var(--line);
		border-radius: 12px;
		background: var(--panel);
	}
	header {
		display: flex;
		gap: 0.8rem;
		align-items: baseline;
	}
	header span,
	h3 span {
		font: 700 0.8rem/1 var(--font-mono);
		color: var(--cyan);
	}
	h2 {
		margin: 0;
		font: 650 1.28rem/1.25 var(--font-serif);
	}
	.summary {
		max-width: 52rem;
		color: var(--text);
		font-size: 1.02rem;
	}
	.causes {
		margin: 0.9rem 0;
		padding: 0.75rem 0.9rem;
		border-left: 3px solid var(--gold);
		background: var(--panel2);
		color: var(--muted);
	}
	.causes p {
		margin: 0.35rem 0 0;
	}
	.causes a,
	.refs a,
	.missing a {
		color: var(--cyan);
	}
	details {
		margin-top: 1rem;
		border-top: 1px solid var(--line);
		padding-top: 0.8rem;
	}
	summary {
		cursor: pointer;
		color: var(--gold);
		font-weight: 650;
	}
	details ol {
		list-style: none;
		padding: 0;
		margin: 0.8rem 0 0;
		display: grid;
		gap: 0.7rem;
	}
	details li {
		padding: 0.85rem;
		border-radius: 8px;
		background: var(--panel2);
	}
	h3 {
		margin: 0;
		font-size: 0.98rem;
	}
	details p {
		margin: 0.4rem 0;
		color: var(--muted);
	}
	.coverage {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-top: 0.6rem;
	}
	.coverage span {
		font-size: 0.72rem;
		padding: 0.18rem 0.48rem;
		border: 1px solid var(--line);
		border-radius: 999px;
	}
	.coverage span[data-status='covered'] {
		color: var(--cyan);
	}
	.coverage span[data-status='partial'],
	.coverage span[data-status='deferred'] {
		color: var(--gold);
	}
	.refs {
		font: 0.75rem/1.45 var(--font-mono);
		overflow-wrap: anywhere;
	}
	.missing {
		margin-top: 1rem;
		padding: 1.1rem;
		border: 1px dashed var(--line);
		border-radius: 10px;
		background: var(--panel2);
	}
	@media (max-width: 640px) {
		.page {
			padding-top: 1.2rem;
		}
		.story-step {
			padding: 1rem;
		}
		.summary {
			font-size: 0.95rem;
		}
	}
</style>
